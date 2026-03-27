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
    gap: false,
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
  <div className="h-screen flex flex-col overflow-hidden">

    {/* HEADER */}
    <Header />

    {/* MAIN CONTENT AREA */}
    <div className="flex flex-1 overflow-hidden">

      {/* LEFT SIDEBAR (scrollable only) */}
      <div className="w-72 h-screen min-h-full overflow-y-auto overflow-x-hidden bg-gradient-to-b from-[#0f2a44] to-[#133b5c]">
        <Sidebar
          setBuffer={setBuffer}
          setSelectedLayers={setSelectedTypes}
          analysisLayers={analysisLayers}
          setAnalysisLayers={setAnalysisLayers}
          showAnalysisOptions={showAnalysisOptions}
        />
      </div>

      {/* MAP PANEL */}
      <div className="flex-1 h-full overflow-hidden">
        <OpenLayerMap
          buffer={buffer}
          selectedTypes={selectedTypes}
          updateAnalysis={updateAnalysis}
          setSelectedFeature={setSelectedFeature}
          analysisLayers={analysisLayers}
          setBufferResults={setBufferResults}
        />
      </div>

      {/* RIGHT ANALYSIS PANEL */}
      <div className="w-80 h-full overflow-y-auto overflow-x-hidden">
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

  </div>
);
}
