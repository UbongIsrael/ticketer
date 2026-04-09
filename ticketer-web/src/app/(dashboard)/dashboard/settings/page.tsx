'use client';

import Link from 'next/link';

export default function UserSettings() {
  return (
    <>
      <main className="max-w-4xl mx-auto w-full">
            <header className="mb-12">
              <h1 className="text-4xl font-extrabold tracking-tight text-[#f9f5f8] mb-2">Account Settings</h1>
              <p className="text-zinc-400">Manage your profile information, preferences, and linked accounts.</p>
            </header>
            
            <div className="grid grid-cols-1 gap-8">
              
              {/* Profile Section */}
              <section className="bg-[#131315] rounded-xl p-6 md:p-8 shadow-2xl relative overflow-hidden border border-white/5">
                <div className="absolute top-0 right-0 p-6 md:p-8">
                  <button className="flex items-center gap-2 text-primary hover:text-violet-300 transition-colors text-sm font-semibold">
                    <span className="material-symbols-outlined text-lg">edit</span>
                    <span className="hidden md:inline">Edit Profile</span>
                  </button>
                </div>
                
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10 text-center md:text-left">
                  <div className="relative">
                    <img className="w-32 h-32 rounded-xl object-cover ring-4 ring-[#1f1f22] shadow-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBK3N2vxtedcWNWfKUe5YoPNv7KQ9sPPXJ5F0rGh_5vDr8LrtYqfc8L_CE7satVHivh-3_vApm1IQP6MXb04-Z-PBMUDhseGjQHupIjS1-EiwAo3uzAQQU_mcalsnx7L8zir6lr-Kf8KIk5ntr4I2MkLbExZ3uRgAQGfFuuZJwVmRj6tUz28LOXt9m4BmVo3X3Ih6tkGLeSpCTook03f00sdGc2dWiPq9CtCKVe0oyTQPA8Zj6FVu6m1ni1ucQ8ejpsBDcEP5WeSaq2" alt="Large Avatar"/>
                    <div className="absolute -bottom-2 -right-2 bg-primary p-2 rounded-lg text-[#0e0e10] shadow-lg cursor-pointer hover:bg-violet-400 transition-colors">
                      <span className="material-symbols-outlined text-lg">photo_camera</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <h2 className="text-2xl font-bold text-[#f9f5f8]">Alex Rivers</h2>
                    <p className="text-zinc-400 mb-4">alex.rivers@vibecheck.io</p>
                    <div className="flex justify-center md:justify-start gap-4">
                      <div className="bg-[#1f1f22] px-4 py-2 rounded-lg">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Upcoming Events</p>
                        <p className="text-xl font-bold text-[#f9f5f8]">12</p>
                      </div>
                      <div className="bg-[#1f1f22] px-4 py-2 rounded-lg">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Vibe Score</p>
                        <p className="text-xl font-bold text-primary">842</p>
                      </div>
                    </div>
                    <button className="mt-6 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-black py-2 px-6 rounded-lg font-bold text-xs uppercase tracking-widest transition-all">
                      Upgrade to Host
                    </button>
                  </div>
                </div>
                
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Display Name</label>
                    <input className="bg-[#262528] border-none outline-none rounded-lg p-3 text-[#f9f5f8] focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-zinc-600" type="text" defaultValue="Alex Rivers"/>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Email Address</label>
                    <input className="bg-[#262528] border-none outline-none rounded-lg p-3 text-[#f9f5f8] focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-zinc-600" type="email" defaultValue="alex.rivers@vibecheck.io"/>
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Bio</label>
                    <textarea className="bg-[#262528] border-none outline-none rounded-lg p-3 text-[#f9f5f8] focus:ring-2 focus:ring-primary/40 transition-all resize-none placeholder:text-zinc-600" rows={3} defaultValue="Music enthusiast, frequent concert-goer, and amateur sound engineer based in Seattle. Loving the new wave of synth-pop."></textarea>
                  </div>
                </form>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Host Settings & KYC */}
                <section className="bg-[#131315] rounded-xl p-8 border border-white/5">
                  <h3 className="text-lg font-bold text-[#f9f5f8] mb-6">Host Verification & Payouts</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#1f1f22] rounded-lg group hover:bg-[#262528] transition-colors border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 flex items-center justify-center bg-emerald-500/10 rounded-full">
                          <span className="material-symbols-outlined text-emerald-400">verified_user</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold">Identity Verification</p>
                          <p className="text-xs text-zinc-400">Smile ID Verified</p>
                        </div>
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-[10px] items-center flex font-bold tracking-widest uppercase">Verified</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#1f1f22] rounded-lg group hover:bg-[#262528] transition-colors border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 flex items-center justify-center bg-[#262528] rounded-full">
                          <span className="material-symbols-outlined text-zinc-400">account_balance</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold">Settlement Account</p>
                          <p className="text-xs text-zinc-400">GTBank •••• 1234</p>
                        </div>
                      </div>
                      <button className="text-xs font-bold text-zinc-500 hover:text-white transition-colors">Edit</button>
                    </div>
                  </div>
                </section>

                {/* Notifications Toggle */}
                <section className="bg-[#131315] rounded-xl p-8 border border-white/5">
                  <h3 className="text-lg font-bold text-[#f9f5f8] mb-6">Notification Settings</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">New Concert Alerts</p>
                        <p className="text-xs text-zinc-400">Based on your favorite artists</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input className="sr-only peer" type="checkbox" defaultChecked />
                        <div className="w-11 h-6 bg-[#262528] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-white/5"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">Price Drop Notifications</p>
                        <p className="text-xs text-zinc-400">When tickets go below ₦50k</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input className="sr-only peer" type="checkbox" defaultChecked />
                        <div className="w-11 h-6 bg-[#262528] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-white/5"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">Newsletter</p>
                        <p className="text-xs text-zinc-400">Weekly curation of top vibes</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input className="sr-only peer" type="checkbox" />
                        <div className="w-11 h-6 bg-[#262528] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-white/5"></div>
                      </label>
                    </div>
                  </div>
                </section>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-end gap-4 pt-6 mt-4">
                <button className="px-8 py-3 rounded-lg text-sm font-bold text-[#f9f5f8] hover:bg-[#1f1f22] transition-all active:scale-95 border border-white/5">Cancel</button>
                <button className="px-10 py-3 rounded-lg text-sm font-bold bg-[#ba9eff] text-[#0e0e10] hover:bg-[#ae8dff] transition-all shadow-[0_0_20px_rgba(186,158,255,0.3)] active:scale-95">Save Changes</button>
              </div>
              
            </div>
      </main>
    </>
  );
}
