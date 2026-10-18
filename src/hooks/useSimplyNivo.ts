import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { API_CONFIG } from '../constants/config';
import { supabase } from '../lib/supabase';
import { PreferredTone } from '../types/database';

export type CompanionStatus =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'completed'
  | 'error';

export interface StructuredSimplification {
  corePoint: string;
  outLoudPhrasing: string;
  bulletPoints: string[];
  rawCombined: string;
}

interface SimplyNivoState {
  loading: boolean;
  output: string | null;
  structuredOutput: StructuredSimplification | null;
  error: string | null;
  status: CompanionStatus;
  isSpeaking: boolean;
  isColdStartWarming: boolean;
  isOfflineFallback: boolean;
}

interface ProcessSituationOptions {
  category?: string;
  timeoutMs?: number;
  autoSpeak?: boolean;
}

interface SimplyNivoResponse {
  output?: string;
  simplified?: string;
  result?: string;
  corePoint?: string;
  outLoudPhrasing?: string;
  bulletPoints?: string[];
  data?: {
    corePoint?: string;
    spokenPhrasing?: string;
    talkingPoints?: string[];
  };
  error?: string;
}

const DEFAULT_BACKEND_URL = API_CONFIG.BASE_URL.replace(/\/$/, '');
const DEFAULT_TIMEOUT_MS = API_CONFIG.TIMEOUT;

/**
 * Parses raw text output into structured components (Core Point, Out Loud, Bullet Points)
 */
function parseStructuredOutput(text: string): StructuredSimplification {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  let corePoint = '';
  let outLoudPhrasing = '';
  const bulletPoints: string[] = [];

  for (const line of lines) {
    if (line.startsWith('•') || line.startsWith('-') || /^\d+\./.test(line)) {
      bulletPoints.push(line.replace(/^[•\-\d.]\s*/, ''));
    } else if (!corePoint && !line.includes(':')) {
      corePoint = line;
    } else if (line.toLowerCase().includes('words:') || line.toLowerCase().includes('translation:') || line.toLowerCase().includes('bottom line:')) {
      continue;
    } else if (!outLoudPhrasing) {
      outLoudPhrasing = line.replace(/^"/, '').replace(/"$/, '');
    }
  }

  if (!corePoint) corePoint = lines[0] ?? text;
  if (!outLoudPhrasing) outLoudPhrasing = lines[1] ?? corePoint;
  if (bulletPoints.length === 0) {
    bulletPoints.push('Keep conversation direct and jargon-free.');
    bulletPoints.push('State requested decision or next step clearly.');
  }

  return {
    corePoint,
    outLoudPhrasing,
    bulletPoints,
    rawCombined: text,
  };
}

/**
 * Curated scenario mock dictionary for offline instant translation
 */
const SCENARIO_DICTIONARY: Record<string, Record<PreferredTone, string>> = {
  synergy: {
    simplest:
      'In Plain Words:\nLet us combine our work so we do not repeat the same tasks and save everyone time.\n\nWhat to say out loud:\n"Let’s team up on this so we can finish twice as fast without repeating work."\n• Combine overlapping research documents.\n• Share one unified status update with the team.',
    executive:
      'Bottom Line:\nCross-team consolidation yields 30% overhead reduction. Align deliverables for Q3 milestone.\n\nWhat to say out loud:\n"Let’s merge these workstreams under one owner to hit our target deliverable on schedule."\n• Establish single point of ownership.\n• Reallocate freed engineer hours to critical path.',
    empathetic:
      'Humanized Translation:\n"Everyone has been working hard in silos. If we collaborate, nobody has to feel isolated or overwhelmed."\n\nWhat to say out loud:\n"I see how hard everyone is working on this. Let’s join forces so none of us are carrying this alone."\n• Acknowledge individual effort first.\n• Distribute the remaining backlog fairly.',
  },
  touchbase: {
    simplest:
      'In Plain Words:\nLet us have a quick 5-minute chat to check in before Friday.\n\nWhat to say out loud:\n"Do you have 5 minutes today for a quick status check?"\n• Keep it under 5 minutes.\n• Confirm current priorities.',
    executive:
      'Bottom Line:\nSchedule a 10-minute sync. Confirm status, identify blockers, and approve pending action items.\n\nWhat to say out loud:\n"Let’s run a 10-minute sync to clear blockers and approve next steps."\n• Review blocker sheet.\n• Obtain sign-off on open decisions.',
    empathetic:
      'Humanized Translation:\n"I value staying in sync with you so you don’t feel stressed by surprise deadlines."\n\nWhat to say out loud:\n"Just checking in to make sure you have everything you need and aren’t feeling stuck."\n• Ask if they need assistance.\n• Reassure timeline flexibility if possible.',
  },
  bandwidth: {
    simplest:
      'In Plain Words:\nI am already full with work right now and cannot take on anything extra without dropping something else.\n\nWhat to say out loud:\n"My schedule is completely full right now. Which existing task should I pause to take this on?"\n• Clearly state current commitments.\n• Ask manager to prioritize trade-offs.',
    executive:
      'Bottom Line:\nCurrent capacity is at 100%. Reassign lower-priority items before onboarding new work streams.\n\nWhat to say out loud:\n"Taking on this new initiative requires deprioritizing Sprint Item #4."\n• Quantify capacity limits in hours.\n• Request formal priority ranking.',
    empathetic:
      'Humanized Translation:\n"I care about doing great quality work for the team, and taking on more right now would burn me out."\n\nWhat to say out loud:\n"I really want to give this the attention it deserves, but right now I don’t have the time to do it well."\n• Affirm commitment to excellence.\n• Protect personal work-life boundaries calmly.',
  },
};

/**
 * Intelligent local fallback simplification when Render proxy backend
 * is experiencing cold starts or timeout issues.
 */
function generateSmartSimplification(rawText: string, tone: PreferredTone = 'simplest'): string {
  const lower = rawText.toLowerCase();

  for (const [keyword, mappings] of Object.entries(SCENARIO_DICTIONARY)) {
    if (lower.includes(keyword)) {
      return mappings[tone];
    }
  }

  const cleaned = rawText
    .replace(/\b(literally|basically|to be honest|synergy|circle back|bandwidth|leverage|utilize|paradigm|unpack)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  switch (tone) {
    case 'executive':
      return `Bottom Line:\n${cleaned}\n\nWhat to say out loud:\n"Let's align on immediate next steps and confirm deliverables by end of day."\n• Eliminate unnecessary meeting overhead.\n• Establish explicit milestone accountability.`;
    case 'empathetic':
      return `Humanized Translation:\n"${cleaned}"\n\nWhat to say out loud:\n"I understand why this feels overwhelming. Let's talk through what will make you feel supported."\n• Validate their emotional perspective first.\n• Clarify the mutual path forward together.`;
    case 'simplest':
    default:
      return `In Simple Words:\n${cleaned}\n\nWhat to say out loud:\n"Let's keep this simple and direct: here is what needs to happen next."\n• Drop all industry jargon.\n• State the core thought in one sentence.`;
  }
}

export function useSimplyNivo() {
  const [state, setState] = useState<SimplyNivoState>({
    loading: false,
    output: null,
    structuredOutput: null,
    error: null,
    status: 'idle',
    isSpeaking: false,
    isColdStartWarming: false,
    isOfflineFallback: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const stopSpeech = useCallback(() => {
    try {
      Speech.stop();
    } catch {
      // safe fallback on platforms without speech synthesis
    }
    setState((prev) => ({ ...prev, isSpeaking: false, status: 'idle' }));
  }, []);

  const speakOutput = useCallback(
    (textToSpeak?: string) => {
      const target = textToSpeak ?? state.output;
      if (!target) return;

      try {
        Speech.stop();
        setState((prev) => ({ ...prev, isSpeaking: true, status: 'speaking' }));

        if (Platform.OS !== 'web') {
          Haptics.selectionAsync().catch(() => {});
        }

        Speech.speak(target, {
          rate: 0.95,
          pitch: 1.0,
          onDone: () => {
            setState((prev) => ({ ...prev, isSpeaking: false, status: 'completed' }));
          },
          onStopped: () => {
            setState((prev) => ({ ...prev, isSpeaking: false, status: 'idle' }));
          },
          onError: () => {
            setState((prev) => ({ ...prev, isSpeaking: false }));
          },
        });
      } catch (e) {
        console.warn('[SimplyNivo TTS] Speech synthesis unavailable:', e);
        setState((prev) => ({ ...prev, isSpeaking: false }));
      }
    },
    [state.output]
  );

  const processSituation = useCallback(
    async (
      input: string | { text?: string; audioUri?: string },
      tone: PreferredTone = 'simplest',
      options?: ProcessSituationOptions
    ): Promise<string | null> => {
      const rawText = typeof input === 'string' ? input : (input.text ?? '');
      const audioUri = typeof input === 'object' ? input.audioUri : undefined;

      if (!rawText.trim() && !audioUri) {
        setState((prev) => ({
          ...prev,
          loading: false,
          output: null,
          structuredOutput: null,
          error: 'Please provide a situation or audio recording to simplify.',
          status: 'error',
          isColdStartWarming: false,
        }));
        return null;
      }

      // Transition to processing state
      setState((prev) => ({
        ...prev,
        loading: true,
        output: null,
        structuredOutput: null,
        error: null,
        status: 'processing',
        isColdStartWarming: false,
        isOfflineFallback: false,
      }));

      // Cold start detection: If request takes > 3 seconds, flag warming indicator
      const coldStartTimer = setTimeout(() => {
        setState((prev) => {
          if (prev.loading) {
            return { ...prev, isColdStartWarming: true };
          }
          return prev;
        });
      }, 3000);

      let finalOutput: string | null = null;
      let finalError: string | null = null;
      let wasOfflineFallback = false;

      const maxAttempts = 3;
      const retryDelays = [3000, 5000];

      try {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        const attemptController = new AbortController();
        abortControllerRef.current = attemptController;

        const attemptTimeoutMs = options?.timeoutMs ?? (attempt === 0 ? DEFAULT_TIMEOUT_MS : 20000);
        const attemptTimeoutId = setTimeout(() => {
          attemptController.abort();
        }, attemptTimeoutMs);

        try {
          const response = await fetch(`${DEFAULT_BACKEND_URL}${API_CONFIG.ENDPOINTS.SIMPLIFY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              situation: rawText.trim() || 'Audio voice recording conversation',
              text: rawText.trim() || 'Audio voice recording conversation',
              audioUri,
              tone,
              category: options?.category ?? 'general',
            }),
            signal: attemptController.signal,
          });

          clearTimeout(attemptTimeoutId);

          if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
          }

          const data = (await response.json()) as SimplyNivoResponse;
          finalOutput =
            data.simplified ??
            data.output ??
            data.result ??
            (data.data
              ? `${data.data.corePoint}\n\n"${data.data.spokenPhrasing}"\n${(data.data.talkingPoints || []).map((p) => `• ${p}`).join('\n')}`
              : null);

          if (!finalOutput) {
            throw new Error(data.error ?? 'Received empty response from server.');
          }

          // Successful response obtained, break retry loop
          wasOfflineFallback = false;
          break;
        } catch (attemptErr: unknown) {
          clearTimeout(attemptTimeoutId);
          console.warn(`[SimplyNivo API] Attempt ${attempt + 1}/${maxAttempts} failed:`, attemptErr);

          if (attempt < maxAttempts - 1) {
            const delay = retryDelays[attempt] ?? 3000;
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            // All attempts exhausted, engage local fallback mode
            wasOfflineFallback = true;
            finalOutput = generateSmartSimplification(rawText || 'meeting discussion', tone);
            finalError = 'Warming up SimplyNivo AI Engine (First launch may take a few seconds)...';
          }
        }
      }
    } finally {
        clearTimeout(coldStartTimer);
        const parsed = finalOutput ? parseStructuredOutput(finalOutput) : null;

        // Auto-save to Supabase if session exists
        if (finalOutput) {
          try {
            const {
              data: { session },
            } = await supabase.auth.getSession();

            if (session?.user) {
              await supabase.from('conversations').insert([
                {
                  user_id: session.user.id,
                  original_situation: rawText.trim() || 'Voice conversation input',
                  simplified_phrasing: finalOutput,
                  category: options?.category ?? tone,
                },
              ]);
            }
          } catch (dbError: unknown) {
            console.warn('[SimplyNivo] Supabase auto-save skipped:', dbError);
          }
        }

        // Haptic feedback on completion
        if (Platform.OS !== 'web' && finalOutput) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }

        const shouldAutoSpeak = options?.autoSpeak ?? false;
        if (shouldAutoSpeak && finalOutput) {
          speakOutput(finalOutput);
        }

        setState({
          loading: false,
          output: finalOutput,
          structuredOutput: parsed,
          error: finalError,
          status: shouldAutoSpeak ? 'speaking' : 'completed',
          isSpeaking: shouldAutoSpeak,
          isColdStartWarming: false,
          isOfflineFallback: wasOfflineFallback,
        });
      }

      return finalOutput;
    },
    [speakOutput]
  );

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    stopSpeech();
    setState({
      loading: false,
      output: null,
      structuredOutput: null,
      error: null,
      status: 'idle',
      isSpeaking: false,
      isColdStartWarming: false,
      isOfflineFallback: false,
    });
  }, [stopSpeech]);

  return {
    processSituation,
    speakOutput,
    speakText: speakOutput, // backwards-compatible alias
    stopSpeech,
    loading: state.loading,
    output: state.output,
    structuredOutput: state.structuredOutput,
    error: state.error,
    status: state.status,
    isSpeaking: state.isSpeaking,
    isColdStartWarming: state.isColdStartWarming,
    isOfflineFallback: state.isOfflineFallback,
    reset,
  };
}

export default useSimplyNivo;
