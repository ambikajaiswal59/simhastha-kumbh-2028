import { useState, useEffect } from "react";
import { API } from "../../config/api";
import { Switch } from "@mui/material";
import Dashboard from "../../pages/Dashboard";

export default function Sidebar({
  bufferValue,
  setBufferValue,
  setSelectedLayers,
  setBuffer,
  setAnalysisLayers,
  analysisLayers,
  showAnalysisOptions,
  bufferEnabled,
  handleBufferEnabled,
  bottleneckZone,
  setBottleneckZone,
  gridSize,
  setGridSize,
  analysisTargetLayer,
  setAnalysisTargetLayer,
  weightsState,
  setWeightsState,
  onRunDemand,
  onRunSupply,
}) {
  const [layers, setLayers] = useState([]);
  const [selected, setSelected] = useState([{ table_name: "road_network3" }]);

  const [accordionOpen, setAccordionOpen] = useState({
    layers: true,
    buffer: false,
    analysis: false,
    mlLayer: false,
  });

  const [activeBufferType, setActiveBufferType] = useState("");
  const [activeSwitcher, setActiveSwitcher] = useState("layer");
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
    toilets_sanitation: "Toilets",
    police_station: "Police Stations",
    parking_loc: "Parking Areas",
    road_network3: "Roads",
    temple_ujjain: "Temples",
    junction: "Junctions",
    scenerio: "Scenarios",
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

  useEffect(() => {
    const isAnyMLLayerSelected =
      analysisLayers.emptySpace || analysisLayers.bottleneck;

    if (isAnyMLLayerSelected) {
      setBufferValue((prev) => ({
        ...prev,
        ml: { ...prev.ml, enabled: true },
        analysis: { ...prev.analysis, enabled: false },
      }));

      setActiveBufferType("ml");

      // 🔥 sync UI
      setAccordionOpen((prev) => ({
        ...prev,
        mlLayer: true,
        buffer: true,
        layers: false,
      }));
    }
  }, [analysisLayers.emptySpace, analysisLayers.bottleneck]);
  const handleSelect = (layer) => {
    let updated;

    const exists = selected.find((l) => l.table_name === layer.table_name);

    if (exists) {
      updated = selected.filter((l) => l.table_name !== layer.table_name);

      //  RESET ANALYSIS if toilets removed
      if (layer.table_name === "toilets_sanitation") {
        setAnalysisLayers({
          demand: false,
          supply: false,
          open_area: false,
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

    setWeightsState(updated);
  };

  useEffect(() => {
    setAccordionOpen((prev) => ({
      ...prev,
      mlLayer: bufferValue.ml.enabled, // open when ON, close when OFF
    }));
  }, [bufferValue.ml.enabled]);
  const hasSitePriority = analysisLayers.site_priority;
  const isMLUIBlocked = bufferValue.analysis.enabled || !bufferValue.ml.enabled;

  // Check for required props/state before rendering to avoid runtime errors
  if (
    !layers ||
    !selected ||
    !analysisLayers ||
    !bufferValue ||
    !accordionOpen ||
    !weightsState ||
    !setBufferValue ||
    !setAccordionOpen ||
    !setAnalysisLayers ||
    !setActiveBufferType ||
    !setSelected ||
    !setSelectedLayers ||
    !setBuffer ||
    !setBottleneckZone ||
    !setAnalysisTargetLayer ||
    !setWeightsState ||
    !layerLabelMap
  ) {
    return (
      <div className="text-red-500 p-4">
        Error: Sidebar is missing required data or handlers.
      </div>
    );
  }

  return (
    <div className="flex-col text-white bg-gradient-to-b from-[#0f2a44] to-[#133b5c] shadow-2xl border-r border-cyan-500/25">
      {/* SWITCHER BUTTONS */}
      <div className="flex gap-2 px-2 pt-2 pb-2 bg-gradient-to-r from-[#122b45]/90 via-[#173c60]/90 to-[#112233]/60 shadow rounded-b-xl">
        <button
          className={`flex-1 py-1.5 rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-400/80 text-base
            ${
              activeSwitcher === "layer"
                ? "bg-gradient-to-br from-orange-500 to-yellow-400 text-white shadow scale-105 ring-2 ring-orange-300/45"
                : "bg-[#183e60]/80 text-orange-200 hover:bg-orange-400/75 hover:text-white hover:scale-105 border border-orange-300/10"
            }
          `}
          aria-pressed={activeSwitcher === "layer"}
          onClick={() => setActiveSwitcher("layer")}
        >
          Layer Analysis
        </button>
        <button
          className={`flex-1 py-1.5 rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-400/80 text-base
            ${
              activeSwitcher === "routing"
                ? "bg-gradient-to-br from-orange-500 to-yellow-400 text-white shadow scale-105 ring-2 ring-orange-300/45"
                : "bg-[#183e60]/80 text-orange-200 hover:bg-orange-400/75 hover:text-white hover:scale-105 border border-orange-300/10"
            }
          `}
          aria-pressed={activeSwitcher === "routing"}
          onClick={() => setActiveSwitcher("routing")}
        >
          Routing
        </button>
      </div>

      {/* LAYER ANALYSIS CONTENT */}
      {activeSwitcher === "layer" && (
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
                            { key: "open_area", label: "Open Area" },
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
            {/* ===== ACCORDION HEADER ===== */}
            <button
              onClick={() => toggleAccordion("buffer")}
              className="w-full flex justify-between items-center 
              bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg 
              text-orange-300 font-semibold text-sm border border-white/10 transition"
            >
              <span>Buffer Analysis</span>
              <span>{accordionOpen.buffer ? "▾" : "▸"}</span>
            </button>

            {/* ===== ACCORDION BODY ===== */}
            <div
              className={`mt-3 overflow-hidden transition-all duration-300 ${
                accordionOpen.buffer ? "max-h-[600px]" : "max-h-0"
              }`}
            >
              <div className="mt-3 p-4 bg-white/5 rounded-xl border border-white/10 space-y-5">
                {/* ===== TOGGLES ===== */}
                <div className="space-y-3">
                  {/* ANALYSIS TOGGLE */}
                  <div className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                    <span className="text-sm text-cyan-300 flex items-center gap-2">
                      Analysis
                    </span>
                    <button
                      onClick={() => {
                        const enabled = !bufferValue.analysis.enabled;
                        setBufferValue((prev) => ({
                          ...prev,
                          analysis: { ...prev.analysis, enabled },
                          // If Analysis is ON, ML buffer must be OFF
                          ml: {
                            ...prev.ml,
                            enabled: enabled ? false : prev.ml.enabled,
                          },
                        }));
                        if (enabled) {
                          setActiveBufferType("analysis");
                          handleBufferEnabled("analysis");
                          setAnalysisLayers((prev) => ({
                            ...prev,
                            emptySpace: false,
                            bottleneck: false,
                          }));
                          setBottleneckZone("ALL");
                          setAccordionOpen((prev) => ({
                            ...prev,
                            mlLayer: false,
                          }));
                        } else {
                          setActiveBufferType(null);
                          handleBufferEnabled(null);
                        }
                      }}
                      className={`w-10 h-5 flex items-center rounded-full p-1 transition ${
                        bufferValue.analysis.enabled
                          ? "bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                          : "bg-gray-500"
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full transition ${
                          bufferValue.analysis.enabled ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>
                  {/* AI/ML TOGGLE */}
                  <div className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                    <span className="text-sm text-green-300 flex items-center gap-2">
                      AI/ML Layer
                    </span>
                    <button
                      onClick={() => {
                        const isCurrentlyOn = bufferValue.ml.enabled;
                        window.dispatchEvent(
                          new CustomEvent("close-core-analysis"),
                        );
                        window.dispatchEvent(
                          new CustomEvent("clear-buffer-graphics"),
                        );

                        // Toggle ML buffer + force Analysis buffer OFF
                        setBufferValue((prev) => ({
                          ...prev,
                          ml: { ...prev.ml, enabled: !isCurrentlyOn },
                          analysis: { ...prev.analysis, enabled: false },
                        }));
                        if (isCurrentlyOn) {
                          setAnalysisLayers({
                            emptySpace: false,
                            bottleneck: false,
                          });
                          setBottleneckZone("ALL");
                          setActiveBufferType(null);
                          handleBufferEnabled(null);
                        } else {
                          handleBufferEnabled("ml");
                          setActiveBufferType("ml");
                          setAccordionOpen((prev) => ({
                            ...prev,
                            mlLayer: true,
                            layers: false,
                            buffer: false,
                          }));
                        }
                      }}
                      className={`w-10 h-5 flex items-center rounded-full p-1 transition ${
                        bufferValue.ml.enabled
                          ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                          : "bg-gray-500"
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full transition ${
                          bufferValue.ml.enabled ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
                {/* ===== BUFFER SLIDER ===== */}
                <div className=" pt-4">
                  <h4 className="text-xs text-orange-300 mb-2">
                    Buffer Distance
                  </h4>
                  {(() => {
                    const isAnalysisActive = bufferValue.analysis.enabled;
                    const isMLActive =
                      bufferValue.ml.enabled &&
                      (analysisLayers.emptySpace || analysisLayers.bottleneck);
                    const isAnyActive = isAnalysisActive || isMLActive;
                    const activeValue = bufferValue.analysis.enabled
                      ? bufferValue.analysis.value
                      : bufferValue.ml.value;
                    return (
                      <>
                        <input
                          type="range"
                          min="100"
                          max="1000"
                          step="50"
                          disabled={!isAnyActive}
                          value={activeValue}
                          onChange={(e) => {
                            const meters = Number(e.target.value);
                            if (bufferValue.analysis.enabled) {
                              setBufferValue((prev) => ({
                                ...prev,
                                analysis: {
                                  ...prev.analysis,
                                  value: meters,
                                },
                              }));
                            }
                            if (bufferValue.ml.enabled) {
                              setBufferValue((prev) => ({
                                ...prev,
                                ml: {
                                  ...prev.ml,
                                  value: meters,
                                },
                              }));
                            }
                            setBuffer(meters / 1000);
                          }}
                          className={`w-full ${
                            isAnyActive
                              ? "accent-orange-400"
                              : "opacity-40 cursor-not-allowed"
                          }`}
                        />
                        <div className="text-center mt-2 text-xs bg-white/10 px-2 py-1 rounded">
                          {isAnyActive
                            ? `${activeValue} meters`
                            : "Buffer Disabled"}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
          {/* ================= AI/ML LAYER ================= */}
          <div>
            <button
              onClick={() => {
                if (!bufferValue.ml.enabled) return; // block click
                toggleAccordion("mlLayer");
              }}
              className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-sm font-semibold border transition
              ${
                bufferValue.ml.enabled
                  ? "bg-white/10 hover:bg-white/20 text-green-300 border-white/10"
                  : "bg-white/5 text-gray-500 border-white/5 cursor-not-allowed opacity-50"
              }
            `}
            >
              <span>AI/ML Layer</span>
              <span>{accordionOpen.mlLayer ? "▾" : "▸"}</span>
            </button>
            <div
              className={`mt-3 overflow-hidden transition-all duration-300 ${
                accordionOpen.mlLayer
                  ? "max-h-[900px] opacity-100"
                  : "max-h-0 opacity-0"
              } ${!bufferValue.ml.enabled ? "pointer-events-none opacity-40" : ""}`}
            >
              <div className="mt-3 p-4 bg-white/5 rounded-xl border border-white/10 space-y-6">
                <div>
                  <h4 className="text-xs  text-yellow-300 mb-3">
                    Select Layers
                  </h4>
                  {/* EMPTY SPACE */}
                  <label className="flex items-center justify-between bg-white/5 px-3 py-2 mb-3 rounded-lg border border-white/10">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!analysisLayers.emptySpace}
                        disabled={isMLUIBlocked}
                        onChange={() => {
                          if (isMLUIBlocked) return;
                          setAnalysisLayers((prev) => ({
                            ...prev,
                            emptySpace: !prev.emptySpace,
                          }));
                          setActiveBufferType("ml");
                          setAccordionOpen((prev) => ({
                            ...prev,
                            mlLayer: true,
                            layers: false,
                          }));
                        }}
                      />
                      <span>Empty Space</span>
                    </span>
                  </label>
                  {/* BOTTLENECK */}
                  <label className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!analysisLayers.bottleneck}
                        disabled={isMLUIBlocked}
                        onChange={(e) => {
                          if (isMLUIBlocked) return;
                          const checked = e.target.checked;
                          setAnalysisLayers((prev) => ({
                            ...prev,
                            bottleneck: checked,
                          }));
                          if (checked) {
                            setActiveBufferType("ml");
                            handleBufferEnabled(true);
                          }
                        }}
                      />
                      <span>Bottleneck</span>
                    </span>
                  </label>
                  {/* CONFIG */}
                  {analysisLayers.bottleneck && (
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10 mt-2">
                      <label className="text-xs text-gray-300">
                        Bottleneck Zone
                      </label>
                      <select
                        value={bottleneckZone}
                        onChange={(e) => setBottleneckZone(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-orange-500"
                      >
                        <option value="ALL">All Areas</option>
                        <option value="CORE">Core Only</option>
                        <option value="BUFFER">Within Buffer</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ================= ANALYSIS SETTINGS (PREVIOUS DESIGN, DYNAMIC WEIGHT SECTION) ================= */}
          <div>
            <button
              onClick={() => toggleAccordion("analysis")}
              className="w-full flex justify-between items-center px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-cyan-300 font-semibold text-sm border border-white/10 transition"
            >
              <span>Analysis Settings</span>
              <span>{accordionOpen.analysis ? "▾" : "▸"}</span>
            </button>
            <div
              className={`transition-all duration-300 ${
                accordionOpen.analysis
                  ? "max-h-[700px] opacity-100 mt-3 "
                  : "max-h-0 opacity-0 overflow-hidden"
              }`}
            >
              <div className="p-4 bg-white/10 rounded-xl border border-white/10 space-y-6">
                {/* ANALYSIS LAYER CHECKLIST */}
                <div>
                  <h4 className="text-xs uppercase text-yellow-400 mb-3 font-semibold">
                    Analysis Layers
                  </h4>
                  <div className="space-y-1">
                    {Array.isArray(layers) &&
                      layers.map((layer) => {
                        const isChecked =
                          Array.isArray(analysisTargetLayer) &&
                          analysisTargetLayer.includes(layer.table_name);
                        return (
                          <label
                            key={layer.layer_id || layer.table_name}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-sm border transition
                        ${
                          isChecked
                            ? "bg-yellow-100/60 text-yellow-900 border-yellow-400"
                            : "hover:bg-yellow-100/10 text-white border-white/10"
                        }`}
                          >
                            <input
                              type="checkbox"
                              checked={!!isChecked}
                              onChange={() => {
                                setAnalysisTargetLayer((prev) =>
                                  isChecked
                                    ? prev.filter((n) => n !== layer.table_name)
                                    : [...prev, layer.table_name],
                                );
                              }}
                              className="accent-yellow-400 w-4 h-4"
                            />
                            <span>
                              {layerLabelMap[layer.table_name] ||
                                layer.table_name}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* GRID SIZE */}
                <div>
                  <h4 className="text-xs uppercase text-cyan-400 mb-3 font-semibold">
                    Grid Size
                  </h4>
                  <div className="flex gap-2">
                    {[50, 100, 150].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setGridSize(size);
                        }}
                        className={`flex items-center justify-center min-w-[54px] min-h-[28px] px-4 py-1 rounded-md text-sm font-semibold shadow-sm border transition
                    ${
                      gridSize === size
                        ? "bg-cyan-400 text-white border-cyan-400 ring-2 ring-cyan-200"
                        : "bg-white/10 border-white/20 hover:bg-cyan-400/15 hover:border-cyan-300"
                    }`}
                      >
                        <span className="block">{size} meter</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* DYNAMIC WEIGHT SETTINGS */}
                {Array.isArray(analysisTargetLayer) &&
                  analysisTargetLayer.length > 0 && (
                    <div>
                      <h4 className="text-xs uppercase text-purple-400 font-semibold mb-3 tracking-widest">
                        Weight Settings
                      </h4>
                      <div className="flex flex-col gap-2">
                        {analysisTargetLayer.map((key) => (
                          <div
                            key={key}
                            className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg border border-white/15"
                          >
                            <span className="capitalize text-sm flex-1">
                              {layerLabelMap[key] || key}
                            </span>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={weightsState[key] ?? 0}
                              onChange={(e) =>
                                updateWeightValue(key, Number(e.target.value))
                              }
                              className={`w-14 text-black text-center rounded border ml-3 ${
                                (weightsState[key] ?? 0) === 0
                                  ? "bg-gray-200 text-gray-400"
                                  : "bg-white"
                              }`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={onRunDemand}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition"
                  >
                    Run Demand
                  </button>

                  <button
                    onClick={onRunSupply}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition"
                  >
                    Run Supply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSwitcher ==="routing" &&(
        <div>
          <Dashboard />
          </div>
      )}
    </div>
  );
}
