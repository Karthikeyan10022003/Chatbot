// =============================================================================
// THEME VIEWMODEL - Dark Mode & UI Preferences
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { LOCAL_STORAGE_KEYS, THEME_SETTINGS } from '../lib/constants';

interface ThemeViewModelState {
  isDark: boolean;
  isLoading: boolean;
}

interface ThemeViewModelActions {
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
  resetTheme: () => void;
}

export type ThemeViewModel = ThemeViewModelState & ThemeViewModelActions;

export const useThemeViewModel = (): ThemeViewModel => {
  const [state, setState] = useState<ThemeViewModelState>({
    isDark: false,
    isLoading: true
  });

  // Check if user prefers dark mode
  const checkUserColorScheme = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    
    // Check local storage first
    const storedTheme = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME);
    
    if (storedTheme === THEME_SETTINGS.DARK) return true;
    if (storedTheme === THEME_SETTINGS.LIGHT) return false;
    
    // If not set, use system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);
  
  // Toggle between light and dark mode
  const toggleTheme = useCallback(() => {
    const newIsDark = !state.isDark;
    
    // Update DOM
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Update state
    setState(prev => ({ ...prev, isDark: newIsDark }));
    
    // Save preference
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.THEME,
      newIsDark ? THEME_SETTINGS.DARK : THEME_SETTINGS.LIGHT
    );
  }, [state.isDark]);
  
  // Set to specific theme
  const setTheme = useCallback((isDark: boolean) => {
    // Update DOM
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Update state
    setState(prev => ({ ...prev, isDark }));
    
    // Save preference
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.THEME,
      isDark ? THEME_SETTINGS.DARK : THEME_SETTINGS.LIGHT
    );
  }, []);
  
  // Reset to system preference
  const resetTheme = useCallback(() => {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Update DOM
    if (systemPrefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Update state
    setState(prev => ({ ...prev, isDark: systemPrefersDark }));
    
    // Remove saved preference
    localStorage.removeItem(LOCAL_STORAGE_KEYS.THEME);
  }, []);
  
  // Initialize theme on component mount
  useEffect(() => {
    const prefersDark = checkUserColorScheme();
    
    // Update DOM
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Update state
    setState({
      isDark: prefersDark,
      isLoading: false
    });
    
    // Listen for system preference changes if no saved preference
    const storedTheme = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME);
    
    if (!storedTheme) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        setTheme(e.matches);
      };
      
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleChange);
      }
      
      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange);
        } else {
          // Fallback for older browsers
          mediaQuery.removeListener(handleChange);
        }
      };
    }
  }, [checkUserColorScheme, setTheme]);
  
  return {
    // State
    isDark: state.isDark,
    isLoading: state.isLoading,
    
    // Actions
    toggleTheme,
    setTheme,
    resetTheme
  };
};