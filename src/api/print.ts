import { api } from './client';
import { getAccessToken } from '../utils/tokens';

const UPLOAD_BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000') + '/api/v1';

export type PrintUpload = {
  upload_id: string;
  file_name: string;
  mime_type: string;
  page_count: number;
  file_size: number;
};

export type PrintPriceBreakdown = {
  pages_to_print: number;
  copies: number;
  color_mode: string;
  rate_per_page: number;
  subtotal: number;
  coins_to_redeem: number;
  coin_value: number;
  final_amount: number;
};

export type PrintJob = {
  id: string;
  file_name: string;
  mime_type: string;
  page_count: number;
  selected_pages: number[] | null;
  color_mode: 'bw' | 'color' | null;
  copies: number | null;
  subtotal: number | null;
  coins_to_redeem: number;
  coin_value: number;
  final_amount: number | null;
  pickup_otp: string | null;
  status: 'draft' | 'queued' | 'printing' | 'printed' | 'collected' | 'cancelled';
  created_at: string;
  queued_at: string | null;
  printed_at: string | null;
  collected_at: string | null;
};

export type PrintJobSubmit = {
  job: PrintJob;
  breakdown: PrintPriceBreakdown;
};

export type AdminPrintLookup = {
  job_id: string;
  user_id: string;
  name: string | null;
  mobile_number: string;
  file_name: string;
  status: string;
  breakdown: PrintPriceBreakdown;
};

export type AdminPrintCollect = {
  job_id: string;
  transaction_id: string;
  final_amount: number;
  coins_redeemed: number;
  coins_earned: number;
  coins_balance_after: number;
};

export async function uploadPrintFile(
  uri: string,
  name: string,
  mimeType: string,
  file?: File | Blob | null,
): Promise<PrintUpload> {
  // Native fetch (not the axios client) so the runtime assembles the multipart
  // body itself — axios has repeatedly returned the `file` field to FastAPI as
  // a plain string.
  //
  // Platform split:
  //   - Web: expo-document-picker gives us `asset.file` (a real `File`). Append
  //     that directly so the browser's multipart builder attaches a proper
  //     filename and Content-Type part.
  //   - React Native: there is no `File`. RN's FormData accepts the magic
  //     `{ uri, name, type }` shape and the native bridge turns it into a
  //     multipart part with a filename. The TS cast keeps the types happy.
  //
  // Using the wrong shape on either platform makes the `file` part arrive
  // without a filename, which is exactly what triggers
  // "Expected UploadFile, received: <class 'str'>" from Pydantic.
  const form = new FormData();
  if (file) {
    form.append('file', file, name);
  } else {
    form.append('file', { uri, name, type: mimeType } as unknown as Blob);
  }

  const token = await getAccessToken();
  const res = await fetch(`${UPLOAD_BASE_URL}/print/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form as any,
  });

  if (!res.ok) {
    let detail: unknown = await res.text();
    try {
      detail = JSON.parse(detail as string);
    } catch {
      /* plain-text error */
    }
    const err: any = new Error('Upload failed');
    err.response = { status: res.status, data: detail };
    throw err;
  }
  return (await res.json()) as PrintUpload;
}

export async function estimatePrint(body: {
  page_count: number;
  selected_pages: number[];
  color_mode: 'bw' | 'color';
  copies: number;
  coins_to_redeem: number;
}): Promise<PrintPriceBreakdown> {
  const { data } = await api.post('/print/jobs/estimate', body);
  return data;
}

export async function submitPrintJob(body: {
  upload_id: string;
  selected_pages: number[];
  color_mode: 'bw' | 'color';
  copies: number;
  coins_to_redeem: number;
}): Promise<PrintJobSubmit> {
  const { data } = await api.post('/print/jobs', body);
  return data;
}

export async function listPrintJobs(): Promise<PrintJob[]> {
  const { data } = await api.get('/print/jobs');
  return data;
}

export async function getPrintJob(id: string): Promise<PrintJob> {
  const { data } = await api.get(`/print/jobs/${id}`);
  return data;
}

export async function cancelPrintJob(id: string): Promise<void> {
  await api.delete(`/print/jobs/${id}`);
}

// Admin-only
export async function adminLookupPrintByOtp(pickup_otp: string): Promise<AdminPrintLookup> {
  const { data } = await api.post('/admin/print/lookup', { pickup_otp });
  return data;
}

export async function adminCollectPrintJob(id: string): Promise<AdminPrintCollect> {
  const { data } = await api.post(`/admin/print/jobs/${id}/collect`);
  return data;
}
