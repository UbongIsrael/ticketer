'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TopNavBar, BottomNavBar } from '@/components/Navigation';
import { useUserStore } from '@/store/userStore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useUserStore();

  const isActivePath = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(path);
  };

  return (
    <div className="bg-[#09090b] min-h-screen text-on-surface selection:bg-primary/30 antialiased font-sans flex flex-col md:flex-row">
      <TopNavBar />

      {/* SideNavBar (Desktop Only) */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-[#0e0e10] flex-col gap-4 p-4 z-40 pt-20 border-r border-white/5">
        <div className="px-4 py-6 mb-4">
          <h2 className="text-[#ba9eff] font-bold text-lg">{user?.name || 'User'}</h2>
          <p className="text-zinc-500 text-xs">
            {user?.capabilities?.includes('HOST') ? 'Host Account' : 'Member'}
          </p>
        </div>
        <div className="space-y-1">
          <Link 
            className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ease-in-out text-sm font-medium rounded-lg ${
              isActivePath('/') && !isActivePath('/search') && !isActivePath('/dashboard')
                ? 'text-zinc-200 bg-zinc-800/50'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
            href="/"
          >
            <span className="material-symbols-outlined">home</span> Home
          </Link>
          <Link 
            className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ease-in-out text-sm font-medium rounded-lg ${
              isActivePath('/search')
                ? 'text-zinc-200 bg-zinc-800/50'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
            href="/search"
          >
            <span className="material-symbols-outlined">search</span> Search
          </Link>
          <Link 
            className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ease-in-out text-sm font-medium rounded-lg ${
              isActivePath('/dashboard/tickets')
                ? 'text-[#ba9eff] bg-[#ba9eff]/10'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
            href="/dashboard/tickets"
          >
            <span className="material-symbols-outlined">confirmation_number</span> My Tickets
          </Link>
          
          {user?.capabilities?.includes('HOST') && (
            <Link 
              className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ease-in-out text-sm font-medium rounded-lg ${
                isActivePath('/dashboard/host')
                  ? 'text-[#ba9eff] bg-[#ba9eff]/10'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
              href="/dashboard/host"
            >
              <span className="material-symbols-outlined">theater_comedy</span> Host Portal
            </Link>
          )}
          
          <Link 
            className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ease-in-out text-sm font-medium rounded-lg mt-auto ${
              isActivePath('/dashboard/settings')
                ? 'text-[#ba9eff] bg-[#ba9eff]/10'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
            href="/dashboard/settings"
          >
            <span className="material-symbols-outlined">settings</span> Settings
          </Link>
        </div>
      </aside>

      {/* Main Content Area — offset by sidebar width on desktop */}
      <div className="md:pl-64 pt-20 pb-24 px-6 min-h-screen w-full">
        {children}
      </div>

      <BottomNavBar />
    </div>
  );
}
