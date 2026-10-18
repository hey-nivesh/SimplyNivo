import { Feather, Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  RefreshControl,
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
import { useSimplyNivo } from '../hooks/useSimplyNivo';
import { supabase } from '../lib/supabase';
import { ConversationRecord } from '../types/database';

const SAMPLE_HISTORY: ConversationRecord[] = [
  {
    id: 'demo-1',
    user_id: 'guest',
    original_situation:
      'We need to circle back and synergize our quarterly KPIs before end of week to ensure bandwidth alignment.',
    simplified_phrasing:
      'In Plain Words:\nLet us combine our work so we do not repeat the same tasks and save everyone time.\n\nWhat to say out loud:\n"Let’s team up on this so we can finish twice as fast without repeating work."\n• Combine overlapping research documents.\n• Share one unified status update with the team.',
    category: 'simplest',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'demo-2',
    user_id: 'guest',
    original_situation:
      'As per my previous email, the deliverables remain blocked pending approval.',
    simplified_phrasing:
      'Humanized Translation:\n"I am feeling frustrated that we are delayed. Could you please give approval so we can move forward?"\n\nWhat to say out loud:\n"I value our progress and want to unblock the team as soon as you have a moment."\n• Validate current workload constraints.\n• Request prioritized confirmation.',
    category: 'empathetic',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'demo-3',
    user_id: 'guest',
    original_situation:
      'Our microservices architecture requires idempotent retry primitives to prevent eventual consistency degradation.',
    simplified_phrasing:
      'Bottom Line:\nImplement safe request retries so server failures don’t duplicate data or break system state.\n\nWhat to say out loud:\n"We need to add standard retry logic so our payment service stays reliable during network hiccups."\n• Implement retry middleware.\n• Verify idempotency keys.',
    category: 'executive',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

type CategoryFilter = 'all' | 'simplest' | 'executive' | 'empathetic';

function getCategoryIcon(cat: string): { name: keyof typeof Feather.glyphMap; label: string } {
  switch (cat.toLowerCase()) {
    case 'empathetic':
      return { name: 'heart', label: 'Empathetic' };
    case 'executive':
      return { name: 'code', label: 'Executive' };
    case 'simplest':
    default:
      return { name: 'briefcase', label: 'Plain Talk' };
  }
}

export default function HistoryScreen() {
  const [conversations, setConversations] = useState<ConversationRecord[]>(SAMPLE_HISTORY);
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<ConversationRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { speakOutput, stopSpeech, isSpeaking } = useSimplyNivo();

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && active) {
          const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0 && active) {
            setConversations(data as ConversationRecord[]);
          }
        }
      } catch (err: unknown) {
        console.warn('[History] Could not fetch records:', err);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setConversations(data as ConversationRecord[]);
        }
      }
    } catch (err: unknown) {
      console.warn('[History] Could not refresh records:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTogglePlay = (item: ConversationRecord) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    if (isSpeaking && activeSpeechId === item.id) {
      stopSpeech();
      setActiveSpeechId(null);
    } else {
      setActiveSpeechId(item.id);
      speakOutput(item.simplified_phrasing);
    }
  };

  const handleCopyRecord = async (item: ConversationRecord) => {
    await Clipboard.setStringAsync(item.simplified_phrasing);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    setCopiedId(item.id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === item.id ? null : prev));
    }, 2000);
  };

  const filteredList =
    filter === 'all'
      ? conversations
      : conversations.filter((item) => item.category.toLowerCase() === filter);

  const formatDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <GlowBackground glowPosition="bottom">
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={styles.container}>
          {/* Category Filter Pills */}
          <View style={styles.filterRow}>
            {(['all', 'simplest', 'executive', 'empathetic'] as CategoryFilter[]).map((tab) => {
              const active = filter === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.selectionAsync().catch(() => {});
                    }
                    setFilter(tab);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Conversations List */}
          <FlatList
            data={filteredList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.accent}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={44} color={colors.textSecondary} style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>No saved records yet</Text>
                <Text style={styles.emptySubtitle}>
                  Conversations you translate in Companion Studio will automatically persist here.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isCurrentPlaying = isSpeaking && activeSpeechId === item.id;
              const isCopied = copiedId === item.id;
              const catIcon = getCategoryIcon(item.category);

              return (
                <TouchableOpacity
                  style={styles.historyCard}
                  activeOpacity={0.88}
                  onPress={() => setSelectedRecord(item)}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.categoryBadge}>
                      <Feather name={catIcon.name} size={11} color={colors.accent} style={styles.badgeIcon} />
                      <Text style={styles.categoryBadgeText}>
                        {catIcon.label.toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.cardTopRight}>
                      <Text style={styles.timestampText}>{formatDate(item.created_at)}</Text>
                    </View>
                  </View>

                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionLabel}>ORIGINAL SITUATION</Text>
                    <Text style={styles.originalText} numberOfLines={2}>
                      {item.original_situation}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionLabelSimplified}>SIMPLIFIED TRANSLATION</Text>
                    <Text style={styles.simplifiedText} numberOfLines={3}>
                      {item.simplified_phrasing}
                    </Text>
                  </View>

                  {/* Action Row */}
                  <View style={styles.cardActionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, isCopied && styles.actionBtnSuccess]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleCopyRecord(item);
                      }}
                      activeOpacity={0.75}
                    >
                      <Feather
                        name={isCopied ? 'check' : 'copy'}
                        size={13}
                        color={isCopied ? '#10B981' : colors.accent}
                        style={styles.btnIconSpacing}
                      />
                      <Text style={[styles.actionBtnText, isCopied && styles.actionBtnTextSuccess]}>
                        {isCopied ? 'Copied' : 'Copy'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, isCurrentPlaying && styles.actionBtnPlaying]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleTogglePlay(item);
                      }}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name={isCurrentPlaying ? 'stop' : 'volume-high-outline'}
                        size={14}
                        color={isCurrentPlaying ? '#EF4444' : colors.accent}
                        style={styles.btnIconSpacing}
                      />
                      <Text
                        style={[
                          styles.actionBtnText,
                          isCurrentPlaying && styles.actionBtnTextPlaying,
                        ]}
                      >
                        {isCurrentPlaying ? 'Stop' : 'Listen'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          {/* Full Phrasing Detail Modal Drawer */}
          <Modal
            visible={!!selectedRecord}
            transparent
            animationType="slide"
            onRequestClose={() => setSelectedRecord(null)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalDragHandle} />
                  <View style={styles.modalHeaderRow}>
                    <Text style={styles.modalTitle}>Conversation Detail</Text>
                    <TouchableOpacity
                      style={styles.modalCloseBtn}
                      onPress={() => setSelectedRecord(null)}
                    >
                      <Ionicons name="close" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {selectedRecord && (
                  <ScrollView
                    contentContainerStyle={styles.modalContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>ORIGINAL SITUATION</Text>
                      <View style={styles.modalCardMuted}>
                        <Text style={styles.modalOriginalText}>
                          {selectedRecord.original_situation}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>SIMPLIFIED CLARITY PHRASING</Text>
                      <View style={styles.modalCardHighlight}>
                        <Text style={styles.modalSimplifiedText}>
                          {selectedRecord.simplified_phrasing}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalActions}>
                      <ShineButton
                        title={
                          isSpeaking && activeSpeechId === selectedRecord.id
                            ? 'Stop Audio'
                            : 'Listen to Voice Audio'
                        }
                        size="md"
                        variant="primary"
                        onPress={() => handleTogglePlay(selectedRecord)}
                        icon={
                          <Ionicons
                            name={
                              isSpeaking && activeSpeechId === selectedRecord.id
                                ? 'stop'
                                : 'volume-high-outline'
                            }
                            size={18}
                            color="#FFFFFF"
                          />
                        }
                      />

                      <TouchableOpacity
                        style={styles.modalCopyBtn}
                        onPress={() => handleCopyRecord(selectedRecord)}
                        activeOpacity={0.8}
                      >
                        <Feather
                          name={copiedId === selectedRecord.id ? 'check' : 'copy'}
                          size={15}
                          color={colors.accent}
                          style={styles.btnIconSpacing}
                        />
                        <Text style={styles.modalCopyBtnText}>
                          {copiedId === selectedRecord.id ? 'Copied to Clipboard' : 'Copy Phrasing'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </GlowBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 84, // translucent header offset
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: 'rgba(22, 18, 38, 0.8)',
    borderColor: 'rgba(46, 39, 76, 0.8)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(155, 81, 224, 0.22)',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  filterChipTextActive: {
    color: colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    gap: 14,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  historyCard: {
    backgroundColor: 'rgba(22, 18, 38, 0.85)',
    borderColor: 'rgba(46, 39, 76, 0.8)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#9B51E0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(155, 81, 224, 0.18)',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeIcon: {
    marginRight: 4,
  },
  categoryBadgeText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  cardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestampText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  sectionBlock: {
    marginVertical: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  originalText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(46, 39, 76, 0.6)',
    marginVertical: 10,
  },
  sectionLabelSimplified: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 0.8,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  simplifiedText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 21,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(27, 20, 51, 0.9)',
    borderColor: 'rgba(192, 125, 241, 0.35)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  actionBtnSuccess: {
    borderColor: '#10B981',
  },
  actionBtnPlaying: {
    borderColor: '#EF4444',
  },
  btnIconSpacing: {
    marginRight: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  actionBtnTextSuccess: {
    color: '#10B981',
  },
  actionBtnTextPlaying: {
    color: '#EF4444',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 1, 8, 0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#161226',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(155, 81, 224, 0.4)',
    maxHeight: '85%',
    paddingBottom: 36,
  },
  modalHeader: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 39, 76, 0.6)',
    alignItems: 'center',
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(160, 156, 171, 0.4)',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalContent: {
    padding: 24,
    gap: 18,
  },
  modalSection: {
    gap: 6,
  },
  modalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  modalCardMuted: {
    backgroundColor: 'rgba(10, 8, 19, 0.7)',
    borderColor: 'rgba(46, 39, 76, 0.7)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  modalOriginalText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  modalCardHighlight: {
    backgroundColor: 'rgba(27, 20, 51, 0.95)',
    borderColor: 'rgba(155, 81, 224, 0.4)',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
  },
  modalSimplifiedText: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  modalActions: {
    gap: 12,
    marginTop: 8,
  },
  modalCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(22, 18, 38, 0.85)',
    borderColor: 'rgba(155, 81, 224, 0.4)',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
  },
  modalCopyBtnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});
