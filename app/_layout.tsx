import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (user && inAuthGroup) {
      if (profileLoading) return;
      if (profile?.onboarding_completed_at) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
      return;
    }

    if (user && inOnboarding && profile?.onboarding_completed_at) {
      router.replace('/(tabs)');
    }
  }, [user, authLoading, profile, profileLoading, segments]);

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) await SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <AuthProvider>
      <View style={{ flex: 1, backgroundColor: '#1C1C1E' }} onLayout={onLayoutRootView}>
        <RootLayoutNav />
      </View>
      <StatusBar style="light" />
    </AuthProvider>
  );
}
