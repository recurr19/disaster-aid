/**
 * Utility functions for network monitoring
 */

import { NETWORK_THRESHOLDS } from './constants';

/**
 * Measure network strength via latency
 */
export const measureNetworkStrength = async () => {
  if (!navigator.onLine) {
    return { isOffline: true, strength: 0 };
  }

  try {
    const startTime = performance.now();
    
    await fetch('https://dns.google/resolve?name=example.com', {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache'
    });

    const endTime = performance.now();
    const latency = endTime - startTime;

    let strength;
    if (latency < 100) {
      strength = 100;
    } else if (latency < 300) {
      strength = 70 + Math.round((300 - latency) / 200 * 30);
    } else if (latency < 600) {
      strength = 40 + Math.round((600 - latency) / 300 * 30);
    } else if (latency < 1000) {
      strength = 20 + Math.round((1000 - latency) / 400 * 20);
    } else {
      strength = Math.max(1, 20 - Math.round((latency - 1000) / 200));
    }

    return { 
      isOffline: false, 
      strength: Math.min(100, Math.max(0, strength)),
      latency 
    };
  } catch (error) {
    // Fallback to connection API
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection && connection.downlink) {
      const downlink = connection.downlink;
      let strength;
      if (downlink >= 10) strength = 100;
      else if (downlink >= 5) strength = 80;
      else if (downlink >= 2) strength = 60;
      else if (downlink >= 1) strength = 40;
      else if (downlink >= 0.5) strength = 20;
      else strength = 10;
      
      return { isOffline: false, strength, downlink };
    }
    
    return { isOffline: false, strength: 50 }; // Unknown, assume medium
  }
};

/**
 * Get network status color
 */
export const getNetworkColor = (strength, isOffline) => {
  if (isOffline || strength === 0) return 'text-red-500';
  if (strength < 30) return 'text-orange-500';
  if (strength < 70) return 'text-yellow-500';
  return 'text-green-500';
};

/**
 * Get network status label
 */
export const getNetworkLabel = (strength, isOffline) => {
  if (isOffline || strength === 0) return 'Offline';
  if (strength >= NETWORK_THRESHOLDS.EXCELLENT) return 'Excellent';
  if (strength >= NETWORK_THRESHOLDS.GOOD) return 'Good';
  if (strength >= NETWORK_THRESHOLDS.FAIR) return 'Fair';
  if (strength >= NETWORK_THRESHOLDS.POOR) return 'Poor';
  return 'Very Poor';
};

/**
 * Check if network is weak
 */
export const isWeakNetwork = (strength) => {
  return strength < NETWORK_THRESHOLDS.POOR;
};
