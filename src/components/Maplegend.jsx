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
    { label: "Very High", color: "rgba(107,4,4,0.6)" },
    { label: "High", color: "rgba(255,0,0,0.6)" },
    { label: "Moderate", color: "rgba(255,165,0,0.6)" },
    { label: "Low", color: "rgba(255,255,0,0.6)" },
    { label: "Very Low", color: "rgba(0,255,0,0.6)" },
  ];

  const supplyLegend = [
    { label: "Adequate", color: "rgba(0,180,0,0.45)" },
    { label: "Oversupply", color: "rgba(0,120,255,0.45)" },
    { label: "Low", color: "rgba(255,255,0,0.45)" },
    { label: "Moderate", color: "rgba(255,165,0,0.45)" },
    { label: "Critical", color: "rgba(255,0,0,0.55)" },
  ];

  const landSuitableVisualization = [{ label: "", color: "" }];

  // IMPORTANT CONDITION FIX
  const hasServiceLegend = selectedTypes?.length > 0;
  const hasDemandLegend = analysisLayers?.demand;
  const hasSupplyLegend = analysisLayers?.supply;

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
              <span>{item.label}</span>
            </div>
          ))}
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
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
