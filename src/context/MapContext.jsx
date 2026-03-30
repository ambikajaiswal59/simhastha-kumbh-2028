import { createContext, useContext, useRef, useState } from "react";

const MapContext = createContext();

export const MapContextProvider = ({ children }) => {
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const suitableLandRef = useRef(null);
  const highlightLayerRef = useRef(null);
  const bufferLayerRef = useRef(null);
  const scenerioSanitationRef = useRef(null);
  const clickMarkerLayerRef = useRef(null);
  const [analysingSitePriority, setAnalysingSitePriority] = useState(false);

  return (
    <MapContext.Provider
      value={{
        mapRef,
        mapObj,
        suitableLandRef,
        highlightLayerRef,
        bufferLayerRef,
        scenerioSanitationRef,
        analysingSitePriority,
        clickMarkerLayerRef,
        setAnalysingSitePriority,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = () => useContext(MapContext);
