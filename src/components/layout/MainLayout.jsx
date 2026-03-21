import { useState } from "react";
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
  });
  const [analysisData, setAnalysisData] = useState({});

  const [selectedFeature, setSelectedFeature] = useState(null);
  const [bufferResults, setBufferResults] = useState([]);
  // 🔥 Update analysis data
  const updateAnalysis = (type, data) => {
    setAnalysisData((prev) => ({
      ...prev,
      [type]: data,
    }));
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

        <AnalysisPanel
          buffer={buffer}
          selectedTypes={selectedTypes}
          analysisData={analysisData}
          selectedFeature={selectedFeature}
          setAnalysisLayers={setAnalysisLayers}
          analysisLayers={analysisLayers}
          bufferResults={bufferResults}
          setShowAnalysisOptions={setShowAnalysisOptions}
        />
      </div>
    </div>
  );
}
