import { create } from 'zustand';
import { saveTokens, getAccessToken, getRefreshToken, clearTokens } from '../utils/tokens';
import { registerLogoutCallback } from '../api/client';

type User = {
  user_id: string;
  mobile_number: string;
  name: string | null;
  role: string;
  coin_balance: number;
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
};

export const useAuthStore = create<AuthState>((set, get) => {
  // Register logout callback so the axios interceptor can trigger it on refresh failure
  registerLogoutCallback(() => get().logout());

  return {
    user: null,
    isAuthenticated: false,
    isLoading: true,

    login: async (accessToken, refreshToken, user) => {
      await saveTokens(accessToken, refreshToken);
      set({ user, isAuthenticated: true });
    },

    logout: async () => {
      await clearTokens();
      set({ user: null, isAuthenticated: false });
    },

    restoreSession: async () => {
      const token = await getAccessToken();
      set({ isLoading: false, isAuthenticated: !!token });
    },

    updateUser: (partial) => {
      set((state) => ({
        user: state.user ? { ...state.user, ...partial } : state.user,
      }));
    },
  };
});
