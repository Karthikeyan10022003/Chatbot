// =============================================================================
// TASK API SERVICE
// =============================================================================

import { apiService } from './api';
import { mockService } from './mock-service';
import {
  Task,
  TaskCreate,
  TaskUpdate,
  TaskFilters,
  ApiResponse,
  TaskStats
} from '../models/task.types';
import { API_ENDPOINTS } from '../lib/constants';

class TaskService {
  // Only use mock data if we're in development AND no API URL is provided
  private useMockData = process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_URL;

  async getTasks(filters?: TaskFilters): Promise<ApiResponse<Task[]>> {
    try {
      if (this.useMockData) {
        const data = await mockService.getTasks();
        let filteredTasks = data;

        if (filters) {
          if (filters.status) {
            filteredTasks = filteredTasks.filter(task => task.status === filters.status);
          }
          if (filters.priority) {
            filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
          }
        }

        return { data: filteredTasks, success: true };
      }

      const queryParams = new URLSearchParams();
      
      if (filters) {
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.priority) queryParams.append('priority', filters.priority);
        if (filters.due_date) queryParams.append('due_date', filters.due_date);
      }

      const endpoint = `${API_ENDPOINTS.TASKS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const data = await apiService.get<Task[]>(endpoint);
      
      return { data, success: true };
    } catch (error) {
      console.error('Error fetching tasks:', error);
      
      // Fallback to mock data if API fails
      if (!this.useMockData) {
        try {
          const data = await mockService.getTasks();
          return { data, success: true };
        } catch (mockError) {
          return {
            data: [],
            success: false,
            message: 'Failed to fetch tasks from both API and mock service'
          };
        }
      }
      
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch tasks'
      };
    }
  }

  async getTask(id: number): Promise<ApiResponse<Task | null>> {
    try {
      if (this.useMockData) {
        const tasks = await mockService.getTasks();
        const task = tasks.find(t => t.id === id);
        return { data: task || null, success: true };
      }

      const data = await apiService.get<Task>(`${API_ENDPOINTS.TASKS}/${id}`);
      return { data, success: true };
    } catch (error) {
      console.error('Error fetching task:', error);
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch task'
      };
    }
  }

  async createTask(taskData: TaskCreate): Promise<ApiResponse<Task | null>> {
    try {
      if (this.useMockData) {
        const data = await mockService.createTask(taskData);
        return { data, success: true, message: 'Task created successfully' };
      }

      const data = await apiService.post<Task>(API_ENDPOINTS.TASKS, taskData);
      return { data, success: true, message: 'Task created successfully' };
    } catch (error) {
      console.error('Error creating task:', error);
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create task'
      };
    }
  }

  async updateTask(
    id: number,
    updates: TaskUpdate
  ): Promise<ApiResponse<Task | null>> {
    try {
      if (this.useMockData) {
        const data = await mockService.updateTask(id, updates);
        return { data, success: true, message: 'Task updated successfully' };
      }

      const data = await apiService.patch<Task>(`${API_ENDPOINTS.TASKS}/${id}`, updates);
      return { data, success: true, message: 'Task updated successfully' };
    } catch (error) {
      console.error('Error updating task:', error);
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update task'
      };
    }
  }

  async deleteTask(id: number): Promise<ApiResponse<boolean>> {
    try {
      if (this.useMockData) {
        const success = await mockService.deleteTask(id);
        return { data: success, success: true, message: 'Task deleted successfully' };
      }

      await apiService.delete(`${API_ENDPOINTS.TASKS}/${id}`);
      return { data: true, success: true, message: 'Task deleted successfully' };
    } catch (error) {
      console.error('Error deleting task:', error);
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete task'
      };
    }
  }

async getTaskStats(): Promise<ApiResponse<TaskStats>> {
  try {
    if (this.useMockData) {
      const tasks = await mockService.getTasks();
      const stats = this.calculateStats(tasks);
      return { data: stats, success: true };
    }

    // Try with multiple endpoint formats to handle possible inconsistencies
    let data;
    try {
      // Try first format
      data = await apiService.get<TaskStats>(`${API_ENDPOINTS.TASKS}/stats`);
      console.log('Task stats fetched successfully with format 1');
    } catch (error1) {
      try {
        // Try second format with trailing slash
        data = await apiService.get<TaskStats>(`${API_ENDPOINTS.TASKS}/stats/`);
        console.log('Task stats fetched successfully with format 2');
      } catch (error2) {
        try {
          // Try third format
          data = await apiService.get<TaskStats>(`${API_ENDPOINTS.TASK_STATS}`);
          console.log('Task stats fetched successfully with format 3');
        } catch (error3) {
          // If all fail, calculate stats from tasks
          console.log('All stats API calls failed, calculating from tasks');
          const tasksResponse = await this.getTasks();
          if (tasksResponse.success) {
            const stats = this.calculateStats(tasksResponse.data);
            return { data: stats, success: true };
          }
          throw error3;
        }
      }
    }
    
    return { data, success: true };
  } catch (error) {
    console.error('Error fetching task stats:', error);
    return {
      data: { total: 0, active: 0, completed: 0, overdue: 0 },
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch stats'
    };
  }
}

  async toggleTaskStatus(id: number): Promise<ApiResponse<Task | null>> {
    try {
      // First get the current task to determine new status
      const taskResponse = await this.getTask(id);
      if (!taskResponse.success || !taskResponse.data) {
        throw new Error('Task not found');
      }

      const currentTask = taskResponse.data;
      const newStatus = currentTask.status === 'active' ? 'completed' : 'active';

      return await this.updateTask(id, { status: newStatus });
    } catch (error) {
      console.error('Error toggling task status:', error);
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : 'Failed to toggle task status'
      };
    }
  }

  async searchTasks(query: string): Promise<ApiResponse<Task[]>> {
    try {
      if (this.useMockData) {
        const tasks = await mockService.getTasks();
        const filtered = tasks.filter(task =>
          task.title.toLowerCase().includes(query.toLowerCase()) ||
          task.description.toLowerCase().includes(query.toLowerCase())
        );
        return { data: filtered, success: true };
      }

      const data = await apiService.get<Task[]>(`${API_ENDPOINTS.TASKS}/search?q=${encodeURIComponent(query)}`);
      return { data, success: true };
    } catch (error) {
      console.error('Error searching tasks:', error);
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : 'Failed to search tasks'
      };
    }
  }

  private calculateStats(tasks: Task[]): TaskStats {
    const stats = {
      total: tasks.length,
      active: 0,
      completed: 0,
      overdue: 0
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    tasks.forEach(task => {
      if (task.status === 'active') {
        stats.active++;
        
        if (task.due_date) {
          const dueDate = new Date(task.due_date);
          dueDate.setHours(0, 0, 0, 0);
          if (dueDate < today) {
            stats.overdue++;
          }
        }
      } else {
        stats.completed++;
      }
    });

    return stats;
  }
}

export const taskService = new TaskService();