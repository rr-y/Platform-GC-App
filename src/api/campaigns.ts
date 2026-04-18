import { api } from './client';

export type Campaign = {
  id: string;
  title: string;
  type: string;
  discount_value: number | null;
  min_order_value: number;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  audience_type: string;
  usage_limit: number | null;
  usage_count: number;
  image_url: string | null;
  description: string | null;
};

export async function getCampaigns(active_only = false): Promise<Campaign[]> {
  const { data } = await api.get('/admin/campaigns', {
    params: { active_only },
  });
  return data;
}

export async function toggleCampaign(id: string, is_active: boolean): Promise<Campaign> {
  const { data } = await api.patch(`/admin/campaigns/${id}`, { is_active });
  return data;
}
