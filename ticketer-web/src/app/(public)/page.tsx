'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { listEvents, Event } from '@/lib/api';
import { LoadingCard } from '@/components/Loading';
import { ErrorMessage } from '@/components/ErrorMessage';
import { EmptyState } from '@/components/EmptyState';

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await listEvents({
        limit: 20,
        city: selectedCity,
        event_type: selectedType,
      });
      setEvents(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch events'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCity, selectedType]);

  // Get featured event (first event)
  const featuredEvent = events[0];
  
  // Get recommended events (next 2-4)
  const recommendedEvents = events.slice(1, 5);
  
  // Get local shows (next batch)
  const localShows = events.slice(5, 8);

  const cities = ['Lagos', 'Abuja', 'Port Harcourt'];
  const eventTypes = ['Afrobeats', 'Owambe', 'Detty December'];

  const formatPrice = (priceMinor: number) => {
    return `₦${(priceMinor / 100).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Hero Section */}
      {loading && !featuredEvent ? (
        <section className="relative h-[614px] md:h-[768px] w-full overflow-hidden flex items-end">
          <LoadingCard />
        </section>
      ) : error ? (
        <section className="relative h-[614px] md:h-[768px] w-full overflow-hidden flex items-center justify-center px-6">
          <ErrorMessage error={error} retry={fetchEvents} />
        </section>
      ) : featuredEvent ? (
        <section className="relative h-[614px] md:h-[768px] w-full overflow-hidden flex items-end">
          <div className="absolute inset-0 z-0">
            {featuredEvent.cover_image_url ? (
              <img 
                className="w-full h-full object-cover" 
                src={featuredEvent.cover_image_url} 
                alt={featuredEvent.title}
              />
            ) : (
              <div className="w-full h-full bg-surface-container-high" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-dim via-surface-dim/40 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-surface-dim via-transparent to-transparent"></div>
          </div>
          <div className="relative z-10 px-6 md:px-12 pb-12 w-full max-w-5xl">
            <span className="inline-block bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase mb-4 backdrop-blur-md">
              {featuredEvent.event_type}
            </span>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none mb-6 drop-shadow-2xl">
              {featuredEvent.title.split(' ').slice(0, 2).join(' ')}<br/>
              <span className="text-primary">{featuredEvent.title.split(' ').slice(2).join(' ') || 'LIVE'}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-6">
              <Link 
                href={`/events/${featuredEvent.slug}`} 
                className="bg-[#ba9eff] text-[#0e0e10] font-bold px-8 py-4 rounded-lg flex items-center gap-2 hover:bg-primary-dim transition-all active:scale-95 shadow-[0_0_30px_rgba(186,158,255,0.3)]"
              >
                Get Tickets
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-surface-dim bg-surface-container-highest flex items-center justify-center text-[10px] font-bold">
                  +{Math.floor(Math.random() * 10) + 5}k
                </div>
                <p className="text-on-surface-variant text-sm font-medium">watching</p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Local Filter Chips */}
      <section className="mt-8 px-6 pb-2">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          <button 
            onClick={() => { setSelectedCity(undefined); setSelectedType(undefined); }}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-colors ${
              !selectedCity && !selectedType 
                ? 'bg-primary text-[#0e0e10]' 
                : 'bg-surface-container-high text-zinc-400 hover:text-[#f9f5f8]'
            }`}
          >
            All Events
          </button>
          {cities.map(city => (
            <button 
              key={city}
              onClick={() => { setSelectedCity(city); setSelectedType(undefined); }}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                selectedCity === city 
                  ? 'bg-primary text-[#0e0e10] font-bold' 
                  : 'bg-surface-container-high text-zinc-400 hover:text-[#f9f5f8]'
              }`}
            >
              {city}
            </button>
          ))}
          {eventTypes.map(type => (
            <button 
              key={type}
              onClick={() => { setSelectedType(type); setSelectedCity(undefined); }}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                selectedType === type 
                  ? 'bg-primary text-[#0e0e10] font-bold' 
                  : 'bg-surface-container-high text-zinc-400 hover:text-[#f9f5f8]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </section>

      {/* Recommended */}
      {recommendedEvents.length > 0 && (
        <section className="mt-8 px-6">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Recommended for You</h2>
              <p className="text-on-surface-variant text-sm">Discover amazing events</p>
            </div>
            <Link className="text-primary text-sm font-bold hover:underline" href="/search">View All</Link>
          </div>
          
          <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6 snap-x hide-scrollbar">
            {recommendedEvents.map((event) => (
              <Link 
                key={event.id}
                href={`/events/${event.slug}`} 
                className="flex-none w-72 snap-start group cursor-pointer"
              >
                <div className="h-48 rounded-lg overflow-hidden relative mb-4 bg-surface-container-low transition-transform duration-300 group-hover:scale-[1.02]">
                  {event.cover_image_url ? (
                    <img 
                      className="w-full h-full object-cover" 
                      src={event.cover_image_url} 
                      alt={event.title}
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                      <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-30">
                        event
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                      {event.city}
                    </span>
                  </div>
                </div>
                <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                  {event.title}
                </h3>
                <p className="text-on-surface-variant text-sm">
                  {event.venue_name} • {formatDate(event.starts_at)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Local Shows with Notch Component */}
      {localShows.length > 0 && (
        <section className="mt-16 px-6 max-w-4xl">
          <h2 className="text-2xl font-bold tracking-tight mb-8">Shows Near You</h2>
          <div className="space-y-4 relative">
            {localShows.map((event) => {
              const eventDate = new Date(event.starts_at);
              const month = eventDate.toLocaleDateString('en-US', { month: 'short' });
              const day = eventDate.getDate();
              const time = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
              
              return (
                <div 
                  key={event.id}
                  className="ticket-notch bg-surface-container-high flex items-center p-6 gap-6 group hover:bg-surface-container-highest transition-all"
                >
                  <div className="flex-none text-center border-r border-outline-variant/20 pr-6">
                    <p className="text-xs text-on-surface-variant font-bold uppercase">{month}</p>
                    <p className="text-2xl font-black">{day}</p>
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-bold text-lg group-hover:text-primary transition-colors">
                      {event.title}
                    </h4>
                    <p className="text-sm text-on-surface-variant">
                      {event.venue_name} • {time}
                    </p>
                  </div>
                  <div className="flex-none flex flex-col items-end gap-2">
                    <Link 
                      href={`/events/${event.slug}`} 
                      className="bg-surface-container-highest text-on-surface text-xs font-bold py-2 px-4 rounded-lg group-hover:bg-primary group-hover:text-[#0e0e10] transition-all"
                    >
                      View Event
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!loading && events.length === 0 && (
        <section className="mt-16 px-6">
          <EmptyState
            icon="event_busy"
            title="No events found"
            description="Try adjusting your filters or check back later for new events."
            action={{
              label: 'Clear Filters',
              onClick: () => {
                setSelectedCity(undefined);
                setSelectedType(undefined);
              }
            }}
          />
        </section>
      )}
    </>
  );
}
