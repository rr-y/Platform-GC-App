import { api } from './client';

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
): Promise<PrintUpload> {
  const form = new FormData();
  form.append('file', { uri, name, type: mimeType } as unknown as Blob);
  const { data } = await api.post('/print/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    // Uploads can exceed the default 10s, especially over mobile.
    timeout: 60000,
  });
  return data;
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
