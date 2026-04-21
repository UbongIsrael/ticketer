'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/axios';
import { useUserStore } from '@/store/userStore';
import { LoadingPage, LoadingSpinner } from '@/components/Loading';

function MockSmileIdentityInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get('ref');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!reference) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/kyc/webhooks/smile-identity', {
        reference,
        status: 'verified',
        verification_data: {
          name: 'Jane Mocked',
          dob: '1995-10-10',
          id_number: 'NIN-1234567890'
        }
      });
      
      // Update local zustand store so the frontend instantly recognizes the new HOST capability
      const { user, updateUser } = useUserStore.getState();
      if (user && !user.capabilities.includes('HOST')) {
        updateUser({ capabilities: [...user.capabilities, 'HOST'] });
      }

      // Webhook successfully processed -> redirect to dashboard
      router.push('/dashboard/host-portal');
    } catch (err: any) {
      setError(err.message || 'Failed to simulate webhook');
      setLoading(false);
    }
  };

  const handleFail = async () => {
    if (!reference) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/kyc/webhooks/smile-identity', {
        reference,
        status: 'failed',
        verification_data: null
      });
      router.push('/dashboard/host-portal');
    } catch (err: any) {
      setError(err.message || 'Failed to simulate webhook');
      setLoading(false);
    }
  };

  if (!reference) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center p-6">
        <p>Missing Reference ID</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] flex items-center justify-center p-6 font-sans antialiased text-white">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-[#ba9eff]/10 text-[#ba9eff] rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl">face</span>
          </div>
          <h1 className="text-2xl font-black uppercase text-zinc-100 tracking-tight">Mock Identity Check</h1>
          <p className="text-sm text-zinc-400">Simulating Smile Identity verification for Reference: <span className="text-[#ba9eff]">{reference}</span></p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4 pt-4">
          <button 
            onClick={handleVerify}
            disabled={loading}
            className="w-full h-12 bg-[#ba9eff] hover:bg-[#ba9eff]/90 text-zinc-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <LoadingSpinner size="sm" /> : <span className="material-symbols-outlined text-lg">check_circle</span>}
            Pass Verification
          </button>
          
          <button 
            onClick={handleFail}
            disabled={loading}
            className="w-full h-12 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <LoadingSpinner size="sm" /> : <span className="material-symbols-outlined text-lg">cancel</span>}
            Fail Verification
          </button>
        </div>
        
        <p className="text-xs text-center text-zinc-600 mt-4">
          This page is only visible in the simulator for testing bypass scenarios.
        </p>
      </div>
    </div>
  );
}

export default function MockSmileIdentityPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <MockSmileIdentityInner />
    </Suspense>
  );
}
