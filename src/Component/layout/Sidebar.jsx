export default function Sidebar() {
  return (
    <aside className="w-64 bg-teal-900 text-white h-full flex flex-col p-4 border-r border-teal-800">

      {/* TITLE */}
      <h2 className="text-sm font-bold tracking-wide mb-3 text-orange-400">
        AREA SELECTION
      </h2>

      {/* DROPDOWN */}
      <select className="w-full p-2 rounded text-black mb-4">
        <option>Select Area</option>
        <option>Ujjain</option>
        <option>Indore</option>
        <option>Bhopal</option>
      </select>


      {/* FILTER TITLE */}
      <h3 className="text-sm font-semibold mb-2 text-teal-200">
        Filters
      </h3>

      {/* CHECKBOXES */}
      <div className="space-y-2 text-sm">

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" defaultChecked />
          Transportation
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" />
          Hotel
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" />
          Hospital
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" />
          Sanitation
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" />
          Parking
        </label>

      </div>


      {/* BUFFER */}
      <div className="mt-6">

        <h3 className="text-sm font-semibold text-teal-200 mb-2">
          Buffer Zone (km)
        </h3>

        <input
          type="range"
          min="0"
          max="10"
          className="w-full accent-orange-500"
        />

        <div className="text-xs mt-1 text-gray-300">
          5 km Buffer
        </div>

      </div>


      {/* FOOTER */}
      <div className="mt-auto pt-4 text-xs text-gray-400">

        Simhastha Control System

      </div>

    </aside>
  );
}