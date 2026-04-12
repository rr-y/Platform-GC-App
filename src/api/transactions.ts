import { api } from './client';

export type TransactionItem = {
  id: string;
  amount: number;
  coins_earned: number;
  coins_used: number;
  discount_amount: number;
  status: string;
  created_at: string;
};

export type TransactionResult = {
  transaction_id: string;
  amount: number;
  discount_applied: number;
  coins_redeemed: number;
  coins_redeemed_value: number;
  final_amount: number;
  coins_earned: number;
  coins_balance_after: number;
};

export async function createTransaction(payload: {
  amount: number;
  order_ref?: string;
  coins_to_redeem?: number;
  coupon_code?: string;
}): Promise<TransactionResult> {
  const { data } = await api.post('/transactions', payload);
  return data;
}

export async function getTransactions(page = 1, limit = 20) {
  const { data } = await api.get('/transactions', { params: { page, limit } });
  return data as { items: TransactionItem[]; total: number; page: number; limit: number };
}

export async function getMyTransactions(page = 1, limit = 20) {
  const { data } = await api.get('/users/me/transactions', { params: { page, limit } });
  return data as { items: TransactionItem[]; total: number; page: number; limit: number };
}
