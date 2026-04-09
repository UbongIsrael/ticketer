'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { listEvents, Event } from '@/lib/api';
import { LoadingCard } from '@/components/Loading';
import { ErrorMessage } from '@/components/ErrorMessage';
import { EmptyState } from '@/components/EmptyState';

export default function Search() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Filters
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recommended' | 'date' | 'price'>('recommended');

  const cities = ['Lagos', 'Abuja', 'Port Harcourt'];
  const genres = ['Mainstream', 'Afrobeats', 'Amapiano', 'Owambe', 'Concert'];

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await listEvents({
        limit: 50,
        city: selectedCity,
        event_type: selectedGenre,
        search: searchQuery || undefined,
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
  }, [selectedCity, selectedGenre, searchQuery]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatPrice = (priceMinor: number) => {
    return `₦${(priceMinor / 100).toLocaleString()}`;
  };

  // Get featured event (first one)
  const featuredEvent = events[0];
  const gridEvents = events.slice(1);

  return (
    <>
      <div className="flex min-h-screen pt-16">
        
        {/* Side Navigation/Filters */}
        <aside className="fixed left-0 top-0 h-full w-64 pt-20 bg-[#0e0e10] text-sm font-medium flex flex-col gap-4 p-4 hidden md:flex z-40 overflow-y-auto">
          <div className="mb-6 px-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4">Navigation</p>
            <nav className="space-y-1">
              <Link className="flex items-center gap-3 px-3 py-2.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 transition-all duration-200 rounded-lg" href="/">
                <span className="material-symbols-outlined">home</span>
                <span>Home</span>
              </Link>
              <Link className="flex items-center gap-3 px-3 py-2.5 text-[#ba9eff] bg-[#1f1f22] rounded-lg transition-all duration-200" href="/search">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>search</span>
                <span>Search</span>
              </Link>
              <Link className="flex items-center gap-3 px-3 py-2.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 transition-all duration-200 rounded-lg" href="/dashboard/tickets">
                <span className="material-symbols-outlined">confirmation_number</span>
                <span>My Tickets</span>
              </Link>
            </nav>
          </div>
          
          <div className="px-2 border-t border-white/5 pt-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4">Refine Search</p>
            
            {/* Search Input */}
            <div className="mb-6">
              <label className="block text-xs font-semibold mb-3 text-zinc-300">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Event name..."
                className="w-full bg-[#262528] border-none outline-none rounded-lg text-xs py-2.5 px-3 focus:ring-1 focus:ring-primary/40 text-white placeholder:text-zinc-500"
              />
            </div>

            {/* City Filter */}
            <div className="mb-6">
              <label className="block text-xs font-semibold mb-3 text-zinc-300">City</label>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setSelectedCity(undefined)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${
                    !selectedCity ? 'bg-primary text-[#0e0e10]' : 'bg-[#262528] text-zinc-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                {cities.map(city => (
                  <button 
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`px-3 py-1.5 rounded-full text-[11px] transition-colors ${
                      selectedCity === city 
                        ? 'bg-primary text-[#0e0e10] font-bold' 
                        : 'bg-[#262528] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Genre Filter */}
            <div className="mb-6">
              <label className="block text-xs font-semibold mb-3 text-zinc-300">Genre</label>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setSelectedGenre(undefined)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${
                    !selectedGenre ? 'bg-primary text-[#0e0e10]' : 'bg-[#262528] text-zinc-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                {genres.map(genre => (
                  <button 
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`px-3 py-1.5 rounded-full text-[11px] transition-colors ${
                      selectedGenre === genre 
                        ? 'bg-primary text-[#0e0e10] font-bold' 
                        : 'bg-[#262528] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Canvas */}
        <main className="flex-1 md:ml-64 px-4 md:px-10 py-8 pb-32">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-[10px] tracking-[0.3em] uppercase text-primary font-bold">Search Results</span>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter mt-2 text-[#f9f5f8]">
                {loading ? 'Loading...' : `${events.length} Event${events.length !== 1 ? 's' : ''} Found`}
              </h1>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-[#1f1f22] rounded-lg text-xs font-medium hover:bg-[#262528] transition-colors">
                <span className="material-symbols-outlined text-sm">sort</span> Recommended
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-8">
              <ErrorMessage error={error} retry={fetchEvents} />
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8">
                <LoadingCard />
              </div>
              <div className="md:col-span-4 space-y-4">
                <LoadingCard />
                <LoadingCard />
              </div>
            </div>
          ) : events.length === 0 ? (
            <EmptyState
              icon="search_off"
              title="No events found"
              description="Try adjusting your filters or search terms to find more events."
              action={{
                label: 'Clear Filters',
                onClick: () => {
                  setSelectedCity(undefined);
                  setSelectedGenre(undefined);
                  setSearchQuery('');
                }
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Featured Event (if exists) */}
              {featuredEvent && (
                <Link 
                  href={`/events/${featuredEvent.slug}`}
                  className="md:col-span-8 bg-[#131315] rounded-xl overflow-hidden relative min-h-[400px] flex items-end p-8 group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10"></div>
                  {featuredEvent.cover_image_url ? (
                    <img 
                      className="absolute inset-0 w-full h-full object-cover grayscale transition-transform duration-700 group-hover:scale-105 group-hover:grayscale-0" 
                      src={featuredEvent.cover_image_url} 
                      alt={featuredEvent.title}
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-surface-container-high" />
                  )}
                  <div className="relative z-20 w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-2 py-0.5 bg-primary/20 backdrop-blur-md border border-primary/30 rounded text-[9px] font-bold text-primary tracking-widest uppercase">
                        Featured
                      </span>
                    </div>
                    <h2 className="text-4xl font-black mb-3 tracking-tight">{featuredEvent.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-zinc-300">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">location_on</span>
                        {featuredEvent.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">calendar_today</span>
                        {formatDate(featuredEvent.starts_at)}
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              {/* Event Grid */}
              <div className={`${featuredEvent ? 'md:col-span-4' : 'md:col-span-12'} space-y-4`}>
                {gridEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="block bg-[#131315] rounded-lg overflow-hidden hover:bg-[#19191c] transition-colors group"
                  >
                    <div className="flex gap-4 p-4">
                      <div className="flex-none w-24 h-24 rounded-lg overflow-hidden bg-surface-container-high">
                        {event.cover_image_url ? (
                          <img 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                            src={event.cover_image_url} 
                            alt={event.title}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl text-on-surface-variant opacity-30">
                              event
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base mb-1 truncate group-hover:text-primary transition-colors">
                          {event.title}
                        </h3>
                        <p className="text-xs text-zinc-400 mb-2">{event.venue_name}</p>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">location_on</span>
                            {event.city}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">calendar_today</span>
                            {formatDate(event.starts_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
