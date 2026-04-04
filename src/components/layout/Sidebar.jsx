import { useState, useEffect } from "react";
import { API } from "../../config/api";
import { Switch } from "@mui/material";

export default function Sidebar({
  bufferValue,
  setBufferValue,
  setSelectedLayers,
  setBuffer,
  setGridSize,
  setWeights,
  setAnalysisLayers,
  analysisLayers,
  showAnalysisOptions,
  bufferEnabled,
  handleBufferEnabled,
  bottleneckZone,
  setBottleneckZone,
}) {
  const [layers, setLayers] = useState([]);
  const [selected, setSelected] = useState([{ table_name: "road_network3" }]);
  const [analysisTargetLayer, setAnalysisTargetLayer] = useState([]);

  const [accordionOpen, setAccordionOpen] = useState({
    layers: true,
    analysis: false,
    mlLayer: false,
  });

  const [gridSize, setUpdateGridSize] = useState(50);

  const [weightsState, setUpdateWeights] = useState({
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
    temple_ujjain: "Temple Ujjain",
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

    setUpdateWeights(updated);
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
                    htmlFor={layer.layer_id}
                    className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm
                ${
                  isSelected
                    ? "bg-white/10 border border-orange-400/20"
                    : "hover:bg-white/5"
                }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        id={layer.layer_id}
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
                          { key: "supply", label: "Supply" },
                          { key: "demand", label: "Demand" },
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
                  value={bufferValue.analysis.value}
                  onChange={(e) => {
                    const meters = Number(e.target.value);
                    setBufferValue((prev) => ({
                      ...prev,
                      analysis: {
                        ...prev.analysis,
                        value: meters,
                      },
                    }));
                    setBuffer(meters / 1000);
                  }}
                  className="w-full accent-orange-400"
                />

                <div>{bufferValue.analysis.value} meters</div>
              </div>

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
                        setUpdateGridSize(size);
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

        {/* ================= ML Layer ================= */}
        <div>
          <button
            onClick={() => toggleAccordion("mlLayer")}
            className="w-full flex justify-between items-center 
          bg-white/10 hover:bg-white/20 
          px-3 py-2 rounded-lg 
          text-green-300 font-semibold text-sm
          border border-white/10 transition"
          >
            <span>AI/ML Layer</span>
            <span>{accordionOpen.mlLayer ? "▾" : "▸"}</span>
          </button>

          <div
            className={`mt-3 overflow-hidden transition-all duration-300
              ${
                accordionOpen.mlLayer
                  ? "max-h-[900px] opacity-100"
                  : "max-h-0 opacity-0"
              }`}
          >
            <div className="mt-3 p-4 bg-white/5 rounded-xl border border-white/10 space-y-6">
              {/* ===== LAYER SELECTION ===== */}
              <div>
                <h4 className="text-xs uppercase text-yellow-300 mb-3">
                  Select Layers
                </h4>

                <div className="space-y-2 text-sm">
                  {/* EMPTY SPACE CHECKBOX */}
                  <label htmlFor="empty-space" className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                    <span className="flex items-center gap-2">
                      <input
                        id="empty-space"
                        type="checkbox"
                        checked={analysisLayers.emptySpace}
                        onChange={() =>
                          setAnalysisLayers((prev) => ({
                            ...prev,
                            emptySpace: !prev.emptySpace,
                          }))
                        }
                      />
                      <span>Empty Space</span>
                    </span>
                  </label>

                  {/* BOTTLENECK CHECKBOX */}
                  <label htmlFor="bottleneck-checkbox" className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                    <span className="flex items-center gap-2">
                      <input
                        id="bottleneck-checkbox"
                        type="checkbox"
                        checked={analysisLayers.bottleneck}
                        onChange={(e) =>
                          setAnalysisLayers((prev) => ({
                            ...prev,
                            bottleneck: e.target.checked,
                          }))
                        }
                      />
                      <span>Bottleneck</span>
                    </span>
                  </label>

                  {analysisLayers.bottleneck && (
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10 mt-2">
                      {/* 👇 Show config ONLY when enabled */}
                      <div className="mt-3 space-y-2">
                        <label htmlFor="bottleneck-zone" className="text-xs text-gray-300">
                          Bottleneck Zone
                        </label>

                        <select
                          id="bottleneck-zone"
                          value={bottleneckZone}
                          onChange={(e) => setBottleneckZone(e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-orange-500"
                        >
                          <option value="ALL">All Areas</option>
                          <option value="CORE">Core Only</option>
                          <option value="BUFFER">Within Buffer</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ===== COMMON BUFFER (VISIBLE IF ANY LAYER SELECTED) ===== */}
              {(analysisLayers.emptySpace || analysisLayers.bottleneck) && (
                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-xs uppercase text-orange-300 mb-2">
                    Buffer Distance
                  </h4>

                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="30"
                    value={bufferValue.ml.value}
                    onChange={(e) => {
                      const meters = Number(e.target.value);

                      setBufferValue((prev) => ({
                        ...prev,
                        ml: {
                          ...prev.ml,
                          value: meters,
                          enabled: true,
                        },
                      }));
                    }}
                    className="w-full accent-orange-400"
                  />

                  <div className="text-center mt-2 text-xs bg-white/10 px-2 py-1 rounded">
                    {bufferValue.ml.value} meters
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
