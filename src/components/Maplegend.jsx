export default function MapLegend({ layer }) {
  if (!layer) return null;

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

  const data = layer === "demand_layer" ? demandLegend : supplyLegend;

  return (
    <div className="absolute bottom-4 left-4 bg-white shadow-lg rounded p-3 text-xs w-40">
      <div className="font-bold mb-2">
        {layer === "demand_layer" ? "Demand Analysis" : "Supply Analysis"}
      </div>

      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 border" style={{ background: item.color }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
