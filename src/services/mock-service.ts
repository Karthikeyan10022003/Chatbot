// =============================================================================
// MOCK SERVICE - Simulates Backend API & AI Agent
// =============================================================================

import { Task, TaskCreate, TaskUpdate, ApiResponse, TaskAction } from '../models/task.types';
import { AgentResponse } from '../models/chat.types';

class MockService {
  private tasks: Task[] = [
    {
      id: 1,
      title: "Review project proposal",
      description: "Go through the Q4 project proposal and provide feedback",
      status: "active",
      due_date: "2025-09-28",
      priority: "high",
      created_at: "2025-09-25T10:00:00Z",
      updated_at: "2025-09-25T10:00:00Z"
    },
    {
      id: 2,
      title: "Buy groceries",
      description: "Milk, eggs, bread, and vegetables",
      status: "active",
      due_date: "2025-09-26",
      priority: "medium",
      created_at: "2025-09-25T09:30:00Z",
      updated_at: "2025-09-25T09:30:00Z"
    },
    {
      id: 3,
      title: "Call dentist",
      description: "Schedule routine cleaning appointment",
      status: "completed",
      priority: "low",
      created_at: "2025-09-24T14:00:00Z",
      updated_at: "2025-09-25T08:00:00Z"
    }
  ];

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Task CRUD Operations
  async getTasks(): Promise<Task[]> {
    await this.delay(300);
    return [...this.tasks].sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  async createTask(taskData: TaskCreate): Promise<Task> {
    await this.delay(500);
    const newTask: Task = {
      id: Date.now(),
      title: taskData.title || "Untitled Task",
      description: taskData.description || "",
      status: "active",
      priority: taskData.priority || "medium",
      due_date: taskData.due_date || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.tasks.push(newTask);
    return newTask;
  }

  async updateTask(id: number, updates: TaskUpdate): Promise<Task | null> {
    await this.delay(400);
    const taskIndex = this.tasks.findIndex(task => task.id === id);
    
    if (taskIndex === -1) {
      throw new Error("Task not found");
    }

    // Handle due_date properly - it can be string, null, or undefined
    const updatedTask: Task = {
      ...this.tasks[taskIndex],
      ...updates,
      due_date: updates.due_date === null ? undefined : (updates.due_date || this.tasks[taskIndex].due_date),
      updated_at: new Date().toISOString()
    };

    this.tasks[taskIndex] = updatedTask;
    return this.tasks[taskIndex];
  }

  async deleteTask(id: number): Promise<boolean> {
    await this.delay(300);
    const taskIndex = this.tasks.findIndex(task => task.id === id);
    
    if (taskIndex === -1) {
      throw new Error("Task not found");
    }

    this.tasks.splice(taskIndex, 1);
    return true;
  }

  // Mock AI Agent Response
  async processAgentMessage(message: string): Promise<AgentResponse> {
    await this.delay(1000); // Simulate AI processing time

    const lowerMessage = message.toLowerCase();
    const actions: TaskAction[] = [];
    let response = "";

    // Simple intent recognition (in real app, this would be handled by LangGraph + Gemini)
    if (lowerMessage.includes('create') || lowerMessage.includes('add') || lowerMessage.includes('remind')) {
      const taskData = this.extractTaskFromMessage(message);
      const result = await this.createTask(taskData);
      actions.push({ type: 'create', data: result });
      response = `I've created a new task: "${result.title}" with ${result.priority} priority. ${result.due_date ? `Due date set for ${result.due_date}.` : ''}`;
    }
    else if (lowerMessage.includes('complete') || lowerMessage.includes('done') || lowerMessage.includes('mark')) {
      const taskId = this.extractTaskIdFromMessage(message);
      if (taskId) {
        const result = await this.updateTask(taskId, { status: 'completed' });
        if (result) {
          actions.push({ type: 'update', data: result });
          response = `Great! I've marked "${result.title}" as completed. Well done! 🎉`;
        }
      } else {
        response = "I couldn't identify which task you want to mark as complete. Could you be more specific?";
      }
    }
    else if (lowerMessage.includes('delete') || lowerMessage.includes('remove')) {
      const taskId = this.extractTaskIdFromMessage(message);
      if (taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        const taskTitle = task?.title || "Unknown task";
        await this.deleteTask(taskId);
        actions.push({ type: 'delete', data: { id: taskId } });
        response = `I've deleted "${taskTitle}" from your task list.`;
      } else {
        response = "I couldn't identify which task you want to delete. Could you specify the task?";
      }
    }
    else if (lowerMessage.includes('list') || lowerMessage.includes('show') || lowerMessage.includes('what')) {
      const tasks = await this.getTasks();
      actions.push({ type: 'list', data: tasks });
      
      const activeCount = tasks.filter(t => t.status === 'active').length;
      const completedCount = tasks.filter(t => t.status === 'completed').length;
      
      response = `Here are your tasks! You have ${activeCount} active task${activeCount !== 1 ? 's' : ''} and ${completedCount} completed task${completedCount !== 1 ? 's' : ''}.`;
    }
    else {
      response = "I understand you want to manage your tasks. I can help you create, update, complete, delete, or list your tasks. What would you like me to do?";
    }

    return { response, actions };
  }

  private extractTaskFromMessage(message: string): TaskCreate {
    const task: TaskCreate = { title: "" };
    
    // Extract title (simple heuristic)
    if (message.toLowerCase().includes('remind me to')) {
      task.title = message.replace(/remind me to/i, '').trim();
    } else if (message.toLowerCase().includes('add task')) {
      task.title = message.replace(/add task/i, '').trim();
    } else if (message.toLowerCase().includes('create')) {
      task.title = message.replace(/create/i, '').trim();
    } else {
      task.title = message.split(' ').slice(1).join(' ') || "New Task";
    }

    // Clean up title
    task.title = task.title.replace(/^(a |an |the )/i, '').trim();
    
    // Extract priority
    if (message.toLowerCase().includes('high priority') || message.toLowerCase().includes('urgent')) {
      task.priority = 'high';
    } else if (message.toLowerCase().includes('low priority')) {
      task.priority = 'low';
    } else {
      task.priority = 'medium';
    }

    // Extract due date (simple)
    if (message.toLowerCase().includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      task.due_date = tomorrow.toISOString().split('T')[0];
    } else if (message.toLowerCase().includes('today')) {
      task.due_date = new Date().toISOString().split('T')[0];
    } else if (message.toLowerCase().includes('next week')) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      task.due_date = nextWeek.toISOString().split('T')[0];
    }

    return task;
  }

  private extractTaskIdFromMessage(message: string): number | null {
    // In a real app, this would use NLP to identify tasks by title/description
    // For demo, we'll use the first active task or try to match by title
    
    // Try to find task by title keywords
    const words = message.toLowerCase().split(' ');
    for (const task of this.tasks) {
      const titleWords = task.title.toLowerCase().split(' ');
      const commonWords = words.filter(word => titleWords.includes(word));
      if (commonWords.length >= 2) {
        return task.id;
      }
    }
    
    // Fallback to first active task
    const activeTasks = this.tasks.filter(t => t.status === 'active');
    return activeTasks.length > 0 ? activeTasks[0].id : null;
  }
}

export const mockService = new MockService();