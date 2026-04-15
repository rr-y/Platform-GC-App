import { api } from './client';

export type OfferBannerItem = {
  campaign_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  discount_type: string;
  discount_value: number;
  min_order_value: number;
  valid_to: string;
  coupon_code: string | null;
  is_auto_apply: boolean;
};

export async function getOfferBanners(): Promise<OfferBannerItem[]> {
  const { data } = await api.get('/users/me/offers');
  return data;
}
