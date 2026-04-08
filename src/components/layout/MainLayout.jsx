import { useEffect, useState, useRef } from "react";
import Header from "./Header";
import { useMapContext } from "../../context/MapContext";
import { Style, Icon, Text, Fill, Stroke } from "ol/style";

import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import TenSeat from "../../assets/Icon/T1.png";
import { lazy, Suspense } from "react";
import { set } from "ol/transform";

const OpenLayerMap = lazy(() => import("../map/OpenLayerMap"));
const AnalysisPanel = lazy(() => import("../analysis/AnalysisPanel"));
const Sidebar = lazy(() => import("./Sidebar"));

export default function MainLayout() {
  const {
    mapObj,
    suitableLandRef,
    highlightLayerRef,
    setAnalysingSitePriority,
  } = useMapContext();
  const [buffer, setBuffer] = useState(0.3);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showAnalysisOptions, setShowAnalysisOptions] = useState(false);
  const [analysisLayers, setAnalysisLayers] = useState({
    demand: false,
    supply: false,
    gap: false,
    suitable_land: false,
    site_priority: false,
    emptySpace: false,
    bottleneck: false,
    open_area: false,
  });
  const [analysisData, setAnalysisData] = useState({});
  const [bufferValue, setBufferValue] = useState({
    analysis: { enabled: false, value: 100 },
    ml: { enabled: false, value: 100 },
  });

  const [selectedFeature, setSelectedFeature] = useState(null);
  const [bufferResults, setBufferResults] = useState([]);
  const [bottleNeckZone, setBottleNeckZone] = useState("ALL");
  const [toiletSheet, setToiletSheet] = useState("");
  const [proximity, setProximity] = useState([]);
  const bufferEnabledRef = useRef(false);
  const [bufferEnabled, setBufferEnabled] = useState(false);
  /*****************************************/
  const sitePriorityTimerRef = useRef(null);
  const sitePriorityPausedRef = useRef(false);
  const sitePriorityFeaturesRef = useRef([]);
  const sitePriorityIndexRef = useRef(0);
  /***************************************/

  // Land Suaitablity Dropdown state
  const [showLandSuitableDropdown, setShowLandSuitableDropdown] =
    useState(false);

  // 🔥 Update analysis data
  const updateAnalysis = (type, data) => {
    setAnalysisData((prev) => ({
      ...prev,
      [type]: data,
    }));
  };
  const priorityMap = {
    road: "s_road",
    parking: "s_parking",
    toilet: "d_toilet",
    water: "d_water",
    medical: "d_medical",
    police: "d_police",
    electric: "d_electric",
    ghat: "s_ghat",
    temple: "s_temple",
    Supply: "gap_sc",
    Demand: "demand_sc",
  };
  useEffect(() => {
    if (!selectedFeature) return;

    const layer = selectedFeature.layer?.toLowerCase() || "";

    // ✅ if empty space unchecked → remove its card
    if (layer.includes("ml") && !analysisLayers.emptySpace) {
      setSelectedFeature(null);
    }

    // ✅ if bottleneck unchecked → remove its card
    if (layer.includes("bottleneck") && !analysisLayers.bottleneck) {
      setSelectedFeature(null);
    }
  }, [analysisLayers.emptySpace, analysisLayers.bottleneck]);

  // console.log("priority", priorityMap);
  const createHighlightLayer = () => {
    if (highlightLayerRef.current) return;

    const highlightLayer = new VectorLayer({
      source: new VectorSource(),
      style: highlightStyle,
      zIndex: 1000, // 👈 keep it on top
    });

    mapObj.current.addLayer(highlightLayer);
    highlightLayerRef.current = highlightLayer;
  };

  
  // const handleToiletAnalysis = () => {
  //   setAnalysingSitePriority(true);
  //   const selectedFeatures = runAnalysis(proximity, toiletSheet);

  //   setTimeout(() => {
  //     highlightFeatures(selectedFeatures);
  //   }, 5000);
  // };

  
  //modified//
  const handleToiletAnalysis = () => {
    clearTimeout(sitePriorityTimerRef.current);
    sitePriorityPausedRef.current = false;
    sitePriorityIndexRef.current = 0;

    setAnalysingSitePriority(true);

  const selectedFeatures = runAnalysis(proximity, toiletSheet);
    // sitePriorityFeaturesRef.current = selectedFeatures.map((f) => f.clone());//******* */
    sitePriorityFeaturesRef.current = selectedFeatures;

  

    if (highlightLayerRef.current) {
      highlightLayerRef.current.getSource().clear();
    }

    sitePriorityTimerRef.current = setTimeout(() => {
      highlightFeatures();
    }, 5000);
  };

  const highlightFeatures = () => {
    createHighlightLayer();

    const source = highlightLayerRef.current.getSource();

    const addNextFeature = () => {
      if (sitePriorityPausedRef.current) return;

      if (
        sitePriorityIndexRef.current >= sitePriorityFeaturesRef.current.length
      ) {
        setAnalysingSitePriority(false);
        sitePriorityTimerRef.current = null;

        setAnalysisLayers((prev) => ({
          ...prev,
          site_priority: !prev.site_priority,
        }));

        return;
      }

      const feature =
        sitePriorityFeaturesRef.current[sitePriorityIndexRef.current];

      source.addFeature(feature);

      const geometry = feature.getGeometry();
      const extent = geometry.getExtent();

      mapObj.current.getView().fit(extent, {
        duration: 400,
        padding: [80, 80, 80, 80],
        maxZoom: 18,
      });

      sitePriorityIndexRef.current += 1;
      sitePriorityTimerRef.current = setTimeout(addNextFeature, 2000);
    };

    addNextFeature();
  };
  /********************************** */
  const handlePauseSitePriority = () => {
    if (!sitePriorityFeaturesRef.current.length) return;

    if (sitePriorityPausedRef.current) {
      sitePriorityPausedRef.current = false;
      setAnalysingSitePriority(true);
      highlightFeatures();
      return;
    }

    sitePriorityPausedRef.current = true;
    clearTimeout(sitePriorityTimerRef.current);
    sitePriorityTimerRef.current = null;
    setAnalysingSitePriority(false);
  };

  const handleClearSitePriority = () => {
    sitePriorityPausedRef.current = false;
    clearTimeout(sitePriorityTimerRef.current);
    sitePriorityTimerRef.current = null;
    sitePriorityFeaturesRef.current = [];
    sitePriorityIndexRef.current = 0;

    setAnalysingSitePriority(false);

    if (highlightLayerRef.current) {
      highlightLayerRef.current.getSource().clear();
    }
  };

  useEffect(() => {
    window.addEventListener(
      "toggle-site-priority-pause",
      handlePauseSitePriority,
    );
    window.addEventListener("clear-site-priority", handleClearSitePriority);

    return () => {
      window.removeEventListener(
        "toggle-site-priority-pause",
        handlePauseSitePriority,
      );
      window.removeEventListener(
        "clear-site-priority",
        handleClearSitePriority,
      );
    };
  }, []);
  /****************************************** */

  const highlightStyle = (feature) => {
    const geometry = feature.getGeometry();

    let point;

    if (geometry.getType() === "Polygon") {
      point = geometry.getInteriorPoint();
    } else if (geometry.getType() === "MultiPolygon") {
      point = geometry.getInteriorPoints().getPoint(0); // first polygon center
    } else {
      point = geometry; // fallback (for Point)
    }

    // return new Style({
    //   geometry: point,
    //   image: new Icon({
    //     src: TenSeat,
    //     scale: 0.10,
    //     anchor: [0.5, 1],
    //   }),
    // });
    return new Style({
      geometry: point,
      image: new Icon({
        src: TenSeat,
        scale: 0.1,
        anchor: [0.5, 1],
      }),
      text: new Text({
        text: String(feature.get("toiletCount") ?? ""),
        offsetY: -15,
        font: "bold 12px sans-serif",
        fill: new Fill({ color: "#111827" }),
        stroke: new Stroke({ color: "#ffffff", width: 3 }),
      }),
    });

  };

  const runAnalysis = (selectedPriorities, totalCabinsRequired) => {
    const layer = suitableLandRef.current;
    const source = layer.getSource();
    const features = source.getFeatures();

    const columns = selectedPriorities.map((p) => priorityMap[p]);

    let data = [];

    // STEP 1: Extract data
    features.forEach((f, index) => {
      let values = [];
      let valid = true;

      columns.forEach((col) => {
        const val = f.get(col);
        if (val == null) valid = false;
        else values.push(val);
      });

      if (valid) {
        data.push({
          feature: f,
          values,
        });
      }
    });

    // STEP 2: Normalize
    for (let i = 0; i < columns.length; i++) {
      const colVals = data.map((d) => d.values[i]);
      const min = Math.min(...colVals);
      const max = Math.max(...colVals);

      data.forEach((d) => {
        if (max - min === 0) d.values[i] = 0;
        else d.values[i] = (d.values[i] - min) / (max - min);
      });
    }

    // STEP 3: Score
    data.forEach((d) => {
      d.score = d.values.reduce((a, b) => a + b, 0) / d.values.length;
    });

    // STEP 4: Sort (LOWER = better like your Python)
    data.sort((a, b) => a.score - b.score);

    const topN = Math.floor(data.length * 0.05);
    const selected = data.slice(0, topN);

    // ✅ NEW STEP: Sort top 20% by PRIORITY (HIGH → LOW)
    selected.sort((a, b) => b.priority - a.priority);

    // STEP 5: Allocate cabins
    const gridArea = 100;
    const cabinArea = 9;
    const maxCabinsPerGrid = Math.min(Math.floor(gridArea / cabinArea), 10);

    let cabinsRemaining = totalCabinsRequired;

    let selectedFeatures = [];

    for (let d of selected) {
      if (cabinsRemaining <= 0) break;

      const assign = Math.min(maxCabinsPerGrid, cabinsRemaining);
      cabinsRemaining -= assign;

      // selectedFeatures.push(d.feature);////****** */
      const featureClone = d.feature.clone();
      featureClone.set("toiletCount", assign);
      selectedFeatures.push(featureClone);

    }

    return selectedFeatures;
  };

  const handleBufferEnabled = (mode) => {
    if (mode === "analysis" || mode === "ml") {
      bufferEnabledRef.current = true;
    } else if (mode === null) {
      bufferEnabledRef.current = false;

      // 🔹 Also clear any existing buffer & popup on the map
      window.dispatchEvent(new CustomEvent("clear-buffer-graphics"));
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="h-24 flex-shrink-0">
        <Header />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR */}
        <Suspense fallback={<div>Loading...</div>}>
          <div className="w-72 h-full overflow-y-auto bg-gradient-to-b from-[#0f2a44] to-[#133b5c]">
            <Sidebar
              bufferValue={bufferValue}
              bottleneckZone={bottleNeckZone}
              setBottleneckZone={setBottleNeckZone}
              setBufferValue={setBufferValue}
              setBuffer={setBuffer}
              setSelectedLayers={setSelectedTypes}
              analysisLayers={analysisLayers}
              setAnalysisLayers={setAnalysisLayers}
              showAnalysisOptions={showAnalysisOptions}
              bufferEnabled={bufferEnabled}
              handleBufferEnabled={handleBufferEnabled}
            />
          </div>
        </Suspense>

        {/* MAP (NO SCROLL) */}
        <Suspense fallback={<div>Loading...</div>}>
          <div className="flex-1 h-full overflow-hidden">
            <OpenLayerMap
              buffer={buffer}
              analysisBuffer={bufferValue.analysis}
              bottleneckZone={bottleNeckZone}
              mlBuffer={bufferValue.ml}
              selectedTypes={selectedTypes}
              updateAnalysis={updateAnalysis}
              setAnalysisData={setAnalysisData}
              setSelectedFeature={setSelectedFeature}
              analysisLayers={analysisLayers}
              setBufferResults={setBufferResults}
              bufferEnabledRef={bufferEnabledRef}
            />
          </div>
        </Suspense>

        {/* RIGHT PANEL */}
        <Suspense fallback={<div>Loading...</div>}>
          <div className="w-[350px] h-full overflow-y-auto bg-[#0f2a44]">
            <AnalysisPanel
              buffer={buffer}
              selectedTypes={selectedTypes}
              analysisData={analysisData}
              selectedFeature={selectedFeature}
              setAnalysisLayers={setAnalysisLayers}
              analysisLayers={analysisLayers}
              bufferResults={bufferResults}
              setShowAnalysisOptions={setShowAnalysisOptions}
              showLandSuitableDropdown={showLandSuitableDropdown}
              setShowLandSuitableDropdown={setShowLandSuitableDropdown}
              proximity={proximity}
              setProximity={setProximity}
              toiletSheet={toiletSheet}
              setToiletSheet={setToiletSheet}
              handleToiletAnalysis={handleToiletAnalysis}
            />
          </div>
        </Suspense>
      </div>
    </div>
  );
}
