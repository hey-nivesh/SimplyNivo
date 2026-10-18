import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlowBackground } from '../components/GlowBackground';
import { NetworkToast } from '../components/NetworkToast';
import { ASYNC_STORAGE_TONE_KEY, PersonaSelector } from '../components/PersonaSelector';
import { ShineButton } from '../components/ShineButton';
import { VisualizerOrb } from '../components/VisualizerOrb';
import { colors } from '../constants/colors';
import { useAudioPermissions } from '../hooks/useAudioPermissions';
import { useSimplyNivo } from '../hooks/useSimplyNivo';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { PreferredTone } from '../types/database';

interface ToneItem {
  id: PreferredTone;
  label: string;
  sub: string;
}

const TONES: ToneItem[] = [
  { id: 'simplest', label: 'Plain & Simple', sub: 'Zero Jargon' },
  { id: 'executive', label: 'Executive', sub: 'Action-Driven' },
  { id: 'empathetic', label: 'Empathetic', sub: 'Emotional EQ' },
];

const PRESETS = [
  {
    title: 'Corporate Synergy',
    text: 'We need to leverage our synergies to ensure bandwidth alignment before circle-back Friday.',
  },
  {
    title: 'Unrealistic Deadline',
    text: 'Per my previous email, as noted in the roadmap, please ensure this is prioritized immediately.',
  },
  {
    title: 'Technical Jargon',
    text: 'Our microservices architecture requires idempotent retry primitives to prevent eventual consistency degradation.',
  },
];

function formatDuration(millis: number): string {
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function CompanionScreen() {
  const router = useRouter();
  const [inputText, setInputText] = useState<string>('');
  const [selectedTone, setSelectedTone] = useState<PreferredTone>('simplest');
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [isPersonaModalVisible, setIsPersonaModalVisible] = useState<boolean>(false);
  const [contextMessage, setContextMessage] = useState<string>(
    "Go ahead, I'm listening... Speak naturally or enter text below."
  );

  const {
    processSituation,
    speakOutput,
    stopSpeech,
    loading,
    output,
    structuredOutput,
    error,
    isSpeaking,
    isColdStartWarming,
    isOfflineFallback,
    reset,
  } = useSimplyNivo();

  // Load persisted tone preference on mount
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(ASYNC_STORAGE_TONE_KEY)
      .then((savedTone) => {
        if (
          mounted &&
          savedTone &&
          (savedTone === 'simplest' || savedTone === 'executive' || savedTone === 'empathetic')
        ) {
          setSelectedTone(savedTone as PreferredTone);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const { hasPermission, requestPermissions } = useAudioPermissions();

  const {
    isRecording,
    durationMillis,
    meteringLevel,
    startRecording,
    stopRecording,
  } = useVoiceRecorder();

  // Voice recording toggle with actual expo-av audio capture & metering
  const handleToggleVoice = async () => {
    if (isSpeaking) {
      stopSpeech();
      return;
    }

    if (isRecording) {
      setContextMessage('Finalizing audio & translating situation...');
      const audioUri = await stopRecording();

      const situationInput =
        inputText.trim() ||
        'We need to touch base and synergize our bandwidth before circle-back Friday.';

      const res = await processSituation(
        { text: situationInput, audioUri: audioUri ?? undefined },
        selectedTone,
        { autoSpeak: true }
      );
      if (res) {
        setContextMessage('Here is your zero-buzzword clarity translation.');
      }
    } else {
      reset();
      if (hasPermission === false) {
        const granted = await requestPermissions();
        if (!granted) {
          setContextMessage('Please enable microphone access in settings to speak.');
          return;
        }
      }
      const started = await startRecording();
      if (started) {
        setContextMessage("Listening... Speak your situation plainly. I'm decoding in real-time.");
      } else {
        setContextMessage('Please enable microphone access in settings to speak.');
      }
    }
  };

  const handleApplyPreset = (presetText: string) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    setInputText(presetText);
    reset();
    setContextMessage('Sample situation loaded. Tap "Simplify Situation" or speak.');
  };

  const handleTranslateText = async () => {
    if (!inputText.trim()) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setContextMessage('Translating with zero buzzwords...');
    const res = await processSituation(inputText, selectedTone, { autoSpeak: false });
    if (res) {
      setContextMessage('Translation ready. Tap "Listen to Speech" to hear pronunciation.');
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    await Clipboard.setStringAsync(output);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    setCopiedSuccess(true);
    setTimeout(() => {
      setCopiedSuccess(false);
    }, 2000);
  };

  // Determine active visualizer mode
  const orbMode = isSpeaking
    ? 'speaking'
    : isRecording
      ? 'listening'
      : loading
        ? 'processing'
        : 'idle';

  const displayedContextMessage = error
    ? 'Notice: Offline fallback engaged with instant preview.'
    : contextMessage;

  return (
    <GlowBackground glowPosition="both">
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        {/* Cold-Start & Offline Alert Banner */}
        <NetworkToast
          visible={isColdStartWarming || isOfflineFallback}
          type={isColdStartWarming ? 'warming' : 'offline'}
          message={
            isColdStartWarming
              ? 'AI server is warming up (free-tier cold start). Please allow 5-10 seconds.'
              : 'Offline preview mode active. Using instant local AI engine.'
          }
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top Navigation & Status Bar */}
            <View style={styles.topHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={16} color={colors.accent} style={styles.backIcon} />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <View style={styles.statusPill}>
                <View
                  style={[
                    styles.statusDot,
                    (isRecording || isSpeaking) && styles.statusDotActive,
                    loading && styles.statusDotProcessing,
                  ]}
                />
                <Text style={styles.statusPillText}>
                  {isRecording
                    ? `RECORDING ${formatDuration(durationMillis)}`
                    : isSpeaking
                      ? 'SPEAKING'
                      : loading
                        ? 'PROCESSING'
                        : 'COMPANION ACTIVE'}
                </Text>
              </View>
            </View>

            {/* Screen Title */}
            <View style={styles.titleSection}>
              <Text style={styles.mainHeading}>Speaking to SimplyNivo</Text>
              <Text style={styles.subHeading}>
                Real-time vocal feedback & humanized communication studio
              </Text>
            </View>

            {/* Centered Holographic Visualizer Orb with Live Metering */}
            <View style={styles.visualizerContainer}>
              <VisualizerOrb
                isActive={isRecording || isSpeaking || loading}
                mode={orbMode}
                meteringLevel={isRecording ? meteringLevel : isSpeaking ? 0.45 : 0}
              />
            </View>

            {/* Floating Dynamic Context Box */}
            <View style={styles.contextCard}>
              <View style={styles.contextHeader}>
                <View style={styles.contextTagRow}>
                  <Feather name="zap" size={12} color={colors.accent} style={styles.tagIcon} />
                  <Text style={styles.contextTag}>COMPANION ASSIST</Text>
                </View>

                {isSpeaking && (
                  <View style={styles.soundIndicator}>
                    <Ionicons name="volume-high" size={12} color={colors.accent} style={styles.soundIcon} />
                    <Text style={styles.soundText}>Playing Voice</Text>
                  </View>
                )}
              </View>
              <Text style={styles.contextPromptText}>{displayedContextMessage}</Text>
            </View>

            {/* Tone Selector Pills & Persona Customization */}
            <View style={styles.toneContainer}>
              <View style={styles.toneHeaderRow}>
                <Text style={styles.sectionLabel}>CONVERSATION TONE</Text>
                <TouchableOpacity
                  style={styles.tunePersonaButton}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.selectionAsync().catch(() => {});
                    }
                    setIsPersonaModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Feather name="sliders" size={12} color={colors.accent} />
                  <Text style={styles.tunePersonaText}>Tune Persona</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.tonePillRow}>
                {TONES.map((t) => {
                  const active = selectedTone === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.tonePill, active && styles.tonePillActive]}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.selectionAsync().catch(() => {});
                        }
                        setSelectedTone(t.id);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.toneTitle, active && styles.toneTitleActive]}>
                        {t.label}
                      </Text>
                      <Text style={[styles.toneSub, active && styles.toneSubActive]}>
                        {t.sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Glowing Concentric Record Trigger */}
            <View style={styles.micTriggerWrapper}>
              {/* Concentric Neon Rings */}
              {isRecording && (
                <>
                  <View style={styles.concentricPulseOuter} />
                  <View style={styles.concentricPulseInner} />
                </>
              )}

              <ShineButton
                title={
                  isSpeaking
                    ? 'Stop Audio Playback'
                    : isRecording
                      ? `Stop Recording (${formatDuration(durationMillis)})`
                      : 'Hold to Speak / Rehearse'
                }
                variant={isRecording ? 'accent' : 'primary'}
                size="lg"
                onPress={handleToggleVoice}
                style={styles.micButton}
                icon={
                  <Ionicons
                    name={isSpeaking ? 'stop' : isRecording ? 'stop-circle' : 'mic'}
                    size={20}
                    color="#FFFFFF"
                  />
                }
              />
            </View>

            {/* Presets Chips */}
            <View style={styles.presetsSection}>
              <Text style={styles.sectionLabel}>QUICK SITUATION SAMPLES</Text>
              <View style={styles.presetsRow}>
                {PRESETS.map((p) => (
                  <TouchableOpacity
                    key={p.title}
                    style={styles.presetChip}
                    onPress={() => handleApplyPreset(p.text)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.presetChipText}>{p.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Manual Situation Input Card */}
            <View style={styles.inputCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.inputCardTitle}>Custom Situation or Raw Text</Text>
                {inputText.length > 0 && (
                  <TouchableOpacity onPress={() => { setInputText(''); reset(); }}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={3}
                placeholder="Type or paste confusing memo, passive-aggressive Slack, or conflict..."
                placeholderTextColor={colors.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                textAlignVertical="top"
              />

              <View style={styles.inputActionRow}>
                <Text style={styles.charLabel}>{inputText.length} chars</Text>
                <ShineButton
                  title={loading ? 'Translating...' : 'Simplify Situation'}
                  size="sm"
                  variant="primary"
                  loading={loading}
                  disabled={!inputText.trim() || loading}
                  onPress={handleTranslateText}
                  icon={<Feather name="check" size={14} color="#FFFFFF" />}
                />
              </View>
            </View>

            {/* Structured Output Display Card */}
            {output && (
              <View style={styles.outputBox}>
                <View style={styles.outputBoxHeader}>
                  <View style={styles.outputBadge}>
                    <Text style={styles.outputBadgeText}>ZERO-BUZZWORD RESULT</Text>
                  </View>

                  <View style={styles.outputActionRow}>
                    <TouchableOpacity
                      style={styles.iconActionBtn}
                      onPress={handleCopy}
                      activeOpacity={0.75}
                    >
                      <Feather
                        name={copiedSuccess ? 'check' : 'copy'}
                        size={14}
                        color={copiedSuccess ? '#10B981' : colors.accent}
                      />
                      <Text style={[styles.iconActionText, copiedSuccess && styles.iconActionTextSuccess]}>
                        {copiedSuccess ? 'Copied' : 'Copy'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.ttsButton, isSpeaking && styles.ttsButtonActive]}
                      onPress={() => (isSpeaking ? stopSpeech() : speakOutput(output))}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isSpeaking ? 'stop' : 'volume-high-outline'}
                        size={14}
                        color={isSpeaking ? '#EF4444' : colors.accent}
                        style={styles.ttsIcon}
                      />
                      <Text style={[styles.ttsButtonText, isSpeaking && styles.ttsButtonTextActive]}>
                        {isSpeaking ? 'Stop' : 'Listen'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {structuredOutput ? (
                  <View style={styles.structuredContainer}>
                    <View style={styles.structuredSection}>
                      <Text style={styles.structuredLabel}>CORE POINT</Text>
                      <Text style={styles.corePointText}>{structuredOutput.corePoint}</Text>
                    </View>

                    <View style={styles.structuredSection}>
                      <Text style={styles.structuredLabel}>WHAT TO SAY OUT LOUD</Text>
                      <View style={styles.quoteCard}>
                        <Text style={styles.quoteText}>{`"${structuredOutput.outLoudPhrasing}"`}</Text>
                      </View>
                    </View>

                    {structuredOutput.bulletPoints.length > 0 && (
                      <View style={styles.structuredSection}>
                        <Text style={styles.structuredLabel}>TAKEAWAYS</Text>
                        {structuredOutput.bulletPoints.map((pt, idx) => (
                          <View key={idx} style={styles.bulletRow}>
                            <Feather name="chevron-right" size={13} color={colors.accent} style={styles.bulletIcon} />
                            <Text style={styles.bulletText}>{pt}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={styles.outputResultText}>{output}</Text>
                )}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Interactive Persona Customization Modal */}
      <PersonaSelector
        visible={isPersonaModalVisible}
        currentTone={selectedTone}
        onSelectTone={(tone) => setSelectedTone(tone)}
        onClose={() => setIsPersonaModalVisible(false)}
      />
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 84, // accommodates translucent navigation header
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 18, 38, 0.75)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  backIcon: {
    marginRight: 4,
  },
  backButtonText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 18, 38, 0.85)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981', // green idle
    marginRight: 6,
  },
  statusDotActive: {
    backgroundColor: '#EF4444', // red active
  },
  statusDotProcessing: {
    backgroundColor: colors.accent,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  subHeading: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  visualizerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    height: 250,
  },
  contextCard: {
    backgroundColor: 'rgba(22, 18, 38, 0.88)',
    borderColor: 'rgba(155, 81, 224, 0.3)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#9B51E0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  contextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  contextTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagIcon: {
    marginRight: 5,
  },
  contextTag: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1.2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  soundIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#261642',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  soundIcon: {
    marginRight: 4,
  },
  soundText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
  },
  contextPromptText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  toneContainer: {
    marginBottom: 20,
  },
  toneHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tunePersonaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(155, 81, 224, 0.12)',
    borderColor: 'rgba(155, 81, 224, 0.3)',
    borderWidth: 1,
  },
  tunePersonaText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  tonePillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tonePill: {
    flex: 1,
    backgroundColor: 'rgba(22, 18, 38, 0.75)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tonePillActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(155, 81, 224, 0.18)',
  },
  toneTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  toneTitleActive: {
    color: colors.textPrimary,
  },
  toneSub: {
    fontSize: 10,
    color: '#7B7788',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  toneSubActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  micTriggerWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  concentricPulseOuter: {
    position: 'absolute',
    width: '105%',
    height: 68,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(192, 125, 241, 0.45)',
  },
  concentricPulseInner: {
    position: 'absolute',
    width: '112%',
    height: 78,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(155, 81, 224, 0.25)',
  },
  micButton: {
    width: '100%',
  },
  presetsSection: {
    marginBottom: 20,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    backgroundColor: 'rgba(22, 18, 38, 0.8)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  presetChipText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  inputCard: {
    backgroundColor: 'rgba(22, 18, 38, 0.85)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  clearText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  textInput: {
    minHeight: 85,
    backgroundColor: 'rgba(10, 8, 19, 0.75)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  inputActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  outputBox: {
    backgroundColor: 'rgba(27, 20, 51, 0.95)',
    borderColor: colors.primary,
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  outputBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  outputBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  outputBadgeText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  outputActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 18, 38, 0.85)',
    borderColor: 'rgba(192, 125, 241, 0.35)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },
  iconActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  iconActionTextSuccess: {
    color: '#10B981',
  },
  ttsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(192, 125, 241, 0.18)',
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ttsButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#EF4444',
  },
  ttsIcon: {
    marginRight: 4,
  },
  ttsButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  ttsButtonTextActive: {
    color: '#EF4444',
  },
  structuredContainer: {
    gap: 12,
  },
  structuredSection: {
    gap: 4,
  },
  structuredLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 0.9,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  corePointText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  quoteCard: {
    backgroundColor: 'rgba(10, 8, 19, 0.65)',
    borderColor: 'rgba(155, 81, 224, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  quoteText: {
    color: '#EBD9FF',
    fontSize: 14,
    lineHeight: 21,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  bulletIcon: {
    marginTop: 3,
  },
  bulletText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  outputResultText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});
