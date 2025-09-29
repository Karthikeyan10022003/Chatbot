// =============================================================================
// TASK MODELS & INTERFACES
// =============================================================================

// Task Status Type
export type TaskStatus = 'active' | 'completed';

// Task Priority Type
export type TaskPriority = 'high' | 'medium' | 'low';

// Task Data Structure
export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string; // ISO date string (YYYY-MM-DD)
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

// Task Create DTO
export interface TaskCreate {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
}

// Task Update DTO
export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}

// Task Filter Options
export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
}

// Task Statistics
export interface TaskStats {
  total: number;
  active: number;
  completed: number;
  overdue: number;
}

// API Response Wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Task Actions for AI Agent
export type TaskActionType = 'create' | 'update' | 'delete' | 'list' | 'filter';

export interface TaskAction {
  type: TaskActionType;
  data: any;
}