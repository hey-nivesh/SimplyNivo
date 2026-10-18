import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GlowBackground } from './GlowBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LOGO_SIZE = Math.min(SCREEN_WIDTH * 0.32, 120);

interface AnimatedSplashScreenProps {
  onAnimationComplete: () => void;
}

/**
 * Premium Animated Splash Screen Sequence.
 * - Layered OLED #0A0813 GlowBackground
 * - Centered Avatar logo spring entrance
 * - Neon purple radial pulse ring
 * - Neo-Grotesque typography slide-up
 * - Seamless fade-out transition
 */
export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  onAnimationComplete,
}) => {
  // Shared Animation Values
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);

  const ringScale = useSharedValue(1.0);
  const ringOpacity = useSharedValue(0);

  const textTranslateY = useSharedValue(20);
  const textOpacity = useSharedValue(0);

  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    // 1. Hide native splash screen immediately as custom view takes over
    SplashScreen.hideAsync().catch(() => {});

    // 2. Step 1 (0.0s - 0.6s): Logo spring scale + fade in
    logoScale.value = withSpring(1.0, {
      damping: 12,
      stiffness: 100,
      mass: 0.8,
    });
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });

    // 3. Step 2 (0.6s - 1.2s): Neon purple ring pulse outward with breath
    ringOpacity.value = withDelay(
      500,
      withSequence(
        withTiming(0.85, { duration: 400 }),
        withRepeat(
          withSequence(
            withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.8, { duration: 600, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      )
    );
    ringScale.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1.24, { duration: 600, easing: Easing.out(Easing.ease) }),
          withTiming(1.02, { duration: 600, easing: Easing.in(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // 4. Step 3 (1.0s - 1.6s): Text slide up + fade in
    textTranslateY.value = withDelay(
      900,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
    textOpacity.value = withDelay(
      900,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
    );

    // 5. Step 4 (2.2s - 2.5s): Entire overlay fade out + unmount
    overlayOpacity.value = withDelay(
      2200,
      withTiming(
        0,
        { duration: 350, easing: Easing.in(Easing.ease) },
        (isFinished) => {
          if (isFinished) {
            runOnJS(onAnimationComplete)();
          }
        }
      )
    );
  }, [
    logoScale,
    logoOpacity,
    ringScale,
    ringOpacity,
    textTranslateY,
    textOpacity,
    overlayOpacity,
    onAnimationComplete,
  ]);

  // Animated Styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: textTranslateY.value }],
    opacity: textOpacity.value,
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayAnimatedStyle]}>
      <GlowBackground glowPosition="both">
        <View style={styles.centerContainer}>
          {/* Glowing Radial Ring */}
          <Animated.View style={[styles.pulseRing, ringAnimatedStyle]} />

          {/* Logo Avatar */}
          <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
            <Image
              source={require('../../assets/expo.icon/Assets/logo.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
          </Animated.View>

          {/* Typography: Title + Subtitle */}
          <Animated.View style={[styles.textWrapper, textAnimatedStyle]}>
            <Text style={styles.appTitle}>SimplyNivo</Text>
            <Text style={styles.appSubtitle}>Articulate with confidence.</Text>
          </Animated.View>
        </View>
      </GlowBackground>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    zIndex: 99999,
    backgroundColor: '#0A0813',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: LOGO_SIZE * 1.5,
    height: LOGO_SIZE * 1.5,
    borderRadius: (LOGO_SIZE * 1.5) / 2,
    borderWidth: 2,
    borderColor: '#9B51E0',
    backgroundColor: 'rgba(155, 81, 224, 0.12)',
    shadowColor: '#9B51E0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 28,
  },
  logoWrapper: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    backgroundColor: 'rgba(22, 18, 38, 0.95)',
    borderColor: 'rgba(192, 125, 241, 0.45)',
    borderWidth: 1.5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C07DF1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.65,
    shadowRadius: 20,
    elevation: 12,
  },
  logoImage: {
    width: '85%',
    height: '85%',
  },
  textWrapper: {
    alignItems: 'center',
    marginTop: 24,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    textShadowColor: 'rgba(155, 81, 224, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#A09CAB',
    marginTop: 6,
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontStyle: 'italic',
  },
});

export default AnimatedSplashScreen;
