import { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat, toLonLat } from "ol/proj";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import MapLegend from "../Maplegend";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import { API } from "../../config/api";
import { defaults as defaultControls } from "ol/control";

export default function OpenLayerMap({
  buffer,
  selectedTypes = [],
  updateAnalysis,
  setSelectedFeature,
  layer,
}) {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const selectedRef = useRef([]);
  const vectorSourceRef = useRef(null);
  const vectorLayerRef = useRef(null);
  const layerRef = useRef({});

  // ✅ LOADER STATE
  const [loadingLayer, setLoadingLayer] = useState(false);

  // ⏳ delay helper
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

    if (demandClass === "Very High") color = "rgba(107, 4, 4, 0.6)";
    else if (demandClass === "High") color = "rgba(255,0,0,0.6)";
    else if (demandClass === "Moderate") color = "rgba(255,165,0,0.6)";
    else if (demandClass === "Low") color = "rgba(255,255,0,0.6)";
    else if (demandClass === "Very Low") color = "rgba(0,255,0,0.6)";

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

    if (gap === "Adequate") color = "rgba(0,180,0,0.45)";
    else if (gap === "Oversupply") color = "rgba(0,120,255,0.45)";
    else if (gap === "Low") color = "rgba(255,255,0,0.45)";
    else if (gap === "Moderate") color = "rgba(255,165,0,0.45)";
    else if (gap === "Critical") color = "rgba(255,0,0,0.55)";

    return new Style({
      fill: new Fill({ color }),
    });
  };

  // -----------------------------
  // FETCH DEMAND
  // -----------------------------
  const fetchDemandLayer = async () => {
    try {
      setLoadingLayer(true);

      const [res] = await Promise.all([
        fetch(API.demand),
        delay(5000),
      ]);

      const json = await res.json();
      const geojson = json.data;

      const features = new GeoJSON().readFeatures(geojson, {
        dataProjection: "EPSG:32643",
        featureProjection: "EPSG:3857",
      });

      vectorSourceRef.current.clear();

      features.forEach((f) => f.setStyle(demandLayerStyle(f)));
      vectorSourceRef.current.addFeatures(features);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLayer(false);
    }
  };

  // -----------------------------
  // FETCH SUPPLY
  // -----------------------------
  const fetchSupplyLayer = async () => {
    try {
      setLoadingLayer(true);

      const [res] = await Promise.all([
        fetch(API.supply),
        delay(5000),
      ]);

      const json = await res.json();
      const geojson = json.data;

      const features = new GeoJSON().readFeatures(geojson, {
        dataProjection: "EPSG:32643",
        featureProjection: "EPSG:3857",
      });

      vectorSourceRef.current.clear();

      features.forEach((f) => f.setStyle(supplyLayerStyle(f)));
      vectorSourceRef.current.addFeatures(features);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLayer(false);
    }
  };

  // -----------------------------
  // SWITCH LAYER
  // -----------------------------
  const getLayerSanitaion = () => {
    if (loadingLayer) return; // prevent spam clicks

    if (layer === "supply_layer") {
      fetchDemandLayer();
    } else if (layer === "demand_layer") {
      fetchSupplyLayer();
    }
  };

  useEffect(() => {
    selectedRef.current = selectedTypes;
  }, [selectedTypes]);

  // -----------------------------
  // INIT MAP
  // -----------------------------
  useEffect(() => {
    vectorSourceRef.current = new VectorSource();

    vectorLayerRef.current = new VectorLayer({
      source: vectorSourceRef.current,
    });

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
    });

    return () => mapObj.current.setTarget(null);
  }, []);

  // -----------------------------
  // LOAD DEMAND/SUPPLY
  // -----------------------------
  useEffect(() => {
    if (!layer) return;
    getLayerSanitaion();
  }, [layer]);

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
            style: (f) => getStyle(f, type),
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
      default:
        return "https://cdn-icons-png.flaticon.com/512/252/252025.png";
    }
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
  // UI
  // -----------------------------
  return (
    <div className="relative w-full h-full">
      {/* 🗺️ MAP */}
      <div ref={mapRef} className="w-full h-full z-0" />

      {/* 📊 LEGEND */}
      <div className="absolute bottom-4 left-4 z-40">
        <MapLegend layer={layer} />
      </div>

      {/* ⏳ LOADER (TOP) */}
      {loadingLayer && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white px-6 py-3 rounded-lg shadow-lg text-lg font-semibold">
            Loading Layer...
          </div>
        </div>
      )}
    </div>
  );
}
