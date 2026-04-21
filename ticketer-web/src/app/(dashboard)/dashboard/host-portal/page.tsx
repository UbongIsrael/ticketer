'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getMyHostEvents,
  createEvent,
  addTier,
  publishEvent,
  updateEvent,
  Event,
  TicketTier,
} from '@/lib/api';
import { useUserStore } from '@/store/userStore';
import { LoadingPage } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import { ErrorMessage } from '@/components/ErrorMessage';
import { api } from '@/lib/axios';

// Sync the latest user profile from the server into Zustand.
// Called on portal mount so capabilities (e.g. HOST) are always fresh.
async function syncUserProfile(updateUser: (u: any) => void) {
  try {
    const res = await api.get('/users/me');
    updateUser(res.data);
  } catch {
    // silently ignore – user stays authenticated with cached data
  }
}

// ─── KYC gate ───────────────────────────────────────────────────────────────

function KycGate() {
  const [initiating, setInitiating] = useState(false);
  const [mockUrl, setMockUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInitiateKyc = async () => {
    setInitiating(true);
    setError(null);
    try {
      const res = await api.post('/kyc/initiate');
      setMockUrl(res.data.mock_verification_url);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to initiate KYC');
    } finally {
      setInitiating(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-16">
      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl text-primary">verified_user</span>
        </div>
        <h1 className="text-3xl font-black tracking-tighter mb-3">Become a Host</h1>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          To list events on Ticketer and accept payments, you need to complete a quick identity 
          verification. This helps us keep our platform safe for everyone.
        </p>
      </div>

      <div className="bg-[#131315] rounded-xl border border-white/5 p-6 mb-6">
        <h3 className="font-bold mb-4 text-sm uppercase tracking-widest text-zinc-400">What you&apos;ll need</h3>
        <div className="space-y-3">
          {[
            ['fingerprint', 'National Identification Number (NIN)'],
            ['smartphone', 'A smartphone or webcam for liveness check'],
            ['schedule', 'About 3 minutes of your time'],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-3 text-sm">
              <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
              <span className="text-on-surface-variant">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {mockUrl ? (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 text-center">
          <p className="text-amber-400 font-bold mb-2">Dev Mode — Mock KYC</p>
          <p className="text-sm text-on-surface-variant mb-4">
            Click below to simulate a successful identity verification.
          </p>
          <a
            href={mockUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-amber-500 text-black px-6 py-3 rounded-lg font-bold text-sm hover:bg-amber-400 transition-all"
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            Simulate Verification
          </a>
          <p className="text-xs text-zinc-600 mt-4">
            After verification, refresh the page to see your Host Portal.
          </p>
        </div>
      ) : (
        <button
          onClick={handleInitiateKyc}
          disabled={initiating}
          className="w-full bg-primary hover:bg-primary/90 text-[#0e0e10] py-4 rounded-xl font-black text-lg tracking-tight transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {initiating ? (
            <><span className="material-symbols-outlined animate-spin">progress_activity</span> Starting...</>
          ) : (
            <><span className="material-symbols-outlined">verified_user</span> Start Identity Check</>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Event creation multi-step form ─────────────────────────────────────────

interface TierDraft {
  name: string;
  price: string;
  quantity: string;
  description: string;
}

const NIGERIAN_CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Benin City', 'Warri'];
const EVENT_TYPES = ['Electronic', 'Afrobeats', 'Jazz', 'Gospel', 'Hip-Hop', 'Amapiano', 'Comedy', 'Conference', 'Fashion', 'Sports', 'Other'];

function CreateEventModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  const [details, setDetails] = useState({
    title: '', description: '', venue_name: '', venue_address: '',
    city: 'Lagos', state: '', event_type: 'Afrobeats',
    starts_at: '', ends_at: '', cover_image_url: '', max_tickets_per_user: 3,
  });

  const [tiers, setTiers] = useState<TierDraft[]>([
    { name: 'General Admission', price: '', quantity: '', description: '' },
  ]);

  const setDetail = (k: keyof typeof details, v: string) =>
    setDetails(prev => ({ ...prev, [k]: v }));

  const addTierDraft = () =>
    setTiers(prev => [...prev, { name: '', price: '', quantity: '', description: '' }]);

  const updateTierDraft = (i: number, k: keyof TierDraft, v: string) =>
    setTiers(prev => prev.map((t, idx) => idx === i ? { ...t, [k]: v } : t));

  const removeTierDraft = (i: number) =>
    setTiers(prev => prev.filter((_, idx) => idx !== i));

  const handleCreateEvent = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const event = await createEvent({
        ...details,
        starts_at: details.starts_at as any,
        ends_at: details.ends_at as any,
        max_tickets_per_user: Number(details.max_tickets_per_user),
      });
      setCreatedEventId(event.id);

      const tierPayloads = tiers.map(t => ({
        name: t.name,
        price_minor: Math.round(parseFloat(t.price) * 100),
        total_quantity: parseInt(t.quantity),
        description: t.description || null,
      }));
      await addTier(event.id, tierPayloads as any);

      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to create event. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!createdEventId) return;
    setSubmitting(true);
    setError(null);
    try {
      await publishEvent(createdEventId);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to publish event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#131315] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 sticky top-0 bg-[#131315] z-10">
          <div>
            <h2 className="text-xl font-bold">Create New Event</h2>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-primary w-8' : 'bg-zinc-800 w-4'}`} />
              ))}
              <span className="text-xs text-zinc-500 ml-1">Step {step} of 3</span>
            </div>
          </div>
          <button onClick={onClose} className="material-symbols-outlined text-zinc-500 hover:text-zinc-300 p-2 rounded-lg hover:bg-zinc-800 transition-all">
            close
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* ── Step 1: Event Details ── */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Event Title *</label>
                <input
                  value={details.title}
                  onChange={e => setDetail('title', e.target.value)}
                  placeholder="e.g. Lagos Electronic Dreamscape"
                  className="w-full bg-[#1f1f22] border border-white/5 rounded-lg px-4 py-3 text-on-surface placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Description *</label>
                <textarea
                  value={details.description}
                  onChange={e => setDetail('description', e.target.value)}
                  placeholder="Describe your event..."
                  rows={4}
                  className="w-full bg-[#1f1f22] border border-white/5 rounded-lg px-4 py-3 text-on-surface placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Event Type *</label>
                  <select
                    value={details.event_type}
                    onChange={e => setDetail('event_type', e.target.value)}
                    className="w-full bg-[#1f1f22] border border-white/5 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">City *</label>
                  <select
                    value={details.city}
                    onChange={e => setDetail('city', e.target.value)}
                    className="w-full bg-[#1f1f22] border border-white/5 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {NIGERIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Maximum Tickets per User Order *</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={details.max_tickets_per_user}
                  onChange={e => setDetail('max_tickets_per_user', e.target.value)}
                  placeholder="e.g. 3"
                  className="w-full bg-[#1f1f22] border border-white/5 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Venue Name *</label>
                <input
                  value={details.venue_name}
                  onChange={e => setDetail('venue_name', e.target.value)}
                  placeholder="e.g. Eko Convention Centre"
                  className="w-full bg-[#1f1f22] border border-white/5 rounded-lg px-4 py-3 text-on-surface placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Venue Address *</label>
                <input
                  value={details.venue_address}
                  onChange={e => setDetail('venue_address', e.target.value)}
                  placeholder="Full venue address"
                  className="w-full bg-[#1f1f22] border border-white/5 rounded-lg px-4 py-3 text-on-surface placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Starts At *</label>
                  <input
                    type="datetime-local"
                    value={details.starts_at}
                    onChange={e => setDetail('starts_at', e.target.value)}
                    className="w-full bg-[#1f1f22] border border-white/5 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Ends At *</label>
                  <input
                    type="datetime-local"
                    value={details.ends_at}
                    onChange={e => setDetail('ends_at', e.target.value)}
                    className="w-full bg-[#1f1f22] border border-white/5 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Cover Image URL</label>
                <input
                  value={details.cover_image_url}
                  onChange={e => setDetail('cover_image_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#1f1f22] border border-white/5 rounded-lg px-4 py-3 text-on-surface placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!details.title || !details.description || !details.venue_name || !details.starts_at || !details.ends_at}
                className="w-full bg-primary text-[#0e0e10] py-3.5 rounded-lg font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Next: Ticket Tiers <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </>
          )}

          {/* ── Step 2: Ticket Tiers ── */}
          {step === 2 && (
            <>
              <p className="text-sm text-on-surface-variant">
                Define the ticket categories for your event. You can add up to 5 tiers.
              </p>

              {tiers.map((tier, i) => (
                <div key={i} className="bg-[#1f1f22] rounded-xl p-4 border border-white/5 relative">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold">Tier {i + 1}</p>
                    {tiers.length > 1 && (
                      <button
                        onClick={() => removeTierDraft(i)}
                        className="material-symbols-outlined text-zinc-600 hover:text-red-400 transition-colors text-lg"
                      >
                        delete
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Name *</label>
                      <input
                        value={tier.name}
                        onChange={e => updateTierDraft(i, 'name', e.target.value)}
                        placeholder="e.g. General Admission"
                        className="w-full bg-[#131315] border border-white/5 rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Price (₦) *</label>
                      <input
                        type="number"
                        value={tier.price}
                        onChange={e => updateTierDraft(i, 'price', e.target.value)}
                        placeholder="15000"
                        className="w-full bg-[#131315] border border-white/5 rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Quantity *</label>
                      <input
                        type="number"
                        value={tier.quantity}
                        onChange={e => updateTierDraft(i, 'quantity', e.target.value)}
                        placeholder="500"
                        className="w-full bg-[#131315] border border-white/5 rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Description</label>
                      <input
                        value={tier.description}
                        onChange={e => updateTierDraft(i, 'description', e.target.value)}
                        placeholder="Optional tier details"
                        className="w-full bg-[#131315] border border-white/5 rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {tiers.length < 5 && (
                <button
                  onClick={addTierDraft}
                  className="w-full border border-dashed border-white/10 rounded-xl py-3 text-zinc-500 hover:text-zinc-300 hover:border-white/20 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Add Another Tier
                </button>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border border-white/10 text-zinc-400 py-3.5 rounded-lg font-bold transition-all hover:bg-zinc-800"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateEvent}
                  disabled={submitting || tiers.some(t => !t.name || !t.price || !t.quantity)}
                  className="flex-1 bg-primary text-[#0e0e10] py-3.5 rounded-lg font-bold transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> Creating...</>
                  ) : (
                    <>Review & Create <span className="material-symbols-outlined text-sm">arrow_forward</span></>
                  )}
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: Review & Publish ── */}
          {step === 3 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-3xl text-emerald-400">check_circle</span>
              </div>
              <h3 className="text-2xl font-black mb-2">Event Created!</h3>
              <p className="text-on-surface-variant text-sm mb-6 max-w-sm mx-auto">
                Your event and ticket tiers have been saved as a <strong className="text-on-surface">draft</strong>.
                Publish to make it visible to buyers.
              </p>

              <div className="bg-[#1f1f22] rounded-xl p-4 text-left mb-6 border border-white/5">
                <p className="font-bold">{details.title}</p>
                <p className="text-xs text-zinc-500 mt-1">{details.venue_name} • {details.city}</p>
                <p className="text-xs text-zinc-500">
                  {new Date(details.starts_at).toLocaleDateString('en-NG', {
                    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {tiers.map((t, i) => (
                    <span key={i} className="text-[11px] bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
                      {t.name} — ₦{parseFloat(t.price || '0').toLocaleString()} × {t.quantity}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 border border-white/10 text-zinc-400 py-3.5 rounded-lg font-bold hover:bg-zinc-800 transition-all"
                >
                  Save as Draft
                </button>
                <button
                  onClick={handlePublish}
                  disabled={submitting}
                  className="flex-1 bg-primary text-[#0e0e10] py-3.5 rounded-lg font-bold transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> Publishing...</>
                  ) : (
                    <><span className="material-symbols-outlined text-sm">rocket_launch</span> Publish Now</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Overlay helper ───────────────────────────────────────────────────────────
function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {children}
    </div>
  );
}

// ─── Edit Event Modal ─────────────────────────────────────────────────────────
function EditEventModal({ event, onClose, onUpdated }: { event: Event; onClose: () => void; onUpdated: (updated: Event) => void }) {
  const NIGERIAN_CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Benin City', 'Warri'];
  const EVENT_TYPES = ['Electronic', 'Afrobeats', 'Jazz', 'Gospel', 'Hip-Hop', 'Amapiano', 'Comedy', 'Conference', 'Fashion', 'Sports', 'Other'];

  const [form, setForm] = useState({
    title: event.title,
    description: event.description,
    cover_image_url: event.cover_image_url ?? '',
    venue_name: event.venue_name,
    venue_address: event.venue_address,
    city: event.city,
    state: event.state,
    event_type: event.event_type,
    starts_at: event.starts_at ? new Date(event.starts_at).toISOString().slice(0, 16) : '',
    ends_at: event.ends_at ? new Date(event.ends_at).toISOString().slice(0, 16) : '',
    max_tickets_per_user: event.max_tickets_per_user ?? 3,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const setField = (k: keyof typeof form, v: string | number) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateEvent(event.id, {
        ...form,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : undefined,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : undefined,
        max_tickets_per_user: Number(form.max_tickets_per_user),
      } as any);
      setSuccess(true);
      setTimeout(() => { onUpdated(updated); onClose(); }, 800);
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message ?? 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full bg-[#1a1a1d] border border-white/10 rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all';
  const labelCls = 'block text-[11px] uppercase tracking-widest text-zinc-500 mb-2 font-bold';

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-2xl bg-[#131315] rounded-2xl border border-white/5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h2 className="text-lg font-black tracking-tight">Edit Event</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5 truncate max-w-xs">{event.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm">{error}</div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg p-3 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span> Changes saved!
            </div>
          )}

          {/* Cover Image */}
          <div>
            <label className={labelCls}>Cover Image URL</label>
            {form.cover_image_url && (
              <div className="mb-2 h-32 rounded-lg overflow-hidden border border-white/5">
                <img src={form.cover_image_url} alt="cover preview" className="w-full h-full object-cover" />
              </div>
            )}
            <input
              type="url"
              value={form.cover_image_url}
              onChange={e => setField('cover_image_url', e.target.value)}
              placeholder="https://... (paste image URL)"
              className={inputCls}
            />
          </div>

          {/* Title */}
          <div>
            <label className={labelCls}>Event Title</label>
            <input type="text" value={form.title} onChange={e => setField('title', e.target.value)} className={inputCls} />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              rows={4}
              className={inputCls + ' resize-none'}
            />
          </div>

          {/* Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Venue Name</label>
              <input type="text" value={form.venue_name} onChange={e => setField('venue_name', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Venue Address</label>
              <input type="text" value={form.venue_address} onChange={e => setField('venue_address', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* City / State / Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>City</label>
              <select value={form.city} onChange={e => setField('city', e.target.value)} className={inputCls}>
                {NIGERIAN_CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>State</label>
              <input type="text" value={form.state} onChange={e => setField('state', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Event Type</label>
              <select value={form.event_type} onChange={e => setField('event_type', e.target.value)} className={inputCls}>
                {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Start Date & Time</label>
              <input type="datetime-local" value={form.starts_at} onChange={e => setField('starts_at', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Date & Time</label>
              <input type="datetime-local" value={form.ends_at} onChange={e => setField('ends_at', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Max tickets */}
          <div className="max-w-[160px]">
            <label className={labelCls}>Max Tickets / User</label>
            <input
              type="number" min={1} max={20}
              value={form.max_tickets_per_user}
              onChange={e => setField('max_tickets_per_user', Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-white/10 text-zinc-400 py-3 rounded-lg font-bold text-sm hover:bg-zinc-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || success}
            className="flex-1 bg-primary text-[#0e0e10] py-3 rounded-lg font-bold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> Saving...</>
            ) : success ? (
              <><span className="material-symbols-outlined text-sm">check</span> Saved!</>
            ) : (
              <><span className="material-symbols-outlined text-sm">save</span> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Events list card ────────────────────────────────────────────────────────

function EventCard({ event, onEdit }: { event: Event; onEdit: (e: Event) => void }) {
  const STATUS = {
    draft:     { label: 'Draft',     bg: 'bg-zinc-800',          text: 'text-zinc-400' },
    published: { label: 'Live',      bg: 'bg-emerald-500/10',    text: 'text-emerald-400' },
    completed: { label: 'Completed', bg: 'bg-zinc-800',          text: 'text-zinc-400' },
    cancelled: { label: 'Cancelled', bg: 'bg-red-500/10',        text: 'text-red-400' },
  };
  const s = STATUS[event.status as keyof typeof STATUS] ?? STATUS.draft;

  return (
    <div className="bg-[#131315] rounded-xl border border-white/5 overflow-hidden hover:border-white/10 transition-colors group">
      <div className="h-32 bg-zinc-900 relative overflow-hidden">
        {event.cover_image_url ? (
          <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-zinc-700">event</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#131315] to-transparent" />
        <span className={`absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${s.bg} ${s.text}`}>
          {s.label}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-on-surface truncate">{event.title}</h3>
          <button
            onClick={() => onEdit(event)}
            title="Edit event"
            className="shrink-0 w-7 h-7 rounded-lg bg-white/5 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
        </div>
        <p className="text-xs text-zinc-500 mb-3">
          {event.venue_name} · {event.city}
        </p>
        <p className="text-xs text-zinc-600">
          {new Date(event.starts_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
        {event.status !== 'draft' && (
          <Link
            href={`/dashboard/host?event=${event.id}`}
            className="mt-4 flex items-center gap-1.5 text-primary text-xs font-bold hover:underline"
          >
            <span className="material-symbols-outlined text-sm">bar_chart</span>
            View Analytics
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Main Host Portal Page ───────────────────────────────────────────────────

export default function HostPortal() {
  const { user, updateUser } = useUserStore();
  const [syncing, setSyncing] = useState(true);

  // Always re-fetch user from DB on mount so capabilities reflect latest KYC status
  useEffect(() => {
    syncUserProfile(updateUser).finally(() => setSyncing(false));
  }, []);

  const isHost = user?.capabilities?.includes('HOST');

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const fetchEvents = async () => {
    if (!isHost) { setLoading(false); return; }
    try {
      setLoading(true);
      const data = await getMyHostEvents();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load events'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [isHost]);

  if (syncing) return <LoadingPage />;
  if (!isHost) return <KycGate />;
  if (loading) return <LoadingPage />;

  return (
    <main className="max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 py-6">
        <div>
          <span className="text-[0.6875rem] uppercase tracking-[0.15em] text-primary font-bold mb-2 block">
            Host Portal
          </span>
          <h1 className="text-4xl font-black tracking-tighter text-on-surface mb-2">My Events</h1>
          <p className="text-zinc-400 text-sm">Manage, create, and track all your events in one place.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary hover:bg-primary/90 text-[#0e0e10] px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(186,158,255,0.25)] flex items-center gap-2 active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Create Event
        </button>
      </div>

      {error && <ErrorMessage error={error} retry={fetchEvents} />}

      {!loading && events.length === 0 ? (
        <EmptyState
          icon="theater_comedy"
          title="No events yet"
          description="Create your first event and start selling tickets to your audience."
          action={{ label: 'Create Event', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Events', value: events.length, icon: 'event' },
              { label: 'Live Now', value: events.filter(e => e.status === 'published').length, icon: 'live_tv' },
              { label: 'Drafts', value: events.filter(e => e.status === 'draft').length, icon: 'edit' },
              { label: 'Completed', value: events.filter(e => e.status === 'completed').length, icon: 'check_circle' },
            ].map(s => (
              <div key={s.label} className="bg-[#131315] rounded-xl p-4 border border-white/5">
                <span className="material-symbols-outlined text-primary text-xl mb-2 block">{s.icon}</span>
                <p className="text-2xl font-black tracking-tight">{s.value}</p>
                <p className="text-[11px] text-zinc-500 uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Events grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map(event => (
              <EventCard key={event.id} event={event} onEdit={setEditingEvent} />
            ))}
          </div>
        </>
      )}

      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchEvents(); }}
        />
      )}

      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onUpdated={(updated) => {
            setEvents(prev => prev.map(e => e.id === updated.id ? { ...e, ...updated } : e));
            setEditingEvent(null);
          }}
        />
      )}
    </main>
  );
}
