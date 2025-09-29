// =============================================================================
// MAIN LAYOUT COMPONENT - Two-Pane Layout
// =============================================================================

import React, { useState } from 'react';
import { Bot, CheckCircle2 } from 'lucide-react';
import { useThemeViewModel } from '../../viewmodels/useThemeViewModel';
import { ChatInterface } from '../ui/chat-interface';
import { TaskList } from '../ui/task-list';
import { ThemeToggle } from '../ui/theme-toggle';
import { cn } from '../../lib/utils';

export const MainLayout: React.FC = () => {
  const { isDark } = useThemeViewModel();

  return (
    <div className={cn(
      'min-h-screen transition-colors',
      isDark ? 'dark bg-gray-900' : 'bg-gray-50'
    )}>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  AI Task Manager
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Powered by LangGraph & Gemini AI
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Connected
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Content - Two Pane Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop: Side by Side */}
          <div className="hidden lg:flex flex-1">
            {/* Chat Interface - Left Pane */}
            <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <ChatInterface />
            </div>
            
            {/* Task List - Right Pane */}
            <div className="w-1/2 bg-gray-50 dark:bg-gray-900">
              <TaskList />
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden flex-1 bg-white dark:bg-gray-800">
            <MobileLayout />
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile Layout Component
const MobileLayout: React.FC = () => {
  const [activeView, setActiveView] = useState<'chat' | 'tasks'>('chat');

  return (
    <div className="h-full flex flex-col">
      {/* Mobile Tab Navigation */}
      <div className="flex-shrink-0 flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={() => setActiveView('chat')}
          className={cn(
            'flex-1 py-3 px-4 text-sm font-medium border-b-2 flex items-center justify-center gap-2',
            activeView === 'chat'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          )}
        >
          <Bot className="w-4 h-4" />
          AI Chat
        </button>
        <button
          onClick={() => setActiveView('tasks')}
          className={cn(
            'flex-1 py-3 px-4 text-sm font-medium border-b-2 flex items-center justify-center gap-2',
            activeView === 'tasks'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          )}
        >
          <CheckCircle2 className="w-4 h-4" />
          My Tasks
        </button>
      </div>

      {/* Mobile Content */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'chat' ? (
          <ChatInterface className="bg-white dark:bg-gray-800" />
        ) : (
          <TaskList className="bg-gray-50 dark:bg-gray-900" />
        )}
      </div>
    </div>
  );
};