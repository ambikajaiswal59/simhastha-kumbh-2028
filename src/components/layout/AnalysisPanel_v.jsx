export default function AnalysisPanel({
  buffer,
  selectedTypes = [],
  analysisMode,
  setAnalysisMode,
}) {
  // Better dummy data
  const data = {
    hotel: {
      title: "Accommodation",
      value: 5 + Number(buffer),
      desc: "Hotels Found",
      extra1: "Total Beds: 320",
      extra2: "Available Beds: 150",
      status: "Moderate",
      color: "text-yellow-500",
      bg: "bg-yellow-100",
    },

    water: {
      title: "Water Supply",
      value: 20 + buffer * 2,
      desc: "Water Points",
      extra1: "Tanks: 12",
      extra2: "Avg Distance: 300m",
      status: "Good",
      color: "text-blue-500",
      bg: "bg-blue-100",
    },

    hospital: {
      title: "Medical",
      value: 3 + Math.floor(buffer / 2),
      desc: "Medical Centers",
      extra1: "Ambulance: 5",
      extra2: "Response: 4 min",
      status: "Good",
      color: "text-green-500",
      bg: "bg-green-100",
    },

    police: {
      title: "Security",
      value: 4 + Math.floor(buffer / 2),
      desc: "Police Posts",
      extra1: "Guards: 50",
      extra2: "Cameras: 30",
      status: "Strong",
      color: "text-red-500",
      bg: "bg-red-100",
    },

    food: {
      title: "Food Points",
      value: 15 + buffer,
      desc: "Serving Centers",
      extra1: "Capacity/day: 5000",
      extra2: "Coverage: Good",
      status: "Good",
      color: "text-orange-500",
      bg: "bg-orange-100",
    },

    toilet: {
      title: "Toilet Sanitation",
      value: 18 + Math.floor(buffer * 1.5),
      desc: "Demand Grid Cells",
      extra1: "Priority: Demand based",
      extra2: "Coverage: Sanitation zones",
      status: "Monitored",
      color: "text-cyan-500",
      bg: "bg-cyan-100",
    },

    parking: {
      title: "Parking",
      value: 6 + buffer,
      desc: "Parking Zones",
      extra1: "Capacity: 900",
      extra2: "Free Space: 300",
      status: "Medium",
      color: "text-purple-500",
      bg: "bg-purple-100",
    },
  };

  return (
    <div className="w-80 bg-gradient-to-b from-gray-100 to-gray-200 p-4 shadow-xl border-l">
      <h2 className="text-lg font-bold mb-4">Analysis Results</h2>

      {selectedTypes?.includes("toilet") && (
        <div className="mt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="analysis"
              value="gap"
              checked={analysisMode === "gap"}
              onChange={(e) => {
                if (e.target.checked) {
                  console.log("Gap analysis enabled");
                  setAnalysisMode("gap");
                } else {
                  console.log("Gap analysis disabled");
                  setAnalysisMode(null);
                }
              }}
            />
            Gap Analysis
          </label>
        </div>
      )}

      {/* Cards */}

      <div className="space-y-4">
        {selectedTypes.map((type) => {
          const item = data[type];

          if (!item) return null;

          return (
            <div key={type} className="bg-white rounded-lg shadow p-3">
              {/* Title Row */}

              <div className="flex justify-between items-center">
                <span className="font-semibold">{item.title}</span>

                <span className={`font-bold ${item.color}`}>{item.value}</span>
              </div>

              {/* Description */}

              <p className="text-xs text-gray-500 mt-1">{item.desc}</p>

              {/* Extra Info */}

              <div className="text-sm mt-2 space-y-1">
                <p>{item.extra1}</p>
                <p>{item.extra2}</p>
              </div>

              {/* Status Box */}

              <div
                className={`mt-3 p-1 text-center rounded text-sm font-medium ${item.bg}`}
              >
                Status: {item.status}
              </div>
            </div>
          );
        })}
      </div>

      {/* Buffer Info */}

      <div className="mt-5 bg-white p-3 rounded-lg shadow text-sm">
        <p>
          Buffer Radius: <b>{buffer} km</b>
        </p>

        <p className="text-gray-500 mt-1">
          Dynamic analysis based on selected layers
        </p>
      </div>
    </div>
  );
}
