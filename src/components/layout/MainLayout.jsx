import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import OpenLayerMap from "../map/OpenLayerMap";
import AnalysisPanel from "../analysis/AnalysisPanel";


export default function MainLayout() {
  const [buffer, setBuffer] = useState(5);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showAnalysisOptions, setShowAnalysisOptions] = useState(false);
  const [analysisLayers, setAnalysisLayers] = useState({
    demand: false,
    supply: false,
  });
  const [analysisData, setAnalysisData] = useState({});

  const [selectedFeature, setSelectedFeature] = useState(null);

  // 🔥 Update analysis data
  const updateAnalysis = (type, data) => {
    setAnalysisData((prev) => ({
      ...prev,
      [type]: data,
    }));
  };
console.log("AnalysisPanel Props:", {
  analysisData,
  selectedTypes,
  selectedFeature,
  analysisLayers
});
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
          />
        </div>

        <AnalysisPanel
          buffer={buffer}
          selectedTypes={selectedTypes}
          analysisData={analysisData}
          selectedFeature={selectedFeature}
          setAnalysisLayers={setAnalysisLayers}
          analysisLayers={analysisLayers}
          setShowAnalysisOptions={setShowAnalysisOptions}
        />
      </div>
    </div>
  );
}
