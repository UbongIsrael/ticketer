'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTicketById, TicketWithDetails } from '@/lib/api';
import { LoadingPage } from '@/components/Loading';
import { ErrorPage } from '@/components/ErrorMessage';
import QRCode from 'qrcode';

export default function TicketDetail() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<TicketWithDetails | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        const data = await getTicketById(ticketId);
        setTicket(data);

        // Generate QR code
        const qrUrl = await QRCode.toDataURL(data.qr_payload, {
          width: 400,
          margin: 2,
          color: {
            dark: '#8B5CF6',
            light: '#0e0e10'
          }
        });
        setQrDataUrl(qrUrl);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load ticket'));
      } finally {
        setLoading(false);
      }
    };

    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId]);

  if (loading) return <LoadingPage />;
  if (error || !ticket) return <ErrorPage error={error || new Error('Ticket not found')} />;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
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

  const downloadQR = () => {
    const link = document.createElement('a');
    link.download = `ticket-${ticket.ticket_code}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const shareTicket = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${ticket.event.title} - Ticket`,
          text: `My ticket for ${ticket.event.title}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/tickets"
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface mb-4 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back to tickets</span>
          </Link>
          <h1 className="text-4xl font-black tracking-tighter">Your Ticket</h1>
        </div>

        {/* Ticket Card */}
        <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-primary/30 shadow-[0_0_40px_rgba(139,92,246,0.2)]">
          {/* Event Cover */}
          {ticket.event.cover_image_url && (
            <div className="h-48 relative overflow-hidden">
              <img
                src={ticket.event.cover_image_url}
                alt={ticket.event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent"></div>
            </div>
          )}

          {/* Ticket Content */}
          <div className="p-8">
            {/* Event Info */}
            <div className="mb-8">
              <h2 className="text-3xl font-black mb-2">{ticket.event.title}</h2>
              <p className="text-on-surface-variant mb-4">{ticket.event.venue_name}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Date</p>
                  <p className="font-bold">{formatDate(ticket.event.starts_at)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Time</p>
                  <p className="font-bold">{formatTime(ticket.event.starts_at)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Tier</p>
                  <p className="font-bold">{ticket.tier.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Ticket Code</p>
                  <p className="font-bold font-mono">{ticket.ticket_code}</p>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="mb-8">
              <div className="bg-white p-8 rounded-2xl flex items-center justify-center">
                {qrDataUrl && (
                  <img src={qrDataUrl} alt="Ticket QR Code" className="w-full max-w-sm" />
                )}
              </div>
              <p className="text-center text-sm text-on-surface-variant mt-4">
                Present this QR code at the entrance
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={downloadQR}
                className="bg-surface-container-highest hover:bg-surface-bright text-on-surface py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">download</span>
                Download
              </button>
              <button
                onClick={shareTicket}
                className="bg-surface-container-highest hover:bg-surface-bright text-on-surface py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">share</span>
                Share
              </button>
            </div>

            {/* Important Info */}
            <div className="bg-surface-container-highest rounded-lg p-4 border border-outline-variant/20">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary">info</span>
                <div className="text-sm text-on-surface-variant">
                  <p className="font-bold text-on-surface mb-2">Important Information</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Do not share your QR code with anyone</li>
                    <li>Arrive at least 30 minutes before event time</li>
                    <li>This ticket is non-transferable</li>
                    <li>You can sell back this ticket up to 48 hours before the event</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Event Location */}
        <div className="mt-6 bg-surface-container-low rounded-lg p-6">
          <h3 className="font-bold text-lg mb-4">Event Location</h3>
          <p className="text-on-surface-variant mb-4">{ticket.event.venue_address}</p>
          <Link
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ticket.event.venue_address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline font-bold"
          >
            <span className="material-symbols-outlined">directions</span>
            Get Directions
          </Link>
        </div>
      </div>
    </div>
  );
}
