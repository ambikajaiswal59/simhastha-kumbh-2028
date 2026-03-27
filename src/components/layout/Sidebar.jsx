import { useState, useEffect } from "react";
import { API } from "../../config/api";

export default function Sidebar({
  setSelectedLayers,
  setBuffer,
  setGridSize,
  setWeights,
  setAnalysisLayers,
  analysisLayers,
  showAnalysisOptions,
}) {
  const [layers, setLayers] = useState([]);
  const [selected, setSelected] = useState([{ table_name: "road_network3" }]);
  const [analysisTargetLayer, setAnalysisTargetLayer] = useState([]);
  const [bufferValue, setBufferValue] = useState(300);

  const [accordionOpen, setAccordionOpen] = useState({
    layers: true,
    analysis: true,
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
  ];

  const layerLabelMap = {
    toilets_sanitation: "Toilets Sanitation",
    police_station: "Police Station",
    parking_loc: "Parking",
    road_network3: "Road Network",
    temple_ujjain: "Temple Ujjain",
    junction: "Junctions",
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

    const exists = selected.find((l) => l.table_name === layer.table_name);

    if (exists) {
      updated = selected.filter((l) => l.table_name !== layer.table_name);

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

  return (
    <div className="w-72  text-white p-5 pr-8">
      {/* ================= LAYER LIST ================= */}

      <div>
        <button
          onClick={() => toggleAccordion("layers")}
          className="w-full flex justify-between items-center 
             bg-white/10 hover:bg-white/20 
             px-3 py-2 rounded-lg 
             text-orange-300 font-semibold tracking-wide 
             border border-white/10 transition"
        >
          <span>Layer List</span>

          <span className="text-lg">{accordionOpen.layers ? "▾" : "▸"}</span>
        </button>

        <div
          className={`mt-3 space-y-2 transition-all duration-300 overflow-hidden
            ${accordionOpen.layers ? "max-h-[600px]" : "max-h-0"}
            `}
        >
          {layers.map((layer) => (
            <div key={layer.layer_id}>
              {/* MAIN LAYER CHECKBOX */}

              <label
                className={`flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer
                  ${
                    selected.find((l) => l.table_name === layer.table_name)
                      ? "bg-white/10 border border-orange-400/20"
                      : "hover:bg-white/5"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={
                      !!selected.find((l) => l.table_name === layer.table_name)
                    }
                    onChange={() => handleSelect(layer)}
                  />

                  <span>{layerLabelMap[layer.table_name]}</span>
                </div>
              </label>

              {/* SUB CHECKBOXES (DEMAND / SUPPLY) */}

              {layer.table_name === "toilets_sanitation" &&
                selected.find((l) => l.table_name === "toilets_sanitation") &&
                showAnalysisOptions && (
                  <div className="ml-6 mt-1 space-y-1 text-xs">
                    {/* DEMAND */}

                    <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                      <input
                        type="checkbox"
                        checked={analysisLayers.demand}
                        onChange={(e) =>
                          setAnalysisLayers((prev) => ({
                            ...prev,
                            demand: e.target.checked,
                          }))
                        }
                      />
                      Demand Layer
                    </label>

                    {/* SUPPLY */}

                    <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                      <input
                        type="checkbox"
                        checked={analysisLayers.supply}
                        onChange={(e) =>
                          setAnalysisLayers((prev) => ({
                            ...prev,
                            supply: e.target.checked,
                          }))
                        }
                      />
                      Supply Layer
                    </label>
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>

      {/* ================= ANALYSIS SETTINGS ================= */}

      <div className="mt-6">
        <button
          onClick={() => toggleAccordion("analysis")}
          className="w-full flex justify-between items-center 
             bg-white/10 hover:bg-white/20 
             px-3 py-2 rounded-lg 
             text-cyan-300 font-semibold tracking-wide 
             border border-white/10 transition"
        >
          <span>Analysis Settings</span>

          <span className="text-lg">{accordionOpen.analysis ? "▾" : "▸"}</span>
        </button>

        <div
          className={`mt-4 space-y-6 bg-white/5 rounded-xl 
            transition-all duration-300 overflow-hidden
            ${
              accordionOpen.analysis
                ? "max-h-[900px] opacity-100"
                : "max-h-0 opacity-0"
            } p-4 border border-white/10
            `}
        >
          {/* ================= ANALYSIS LAYER MULTI SELECT ================= */}

          <div>
            <h4
              className="text-xs uppercase tracking-wider 
              text-yellow-300 mb-3"
            >
              Analysis Layer
            </h4>

            <div className="space-y-2">
              {layers.map((layer) => {
                const isChecked = analysisTargetLayer.includes(
                  layer.table_name,
                );

                return (
                  <label
                    key={layer.layer_id}
                    className={`flex items-center justify-between 
                      px-3 py-2 rounded-lg cursor-pointer text-sm transition
          
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
                        if (isChecked) {
                          setAnalysisTargetLayer((prev) =>
                            prev.filter((name) => name !== layer.table_name),
                          );
                        } else {
                          setAnalysisTargetLayer((prev) => [
                            ...prev,
                            layer.table_name,
                          ]);
                        }
                      }}
                    />
                  </label>
                );
              })}
            </div>
          </div>
          {/* ================= BUFFER ================= */}

          <div className="border-t border-white/10 pt-4">
            <h4
              className="text-xs uppercase tracking-wider 
                   text-orange-300 mb-3"
            >
              Buffer Distance
            </h4>

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

            <div
              className="text-center mt-2 
                    text-xs bg-white/10 
                    px-2 py-1 rounded-md inline-block"
            >
              {bufferValue} meters radius
            </div>
          </div>

          {/* ================= GRID SIZE ================= */}

          <div className="border-t border-white/10 pt-4">
            <h4
              className="text-xs uppercase tracking-wider 
                   text-cyan-300 mb-3"
            >
              Grid Size
            </h4>

            <div className="flex gap-3">
              {[50, 100, 150].map((size) => (
                <label
                  key={size}
                  className={`px-3 py-1 rounded-lg 
                      border text-xs cursor-pointer
                      transition

          ${
            gridSize === size
              ? "bg-cyan-500 border-cyan-500 text-white"
              : "border-white/30 hover:border-cyan-300"
          }`}
                >
                  <input
                    type="radio"
                    hidden
                    name="gridSize"
                    checked={gridSize === size}
                    onChange={() => {
                      updateGridSize(size);
                      setGridSize(size);
                    }}
                  />
                  {size} m
                </label>
              ))}
            </div>
          </div>

          {/* ================= WEIGHT SETTINGS ================= */}

          <div className="border-t border-white/10 pt-4">
            <h4
              className="text-xs uppercase tracking-wider 
                   text-purple-300 mb-3"
            >
              Weight Settings
            </h4>

            <div className="space-y-2">
              {Object.keys(weightsState).map((key) => (
                <div
                  key={key}
                  className="flex justify-between items-center
                     bg-white/5 px-3 py-2 rounded-lg
                     hover:bg-white/10 transition"
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
                    className="w-12 text-black px-1 rounded text-center"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
