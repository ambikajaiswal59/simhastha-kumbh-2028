import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import OpenLayerMap from "../map/OpenLayerMap";
import AnalysisPanel from "../analysis/AnalysisPanel";
import { Layer } from "ol/layer";

export default function MainLayout() {
  const [buffer, setBuffer] = useState(5);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [layer, setLayer] = useState(null);

  const [analysisData, setAnalysisData] = useState({});

  const [selectedFeature, setSelectedFeature] = useState(null);

  // 🔥 Update analysis data
  const updateAnalysis = (type, data) => {
    setAnalysisData((prev) => ({
      ...prev,
      [type]: data,
    }));
  };

  return (
    <div className="h-screen flex flex-col">
      <Header />

      <div className="flex flex-1">
        <Sidebar setBuffer={setBuffer} setSelectedLayers={setSelectedTypes} />
        <div className="flex-1">
          <OpenLayerMap
            buffer={buffer}
            selectedTypes={selectedTypes}
            updateAnalysis={updateAnalysis}
            setSelectedFeature={setSelectedFeature}
            layer={layer}
            setLayer={setLayer}
          />
        </div>

        <AnalysisPanel
          buffer={buffer}
          selectedTypes={selectedTypes}
          analysisData={analysisData}
          selectedFeature={selectedFeature}
          setLayer={setLayer}
          layer={layer}
        />
      </div>
    </div>
  );
}