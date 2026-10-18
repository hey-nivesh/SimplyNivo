import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GlowBackgroundProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glowPosition?: 'bottom' | 'center' | 'both';
}

/**
 * Reusable Cinematic Dark Smoke & Nebula Glow Background.
 * Layered with organic center-to-bottom gradient diffusion,
 * ambient electric orange haze (#FF6B00 / #331500), and deep OLED obsidian foundation.
 */
export const GlowBackground: React.FC<GlowBackgroundProps> = ({
  children,
  style,
  glowPosition = 'both',
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* 1. Base Full-Screen Deep Obsidian & Charcoal Foundation */}
      <LinearGradient
        colors={['#0A0813', '#120804', '#0A0813', '#000000']}
        locations={[0, 0.35, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Top-Right Subtle Orange Nebula Haze */}
      {(glowPosition === 'center' || glowPosition === 'both') && (
        <View style={styles.topNebulaHaze} pointerEvents="none">
          <LinearGradient
            colors={['rgba(255, 107, 0, 0.12)', 'rgba(51, 21, 0, 0.05)', 'transparent']}
            style={styles.nebulaCircle}
            start={{ x: 0.5, y: 0.2 }}
            end={{ x: 0.8, y: 1 }}
          />
        </View>
      )}

      {/* 3. Center-to-Bottom Smoke & Orange Nebula Glow (#331500 fading down to #0A0813) */}
      {(glowPosition === 'bottom' || glowPosition === 'both') && (
        <View style={styles.bottomSmokeContainer} pointerEvents="none">
          {/* Outer Deep Smoke Diffusion */}
          <LinearGradient
            colors={['transparent', 'rgba(51, 21, 0, 0.45)', 'rgba(26, 10, 0, 0.85)', '#0A0813']}
            locations={[0, 0.35, 0.7, 1]}
            style={styles.bottomOuterSmoke}
          />

          {/* Core Orange Nebula Bulb (Circular Center Glow) */}
          <View style={styles.smokeBulbWrapper}>
            <LinearGradient
              colors={[
                'rgba(255, 136, 0, 0.24)',
                'rgba(255, 107, 0, 0.18)',
                '#331500',
                '#0A0813',
              ]}
              locations={[0, 0.25, 0.65, 1]}
              style={styles.smokeBulb}
              start={{ x: 0.5, y: 0.3 }}
              end={{ x: 0.5, y: 1 }}
            />
          </View>
        </View>
      )}

      {/* Content Layer */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0813',
  },
  topNebulaHaze: {
    position: 'absolute',
    top: -SCREEN_HEIGHT * 0.1,
    right: -SCREEN_WIDTH * 0.2,
    width: SCREEN_WIDTH * 1.1,
    height: SCREEN_WIDTH * 1.1,
    overflow: 'hidden',
  },
  nebulaCircle: {
    width: '100%',
    height: '100%',
    borderRadius: (SCREEN_WIDTH * 1.1) / 2,
  },
  bottomSmokeContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.65,
    overflow: 'hidden',
  },
  bottomOuterSmoke: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  smokeBulbWrapper: {
    position: 'absolute',
    bottom: -SCREEN_WIDTH * 0.35,
    left: (SCREEN_WIDTH - SCREEN_WIDTH * 1.4) / 2,
    width: SCREEN_WIDTH * 1.4,
    height: SCREEN_WIDTH * 1.4,
  },
  smokeBulb: {
    width: '100%',
    height: '100%',
    borderRadius: (SCREEN_WIDTH * 1.4) / 2,
  },
});

export default GlowBackground;
