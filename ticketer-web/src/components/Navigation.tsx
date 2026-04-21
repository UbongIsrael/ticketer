'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useUserStore } from '@/store/userStore';
import { useRouter, usePathname } from 'next/navigation';

export function TopNavBar() {
  const { isAuthenticated, user, logout } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    router.push('/');
  };

  const isActivePath = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0e0e10]/70 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
      <div className="flex justify-between items-center px-6 py-3 w-full">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-black tracking-tighter text-[#ba9eff] uppercase">
            Ticketer
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link
              className={`transition-colors hover:bg-white/5 px-3 py-1 rounded-lg ${isActivePath('/') && !isActivePath('/search') && !isActivePath('/dashboard')
                  ? 'text-[#ba9eff] font-bold'
                  : 'text-zinc-400'
                }`}
              href="/"
            >
              Home
            </Link>
            <Link
              className={`transition-colors hover:bg-white/5 px-3 py-1 rounded-lg ${isActivePath('/search') ? 'text-[#ba9eff] font-bold' : 'text-zinc-400'
                }`}
              href="/search"
            >
              Search
            </Link>
            {isAuthenticated && (
              <Link
                className={`transition-colors hover:bg-white/5 px-3 py-1 rounded-lg ${isActivePath('/dashboard/tickets') ? 'text-[#ba9eff] font-bold' : 'text-zinc-400'
                  }`}
                href="/dashboard/tickets"
              >
                My Tickets
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex bg-surface-container-highest rounded-full px-4 py-1.5 items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-sm w-48 text-on-surface outline-none"
              placeholder="Search events..."
              type="text"
              onFocus={() => router.push('/search')}
            />
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button className="material-symbols-outlined text-zinc-400 hover:bg-white/5 p-2 rounded-full transition-all">
                notifications
              </button>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="material-symbols-outlined text-zinc-400 hover:bg-white/5 p-2 rounded-full transition-all"
                >
                  person
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-surface-container-low rounded-lg shadow-2xl border border-outline-variant/10 py-2 overflow-hidden">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-outline-variant/10">
                      <p className="font-bold text-sm">{user?.name || 'User'}</p>
                      <p className="text-xs text-on-surface-variant">{user?.email || user?.phone}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        href="/dashboard/tickets"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-high transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <span className="material-symbols-outlined text-sm">confirmation_number</span>
                        <span className="text-sm">My Tickets</span>
                      </Link>

                      <Link
                        href="/dashboard/host-portal"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-high transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <span className="material-symbols-outlined text-sm">theater_comedy</span>
                        <span className="text-sm">Host Portal</span>
                      </Link>

                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-high transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <span className="material-symbols-outlined text-sm">settings</span>
                        <span className="text-sm">Settings</span>
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-outline-variant/10 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-high transition-colors w-full text-left text-error"
                      >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="material-symbols-outlined text-zinc-400 hover:bg-white/5 p-2 rounded-full transition-all"
              >
                person
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export function BottomNavBar() {
  const { isAuthenticated } = useUserStore();
  const pathname = usePathname();

  const isActivePath = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 w-full h-20 rounded-t-2xl z-50 bg-[#1f1f22]/90 backdrop-blur-md text-[10px] uppercase tracking-widest border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="flex justify-between items-center px-8 h-full w-full">
        <Link
          className={`flex flex-col items-center gap-1 transition-all ${isActivePath('/') && !isActivePath('/search') && !isActivePath('/dashboard')
              ? 'text-[#ba9eff] scale-110'
              : 'text-zinc-400 hover:text-white active:opacity-90'
            }`}
          href="/"
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={isActivePath('/') && !isActivePath('/search') && !isActivePath('/dashboard') ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            home
          </span>
          <span>Home</span>
        </Link>

        <Link
          className={`flex flex-col items-center gap-1 transition-all ${isActivePath('/search') ? 'text-[#ba9eff] scale-110' : 'text-zinc-400 hover:text-white active:opacity-90'
            }`}
          href="/search"
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={isActivePath('/search') ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            search
          </span>
          <span>Search</span>
        </Link>

        {isAuthenticated ? (
          <Link
            className={`flex flex-col items-center gap-1 transition-all ${isActivePath('/dashboard/tickets') ? 'text-[#ba9eff] scale-110' : 'text-zinc-400 hover:text-white active:opacity-90'
              }`}
            href="/dashboard/tickets"
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={isActivePath('/dashboard/tickets') ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              confirmation_number
            </span>
            <span>Tickets</span>
          </Link>
        ) : (
          <Link
            className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-all active:opacity-90"
            href="/login"
          >
            <span className="material-symbols-outlined text-2xl">person</span>
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
