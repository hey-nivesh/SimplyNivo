import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlowBackground } from '../components/GlowBackground';
import { ShineButton } from '../components/ShineButton';
import { colors } from '../constants/colors';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <GlowBackground glowPosition="both">
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Brand Pill Header */}
          <View style={styles.badgeContainer}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>SIMPLYNIVO AI COMPANION</Text>
          </View>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.titleHeadline}>
              Zero Buzzwords.{'\n'}
              <Text style={styles.titleGradient}>Pure Clarity.</Text>
            </Text>
            <Text style={styles.subtitle}>
              Instantly decode corporate jargon, complex workplace politics, and confusing
              conversations into clear, humanized, actionable thoughts.
            </Text>
          </View>

          {/* Feature Highlights with Strict Vector Icons */}
          <View style={styles.featureGrid}>
            <View style={styles.featureCard}>
              <View style={styles.iconCircle}>
                <Feather name="zap" size={20} color={colors.accent} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Instant Translation</Text>
                <Text style={styles.featureDesc}>
                  Paste any rambling email or complex meeting memo to extract the exact point.
                </Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.iconCircle}>
                <Feather name="target" size={20} color={colors.accent} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>3 Adaptive Tones</Text>
                <Text style={styles.featureDesc}>
                  Switch seamlessly between Plain & Simple, Executive, and Empathetic.
                </Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.iconCircle}>
                <Ionicons name="mic-outline" size={22} color={colors.accent} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureDescBold}>Companion Voice Studio</Text>
                <Text style={styles.featureDesc}>
                  Real-time vocal feedback & holographic speech wave rehearsal.
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <ShineButton
              title="Open Companion Studio"
              size="lg"
              variant="primary"
              onPress={() => router.push('/companion')}
              icon={<Ionicons name="mic" size={18} color="#FFFFFF" />}
            />

            <View style={styles.secondaryNavRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.75}
                onPress={() => router.push('/history')}
              >
                <View style={styles.secBtnContent}>
                  <Feather name="clock" size={15} color={colors.textSecondary} style={styles.secIcon} />
                  <Text style={styles.secondaryButtonText}>Saved History</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.75}
                onPress={() => router.push('/premium')}
              >
                <View style={styles.secBtnContent}>
                  <Feather name="award" size={15} color={colors.accent} style={styles.secIcon} />
                  <Text style={styles.secondaryButtonText}>Premium Plan</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
    justifyContent: 'space-between',
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 18, 30, 0.85)',
    borderColor: 'rgba(255, 107, 0, 0.35)',
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 20,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1.2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  heroSection: {
    marginBottom: 24,
  },
  titleHeadline: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 42,
    letterSpacing: -0.6,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  titleGradient: {
    color: colors.accent,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  featureGrid: {
    gap: 12,
    marginBottom: 28,
  },
  featureCard: {
    backgroundColor: 'rgba(24, 18, 30, 0.75)',
    borderColor: 'rgba(46, 34, 24, 0.7)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(10, 8, 19, 0.9)',
    borderColor: 'rgba(255, 107, 0, 0.35)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  featureDescBold: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  featureDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  actionSection: {
    gap: 12,
  },
  secondaryNavRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(22, 18, 38, 0.8)',
    borderColor: 'rgba(46, 39, 76, 0.8)',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secIcon: {
    marginRight: 6,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});
