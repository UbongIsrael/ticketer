'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getMyTickets, TicketWithDetails } from '@/lib/api';
import { LoadingPage } from '@/components/Loading';
import { ErrorMessage } from '@/components/ErrorMessage';
import { EmptyState } from '@/components/EmptyState';
import { useRouter } from 'next/navigation';

export default function MyTickets() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

  useEffect(() => {
    fetchTickets();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'ISSUED': { bg: 'bg-primary/10', text: 'text-primary', label: 'Confirmed' },
      'VALIDATED': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Used' },
      'RESERVED': { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Reserved' },
      'PAYMENT_PENDING': { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Pending' },
      'VOIDED': { bg: 'bg-zinc-800', text: 'text-zinc-400', label: 'Voided' },
      'REFUNDED': { bg: 'bg-zinc-800', text: 'text-zinc-400', label: 'Refunded' },
      'EVENT_EXPIRED': { bg: 'bg-zinc-800', text: 'text-zinc-400', label: 'Past Event' },
    };
    
    const badge = badges[status as keyof typeof badges] || badges['ISSUED'];
    return badge;
  };

  const isActiveTicket = (ticket: TicketWithDetails) => {
    return ['ISSUED', 'RESERVED', 'PAYMENT_PENDING'].includes(ticket.status);
  };

  const canRefund = (ticket: TicketWithDetails) => {
    if (ticket.status !== 'ISSUED') return false;
    const eventDate = new Date(ticket.event.starts_at);
    const now = new Date();
    const hoursDiff = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDiff > 48; // Can refund if more than 48 hours before event
  };

  if (loading) return <LoadingPage />;

  return (
    <>
      <main className="max-w-6xl mx-auto w-full">
        <header className="max-w-6xl mx-auto py-10">
          <span className="text-[0.6875rem] uppercase tracking-[0.15em] text-primary font-bold mb-2 block">Personal Vault</span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-on-surface mb-4">My Tickets</h1>
          <p className="text-on-surface-variant max-w-xl">Your gateway to the next sonic experience. All digital passes are encrypted and ready for entry.</p>
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
              action={{
                label: 'Browse Events',
                onClick: () => router.push('/search')
              }}
            />
          </section>
        ) : (
          <section className="max-w-6xl mx-auto relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {tickets.map((ticket) => {
                const badge = getStatusBadge(ticket.status);
                const active = isActiveTicket(ticket);
                
                return (
                  <div 
                    key={ticket.id}
                    className={`bg-[#121216] rounded-[8px] overflow-hidden flex flex-col md:flex-row relative ticket-notch border transition-transform hover:scale-[1.01] duration-300 ${
                      active 
                        ? 'border-primary/50 shadow-[0_0_20px_rgba(186,158,255,0.15)]' 
                        : 'border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                    }`}
                  >
                    <div className="md:w-1/3 h-48 md:h-auto relative">
                      {ticket.event.cover_image_url ? (
                        <img 
                          className="w-full h-full object-cover" 
                          src={ticket.event.cover_image_url} 
                          alt={ticket.event.title}
                        />
                      ) : (
                        <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-30">
                            event
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#121216]"></div>
                    </div>
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-on-surface tracking-tight">
                              {ticket.event.title}
                            </h3>
                            <p className="text-primary text-sm font-medium">{ticket.tier.name}</p>
                          </div>
                          <span className={`${badge.bg} ${badge.text} text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div>
                            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Date</p>
                            <p className="text-sm font-semibold">{formatDate(ticket.event.starts_at)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Time</p>
                            <p className="text-sm font-semibold">{formatTime(ticket.event.starts_at)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Venue</p>
                            <p className="text-sm font-semibold">{ticket.event.venue_name}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Code</p>
                            <p className="text-sm font-semibold font-mono">{ticket.ticket_code}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        {active && (
                          <>
                            <Link
                              href={`/dashboard/tickets/${ticket.id}`}
                              className="flex-1 bg-primary text-[#0e0e10] py-2.5 rounded-[8px] font-bold text-sm hover:bg-primary-dim transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                              <span className="material-symbols-outlined text-sm">qr_code_2</span> View QR
                            </Link>
                            {canRefund(ticket) && (
                              <button className="flex-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-2.5 rounded-[8px] font-bold text-sm hover:bg-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-sm">replay</span> Sell Back
                              </button>
                            )}
                          </>
                        )}
                        {!active && (
                          <Link
                            href={`/events/${ticket.event.slug}`}
                            className="flex-1 bg-zinc-800 text-zinc-400 py-2.5 rounded-[8px] font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">info</span> Event Info
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
    </>
  );
}
