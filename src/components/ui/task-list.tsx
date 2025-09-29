// =============================================================================
// TASK LIST COMPONENT - Interactive Task Management
// =============================================================================

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  PlusCircle, 
  SlidersHorizontal,
  ChevronDown,
  X,
  Clock,
  Calendar
} from 'lucide-react';
import { useTaskViewModel } from '../../viewmodels/useTaskViewModel';
import { TaskItem } from './task-item';
import { Task, TaskPriority, TaskStatus } from '../../models/task.types';
import { cn } from '../../lib/utils';

interface TaskListProps {
  className?: string;
}

export const TaskList: React.FC<TaskListProps> = ({ className }) => {
  const { 
    tasks, 
    taskStats, 
    isLoading, 
    error,
    toggleTaskStatus,
    deleteTask,
    refreshTasks
  } = useTaskViewModel();
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'due_date' | 'created_at'>('created_at');
  
  // Get filtered and sorted tasks
  const filteredTasks = tasks.filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    return true;
  });
  
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    } 
    else if (sortBy === 'due_date') {
      // Sort by due date (tasks with no due date go last)
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    else { // created_at
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Task List Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              My Tasks
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isLoading 
                ? 'Loading tasks...' 
                : `${taskStats.active} active, ${taskStats.completed} completed`}
              {taskStats.overdue > 0 && `, ${taskStats.overdue} overdue`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                "text-gray-500 dark:text-gray-400",
                "hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200",
                showFilters && "bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400"
              )}
              title="Filter tasks"
              aria-label="Filter tasks"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
            
            <button
              onClick={refreshTasks}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Refresh tasks"
              aria-label="Refresh tasks"
              disabled={isLoading}
            >
              <svg 
                className={cn(
                  "w-5 h-5", 
                  isLoading && "animate-spin"
                )}
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                ></circle>
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Filter Options */}
        {showFilters && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-fadeIn">
            <div className="flex flex-col space-y-2">
              {/* Filter by Status */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  <FilterButton
                    active={statusFilter === 'all'}
                    onClick={() => setStatusFilter('all')}
                  >
                    All
                  </FilterButton>
                  <FilterButton
                    active={statusFilter === 'active'}
                    onClick={() => setStatusFilter('active')}
                  >
                    <Circle className="w-3 h-3 mr-1" />
                    Active
                  </FilterButton>
                  <FilterButton
                    active={statusFilter === 'completed'}
                    onClick={() => setStatusFilter('completed')}
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Completed
                  </FilterButton>
                </div>
              </div>
              
              {/* Filter by Priority */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                  Priority
                </label>
                <div className="flex flex-wrap gap-2">
                  <FilterButton
                    active={priorityFilter === 'all'}
                    onClick={() => setPriorityFilter('all')}
                  >
                    All
                  </FilterButton>
                  <FilterButton
                    active={priorityFilter === 'high'}
                    onClick={() => setPriorityFilter('high')}
                    className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30"
                  >
                    High
                  </FilterButton>
                  <FilterButton
                    active={priorityFilter === 'medium'}
                    onClick={() => setPriorityFilter('medium')}
                    className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/30"
                  >
                    Medium
                  </FilterButton>
                  <FilterButton
                    active={priorityFilter === 'low'}
                    onClick={() => setPriorityFilter('low')}
                    className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/30"
                  >
                    Low
                  </FilterButton>
                </div>
              </div>
              
              {/* Sort Options */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                  Sort by
                </label>
                <div className="flex flex-wrap gap-2">
                  <FilterButton
                    active={sortBy === 'created_at'}
                    onClick={() => setSortBy('created_at')}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Recent
                  </FilterButton>
                  <FilterButton
                    active={sortBy === 'due_date'}
                    onClick={() => setSortBy('due_date')}
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Due Date
                  </FilterButton>
                  <FilterButton
                    active={sortBy === 'priority'}
                    onClick={() => setSortBy('priority')}
                  >
                    <ChevronDown className="w-3 h-3 mr-1" />
                    Priority
                  </FilterButton>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-3">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setSortBy('created_at');
                }}
                className="text-xs font-medium text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Reset Filters
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="ml-3 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        {/* Error State */}
        {error && (
          <div className="p-4 m-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            <button
              onClick={refreshTasks}
              className="mt-2 text-xs font-medium text-red-700 dark:text-red-400 hover:text-red-500"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading tasks...</p>
          </div>
        ) : sortedTasks.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <PlusCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
              {tasks.length === 0 
                ? "No tasks yet" 
                : "No matching tasks"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              {tasks.length === 0
                ? "Start by adding a task through the chat interface. Try saying 'Add a task to buy groceries'."
                : "Try adjusting your filters to see more tasks."}
            </p>
          </div>
        ) : (
          // Task Items
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedTasks.map((task) => (
              <TaskItem 
                key={task.id}
                task={task}
                onToggleStatus={toggleTaskStatus}
                onDelete={deleteTask}
              />
            ))}
          </ul>
        )}
      </div>
      
      {/* Task Count Footer */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-3">
        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <span>
            {filteredTasks.length} 
            {filteredTasks.length === 1 ? ' task' : ' tasks'} 
            {tasks.length !== filteredTasks.length && ` (filtered from ${tasks.length})`}
          </span>
          
          {filteredTasks.length > 0 && statusFilter === 'all' && (
            <div className="flex items-center gap-1 text-xs">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>{tasks.filter(t => t.status === 'active').length} active</span>
              <span className="w-2 h-2 bg-green-500 rounded-full ml-2"></span>
              <span>{tasks.filter(t => t.status === 'completed').length} completed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Filter Button Component
interface FilterButtonProps {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  className?: string;
}

const FilterButton: React.FC<FilterButtonProps> = ({ 
  children, 
  active = false, 
  onClick,
  className
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
        "flex items-center",
        active 
          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30" 
          : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600",
        className
      )}
    >
      {children}
    </button>
  );
};