'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getMyTickets, requestBuyback, TicketWithDetails } from '@/lib/api';
import { LoadingPage } from '@/components/Loading';
import { ErrorMessage } from '@/components/ErrorMessage';
import { EmptyState } from '@/components/EmptyState';
import { useRouter } from 'next/navigation';

// ─── Sell-back Confirm Modal ──────────────────────────────────────────────────

function SellBackModal({
  ticket,
  onClose,
  onSuccess,
}: {
  ticket: TicketWithDetails;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ amount_minor: number; mock_transfer_url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refundAmount = Math.round(ticket.price_paid_minor * 0.70);
  const formatCurrency = (minor: number) => `₦${(minor / 100).toLocaleString('en-NG')}`;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await requestBuyback({ ticket_id: ticket.id });
      setResult(res);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to initiate sell-back. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#131315] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6">
        {result ? (
          /* ── Success state ── */
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-emerald-400">check_circle</span>
            </div>
            <h3 className="text-xl font-black mb-2">Sell-back Initiated!</h3>
            <p className="text-on-surface-variant text-sm mb-4">
              Your refund of <strong className="text-emerald-400">{formatCurrency(result.amount_minor)}</strong> is being processed via Paystack.
            </p>
            {result.mock_transfer_url && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-5 text-left">
                <p className="text-xs text-amber-400 font-bold mb-2">Dev Mode — Simulate Transfer</p>
                <a
                  href={result.mock_transfer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-300 underline break-all"
                >
                  {result.mock_transfer_url}
                </a>
              </div>
            )}
            <button
              onClick={() => { onSuccess(); onClose(); }}
              className="w-full bg-primary text-[#0e0e10] py-3 rounded-lg font-bold transition-all active:scale-95"
            >
              Done
            </button>
          </div>
        ) : (
          /* ── Confirm state ── */
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Confirm Sell-back</h3>
              <button
                onClick={onClose}
                className="material-symbols-outlined text-zinc-500 hover:text-zinc-300 transition-colors text-xl"
              >
                close
              </button>
            </div>

            <div className="bg-[#1f1f22] rounded-xl p-4 mb-5 border border-white/5">
              <p className="font-bold text-on-surface">{ticket.event.title}</p>
              <p className="text-xs text-zinc-500 mt-1">{ticket.tier.name} · {ticket.ticket_code}</p>
              <p className="text-xs text-zinc-500">
                {new Date(ticket.event.starts_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="space-y-3 mb-5 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Original Price</span>
                <span className="text-on-surface line-through">{formatCurrency(ticket.price_paid_minor)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Buy-back Rate</span>
                <span className="text-on-surface">70%</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/5">
                <span className="font-bold text-on-surface">You Receive</span>
                <span className="font-black text-emerald-400 text-lg">{formatCurrency(refundAmount)}</span>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-5 flex items-start gap-2">
              <span className="material-symbols-outlined text-amber-400 text-sm mt-0.5">warning</span>
              <p className="text-xs text-amber-300">
                Once confirmed, your ticket will be voided immediately and cannot be recovered.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-xs text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 border border-white/10 text-zinc-400 py-3 rounded-lg font-bold hover:bg-zinc-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 py-3 rounded-lg font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> Processing...</>
                ) : (
                  <><span className="material-symbols-outlined text-sm">replay</span> Confirm Sell-back</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Tickets Page ────────────────────────────────────────────────────────

export default function MyTickets() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [sellBackTicket, setSellBackTicket] = useState<TicketWithDetails | null>(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await getMyTickets();
      setTickets(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load tickets'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      ISSUED:          { bg: 'bg-primary/10',          text: 'text-primary',      label: 'Confirmed' },
      VALIDATED:       { bg: 'bg-emerald-500/10',      text: 'text-emerald-400',  label: 'Used' },
      RESERVED:        { bg: 'bg-amber-500/10',        text: 'text-amber-400',    label: 'Reserved' },
      PAYMENT_PENDING: { bg: 'bg-amber-500/10',        text: 'text-amber-400',    label: 'Pending' },
      VOIDED:          { bg: 'bg-zinc-800',            text: 'text-zinc-400',     label: 'Voided' },
      VOID_PENDING:    { bg: 'bg-amber-500/10',        text: 'text-amber-400',    label: 'Processing' },
      REFUNDED:        { bg: 'bg-zinc-800',            text: 'text-zinc-400',     label: 'Refunded' },
      EVENT_EXPIRED:   { bg: 'bg-zinc-800',            text: 'text-zinc-400',     label: 'Past Event' },
    };
    return badges[status] ?? badges['ISSUED'];
  };

  const isActiveTicket = (ticket: TicketWithDetails) =>
    ['ISSUED', 'RESERVED', 'PAYMENT_PENDING'].includes(ticket.status);

  const canSellBack = (ticket: TicketWithDetails) => {
    if (ticket.status !== 'ISSUED') return false;
    const hoursDiff = (new Date(ticket.event.starts_at).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursDiff > 48;
  };

  if (loading) return <LoadingPage />;

  return (
    <>
      <main className="max-w-6xl mx-auto w-full">
        <header className="max-w-6xl mx-auto py-10">
          <span className="text-[0.6875rem] uppercase tracking-[0.15em] text-primary font-bold mb-2 block">
            Personal Vault
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-on-surface mb-4">
            My Tickets
          </h1>
          <p className="text-on-surface-variant max-w-xl text-sm">
            All your digital passes, encrypted and ready for entry. Sell back eligible tickets up to 48 hours before the event.
          </p>
        </header>

        {error && (
          <section className="max-w-6xl mx-auto mb-8">
            <ErrorMessage error={error} retry={fetchTickets} />
          </section>
        )}

        {!loading && tickets.length === 0 ? (
          <section className="max-w-6xl mx-auto">
            <EmptyState
              icon="confirmation_number"
              title="No tickets yet"
              description="Start exploring events and grab your tickets to amazing experiences."
              action={{ label: 'Browse Events', onClick: () => router.push('/search') }}
            />
          </section>
        ) : (
          <section className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tickets.map((ticket) => {
                const badge = getStatusBadge(ticket.status);
                const active = isActiveTicket(ticket);
                const sellable = canSellBack(ticket);

                return (
                  <div
                    key={ticket.id}
                    className={`bg-[#121216] rounded-xl overflow-hidden flex flex-col md:flex-row relative ticket-notch border transition-all duration-300 hover:scale-[1.01] ${
                      active
                        ? 'border-primary/50 shadow-[0_0_20px_rgba(186,158,255,0.12)]'
                        : 'border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                    }`}
                  >
                    {/* Event image */}
                    <div className="md:w-36 h-40 md:h-auto relative flex-none">
                      {ticket.event.cover_image_url ? (
                        <img
                          className="w-full h-full object-cover"
                          src={ticket.event.cover_image_url}
                          alt={ticket.event.title}
                        />
                      ) : (
                        <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                          <span className="material-symbols-outlined text-3xl text-on-surface-variant opacity-20">event</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#121216]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0 pr-3">
                            <h3 className="text-lg font-bold text-on-surface tracking-tight truncate">
                              {ticket.event.title}
                            </h3>
                            <p className="text-primary text-xs font-semibold mt-0.5">{ticket.tier.name}</p>
                          </div>
                          <span className={`${badge.bg} ${badge.text} text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider flex-none`}>
                            {badge.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div>
                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-0.5">Date</p>
                            <p className="text-xs font-semibold">{formatDate(ticket.event.starts_at)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-0.5">Time</p>
                            <p className="text-xs font-semibold">{formatTime(ticket.event.starts_at)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-0.5">Venue</p>
                            <p className="text-xs font-semibold truncate">{ticket.event.venue_name}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-0.5">Code</p>
                            <p className="text-xs font-semibold font-mono">{ticket.ticket_code}</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {active ? (
                          <>
                            <Link
                              href={`/dashboard/tickets/${ticket.id}`}
                              className="flex-1 bg-primary text-[#0e0e10] py-2 rounded-lg font-bold text-xs hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-xs">qr_code_2</span>
                              View QR
                            </Link>
                            {sellable && (
                              <button
                                onClick={() => setSellBackTicket(ticket)}
                                className="flex-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-2 rounded-lg font-bold text-xs hover:bg-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                              >
                                <span className="material-symbols-outlined text-xs">replay</span>
                                Sell Back
                              </button>
                            )}
                          </>
                        ) : (
                          <Link
                            href={`/events/${ticket.event.slug}`}
                            className="flex-1 bg-zinc-800 text-zinc-400 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-zinc-700 transition-all"
                          >
                            <span className="material-symbols-outlined text-xs">info</span>
                            Event Info
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Sell-back modal */}
      {sellBackTicket && (
        <SellBackModal
          ticket={sellBackTicket}
          onClose={() => setSellBackTicket(null)}
          onSuccess={fetchTickets}
        />
      )}
    </>
  );
}
