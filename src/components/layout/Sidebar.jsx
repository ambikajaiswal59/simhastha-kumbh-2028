import { useState, useEffect } from "react";
import { API } from "../../config/api";
export default function Sidebar({ setSelectedLayers, setBuffer }) {
  const [layers, setLayers] = useState([]);
  const [selected, setSelected] = useState([{ table_name: "road_network3" }]);
  const [bufferValue, setBufferValue] = useState(300);

  // ✅ Allowed layers only
  const allowedLayers = [
    "road_network3",
    "toilets_sanitation",
    "police_station",
    "parking_loc",
  ];

  // ✅ Labels + Icons
  const layerLabelMap = {
    toilets_sanitation: "Toilets Sanitation 🚻",
    police_station: "Police Station 🚓",
    parking_loc: "Parking 🚗",
    road_network3: "Road Network 🛣️",
  };

  // ✅ Fetch layers from backend
  useEffect(() => {
    fetch(API.layerList, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data || !data.data) return;

        const filtered = allowedLayers
          .map((name) => data.data.find((l) => l.table_name === name))
          .filter(Boolean);

        setLayers(filtered);

        // default road selected
        const defaultLayer = filtered.find(
          (l) => l.table_name === "road_network3",
        );

        if (defaultLayer) {
          setSelected([defaultLayer]);
          setSelectedLayers(["road_network3"]);
        }
      })
      .catch((err) => {
        console.error("Error fetching layers:", err);
      });
  }, []);

  // ✅ Handle checkbox selection
  const handleSelect = (layer) => {
    let updated;

    if (selected.find((l) => l.table_name === layer.table_name)) {
      updated = selected.filter((l) => l.table_name !== layer.table_name);
    } else {
      updated = [...selected, layer];
    }

    setSelected(updated);

    // ✅ Send only table names to parent (IMPORTANT)
    setSelectedLayers(updated.map((l) => l.table_name));
  };

  // ✅ Clear all
  const handleClear = () => {
    setSelected([]);
    setSelectedLayers([]);
  };

  return (
    <div className="w-72 bg-gradient-to-b from-[#0f2a44] to-[#133b5c] text-white p-5 shadow-xl border-r border-orange-500/20">
      {/* Title */}
      <h2 className="text-xl font-semibold mb-4 tracking-wide">Filters</h2>

      {/* Layers */}
      <div className="space-y-2">
        {layers.map((layer) => (
          <label
            key={layer.layer_id}
            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition 
            ${
              selected.find((l) => l.table_name === layer.table_name)
                ? "bg-white/10 border border-orange-400/30"
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

              <span>{layerLabelMap[layer.table_name] || layer.table_name}</span>
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

            // ✅ send km to parent
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
