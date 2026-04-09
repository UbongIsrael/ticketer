'use client';

import Link from 'next/link';

export default function HostDashboard() {
  return (
    <>
      <main className="max-w-7xl mx-auto w-full">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-[#f9f5f8] mb-2">Event Performance</h1>
              <p className="text-zinc-400 font-medium">Real-time telemetry for <span className="text-primary">Electronic Dreamscape 2024</span></p>
            </div>
            <button className="bg-primary hover:bg-[#ae8dff] text-[#0e0e10] px-6 py-3 rounded-lg text-sm font-bold active:opacity-80 transition-all shadow-[0_0_20px_rgba(186,158,255,0.3)] flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">payments</span> Request Payout
            </button>
          </div>

          {/* Stats Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#131315] p-6 rounded-xl relative overflow-hidden group transition-all">
              <div className="relative z-10">
                <p className="text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase mb-4">Total Sales</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-4xl font-black text-[#f9f5f8] tracking-tighter">₦12.4M</h3>
                  <span className="text-primary text-xs font-bold bg-primary/10 px-2 py-1 rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">trending_up</span> 12%
                  </span>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-8xl text-primary">shopping_bag</span>
              </div>
            </div>

            <div className="bg-[#131315] p-6 rounded-xl relative overflow-hidden group transition-all">
              <div className="relative z-10">
                <p className="text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase mb-4">Tickets Scanned</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-4xl font-black text-[#f9f5f8] tracking-tighter">2,840</h3>
                  <span className="text-zinc-500 text-xs font-bold">/ 3,500 CAP</span>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-8xl text-primary">confirmation_number</span>
              </div>
            </div>

            <div className="bg-[#131315] p-6 rounded-xl relative overflow-hidden group transition-all">
              <div className="relative z-10">
                <p className="text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase mb-4">Gross Revenue</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-4xl font-black text-[#f9f5f8] tracking-tighter">₦9.8M</h3>
                  <span className="text-primary text-xs font-bold bg-primary/10 px-2 py-1 rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">account_balance_wallet</span> Net
                  </span>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-8xl text-primary">insights</span>
              </div>
            </div>
          </section>

          {/* Chart Section */}
          <section className="bg-[#131315] rounded-xl overflow-hidden mb-8">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center relative">

              <div>
                <h4 className="text-lg font-bold">Sales Over Time</h4>
                <p className="text-xs text-zinc-500">Real-time hourly transaction volume</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#262528] text-[#f9f5f8] hover:bg-zinc-800">1H</button>
                <button className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-[#0e0e10]">24H</button>
                <button className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#262528] text-[#f9f5f8] hover:bg-zinc-800">7D</button>
              </div>
            </div>
            <div className="h-96 relative w-full chart-grid p-8">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 300" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ba9eff" stopOpacity="0.3"></stop>
                    <stop offset="100%" stopColor="#ba9eff" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
                <path d="M0 300 L0 250 Q 100 240 200 180 T 400 150 T 600 80 T 800 120 T 1000 50 L 1000 300 Z" fill="url(#chartGradient)"></path>
                <path className="drop-shadow-[0_0_15px_rgba(186,158,255,0.6)]" d="M0 250 Q 100 240 200 180 T 400 150 T 600 80 T 800 120 T 1000 50" fill="none" stroke="#ba9eff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"></path>
                <circle cx="200" cy="180" fill="#ba9eff" r="6" stroke="#0e0e10" strokeWidth="2"></circle>
                <circle cx="600" cy="80" fill="#ba9eff" r="6" stroke="#0e0e10" strokeWidth="2"></circle>
                <circle cx="1000" cy="50" fill="#ba9eff" r="6" stroke="#0e0e10" strokeWidth="2"></circle>
              </svg>
            </div>
          </section>

          {/* Lower Detail Grid (Bento Style) */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 bg-[#19191c] rounded-xl p-6 relative">
              <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Live Admissions</h4>
              <div className="space-y-4">
                
                <div className="flex items-center gap-4 p-3 bg-[#131315] rounded-lg border border-white/5">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuASIpPJx1Pm32THLITI1cjNdlRDtiIrTsbCPzf6dIlnAYbwoviTQ0-HFgFaVfkXb6vhqvPCjvP4Z-7I6_0Onnh9ph87gxPd6VkdFCJpo-pUH1xAbcsHLE-j4LsSwC-jlBV8Ui3cCmM4-STxBpRpjA28I-2Ef4Had1rk5ryv-XBrcCSSRGkoBVA3LBQUZxlMaVr9PuRGZrLQr34-GvxG8zUnrPL678-csyFbDTQI2dToR5ZmrmDujv9qV2rcEsB8qLkLYl31La96IiQA" alt="Customer" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">Alex Rivera <span className="text-[10px] font-normal text-zinc-500 ml-2">2m ago</span></p>
                    <p className="text-xs text-primary font-medium">VIP Backstage Pass • Scanned</p>
                  </div>
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                </div>

                <div className="flex items-center gap-4 p-3 bg-[#131315] rounded-lg border border-white/5">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold">S</div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">Sarah Chen <span className="text-[10px] font-normal text-zinc-500 ml-2">5m ago</span></p>
                    <p className="text-xs text-primary font-medium">Early Bird GA • Scanned</p>
                  </div>
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2 bg-[#19191c] rounded-xl p-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Tier Breakdown</h4>
              <div className="flex items-center gap-8 h-48">
                <div className="w-40 h-40 relative">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" fill="transparent" r="40" stroke="#262528" strokeWidth="20"></circle>
                    <circle cx="50" cy="50" fill="transparent" r="40" stroke="#ba9eff" strokeDasharray="251.2" strokeDashoffset="75.36" strokeWidth="20"></circle>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white">70%</span>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-center bg-[#131315] p-3 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_#ba9eff]"></div>
                      <span className="text-sm font-bold">Standard GA</span>
                    </div>
                    <span className="text-zinc-400 text-sm font-medium">1,988 scans</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#131315] p-3 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#262528]"></div>
                      <span className="text-sm font-bold">VIP Backstage</span>
                    </div>
                    <span className="text-zinc-400 text-sm font-medium">852 scans</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

      </main>
    </>
  );
}
