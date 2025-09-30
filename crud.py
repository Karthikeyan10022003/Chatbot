import sqlite3
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from datetime import datetime

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def create_table():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            status TEXT DEFAULT 'active',
            due_date TEXT,
            priority TEXT DEFAULT 'medium',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def add_item(title: str, description: str = '', priority: str = 'medium', due_date: str = None):
    """Add a new task item"""
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    
    cursor.execute('''
        INSERT INTO items (title, description, status, priority, due_date, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (title, description, 'active', priority, due_date, now, now))
    
    conn.commit()
    item_id = cursor.lastrowid
    
    # Fetch the created item
    cursor.execute('SELECT * FROM items WHERE id = ?', (item_id,))
    item = dict(cursor.fetchone())
    conn.close()
    
    return item

def list_items(status: str = None, priority: str = None):
    """List all items with optional filters"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = 'SELECT * FROM items WHERE 1=1'
    params = []
    
    if status:
        query += ' AND status = ?'
        params.append(status)
    
    if priority:
        query += ' AND priority = ?'
        params.append(priority)
    
    query += ' ORDER BY created_at DESC'
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def get_item(item_id: int):
    """Get a single item by ID"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM items WHERE id = ?', (item_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return dict(row)

def update_item(item_id: int, title: str = None, description: str = None, 
                status: str = None, due_date: str = None, priority: str = None):
    """Update an existing item"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get current item
    cursor.execute('SELECT * FROM items WHERE id = ?', (item_id,))
    current = cursor.fetchone()
    
    if current is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")
    
    current = dict(current)
    
    # Update only provided fields
    new_title = title if title is not None else current['title']
    new_description = description if description is not None else current['description']
    new_status = status if status is not None else current['status']
    new_priority = priority if priority is not None else current['priority']
    new_due_date = due_date if due_date is not None else current['due_date']
    now = datetime.now().isoformat()
    
    cursor.execute('''
        UPDATE items 
        SET title = ?, description = ?, status = ?, due_date = ?, priority = ?, updated_at = ?
        WHERE id = ?
    ''', (new_title, new_description, new_status, new_due_date, new_priority, now, item_id))
    
    conn.commit()
    
    # Fetch updated item
    cursor.execute('SELECT * FROM items WHERE id = ?', (item_id,))
    updated = dict(cursor.fetchone())
    conn.close()
    
    return updated

def delete_item(item_id: int):
    """Delete an item"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM items WHERE id = ?', (item_id,))
    deleted_rows = cursor.rowcount
    conn.commit()
    conn.close()
    
    if deleted_rows == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return True

def get_task_stats():
    """Get task statistics"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT COUNT(*) as total FROM items')
    total = cursor.fetchone()['total']
    
    cursor.execute('SELECT COUNT(*) as active FROM items WHERE status = ?', ('active',))
    active = cursor.fetchone()['active']
    
    cursor.execute('SELECT COUNT(*) as completed FROM items WHERE status = ?', ('completed',))
    completed = cursor.fetchone()['completed']
    
    # Calculate overdue tasks
    cursor.execute('''
        SELECT COUNT(*) as overdue FROM items 
        WHERE status = 'active' AND due_date IS NOT NULL 
        AND date(due_date) < date('now')
    ''')
    overdue = cursor.fetchone()['overdue']
    
    conn.close()
    
    return {
        'total': total,
        'active': active,
        'completed': completed,
        'overdue': overdue
    }