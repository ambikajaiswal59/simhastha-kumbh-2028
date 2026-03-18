export default function Header() {
  return (
    <header className="w-full h-14 bg-teal-800 text-white flex items-center justify-between px-4 shadow-md border-b border-teal-700">

      {/* LEFT */}
      <div className="flex items-center gap-3">

        {/* Logo */}
        <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center text-lg font-bold shadow">
          🕉
        </div>

        {/* Title */}
        <div className="flex flex-col leading-tight">

          <span className="text-lg font-semibold tracking-wide">
            Simhastha Kumbh Mela 2028
          </span>

          <span className="text-xs text-teal-200">
            Dashboard Control Panel
          </span>

        </div>

      </div>


      {/* RIGHT */}
      <div className="flex items-center gap-4">

        {/* Notification */}
        <div className="cursor-pointer hover:text-orange-300">
          🔔
        </div>

        {/* User */}
        <div className="flex items-center gap-2">

          <span className="text-sm">
            Admin
          </span>

          <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-semibold shadow">
            U
          </div>

        </div>

      </div>

    </header>
  );
}