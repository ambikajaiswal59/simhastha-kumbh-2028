export default function Switcher({ activeSwitcher, setActiveSwitcher }) {
  return (
    <div className="flex gap-2 px-2 pt-2 pb-2 bg-gradient-to-r from-[#122b45]/90 via-[#173c60]/90 to-[#112233]/60 shadow rounded-b-xl">
      
      <button
        className={`flex-1 py-1.5 rounded-full font-semibold transition text-base
        ${
          activeSwitcher === "layer"
            ? "bg-gradient-to-br from-orange-500 to-yellow-400 text-white shadow scale-105"
            : "bg-[#183e60]/80 text-orange-200 hover:bg-orange-400/75 hover:text-white"
        }`}
        onClick={() => setActiveSwitcher("layer")}
      >
        Layer Analysis
      </button>

      <button
        className={`flex-1 py-1.5 rounded-full font-semibold transition text-base
        ${
          activeSwitcher === "routing"
            ? "bg-gradient-to-br from-orange-500 to-yellow-400 text-white shadow scale-105"
            : "bg-[#183e60]/80 text-orange-200 hover:bg-orange-400/75 hover:text-white"
        }`}
        onClick={() => setActiveSwitcher("routing")}
      >
        Routing
      </button>

    </div>
  );
}