// =============================================================================
// TASK ITEM COMPONENT - Individual Task Card
// =============================================================================

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  CalendarClock, 
  Trash2, 
  ChevronRight, 
  ChevronDown 
} from 'lucide-react';
import { Task } from '../../models/task.types';
import { cn, formatDate, isOverdue, getDaysUntilDue } from '../../lib/utils';

interface TaskItemProps {
  task: Task;
  onToggleStatus: (id: number) => void;
  onDelete: (id: number) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggleStatus, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Task status management
  const isCompleted = task.status === 'completed';
  const taskOverdue = !isCompleted && isOverdue(task.due_date);
  const daysUntilDue = getDaysUntilDue(task.due_date);

  // Priority styling
  const priorityStyles = {
    high: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800/30'
    },
    medium: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-800/30'
    },
    low: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800/30'
    }
  };

  // Handle task status toggle
  const handleToggleStatus = () => {
    onToggleStatus(task.id);
  };

  // Handle task deletion
  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(task.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      // Auto-reset confirm state after 3 seconds
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <li className={cn(
      "transition-colors",
      isCompleted ? "bg-gray-50 dark:bg-gray-800/50" : "bg-white dark:bg-gray-800"
    )}>
      <div className="px-4 py-3">
        <div className="flex items-start">
          {/* Task Status Checkbox */}
          <button
            onClick={handleToggleStatus}
            className={cn(
              "flex-shrink-0 mt-0.5 mr-3 transition-colors",
              isCompleted 
                ? "text-green-500 hover:text-green-600" 
                : taskOverdue
                  ? "text-red-500 hover:text-red-600"
                  : "text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
            )}
            title={isCompleted ? "Mark as active" : "Mark as completed"}
            aria-label={isCompleted ? "Mark as active" : "Mark as completed"}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              {/* Task Title */}
              <h3 className={cn(
                "text-sm font-medium truncate",
                isCompleted 
                  ? "text-gray-500 dark:text-gray-400 line-through" 
                  : "text-gray-900 dark:text-gray-100",
                taskOverdue && !isCompleted && "text-red-600 dark:text-red-400"
              )}>
                {task.title}
              </h3>

              {/* Priority Badge */}
              <div className="ml-2 flex-shrink-0">
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                  priorityStyles[task.priority].bg,
                  priorityStyles[task.priority].text,
                  "border",
                  priorityStyles[task.priority].border
                )}>
                  {task.priority}
                </span>
              </div>
            </div>
            
            {/* Due Date & Expand Button Row */}
            <div className="mt-1 flex items-center justify-between">
              {/* Due Date Info */}
              {task.due_date ? (
                <div className={cn(
                  "flex items-center text-xs",
                  isCompleted 
                    ? "text-gray-500 dark:text-gray-400" 
                    : taskOverdue
                      ? "text-red-600 dark:text-red-400"
                      : daysUntilDue === 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-gray-500 dark:text-gray-400"
                )}>
                  {taskOverdue && !isCompleted ? (
                    <AlertTriangle className="w-3 h-3 mr-1" />
                  ) : (
                    <CalendarClock className="w-3 h-3 mr-1" />
                  )}
                  <span>
                    {isCompleted 
                      ? `Was due ${formatDate(task.due_date)}`
                      : taskOverdue
                        ? `Overdue: ${formatDate(task.due_date)}`
                        : daysUntilDue === 0
                          ? "Due today"
                          : `Due ${formatDate(task.due_date)}`}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>No due date</span>
                </div>
              )}

              {/* Expand Button */}
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                title={expanded ? "Collapse" : "Expand"}
                aria-label={expanded ? "Collapse" : "Expand"}
              >
                {expanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Task Details */}
        {expanded && (
          <div className="mt-3 ml-8 animate-slideDown">
            {/* Task Description */}
            <div className="mt-2">
              <p className={cn(
                "text-sm whitespace-pre-line",
                isCompleted 
                  ? "text-gray-500 dark:text-gray-400" 
                  : "text-gray-700 dark:text-gray-300"
              )}>
                {task.description || (
                  <span className="text-gray-400 dark:text-gray-500 italic">
                    No description provided
                  </span>
                )}
              </p>
            </div>
            
            {/* Task Actions */}
            <div className="mt-3 flex items-center justify-end">
              <button
                onClick={handleDelete}
                className={cn(
                  "flex items-center px-2 py-1 rounded text-xs font-medium",
                  confirmDelete
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400"
                )}
                title="Delete task"
                aria-label="Delete task"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                {confirmDelete ? "Confirm delete?" : "Delete"}
              </button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
};