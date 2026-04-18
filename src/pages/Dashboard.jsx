import { useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSONFormat from "ol/format/GeoJSON";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";
import { fromLonLat, toLonLat } from "ol/proj";
import { Style, Stroke, Fill, Icon as OLIcon, Circle, Text } from "ol/style";
import "ol/ol.css";
import { API } from "../config/api";
import Switcher from "../components/layout/Switcher";

// ── 1. Yellow dot for selected point on AOI ────────────────────────────────────────────────────────
function isNearRoute(pointCoord, routeCoords, threshold = 10) {
  let minDistance = Infinity;

  for (let i = 0; i < routeCoords.length; i++) {
    const coord = routeCoords[i];

    const dx = coord[0] - pointCoord[0];
    const dy = coord[1] - pointCoord[1];
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance < threshold;
}

function Dashboard({ setActiveSwitcher }) {
  const [mapMessage, setMapMessage] = useState("");
  const [roads, setRoads] = useState(null);
  const [ghats, setGhats] = useState(null);
  const [river, setRiver] = useState(null);
  const [aoi, setAoi] = useState(null);
  const [intersections, setIntersections] = useState(null);

  const [waypoints, setWaypoints] = useState([]);
  const [route, setRoute] = useState(null);
  const [blockedPoints, setBlockedPoints] = useState([]);
  const [blockedMarkers, setBlockedMarkers] = useState([]);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);

  const [mode, setMode] = useState("waypoint");
  const [loading, setLoading] = useState(false);

  const mapDivRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const aoiLayerRef = useRef(null);
  const roadsLayerRef = useRef(null);
  const ghatsLayerRef = useRef(null);
  const riverLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const waypointsLayerRef = useRef(null);
  const intersectionsLayerRef = useRef(null);
  const blockedMarkersLayerRef = useRef(null);
  const personLayerRef = useRef(null);

  const modeRef = useRef(mode);
  const blockedPointsRef = useRef(blockedPoints);
  const waypointsRef = useRef(waypoints);
  const animationRef = useRef(null);
  const [totalDistance, setTotalDistance] = useState(0);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    blockedPointsRef.current = blockedPoints;
  }, [blockedPoints]);
  useEffect(() => {
    waypointsRef.current = waypoints;
  }, [waypoints]);

  const removeLayer = (layerRef) => {
    if (layerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(layerRef.current);
      layerRef.current = null;
    }
  };

  const makeGeoJSONLayer = (geojson, style, styleFn = null) => {
    const features = new GeoJSONFormat().readFeatures(geojson, {
      featureProjection: "EPSG:3857",
    });
    return new VectorLayer({
      source: new VectorSource({ features }),
      style: styleFn || style,
    });
  };

  // ── Calculate total distance of path ────────────────────────────────────────────────────────
  const calculateTotalDistance = (coords) => {
    if (!coords || coords.length < 2) return 0;

    let total = 0;

    for (let i = 0; i < coords.length - 1; i++) {
      const dx = coords[i + 1][0] - coords[i][0];
      const dy = coords[i + 1][1] - coords[i][1];
      total += Math.sqrt(dx * dx + dy * dy);
    }

    return total;
  };

  // ── 1. Initialize map ────────────────────────────────────────────────────────
  useEffect(() => {
    const map = new Map({
      target: mapDivRef.current,
      layers: [new TileLayer({ source: new OSM() })],
      view: new View({
        center: fromLonLat([75.768, 23.182]),
        zoom: 14,
      }),
    });

    mapInstanceRef.current = map;

    map.on("click", (e) => {
      const currentMode = modeRef.current;
      if (currentMode === "none") return;

      const [lng, lat] = toLonLat(e.coordinate);

      if (currentMode === "block") {
        // ── Add blocked point ──
        const newPoint = { lat, lng };
        setBlockedPoints((prev) => [...prev, newPoint]);

        // Add visual red marker on the map
        const feature = new Feature({
          geometry: new Point(fromLonLat([lng, lat])),
        });
        feature.setStyle(
          new Style({
            image: new Circle({
              radius: 8,
              fill: new Fill({ color: "#2C2C2C" }),
              stroke: new Stroke({ color: "white", width: 2 }),
            }),
          }),
        );
        setBlockedMarkers((prev) => [...prev, feature]);
        setMapMessage(`Blocked point added`);
        setTimeout(() => setMapMessage(""), 2000);
        return;
      }

      if (currentMode === "waypoint") {
        // ── Add waypoint ──
        const newWaypoint = { lat, lng };
        setWaypoints((prev) => [...prev, newWaypoint]);
        setMapMessage(`Waypoint added`);
        setTimeout(() => setMapMessage(""), 2000);
      }
    });

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      map.setTarget(null);
    };
  }, []);

  // ── 2. Render blocked point markers on map ───────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    removeLayer(blockedMarkersLayerRef);

    if (blockedMarkers.length > 0) {
      const layer = new VectorLayer({
        source: new VectorSource({ features: blockedMarkers }),
        zIndex: 100,
      });
      map.addLayer(layer);
      blockedMarkersLayerRef.current = layer;
    }
  }, [blockedMarkers]);

  // ── 3. Render waypoints layer ────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    removeLayer(waypointsLayerRef);

    if (waypoints.length > 0) {
      const features = waypoints.map((wp, idx) => {
        const feature = new Feature({
          geometry: new Point(fromLonLat([wp.lng, wp.lat])),
        });

        let color = "#3b82f6"; // Middle waypoints = blue
        if (idx === 0) color = "#22c55e"; // First = green
        if (idx === waypoints.length - 1) color = "#ef4444"; // Last = red

        feature.setStyle(
          new Style({
            image: new Circle({
              radius: 10,
              fill: new Fill({ color }),
              stroke: new Stroke({ color: "white", width: 2 }),
            }),
            text: new Text({
              text: String(idx + 1),
              fill: new Fill({ color: "black" }), // Color of Numbers over map
              font: "bold 12px Arial",
              offsetY: -12,
            }),
          }),
        );

        return feature;
      });

      const layer = new VectorLayer({
        source: new VectorSource({ features }),
        zIndex: 150,
      });
      map.addLayer(layer);
      waypointsLayerRef.current = layer;
    }
  }, [waypoints]);

  // ── 4. Intersections layer ───────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !intersections) return;

    removeLayer(intersectionsLayerRef);

    const features = new GeoJSONFormat().readFeatures(intersections, {
      featureProjection: "EPSG:3857",
    });

    const layer = new VectorLayer({
      source: new VectorSource({ features }),
      style: new Style({
        image: new Circle({
          radius: 5,
          fill: new Fill({ color: "#00FF88" }),
          stroke: new Stroke({ color: "#fff", width: 1 }),
        }),
      }),
      zIndex: 50,
    });

    map.addLayer(layer);
    intersectionsLayerRef.current = layer;
  }, [intersections]);

  // ── 5. Cursor style for Waypoints and Block ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.getViewport().style.cursor =
        mode === "block" ? "crosshair" : mode === "waypoint" ? "pointer" : "";
    }
  }, [mode]);

  // ── 6. Load AOI + Roads + Intersections ─────────────────────────────────────
  useEffect(() => {
    fetch(API.routingAOI)
      .then((res) => res.json())
      .then((data) => setAoi(data))
      .catch((err) => console.error("AOI Error:", err));

    fetch(API.roads)
      .then((res) => res.json())
      .then((data) => setRoads(data))
      .catch((err) => console.error("Road Error:", err));

    fetch(API.intersections)
      .then((res) => res.json())
      .then((data) => setIntersections(data))
      .catch((err) => console.error("Intersections Error:", err));
  }, []);

  // ── 7. AOI layer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    removeLayer(aoiLayerRef);
    if (aoi) {
      const layer = makeGeoJSONLayer(
        aoi,
        new Style({
          stroke: new Stroke({ color: "black", width: 2 }),
          fill: new Fill({ color: "rgba(0,0,0,0.05)" }),
        }),
      );
      map.addLayer(layer);
      aoiLayerRef.current = layer;
      const extent = layer.getSource().getExtent();
      map.getView().fit(extent, { padding: [20, 20, 20, 20], maxZoom: 16 });
    }
  }, [aoi]);

  // ── 8. Roads layer ───────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    removeLayer(roadsLayerRef);
    if (roads) {
      const layer = makeGeoJSONLayer(
        roads,
        new Style({
          stroke: new Stroke({ color: "#e74c3c", width: 2 }),
        }),
      );
      map.addLayer(layer);
      roadsLayerRef.current = layer;
    }
  }, [roads]);

  // ── 9. Ghats layer ───────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    removeLayer(ghatsLayerRef);
    if (ghats) {
      const layer = makeGeoJSONLayer(
        ghats,
        new Style({
          stroke: new Stroke({ color: "#27ae60", width: 3 }),
        }),
      );
      map.addLayer(layer);
      ghatsLayerRef.current = layer;
    }
  }, [ghats]);

  // ── 10. River layer ──────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    removeLayer(riverLayerRef);
    if (river) {
      const layer = makeGeoJSONLayer(
        river,
        new Style({
          stroke: new Stroke({ color: "#2980b9", width: 3 }),
        }),
      );
      map.addLayer(layer);
      riverLayerRef.current = layer;
    }
  }, [river]);

  // ── 11. Route layer with magenta fill ────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    removeLayer(routeLayerRef);
    if (!route) return;

    const features = [];

    // Check if route has segments
    if (route.segments && route.segments.length > 0) {
      route.segments.forEach((segment, idx) => {
        if (!segment.coordinates || segment.coordinates.length === 0) return;

        const coords = segment.coordinates.map((coord) =>
          fromLonLat(Array.isArray(coord) ? coord : [coord.lng, coord.lat]),
        );

        const feature = new Feature({
          geometry: new LineString(coords),
        });

        feature.setStyle(
          new Style({
            stroke: new Stroke({
              color: "#900bf5",
              width: 6,
              lineCap: "round",
              lineJoin: "round",
            }),
          }),
        );

        features.push(feature);

        // Add arrows along the segment
        addArrowsToSegment(coords, features);
      });
    }

    // Also check if route has direct coordinates
    if (
      route.route &&
      route.route.coordinates &&
      route.route.coordinates.length > 0
    ) {
      const coords = route.route.coordinates.map((coord) =>
        fromLonLat(Array.isArray(coord) ? coord : [coord.lng, coord.lat]),
      );

      const feature = new Feature({
        geometry: new LineString(coords),
      });

      feature.setStyle(
        new Style({
          stroke: new Stroke({
            color: "#900bf5",
            width: 6,
            lineCap: "round",
            lineJoin: "round",
          }),
        }),
      );

      features.push(feature);

      // Add arrows along the route
      addArrowsToSegment(coords, features);
    }

    if (features.length > 0) {
      const layer = new VectorLayer({
        source: new VectorSource({ features }),
        zIndex: 80,
      });
      map.addLayer(layer);
      routeLayerRef.current = layer;
    }
  }, [route]);

  const addArrowsToSegment = (coords, features) => {
    if (!coords || coords.length < 2) return;

    const arrowSpacing = 300; // adjust spacing here

    // First, calculate all segment distances
    const segmentDistances = [];
    for (let i = 0; i < coords.length - 1; i++) {
      const dx = coords[i + 1][0] - coords[i][0];
      const dy = coords[i + 1][1] - coords[i][1];
      segmentDistances.push(Math.sqrt(dx * dx + dy * dy));
    }

    const totalDistance = segmentDistances.reduce((a, b) => a + b, 0);

    // Place arrows at regular intervals
    let arrowProgress = arrowSpacing / 2; // Start first arrow at half spacing

    while (arrowProgress < totalDistance) {
      // Find which segment this arrow should be on
      let remaining = arrowProgress;
      let segmentIndex = 0;

      while (
        remaining > segmentDistances[segmentIndex] &&
        segmentIndex < segmentDistances.length - 1
      ) {
        remaining -= segmentDistances[segmentIndex];
        segmentIndex++;
      }

      // Get the two points of the current segment
      const c1 = coords[segmentIndex];
      const c2 = coords[segmentIndex + 1];

      // Calculate position along this segment
      const ratio = remaining / segmentDistances[segmentIndex];

      const arrowX = c1[0] + (c2[0] - c1[0]) * ratio;
      const arrowY = c1[1] + (c2[1] - c1[1]) * ratio;

      // Calculate direction from the segment
      const dx = c2[0] - c1[0];
      const dy = c2[1] - c1[1];

      createArrow([arrowX, arrowY], dx, dy, features);

      arrowProgress += arrowSpacing;
    }
  };

  const createArrow = (coord, dx, dy, features) => {
    const angle = Math.atan2(dy, dx);

    const arrowFeature = new Feature({
      geometry: new Point(coord),
    });

    const arrowSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
      <polygon points="12,3 21,18 12,14 3,18"
        fill="#5947b5"
        stroke="white"
        stroke-width="0.5"/>
    </svg>
  `;

    const arrowIconUrl = "data:image/svg+xml;base64," + btoa(arrowSvg);

    arrowFeature.setStyle(
      new Style({
        image: new OLIcon({
          src: arrowIconUrl,
          scale: 1,
          rotation: -angle + Math.PI / 2,
          rotateWithView: true,
          anchor: [0.5, 0.5],
        }),
        zIndex: 90,
      }),
    );

    features.push(arrowFeature);
  };

  const stopWalkingAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (personLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(personLayerRef.current);
      personLayerRef.current = null;
    }
  };

  const startWalkingAnimation = (routeCoords) => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    stopWalkingAnimation();

    if (!routeCoords || routeCoords.length < 2) return;

    const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 44 44">
    <defs>
      <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff7a18"/>
        <stop offset="100%" stop-color="#ff3d3d"/>
      </linearGradient>

      <linearGradient id="legGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00c6ff"/>
        <stop offset="100%" stop-color="#0072ff"/>
      </linearGradient>

      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.4"/>
      </filter>
    </defs>

    <circle cx="22" cy="8" r="6" fill="#ffd166" stroke="white" stroke-width="2" filter="url(#shadow)"/>
    <circle cx="20" cy="7" r="1.2" fill="black"/>
    <circle cx="24" cy="7" r="1.2" fill="black"/>
    <path d="M20 10 Q22 12 24 10" stroke="black" stroke-width="1.2" fill="none"/>
    <polygon points="22,1 19,5 25,5" fill="#ff3d3d"/>

    <line x1="22" y1="14" x2="22" y2="27"
          stroke="url(#bodyGrad)"
          stroke-width="4"
          stroke-linecap="round"
          filter="url(#shadow)"/>

    <line x1="22" y1="18" x2="12" y2="24"
          stroke="#06d6a0"
          stroke-width="3"
          stroke-linecap="round"/>

    <line x1="22" y1="18" x2="32" y2="24"
          stroke="#118ab2"
          stroke-width="3"
          stroke-linecap="round"/>

    <line x1="22" y1="27" x2="14" y2="38"
          stroke="url(#legGrad)"
          stroke-width="3"
          stroke-linecap="round"/>

    <line x1="22" y1="27" x2="30" y2="38"
          stroke="url(#legGrad)"
          stroke-width="3"
          stroke-linecap="round"/>
  </svg>
  `;

    const iconUrl = "data:image/svg+xml;base64," + btoa(svg);

    const OFFSET_GAP = 150;
    const speed = 3;

    // 🔹 Calculate segment distances
    const segmentDistances = [];
    for (let i = 0; i < routeCoords.length - 1; i++) {
      const dx = routeCoords[i + 1][0] - routeCoords[i][0];
      const dy = routeCoords[i + 1][1] - routeCoords[i][1];
      segmentDistances.push(Math.sqrt(dx * dx + dy * dy));
    }

    const totalDistance = segmentDistances.reduce((a, b) => a + b, 0);
    if (totalDistance === 0) return;

    // 🔹 Dynamic number of persons
    const NUM_PERSONS = Math.ceil(totalDistance / OFFSET_GAP);

    const persons = Array.from({ length: NUM_PERSONS }, (_, i) => {
      const feature = new Feature({
        geometry: new Point(routeCoords[0]),
      });

      feature.setStyle(
        new Style({
          image: new OLIcon({
            src: iconUrl,
            scale: 1,
            anchor: [0.5, 1],
          }),
        }),
      );

      return {
        feature,
        progress: -i * OFFSET_GAP, // ✅ start before route (fix)
      };
    });

    const layer = new VectorLayer({
      source: new VectorSource({
        features: persons.map((p) => p.feature),
      }),
      zIndex: 200,
    });

    mapInstanceRef.current.addLayer(layer);
    personLayerRef.current = layer;

    const animate = () => {
      persons.forEach((person) => {
        person.progress += speed;

        // 🔹 Not yet entered route
        if (person.progress < 0) {
          person.feature.getGeometry().setCoordinates([-999999, -999999]);
          return;
        }

        // 🔁 Infinite loop after reaching end
        if (person.progress >= totalDistance) {
          person.progress = 0;
        }

        let remaining = person.progress;
        let segmentIndex = 0;

        while (
          remaining > segmentDistances[segmentIndex] &&
          segmentIndex < segmentDistances.length - 1
        ) {
          remaining -= segmentDistances[segmentIndex];
          segmentIndex++;
        }

        const c1 = routeCoords[segmentIndex];
        const c2 = routeCoords[segmentIndex + 1];

        const ratio = remaining / segmentDistances[segmentIndex];

        const x = c1[0] + (c2[0] - c1[0]) * ratio;
        const y = c1[1] + (c2[1] - c1[1]) * ratio;

        person.feature.getGeometry().setCoordinates([x, y]);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const fetchRoute = async () => {
    if (waypoints.length < 2) {
      setMapMessage("Add at least 2 waypoints");
      setTimeout(() => setMapMessage(""), 3000);
      return;
    }
  
    setLoading(true);
    stopWalkingAnimation();
  
    try {
      const res = await fetch(API.shortestPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          waypoints: waypoints,
          blocked_points: blockedPoints, // ✅ keep this BEFORE clearing
        }),
      });
  
      const data = await res.json();
  
      if (
        !data ||
        !data.segments ||
        data.segments.length === 0 ||
        data.status !== "success"
      ) {
        setRoute(null);
        setMapMessage("No path found");
        setTimeout(() => setMapMessage(""), 3000);
        setLoading(false);
        return;
      }
  
      console.log("ROUTE API RESPONSE:", data);
      setMapMessage("Route found!");
      setTimeout(() => setMapMessage(""), 2000);
      setRoute(data);
  
      // ✅ DRAW ROUTE
      if (data.route && data.route.coordinates) {
        const routeCoords = data.route.coordinates.map((coord) =>
          fromLonLat(Array.isArray(coord) ? coord : [coord.lng, coord.lat])
        );
  
        const distance = calculateTotalDistance(routeCoords);
        setTotalDistance((distance / 1000).toFixed(2));
  
        stopWalkingAnimation();
        startWalkingAnimation(routeCoords);
      }
  
      // ✅ UPDATE INTERSECTIONS STYLE
      if (
        intersectionsLayerRef.current &&
        data.route &&
        data.route.coordinates
      ) {
        const routeCoords = data.route.coordinates.map((coord) =>
          fromLonLat(Array.isArray(coord) ? coord : [coord.lng, coord.lat])
        );
  
        intersectionsLayerRef.current
          .getSource()
          .getFeatures()
          .forEach((feature) => {
            const coord = feature.getGeometry().getCoordinates();
            const onRoute = isNearRoute(coord, routeCoords);
  
            feature.setStyle(
              new Style({
                image: new Circle({
                  radius: onRoute ? 7 : 4,
                  fill: new Fill({ color: onRoute ? "#FFD700" : "#555555" }),
                  stroke: new Stroke({
                    color: onRoute ? "#fff" : "#333",
                    width: 1,
                  }),
                }),
              })
            );
          });
      }
  
      if (blockedMarkersLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(blockedMarkersLayerRef.current);
        blockedMarkersLayerRef.current = null;
      }
  
      setBlockedMarkers([]);
      setBlockedPoints([]);
  
    } catch (error) {
      console.error("Route fetch error:", error);
      setMapMessage("Error fetching route");
      setTimeout(() => setMapMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  // ── TOGGLES ──────────────────────────────────────────────────────────────────
  const toggleRoads = () => {
    if (roads) {
      setRoads(null);
    } else {
      fetch(API.roads)
        .then((r) => r.json())
        .then(setRoads);
    }
  };
  const toggleGhats = () => {
    if (ghats) {
      setGhats(null);
    } else {
      fetch(API.ghats)
        .then((r) => r.json())
        .then(setGhats);
    }
  };
  const toggleRiver = () => {
    if (river) {
      setRiver(null);
    } else {
      fetch(API.river)
        .then((r) => r.json())
        .then(setRiver);
    }
  };

  // ── RESET ────────────────────────────────────────────────────────────────────
  const resetAll = () => {
    stopWalkingAnimation();

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setWaypoints([]);
    setRoute(null);
    setBlockedPoints([]);
    setBlockedMarkers([]);
    setMode("waypoint");
    setMapMessage("All reset!");
    setTimeout(() => setMapMessage(""), 2000);

    if (intersectionsLayerRef.current) {
      intersectionsLayerRef.current
        .getSource()
        .getFeatures()
        .forEach((feature) => {
          feature.setStyle(
            new Style({
              image: new Circle({
                radius: 5,
                fill: new Fill({ color: "#00FF88" }),
                stroke: new Stroke({ color: "#fff", width: 1 }),
              }),
            }),
          );
        });
    }
  };

  const modeBadgeColor = {
    waypoint: "#f59e0b",
    block: "#ef4444",
    none: "#22c55e",
  };

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen font-sans">
      {/* Sidebar */}
      <div className="w-72  overflow-y-auto shadow-[4px_0_16px_rgba(0,0,0,0.5)] bg-gradient-to-b from-[#0f2a44] to-[#0a1e33] text-white">
        {/* Panel Header */}
        <Switcher
          activeSwitcher="routing"
          setActiveSwitcher={setActiveSwitcher}
        />
        <div className="bg-gradient-to-br from-[#0a1e33] to-[#1e3a52] p-5 text-center border-b-2 border-blue-500 flex-shrink-0">
          <div className="text-lg font-bold tracking-wide mb-2">
            Routing Panel
          </div>
          <div
            className={`inline-block text-white px-3 py-1.5 rounded-full text-xs font-bold tracking-wide`}
            style={{
              background: modeBadgeColor[mode],
              boxShadow: `0 0 15px ${modeBadgeColor[mode]}44`,
            }}
          >
            MODE: {mode.toUpperCase()}
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 border-b border-[#1e4060] flex-shrink-0">
          <div className="bg-[#1e3a52] rounded-xl p-3.5 text-sm text-slate-300 grid grid-cols-2 gap-3">
            {/* Waypoints */}
            <div className="bg-[rgba(34,197,85,0.1)] border-l-4 border-green-500 rounded-md p-1.5">
              <span className="text-green-500 mr-1"></span>
              <b>Waypoints:</b> {waypoints.length}
            </div>
            {/* Blocked */}
            <div className="bg-[rgba(239,68,68,0.1)] border-l-4 border-red-500 rounded-md p-1.5">
              <span className="text-red-500 mr-1"></span>
              <b>Blocked:</b> {blockedPoints.length}
            </div>
            {/* Total Distance */}
            <div className="col-span-2 bg-[rgba(99,102,241,0.1)] border-l-4 border-indigo-500 rounded-md p-2 text-center text-base font-semibold">
              <span className="text-indigo-500 mr-1.5"></span>
              Total Distance: {totalDistance ? `${totalDistance} km` : "0 km"}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-[#1e4060] flex-shrink-0">
          <div className="text-[11px] text-slate-400 mb-3 uppercase tracking-widest font-semibold">
            Routing Controls
          </div>

          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <button
              className={`py-2.5 px-2.5 rounded-xl font-semibold text-white text-sm border-2 transition-all duration-300 shadow ${
                mode === "waypoint"
                  ? "bg-amber-500 border-amber-500 font-bold shadow-[0_0_12px_#f59e0b99] -translate-y-0.5"
                  : "bg-[#1e3a52] border-transparent"
              }`}
              onClick={() => setMode("waypoint")}
            >
              Waypoint
            </button>
            <button
              className={`py-2.5 px-2.5 rounded-xl font-semibold text-white text-sm border-2 transition-all duration-300 shadow ${
                mode === "block"
                  ? "bg-red-500 border-red-500 font-bold shadow-[0_0_12px_#ef444499] -translate-y-0.5"
                  : "bg-[#1e3a52] border-transparent"
              }`}
              onClick={() => setMode("block")}
            >
              Block Road
            </button>
          </div>

          <button
            className={`py-2.5 px-2.5 rounded-xl bg-indigo-500 w-full mb-2.5 text-white font-semibold text-sm border-2 border-indigo-500 transition-all duration-300 shadow ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
            onClick={fetchRoute}
            disabled={loading}
          >
            {loading ? "Finding Route..." : "Find Route"}
          </button>

          <button
            className="py-2.5 px-2.5 rounded-xl bg-violet-500 w-full mb-2.5 text-white font-semibold text-sm border-2 border-violet-500 transition-all duration-300 shadow"
            onClick={() => {
              if (waypoints.length > 0) {
                setWaypoints(waypoints.slice(0, -1));
                setRoute(null);
                stopWalkingAnimation();
                setMapMessage("Last waypoint removed");
                setTimeout(() => setMapMessage(""), 2000);
              }
            }}
          >
            Remove Last Waypoint
          </button>

          <button
            className="py-2.5 px-2.5 rounded-xl bg-pink-500 w-full mb-2.5 text-white font-semibold text-sm border-2 border-pink-500 transition-all duration-300 shadow"
            onClick={() => {
              if (blockedPoints.length > 0) {
                setBlockedPoints(blockedPoints.slice(0, -1));
                setBlockedMarkers(blockedMarkers.slice(0, -1));
                setRoute(null);
                stopWalkingAnimation();
                setMapMessage("Last blocked point removed");
                setTimeout(() => setMapMessage(""), 2000);
              }
            }}
          >
            Remove Last Block
          </button>

          <button
            className="py-2.5 px-2.5 rounded-xl bg-red-400 w-full text-white font-semibold text-sm border-2 border-red-400 transition-all duration-300 shadow"
            style={{ fontSize: 13, fontWeight: 600 }}
            onClick={resetAll}
          >
            Reset All
          </button>
        </div>

        {/* Map Layers */}
        <div className="p-4 border-b border-[#1e4060] flex-shrink-0">
          <div className="text-[11px] text-slate-400 mb-3 uppercase tracking-widest font-semibold">
            Map Layers
          </div>
          <div className="flex flex-col gap-2">
            <button
              className={`
                flex justify-between items-center px-3.5 py-2.5 rounded-xl w-full
                text-white text-sm border-2 transition-all duration-300
                ${!!roads ? "bg-[#1e3a52] border-blue-500 shadow-[0_0_8px_#3b82f644]" : "bg-[#162a3d] border-[#1e4060]"}
              `}
              onClick={toggleRoads}
            >
              <span> Roads</span>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full transition-all duration-300 
                ${!!roads ? "bg-green-500" : "bg-slate-600"}
              `}
              >
                {roads ? "ON" : "OFF"}
              </span>
            </button>
            <button
              className={`
                flex justify-between items-center px-3.5 py-2.5 rounded-xl w-full
                text-white text-sm border-2 transition-all duration-300
                ${!!ghats ? "bg-[#1e3a52] border-blue-500 shadow-[0_0_8px_#3b82f644]" : "bg-[#162a3d] border-[#1e4060]"}
              `}
              onClick={toggleGhats}
            >
              <span> Ghats</span>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full transition-all duration-300 
                ${!!ghats ? "bg-green-500" : "bg-slate-600"}
              `}
              >
                {ghats ? "ON" : "OFF"}
              </span>
            </button>
            <button
              className={`
                flex justify-between items-center px-3.5 py-2.5 rounded-xl w-full
                text-white text-sm border-2 transition-all duration-300
                ${!!river ? "bg-[#1e3a52] border-blue-500 shadow-[0_0_8px_#3b82f644]" : "bg-[#162a3d] border-[#1e4060]"}
              `}
              onClick={toggleRiver}
            >
              <span> River</span>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full transition-all duration-300 
                ${!!river ? "bg-green-500" : "bg-slate-600"}
              `}
              >
                {river ? "ON" : "OFF"}
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto py-3.5 px-4 border-t border-[#1e4060] text-[11px] text-slate-600 text-center flex-shrink-0 bg-black bg-opacity-30">
          <div className="font-semibold mb-1">Ujjain Maha Kumbh</div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <div ref={mapDivRef} className="h-full w-full" />
        {mapMessage && (
          <div
            className={`
              absolute left-1/2 top-5
              -translate-x-1/2
              text-white px-6 py-3 rounded-xl font-semibold z-[9999] pointer-events-none text-base shadow-[0_4px_12px_rgba(0,0,0,0.3)]
              ${mapMessage.includes("❌") ? "bg-red-500" : "bg-green-500"}
            `}
          >
            {mapMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
