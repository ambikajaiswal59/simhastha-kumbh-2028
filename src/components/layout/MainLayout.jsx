import { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import OpenLayerMap from "../map/OpenLayerMap";
import AnalysisPanel from "../analysis/AnalysisPanel";
import { useMapContext } from "../../context/MapContext";
import { Stroke, Fill, Style } from "ol/style";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

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
  });
  const [analysisData, setAnalysisData] = useState({});

  const [selectedFeature, setSelectedFeature] = useState(null);
  const [bufferResults, setBufferResults] = useState([]);

  const [toiletSheet, setToiletSheet] = useState("");
  const [proximity, setProximity] = useState([]);

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
    road: "d_road",
    parking: "d_parking",
    toilet: "d_toilet",
    water: "d_water",
    medical: "d_medical",
    police: "d_police",
    electric: "d_electric",
    river: "d_river",
  };

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

  const handleToiletAnalysis = () => {
    debugger;
    setAnalysingSitePriority(true);
    const selectedFeatures = runAnalysis(proximity, toiletSheet);

    setTimeout(() => {
      highlightFeatures(selectedFeatures);
    }, 5000);
  };
  const highlightFeatures = (features) => {
    createHighlightLayer();

    const source = highlightLayerRef.current.getSource();

    source.clear();

    const clonedFeatures = features.map((f) => f.clone());

    source.addFeatures(clonedFeatures);
    setAnalysingSitePriority(false);
  };

  // const highlightFeatures = (features) => {
  //   createHighlightLayer();

  //   const source = highlightLayerRef.current.getSource();
  //   source.clear();

  //   const clonedFeatures = features.map((f) => f.clone());

  //   let index = 0;

  //   const addNextFeature = () => {
  //     if (index >= clonedFeatures.length) {
  //       setAnalysingSitePriority(false); // ✅ stop loader when done
  //       return;
  //     }

  //     source.addFeature(clonedFeatures[index]);
  //     index++;

  //     setTimeout(addNextFeature, 200); // ⏱ speed (lower = faster)
  //   };

  //   addNextFeature();
  // };

  const highlightStyle = new Style({
    stroke: new Stroke({
      color: "#8C00FF",
      width: 2,
    }),
    fill: new Fill({
      color: "rgba(140,0,255,0.3)",
    }),
  });

  const runAnalysis = (selectedPriorities, totalCabinsRequired) => {
    debugger;
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

      selectedFeatures.push(d.feature);
    }

    return selectedFeatures;
  };

  return (
    <div className="h-screen flex flex-col ">
      <Header />

      <div className="flex flex-1">
        <Sidebar
          setBuffer={setBuffer}
          setSelectedLayers={setSelectedTypes}
          analysisLayers={analysisLayers}
          setAnalysisLayers={setAnalysisLayers}
          showAnalysisOptions={showAnalysisOptions}
        />
        <div className="flex-1">
          <OpenLayerMap
            buffer={buffer}
            selectedTypes={selectedTypes}
            updateAnalysis={updateAnalysis}
            setSelectedFeature={setSelectedFeature}
            analysisLayers={analysisLayers}
            setBufferResults={setBufferResults}
          />
        </div>
        {selectedTypes.includes("toilets_sanitation") && (
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
        )}
      </div>
    </div>
  );
}
