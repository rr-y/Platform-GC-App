import { api } from './client';

export type AvailableOffer = {
  coupon_id: string;
  code: string;
  campaign_title: string;
  discount_type: string;
  discount_value: number;
  is_auto_apply: boolean;
};

export type ExpiringSoon = {
  coins: number;
  expiry_at: string;
};

export type CustomerLookup = {
  user_id: string;
  name: string | null;
  mobile_number: string;
  coin_balance: number;
  expiring_soon: ExpiringSoon | null;
  applicable_offers: AvailableOffer[];
  max_redeemable_coins: number;
  max_redeemable_value: number;
};

export type CheckoutResult = {
  transaction_id: string;
  amount: number;
  discount_applied: number;
  coins_redeemed: number;
  coins_redeemed_value: number;
  final_amount: number;
  coins_earned: number;
  coins_balance_after: number;
  notification_sent: boolean;
};

export async function lookupCustomer(
  mobile_number: string,
  amount: number,
): Promise<CustomerLookup> {
  const { data } = await api.post('/admin/customers/lookup', { mobile_number, amount });
  return data;
}

export async function adminCheckout(payload: {
  mobile_number: string;
  amount: number;
  coins_to_redeem?: number;
  coupon_code?: string;
}): Promise<CheckoutResult> {
  const { data } = await api.post('/admin/checkout', payload);
  return data;
}
