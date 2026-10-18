import { Audio } from 'expo-av';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';

export interface UseAudioPermissionsResult {
  hasPermission: boolean | null;
  isAudioModeConfigured: boolean;
  requestPermissions: () => Promise<boolean>;
}

/**
 * Custom hook to request hardware microphone permissions and configure
 * the audio session to enforce output through the main device speaker.
 */
export const useAudioPermissions = (): UseAudioPermissionsResult => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isAudioModeConfigured, setIsAudioModeConfigured] = useState<boolean>(false);

  // Configure Audio Session for High Performance Speaker Output
  const configureAudioSession = useCallback(async (): Promise<void> => {
    try {
      await Audio.setAudioModeAsync({
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
      if (Platform.OS === 'web') {
        setHasPermission(true);
        return true;
      }

      const { status: existingStatus } = await Audio.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Audio.requestPermissionsAsync();
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
      setHasPermission(false);
      return false;
    }
  }, [configureAudioSession]);

  // On mount, inspect existing permission silently without intrusive alert
  useEffect(() => {
    let isMounted = true;

    const checkExistingPermission = async () => {
      if (Platform.OS === 'web') {
        if (isMounted) setHasPermission(true);
        return;
      }

      try {
        const { status } = await Audio.getPermissionsAsync();
        if (isMounted) {
          const granted = status === 'granted';
          setHasPermission(granted);
          if (granted) {
            configureAudioSession().catch(() => {});
          }
        }
      } catch {
        if (isMounted) setHasPermission(false);
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
