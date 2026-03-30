import { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat, toLonLat, transform } from "ol/proj";
import MapLegend from "../Maplegend";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import Icon from "ol/style/Icon";
import { API } from "../../config/api";
import { defaults as defaultControls } from "ol/control";
import Circle from "ol/geom/Circle";
import { Stroke, Fill, Style } from "ol/style";
import * as turf from "@turf/turf";
import { useMapContext } from "../../context/MapContext";

export default function OpenLayerMap({
  buffer,
  selectedTypes = [],
  updateAnalysis,
  setSelectedFeature,
  analysisLayers,
  setBufferResults,
}) {
  const { mapRef, mapObj, suitableLandRef, analysingSitePriority } =
    useMapContext();

  const selectedRef = useRef([]);
  const vectorSourceRef = useRef(null);
  const vectorLayerRef = useRef(null);
  const layerRef = useRef({});
  const demandLayerRef = useRef(null);
  const supplyLayerRef = useRef(null);
  const aoiLayerRef = useRef(null);
  const bufferLayerRef = useRef(null);
  const [loadingLayer, setLoadingLayer] = useState(false);
  const bufferRef = useRef(buffer);
  const [showLegend, setShowLegend] = useState(false);
  const gapLayerRef = useRef(null);

  // -----------------------------
  // ICON STYLE
  // -----------------------------
  const getStyle = (feature, type) => {
    const geometryType = feature.getGeometry().getType();

    if (geometryType === "Point") {
      return new Style({
        image: new Icon({
          src: getIcon(type),
          scale: 0.05,
        }),
      });
    }

    if (geometryType === "LineString" || geometryType === "MultiLineString") {
      return new Style({
        stroke: new Stroke({
          color: "#ff6600",
          width: 3,
        }),
      });
    }

    if (geometryType === "Polygon" || geometryType === "MultiPolygon") {
      return new Style({
        stroke: new Stroke({
          color: "#0066ff",
          width: 2,
        }),
        fill: new Fill({
          color: "rgba(0, 102, 255, 0.2)",
        }),
      });
    }
  };

  // -----------------------------
  // DEMAND STYLE
  // -----------------------------
  const demandLayerStyle = (feature) => {
    const demandClass = feature.get("Class");
    let color = "rgba(200,200,200,0.4)";

    if (demandClass === "Very High")
      color = "#004562"; //"rgba(107, 4, 4, 0.6)";
    else if (demandClass === "High")
      color = "#007DB3"; //"rgba(255,0,0,0.6)";
    else if (demandClass === "Moderate")
      color = "#009DE1"; //"rgba(255,165,0,0.6)";
    else if (demandClass === "Low")
      color = "#57CDFF"; //"rgba(255,255,0,0.6)";
    else if (demandClass === "Very Low") color = "#85DAFF"; //"rgba(0,255,0,0.6)";

    return new Style({
      fill: new Fill({ color }),
    });
  };

  // -----------------------------
  // SUPPLY STYLE
  // -----------------------------
  const supplyLayerStyle = (feature) => {
    const gap = feature.get("Gap_Class");
    let color = "rgba(200,200,200,0.4)";

    if (gap === "Adequate")
      color = "#A3FA9B"; //"rgba(0,180,0,0.45)";
    else if (gap === "Oversupply")
      color = "#17FD02"; //"rgba(0,120,255,0.45)";
    else if (gap === "Low")
      color = "#12D600"; //"rgba(255,255,0,0.45)";
    else if (gap === "Moderate")
      color = "#10B101"; //"rgba(255,165,0,0.45)";
    else if (gap === "Critical") color = "#0D8202"; //"rgba(255,0,0,0.55)";

    return new Style({
      fill: new Fill({ color }),
    });
  };

  // -----------------------------
  // FETCH DEMAND
  // -----------------------------
  const fetchDemandLayer = async () => {
    if (demandLayerRef.current.getSource().getFeatures().length > 0) return;

    setLoadingLayer(true);

    const res = await fetch(API.demand);
    const json = await res.json();

    const features = new GeoJSON().readFeatures(json.data, {
      dataProjection: "EPSG:32643",
      featureProjection: "EPSG:3857",
    });

    demandLayerRef.current.getSource().addFeatures(features);

    setLoadingLayer(false);
  };

  // -----------------------------
  // FETCH SUPPLY
  // -----------------------------
  const fetchSupplyLayer = async () => {
    if (supplyLayerRef.current.getSource().getFeatures().length > 0) return;

    setLoadingLayer(true);

    const res = await fetch(API.supply);
    const json = await res.json();

    const features = new GeoJSON().readFeatures(json.data, {
      dataProjection: "EPSG:32643",
      featureProjection: "EPSG:3857",
    });

    supplyLayerRef.current.getSource().addFeatures(features);

    setLoadingLayer(false);
  };
  // -----------------------------
  // FETCH Gap
  // -----------------------------
  const fetchGapLayer = async () => {
    if (gapLayerRef.current.getSource().getFeatures().length > 0) return;

    setLoadingLayer(true);

    const res = await fetch(API.gap);
    const json = await res.json();

    const features = new GeoJSON().readFeatures(json.data, {
      dataProjection: "EPSG:32643",
      featureProjection: "EPSG:3857",
    });

    gapLayerRef.current.getSource().addFeatures(features);

    setLoadingLayer(false);
  };

  const gapLayerStyle = (feature) => {
    const gap = feature.get("Gap_Class");

    let color = "rgba(200,200,200,0.4)";

    if (gap === "Critical") color = "rgba(255,0,0,0.6)";
    else if (gap === "Moderate") color = "rgba(255,165,0,0.6)";
    else if (gap === "Low") color = "rgba(255,255,0,0.6)";
    else if (gap === "Adequate") color = "rgba(0,255,0,0.6)";
    else if (gap === "Oversupply") color = "rgba(0,120,255,0.6)";

    return new Style({
      fill: new Fill({ color }),
    });
  };

  // -----------------------------
  // FETCH AOI
  // -----------------------------
  const aoiStyle = new Style({
    stroke: new Stroke({
      color: "#000000",
      width: 2,
    }),
    fill: new Fill({
      color: "rgba(0,0,0,0.05)", // light transparent
    }),
  });

  useEffect(() => {
    selectedRef.current = selectedTypes;
  }, [selectedTypes]);

  // -----------------------------
  // INIT MAP
  // -----------------------------
  useEffect(() => {
    //  Base vector layer (your existing)
    vectorSourceRef.current = new VectorSource();

    vectorLayerRef.current = new VectorLayer({
      source: vectorSourceRef.current,
    });

    //  CREATE MAP
    mapObj.current = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayerRef.current,
      ],
      view: new View({
        center: fromLonLat([75.7683, 23.1824]),
        zoom: 15,
      }),
      controls: defaultControls({
        zoom: true,
        rotate: false,
        attribution: false,
      }),
    });

    //  ADD DEMAND + SUPPLY LAYERS HERE (IMPORTANT)

    demandLayerRef.current = new VectorLayer({
      source: new VectorSource(),
      style: demandLayerStyle,
      visible: false,
    });

    supplyLayerRef.current = new VectorLayer({
      source: new VectorSource(),
      style: supplyLayerStyle,
      visible: false,
    });
    //  AOI Layer
    aoiLayerRef.current = new VectorLayer({
      source: new VectorSource(),
      style: aoiStyle,
    });

    gapLayerRef.current = new VectorLayer({
      source: new VectorSource(),
      style: gapLayerStyle,
      visible: false,
    });

    const bufferLayer = new VectorLayer({
      source: new VectorSource(),
      zIndex: 9999, // Set a very high zIndex to ensure this layer is on top
    });

    suitableLandRef.current = new VectorLayer({
      source: new VectorSource(),
      style: suitableLandLayerStyle,
      visible: false,
    });

    mapObj.current.addLayer(bufferLayer);

    bufferLayerRef.current = bufferLayer;
    //  ORDER MATTERS (VERY IMPORTANT)
    mapObj.current.addLayer(demandLayerRef.current); // bottom
    mapObj.current.addLayer(supplyLayerRef.current); // top (swipe layer)
    mapObj.current.addLayer(aoiLayerRef.current);
    mapObj.current.addLayer(gapLayerRef.current);
    mapObj.current.addLayer(suitableLandRef.current);
    loadAOI();
    suitableLand();
    //  CLICK EVENT
    mapObj.current.on("click", (evt) => {
      const coord = toLonLat(evt.coordinate);
      const lat = coord[1];
      const lon = coord[0];

      mapObj.current.forEachFeatureAtPixel(evt.pixel, (feature) => {
        const properties = { ...feature.getProperties() };
        delete properties.geometry;
        setSelectedFeature(properties);
      });

      selectedRef.current.forEach((type) => {
        fetchAnalysis(type, lat, lon);
      });

      if (bufferRef.current > 0) {
        runBufferAnalysis(evt.coordinate);
      }
    });

    return () => mapObj.current.setTarget(null);
  }, []);
  // -----------------------------
  // SWIPE CONTROL
  // -----------------------------
  useEffect(() => {
    console.log(
      "GAP FEATURES:",
      gapLayerRef.current?.getSource()?.getFeatures().length,
    );
  }, [analysisLayers]);
  useEffect(() => {
    const layer = supplyLayerRef.current;
    const swipe = document.getElementById("swipe");

    if (!layer) return;

    let prerender;
    let postrender;

    //  If not both active → remove safely
    if (!analysisLayers.demand || !analysisLayers.supply) {
      if (layer.__prerender) layer.un("prerender", layer.__prerender);
      if (layer.__postrender) layer.un("postrender", layer.__postrender);

      layer.__prerender = null;
      layer.__postrender = null;

      mapObj.current?.render();
      return;
    }

    if (!swipe) return;

    //  DEFINE HANDLERS
    prerender = function (event) {
      const ctx = event.context;
      const mapSize = mapObj.current.getSize();
      const width = mapSize[0] * (swipe.value / 100);

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width, mapSize[1]);
      ctx.clip();
    };

    postrender = function (event) {
      event.context.restore();
    };

    //  SAVE HANDLERS ON LAYER
    layer.__prerender = prerender;
    layer.__postrender = postrender;

    //  ADD EVENTS
    layer.on("prerender", prerender);
    layer.on("postrender", postrender);

    swipe.oninput = () => mapObj.current.render();

    //  CLEANUP
    return () => {
      if (layer.__prerender) layer.un("prerender", layer.__prerender);
      if (layer.__postrender) layer.un("postrender", layer.__postrender);

      layer.__prerender = null;
      layer.__postrender = null;
    };
  }, [analysisLayers]);

  useEffect(() => {
    if (
      !demandLayerRef.current ||
      !supplyLayerRef.current ||
      !suitableLandRef.current
    )
      return;

    // DEMAND
    if (analysisLayers.demand) {
      fetchDemandLayer();
      demandLayerRef.current.setVisible(true);
    } else {
      demandLayerRef.current.setVisible(false);
    }

    // SUPPLY
    if (analysisLayers.supply) {
      fetchSupplyLayer();
      supplyLayerRef.current.setVisible(true);
    } else {
      supplyLayerRef.current.setVisible(false);
    }

    // Gap
    if (analysisLayers.gap) {
      fetchGapLayer();
      gapLayerRef.current.setVisible(true);
    } else {
      gapLayerRef.current.setVisible(false);
    }

    // SUPPLY
    if (analysisLayers.suitable_land) {
      fetchSupplyLayer();
      suitableLandRef.current.setVisible(true);
    } else {
      suitableLandRef.current.setVisible(false);
    }
  }, [analysisLayers]);

  // -----------------------------
  // LOAD DEMAND/SUPPLY
  // -----------------------------
  useEffect(() => {
    bufferRef.current = buffer;
  }, [buffer]);
  // -----------------------------
  // LOAD TYPE LAYERS
  // -----------------------------
  useEffect(() => {
    if (!mapObj.current) return;

    Object.values(layerRef.current).forEach((l) =>
      mapObj.current.removeLayer(l),
    );
    layerRef.current = {};

    selectedTypes.forEach((type) => {
      fetch(API.getLayer, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tableName: type }),
      })
        .then((res) => res.json())
        .then((res) => {
          const geojson = res.data;

          const source = new VectorSource({
            features: new GeoJSON().readFeatures(geojson, {
              featureProjection: "EPSG:3857",
            }),
          });

          const layerObj = new VectorLayer({
            source,
            style: createLayerStyle(type),
          });

          mapObj.current.addLayer(layerObj);
          layerRef.current[type] = layerObj;
        });
    });
  }, [selectedTypes]);

  // -----------------------------
  // ICONS
  // -----------------------------
  const getIcon = (type) => {
    switch (type) {
      case "toilets_sanitation":
        return "https://cdn-icons-png.flaticon.com/512/684/684908.png";
      case "police_station":
        return "https://cdn-icons-png.flaticon.com/512/149/149060.png";
      case "parking_loc":
        return "https://cdn-icons-png.flaticon.com/512/854/854878.png";
      case "road_network3":
        return "https://cdn-icons-png.flaticon.com/512/684/684809.png";
      case "temple_ujjain":
        return "https://cdn-icons-png.flaticon.com/512/3176/3176292.png";
      case "junction":
        return "https://cdn-icons-png.flaticon.com/512/1483/1483336.png";
      default:
        return "https://cdn-icons-png.flaticon.com/512/252/252025.png";
    }
  };

  const createLayerStyle = (type) => (f) => getStyle(f, type);
  const drawBufferCircle = (coordinate, bufferDistance) => {
    if (!bufferLayerRef.current) return;

    bufferLayerRef.current.getSource().clear();

    const format = new GeoJSON();

    // STEP 1: Convert coordinate 3857 → 4326
    const coord4326 = transform(coordinate, "EPSG:3857", "EPSG:4326");

    // STEP 2: Create buffer polygon in Turf (correct projection)
    const point = turf.point(coord4326);

    const buffer = turf.buffer(
      point,
      bufferDistance / 1000, // meters → km
      { units: "kilometers" },
    );

    // STEP 3: Get AOI feature
    const aoiFeatures = aoiLayerRef.current?.getSource()?.getFeatures();

    if (!aoiFeatures || aoiFeatures.length === 0) return;

    // Convert AOI geometry → GeoJSON 4326
    const aoiGeoJSON3857 = format.writeFeatureObject(aoiFeatures[0]);

    const aoiGeoJSON4326 = turf.toWgs84(aoiGeoJSON3857);

    // STEP 4: Clip buffer with AOI
    const clipped = turf.intersect(
      turf.featureCollection([buffer, aoiGeoJSON4326]),
    );

    if (!clipped) return;

    // STEP 5: Convert back 4326 → 3857
    const clipped3857 = turf.toMercator(clipped);

    // STEP 6: Render on map
    const clippedFeature = format.readFeature(clipped3857);

    clippedFeature.setStyle(
      new Style({
        stroke: new Stroke({
          color: "#ff0000",
          width: 3,
          lineDash: [6, 6],
        }),
        fill: new Fill({
          color: "rgba(255,0,0,0.08)",
        }),
      }),
    );

    bufferLayerRef.current.getSource().addFeature(clippedFeature);
  };
  const runBufferAnalysis = (coordinate) => {
    const bufferDistance = bufferRef.current * 1000;

    const circleGeom = new Circle(coordinate, bufferDistance);

    const aoiFeatures = aoiLayerRef.current.getSource().getFeatures();

    if (!aoiFeatures.length) return;

    const aoiGeometry = aoiFeatures[0].getGeometry();

    if (!aoiGeometry.intersectsCoordinate(coordinate)) {
      return;
    }

    drawBufferCircle(coordinate, bufferDistance);

    const extent = circleGeom.getExtent();

    findFeaturesInsideBuffer(extent);
  };

  const findFeaturesInsideBuffer = (extent) => {
    if (!mapObj.current) return;

    const results = [];

    Object.entries(layerRef.current).forEach(([layerName, layer]) => {
      const source = layer.getSource();

      if (!source) return;

      const features = source.getFeaturesInExtent(extent);

      if (features.length > 0) {
        results.push({
          layer: layerName,
          count: features.length,
        });
      }
    });

    setBufferResults(results);
  };
  // -----------------------------
  // ANALYSIS API
  // -----------------------------
  const fetchAnalysis = (type, lat, lon) => {
    fetch(API.analysis, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tableName: type,
        latitude: lat,
        longitude: lon,
        bufferRadius: buffer * 1000,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === "success") {
          updateAnalysis(type, res.data);
        }
      });
  };

  // -----------------------------
  // AOI API
  // -----------------------------
  const loadAOI = async () => {
    try {
      const res = await fetch(API.aoi);
      const json = await res.json();

      const features = new GeoJSON().readFeatures(json.data, {
        featureProjection: "EPSG:3857",
      });

      aoiLayerRef.current.getSource().clear();
      aoiLayerRef.current.getSource().addFeatures(features);

      const extent = aoiLayerRef.current.getSource().getExtent();
      mapObj.current.getView().fit(extent, {
        padding: [40, 40, 40, 40],
        duration: 800,
      });
    } catch (err) {
      console.error("AOI error:", err);
    }
  };

  // -----------------------------
  // LAND SUITABLE API
  // -----------------------------
  const suitableLand = async () => {
    try {
      debugger;
      const res = await fetch(API.suitableLand);
      const json = await res.json();

      const features = new GeoJSON().readFeatures(json.data, {
        featureProjection: "EPSG:3857",
      });

      suitableLandRef.current.getSource().clear();
      suitableLandRef.current.getSource().addFeatures(features);

      const extent = suitableLandRef.current.getSource().getExtent();
      mapObj.current.getView().fit(extent, {
        padding: [40, 40, 40, 40],
        duration: 800,
      });
    } catch (err) {
      console.error("AOI error:", err);
    }
  };

  const suitableLandLayerStyle = (feature) => {
    const priority = feature.get("priority");

    let color = "rgba(255,255,255,0.3)"; // fallback

    if (priority >= 10.5 && priority < 21.5) {
      color = "rgba(255,182,193,0.5)"; // light red
    } else if (priority >= 21.5 && priority < 26.5) {
      color = "rgba(255,120,120,0.6)";
    } else if (priority >= 26.5 && priority < 31) {
      color = "rgba(255,80,80,0.7)";
    } else if (priority >= 31 && priority < 40) {
      color = "rgba(220,40,40,0.8)";
    } else if (priority >= 40 && priority <= 55) {
      color = "rgba(139,0,0,0.9)"; // dark red
    }

    return new Style({
      fill: new Fill({ color }),
    });
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="relative w-full h-full">
      {/* MAP */}
      <div ref={mapRef} className="w-full h-full z-0" />

      {/* LEGEND BUTTON (RIGHT SIDE) */}
      <div className="absolute right-4 top-4 z-[999]">
        <button
          onClick={() => setShowLegend((prev) => !prev)}
          className="bg-white shadow-lg px-4 py-2 rounded-lg border text-sm font-semibold hover:bg-gray-100 transition"
        >
          📊 Legend
        </button>
      </div>

      {/* LEGEND CARD */}
      {showLegend && (
        <div className="absolute right-4 top-16 z-[999]">
          <MapLegend
            analysisLayers={analysisLayers}
            selectedTypes={selectedTypes}
          />
        </div>
      )}

      {/* SWIPE CONTROL */}
      {analysisLayers.demand && analysisLayers.supply && (
        <div
          className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 
        bg-white/95 backdrop-blur-md px-5 py-3 rounded-xl 
        shadow-lg border w-[320px]"
        >
          {/* Header */}
          <div className="text-sm font-semibold text-gray-700 text-center mb-2">
            Analysis
          </div>

          {/* Labels */}
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Demand</span>
            <span>Supply</span>
          </div>

          {/* Slider */}
          <input
            id="swipe"
            type="range"
            min="0"
            max="100"
            defaultValue="50"
            className="w-full accent-orange-500 cursor-pointer"
          />
        </div>
      )}

      {/* LOADING LAYER OVERLAY */}
      {loadingLayer && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-[999]">
          <div className="bg-white px-6 py-3 rounded-lg shadow-lg text-lg font-semibold">
            Loading Layer...
          </div>
        </div>
      )}
      {analysingSitePriority && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-[999]">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-lg font-semibold flex items-center gap-2">
            <span>Analysing Site Priority</span>

            <span className="flex">
              <span className="animate-bounce [animation-delay:0ms]">.</span>
              <span className="animate-bounce [animation-delay:150ms]">.</span>
              <span className="animate-bounce [animation-delay:300ms]">.</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
