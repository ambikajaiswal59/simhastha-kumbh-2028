import { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import OpenLayerMap from "../map/OpenLayerMap";
import AnalysisPanel from "../analysis/AnalysisPanel";

export default function MainLayout() {
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
  const [proximity, setProximity] = useState("");

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

  const handleToiletAnalysis = () => {
    alert(
      `This is the no of toilet sheet ${toiletSheet} with aproximity with the ${proximity}`,
    );
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
