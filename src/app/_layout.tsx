import '../global.css';
import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  useFonts,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';

import { getDb } from '@/db';
import { useBabyStore } from '@/stores/babies';
import { NotificationDeepLinkHandler } from '@/notifications/deep-link';
import { UndoToast } from '@/components/ui/undo-toast';

SplashScreen.preventAutoHideAsync().catch(() => {});

const LightNavTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#F6F1E7' },
};
const DarkNavTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: '#1B1916' },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [ready, setReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

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

  if (!ready || !fontsLoaded) return <View />;

  return (
    <SafeAreaProvider>
    <ThemeProvider value={colorScheme === 'dark' ? DarkNavTheme : LightNavTheme}>
      <NotificationDeepLinkHandler />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="log/[type]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="baby/[id]/edit" options={{ presentation: 'modal' }} />
      </Stack>
      <UndoToast />
    </ThemeProvider>
    </SafeAreaProvider>
  );
}
