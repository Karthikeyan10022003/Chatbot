// =============================================================================
// CHAT MODELS & INTERFACES
// =============================================================================

import { TaskAction } from './task.types';

// Message Types
export type MessageType = 'user' | 'agent' | 'system';

// Message Object
export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: string; // ISO datetime string
}

// WebSocket Connection Status
export type ChatStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

// WebSocket Message Types
export type WebSocketMessageType = 'chat' | 'task_update' | 'error';

// WebSocket Message Object
export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
}

// AI Agent Response
export interface AgentResponse {
  response: string;
  actions?: TaskAction[];
}