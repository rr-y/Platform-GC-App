import { api } from './client';

export type CouponValidation = {
  valid: boolean;
  coupon_id?: string;
  discount_type?: string;
  discount_value?: number;
  discount_amount?: number;
  campaign_title?: string;
};

export type AvailableOffer = {
  coupon_id: string;
  code: string;
  campaign_title: string;
  discount_type: string;
  discount_value: number;
  is_auto_apply: boolean;
};

export async function validateCoupon(code: string, orderAmount: number): Promise<CouponValidation> {
  const { data } = await api.post('/coupons/validate', { code, order_amount: orderAmount });
  return data;
}

export async function getAvailableOffers(orderAmount = 0): Promise<AvailableOffer[]> {
  const { data } = await api.get('/coupons/available', { params: { order_amount: orderAmount } });
  return data;
}
