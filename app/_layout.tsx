import { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { useAuthStore } from '../src/store/auth';
import { registerPushToken } from '../src/api/users';
import { getPushToken } from '../src/utils/notifications';

const MIN_SPLASH_MS = 2500;

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const theme = {
  ...MD3LightTheme,
  colors: { ...MD3LightTheme.colors, primary: '#6200ee', secondary: '#03dac6' },
};

function GCSplashScreen() {
  return (
    <View style={styles.splash}>
      <Image
        source={require('../assets/adaptive-icon.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />
      <Text style={styles.logoSuperApp}>Super App</Text>
      <Text style={styles.tagline}>Shop More · Save More</Text>
      <Text style={styles.offers}>Exciting Offers Await You</Text>
      <ActivityIndicator size="large" color="#fff" style={styles.spinner} />
    </View>
  );
}

function AuthGuard() {
  const { isAuthenticated, isLoading, restoreSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [splashElapsed, setSplashElapsed] = useState(false);

  useEffect(() => {
    restoreSession();
    const timer = setTimeout(() => setSplashElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  const showSplash = isLoading || !splashElapsed;

  useEffect(() => {
    if (showSplash) return;
    const inAuth = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuth) {
      router.replace('/(auth)/mobile');
    } else if (isAuthenticated && inAuth) {
      router.replace('/(tabs)/');
    }
  }, [isAuthenticated, showSplash, segments]);

  useEffect(() => {
    if (!isAuthenticated) return;
    // Fire-and-forget; push is opt-in, never block login on it.
    (async () => {
      try {
        const token = await getPushToken();
        if (token) await registerPushToken(token);
      } catch (e) {
        console.warn('[push] token registration skipped:', e);
      }
    })();
  }, [isAuthenticated]);

  if (showSplash) return <GCSplashScreen />;
  return <Slot />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#5c00d3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 220,
    height: 220,
    marginBottom: 4,
  },
  logoSuperApp: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 3,
    marginTop: 2,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 24,
    letterSpacing: 1,
  },
  offers: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  spinner: {
    marginTop: 52,
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <AuthGuard />
      </PaperProvider>
    </QueryClientProvider>
  );
}
