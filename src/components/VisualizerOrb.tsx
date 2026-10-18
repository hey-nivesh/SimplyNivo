import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VisualizerOrbProps {
  isActive: boolean;
  mode?: 'idle' | 'listening' | 'speaking' | 'processing';
  meteringLevel?: number;
  size?: number;
}

/**
 * High-Fidelity Holographic Voice Visualizer Orb.
 * Uses react-native-reanimated to create multi-layered concentric pulsing rings,
 * rotational harmonic shifts, and breathing speech rhythm visualizers.
 */
export const VisualizerOrb: React.FC<VisualizerOrbProps> = ({
  isActive,
  mode = 'idle',
  meteringLevel = 0,
  size = Math.min(SCREEN_WIDTH * 0.58, 240),
}) => {
  // Reanimated Shared Values
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const outerRingScale = useSharedValue(1);
  const outerRingOpacity = useSharedValue(0.2);
  const innerPulse = useSharedValue(1);

  useEffect(() => {
    if (isActive && meteringLevel > 0) {
      // Dynamic live amplitude scale between 0.96 and 1.30
      scale.value = withTiming(0.96 + meteringLevel * 0.34, {
        duration: 100,
        easing: Easing.out(Easing.ease),
      });
      outerRingScale.value = withTiming(1.1 + meteringLevel * 0.45, {
        duration: 120,
      });
      outerRingOpacity.value = withTiming(0.2 + meteringLevel * 0.5, {
        duration: 120,
      });
    } else if (isActive || mode === 'listening' || mode === 'speaking') {
      // Dynamic active speech rhythm: scale oscillates between 0.95 and 1.15
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 900, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(0.95, { duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(1.1, { duration: 700, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(0.98, { duration: 650, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        true
      );

      // Rotational shifts
      rotation.value = withRepeat(
        withTiming(360, { duration: 8000, easing: Easing.linear }),
        -1,
        false
      );

      // Concentric expanding outer glow waves
      outerRingScale.value = withRepeat(
        withSequence(
          withTiming(1.38, { duration: 1200, easing: Easing.out(Easing.ease) }),
          withTiming(1.0, { duration: 1200, easing: Easing.in(Easing.ease) })
        ),
        -1,
        true
      );

      outerRingOpacity.value = withRepeat(
        withSequence(
          withTiming(0.45, { duration: 1200, easing: Easing.ease }),
          withTiming(0.12, { duration: 1200, easing: Easing.ease })
        ),
        -1,
        true
      );

      // High-frequency inner pulse
      innerPulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 400, easing: Easing.ease }),
          withTiming(0.96, { duration: 400, easing: Easing.ease })
        ),
        -1,
        true
      );
    } else {
      // Calm ambient idle breathing
      scale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.98, { duration: 2200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      rotation.value = withRepeat(
        withTiming(360, { duration: 24000, easing: Easing.linear }),
        -1,
        false
      );

      outerRingScale.value = withTiming(1.08, { duration: 800 });
      outerRingOpacity.value = withTiming(0.15, { duration: 800 });
      innerPulse.value = withTiming(1, { duration: 600 });
    }
  }, [isActive, mode, meteringLevel, scale, rotation, outerRingScale, outerRingOpacity, innerPulse]);

  // Animated Styles
  const coreOrbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rotatingHaloAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const outerWaveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerRingScale.value }],
    opacity: outerRingOpacity.value,
  }));

  const innerWaveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerPulse.value }],
  }));

  const halfSize = size / 2;

  return (
    <View style={[styles.container, { width: size * 1.5, height: size * 1.5 }]}>
      {/* Layer 1: Ambient Outer Pulse Wave */}
      <Animated.View
        style={[
          styles.outerPulseWave,
          {
            width: size * 1.35,
            height: size * 1.35,
            borderRadius: (size * 1.35) / 2,
          },
          outerWaveAnimatedStyle,
        ]}
      >
        <LinearGradient
          colors={['rgba(192, 125, 241, 0.35)', 'rgba(155, 81, 224, 0.1)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Layer 2: Mid Concentric Ripple Ring */}
      <Animated.View
        style={[
          styles.midRippleRing,
          {
            width: size * 1.18,
            height: size * 1.18,
            borderRadius: (size * 1.18) / 2,
          },
          coreOrbAnimatedStyle,
        ]}
      />

      {/* Layer 3: Rotational Particle Halo */}
      <Animated.View
        style={[
          styles.rotatingHalo,
          {
            width: size * 1.08,
            height: size * 1.08,
            borderRadius: (size * 1.08) / 2,
          },
          rotatingHaloAnimatedStyle,
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(212, 155, 255, 0.65)',
            'rgba(155, 81, 224, 0.2)',
            'rgba(192, 125, 241, 0.55)',
            'rgba(108, 37, 184, 0.15)',
          ]}
          locations={[0, 0.35, 0.7, 1]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Layer 4: Core Holographic Orb */}
      <Animated.View
        style={[
          styles.coreOrb,
          {
            width: size,
            height: size,
            borderRadius: halfSize,
          },
          coreOrbAnimatedStyle,
        ]}
      >
        <LinearGradient
          colors={['#DDBBFF', '#C07DF1', '#9B51E0', '#4B1882', '#1B0B3A']}
          locations={[0, 0.22, 0.52, 0.8, 1]}
          style={[styles.coreFill, { borderRadius: halfSize }]}
          start={{ x: 0.25, y: 0.1 }}
          end={{ x: 0.85, y: 0.95 }}
        >
          {/* Inner Gloss Reflex Spot */}
          <View style={[styles.glossSpot, { width: size * 0.42, height: size * 0.26 }]} />

          {/* High-Frequency Inner Core Glow */}
          <Animated.View
            style={[
              styles.innerCoreGlow,
              {
                width: size * 0.55,
                height: size * 0.55,
                borderRadius: (size * 0.55) / 2,
              },
              innerWaveAnimatedStyle,
            ]}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.5)', 'rgba(221, 187, 255, 0.2)', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerPulseWave: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(192, 125, 241, 0.35)',
    overflow: 'hidden',
  },
  midRippleRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(221, 187, 255, 0.25)',
    backgroundColor: 'rgba(155, 81, 224, 0.08)',
  },
  rotatingHalo: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 155, 255, 0.4)',
    overflow: 'hidden',
  },
  coreOrb: {
    shadowColor: '#C07DF1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 28,
    elevation: 16,
  },
  coreFill: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  glossSpot: {
    position: 'absolute',
    top: '12%',
    left: '18%',
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
    borderRadius: 9999,
    transform: [{ rotate: '-25deg' }],
  },
  innerCoreGlow: {
    overflow: 'hidden',
  },
});

export default VisualizerOrb;
