from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Optional
from pydantic import BaseModel
import google.generativeai as genai
import configparser
import json
from datetime import datetime
from crud import (
    create_table, add_item, list_items, update_item, 
    delete_item, get_item, get_task_stats
)

# ---- Load API key ----
config = configparser.ConfigParser()
config.read('config.ini')
api_key = config['API']['api_key']
genai.configure(api_key="AIzaSyDgspJAH6ynqkth4JFHtzX2tlFFinfJU1g")

# ---- Initialize database ----
create_table()

# ---- Pydantic Models ----
class TaskCreate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = ""
    priority: Optional[str] = "medium"
    due_date: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None

# ---- LangGraph State ----
class State(TypedDict):
    messages: List[dict]

graph = StateGraph(State)

def extract_task_info_with_gemini(user_message: str):
    """Use Gemini to extract structured task information from natural language"""
    try:
        # Use the correct model name
        try:
            model = genai.GenerativeModel("gemini-pro")
        except:
            model = genai.GenerativeModel("models/gemini-pro")
        
        prompt = f"""You are a task parser. Extract structured information from the user's message.

User message: "{user_message}"

Extract and return ONLY a JSON object with these exact fields:
{{
  "action": "<create|update|delete|list|complete|unknown>",
  "title": "<just the task name, WITHOUT priority/date words>",
  "description": "<optional description>",
  "priority": "<high|medium|low>",
  "due_date": "<YYYY-MM-DD or null>",
  "task_id": <number or null>
}}

Rules for extraction:
1. For CREATE: Title should NOT include: "high priority", "low priority", "medium priority", "tomorrow", "today", "next week", etc.
2. For UPDATE: Extract everything after "task [number]" as the new title
3. Extract priority from words like "high priority", "urgent", "important" -> "high"
4. Extract priority from words like "low priority", "not urgent" -> "low"
5. Default priority is "medium"
6. Convert "tomorrow" to tomorrow's date, "today" to today's date
7. Remove phrases like "with high priority", "due tomorrow" from the title

Examples:
Input: "create task buy milk with high priority"
Output: {{"action": "create", "title": "buy milk", "description": "", "priority": "high", "due_date": null, "task_id": null}}

Input: "update task 1 frontend over"
Output: {{"action": "update", "title": "frontend over", "description": "", "priority": "medium", "due_date": null, "task_id": 1}}

Input: "update task 2 complete backend with high priority"
Output: {{"action": "update", "title": "complete backend", "description": "", "priority": "high", "due_date": null, "task_id": 2}}

Input: "change task 3 review code by tomorrow"
Output: {{"action": "update", "title": "review code", "description": "", "priority": "medium", "due_date": "2025-10-01", "task_id": 3}}

Input: "list all tasks"
Output: {{"action": "list", "title": "", "description": "", "priority": "medium", "due_date": null, "task_id": null}}

Input: "mark task 1 as done"
Output: {{"action": "complete", "title": "", "description": "", "priority": "medium", "due_date": null, "task_id": 1}}

Return ONLY the JSON object, no other text or explanation."""

        response = model.generate_content(prompt)
        
        # Clean response
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        parsed = json.loads(response_text.strip())
        print(f"✅ Gemini parsed: {parsed}")
        return parsed
        
    except Exception as e:
        print(f"⚠️ Gemini parsing failed: {e}, using fallback parser")
        # Fallback to simple keyword matching
        return parse_message_simple(user_message)

def parse_message_simple(message: str):
    """Enhanced keyword-based parsing as fallback"""
    import re
    from datetime import datetime, timedelta
    
    # Clean the message first - remove quotes and extra characters
    message = message.strip().strip('"\'')
    lower_msg = message.lower()
    
    # Detect action
    action = "unknown"
    if any(word in lower_msg for word in ["create task", "add task", "new task", "remind me", "create", "add"]):
        action = "create"
    elif any(word in lower_msg for word in ["list", "show", "display"]):
        action = "list"
    elif any(word in lower_msg for word in ["complete", "done", "finish", "mark as done", "mark"]):
        action = "complete"
    elif any(word in lower_msg for word in ["delete", "remove"]):
        action = "delete"
    elif any(word in lower_msg for word in ["update", "edit", "change", "modify"]):
        action = "update"
    
    # Extract priority
    priority = "medium"  # default
    if any(word in lower_msg for word in ["high priority", "urgent", "important", "critical", "asap"]):
        priority = "high"
    elif any(word in lower_msg for word in ["low priority", "not urgent", "whenever"]):
        priority = "low"
    
    # Extract due date
    due_date = None
    today = datetime.now()
    
    if "tomorrow" in lower_msg:
        due_date = (today + timedelta(days=1)).strftime("%Y-%m-%d")
    elif "today" in lower_msg:
        due_date = today.strftime("%Y-%m-%d")
    elif "next week" in lower_msg:
        due_date = (today + timedelta(days=7)).strftime("%Y-%m-%d")
    elif "in 3 days" in lower_msg or "3 days" in lower_msg:
        due_date = (today + timedelta(days=3)).strftime("%Y-%m-%d")
    
    # Extract task ID (for update/delete/complete)
    task_id = None
    numbers = re.findall(r'\d+', lower_msg)
    if numbers and action in ["update", "delete", "complete"]:
        task_id = int(numbers[0])
    
    # Extract title
    title = ""
    
    if action == "create":
        # Remove common trigger phrases
        title = message
        
        # Remove trigger words
        for trigger in ["create task", "add task", "new task", "remind me to", "create", "add", "remind"]:
            if trigger in lower_msg:
                idx = lower_msg.index(trigger)
                title = message[idx + len(trigger):].strip()
                break
        
        # Remove priority indicators from title
        priority_phrases = [
            "with high priority", "high priority", "urgent", "important",
            "with low priority", "low priority", "with medium priority",
            "medium priority", "asap", "critical"
        ]
        for phrase in priority_phrases:
            title = re.sub(phrase, "", title, flags=re.IGNORECASE).strip()
        
        # Remove date indicators from title
        date_phrases = [
            "by tomorrow", "tomorrow", "by today", "today", 
            "next week", "by next week", "in 3 days", "by"
        ]
        for phrase in date_phrases:
            title = re.sub(r'\b' + phrase + r'\b', "", title, flags=re.IGNORECASE).strip()
        
        # Clean up extra spaces and punctuation
        title = re.sub(r'\s+', ' ', title).strip()
        title = title.strip('.,!?;:"\'')
        
        # If title is empty, set default
        if not title:
            title = "Untitled Task"
    
    elif action == "update":
        # For update: extract everything after "task [ID]"
        # Pattern: "update task 1 new title here"
        match = re.search(r'(?:update|edit|change|modify)\s+task\s+\d+\s+(.+)', message, re.IGNORECASE)
        if match:
            title = match.group(1).strip()
            
            # Remove priority indicators from title if present
            priority_phrases = [
                "with high priority", "high priority", "urgent", "important",
                "with low priority", "low priority", "with medium priority",
                "medium priority", "to high priority", "to low priority", "to medium priority"
            ]
            for phrase in priority_phrases:
                title = re.sub(phrase, "", title, flags=re.IGNORECASE).strip()
            
            # Remove date indicators from title
            date_phrases = [
                "by tomorrow", "tomorrow", "by today", "today", 
                "next week", "by next week", "due tomorrow", "due today"
            ]
            for phrase in date_phrases:
                title = re.sub(r'\b' + phrase + r'\b', "", title, flags=re.IGNORECASE).strip()
            
            # Clean up quotes and extra characters
            title = re.sub(r'\s+', ' ', title).strip()
            title = title.strip('.,!?;:"\'{}]')  # Remove extra punctuation including quotes and brackets
    
    result = {
        "action": action,
        "title": title,
        "description": "",
        "priority": priority,
        "due_date": due_date,
        "task_id": task_id
    }
    
    print(f"✅ Simple parser result: {result}")
    return result
def call_gemini(state: State):
    """Process user message and execute appropriate action"""
    last_msg = state["messages"][-1]["content"]
    
    # Extract structured information using Gemini
    task_info = extract_task_info_with_gemini(last_msg)
    action = task_info.get("action", "unknown")
    
    print(f"🔍 Parsed task info: {task_info}")  # Debug log
    
    try:
        if action == "create":
            # Create new task
            title = task_info.get("title", "Untitled Task")
            description = task_info.get("description", "")
            priority = task_info.get("priority", "medium")
            due_date = task_info.get("due_date")
            
            item = add_item(title, description, priority, due_date)
            reply = f"✅ Task created: '{item['title']}' (Priority: {item['priority']})"
            if due_date:
                reply += f" - Due: {due_date}"
        
        elif action == "list":
            # List all tasks
            items = list_items()
            if items:
                task_list = "\n".join([
                    f"• [{item['id']}] {item['title']} ({item['status']}, {item['priority']} priority)"
                    for item in items
                ])
                reply = f"📋 Your tasks:\n{task_list}"
            else:
                reply = "📭 You have no tasks yet. Create one to get started!"
        
        elif action == "complete":
            # Mark task as completed
            task_id = task_info.get("task_id")
            if task_id:
                try:
                    item = update_item(task_id, status="completed")
                    reply = f"✅ Task completed: '{item['title']}'"
                except HTTPException as e:
                    reply = f"❌ Task {task_id} not found. Use 'list tasks' to see available tasks."
            else:
                # Try to find task by title or use first active task
                items = list_items(status="active")
                if items:
                    item = update_item(items[0]['id'], status="completed")
                    reply = f"✅ Task completed: '{item['title']}'"
                else:
                    reply = "❌ No active tasks found to complete."
        
        elif action == "update":
            # Update existing task
            task_id = task_info.get("task_id")
            if task_id:
                try:
                    # Check if task exists first
                    existing_task = get_item(task_id)
                    
                    # Update only fields that are provided
                    update_data = {}
                    if task_info.get("title"):
                        update_data["title"] = task_info.get("title")
                    if task_info.get("description"):
                        update_data["description"] = task_info.get("description")
                    if task_info.get("priority") and task_info.get("priority") != "medium":
                        update_data["priority"] = task_info.get("priority")
                    if task_info.get("due_date"):
                        update_data["due_date"] = task_info.get("due_date")
                    
                    item = update_item(task_id, **update_data)
                    reply = f"✅ Task updated: '{item['title']}'"
                    if update_data.get("priority"):
                        reply += f" (Priority: {item['priority']})"
                    if update_data.get("due_date"):
                        reply += f" (Due: {item['due_date']})"
                        
                except HTTPException as e:
                    # Task not found
                    items = list_items()
                    if items:
                        available_ids = ", ".join([str(item['id']) for item in items])
                        reply = f"❌ Task {task_id} not found. Available task IDs: {available_ids}"
                    else:
                        reply = "❌ No tasks exist yet. Create a task first!"
            else:
                reply = "❌ Please specify which task to update (e.g., 'update task 1 new title')"
        
        elif action == "delete":
            # Delete task
            task_id = task_info.get("task_id")
            if task_id:
                try:
                    item = get_item(task_id)
                    title = item['title']
                    delete_item(task_id)
                    reply = f"🗑️ Task deleted: '{title}'"
                except HTTPException:
                    items = list_items()
                    if items:
                        available_ids = ", ".join([str(item['id']) for item in items])
                        reply = f"❌ Task {task_id} not found. Available task IDs: {available_ids}"
                    else:
                        reply = "❌ No tasks exist."
            else:
                reply = "❌ Please specify which task to delete (e.g., 'delete task 1')"
        
        else:
            # General conversation - use Gemini for chat
            try:
                model = get_gemini_model()
                
                # Format history for Gemini
                chat_history = []
                for msg in state["messages"]:
                    role = "user" if msg["role"] == "user" else "model"
                    chat_history.append({
                        "role": role,
                        "parts": [msg["content"]]
                    })
                
                chat = model.start_chat(history=chat_history[:-1])
                response = chat.send_message(state["messages"][-1]["content"])
                reply = response.text
            except Exception as e:
                print(f"Gemini chat error: {e}")
                reply = "I can help you manage tasks! Try:\n• 'create task [name]'\n• 'list tasks'\n• 'update task [id] [new name]'\n• 'complete task [id]'\n• 'delete task [id]'"
    
    except Exception as e:
        print(f"Error in call_gemini: {e}")
        reply = f"❌ Error: {str(e)}\n\nTip: Try 'list tasks' to see your tasks first."
    
    return {
        "messages": state["messages"] + [{"role": "assistant", "content": reply}]
    }

graph.add_node("chatbot", call_gemini)
graph.set_entry_point("chatbot")
graph.add_edge("chatbot", END)
app_graph = graph.compile()

# ---- FastAPI App ----
app = FastAPI(title="AI Task Manager API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client_states = {}

# ---- REST API Endpoints ----

@app.get("/api/tasks")
async def get_tasks(status: Optional[str] = None, priority: Optional[str] = None):
    """Get all tasks with optional filters"""
    try:
        items = list_items(status=status, priority=priority)
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tasks/stats")
async def get_stats():
    """Get task statistics"""
    try:
        stats = get_task_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tasks/{task_id}")
async def get_task(task_id: int):
    """Get a specific task"""
    try:
        return get_item(task_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tasks")
async def create_task(task: TaskCreate):
    """Create a new task"""
    try:
        item = add_item(
            title=task.title or "Untitled Task",
            description=task.description or "",
            priority=task.priority or "medium",
            due_date=task.due_date
        )
        return item
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/tasks/{task_id}")
async def update_task_endpoint(task_id: int, task: TaskUpdate):
    """Update an existing task"""
    try:
        item = update_item(
            task_id,
            title=task.title,
            description=task.description,
            status=task.status,
            priority=task.priority,
            due_date=task.due_date
        )
        return item
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/tasks/{task_id}")
async def delete_task_endpoint(task_id: int):
    """Delete a task"""
    try:
        delete_item(task_id)
        return {"success": True, "message": "Task deleted successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---- WebSocket Endpoint ----

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time chat"""
    await websocket.accept()
    client_id = id(websocket)
    client_states[client_id] = {"messages": []}
    
    try:
        while True:
            user_input = await websocket.receive_text()
            client_states[client_id]["messages"].append(
                {"role": "user", "content": user_input}
            )
            
            state = app_graph.invoke(client_states[client_id])
            client_states[client_id] = state
            bot_reply = state["messages"][-1]["content"]
            
            await websocket.send_text(bot_reply)
    
    except WebSocketDisconnect:
        del client_states[client_id]

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "message": "AI Task Manager API",
        "endpoints": {
            "chat": "/ws/chat",
            "tasks": "/api/tasks",
            "stats": "/api/tasks/stats"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)