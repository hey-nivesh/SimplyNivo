import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AnimatedSplashScreen } from '../components/AnimatedSplashScreen';
import { colors } from '../constants/colors';

// Prevent splash auto-hide safely
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore native error if already hidden */
});

interface ErrorBoundaryState {
  hasError: boolean;
  error: string;
}

// Root Error Boundary Component to prevent hard crashes
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error: error?.message || String(error) };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[SimplyNivo Root Error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>SimplyNivo Encountered an Error</Text>
          <Text style={styles.errorText}>{this.state.error}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

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
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (e) {
        console.warn('[SimplyNivo] Startup check:', e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <RootErrorBoundary>
      <SafeAreaProvider>
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
      </SafeAreaProvider>
    </RootErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0A0813',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#FF6B00',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    color: '#A09CAE',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
});

