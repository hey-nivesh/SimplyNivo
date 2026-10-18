import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';

type AudioType = typeof import('expo-av').Audio;

// Safely load expo-av to prevent crash when ExponentAV native module is missing (e.g. in Expo Go on Android)
let AudioModule: AudioType | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const expoAv = require('expo-av');
  AudioModule = (expoAv?.Audio ?? null) as AudioType | null;
} catch {
  console.warn(
    '[useAudioPermissions] Native ExponentAV is not available in this client (Expo Go). Using resilient fallback.'
  );
}

export interface UseAudioPermissionsResult {
  hasPermission: boolean | null;
  isAudioModeConfigured: boolean;
  requestPermissions: () => Promise<boolean>;
}

/**
 * Custom hook to request hardware microphone permissions and configure
 * the audio session to enforce output through the main device speaker.
 * Safely guards against missing native ExponentAV module in Expo Go.
 */
export const useAudioPermissions = (): UseAudioPermissionsResult => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isAudioModeConfigured, setIsAudioModeConfigured] = useState<boolean>(false);

  // Configure Audio Session for High Performance Speaker Output
  const configureAudioSession = useCallback(async (): Promise<void> => {
    if (!AudioModule) {
      setIsAudioModeConfigured(true);
      return;
    }

    try {
      await AudioModule.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true, // Guarantees speech output even in iOS silent mode
        staysActiveInBackground: false,
        interruptionModeIOS: 1, // DoNotMix
        shouldDuckAndroid: true,
        interruptionModeAndroid: 1, // DoNotMix
        playThroughEarpieceAndroid: false, // Enforces loud main speaker output
      });
      setIsAudioModeConfigured(true);
    } catch (error) {
      console.warn('[useAudioPermissions] Error configuring audio session:', error);
    }
  }, []);

  // Request Runtime Microphone Permission with alert fallback
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web' || !AudioModule) {
        setHasPermission(true);
        setIsAudioModeConfigured(true);
        return true;
      }

      const { status: existingStatus } = await AudioModule.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await AudioModule.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Microphone Permission Required',
          'SimplyNivo needs access to your microphone so you can speak your situations directly to your companion.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                Linking.openSettings().catch(() => {});
              },
            },
          ]
        );
        setHasPermission(false);
        return false;
      }

      setHasPermission(true);
      await configureAudioSession();
      return true;
    } catch (error) {
      console.warn('[useAudioPermissions] Audio module permission check:', error);
      // In development environments / Expo Go without native AV, allow app to proceed gracefully
      setHasPermission(true);
      return true;
    }
  }, [configureAudioSession]);

  // On mount, inspect existing permission silently without intrusive alert
  useEffect(() => {
    let isMounted = true;

    const checkExistingPermission = async () => {
      if (Platform.OS === 'web' || !AudioModule) {
        if (isMounted) {
          setHasPermission(true);
          setIsAudioModeConfigured(true);
        }
        return;
      }

      try {
        const { status } = await AudioModule.getPermissionsAsync();
        if (isMounted) {
          const granted = status === 'granted';
          setHasPermission(granted);
          if (granted) {
            configureAudioSession().catch(() => {});
          }
        }
      } catch {
        if (isMounted) setHasPermission(true);
      }
    };

    checkExistingPermission();

    return () => {
      isMounted = false;
    };
  }, [configureAudioSession]);

  return { hasPermission, isAudioModeConfigured, requestPermissions };
};

export default useAudioPermissions;
