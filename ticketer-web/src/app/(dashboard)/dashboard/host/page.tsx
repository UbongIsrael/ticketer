'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getMyHostEvents, getEventBySlug, requestPartialPayout, Event, EventWithTiers } from '@/lib/api';
import { LoadingPage } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';

function EventDashboardInner() {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get('event');

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(preselectedId);
  const [selectedEvent, setSelectedEvent] = useState<EventWithTiers | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState<string | null>(null);

  // Fetch host events list
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMyHostEvents();
        setEvents(data);
        // Auto-select first published event if none pre-selected
        if (!preselectedId && data.length > 0) {
          const pub = data.find(e => e.status === 'published') ?? data[0];
          setSelectedId(pub.id);
        }
      } catch {
        // silently fail — empty state shown
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Fetch full event + tiers when selection changes
  useEffect(() => {
    if (!selectedId) return;
    const ev = events.find(e => e.id === selectedId);
    if (!ev) return;
    getEventBySlug(ev.slug).then(setSelectedEvent).catch(() => {});
  }, [selectedId, events]);

  const formatCurrency = (minor: number) =>
    `₦${(minor / 100).toLocaleString('en-NG')}`;

  const handleRequestPayout = async () => {
    if (!selectedId) return;
    setRequestingPayout(true);
    setPayoutMsg(null);
    try {
      const res = await requestPartialPayout(selectedId, 0);
      setPayoutMsg(`✅ Payout of ${formatCurrency(res.amount_minor)} initiated`);
    } catch (err: any) {
      setPayoutMsg(`⚠️ ${err.response?.data?.message ?? 'Payout request failed'}`);
    } finally {
      setRequestingPayout(false);
    }
  };

  if (loading) return <LoadingPage />;

  if (events.length === 0) {
    return (
      <main className="max-w-7xl mx-auto w-full">
        <EmptyState
          icon="bar_chart"
          title="No events to analyse"
          description="Create and publish an event from the Host Portal to see real-time analytics here."
          action={{ label: 'Go to Host Portal', onClick: () => window.location.href = '/dashboard/host-portal' }}
        />
      </main>
    );
  }

  const ev = selectedEvent;
  const totalSold = ev?.tiers?.reduce((s, t) => s + t.sold_count, 0) ?? 0;
  const totalCapacity = ev?.tiers?.reduce((s, t) => s + t.total_quantity, 0) ?? 0;
  const grossRevenue = ev?.tiers?.reduce((s, t) => s + t.sold_count * t.price_minor, 0) ?? 0;
  const netRevenue = Math.round(grossRevenue * 0.92); // after 8% commission
  const fillPct = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;

  // Donut arc for sold-vs-capacity
  const CIRCUMFERENCE = 251.2;
  const dashOffset = CIRCUMFERENCE - (CIRCUMFERENCE * fillPct) / 100;

  return (
    <main className="max-w-7xl mx-auto w-full">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <span className="text-[0.6875rem] uppercase tracking-[0.15em] text-primary font-bold mb-1 block">Event Dashboard</span>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">
            {ev?.title ?? 'Select an event'}
          </h1>
          {ev && (
            <p className="text-zinc-400 text-sm">
              {ev.venue_name} · {ev.city} ·{' '}
              {new Date(ev.starts_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Event selector */}
          {events.length > 1 && (
            <select
              value={selectedId ?? ''}
              onChange={e => setSelectedId(e.target.value)}
              className="bg-[#1f1f22] border border-white/10 text-sm text-on-surface rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {events.map(e => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          )}

          <button
            onClick={handleRequestPayout}
            disabled={requestingPayout || !ev || ev.status === 'draft'}
            className="bg-primary hover:bg-primary/90 text-[#0e0e10] px-6 py-2.5 rounded-lg text-sm font-bold active:opacity-80 transition-all shadow-[0_0_20px_rgba(186,158,255,0.3)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">payments</span>
            {requestingPayout ? 'Processing...' : 'Request Payout'}
          </button>
        </div>
      </div>

      {payoutMsg && (
        <div className="mb-6 bg-[#1f1f22] border border-white/10 rounded-lg p-4 text-sm text-on-surface-variant">
          {payoutMsg}
        </div>
      )}

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          {
            label: 'Gross Revenue',
            value: formatCurrency(grossRevenue),
            sub: `${formatCurrency(netRevenue)} net (after 8% fee)`,
            icon: 'shopping_bag',
            up: true,
          },
          {
            label: 'Tickets Sold',
            value: totalSold.toLocaleString(),
            sub: `of ${totalCapacity.toLocaleString()} capacity`,
            icon: 'confirmation_number',
            up: null,
          },
          {
            label: 'Fill Rate',
            value: `${fillPct}%`,
            sub: ev?.status === 'published' ? 'Event is live' : ev?.status ?? '',
            icon: 'insights',
            up: fillPct > 50,
          },
        ].map(stat => (
          <div key={stat.label} className="bg-[#131315] p-6 rounded-xl relative overflow-hidden group transition-all border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase mb-4">{stat.label}</p>
              <div className="flex items-end justify-between">
                <h3 className="text-4xl font-black text-on-surface tracking-tighter">{stat.value}</h3>
                {stat.up !== null && (
                  <span className={`text-xs font-bold px-2 py-1 rounded flex items-center gap-1 ${stat.up ? 'bg-primary/10 text-primary' : 'bg-zinc-800 text-zinc-500'}`}>
                    <span className="material-symbols-outlined text-xs">{stat.up ? 'trending_up' : 'trending_flat'}</span>
                    {stat.sub}
                  </span>
                )}
              </div>
              {stat.up === null && <p className="text-xs text-zinc-500 mt-2">{stat.sub}</p>}
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-8xl text-primary">{stat.icon}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Chart (SVG sparkline) */}
      <section className="bg-[#131315] rounded-xl overflow-hidden mb-8 border border-white/5">
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
          <div>
            <h4 className="text-lg font-bold">Revenue Over Time</h4>
            <p className="text-xs text-zinc-500">Cumulative ticket sales</p>
          </div>
        </div>
        <div className="h-56 relative w-full chart-grid p-8">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 180" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ba9eff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ba9eff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 180 L0 160 Q 150 140 300 110 T 600 70 T 900 40 T 1000 30 L 1000 180 Z" fill="url(#chartGradient)" />
            <path className="drop-shadow-[0_0_15px_rgba(186,158,255,0.6)]" d="M0 160 Q 150 140 300 110 T 600 70 T 900 40 T 1000 30" fill="none" stroke="#ba9eff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          </svg>
        </div>
      </section>

      {/* Bento grid */}
      {ev && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tier Breakdown */}
          <div className="bg-[#19191c] rounded-xl p-6 border border-white/5">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Tier Breakdown</h4>
            {ev.tiers.length === 0 ? (
              <p className="text-zinc-600 text-sm">No tiers found.</p>
            ) : (
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 relative flex-none">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" fill="transparent" r="40" stroke="#262528" strokeWidth="18" />
                    <circle
                      cx="50" cy="50" fill="transparent" r="40"
                      stroke="#ba9eff"
                      strokeDasharray={CIRCUMFERENCE}
                      strokeDashoffset={dashOffset}
                      strokeWidth="18"
                      style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-white">{fillPct}%</span>
                    <span className="text-[9px] text-zinc-500">SOLD</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  {ev.tiers.map(tier => (
                    <div key={tier.id} className="flex justify-between items-center bg-[#131315] p-2.5 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_6px_#ba9eff]" />
                        <span className="text-sm font-medium">{tier.name}</span>
                      </div>
                      <span className="text-zinc-400 text-xs font-medium">
                        {tier.sold_count} / {tier.total_quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-[#19191c] rounded-xl p-6 border border-white/5">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Quick Actions</h4>
            <div className="space-y-3">
              {[
                { icon: 'qr_code_scanner', label: 'Open Scanner', sub: 'Scan tickets at the gate', href: '/dashboard/host/scanner' },
                { icon: 'info', label: 'View Event Page', sub: 'See how buyers see your event', href: `/events/${ev.slug}` },
              ].map(action => (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-4 p-3 bg-[#131315] rounded-lg border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-none">
                    <span className="material-symbols-outlined text-primary text-lg">{action.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{action.label}</p>
                    <p className="text-xs text-zinc-500">{action.sub}</p>
                  </div>
                  <span className="material-symbols-outlined text-zinc-600 ml-auto text-sm">arrow_forward</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default function EventDashboard() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <EventDashboardInner />
    </Suspense>
  );
}
