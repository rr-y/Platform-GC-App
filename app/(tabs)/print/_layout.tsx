import { Stack } from 'expo-router';

export default function PrintStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#6200ee' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Print Store', headerShown: false }} />
      <Stack.Screen name="new" options={{ title: 'Upload file' }} />
      <Stack.Screen name="configure" options={{ title: 'Checkout' }} />
      <Stack.Screen name="[id]" options={{ title: 'Print job' }} />
    </Stack>
  );
}
