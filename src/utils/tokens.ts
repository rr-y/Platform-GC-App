import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

// SecureStore is not available on web — fall back to localStorage
const isWeb = Platform.OS === 'web';

async function setItem(key: string, value: string) {
  if (isWeb) {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string) {
  if (isWeb) {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export async function saveTokens(access: string, refresh: string) {
  await setItem(ACCESS_KEY, access);
  await setItem(REFRESH_KEY, refresh);
}

export async function getAccessToken(): Promise<string | null> {
  return getItem(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getItem(REFRESH_KEY);
}

export async function clearTokens() {
  await removeItem(ACCESS_KEY);
  await removeItem(REFRESH_KEY);
}
