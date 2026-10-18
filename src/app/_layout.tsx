import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AnimatedSplashScreen } from '../components/AnimatedSplashScreen';
import { colors } from '../constants/colors';

SplashScreen.preventAutoHideAsync().catch(() => {});

const simplyNivoTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.cardBg,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.primary,
  },
};

export default function RootLayout() {
  const [isSplashVisible, setIsSplashVisible] = useState<boolean>(true);

  return (
    <ThemeProvider value={simplyNivoTheme}>
      <View style={styles.container}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: {
              fontWeight: '700',
              color: colors.textPrimary,
            },
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: colors.background,
            },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="companion"
            options={{
              title: 'Companion Studio',
              headerTransparent: true,
              headerStyle: {
                backgroundColor: 'rgba(10, 8, 19, 0.85)',
              },
            }}
          />
          <Stack.Screen
            name="history"
            options={{
              title: 'Saved Conversations',
              headerTransparent: true,
              headerStyle: {
                backgroundColor: 'rgba(10, 8, 19, 0.85)',
              },
            }}
          />
          <Stack.Screen
            name="premium"
            options={{
              title: 'SimplyNivo Premium',
              headerTransparent: true,
              headerStyle: {
                backgroundColor: 'rgba(10, 8, 19, 0.85)',
              },
            }}
          />
        </Stack>

        {/* Custom Animated Splash Sequence */}
        {isSplashVisible && (
          <AnimatedSplashScreen
            onAnimationComplete={() => setIsSplashVisible(false)}
          />
        )}
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
