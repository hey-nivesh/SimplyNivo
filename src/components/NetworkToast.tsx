import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../constants/colors';

interface NetworkToastProps {
  visible: boolean;
  message?: string;
  type?: 'offline' | 'warming' | 'info';
  onDismiss?: () => void;
}

/**
 * Resilient Network & Cold-Start Toast Banner.
 * Notifies the user with Ionicons cloud-offline-outline when server is cold/offline.
 */
export const NetworkToast: React.FC<NetworkToastProps> = ({
  visible,
  message = 'Offline mode engaged. Displaying instant local preview.',
  type = 'offline',
  onDismiss,
}) => {
  const translateY = useSharedValue(-60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
      opacity.value = withTiming(1, { duration: 300 });

      const autoDismissTimer = setTimeout(() => {
        if (onDismiss) onDismiss();
      }, 5000);

      return () => clearTimeout(autoDismissTimer);
    } else {
      translateY.value = withTiming(-60, { duration: 250 });
      opacity.value = withTiming(0, { duration: 250 });
    }
  }, [visible, translateY, opacity, onDismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const isWarming = type === 'warming';

  return (
    <Animated.View style={[styles.toastContainer, animatedStyle]}>
      <View
        style={[
          styles.toastCard,
          isWarming ? styles.cardWarming : styles.cardOffline,
        ]}
      >
        <Ionicons
          name={isWarming ? 'timer-outline' : 'cloud-offline-outline'}
          size={18}
          color={isWarming ? colors.accent : '#FBBF24'}
          style={styles.icon}
        />
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    maxWidth: 480,
    width: '100%',
  },
  cardOffline: {
    backgroundColor: 'rgba(38, 22, 18, 0.95)',
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
  },
  cardWarming: {
    backgroundColor: 'rgba(38, 22, 14, 0.95)',
    borderColor: colors.primary,
    shadowColor: colors.primary,
  },
  icon: {
    marginRight: 10,
  },
  toastText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 17,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});

export default NetworkToast;
