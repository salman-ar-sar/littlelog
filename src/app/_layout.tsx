import '../global.css';
import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View } from 'react-native';

import { getDb } from '@/db';
import { useBabyStore } from '@/stores/babies';
import { NotificationDeepLinkHandler } from '@/notifications/deep-link';

SplashScreen.preventAutoHideAsync().catch(() => {});

const LightNavTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#FBF8F4' },
};
const DarkNavTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: '#1C1B22' },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        await getDb();
        await useBabyStore.getState().refresh();
      } catch (e) {
        console.error('[app] startup failed:', e);
      } finally {
        setReady(true);
        void SplashScreen.hideAsync().catch(() => {});
      }
    })();
  }, []);

  if (!ready) return <View />;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkNavTheme : LightNavTheme}>
      <NotificationDeepLinkHandler />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="log/[type]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="baby/[id]/edit" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
