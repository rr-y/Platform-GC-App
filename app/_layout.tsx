import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { useAuthStore } from '../src/store/auth';

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
      <Text style={styles.logoGC}>GC</Text>
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

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuth) {
      router.replace('/(auth)/mobile');
    } else if (isAuthenticated && inAuth) {
      router.replace('/(tabs)/');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) return <GCSplashScreen />;
  return <Slot />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#5c00d3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGC: {
    fontSize: 80,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 6,
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
