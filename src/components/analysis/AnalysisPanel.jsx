import { useEffect } from "react";
import SuitableLandForm from "../form/SuitableLandForm";

export default function AnalysisPanel({
  selectedTypes = [],
  analysisData = {},
  selectedFeature,
  setAnalysisLayers,
  analysisLayers,
  setShowAnalysisOptions,
  showLandSuitableDropdown,
  setShowLandSuitableDropdown,
  proximity,
  setProximity,
  toiletSheet,
  setToiletSheet,
  handleToiletAnalysis,
}) {
  const TYPE_LABELS = {
    toilets_sanitation: "Toilet Sanitation",
    road_network3: "Road Network",
    police_station: "Police Station",
    parking_loc: "Parking Location",
    temple_ujjain: "Temple Ujjain",
    junction: "Junction",
  };

  const IGNORE_KEYS = new Set([
    "temple",
    "parking",
    "junction",
    "hotel",
    "building",
    "n",
    "id",
    "id_2",
    "road_name",
    "priority",
    "road_id",
    "access",
    "condition",
    "upd_date",
    "upd_time",
  ]);
  console.log("RIGHT PANEL DATA:", selectedFeature);

  useEffect(() => {
    if (analysisLayers.suitable_land) {
      setShowLandSuitableDropdown(true);
    } else {
      setShowLandSuitableDropdown(false);
    }
  }, [analysisLayers]);
  const layer = selectedFeature?.layer?.toLowerCase() || "";

  console.log("Layer:", layer); // 👈 DEBUG HERE
  console.log("Feature:", selectedFeature);
  return (
    <div className="w-80 h-full bg-gradient-to-b from-[#0f2a44] to-[#133b5c] p-4 border-l overflow-y-auto">
      {/* HEADER */}
      <h2 className="text-lg font-bold mb-4 text-white sticky top-0 bg-[#133b5c] py-2 z-10">
        Analysis Results
      </h2>

      {selectedTypes?.includes("toilets_sanitation") && (
        <div className="flex flex-col gap-2 mb-4">
          {/* Reusable Button */}
          {[
            { key: "supply", label: "Supply Gap Analysis" },
            { key: "demand", label: "Demand Analysis" },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => {
                setAnalysisLayers((prev) => ({
                  ...prev,
                  [btn.key]: !prev[btn.key],
                }));
                setShowAnalysisOptions(true);
              }}
              className={`px-3 py-2 text-sm rounded-md border border-white transition-all duration-200
            ${
              analysisLayers[btn.key]
                ? "bg-[#0f2a44] text-white"
                : "bg-[#133b5c] text-gray-200 hover:bg-[#0f2a44]"
            }`}
            >
              {btn.label}
            </button>
          ))}

          {/* Site Priority */}
          <button
            onClick={() => {
              setShowAnalysisOptions(true);
              setShowLandSuitableDropdown((prev) => !prev);
            }}
            className={`px-3 py-2 text-sm rounded-md border border-white transition-all duration-200
          ${
            analysisLayers.suitable_land
              ? "bg-[#0f2a44] text-white"
              : "bg-[#133b5c] text-gray-200 hover:bg-[#0f2a44]"
          }`}
          >
            Site Priority
          </button>
        </div>
      )}

      {/* FORM */}
      <div className="space-y-4">
        {showLandSuitableDropdown && (
          <SuitableLandForm
            proximity={proximity}
            setProximity={setProximity}
            toiletSheet={toiletSheet}
            setToiletSheet={setToiletSheet}
            handleToiletAnalysis={handleToiletAnalysis}
          />
        )}

        {/* ANALYSIS CARDS */}
        {selectedTypes.map((type) => {
          const item = analysisData[type];
          if (!item) return null;

          return (
            <div key={type} className="bg-white p-3 rounded shadow-sm">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">
                  {TYPE_LABELS[type] || type}
                </span>

                <span className="font-bold text-blue-600 text-sm">
                  {item.point_count}
                </span>
              </div>

              {/* FEATURE DATA */}
              {selectedFeature && (
                <div className="mt-3 border-t pt-2 space-y-1">
                  {Object.entries(selectedFeature)
                    .filter(([key]) => !IGNORE_KEYS.has(key))
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between text-xs text-gray-700"
                      >
                        <span className="capitalize">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                </div>
              )}

              <p className="text-xs mt-2 text-gray-600">
                Avg Distance: <b>{Math.round(item.avg_distance_meters)} m</b>
              </p>
            </div>
          );
        })}

        {/* ================= FEATURE CARD ================= */}
        {selectedFeature &&
          (() => {
            const layer = selectedFeature?.layer?.toLowerCase() || "";

            return (
              <div className="mb-4 p-4 rounded-xl bg-white/10 border border-white/20">
                {/* TITLE */}
                <h3 className="text-sm font-bold text-yellow-300 mb-3">
                  {layer.includes("bottleneck")
                    ? " Bottleneck Details"
                    : layer.includes("ml")
                      ? " Empty Space"
                      : "Feature Details"}
                </h3>

                {/* ================= BOTTLENECK ================= */}
                {layer.includes("bottleneck") &&
                  (() => {
                    debugger;
                    const risk = selectedFeature?.risk_class || "LOW";

                    return (
                      <div className="space-y-2 text-xs text-white">
                        <div className="flex justify-between items-center">
                          <span>Risk Level</span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold
                  ${
                    risk === "CRITICAL"
                      ? "bg-red-500"
                      : risk === "HIGH"
                        ? "bg-orange-400"
                        : "bg-yellow-400"
                  }`}
                          >
                            {risk}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span>Risk Score</span>
                          <span>{selectedFeature?.risk_score || "N/A"}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Crowd Level</span>
                          <span>{selectedFeature?.crowd_lvl || "N/A"}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Junction Type</span>
                          <span>{selectedFeature?.junc_type || "N/A"}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Road Connections</span>
                          <span>{selectedFeature?.roads_conn ?? "N/A"}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Zone</span>
                          <span>{selectedFeature?.zone || "N/A"}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Distance</span>
                          <span>
                            {selectedFeature?.distance_from_temple || "0"} m
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span>Signal</span>
                          <span>{selectedFeature?.signal ? "Yes" : "No"}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Barricade</span>
                          <span>
                            {selectedFeature?.barricade ? "Yes" : "No"}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span>Control</span>
                          <span>{selectedFeature?.control || "NA"}</span>
                        </div>
                      </div>
                    );
                  })()}

                {/* ================= EMPTY SPACE ================= */}
                {layer.includes("ml") &&
                  (() => {
                    const area = Number(selectedFeature?.area_sqm || 0);
                    const occupancy = Number(
                      selectedFeature?.occupied_pct || 0,
                    );
                    const distance = Number(
                      selectedFeature?.distance_from_temple || 0,
                    );


                    return (
                      <div className="space-y-3 text-xs text-white">
                        {/* <div className="flex justify-between">
                          <span>Type</span>
                          <span className="text-green-300 font-semibold">
                            Empty Space
                          </span>
                        </div> */}

                        <div className="flex justify-between">
                          <span>Area</span>
                          <span>{area.toFixed(0)} sqm</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span>Occupancy</span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold
                              ${
                                occupancy < 20
                                  ? "bg-green-500"
                                  : occupancy < 50
                                    ? "bg-yellow-400"
                                    : "bg-red-500"
                              }`}
                          >
                            {occupancy.toFixed(1)} %
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span>Distance</span>
                          <span>{distance} m</span>
                        </div>

                        {/* <div className="flex justify-between text-gray-400">
                          <span>Location</span>
                          <span>
                            {Math.round(x)}, {Math.round(y)}
                          </span>
                        </div> */}
                      </div>
                    );
                  })()}
              </div>
            );
          })()}
      </div>
    </div>
  );
}
