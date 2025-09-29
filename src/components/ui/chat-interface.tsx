// =============================================================================
// CHAT INTERFACE COMPONENT - AI Agent Interaction
// =============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { useChatViewModel } from '../../viewmodels/useChatViewModel';
import { useTaskViewModel } from '../../viewmodels/useTaskViewModel';
import { ChatMessage } from '../../models/chat.types';
import { cn, formatTime, getRelativeTime } from '../../lib/utils';

interface ChatInterfaceProps {
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ className }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // View Models
  const {
    messages,
    isProcessing,
    connectionStatus,
    error,
    sendMessage,
    clearMessages,
    clearError,
    reconnect
  } = useChatViewModel();
  
  const { refreshTasks } = useTaskViewModel();

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isProcessing) return;
    
    try {
      await sendMessage(message, (action) => {
        // Refresh task list after any agent action
        console.log('Task action received:', action);
        refreshTasks();
      });
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Auto-resize textarea as user types
  const autoResizeTextarea = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input field on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Chat Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            AI Assistant
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chat with me to manage your tasks
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Connection Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
            <div className={cn(
              'w-2 h-2 rounded-full',
              connectionStatus === 'connected' 
                ? 'bg-green-500 animate-pulse' 
                : connectionStatus === 'connecting'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-red-500'
            )} />
            <span className="text-gray-700 dark:text-gray-300">
              {connectionStatus === 'connected' 
                ? 'Connected' 
                : connectionStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Disconnected'}
            </span>
          </div>
          
          {/* Action Buttons */}
          <button
            onClick={clearMessages}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Clear chat history"
            aria-label="Clear chat history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          {(connectionStatus === 'disconnected' || connectionStatus === 'error') && (
            <button
              onClick={reconnect}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Reconnect"
              aria-label="Reconnect"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Error Banner (if any) */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 m-4 mb-0 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={clearError}
                  className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-800/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <ChatMessageBubble key={msg.id} message={msg} />
        ))}
        
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
        
        {/* Typing indicator when processing */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">AI is thinking...</span>
          </div>
        )}
      </div>
      
      {/* Chat Input */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                autoResizeTextarea();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Type a message..."
              className={cn(
                "w-full resize-none overflow-hidden",
                "min-h-[40px] max-h-[120px] py-2 px-3 rounded-lg",
                "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              )}
              disabled={isProcessing}
              rows={1}
            />
          </div>
          
          <button
            type="submit"
            disabled={!message.trim() || isProcessing}
            className={cn(
              "p-2 rounded-lg transition-colors",
              "text-white bg-blue-500",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              message.trim() && !isProcessing 
                ? "hover:bg-blue-600 active:bg-blue-700" 
                : ""
            )}
            title="Send message"
            aria-label="Send message"
          >
            <SendHorizontal className="w-5 h-5" />
          </button>
        </form>
        
        <div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
          <p>Try saying "Add a task to buy groceries tomorrow"</p>
        </div>
      </div>
    </div>
  );
};

// Chat Message Bubble Component
const ChatMessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';
  
  if (isSystem) {
    // System message (notifications)
    return (
      <div className="flex justify-center">
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn(
      "flex",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-2 break-words",
        isUser 
          ? "bg-blue-500 text-white rounded-tr-none" 
          : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-none"
      )}>
        <div className="whitespace-pre-wrap">{message.content}</div>
        <div className={cn(
          "text-xs mt-1",
          isUser ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
        )}>
          {getRelativeTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};