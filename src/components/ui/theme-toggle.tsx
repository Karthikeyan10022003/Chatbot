// =============================================================================
// THEME TOGGLE COMPONENT - Dark/Light Mode Toggle
// =============================================================================

import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeViewModel } from '../../viewmodels/useThemeViewModel';
import { cn } from '../../lib/utils';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  showLabel = false
}) => {
  const { isDark, isLoading, toggleTheme, setTheme, resetTheme } = useThemeViewModel();

  if (isLoading) {
    return (
      <div className={cn(
        'p-2 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse',
        className
      )}>
        <div className="w-4 h-4" />
      </div>
    );
  }

  return (
    <div className="relative group">
      <button
        onClick={toggleTheme}
        className={cn(
          'p-2 rounded-lg transition-all duration-200',
          'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
          'hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200',
          'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
          'active:scale-95',
          className
        )}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <div className="relative w-4 h-4">
          <Sun 
            className={cn(
              'absolute inset-0 transition-all duration-200',
              isDark 
                ? 'opacity-0 rotate-90 scale-75' 
                : 'opacity-100 rotate-0 scale-100'
            )} 
          />
          <Moon 
            className={cn(
              'absolute inset-0 transition-all duration-200',
              isDark 
                ? 'opacity-100 rotate-0 scale-100' 
                : 'opacity-0 -rotate-90 scale-75'
            )} 
          />
        </div>
      </button>

      {showLabel && (
        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {isDark ? 'Dark' : 'Light'} mode
        </span>
      )}

      {/* Advanced Theme Options (Hidden by default, could be shown on long press/right click) */}
      <div className="absolute top-full right-0 mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[120px]">
          <button
            onClick={() => setTheme(false)}
            className={cn(
              'w-full px-3 py-2 text-left text-sm flex items-center gap-2',
              'hover:bg-gray-100 dark:hover:bg-gray-700',
              'text-gray-700 dark:text-gray-300',
              !isDark && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
            )}
          >
            <Sun className="w-3 h-3" />
            Light
          </button>
          <button
            onClick={() => setTheme(true)}
            className={cn(
              'w-full px-3 py-2 text-left text-sm flex items-center gap-2',
              'hover:bg-gray-100 dark:hover:bg-gray-700',
              'text-gray-700 dark:text-gray-300',
              isDark && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
            )}
          >
            <Moon className="w-3 h-3" />
            Dark
          </button>
          <button
            onClick={resetTheme}
            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            <Monitor className="w-3 h-3" />
            System
          </button>
        </div>
      </div>
    </div>
  );
};