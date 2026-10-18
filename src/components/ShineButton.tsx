import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

interface ShineButtonProps {
  title?: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

/**
 * 3D Premium Shine Button Component.
 * Features specular top bevel, diagonal gloss sheen, deep violet shadow base,
 * tactile spring press feedback, and elevated neon glow.
 */
export const ShineButton: React.FC<ShineButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  children,
}) => {
  const [scaleAnim] = useState(() => new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.965,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 90,
      useNativeDriver: true,
    }).start();
  };

  const getGradientColors = (): [string, string, ...string[]] => {
    if (disabled) {
      return ['#2E2218', '#1E1712', '#140E0A'];
    }
    switch (variant) {
      case 'accent':
        return ['#FFAA55', '#FF8800', '#FF6B00'];
      case 'secondary':
        return ['#2E1E12', '#1E140C', '#140D08'];
      case 'primary':
      default:
        return ['#FF7A00', '#FF5500'];
    }
  };

  const sizeStyles = {
    sm: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 12 },
    md: { paddingVertical: 14, paddingHorizontal: 22, borderRadius: 15 },
    lg: { paddingVertical: 17, paddingHorizontal: 26, borderRadius: 18 },
  }[size];

  const fontSizeStyles = {
    sm: { fontSize: 13 },
    md: { fontSize: 15 },
    lg: { fontSize: 17 },
  }[size];

  return (
    <Animated.View
      style={[
        styles.outerContainer,
        variant === 'primary' && !disabled && styles.glowShadow,
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[styles.pressableBase, sizeStyles, disabled && styles.disabled]}
      >
        {/* Layer 1: Base Linear Gradient Fill */}
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Layer 2: 3D Light Reflection Gloss (Top 45% Diagonal Sheen) */}
        {!disabled && (
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.32)', 'rgba(255, 255, 255, 0.08)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.3, y: 1 }}
            style={styles.glossOverlay}
          />
        )}

        {/* Layer 3: Specular Top Bevel Edge Highlight (0.75px) */}
        {!disabled && <View style={styles.specularTopEdge} pointerEvents="none" />}

        {/* Content Container */}
        <View style={styles.contentRow}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              {icon && <View style={styles.iconMargin}>{icon}</View>}
              {title ? (
                <Text style={[styles.titleText, fontSizeStyles, textStyle]}>{title}</Text>
              ) : (
                children
              )}
            </>
          )}
        </View>

        {/* Layer 4: Dark 3D Bottom Shelf Edge */}
        {!disabled && (
          <View
            style={[
              styles.bottomShelfEdge,
              { borderBottomColor: variant === 'secondary' ? '#140D08' : '#993D00' },
            ]}
            pointerEvents="none"
          />
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    borderRadius: 16,
  },
  glowShadow: {
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  pressableBase: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopColor: '#FFAA55',
    borderTopWidth: 0.5,
    borderLeftColor: 'rgba(255, 170, 85, 0.25)',
    borderLeftWidth: 0.5,
    borderRightColor: 'rgba(255, 107, 0, 0.25)',
    borderRightWidth: 0.5,
  },
  glossOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
  },
  specularTopEdge: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  bottomShelfEdge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomWidth: 2.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  iconMargin: {
    marginRight: 8,
  },
  titleText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default ShineButton;
