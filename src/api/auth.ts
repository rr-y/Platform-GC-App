import { api } from './client';

export async function requestOtp(mobileNumber: string) {
  const { data } = await api.post('/auth/otp/request', { mobile_number: mobileNumber });
  return data as { message: string; expires_in_seconds: number };
}

export async function verifyOtp(mobileNumber: string, otp: string) {
  const { data } = await api.post('/auth/otp/verify', { mobile_number: mobileNumber, otp });
  return data as {
    access_token: string;
    refresh_token: string;
    token_type: string;
    user: { user_id: string; mobile_number: string; name: string | null; role: string; coin_balance: number };
  };
}

export async function logoutApi(refreshToken: string) {
  await api.post('/auth/logout', { refresh_token: refreshToken });
}
