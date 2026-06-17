import { createContext, useCallback, useContext, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar } from 'react-native-paper';
import { useAuthStore } from '../../src/store/auth';
import { ProfileDrawer } from '../../src/components/ProfileDrawer';

// ─── Shared drawer state via Context ────────────────────────────────────────
const DrawerCtx = createContext({ open: false, toggle: () => {} });

function ProfileButton() {
  const { open, toggle } = useContext(DrawerCtx);
  const user = useAuthStore((s) => s.user);

  const initials = (user?.name ?? user?.mobile_number ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Pressable
      onPress={toggle}
      style={({ pressed }) => ({ marginRight: 12, opacity: pressed ? 0.7 : 1 })}
      accessibilityLabel={open ? 'Close profile' : 'Open profile'}
      accessibilityRole="button"
    >
      <Avatar.Text
        size={34}
        label={initials}
        style={{
          backgroundColor: open
            ? 'rgba(255,255,255,0.55)'
            : 'rgba(255,255,255,0.25)',
        }}
        labelStyle={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}
      />
    </Pressable>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  const [profileOpen, setProfileOpen] = useState(false);
  const toggle = useCallback(() => setProfileOpen((v) => !v), []);
  const close = useCallback(() => setProfileOpen(false), []);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  return (
    <DrawerCtx.Provider value={{ open: profileOpen, toggle }}>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: '#6200ee',
            tabBarInactiveTintColor: '#9e9e9e',
            tabBarStyle: { elevation: 8, shadowOpacity: 0.08 },
            headerStyle: { backgroundColor: '#6200ee' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
            headerRight: () => <ProfileButton />,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: ({ color, size, focused }) => (
                <MaterialCommunityIcons
                  name={focused ? 'home-variant' : 'home-variant-outline'}
                  color={color}
                  size={size}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="coins"
            options={{
              title: 'Coins',
              tabBarIcon: ({ color, size, focused }) => (
                <MaterialCommunityIcons
                  name={focused ? 'hand-coin' : 'hand-coin-outline'}
                  color={color}
                  size={size}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="offers"
            options={{
              title: 'Offers',
              tabBarIcon: ({ color, size, focused }) => (
                <MaterialCommunityIcons
                  name={focused ? 'ticket-percent' : 'ticket-percent-outline'}
                  color={color}
                  size={size}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="print"
            options={{
              title: 'Print',
              headerShown: false,
              tabBarIcon: ({ color, size, focused }) => (
                <MaterialCommunityIcons
                  name={focused ? 'printer' : 'printer-outline'}
                  color={color}
                  size={size}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="admin"
            options={{
              title: 'Checkout',
              href: isAdmin ? undefined : null,
              tabBarIcon: ({ color, size, focused }) => (
                <MaterialCommunityIcons
                  name={focused ? 'cash-register' : 'cash-register'}
                  color={color}
                  size={size}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{ title: 'Profile', href: null }}
          />
        </Tabs>

        {/* Overlay drawer — rendered outside <Tabs> so it covers the tab bar */}
        <ProfileDrawer open={profileOpen} onClose={close} />
      </View>
    </DrawerCtx.Provider>
  );
}
