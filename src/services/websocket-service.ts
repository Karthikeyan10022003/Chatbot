// =============================================================================
// WEBSOCKET SERVICE - Real-time Communication with AI Agent Backend
// =============================================================================

import { API_ENDPOINTS } from '../lib/constants';
import { ChatStatus, WebSocketMessage } from '../models/chat.types';

type MessageCallback = (message: WebSocketMessage) => void;
type StatusCallback = (status: ChatStatus) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private messageListeners: MessageCallback[] = [];
  private statusListeners: StatusCallback[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private status: ChatStatus = 'disconnected';
  private isManualDisconnect: boolean = false;

  // Check if WebSocket is connected
  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // Connect to WebSocket server
  public connect(): void {
    // Don't connect if we're already connected/connecting
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    // Create new WebSocket connection
    try {
      this.updateStatus('connecting');
      
      this.ws = new WebSocket(API_ENDPOINTS.WS);
      
      // Set up event listeners
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.updateStatus('error');
    }
  }

  // Disconnect from WebSocket server
  public disconnect(): void {
    this.isManualDisconnect = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.updateStatus('disconnected');
  }

  // Send message to server
  public sendMessage(content: string): void {
    if (!this.isConnected()) {
      console.error('WebSocket is not connected');
      this.updateStatus('error');
      this.tryReconnect();
      return;
    }

    try {
      // Format message according to backend expectations
      this.ws!.send(JSON.stringify({ message: content }));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      this.updateStatus('error');
    }
  }

  // Register message listener
  public onMessage(callback: MessageCallback): () => void {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(cb => cb !== callback);
    };
  }

  // Register status listener
  public onStatusChange(callback: StatusCallback): () => void {
    this.statusListeners.push(callback);
    
    // Immediately call with current status
    callback(this.status);
    
    return () => {
      this.statusListeners = this.statusListeners.filter(cb => cb !== callback);
    };
  }

  // Handle WebSocket open event
  private handleOpen(event: Event): void {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
    this.isManualDisconnect = false;
    this.updateStatus('connected');
  }

  // Handle WebSocket message event
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as WebSocketMessage;
      console.log('WebSocket message received:', data);
      
      // Notify all listeners
      this.messageListeners.forEach(listener => {
        listener(data);
      });
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  // Handle WebSocket close event
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket closed:', event.code, event.reason);
    this.ws = null;

    if (!this.isManualDisconnect) {
      this.updateStatus('disconnected');
      this.tryReconnect();
    }
  }

  // Handle WebSocket error event
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.updateStatus('error');
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (!this.isManualDisconnect) {
      this.tryReconnect();
    }
  }

  // Try to reconnect to WebSocket server
  private tryReconnect(): void {
    if (this.isManualDisconnect || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;

    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Update connection status and notify listeners
  private updateStatus(status: ChatStatus): void {
    this.status = status;
    
    this.statusListeners.forEach(listener => {
      listener(status);
    });
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();