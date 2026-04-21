'use client';

import { Suspense, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/store/userStore';

function AuthGuardInner({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      const qs = searchParams.toString();
      const currentUrl = pathname + (qs ? `?${qs}` : '');
      const returnUrl = encodeURIComponent(currentUrl);
      router.replace(`/login?returnUrl=${returnUrl}`);
    }
  }, [hydrated, isAuthenticated, pathname, searchParams, router]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Loading</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}

export function AuthGuard({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Loading</p>
        </div>
      </div>
    }>
      <AuthGuardInner>{children}</AuthGuardInner>
    </Suspense>
  );
}
