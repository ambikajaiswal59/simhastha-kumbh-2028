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

  return (
    <div className="w-80 bg-gray-100 p-4 shadow-lg border-l h-screen overflow-y-auto">
      <h2 className="text-lg font-bold mb-4 sticky top-0 bg-gray-100 z-10">
        Analysis Results
      </h2>
      {selectedTypes?.includes("toilets_sanitation") && (
        <div className="mt-4 flex flex-wrap flex-col gap-2">
          {/* Demand Button */}
          <button
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: analysisLayers.demand
                ? "1px solid #dc2626"
                : "1px solid #ccc",
              backgroundColor: analysisLayers.demand ? "#FFA500" : "#ffffff",
              color: analysisLayers.demand ? "#ffffff" : "#333",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
              transition: "all 0.2s ease",
              boxShadow: analysisLayers.demand
                ? "0 2px 6px rgba(220,38,38,0.4)"
                : "0 1px 3px rgba(0,0,0,0.1)",
            }}
            onMouseEnter={(e) => {
              if (!analysisLayers.demand) {
                e.target.style.backgroundColor = "#f3f4f6";
              }
            }}
            onMouseLeave={(e) => {
              if (!analysisLayers.demand) {
                e.target.style.backgroundColor = "#ffffff";
              }
            }}
            onClick={() => {
              setAnalysisLayers((prev) => ({ ...prev, demand: true }));
              setShowAnalysisOptions(true); // ✅ SHOW LEFT OPTIONS
            }}
          >
            Demand Analysis
          </button>
          {/* Supply Button */}
          <button
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: analysisLayers.supply
                ? "1px solid #dc2626"
                : "1px solid #ccc",
              backgroundColor: analysisLayers.supply ? "#F08000" : "#ffffff",
              color: analysisLayers.supply ? "#ffffff" : "#333",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
              transition: "all 0.2s ease",
              boxShadow: analysisLayers.supply
                ? "0 2px 6px rgba(220,38,38,0.4)"
                : "0 1px 3px rgba(0,0,0,0.1)",
            }}
            onMouseEnter={(e) => {
              if (!analysisLayers.supply) {
                e.target.style.backgroundColor = "#f3f4f6";
              }
            }}
            onMouseLeave={(e) => {
              if (!analysisLayers.supply) {
                e.target.style.backgroundColor = "#ffffff";
              }
            }}
            onClick={() => {
              setAnalysisLayers((prev) => ({ ...prev, supply: true }));
              setShowAnalysisOptions(true); // ✅ SHOW LEFT OPTIONS
            }}
          >
            Supply Gap Analysis
          </button>

          {/* Land Suitalbe Visualization */}
          {/* Supply Button */}
          <button
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: analysisLayers.suitable_land
                ? "1px solid #dc2626"
                : "1px solid #ccc",
              backgroundColor: analysisLayers.suitable_land
                ? "#F08000"
                : "#ffffff",
              color: analysisLayers.suitable_land ? "#ffffff" : "#333",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
              transition: "all 0.2s ease",
              boxShadow: analysisLayers.suitable_land
                ? "0 2px 6px rgba(220,38,38,0.4)"
                : "0 1px 3px rgba(0,0,0,0.1)",
            }}
            onMouseEnter={(e) => {
              if (!analysisLayers.suitable_land) {
                e.target.style.backgroundColor = "#f3f4f6";
              }
            }}
            onMouseLeave={(e) => {
              if (!analysisLayers.suitable_land) {
                e.target.style.backgroundColor = "#ffffff";
              }
            }}
            onClick={() => {
              setAnalysisLayers((prev) => ({
                ...prev,
                suitable_land: true,
              }));
              setShowAnalysisOptions(true); // ✅ SHOW LEFT OPTIONS
              setShowLandSuitableDropdown((prev) => !prev);
            }}
          >
            Land Suitable Analysis
          </button>
        </div>
      )}

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

        {selectedTypes.map((type) => {
          const item = analysisData[type];

          if (!item) return null;

          return (
            <div key={type} className="bg-white p-3 rounded shadow">
              <div className="flex justify-between">
                <span className="font-semibold">
                  {TYPE_LABELS[type] || type}
                </span>

                <span className="font-bold text-blue-600">
                  {item.point_count}
                </span>
              </div>

              {/* <p className="text-sm text-gray-500 mt-1">Features Found</p> */}
              {/* 🔥 Dynamic Feature Data */}
              {selectedFeature && (
                <div className="mt-3 border-t pt-2">
                  {Object.entries(selectedFeature)
                    .filter(([key]) => !IGNORE_KEYS.has(key)) // 🚀 filter here
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between text-xs text-gray-700"
                      >
                        <span className="capitalize">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                </div>
              )}

              <p className="text-sm mt-2">
                Avg Distance: <b>{Math.round(item.avg_distance_meters)} m</b>
              </p>
            </div>
          );
        })}
      </div>

      {/* Buffer Info */}
      {/* <div className="mt-5 bg-white p-3 rounded shadow text-sm">
        Buffer Radius: <b>{buffer} km</b>
      </div> */}
    </div>
  );
}
