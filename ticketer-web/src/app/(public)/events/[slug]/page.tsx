'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEventBySlug, getEventWeather, EventWithTiers } from '@/lib/api';
import { LoadingPage } from '@/components/Loading';
import { ErrorPage } from '@/components/ErrorMessage';

export default function EventDetail() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [event, setEvent] = useState<EventWithTiers | null>(null);
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const eventData = await getEventBySlug(slug);
        setEvent(eventData);
        
        // Set first tier as selected by default
        if (eventData.tiers.length > 0) {
          setSelectedTier(eventData.tiers[0].id);
        }

        // Fetch weather (non-critical, don't block on error)
        try {
          const weatherData = await getEventWeather(slug);
          setWeather(weatherData);
        } catch (weatherErr) {
          console.warn('Weather data unavailable:', weatherErr);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load event'));
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchEventData();
    }
  }, [slug]);

  if (loading) return <LoadingPage />;
  if (error || !event) return <ErrorPage error={error || new Error('Event not found')} />;

  const formatPrice = (priceMinor: number) => {
    return `₦${(priceMinor / 100 / 1000).toFixed(0)}k`;
  };

  const formatFullPrice = (priceMinor: number) => {
    return `₦${(priceMinor / 100).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  const getAvailableCount = (tier: any) => {
    return tier.total_quantity - tier.sold_count;
  };

  const isSoldOut = (tier: any) => {
    return getAvailableCount(tier) === 0;
  };

  const lowestTier = event.tiers.reduce((min, tier) => 
    tier.price_minor < min.price_minor ? tier : min
  );

  const selectedTierData = event.tiers.find(t => t.id === selectedTier);

  const handlePurchase = () => {
    if (!selectedTierData || isSoldOut(selectedTierData)) return;
    router.push(`/checkout?tier=${selectedTier}&event=${slug}`);
  };

  return (
    <>
      <main className="min-h-screen pb-24">
        
        {/* Hero Section */}
        <section className="relative h-[614px] md:h-[768px] w-full overflow-hidden">
          {event.cover_image_url ? (
            <img 
              className="absolute inset-0 w-full h-full object-cover" 
              src={event.cover_image_url} 
              alt={event.title}
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-surface-container-high" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-dim via-surface-dim/40 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
            <div className="max-w-7xl mx-auto flex flex-col gap-2">
              <span className="bg-primary/20 text-primary border border-primary/30 w-fit px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase">
                {event.event_type}
              </span>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-on-surface leading-tight">
                {event.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 mt-4 text-on-surface-variant font-medium">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">calendar_today</span>
                  <span>{formatDate(event.starts_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">location_on</span>
                  <span>{event.venue_name}, {event.city}</span>
                </div>
                {weather && (
                  <div className="flex items-center gap-2.5 bg-[#1f1f22]/90 backdrop-blur-lg border border-white/10 px-4 py-2 rounded-2xl text-xs text-white shadow-xl">
                    <span className="material-symbols-outlined text-amber-400 text-base">partly_cloudy_day</span>
                    <div>
                      <p className="font-black text-base leading-none">{weather.temperature}°C</p>
                      <p className="text-zinc-400 capitalize text-[10px] leading-none mt-0.5">{weather.description}</p>
                    </div>
                    <div className="border-l border-white/10 pl-2.5 flex flex-col gap-1">
                      <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                        <span className="material-symbols-outlined text-[12px] text-sky-400">water_drop</span>
                        {weather.humidity}%
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                        <span className="material-symbols-outlined text-[12px] text-sky-300">air</span>
                        {weather.wind_speed} km/h
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <section className="max-w-7xl mx-auto px-6 -mt-12 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 space-y-6">
            <div className="bg-surface-container-low rounded-lg p-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 tracking-tight">About This Event</h2>
              <p className="text-on-surface-variant leading-relaxed text-lg mb-8 whitespace-pre-wrap">
                {event.description}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-container-highest p-4 rounded-lg flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Doors Open</span>
                  <span className="text-xl font-bold">{formatTime(event.starts_at)}</span>
                </div>
                <div className="bg-surface-container-highest p-4 rounded-lg flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Event Ends</span>
                  <span className="text-xl font-bold">{formatTime(event.ends_at)}</span>
                </div>
                <div className="bg-surface-container-highest p-4 rounded-lg flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-primary tracking-widest uppercase">City</span>
                  <span className="text-xl font-bold">{event.city}</span>
                </div>
                <div className="bg-surface-container-highest p-4 rounded-lg flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-primary tracking-widest uppercase">State</span>
                  <span className="text-xl font-bold">{event.state}</span>
                </div>
              </div>
            </div>

            {/* Map/Venue */}
            <div className="bg-surface-container-low rounded-lg overflow-hidden h-80 relative group">
              <div className="absolute inset-0 bg-surface-container-high flex items-center justify-center">
                <div className="text-center">
                  <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-30 block mb-4">
                    location_on
                  </span>
                  <h3 className="font-bold text-xl mb-2">{event.venue_name}</h3>
                  <p className="text-on-surface-variant text-sm mb-4">{event.venue_address}</p>
                  {event.latitude && event.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-surface-container-highest text-on-surface px-4 py-2 rounded-lg font-bold text-sm hover:bg-surface-bright transition-all border border-outline-variant/20"
                    >
                      <span className="material-symbols-outlined text-sm">directions</span> Get Directions
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-4 space-y-6">
            {/* CTA Card */}
            <div className="bg-surface-container-high rounded-lg p-6 sticky top-24 border border-outline-variant/10 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">Starting at</span>
                  <div className="text-4xl font-black text-primary">{formatFullPrice(lowestTier.price_minor)}</div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {event.tiers.some(t => getAvailableCount(t) < 10 && getAvailableCount(t) > 0) && (
                    <span className="bg-error/10 text-error px-3 py-1 rounded-full text-[10px] font-bold">FEW LEFT</span>
                  )}
                  <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-emerald-500/20">
                    <span className="material-symbols-outlined text-[12px]">replay</span> BUY-BACK ELIGIBLE
                  </span>
                </div>
              </div>
              
              <div className="space-y-4 mb-8 relative">
                {event.tiers.map((tier) => {
                  const available = getAvailableCount(tier);
                  const soldOut = isSoldOut(tier);
                  const isSelected = selectedTier === tier.id;
                  
                  return (
                    <div 
                      key={tier.id}
                      onClick={() => !soldOut && setSelectedTier(tier.id)}
                      className={`bg-surface-container-highest p-4 rounded-lg ticket-right-notch flex justify-between items-center cursor-pointer transition-colors ${
                        isSelected ? 'border border-primary/30' : ''
                      } ${soldOut ? 'opacity-50 cursor-not-allowed' : 'hover:bg-surface-bright'}`}
                    >
                      <div>
                        <div className={`font-bold ${isSelected ? 'text-primary' : ''}`}>
                          {tier.name}
                        </div>
                        <div className="text-xs text-on-surface-variant">
                          {tier.description || `${available} available`}
                        </div>
                      </div>
                      <span className={`font-black ${isSelected ? 'text-primary' : ''}`}>
                        {soldOut ? 'SOLD OUT' : formatPrice(tier.price_minor)}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              <button 
                onClick={handlePurchase}
                disabled={!selectedTierData || isSoldOut(selectedTierData)}
                className="w-full bg-primary hover:bg-primary-dim text-[#0e0e10] py-4 rounded-lg font-black text-lg tracking-tight transition-all active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedTierData && isSoldOut(selectedTierData) ? 'SOLD OUT' : 'PURCHASE TICKETS'}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <p className="text-[10px] text-center text-on-surface-variant mt-4 uppercase tracking-widest">Secure checkout by Ticketer</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
