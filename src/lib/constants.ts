// =============================================================================
// CONSTANTS & DEFAULT VALUES
// =============================================================================

// API Endpoints
export const API_ENDPOINTS = {
  // Task-related endpoints
  TASKS: '/api/tasks',
  TASK_STATS: '/api/tasks/stats',
  
  // Chat & Agent endpoints
  CHAT: '/api/chat',
  
  // WebSocket endpoint
  WS: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/chat',
};

// Default Messages
export const DEFAULT_MESSAGES = {
  WELCOME: "👋 Hello! I'm your AI task assistant. How can I help you today? You can ask me to create, update, list, or delete tasks for you.",
  ERROR: "I'm sorry, there was an error processing your request. Please try again.",
  CONNECTION_ERROR: "Connection error. The server may be unavailable. Please try again later.",
  EMPTY_TASKS: "You don't have any tasks yet. Would you like me to create one for you?",
};

// Task Defaults
export const TASK_DEFAULTS = {
  PRIORITY: 'medium' as const,
  STATUS: 'active' as const,
};

// Local Storage Keys
export const LOCAL_STORAGE_KEYS = {
  THEME: 'ai-task-manager-theme',
  USER_PREFERENCES: 'ai-task-manager-preferences',
};

// Theme Settings
export const THEME_SETTINGS = {
  DARK: 'dark',
  LIGHT: 'light',
  SYSTEM: 'system',
};