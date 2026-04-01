import { useState, useEffect } from "react";
import { API } from "../../config/api";
import { Switch } from "@mui/material";

export default function Sidebar({
  setSelectedLayers,
  setBuffer,
  setGridSize,
  setWeights,
  setAnalysisLayers,
  analysisLayers,
  showAnalysisOptions,
  bufferEnabled,
  handleBufferEnabled,
}) {
  const [layers, setLayers] = useState([]);
  const [selected, setSelected] = useState([{ table_name: "road_network3" }]);
  const [analysisTargetLayer, setAnalysisTargetLayer] = useState([]);
  const [bufferValue, setBufferValue] = useState(300);

  const [accordionOpen, setAccordionOpen] = useState({
    layers: true,
    buffer: false,
    analysis: false,
  });

  const [gridSize, updateGridSize] = useState(50);

  const [weightsState, updateWeights] = useState({
    temple: 5,
    parking: 3,
    junction: 2,
    hotel: 2,
    building: 1,
  });

  const allowedLayers = [
    "road_network3",
    "toilets_sanitation",
    "police_station",
    "parking_loc",
    "temple_ujjain",
    "junction",
    "scenerio",
  ];

  const layerLabelMap = {
    toilets_sanitation: "Toilet",
    police_station: "Police Station",
    parking_loc: "Parking ",
    road_network3: "Road",
    temple_ujjain: "Temple",
    junction: "Junctions",
    scenerio: "Scenerio",
  };

  const findLayerByName = (data, name) =>
    data.find((l) => l.table_name === name);

  const handleLayerData = (data) => {
    if (!data?.data) return;

    const filtered = allowedLayers
      .map((name) => findLayerByName(data.data, name))
      .filter(Boolean);

    setLayers(filtered);

    const defaultLayer = filtered.find((l) => l.table_name === "road_network3");

    if (defaultLayer) {
      setSelected([defaultLayer]);
      setSelectedLayers(["road_network3"]);
    }
  };

  useEffect(() => {
    fetch(API.layerList, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then((res) => res.json())
      .then(handleLayerData)
      .catch(console.error);
  }, []);

  const handleSelect = (layer) => {
    let updated;
    debugger;
    const exists = selected.find((l) => l.table_name === layer.table_name);

    if (exists) {
      updated = selected.filter((l) => l.table_name !== layer.table_name);

      //  RESET ANALYSIS if toilets removed
      if (layer.table_name === "toilets_sanitation") {
        setAnalysisLayers({
          demand: false,
          supply: false,
        });
      }
    } else {
      updated = [...selected, layer];
    }

    setSelected(updated);
    setSelectedLayers(updated.map((l) => l.table_name));
  };

  const toggleAccordion = (key) =>
    setAccordionOpen((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

  const updateWeightValue = (key, value) => {
    const updated = { ...weightsState, [key]: value };

    updateWeights(updated);
    setWeights(updated);
  };
  const hasSitePriority = analysisLayers.site_priority;

  return (
    <div className="w-72 h-full flex flex-col text-white bg-gradient-to-b from-[#0f2a44] to-[#133b5c]">
      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto p-5 pr-4 space-y-6">
        {/* ================= LAYER LIST ================= */}
        <div>
          <button
            onClick={() => toggleAccordion("layers")}
            className="w-full flex justify-between items-center 
        bg-white/10 hover:bg-white/20 
        px-3 py-2 rounded-lg 
        text-orange-300 font-semibold text-sm
        border border-white/10 transition"
          >
            <span>Layer List</span>
            <span>{accordionOpen.layers ? "▾" : "▸"}</span>
          </button>

          <div
            className={`mt-3 space-y-1 overflow-hidden transition-all duration-300
        ${accordionOpen.layers ? "max-h-[500px]" : "max-h-0"}`}
          >
            {layers.map((layer) => {
              const isSelected = selected.find(
                (l) => l.table_name === layer.table_name,
              );

              return (
                <div key={layer.layer_id}>
                  {/* MAIN CHECKBOX */}
                  <label
                    className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm
                ${
                  isSelected
                    ? "bg-white/10 border border-orange-400/20"
                    : "hover:bg-white/5"
                }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!isSelected}
                        onChange={() => handleSelect(layer)}
                      />
                      <span>{layerLabelMap[layer.table_name]}</span>
                    </div>
                  </label>

                  {/* SUB OPTIONS */}
                  {layer.table_name === "toilets_sanitation" &&
                    showAnalysisOptions && (
                      <div className="ml-5 mt-1 space-y-1 text-xs">
                        {[
                          { key: "demand", label: "Demand" },
                          { key: "supply", label: "Supply" },
                        ].map((item) => (
                          <label
                            key={item.key}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={analysisLayers[item.key]}
                              onChange={(e) =>
                                setAnalysisLayers((prev) => ({
                                  ...prev,
                                  [item.key]: e.target.checked,
                                }))
                              }
                            />
                            {item.label}
                          </label>
                        ))}

                        {hasSitePriority && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={analysisLayers.site_priority}
                              onChange={(e) =>
                                setAnalysisLayers((prev) => ({
                                  ...prev,
                                  site_priority: e.target.checked,
                                }))
                              }
                            />
                            Site Priority
                          </label>
                        )}
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>
        {/**=====================  Buffer Analysis ============================*/}
        <div>
          <button
            onClick={() => toggleAccordion("buffer")}
            className="w-full flex justify-between items-center 
        bg-white/10 hover:bg-white/20 
        px-3 py-2 rounded-lg 
        text-orange-300 font-semibold text-sm
        border border-white/10 transition"
          >
            <span>Buffer analysis</span>
            <span>{accordionOpen.buffer ? "▾" : "▸"}</span>
          </button>

          <div
            className={`mt-3 overflow-hidden transition-all duration-300
        ${accordionOpen.buffer ? "max-h-[500px]" : "max-h-0"}`}
          >
            <div className="mt-3 p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs uppercase text-orange-300">
                    Buffer Distance
                  </h4>

                  <Switch
                    checked={bufferEnabled}
                    onChange={handleBufferEnabled}
                    size="small"
                  />
                </div>

                <input
                  type="range"
                  min="100"
                  max="500"
                  step="50"
                  value={bufferValue}
                  onChange={(e) => {
                    const meters = Number(e.target.value);
                    setBufferValue(meters);
                    setBuffer(meters / 1000);
                  }}
                  className="w-full accent-orange-400"
                />

                <div className="text-center mt-2 text-xs bg-white/10 px-2 py-1 rounded">
                  {bufferValue} meters
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* ================= ANALYSIS SETTINGS ================= */}
        <div>
          <button
            onClick={() => toggleAccordion("analysis")}
            className="w-full flex justify-between items-center 
        bg-white/10 hover:bg-white/20 
        px-3 py-2 rounded-lg 
        text-cyan-300 font-semibold text-sm
        border border-white/10 transition"
          >
            <span>Analysis Settings</span>
            <span>{accordionOpen.analysis ? "▾" : "▸"}</span>
          </button>

          <div
            className={`mt-3 overflow-hidden transition-all duration-300
        ${
          accordionOpen.analysis
            ? "max-h-[900px] opacity-100"
            : "max-h-0 opacity-0"
        }`}
          >
            <div className="mt-3 p-4 bg-white/5 rounded-xl border border-white/10 space-y-6">
              {/* ANALYSIS LAYER */}
              <div>
                <h4 className="text-xs uppercase text-yellow-300 mb-2">
                  Analysis Layer
                </h4>

                <div className="space-y-1">
                  {layers.map((layer) => {
                    const isChecked = analysisTargetLayer.includes(
                      layer.table_name,
                    );

                    return (
                      <label
                        key={layer.layer_id}
                        className={`flex justify-between items-center px-3 py-2 rounded-md text-sm cursor-pointer
                    ${
                      isChecked
                        ? "bg-yellow-500 text-white"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                      >
                        <span>{layerLabelMap[layer.table_name]}</span>

                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setAnalysisTargetLayer((prev) =>
                              isChecked
                                ? prev.filter((n) => n !== layer.table_name)
                                : [...prev, layer.table_name],
                            );
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* BUFFER */}
              {/* <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs uppercase text-orange-300">
                    Buffer Distance
                  </h4>

                  <Switch
                    checked={bufferEnabled}
                    onChange={handleBufferEnabled}
                    size="small"
                  />
                </div>

                <input
                  type="range"
                  min="100"
                  max="500"
                  step="50"
                  value={bufferValue}
                  onChange={(e) => {
                    const meters = Number(e.target.value);
                    setBufferValue(meters);
                    setBuffer(meters / 1000);
                  }}
                  className="w-full accent-orange-400"
                />

                <div className="text-center mt-2 text-xs bg-white/10 px-2 py-1 rounded">
                  {bufferValue} meters
                </div>
              </div> */}

              {/* GRID SIZE */}
              <div className="border-t border-white/10 pt-4">
                <h4 className="text-xs uppercase text-cyan-300 mb-2">
                  Grid Size
                </h4>

                <div className="flex gap-2">
                  {[50, 100, 150].map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        updateGridSize(size);
                        setGridSize(size);
                      }}
                      className={`px-3 py-1 text-xs rounded-md border transition
                  ${
                    gridSize === size
                      ? "bg-cyan-500 text-white border-cyan-500"
                      : "border-white/30 hover:border-cyan-300"
                  }`}
                    >
                      {size} m
                    </button>
                  ))}
                </div>
              </div>

              {/* WEIGHTS */}
              <div className="border-t border-white/10 pt-4">
                <h4 className="text-xs uppercase text-purple-300 mb-2">
                  Weight Settings
                </h4>

                <div className="space-y-2">
                  {Object.keys(weightsState).map((key) => (
                    <div
                      key={key}
                      className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-md"
                    >
                      <span className="capitalize text-sm">{key}</span>

                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={weightsState[key]}
                        onChange={(e) =>
                          updateWeightValue(key, Number(e.target.value))
                        }
                        className="w-12 text-black text-center rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
