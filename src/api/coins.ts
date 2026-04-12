import { api } from './client';

export type CoinBalance = {
  total_active_coins: number;
  expiring_soon: { coins: number; expiry_at: string } | null;
};

export type CoinHistoryItem = {
  id: string;
  coins: number;
  type: string;
  status: string;
  issued_at: string;
  expiry_at: string;
  reference_id: string | null;
};

export async function getCoinBalance(): Promise<CoinBalance> {
  const { data } = await api.get('/users/me/coins/balance');
  return data;
}

export async function getCoinHistory(page = 1, limit = 20) {
  const { data } = await api.get('/users/me/coins/history', { params: { page, limit } });
  return data as { items: CoinHistoryItem[]; total: number; page: number; limit: number };
}

export async function getProfile() {
  const { data } = await api.get('/users/me');
  return data as { user_id: string; mobile_number: string; name: string | null; role: string; coin_balance: number };
}
