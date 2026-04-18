import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const EXPO_PROJECT_ID =
  Constants.expoConfig?.extra?.eas?.projectId ??
  (Constants as any).easConfig?.projectId;

// Foreground handler: show the notification even when the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'General',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#6200ee',
  });
}

/**
 * Request OS permission, set up the Android channel, and fetch the Expo
 * push token for this device. Returns null on simulator/web, when the user
 * denies permission, or when the platform can't deliver a token.
 */
export async function getPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (!Constants.isDevice) return null;

  await ensureAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return null;

  if (!EXPO_PROJECT_ID) {
    console.warn('[push] missing expo.extra.eas.projectId; skipping token');
    return null;
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({
      projectId: EXPO_PROJECT_ID,
    });
    return data;
  } catch (e) {
    console.warn('[push] getExpoPushTokenAsync failed:', e);
    return null;
  }
}
