/**
 * Haptic feedback utility for mobile devices
 */

export const haptics = {
  /**
   * Light impact - for UI selections
   */
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  
  /**
   * Medium impact - for successful actions
   */
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  
  /**
   * Heavy impact - for important actions
   */
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  },
  
  /**
   * Success pattern - for winning or completing actions
   */
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 20, 10, 20, 10]);
    }
  },
  
  /**
   * Warning pattern - for errors or invalid actions
   */
  warning: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
  },
  
  /**
   * Custom pattern
   */
  custom: (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  },
  
  /**
   * Check if haptics are supported
   */
  isSupported: () => {
    return 'vibrate' in navigator;
  },
};