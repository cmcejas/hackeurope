import { useCallback } from 'react';
import { Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';

export function useHealthCheckPermissions() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, requestLocationPermission] =
    Location.useForegroundPermissions();
  const [audioPermission, requestAudioPermission] = Audio.usePermissions();

  const requestAll = useCallback(async (): Promise<boolean> => {
    try {
      if (cameraPermission !== null && !cameraPermission.granted) {
        const result = await requestCameraPermission();
        if (result && !result.granted) {
          Alert.alert('Permission needed', 'Camera access is required for eye analysis.');
          return false;
        }
      }
      if (audioPermission !== null && !audioPermission.granted) {
        const result = await requestAudioPermission();
        if (result && !result.granted) {
          Alert.alert('Permission needed', 'Microphone access is required for voice recording.');
          return false;
        }
      }
      if (locationPermission !== null && !locationPermission.granted) {
        const result = await requestLocationPermission();
        if (result && !result.granted) {
          Alert.alert('Permission needed', 'Location is used to fetch local pollen data.');
          return false;
        }
      }
      return true;
    } catch (err) {
      console.warn('Permission error:', err);
      return true;
    }
  }, [
    cameraPermission,
    requestCameraPermission,
    audioPermission,
    requestAudioPermission,
    locationPermission,
    requestLocationPermission,
  ]);

  return {
    cameraPermission,
    requestAll,
  };
}
