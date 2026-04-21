'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMyRefunds, requestBuyback, RefundWithDetails } from '@/lib/api';
import { LoadingPage } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import { ErrorMessage } from '@/components/ErrorMessage';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  pending:  { bg: 'bg-amber-500/10',   text: 'text-amber-400',   label: 'Processing',  icon: 'schedule' },
  settled:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Refunded',    icon: 'check_circle' },
  failed:   { bg: 'bg-red-500/10',     text: 'text-red-400',     label: 'Failed',      icon: 'error' },
};

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<RefundWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const data = await getMyRefunds();
      setRefunds(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load refunds'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRefunds(); }, []);

  const formatCurrency = (minor: number) =>
    `₦${(minor / 100).toLocaleString('en-NG')}`;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) return <LoadingPage />;

  return (
    <main className="max-w-4xl mx-auto w-full">
      <header className="py-10 mb-4">
        <span className="text-[0.6875rem] uppercase tracking-[0.15em] text-primary font-bold mb-2 block">
          Financial History
        </span>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-on-surface mb-3">
          Buy-back Refunds
        </h1>
        <p className="text-on-surface-variant max-w-lg text-sm">
          Track all your ticket sell-back requests and refund statuses. Refunds are processed via Paystack and credited within 24 hours.
        </p>
      </header>

      {error && (
        <div className="mb-8">
          <ErrorMessage error={error} retry={fetchRefunds} />
        </div>
      )}

      {!loading && refunds.length === 0 ? (
        <EmptyState
          icon="receipt_long"
          title="No refunds yet"
          description="When you sell a ticket back to Ticketer, your refund history will appear here."
          action={{ label: 'Browse My Tickets', onClick: () => window.location.href = '/dashboard/tickets' }}
        />
      ) : (
        <div className="space-y-4">
          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              {
                label: 'Total Refunded',
                value: formatCurrency(refunds.filter(r => r.status === 'settled').reduce((s, r) => s + r.refund_amount_minor, 0)),
                icon: 'payments',
                color: 'text-emerald-400',
              },
              {
                label: 'Pending',
                value: refunds.filter(r => r.status === 'pending').length,
                icon: 'schedule',
                color: 'text-amber-400',
              },
              {
                label: 'Total Requests',
                value: refunds.length,
                icon: 'replay',
                color: 'text-primary',
              },
            ].map(stat => (
              <div key={stat.label} className="bg-[#131315] rounded-xl p-5 border border-white/5">
                <span className={`material-symbols-outlined text-2xl ${stat.color} mb-2 block`}>
                  {stat.icon}
                </span>
                <p className="text-2xl font-black text-on-surface tracking-tight">{stat.value}</p>
                <p className="text-[11px] text-zinc-500 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Refund list */}
          {refunds.map(refund => {
            const style = STATUS_STYLES[refund.status] ?? STATUS_STYLES['pending'];
            return (
              <div
                key={refund.id}
                className="bg-[#131315] rounded-xl border border-white/5 p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-white/10 transition-colors"
              >
                {/* Event cover thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-none bg-zinc-800 flex items-center justify-center">
                  {refund.ticket?.event?.cover_image_url ? (
                    <img
                      src={refund.ticket.event.cover_image_url}
                      alt="Event"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-zinc-600 text-2xl">event</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-on-surface truncate">
                    {refund.ticket?.event?.title ?? 'Unknown Event'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="text-xs text-zinc-500">
                      Ticket&nbsp;<span className="font-mono">{refund.ticket?.ticket_code ?? '—'}</span>
                    </span>
                    <span className="text-xs text-zinc-600">•</span>
                    <span className="text-xs text-zinc-500">{formatDate(refund.created_at)}</span>
                  </div>
                </div>

                {/* Amounts */}
                <div className="flex flex-col items-end gap-1 text-right flex-none">
                  <p className="font-black text-on-surface text-lg">
                    {formatCurrency(refund.refund_amount_minor)}
                  </p>
                  <p className="text-xs text-zinc-600 line-through">
                    {formatCurrency(refund.original_amount_minor)}
                  </p>
                  <p className="text-[10px] text-zinc-600">70% buy-back rate</p>
                </div>

                {/* Status badge */}
                <div className="flex-none">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${style.bg} ${style.text}`}>
                    <span className={`material-symbols-outlined text-[14px]`}>{style.icon}</span>
                    {style.label}
                  </span>
                  {refund.status === 'failed' && refund.failure_reason && (
                    <p className="text-[11px] text-red-400 mt-1 text-right max-w-[160px]">
                      {refund.failure_reason}
                    </p>
                  )}
                  {refund.status === 'settled' && refund.settled_at && (
                    <p className="text-[11px] text-zinc-600 mt-1 text-right">
                      Settled {formatDate(refund.settled_at)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
