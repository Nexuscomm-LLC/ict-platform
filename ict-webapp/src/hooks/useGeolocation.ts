import { useState, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  isLoading: boolean;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isLoading: false,
  });

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return Promise.reject(new Error('Geolocation not supported'));
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            error: null,
            isLoading: false,
          });
          resolve(position);
        },
        (error) => {
          const errorMessage =
            error.code === 1 ? 'Permission denied' :
            error.code === 2 ? 'Position unavailable' :
            error.code === 3 ? 'Request timeout' : 'Unknown error';
          setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }, []);

  return { ...state, getCurrentPosition };
};
