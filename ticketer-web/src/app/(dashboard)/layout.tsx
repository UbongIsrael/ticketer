'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TopNavBar, BottomNavBar } from '@/components/Navigation';
import { AuthGuard } from '@/components/AuthGuard';
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

  const navItem = (href: string, icon: string, label: string, exact = false) => {
    const active = exact
      ? pathname === href
      : isActivePath(href);
    return (
      <Link
        className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ease-in-out text-sm font-medium rounded-lg ${
          active
            ? 'text-[#ba9eff] bg-[#ba9eff]/10'
            : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
        }`}
        href={href}
      >
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
        {label}
      </Link>
    );
  };

  return (
    <AuthGuard>
      <div className="bg-[#09090b] min-h-screen text-on-surface selection:bg-primary/30 antialiased font-sans flex flex-col md:flex-row">
        <TopNavBar />

        {/* SideNavBar (Desktop Only) */}
        <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-[#0e0e10] flex-col gap-4 p-4 z-40 pt-20 border-r border-white/5">
          <div className="px-4 py-6 mb-4">
            <h2 className="text-[#ba9eff] font-bold text-lg">{user?.name || user?.email || user?.phone || 'User'}</h2>
            <p className="text-zinc-500 text-xs mt-1">
              {user?.capabilities?.includes('HOST') ? (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Host Account
                </span>
              ) : 'Member'}
            </p>
          </div>

          <div className="space-y-1 flex-1">
            {navItem('/', 'home', 'Home')}
            {navItem('/search', 'search', 'Search')}
            {navItem('/dashboard/tickets', 'confirmation_number', 'My Tickets')}
            {navItem('/dashboard/refunds', 'replay', 'Buy-backs')}
            {navItem('/dashboard/host-portal', 'theater_comedy', 'Host Portal')}

            {user?.capabilities?.includes('HOST') && (
              <>
                <div className="pt-4 pb-2 px-4">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-600 font-bold">Host Tools</p>
                </div>
                {navItem('/dashboard/host', 'bar_chart', 'Event Dashboard')}
              </>
            )}
          </div>

          <div className="pt-4 border-t border-white/5">
            {navItem('/dashboard/settings', 'settings', 'Settings')}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="md:pl-64 pt-20 pb-24 px-6 min-h-screen w-full">
          {children}
        </div>

        <BottomNavBar />
      </div>
    </AuthGuard>
  );
}
