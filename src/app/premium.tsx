import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

type BillingCycle = 'monthly' | 'yearly';

interface FeatureItem {
  title: string;
  description: string;
}

const CHECKLIST_ITEMS: FeatureItem[] = [
  {
    title: 'Unlimited Voice & Studio Access',
    description: 'Simulate high-stakes meetings & conflict conversations with zero lag.',
  },
  {
    title: 'Anti-Buzzword Instant Stripper',
    description: 'Eliminate corporate jargon, passive aggression, and ambiguous phrasing.',
  },
  {
    title: 'Custom Personality Profiles',
    description: 'Fine-tune AI companion responses for executive, empathetic, or simple delivery.',
  },
  {
    title: 'Cloud History & Encrypted Backup',
    description: 'Auto-sync conversations securely across iOS, Android, and web with Supabase.',
  },
];

export default function PremiumScreen() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');

  const handleSelectCycle = (cycle: BillingCycle) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    setBillingCycle(cycle);
  };

  const handleContinue = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    // Subscription flow trigger
  };

  return (
    <GlowBackground glowPosition="both">
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        {/* Top Bar with Back and Close */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.trialStatusPill}>
            <View style={styles.trialDot} />
            <Text style={styles.trialStatusText}>TRIAL IN PROGRESS</Text>
          </View>

          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Glowing Purple Circular Badge with Crown */}
          <View style={styles.headerHero}>
            <View style={styles.crownGlowWrapper}>
              <View style={styles.crownOuterGlow} />
              <View style={styles.crownCircle}>
                <MaterialCommunityIcons name="crown" size={36} color="#E8D4FF" />
              </View>
            </View>

            <Text style={styles.heroTitle}>SimplyNivo Premium</Text>
            <Text style={styles.heroSubtitle}>
              Unlock full companion capability with real-time vocal feedback and unlimited translations.
            </Text>
          </View>

          {/* Segmented Control (Monthly vs Yearly) */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentTab,
                billingCycle === 'monthly' && styles.segmentTabActive,
              ]}
              onPress={() => handleSelectCycle('monthly')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentTabText,
                  billingCycle === 'monthly' && styles.segmentTabTextActive,
                ]}
              >
                Monthly
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentTab,
                billingCycle === 'yearly' && styles.segmentTabActive,
              ]}
              onPress={() => handleSelectCycle('yearly')}
              activeOpacity={0.8}
            >
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>BEST VALUE</Text>
              </View>
              <Text
                style={[
                  styles.segmentTabText,
                  billingCycle === 'yearly' && styles.segmentTabTextActive,
                ]}
              >
                Yearly
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pricing Highlight Card */}
          <View style={styles.pricingCard}>
            <View style={styles.pricingHeader}>
              <View>
                <Text style={styles.planName}>
                  {billingCycle === 'yearly' ? 'Yearly Pro Pass' : 'Monthly Pro Pass'}
                </Text>
                <Text style={styles.planSub}>
                  {billingCycle === 'yearly'
                    ? 'Billed annually at $99.99/yr'
                    : 'Billed monthly at $50.99/mo'}
                </Text>
              </View>

              <View style={styles.priceRight}>
                <Text style={styles.priceNumber}>
                  {billingCycle === 'yearly' ? '$99.99' : '$50.99'}
                </Text>
                <Text style={styles.pricePeriod}>
                  {billingCycle === 'yearly' ? '/year' : '/month'}
                </Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* Itemized Feature Checklist */}
            <View style={styles.checklist}>
              {CHECKLIST_ITEMS.map((item, idx) => (
                <View key={idx} style={styles.checkItem}>
                  <View style={styles.checkBadge}>
                    <Feather name="check" size={12} color="#FFFFFF" />
                  </View>
                  <View style={styles.checkTextCol}>
                    <Text style={styles.checkTitle}>{item.title}</Text>
                    <Text style={styles.checkDesc}>{item.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Trust Guarantees */}
          <View style={styles.guaranteeRow}>
            <Feather name="shield" size={14} color={colors.accent} style={styles.guaranteeIcon} />
            <Text style={styles.guaranteeText}>
              Cancel anytime in Settings. 7-day money-back guarantee.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Floating CTA Button */}
        <View style={styles.bottomBar}>
          <ShineButton
            title="Continue"
            size="lg"
            variant="primary"
            onPress={handleContinue}
            icon={<Feather name="arrow-right" size={18} color="#FFFFFF" />}
          />
        </View>
      </SafeAreaView>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  navIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(22, 18, 38, 0.8)',
    borderColor: 'rgba(46, 39, 76, 0.8)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trialStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(32, 22, 18, 0.9)',
    borderColor: 'rgba(255, 107, 0, 0.4)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  trialDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginRight: 6,
  },
  trialStatusText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerHero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  crownGlowWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  crownOuterGlow: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 107, 0, 0.25)',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
  },
  crownCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(32, 22, 18, 0.95)',
    borderColor: 'rgba(255, 136, 0, 0.6)',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(24, 18, 30, 0.85)',
    borderColor: 'rgba(46, 34, 24, 0.8)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    position: 'relative',
  },
  segmentTabActive: {
    backgroundColor: 'rgba(46, 34, 24, 0.95)',
    borderColor: colors.primary,
    borderWidth: 1,
  },
  segmentTabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  segmentTabTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: 8,
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bestValueText: {
    color: colors.textPrimary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pricingCard: {
    backgroundColor: 'rgba(24, 18, 30, 0.88)',
    borderColor: 'rgba(255, 107, 0, 0.35)',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  planSub: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  priceRight: {
    alignItems: 'flex-end',
  },
  priceNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.accent,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  pricePeriod: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(46, 39, 76, 0.6)',
    marginVertical: 16,
  },
  checklist: {
    gap: 14,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkTextCol: {
    flex: 1,
  },
  checkTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  checkDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  guaranteeIcon: {
    marginRight: 6,
  },
  guaranteeText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
});
