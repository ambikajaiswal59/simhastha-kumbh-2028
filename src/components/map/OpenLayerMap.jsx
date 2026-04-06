import { useEffect, useRef, useState } from "react";
import "ol/ol.css";

import Map from "ol/Map";
import View from "ol/View";
import Overlay from "ol/Overlay";
import Feature from "ol/Feature";

import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";

import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import VectorSource from "ol/source/Vector";

import Point from "ol/geom/Point";
import Circle from "ol/geom/Circle";

import GeoJSON from "ol/format/GeoJSON";
import WKT from "ol/format/WKT";

import { fromLonLat, toLonLat, transform } from "ol/proj";
import { getCenter } from "ol/extent";

import { defaults as defaultControls } from "ol/control";

import Icon from "ol/style/Icon";
import { Stroke, Fill, Style } from "ol/style";
import CircleStyle from "ol/style/Circle";

import * as turf from "@turf/turf";

import { API } from "../../config/api";
import { useMapContext } from "../../context/MapContext";

import MapLegend from "../Maplegend";

import { Paper, Typography, Stack, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import LocationIcon from "../../assets/location.svg";
import omIcon from "../../assets/Icon/om.svg";

export default function OpenLayerMap({
  buffer,
  mlBuffer,
  selectedTypes = [],
  updateAnalysis,
  setAnalysisData,
  setSelectedFeature,
  analysisLayers,
  setBufferResults,
  bufferEnabledRef,
  bottleneckZone,
}) {
  const {
    mapRef,
    mapObj,
    suitableLandRef,
    bufferLayerRef,
    analysingSitePriority,
    scenerioSanitationRef,
    clickMarkerLayerRef,
  } = useMapContext();

  const selectedRef = useRef([]);
  const vectorSourceRef = useRef(null);
  const vectorLayerRef = useRef(null);
  const layerRef = useRef({});
  const demandLayerRef = useRef(null);
  const supplyLayerRef = useRef(null);
  const aoiLayerRef = useRef(null);
  const [loadingLayer, setLoadingLayer] = useState(false);
  const bufferRef = useRef(buffer);
  const [showLegend, setShowLegend] = useState(false);
  const gapLayerRef = useRef(null);
  const mlLayerRef = useRef(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const popupRef = useRef(null);
  const overlayRef = useRef(null);
  const streetLayerRef = useRef(null);
  const satelliteLayerRef = useRef(null);
  const [baseMapType, setBaseMapType] = useState("street");
  const bottleneckLayerRef = useRef(null);
  const bufferGeometryRef = useRef(null);
  //////************************************* */
  const lastClickedCoordinateRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
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

  useEffect(() => {
    if (mapObj.current) return; // prevent re-init

    vectorSourceRef.current = new VectorSource();

    vectorLayerRef.current = new VectorLayer({
      source: vectorSourceRef.current,
    });

    //************************************* */ { street map}
    streetLayerRef.current = new TileLayer({
      source: new OSM(),
      visible: true,
    });
    // { satelliteLaye----**}
    satelliteLayerRef.current = new TileLayer({
      source: new XYZ({
        url: "https://mt.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
        crossOrigin: "anonymous",
      }),
      visible: false,
    });

    mapObj.current = new Map({
      target: mapRef.current,
      layers: [
        streetLayerRef.current,
        satelliteLayerRef.current,
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
    //************************************************ */
    overlayRef.current = new Overlay({
      element: popupRef.current,
      positioning: "center-left", // 👈 anchor popup from left side
      stopEvent: true,
      offset: [0, 0], // 👉 push it to right
    });

    mapObj.current.addOverlay(overlayRef.current);

    demandLayerRef.current = createLayer(
      demandLayerStyle,
      false,
      "Demand Layer",
    );
    supplyLayerRef.current = createLayer(
      supplyLayerStyle,
      false,
      "Supply Layer",
    );
    aoiLayerRef.current = createLayer(aoiStyle, true, "AOI Layer");
    gapLayerRef.current = createLayer(gapLayerStyle, false, "Gap Layer");
    suitableLandRef.current = createLayer(
      suitableLandLayerStyle,
      false,
      "SuitableLand Layer",
    );

    scenerioSanitationRef.current = new VectorLayer({
      source: new VectorSource(),
      style: invisibleStyle,
      visible: true,
    });
    scenerioSanitationRef.current.set("name", "ScenerioSanitation Layer");

    bufferLayerRef.current = new VectorLayer({
      source: new VectorSource(),
      zIndex: 9999,
    });
    bufferLayerRef.current.set("name", "Buffer Layer");

    // -----------------------------
    // CLICK MARKER LAYER
    // -----------------------------
    clickMarkerLayerRef.current = new VectorLayer({
      source: new VectorSource(),
      zIndex: 99999,
    });
    mlLayerRef.current = new VectorLayer({
      source: new VectorSource(),
      zIndex: 99999, // below click marker, above others if needed
    });
    mlLayerRef.current.set("name", "ML Layer");
    mlLayerRef.current.setStyle(
      new Style({
        stroke: new Stroke({
          color: "#22c55e",
          width: 2,
        }),
        fill: new Fill({
          color: "rgba(34, 197, 94, 0.2)", // s
        }),
      }),
    );

    bottleneckLayerRef.current = new VectorLayer({
      source: new VectorSource(),
      visible: false,
      zIndex: 9998,
    });

    bottleneckLayerRef.current.set("name", "Bottleneck Layer");

    bottleneckLayerRef.current.setStyle((feature) => {
      const risk = feature.get("risk_class");

      let strokeColor = "#facc15"; // yellow

      if (risk === "CRITICAL") {
        strokeColor = "#ef4444";
      } else if (risk === "HIGH") {
        strokeColor = "#f97316";
      }

      const geometry = feature.getGeometry();

      // center point
      const centerPoint = new Point(getCenter(geometry.getExtent()));

      return [
        // 🔷 Glow layer
        new Style({
          geometry: centerPoint,
          image: new CircleStyle({
            radius: 12,
            fill: new Fill({
              color: `${strokeColor}33`,
            }),
          }),
        }),

        // 🔷 Main badge
        new Style({
          geometry: centerPoint,
          image: new CircleStyle({
            radius: 8,
            fill: new Fill({
              color: strokeColor,
            }),
            stroke: new Stroke({
              color: "#fff",
              width: 2,
            }),
          }),
        }),
      ];
    });
    // -----------------------------
    // ADD LAYERS (ORDER MATTERS)
    // -----------------------------
    mapObj.current.addLayer(bufferLayerRef.current);
    mapObj.current.addLayer(demandLayerRef.current);
    mapObj.current.addLayer(supplyLayerRef.current);
    mapObj.current.addLayer(aoiLayerRef.current);
    mapObj.current.addLayer(gapLayerRef.current);
    mapObj.current.addLayer(suitableLandRef.current);
    mapObj.current.addLayer(scenerioSanitationRef.current);
    mapObj.current.addLayer(mlLayerRef.current);
    mapObj.current.addLayer(bottleneckLayerRef.current);
    mapObj.current.addLayer(clickMarkerLayerRef.current);

    // -----------------------------
    // INITIAL LOAD
    // -----------------------------
    loadAOI();
    suitableLand();
    sanitationScenerio();

    mapObj.current.on("click", handleMapClick);

    // -----------------------------
    // CLEANUP
    // -----------------------------
    return () => {
      mapObj.current.un("click", handleMapClick);
      mapObj.current.setTarget(null);
      mapObj.current = null;
    };
  }, []);

  useEffect(() => {

    // if (!mlBuffer?.enabled || !mapReady) return;

    // ✅ ADD THIS CHECK
    if (!analysisLayers.emptySpace) {
      if (mlLayerRef.current) {
        mlLayerRef.current.getSource().clear();
        mlLayerRef.current.setVisible(false);
      }
      return;
    }

    fetchData();
  }, [
    mlBuffer?.value,
    mlBuffer?.enabled,
    mapReady,
    analysisLayers.emptySpace, // ✅ IMPORTANT
  ]);

  useEffect(() => {
    const noLayerSelected =
      !analysisLayers.emptySpace && !analysisLayers.bottleneck;

    if (noLayerSelected) {
      clearBuffer(); // ✅ THIS FIXES IT
    }
  }, [analysisLayers.emptySpace, analysisLayers.bottleneck]);
  const fetchData = async () => {

    try {
      const res = await fetch(API.emptySpaces(mlBuffer.value));
      const data = await res.json();

      if (data.data.length > 0) {
        const center = data.data[0];

        // ✅ CREATE BUFFER FIRST
        runMLBuffer(
          Number(center.centroid_x),
          Number(center.centroid_y),
          mlBuffer.value,
        );
      }

      // ✅ THEN DRAW (with buffer ready)
      drawMLPolygons(data.data);
    } catch (err) {
      console.error(err);
    }
  };
  const drawMLPolygons = (spaces) => {
    if (!mlLayerRef.current) return;

    const source = mlLayerRef.current.getSource();
    source.clear();

    const format = new WKT();

    spaces.forEach((space) => {
      const feature = format.readFeature(space.space_wkt, {
        dataProjection: "EPSG:32643",
        featureProjection: "EPSG:3857",
      });

      // 🔥 VERY IMPORTANT → attach API properties
      feature.setProperties({
        area_sqm: space.area_sqm,
        occupied_pct: space.occupied_pct,
        distance_from_temple: space.distance_from_temple,
        centroid_x: space.centroid_x,
        centroid_y: space.centroid_y,
        layer: "ML Layer", // ✅ ensure layer is consistent
      });

      // ✅ FILTER INSIDE BUFFER
      if (
        !bufferGeometryRef.current ||
        bufferGeometryRef.current.intersectsExtent(
          feature.getGeometry().getExtent(),
        )
      ) {
        source.addFeature(feature);
      }
    });

    mlLayerRef.current.setVisible(true);
  };

  // -----------------------------
  // Bottleneck Layer
  // -----------------------------

  useEffect(() => {
    // if (!mapReady || !mlBuffer?.enabled) return;

    if (analysisLayers.bottleneck) {
      // ✅ ALWAYS create buffer first
      //createBufferFromMapCenter();

      // ✅ THEN load data
      loadBottleneckData(mlBuffer.value, bottleneckZone);
    } else {
      bottleneckLayerRef.current.getSource().clear();
      bottleneckLayerRef.current.setVisible(false);
    }
  }, [
    analysisLayers.bottleneck,
    mlBuffer.value,
    mlBuffer.enabled,
    bottleneckZone,
  ]);
  // const createBufferFromMapCenter = () => {
  //   const center = mapObj.current.getView().getCenter();
  //   if (!center) return;

  //   runMLBuffer(center[0], center[1], mlBuffer.value, true);
  // };
  const loadBottleneckData = async (radius, zone) => {

    try {
      const response = await fetch(
        API.bottlenecks(mlBuffer.value, bottleneckZone),
      );
      const result = await response.json();

      drawBottleneckFeatures(result.data);
    } catch (err) {
      console.error("Bottleneck API error:", err);
    }
  };

  const drawBottleneckFeatures = (data) => {
    const format = new WKT();
    const source = bottleneckLayerRef.current.getSource();

    source.clear();

    const features = data.map((item) => {
      const geometry = format.readGeometry(item.space_wkt, {
        dataProjection: "EPSG:32643",
        featureProjection: "EPSG:3857",
      });

      return new Feature({
        geometry,
        ...item,
      });
    });

    // ✅ FILTER BEFORE ADDING
    const filteredFeatures = features.filter((feature) => {
      if (!bufferGeometryRef.current) return true;

      return bufferGeometryRef.current.intersectsExtent(
        feature.getGeometry().getExtent(),
      );
    });

    source.addFeatures(filteredFeatures);
    console.log("Bottleneck features:", filteredFeatures.length);
    bottleneckLayerRef.current.setVisible(true);
    bottleneckLayerRef.current.changed();
  };

  const clearBuffer = () => {
    if (!bufferLayerRef.current) return;

    bufferLayerRef.current.getSource().clear();
    bufferGeometryRef.current = null;
  };

  // -----------------------------
  // LAYER FACTORY 🔥
  // -----------------------------
  const createLayer = (style, visible = false, name) => {
    const layer = new VectorLayer({
      source: new VectorSource(),
      style,
      visible,
    });
    layer.set("name", name);
    return layer;
  };

  // -----------------------------
  // CLICK HANDLER 🔥 (OPTIMIZED)
  // -----------------------------
  const handleMapClick = (evt) => {
    const [lon, lat] = toLonLat(evt.coordinate);

    lastClickedCoordinateRef.current = evt.coordinate;

    let found = false;
    let selected = null;

    mapObj.current.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
      const layerName = layer?.get("name");
      if (!layerName) return false;

      // ✅ Allow only these layers
      if (
        layerName === "ScenerioSanitation Layer" ||
        layerName === "Bottleneck Layer" ||
        layerName === "ML Layer"
      ) {
        if (!selected) {
          const properties = { ...feature.getProperties() };
          delete properties.geometry;

          selected = {
            ...properties,
            layer: layerName,
          };

          // -----------------------------
          // SCENERIO SANITATION BEHAVIOR
          // -----------------------------
          if (
            bufferEnabledRef.current === false &&
            layerName === "ScenerioSanitation Layer"
          ) {
            bufferLayerRef.current.getSource().clear();
            setAnalysisData({});
            setPopupInfo(properties);
            overlayRef.current.setPosition(evt.coordinate);

            // 🔥 Marker
            const source = clickMarkerLayerRef.current.getSource();
            source.clear();

            const marker = new Feature({
              geometry: new Point(evt.coordinate),
            });

            marker.setStyle(markerStyle);
            source.addFeature(marker);

            found = true;
          }

          return true; // ✅ break after first valid feature
        }
      }
    });

    // ✅ Set selected feature ONLY ONCE
    if (selected) {
      setSelectedFeature(selected);
    } else {
      setSelectedFeature(null);
    }

    // Close popup if nothing clicked
    if (!found) {
      overlayRef.current.setPosition(undefined);
      clickMarkerLayerRef.current.getSource().clear();
    }

    // -----------------------------
    // BUFFER ANALYSIS (unchanged)
    // -----------------------------
    if (bufferEnabledRef.current) {
      selectedRef.current.forEach((type) => {
        fetchAnalysis(type, lat, lon);
        fetchCoreAnalysis(type, lat, lon);
      });

      if (bufferRef.current > 0) {
        runBufferAnalysis(evt.coordinate);
      }
    }
  };

  const drawCoreAnalysisCircles = () => {
    const coordinate = lastClickedCoordinateRef.current;

    if (!coordinate || !bufferLayerRef.current) return;

    const totalDistance = bufferRef.current * 1000;
    if (totalDistance <= 0) return;

    const aoiFeatures = aoiLayerRef.current?.getSource()?.getFeatures();
    if (!aoiFeatures || aoiFeatures.length === 0) return;

    const aoiGeometry = aoiFeatures[0].getGeometry();
    if (!aoiGeometry.intersectsCoordinate(coordinate)) return;

    const source = bufferLayerRef.current.getSource();
    source.clear();

    const format = new GeoJSON();
    const coord4326 = transform(coordinate, "EPSG:3857", "EPSG:4326");
    const point = turf.point(coord4326);

    const aoiGeoJSON3857 = format.writeFeatureObject(aoiFeatures[0]);
    const aoiGeoJSON4326 = turf.toWgs84(aoiGeoJSON3857);

    const circleColors = [
      { stroke: "green", fill: "rgba(0, 128, 0, 0.18)" },
      { stroke: "yellow", fill: "rgba(255, 255, 0, 0.18)" },
      { stroke: "blue", fill: "rgba(0, 0, 255, 0.18)" },
      { stroke: "red", fill: "rgba(255, 0, 0, 0.18)" },
    ];

    [1, 2, 3, 4].forEach((step) => {
      const ringDistance = (totalDistance / 4) * step;

      const ringBuffer = turf.buffer(point, ringDistance / 1000, {
        units: "kilometers",
      });

      const clipped = turf.intersect(
        turf.featureCollection([ringBuffer, aoiGeoJSON4326]),
      );

      if (!clipped) return;

      const clipped3857 = turf.toMercator(clipped);
      const circleFeature = format.readFeature(clipped3857);

      circleFeature.setStyle(
        new Style({
          stroke: new Stroke({
            color: circleColors[step - 1].stroke,
            width: step === 4 ? 3 : 2,
          }),
          fill: new Fill({
            color: circleColors[step - 1].fill,
          }),
        }),
      );

      source.addFeature(circleFeature);
    });
  };

  ////************************************** ***********/
  useEffect(() => {
    const handleCoreAnalysis = () => {
      const coordinate = lastClickedCoordinateRef.current;
      if (!coordinate) return;

      const [lon, lat] = toLonLat(coordinate);

      drawCoreAnalysisCircles();

      selectedRef.current.forEach((type) => {
        fetchCoreAnalysis(type, lat, lon);
      });
    };
    const handleCloseCoreAnalysis = () => {
      const coordinate = lastClickedCoordinateRef.current;

      if (!coordinate || !bufferLayerRef.current) return;

      if (bufferRef.current > 0) {
        runBufferAnalysis(coordinate);
      } else {
        bufferLayerRef.current.getSource().clear();
      }
    };

    window.addEventListener("run-core-analysis", handleCoreAnalysis);
    window.addEventListener("close-core-analysis", handleCloseCoreAnalysis);

    return () => {
      window.removeEventListener(
        "close-core-analysis",
        handleCloseCoreAnalysis,
      );
      window.removeEventListener("run-core-analysis", handleCoreAnalysis);
    };
  }, []);

  // -----------------------------
  // SWIPE CONTROL
  // -----------------------------

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
        return omIcon; //

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

  const runMLBuffer = (x, y, radiusMeters, isProjected = false) => {
    if (!mapObj.current) return;

    const center = isProjected
      ? [x, y]
      : transform([x, y], "EPSG:32643", "EPSG:3857");
    const bufferGeom = new Circle(center, radiusMeters);

    drawBufferCircle(center, radiusMeters);
    bufferGeometryRef.current = bufferGeom;
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
  /************************ */
  const fetchCoreAnalysis = (type, lat, lon) => {
    fetch(API.coreAnalysis, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tableName: type,
        latitude: String(lat),
        longitude: String(lon),
        bufferRadius: String(bufferRef.current * 1000),
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === "success" && Array.isArray(res.data)) {
          setAnalysisData((prev) => ({
            ...prev,
            [type]: {
              ...(prev[type] || {}),
              coreZones: [...res.data].sort((a, b) => a.zone - b.zone),
            },
          }));
        }
      })
      .catch(console.error);
  };
  /******** */

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
  // SCENERION SANITATION API
  // -----------------------------
  const sanitationScenerio = async () => {

    try {
      const res = await fetch(API.sanitation);
      const json = await res.json();

      const features = new GeoJSON().readFeatures(json.data, {
        featureProjection: "EPSG:3857",
      });

      scenerioSanitationRef.current.getSource().clear();
      scenerioSanitationRef.current.getSource().addFeatures(features);

      const extent = scenerioSanitationRef.current.getSource().getExtent();
      mapObj.current.getView().fit(extent, {
        padding: [40, 40, 40, 40],
        duration: 800,
      });
    } catch (err) {
      console.error("AOI error:", err);
    }
  };

  const invisibleStyle = new Style({
    stroke: new Stroke({
      color: "rgba(0,0,0,0)", // ❌ invisible border
      width: 0,
    }),
    fill: new Fill({
      color: "rgba(0,0,0,0)", // ❌ invisible fill
    }),
  });
  const markerStyle = new Style({
    image: new Icon({
      src: LocationIcon,
      scale: 0.25, // small icon
      anchor: [0.5, 1],
    }),
  });
  //****************base map chnage handler************** */
  const handleBaseMapChange = (type) => {
    setBaseMapType(type);
    streetLayerRef.current.setVisible(type === "street");
    satelliteLayerRef.current.setVisible(type === "satellite");
  };
  /************* */

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

      <div
        ref={popupRef}
        style={{
          position: "absolute",
          borderRadius: "2px",
          minWidth: "250px",
        }}
      >
        {popupInfo && (
          <Paper
            elevation={6}
            sx={{
              width: 280,
              maxWidth: "90vw",
              p: 2,
              borderRadius: 2,
              background: "#133b5c",
              color: "white",
            }}
          >
            {/* Header */}
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              mb={1}
              borderBottom={1}
            >
              {/* <Typography variant="subtitle1" fontWeight="bold">
                Scenerio Sanitation
              </Typography> */}
              <Stack spacing={0.2}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {[
                    "Amenity Distance ",
                    popupInfo?.Building,
                    popupInfo?.Landmark,
                    popupInfo?.Road,
                    popupInfo?.Locality,
                  ]
                    .filter(
                      (item) =>
                        item !== null &&
                        item !== undefined &&
                        String(item).trim() !== "",
                    )
                    .map((item) => String(item).trim())
                    .join(", ")}
                </Typography>
              </Stack>

              <IconButton
                size="small"
                onClick={() => {
                  overlayRef.current.setPosition(undefined);
                  clickMarkerLayerRef.current.getSource().clear();
                }}
                sx={{
                  color: "white",
                  margin: "2px",
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>

            {/* Content */}
            <Stack spacing={0.8}>
              {[
                // { label: "Priority", value: popupInfo.priority },
                { label: "Road", value: popupInfo.d_road },
                { label: "Parking", value: popupInfo.d_parking },
                { label: "Toilet", value: popupInfo.d_toilet },
                { label: "Water", value: popupInfo.d_water },
                { label: "Medical", value: popupInfo.d_medical },
                { label: "Police", value: popupInfo.d_police },
                { label: "Electric", value: popupInfo.d_electric },
                { label: "River", value: popupInfo.d_river },
              ].map((item, i) => (
                <Stack key={i} direction="row" justifyContent="space-between">
                  <Typography variant="body2" fontWeight={500}>
                    {item.label}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {item.value} m
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
        )}
      </div>

      {/*========================== base map switcher ==========================*/}
      <div className="absolute left-4 bottom-4 z-[999] bg-white rounded-lg shadow-lg border p-1 flex gap-1">
        <button
          onClick={() => handleBaseMapChange("street")}
          className={`px-3 py-2 text-xs font-semibold rounded-md transition ${
            baseMapType === "street"
              ? "bg-[#133b5c] text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          Map
        </button>

        <button
          onClick={() => handleBaseMapChange("satellite")}
          className={`px-3 py-2 text-xs font-semibold rounded-md transition ${
            baseMapType === "satellite"
              ? "bg-[#133b5c] text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          Satellite
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
        <div className="absolute inset-0 bg-black/40 z-[999]">
          <div className="w-full h-full relative">
            <div className="absolute right-[10px] bottom-[10px]">
              <div className="w-10 h-10 border-4 right-0 bottom-0 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
          </div>
          {/* Spinner */}
        </div>
      )}
    </div>
  );
}
