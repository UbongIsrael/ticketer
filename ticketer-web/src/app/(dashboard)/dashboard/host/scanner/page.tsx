'use client';

import Link from 'next/link';

export default function PwaScanner() {
  return (
    <div className="bg-[#0e0e10] min-h-screen text-[#f9f5f8] selection:bg-primary/30 font-sans overflow-x-hidden">
      
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-zinc-950/70 backdrop-blur-xl shadow-2xl shadow-black/50 flex items-center px-4 h-16">
        <div className="flex items-center gap-4 w-full">
          <Link href="/dashboard/host" className="material-symbols-outlined text-violet-300 hover:bg-zinc-800/50 transition-colors p-2 rounded-full active:scale-95 duration-200">arrow_back</Link>
          <h1 className="text-zinc-100 text-lg font-bold tracking-tight">Scan Tickets</h1>
          <div className="ml-auto flex gap-2">
            <button className="material-symbols-outlined text-violet-300">flashlight_on</button>
          </div>
        </div>
      </header>

      <main className="pt-16 pb-32 min-h-screen flex flex-col">
        {/* Camera Viewport Section */}
        <section className="p-4">
          <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#000000] shadow-[0_0_50px_rgba(186,158,255,0.15)]">


            <div id="reader" className="w-full h-full object-cover">
               {/* Note: Html5Qrcode implementation will mount here */}
               <img className="w-full h-full object-cover opacity-60 grayscale-[0.5]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzVg6l9EHHKZzTqVe4Qfw1drghir-n05a9xwoYyDrqm485NB8VzSkOMlaxUx5NlfQ_1nZyKQ8SXB3mkRqqtuZDINIPqyF5UKU1UoLTTeRh5bhAHDMMVwcAzG0su0rqcbsqoqO4KQPAtfBa6rLRW6hyXOkdvGvFTKpVP1T5-m3MEog4Ck5mIdRKrDXb25OdCZVkqJh45-zaFenzCFcnWsYeA9YiWVoNJaFGPWyQ11kk1qgWW-ms4nFDjGkIr9NZrYZ-1dU0BYEOKJZj" alt="Scanner Placeholder"/>
            </div>

            {/* Scanner UI Overlays */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div className="scanner-corner corner-tl"></div>
              <div className="scanner-corner corner-tr"></div>
              <div className="scanner-corner corner-bl"></div>
              <div className="scanner-corner corner-br"></div>
              <div className="scan-line"></div>
            </div>

            {/* Live Status Tag */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-primary/20 flex items-center gap-2 z-20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#ba9eff]"></span>
              <span className="text-[10px] font-bold tracking-[0.1em] text-[#f9f5f8] uppercase">Active Scanner</span>
            </div>
          </div>
        </section>

        {/* Offline Sync Floating Banner */}
        <section className="px-4 -mt-8 relative z-10 block">
          <div className="bg-[#1f1f22]/90 backdrop-blur-lg rounded-xl p-4 flex items-center justify-between border border-white/5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <span className="material-symbols-outlined text-primary text-xl">cloud_sync</span>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#f9f5f8]">328 scans synced</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] text-zinc-400 font-medium tracking-wide uppercase">Ready for offline</span>
                </div>
              </div>
            </div>
            <div className="text-[10px] font-bold text-primary px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
              AUTO-SYNC
            </div>
          </div>
        </section>

        {/* Status Pillar (Recent Scans) */}
        <section className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold tracking-[0.15em] text-zinc-500 uppercase">Recent Activity</h2>
            <span className="text-[11px] font-medium text-primary">View All</span>
          </div>

          <div className="space-y-3">
            {/* Success Item 1 */}
            <div className="bg-[#131315] rounded-lg p-4 flex items-center gap-4 transition-all hover:bg-[#1f1f22] active:scale-[0.98]">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <span className="material-symbols-outlined text-emerald-400 text-2xl">check_circle</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-[#f9f5f8]">Julianne Moore</div>
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider mt-0.5">VIP BACKSTAGE • GATE 4</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-[#f9f5f8]">2m ago</div>
              </div>
            </div>

            {/* Error Item */}
            <div className="bg-[#131315] rounded-lg p-4 flex items-center gap-4 transition-all hover:bg-[#1f1f22] active:scale-[0.98]">
              <div className="w-12 h-12 rounded-full bg-[#ff6e84]/10 flex items-center justify-center border border-[#ff6e84]/20">
                <span className="material-symbols-outlined text-[#ff6e84] text-2xl">cancel</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-[#f9f5f8]">Invalid Ticket</div>
                <div className="text-[11px] text-[#ff6e84] uppercase tracking-wider mt-0.5 font-semibold">DUPLICATE ENTRY DETECTED</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-[#f9f5f8]">5m ago</div>
              </div>
            </div>

            {/* Success Item 2 */}
            <div className="bg-[#131315] rounded-lg p-4 flex items-center gap-4 transition-all hover:bg-[#1f1f22] active:scale-[0.98]">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <span className="material-symbols-outlined text-emerald-400 text-2xl">check_circle</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-[#f9f5f8]">Marcus Holloway</div>
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider mt-0.5">GENERAL ADMISSION</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-[#f9f5f8]">12m ago</div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center h-20 px-6 pb-safe bg-zinc-950/80 backdrop-blur-lg z-50 rounded-t-2xl shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
        <button className="flex flex-col items-center justify-center bg-violet-500/20 text-violet-200 rounded-xl px-6 py-1 active:scale-97 transition-transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_scanner</span>
          <span className="text-[11px] font-medium uppercase tracking-widest mt-1">Scanner</span>
        </button>
        <button className="flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-300 active:scale-97 transition-transform">
          <span className="material-symbols-outlined">history</span>
          <span className="text-[11px] font-medium uppercase tracking-widest mt-1">History</span>
        </button>
      </nav>

    </div>
  );
}
