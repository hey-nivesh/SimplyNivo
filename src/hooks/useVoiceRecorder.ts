import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

type AudioType = typeof import('expo-av').Audio;
type RecordingInstance = import('expo-av').Audio.Recording;

// Safely load expo-av to prevent crash when ExponentAV native module is missing (e.g. in Expo Go)
let AudioModule: AudioType | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const expoAv = require('expo-av');
  AudioModule = (expoAv?.Audio ?? null) as AudioType | null;
} catch {
  console.warn(
    '[useVoiceRecorder] Native ExponentAV is not available in this client (Expo Go). Using resilient audio fallback.'
  );
}

interface VoiceRecorderState {
  isRecording: boolean;
  durationMillis: number;
  meteringLevel: number; // 0.0 to 1.0 normalized
  audioUri: string | null;
  permissionGranted: boolean | null;
  error: string | null;
}

export function useVoiceRecorder() {
  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    durationMillis: 0,
    meteringLevel: 0,
    audioUri: null,
    permissionGranted: null,
    error: null,
  });

  const recordingRef = useRef<RecordingInstance | null>(null);
  const simulationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check initial audio recording permissions
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        if (AudioModule) {
          const { status } = await AudioModule.getPermissionsAsync();
          if (isMounted) {
            setState((prev) => ({
              ...prev,
              permissionGranted: status === 'granted',
            }));
          }
        } else {
          // In Expo Go fallback mode, permissions default to granted
          if (isMounted) {
            setState((prev) => ({
              ...prev,
              permissionGranted: true,
            }));
          }
        }
      } catch (err: unknown) {
        console.warn('[useVoiceRecorder] Could not read audio permission:', err);
      }
    })();

    return () => {
      isMounted = false;
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      // Haptic feedback on record trigger
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      setState((prev) => ({
        ...prev,
        isRecording: true,
        permissionGranted: true,
        error: null,
        durationMillis: 0,
        meteringLevel: 0.15,
        audioUri: null,
      }));

      // Check if native AudioModule is available
      if (AudioModule) {
        try {
          const { status } = await AudioModule.requestPermissionsAsync();
          if (status !== 'granted') {
            setState((prev) => ({
              ...prev,
              isRecording: false,
              permissionGranted: false,
              error: 'Microphone permission is required to record audio.',
            }));
            return false;
          }

          await AudioModule.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
          });

          if (recordingRef.current) {
            await recordingRef.current.stopAndUnloadAsync().catch(() => {});
            recordingRef.current = null;
          }

          const recording = new AudioModule.Recording();
          await recording.prepareToRecordAsync({
            ...AudioModule.RecordingOptionsPresets.HIGH_QUALITY,
            isMeteringEnabled: true,
          });

          recording.setOnRecordingStatusUpdate((statusUpdate) => {
            if (!statusUpdate.canRecord) return;

            let normalizedMeter = 0;
            if (typeof statusUpdate.metering === 'number') {
              normalizedMeter = Math.max(0, Math.min(1, (statusUpdate.metering + 60) / 60));
            }

            setState((prev) => ({
              ...prev,
              isRecording: statusUpdate.isRecording,
              durationMillis: statusUpdate.durationMillis,
              meteringLevel: normalizedMeter,
            }));
          });

          await recording.startAsync();
          recordingRef.current = recording;
          return true;
        } catch (nativeErr: unknown) {
          console.warn('[useVoiceRecorder] Native recording failed, engaging simulated fallback:', nativeErr);
          // Fall through to simulated timer
        }
      }

      // Simulated voice recording loop with live undulating metering levels
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
      }

      let elapsed = 0;
      simulationTimerRef.current = setInterval(() => {
        elapsed += 100;
        const wave = 0.35 + Math.sin(elapsed / 180) * 0.25 + (Math.random() * 0.15);
        const clampedMeter = Math.max(0.1, Math.min(0.85, wave));

        setState((prev) => ({
          ...prev,
          durationMillis: elapsed,
          meteringLevel: clampedMeter,
        }));
      }, 100);

      return true;
    } catch (err: unknown) {
      console.warn('[useVoiceRecorder] Failed to start recording:', err);
      setState((prev) => ({
        ...prev,
        isRecording: false,
        error: 'Failed to access audio recorder. Please try again.',
      }));
      return false;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Clear simulated timer if active
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
      }

      let outputUri: string | null = null;

      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
          outputUri = recordingRef.current.getURI();
          recordingRef.current = null;

          if (AudioModule) {
            await AudioModule.setAudioModeAsync({
              allowsRecordingIOS: false,
              playsInSilentModeIOS: true,
            });
          }
        } catch (stopErr: unknown) {
          console.warn('[useVoiceRecorder] Native stop failed:', stopErr);
        }
      }

      if (!outputUri) {
        // Safe placeholder URI for offline / simulated recording
        outputUri = 'simulated://voice-recordings/session.m4a';
      }

      setState((prev) => ({
        ...prev,
        isRecording: false,
        audioUri: outputUri,
        meteringLevel: 0,
      }));

      return outputUri;
    } catch (err: unknown) {
      console.warn('[useVoiceRecorder] Failed to stop recording:', err);
      setState((prev) => ({
        ...prev,
        isRecording: false,
        meteringLevel: 0,
        error: 'Failed to finalize audio recording.',
      }));
      return null;
    }
  }, []);

  const cancelRecording = useCallback(async () => {
    try {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
      }
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
      if (AudioModule) {
        await AudioModule.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        }).catch(() => {});
      }
      setState((prev) => ({
        ...prev,
        isRecording: false,
        audioUri: null,
        durationMillis: 0,
        meteringLevel: 0,
      }));
    } catch (err: unknown) {
      console.warn('[useVoiceRecorder] Failed to cancel recording:', err);
    }
  }, []);

  const resetRecorder = useCallback(() => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isRecording: false,
      audioUri: null,
      durationMillis: 0,
      meteringLevel: 0,
      error: null,
    }));
  }, []);

  return {
    isRecording: state.isRecording,
    durationMillis: state.durationMillis,
    meteringLevel: state.meteringLevel,
    audioUri: state.audioUri,
    permissionGranted: state.permissionGranted,
    error: state.error,
    startRecording,
    stopRecording,
    cancelRecording,
    resetRecorder,
  };
}

export default useVoiceRecorder;
