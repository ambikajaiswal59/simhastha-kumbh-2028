export default function Header() {
  return (
    <header className="w-full h-24 bg-gradient-to-r from-[#0f2a44] via-[#133b5c] to-[#0f2a44] text-white flex items-center justify-between px-6 shadow-lg border-b border-orange-500/30">
      {/* LEFT */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-400 rounded-full flex items-center justify-center text-2xl font-bold shadow-md">
          🕉
        </div>

        {/* Title */}
        <div className="flex flex-col leading-tight">
          <span className="text-2xl font-semibold tracking-wide">
            Simhastha Kumbh Mela 2028
          </span>

          <span className="text-sm text-orange-200 tracking-wide">
            Ujjain Planning Dashboard
          </span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-5">
        <div className="hidden md:flex items-center gap-4 text-sm text-gray-300">
          <span>
            Crowd: <span className="text-orange-300 font-semibold">Medium</span>
          </span>
        </div>

        <div className="h-8 w-px bg-gray-500/40"></div>

        <div className="flex items-center gap-2 cursor-pointer hover:bg-white/10 px-3 py-2 rounded-lg transition">
          <span className="text-base">Admin</span>

          <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-semibold shadow-md">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
