export default function MapLegend({ analysisLayers, selectedTypes }) {
  const layerLegendConfig = {
    toilets_sanitation: {
      label: "Toilet Sanitation",
      icon: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    },
    police_station: {
      label: "Police Station",
      icon: "https://cdn-icons-png.flaticon.com/512/149/149060.png",
    },
    parking_loc: {
      label: "Parking",
      icon: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
    },
    road_network3: {
      label: "Road Network",
      icon: "https://cdn-icons-png.flaticon.com/512/684/684809.png",
    },

    temple_ujjain: {
      label: "Temple Ujjain",
      icon: "https://cdn-icons-png.flaticon.com/512/3176/3176292.png",
    },

    junction: {
      label: "Junctions",
      icon: "https://cdn-icons-png.flaticon.com/512/1483/1483336.png",
    },
  };

  const demandLegend = [
    {
      label: "Very High",
      color: "#004562", //"rgba(107,4,4,0.6)",
      value: "22",
    },
    {
      label: "High",
      color: "#007DB3", //"rgba(255,0,0,0.6)",
      value: "17",
    },
    {
      label: "Moderate",
      color: "#009DE1", //"rgba(255,165,0,0.6)"
      value: "12",
    },
    {
      label: "Low",
      color: "#57CDFF", //"rgba(255,255,0,0.6)"
      value: "10",
    },
    {
      label: "Very Low",
      color: "#85DAFF", //"rgba(0,255,0,0.6)",
      value: "2",
    },
  ];

  const supplyLegend = [
    {
      label: "Critical",
      color: "#562F00", //"rgba(255,0,0,0.55)",
      value: ">= 20",
    },
    {
      label: "Moderate",
      color: "#A03A13", //"rgba(255,165,0,0.45)",
      value: "10 - 19.9",
    },
    {
      label: "Low",
      color: "#8A7650", //"rgba(255,255,0,0.45)",
      value: "5 - 9.9",
    },
    {
      label: "Adequate",
      color: "#DBCEA5", //"rgba(0,180,0,0.45)"
      value: "0 - 4.9",
    },
    {
      label: "Oversupply",
      color: "#ECE7D1", //"rgba(0,120,255,0.45)",
      value: "< 0",
    },
  ];

  const SuitableLandLegend = [
    {
      label: "Very High",
      value: "40 - 55",
      color: "rgba(139,0,0,0.9)",
    },
    {
      label: "High",
      value: "31 - 40",
      color: "rgba(220,40,40,0.8)",
    },
    {
      label: "Moderate",
      value: "26.5 - 31",
      color: "rgba(255,80,80,0.7)",
    },
    {
      label: "Low",
      value: "21.5 - 26.5",
      color: "rgba(255,120,120,0.6)",
    },
    {
      label: "Very Low",
      value: "10.5 - 21.5",
      color: "rgba(255,182,193,0.5)",
    },
  ];

  // IMPORTANT CONDITION FIX
  const hasServiceLegend = selectedTypes?.length > 0;
  const hasSupplyLegend = analysisLayers?.supply;
  const hasDemandLegend = analysisLayers?.demand;
  const hasSuitableLandLegend = analysisLayers.suitable_land;

  if (!hasServiceLegend && !hasDemandLegend && !hasSupplyLegend) return null;

  return (
    <div className="bg-white shadow-xl rounded-xl p-4 text-xs w-52 space-y-4">
      {/* SERVICE LAYERS */}
      {hasServiceLegend && (
        <div>
          <div className="font-semibold mb-2">Service Layers</div>

          {selectedTypes.map((type) => {
            const item = layerLegendConfig[type];
            if (!item) return null;

            return (
              <div key={type} className="flex items-center gap-2 mb-1">
                <img src={item.icon} alt={item.label} className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
      {/* SUPPLY */}
      {hasSupplyLegend && (
        <div>
          <div className="font-semibold mb-2">Supply Analysis</div>

          {supplyLegend.map((item) => (
            <div key={item.label} className="flex items-center gap-2 mb-1">
              <div
                className="w-4 h-4 border"
                style={{ background: item.color }}
              />
              <span>{item.label}</span>({item.value})
            </div>
          ))}
        </div>
      )}

      {/* DEMAND */}
      {hasDemandLegend && (
        <div>
          <div className="font-semibold mb-2">Demand Analysis</div>

          {demandLegend.map((item) => (
            <div key={item.label} className="flex items-center gap-2 mb-1">
              <div
                className="w-4 h-4 border"
                style={{ background: item.color }}
              />
              <span>{item.label}</span>({item.value})
            </div>
          ))}
        </div>
      )}

      {/* SUITABLE LAND LEGEND */}
      {hasSuitableLandLegend && (
        <div>
          <div className="font-semibold mb-2">Suitable Land Analysis</div>

          {SuitableLandLegend.map((item) => (
            <div key={item.label} className="flex items-center gap-2 mb-1">
              <div
                className="w-4 h-4 border"
                style={{ background: item.color }}
              />
              <span>{item.label}</span>({item.value})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
