'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { reserveTicket, initializePayment, getEventBySlug } from '@/lib/api';
import { useUserStore } from '@/store/userStore';
import { LoadingPage } from '@/components/Loading';
import { ErrorMessage } from '@/components/ErrorMessage';

function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useUserStore();
  
  const tierId = searchParams.get('tier');
  
  const [event, setEvent] = useState<any>(null);
  const [tier, setTier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (!tierId) {
      router.push('/');
      return;
    }

    // Fetch tier details from URL state or make API call
    // For now, we'll need the event slug to fetch full details
    // This should be passed as a query param
    const eventSlug = searchParams.get('event');
    if (eventSlug) {
      fetchEventAndTier(eventSlug, tierId);
    } else {
      setError(new Error('Missing event information'));
      setLoading(false);
    }
  }, [tierId, isAuthenticated]);

  // Removed auto-timer reservation logic

  const fetchEventAndTier = async (slug: string, tierId: string) => {
    try {
      setLoading(true);
      const eventData = await getEventBySlug(slug);
      const tierData = eventData.tiers.find(t => t.id === tierId);
      
      if (!tierData) {
        throw new Error('Ticket tier not found');
      }

      setEvent(eventData);
      setTier(tierData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Event or Ticket missing'));
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!tier || !event) return;

    setProcessing(true);
    setError(null);

    try {
      const reservation = await reserveTicket({ tier_id: tier.id, event_id: event.id, quantity });
      
      const paymentResponse = await initializePayment({ ticket_ids: reservation.tickets.map((t: any) => t.id) });
      
      // Redirect to Paystack
      window.location.href = paymentResponse.authorization_url;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to process order'));
      setProcessing(false);
    }
  };

  const formatPrice = (priceMinor: number) => {
    return `₦${(priceMinor / 100).toLocaleString()}`;
  };



  if (loading) return <LoadingPage />;
  if (error && !tier) return <ErrorMessage error={error} />;

  const serviceFee = tier ? Math.floor(tier.price_minor * 0.05) : 0;
  const totalAmount = tier ? (tier.price_minor + serviceFee) * quantity : 0;
  const maxQty = event?.max_tickets_per_user || 3;

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tighter mb-2">Checkout</h1>
          <p className="text-on-surface-variant">Complete your ticket purchase</p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage error={error} />
          </div>
        )}



        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="md:col-span-2 space-y-6">
            {/* Event Details */}
            {event && (
              <div className="bg-surface-container-low rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Event Details</h2>
                <div className="flex gap-4">
                  <div className="flex-none w-24 h-24 rounded-lg overflow-hidden bg-surface-container-high">
                    {event.cover_image_url ? (
                      <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-on-surface-variant opacity-30">event</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{event.title}</h3>
                    <p className="text-sm text-on-surface-variant mb-2">{event.venue_name}</p>
                    <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        {new Date(event.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {new Date(event.starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ticket Details */}
            {tier && (
              <div className="bg-surface-container-low rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Ticket Details</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant">Tier</span>
                    <span className="font-bold">{tier.name}</span>
                  </div>
                  {tier.description && (
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Description</span>
                      <span className="text-sm">{tier.description}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant">Quantity</span>
                    <div className="flex items-center gap-4 bg-surface-container-high rounded-full px-2 py-1">
                      <button 
                         onClick={() => setQuantity(q => Math.max(1, q - 1))}
                         disabled={quantity <= 1 || processing}
                         className="material-symbols-outlined text-sm p-1 rounded-full hover:bg-surface-container-highest disabled:opacity-50">remove</button>
                      <span className="font-bold min-w-[20px] text-center">{quantity}</span>
                      <button 
                         onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                         disabled={quantity >= maxQty || processing}
                         className="material-symbols-outlined text-sm p-1 rounded-full hover:bg-surface-container-highest disabled:opacity-50">add</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Buyer Information */}
            {user && (
              <div className="bg-surface-container-low rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Buyer Information</h2>
                <div className="space-y-3">
                  {user.name && (
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Name</span>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  )}
                  {user.email && (
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Email</span>
                      <span className="font-medium">{user.email}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Phone</span>
                      <span className="font-medium">{user.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div className="md:col-span-1">
            <div className="bg-surface-container-high rounded-lg p-6 sticky top-24 border border-outline-variant/10">
              <h2 className="text-xl font-bold mb-6">Payment Summary</h2>
              
              <div className="space-y-4 mb-6 pb-6 border-b border-outline-variant/20">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Ticket Price</span>
                  <span className="font-medium">{formatPrice(tier?.price_minor || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Service Fee (5%)</span>
                  <span className="font-medium">{formatPrice(serviceFee)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-lg">Total</span>
                <span className="font-black text-2xl text-primary">{formatPrice(totalAmount)}</span>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={processing || !tier || !event}
                className="w-full bg-primary hover:bg-primary-dim text-[#0e0e10] py-4 rounded-lg font-black text-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Payment</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">lock</span>
                <span>Secured by Paystack</span>
              </div>

              {/* Buy-back Notice */}
              <div className="mt-6 pt-6 border-t border-outline-variant/20">
                <div className="flex items-start gap-2 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-emerald-400 text-sm">replay</span>
                  <p>
                    <span className="text-emerald-400 font-bold">Buy-back eligible:</span> You can resell this ticket back to us up to 48 hours before the event.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { AuthGuard } from '@/components/AuthGuard';

export default function Checkout() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <AuthGuard>
        <CheckoutInner />
      </AuthGuard>
    </Suspense>
  );
}
