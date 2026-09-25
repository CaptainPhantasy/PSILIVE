// @ts-nocheck
/**
 * Live GPS Tracking Hook
 * Provides real-time location tracking with accuracy monitoring
 */

import { useState, useEffect, useCallback, useRef } from "react";

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: Date;
}

export interface LocationTrackingState {
  isTracking: boolean;
  currentLocation: LocationData | null;
  locations: LocationData[];
  error: string | null;
  permissionGranted: boolean | null;
  accuracy: "high" | "medium" | "low" | null;
}

interface UseLocationTrackingOptions {
  enableHighAccuracy?: boolean;
  maxAge?: number;
  timeout?: number;
  trackInterval?: number;
  maxLocations?: number;
  onLocationUpdate?: (location: LocationData) => void;
  onError?: (error: string) => void;
}

const DEFAULT_OPTIONS: UseLocationTrackingOptions = {
  enableHighAccuracy: true,
  maxAge: 30000, // 30 seconds
  timeout: 15000, // 15 seconds
  trackInterval: 10000, // 10 seconds
  maxLocations: 100,
};

export function useLocationTracking(options: UseLocationTrackingOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const watchIdRef = useRef<number | null>(null);

  const [state, setState] = useState<LocationTrackingState>({
    isTracking: false,
    currentLocation: null,
    locations: [],
    error: null,
    permissionGranted: null,
    accuracy: null,
  });

  // Check permission status
  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) {
      return null;
    }

    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      return result.state === "granted" ? true : result.state === "denied" ? false : null;
    } catch {
      return null;
    }
  }, []);

  // Get current position
  const getCurrentPosition = useCallback((): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: new Date(position.timestamp),
          });
        },
        (error) => {
          let errorMessage: string;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please enable GPS access.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Position unavailable. Check if GPS is enabled.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again.";
              break;
            default:
              errorMessage = `Unknown location error: ${error.message}`;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: config.enableHighAccuracy,
          maximumAge: config.maxAge,
          timeout: config.timeout,
        }
      );
    });
  }, [config]);

  // Start tracking
  const startTracking = useCallback(async () => {
    if (state.isTracking) return;

    // Check permission first
    const permission = await checkPermission();
    if (permission === false) {
      setState((prev) => ({
        ...prev,
        error: "Location permission denied. Please enable GPS access in settings.",
        permissionGranted: false,
      }));
      return;
    }

    try {
      // Get initial position
      const location = await getCurrentPosition();
      const accuracyLevel = getAccuracyLevel(location.accuracy);

      setState((prev) => ({
        ...prev,
        isTracking: true,
        currentLocation: location,
        locations: [location],
        error: null,
        permissionGranted: true,
        accuracy: accuracyLevel,
      }));

      config.onLocationUpdate?.(location);

      // Start continuous tracking
      watchIdRef.current = window.setInterval(async () => {
        try {
          const newLocation = await getCurrentPosition();
          const accuracyLevel = getAccuracyLevel(newLocation.accuracy);

          setState((prev) => {
            const newLocations = [...prev.locations, newLocation];
            // Keep only the last N locations
            if (newLocations.length > (config.maxLocations || 100)) {
              newLocations.shift();
            }

            config.onLocationUpdate?.(newLocation);

            return {
              ...prev,
              currentLocation: newLocation,
              locations: newLocations,
              accuracy: accuracyLevel,
              error: null,
            };
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Location update failed";
          setState((prev) => ({ ...prev, error: errorMessage }));
          config.onError?.(errorMessage);
        }
      }, config.trackInterval);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to start tracking";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isTracking: false,
      }));
      config.onError?.(errorMessage);
    }
  }, [state.isTracking, checkPermission, getCurrentPosition, config]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current) {
      clearInterval(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState((prev) => ({ ...prev, isTracking: false }));
  }, []);

  // Clear location history
  const clearLocations = useCallback(() => {
    setState((prev) => ({ ...prev, locations: [] }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        clearInterval(watchIdRef.current);
      }
    };
  }, []);

  // Calculate distance between two points
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Get total distance traveled
  const getTotalDistance = useCallback((): number => {
    if (state.locations.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < state.locations.length; i++) {
      const prev = state.locations[i - 1];
      const curr = state.locations[i];
      total += calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude
      );
    }
    return total;
  }, [state.locations, calculateDistance]);

  return {
    ...state,
    startTracking,
    stopTracking,
    clearLocations,
    getCurrentPosition,
    getTotalDistance,
    calculateDistance,
  };
}

function getAccuracyLevel(accuracy: number | null): "high" | "medium" | "low" {
  if (!accuracy) return null;
  if (accuracy < 10) return "high";
  if (accuracy < 50) return "medium";
  return "low";
}

// Check if location is near a target
export function isNearLocation(
  current: { latitude: number; longitude: number },
  target: { latitude: number; longitude: number },
  thresholdMeters: number = 100
): boolean {
  const R = 6371e3;
  const dLat = ((target.latitude - current.latitude) * Math.PI) / 180;
  const dLon = ((target.longitude - current.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((current.latitude * Math.PI) / 180) *
    Math.cos((target.latitude * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance <= thresholdMeters;
}

// Format coordinates for display
export function formatCoordinates(location: LocationData | null): string {
  if (!location) return "No location data";
  const latDir = location.latitude >= 0 ? "N" : "S";
  const lonDir = location.longitude >= 0 ? "E" : "W";
  const lat = Math.abs(location.latitude).toFixed(6);
  const lon = Math.abs(location.longitude).toFixed(6);
  return `${lat}° ${latDir}, ${lon}° ${lonDir}`;
}

// Format accuracy for display
export function formatAccuracy(accuracy: number | null): string {
  if (!accuracy) return "Unknown";
  if (accuracy < 10) return `±${accuracy.toFixed(0)}m (High)`;
  if (accuracy < 50) return `±${accuracy.toFixed(0)}m (Medium)`;
  return `±${accuracy.toFixed(0)}m (Low)`;
}
