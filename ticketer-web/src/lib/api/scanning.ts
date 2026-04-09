import { api } from '../axios';

export interface ScanManifestItem {
  ticket_id: string;
  ticket_code: string;
  qr_payload: string;
  buyer_name: string | null;
  tier_name: string;
}

export interface ValidateScanRequest {
  qr_payload: string;
  event_id: string;
}

export interface ValidateScanResponse {
  valid: boolean;
  ticket?: {
    id: string;
    ticket_code: string;
    buyer_name: string | null;
    tier_name: string;
  };
  message: string;
}

export interface BulkSyncRequest {
  scans: Array<{
    qr_payload: string;
    scanned_at: string;
  }>;
  event_id: string;
}

export interface BulkSyncResponse {
  synced: number;
  failed: number;
  errors: Array<{
    qr_payload: string;
    reason: string;
  }>;
}

// Download ticket manifest for offline scanning (requires HOST capability)
export const downloadManifest = async (eventId: string): Promise<ScanManifestItem[]> => {
  const response = await api.get(`/scanning/manifest/${eventId}`);
  return response.data;
};

// Validate a scanned QR code (requires HOST capability)
export const validateScan = async (data: ValidateScanRequest): Promise<ValidateScanResponse> => {
  const response = await api.post('/scanning/validate', data);
  return response.data;
};

// Bulk sync scans from offline scanner (requires HOST capability)
export const bulkSyncScans = async (data: BulkSyncRequest): Promise<BulkSyncResponse> => {
  const response = await api.post('/scanning/sync', data);
  return response.data;
};
