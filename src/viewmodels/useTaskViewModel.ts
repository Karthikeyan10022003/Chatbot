// =============================================================================
// TASK VIEWMODEL - Business Logic & State Management
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/task-service';
import { 
  Task, 
  TaskCreate, 
  TaskUpdate, 
  TaskStats, 
  TaskFilters 
} from '../models/task.types';

interface TaskViewModelState {
  tasks: Task[];
  taskStats: TaskStats;
  isLoading: boolean;
  error: string | null;
}

interface TaskViewModelActions {
  refreshTasks: () => Promise<void>;
  createTask: (taskData: TaskCreate) => Promise<Task | null>;
  updateTask: (id: number, updates: TaskUpdate) => Promise<Task | null>;
  deleteTask: (id: number) => Promise<boolean>;
  toggleTaskStatus: (id: number) => Promise<Task | null>;
  filterTasks: (filters: TaskFilters) => Promise<void>;
  searchTasks: (query: string) => Promise<void>;
  clearError: () => void;
}

export type TaskViewModel = TaskViewModelState & TaskViewModelActions;

// Default stats structure
const defaultStats: TaskStats = {
  total: 0,
  active: 0,
  completed: 0,
  overdue: 0
};

export const useTaskViewModel = (): TaskViewModel => {
  const [state, setState] = useState<TaskViewModelState>({
    tasks: [],
    taskStats: { ...defaultStats },
    isLoading: true,
    error: null
  });

  // Fetch all tasks
  const refreshTasks = useCallback(async (filters?: TaskFilters) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('Refreshing tasks with filters:', filters);
      // Fetch tasks
      const tasksResponse = await taskService.getTasks(filters);
      
      if (!tasksResponse.success) {
        throw new Error(tasksResponse.message || 'Failed to fetch tasks');
      }
      
      // Fetch task stats
      const statsResponse = await taskService.getTaskStats();
      
      console.log('Fetched tasks:', tasksResponse.data.length);
      console.log('Task stats:', statsResponse.data);
      
      setState(prev => ({
        ...prev,
        tasks: tasksResponse.data,
        taskStats: statsResponse.success ? statsResponse.data : defaultStats,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch tasks',
        isLoading: false
      }));
    }
  }, []);
  
  // Create a new task
  const createTask = useCallback(async (taskData: TaskCreate): Promise<Task | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('Creating task:', taskData);
      const response = await taskService.createTask(taskData);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create task');
      }
      
      // Update local state
      setState(prev => ({
        ...prev,
        tasks: [response.data!, ...prev.tasks],
        isLoading: false
      }));
      
      // Refresh task stats
      await taskService.getTaskStats().then(res => {
        if (res.success) {
          setState(prev => ({ ...prev, taskStats: res.data }));
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create task',
        isLoading: false
      }));
      
      return null;
    }
  }, []);
  
  // Update an existing task
  const updateTask = useCallback(async (id: number, updates: TaskUpdate): Promise<Task | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('Updating task:', id, updates);
      const response = await taskService.updateTask(id, updates);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update task');
      }
      
      // Update local state
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => 
          task.id === id ? response.data! : task
        ),
        isLoading: false
      }));
      
      // Refresh task stats
      await taskService.getTaskStats().then(res => {
        if (res.success) {
          setState(prev => ({ ...prev, taskStats: res.data }));
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update task',
        isLoading: false
      }));
      
      return null;
    }
  }, []);
  
  // Delete a task
  const deleteTask = useCallback(async (id: number): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('Deleting task:', id);
      const response = await taskService.deleteTask(id);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete task');
      }
      
      // Update local state
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.filter(task => task.id !== id),
        isLoading: false
      }));
      
      // Refresh task stats
      await taskService.getTaskStats().then(res => {
        if (res.success) {
          setState(prev => ({ ...prev, taskStats: res.data }));
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete task',
        isLoading: false
      }));
      
      return false;
    }
  }, []);
  
  // Toggle task status (active/completed)
  const toggleTaskStatus = useCallback(async (id: number): Promise<Task | null> => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      console.log('Toggling task status:', id);
      // First update the UI optimistically for a snappier UX
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => {
          if (task.id === id) {
            return {
              ...task,
              status: task.status === 'active' ? 'completed' : 'active'
            };
          }
          return task;
        })
      }));
      
      // Then make the actual API call
      const response = await taskService.toggleTaskStatus(id);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update task status');
      }
      
      // Update with actual response data
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => 
          task.id === id ? response.data! : task
        )
      }));
      
      // Refresh task stats
      await taskService.getTaskStats().then(res => {
        if (res.success) {
          setState(prev => ({ ...prev, taskStats: res.data }));
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error toggling task status:', error);
      
      // Revert optimistic update on error
      await refreshTasks();
      
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update task status'
      }));
      
      return null;
    }
  }, [refreshTasks]);
  
  // Filter tasks
  const filterTasks = useCallback(async (filters: TaskFilters): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('Filtering tasks:', filters);
      const response = await taskService.getTasks(filters);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to filter tasks');
      }
      
      setState(prev => ({
        ...prev,
        tasks: response.data,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error filtering tasks:', error);
      
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to filter tasks',
        isLoading: false
      }));
    }
  }, []);
  
  // Search tasks
  const searchTasks = useCallback(async (query: string): Promise<void> => {
    if (!query.trim()) {
      refreshTasks();
      return;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('Searching tasks:', query);
      const response = await taskService.searchTasks(query);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to search tasks');
      }
      
      setState(prev => ({
        ...prev,
        tasks: response.data,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error searching tasks:', error);
      
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to search tasks',
        isLoading: false
      }));
    }
  }, [refreshTasks]);
  
  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);
  
  // Load tasks on initial mount
  useEffect(() => {
    console.log('Initial task load');
    refreshTasks();
  }, [refreshTasks]);
  
  return {
    // State
    tasks: state.tasks,
    taskStats: state.taskStats,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    refreshTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    filterTasks,
    searchTasks,
    clearError
  };
};