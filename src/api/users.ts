import { api } from './client';

export async function registerPushToken(push_token: string): Promise<void> {
  await api.post('/users/me/push-token', { push_token });
}
