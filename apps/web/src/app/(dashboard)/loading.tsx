export default function DashboardLoading() {
  return (
    <div className="flex-1 w-full h-full min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="relative flex items-center justify-center w-24 h-24 mb-6">
        {/* Outer pulsing ring */}
        <div className="absolute inset-2 rounded-full bg-amber-600/10 animate-ping" style={{ animationDuration: '2s' }}></div>
        
        {/* Spinning track */}
        <div className="absolute inset-0 border-4 border-zinc-200/50 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-[#d97706] border-r-transparent border-b-[#d97706]/40 border-l-transparent rounded-full animate-spin" style={{ animationDuration: '1.2s' }}></div>
        
        {/* Center icon */}
        <div className="relative bg-white shadow-sm p-3 rounded-xl border border-zinc-200 z-10">
          <svg className="w-6 h-6 text-[#d97706]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
          </svg>
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <h3 className="text-[13px] font-extrabold text-zinc-800 uppercase tracking-[0.25em] font-mono">
          Loading Data
        </h3>
        <div className="flex items-center gap-1.5 opacity-60">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706] animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706] animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706] animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
      </div>
    </div>
  );
}
