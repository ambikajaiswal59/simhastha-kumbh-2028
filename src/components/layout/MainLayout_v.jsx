import { useState } from "react";

import Header from "./Header";
import Sidebar from "./Sidebar";
import OpenLayerMap from "../map/OpenLayerMap";
import AnalysisPanel from "../analysis/AnalysisPanel";

export default function MainLayout() {

  const [analysisMode, setAnalysisMode] = useState(null);
  const [buffer, setBuffer] = useState(5);
  const [type, setType] = useState([]);

  return (
    <div className="h-screen flex flex-col">

      <Header />

      <div className="flex flex-1">

        <Sidebar
          setBuffer={setBuffer}
          setType={setType}

        />

        <div className="flex-1">
          <OpenLayerMap
            buffer={buffer}
            type={type}

            analysisMode={analysisMode}
          />
        </div>

        <AnalysisPanel
          buffer={buffer}
          selectedTypes={type}
          analysisMode={analysisMode}
          setAnalysisMode={setAnalysisMode}
        />

      </div>
    </div>
  );
}
