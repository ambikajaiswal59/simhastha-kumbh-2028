import { useState, useEffect } from "react";
import { API } from "../../config/api";
export default function Sidebar({
  setSelectedLayers,
  setBuffer,
  setAnalysisLayers,
  analysisLayers,
  showAnalysisOptions,
}) {
  const [layers, setLayers] = useState([]);
  const [selected, setSelected] = useState([{ table_name: "road_network3" }]);
  const [bufferValue, setBufferValue] = useState(300);

  //  Allowed layers only
  const allowedLayers = [
    "road_network3",
    "toilets_sanitation",
    "police_station",
    "parking_loc",
    "temple_ujjain",
    "junction",
  ];

  //  Labels + Icons
  const layerLabelMap = {
    toilets_sanitation: "Toilet",
    police_station: "Police Station",
    parking_loc: "Parking ",
    road_network3: "Road",
    temple_ujjain: "Temple Ujjain",
    junction: "Junctions",
  };

  //  Helper function to find layer by name
  const findLayerByName = (data, name) =>
    data.find((l) => l.table_name === name);

  //  Helper function to handle layer data
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

  //  Fetch layers from backend
  useEffect(() => {
    fetch(API.layerList, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    })
      .then((res) => res.json())
      .then(handleLayerData)
      .catch((err) => {
        console.error("Error fetching layers:", err);
      });
  }, []);

  //  Handle checkbox selection
  const handleSelect = (layer) => {
    debugger;
    let updated;

    const isSelected = selected.find((l) => l.table_name === layer.table_name);

    if (isSelected) {
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

  const hasSitePriority = analysisLayers.site_priority;

  return (
    <div className="w-72 bg-gradient-to-b from-[#0f2a44] to-[#133b5c] text-white p-5 shadow-xl border-r border-orange-500/20">
      {/* Title */}
      <h2 className="text-xl font-semibold mb-4 tracking-wide">Layer List</h2>

      {/* Layers */}
      <div className="space-y-2">
        {layers.map((layer) => (
          <label
            key={layer.layer_id}
            htmlFor={`layer-${layer.layer_id}`}
            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition 
            ${
              selected.find((l) => l.table_name === layer.table_name)
                ? "bg-white/10 border border-orange-400/30"
                : "hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                id={`layer-${layer.layer_id}`}
                type="checkbox"
                checked={
                  !!selected.find((l) => l.table_name === layer.table_name)
                }
                onChange={(e) => {
                  e.stopPropagation();
                  handleSelect(layer);
                }}
              />

              <div className="flex flex-col">
                <span>{layerLabelMap[layer.table_name]}</span>

                {layer.table_name === "toilets_sanitation" &&
                  showAnalysisOptions && (
                    <div className="flex flex-col gap-2 mt-1 text-xs ml-5">
                      {/* SUPPLY */}
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={analysisLayers.supply}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setAnalysisLayers((prev) => ({
                              ...prev,
                              supply: checked,
                            }));
                          }}
                        />
                        Supply
                      </label>
                      {/* DEMAND */}
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={analysisLayers.demand}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setAnalysisLayers((prev) => ({
                              ...prev,
                              demand: checked,
                            }));
                          }}
                        />
                        Demand
                      </label>

                      {/* <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={analysisLayers.suitable_land}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setAnalysisLayers((prev) => ({
                              ...prev,
                              suitable_land: checked,
                            }));
                          }}
                        />
                        Suitable Land
                      </label> */}
                      {hasSitePriority && (
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={analysisLayers.site_priority}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setAnalysisLayers((prev) => ({
                                ...prev,
                                site_priority: checked,
                              }));
                            }}
                          />
                          Site Priority
                        </label>
                      )}
                    </div>
                  )}
              </div>
            </div>
          </label>
        ))}
      </div>

      {/* Divider */}
      <div className="my-5 border-t border-white/10"></div>

      {/* Buffer */}
      <div>
        <h3 className="text-sm font-medium mb-2">Buffer Distance</h3>

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

        <div className="flex justify-between text-xs mt-1 text-gray-300">
          <span>100m</span>
          <span>500m</span>
        </div>

        <div className="mt-2 text-center bg-white/10 rounded p-2 text-sm">
          {bufferValue} m radius
        </div>
      </div>

      {/* Buttons */}
      {/* <div className="flex gap-3 mt-6">
        <button
          className="flex-1 bg-orange-500 hover:bg-orange-600 transition p-2 rounded-lg font-medium shadow"
        >
          Apply
        </button>

        <button
          onClick={handleClear}
          className="flex-1 bg-gray-600 hover:bg-gray-700 transition p-2 rounded-lg"
        >
          Clear
        </button>
      </div> */}
    </div>
  );
}
