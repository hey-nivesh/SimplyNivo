import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../constants/colors';
import { supabase } from '../lib/supabase';
import { PreferredTone } from '../types/database';
import { ShineButton } from './ShineButton';

export const ASYNC_STORAGE_TONE_KEY = '@simplynivo_preferred_tone';

export interface PersonaOption {
  id: PreferredTone;
  title: string;
  tagline: string;
  description: string;
  iconName: keyof typeof Feather.glyphMap;
  accentColor: string;
}

export const PERSONA_MODES: PersonaOption[] = [
  {
    id: 'simplest',
    title: '5th Grade Simplest',
    tagline: 'Zero buzzwords, crystal-clear plain talk',
    description:
      'Strips all corporate filler, buzzwords, and ambiguity. Explains concepts so anyone can instantly understand.',
    iconName: 'zap',
    accentColor: colors.accent,
  },
  {
    id: 'executive',
    title: 'Executive Pitch',
    tagline: 'Concise, high-impact strategic takeaways',
    description:
      'Distills meetings and proposals to the bottom-line ROI, explicit next steps, and decision points for leadership.',
    iconName: 'briefcase',
    accentColor: '#38BDF8',
  },
  {
    id: 'empathetic',
    title: 'Empathetic & Calm',
    tagline: 'Gentle boundaries, high emotional intelligence',
    description:
      'Translates passive aggression or tense situations with warm, de-escalating phrasing while upholding boundaries.',
    iconName: 'heart',
    accentColor: '#F472B6',
  },
];

interface PersonaSelectorProps {
  visible: boolean;
  currentTone: PreferredTone;
  onSelectTone: (tone: PreferredTone) => void;
  onClose: () => void;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  visible,
  currentTone,
  onSelectTone,
  onClose,
}) => {
  const [selected, setSelected] = useState<PreferredTone>(currentTone);
  const [saving, setSaving] = useState<boolean>(false);

  const handleSelect = (tone: PreferredTone) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    setSelected(tone);
  };

  const handleApply = async () => {
    try {
      setSaving(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }

      // 1. Persist locally to AsyncStorage
      await AsyncStorage.setItem(ASYNC_STORAGE_TONE_KEY, selected);

      // 2. Sync to Supabase user profile if authenticated
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await supabase.from('profiles').upsert({
          id: session.user.id,
          preferred_tone: selected,
          updated_at: new Date().toISOString(),
        });
      }

      onSelectTone(selected);
      onClose();
    } catch (err: unknown) {
      console.warn('[PersonaSelector] Failed to persist preferred tone:', err);
      onSelectTone(selected);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Top Drag Handle & Header */}
          <View style={styles.header}>
            <View style={styles.dragHandle} />
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.sheetTitle}>Persona Tuning</Text>
                <Text style={styles.sheetSubtitle}>
                  Customize how SimplyNivo reformulates your thoughts
                </Text>
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Persona Mode Cards */}
          <View style={styles.cardList}>
            {PERSONA_MODES.map((mode) => {
              const isSelected = selected === mode.id;
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={[styles.personaCard, isSelected && styles.personaCardActive]}
                  onPress={() => handleSelect(mode.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardTopRow}>
                    <View
                      style={[
                        styles.iconCircle,
                        { borderColor: mode.accentColor, backgroundColor: `${mode.accentColor}1A` },
                      ]}
                    >
                      <Feather name={mode.iconName} size={18} color={mode.accentColor} />
                    </View>

                    <View style={styles.titleCol}>
                      <Text style={styles.modeTitle}>{mode.title}</Text>
                      <Text style={styles.modeTagline}>{mode.tagline}</Text>
                    </View>

                    <View
                      style={[
                        styles.radioIndicator,
                        isSelected && styles.radioIndicatorSelected,
                      ]}
                    >
                      {isSelected && <Feather name="check" size={13} color="#FFFFFF" />}
                    </View>
                  </View>

                  <Text style={styles.modeDescription}>{mode.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bottom CTA Action */}
          <View style={styles.ctaWrapper}>
            <ShineButton
              title={saving ? 'Applying...' : 'Apply Persona'}
              size="lg"
              variant="primary"
              loading={saving}
              onPress={handleApply}
              icon={<Feather name="check" size={18} color="#FFFFFF" />}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 1, 8, 0.82)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#161226',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(155, 81, 224, 0.45)',
    paddingBottom: 36,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 39, 76, 0.6)',
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(160, 156, 171, 0.4)',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  sheetSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(10, 8, 19, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardList: {
    padding: 24,
    gap: 12,
  },
  personaCard: {
    backgroundColor: 'rgba(10, 8, 19, 0.7)',
    borderColor: 'rgba(46, 39, 76, 0.8)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  personaCardActive: {
    backgroundColor: 'rgba(27, 20, 51, 0.95)',
    borderColor: colors.primary,
    borderWidth: 1.5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleCol: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  modeTagline: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  radioIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(160, 156, 171, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioIndicatorSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  ctaWrapper: {
    paddingHorizontal: 24,
  },
});

export default PersonaSelector;
