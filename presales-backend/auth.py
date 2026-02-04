"""
Authentication and Authorization Module
Handles Google SSO authentication and role-based access control
"""

from datetime import datetime
from database import get_db

def get_user_by_email(email: str):
    """Get user by email"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        query = """
            SELECT id, email, name, role, created_at
            FROM users 
            WHERE email = %s;
        """
        
        cursor.execute(query, (email,))
        result = cursor.fetchone()
        
        if not result:
            return None
        
        return {
            'id': str(result[0]),
            'email': result[1],
            'name': result[2],
            'role': result[3],
            'created_at': result[4]
        }
        
    finally:
        conn.close()

def create_or_update_user(email: str, name: str):
    """
    Create or update user from Google SSO
    Only allows @google.com emails that are pre-approved by admin
    """
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Check if user exists
        existing_user = get_user_by_email(email)
        if existing_user:
            query = """
                UPDATE users 
                SET name = %s
                WHERE email = %s
                RETURNING id, email, name, role, created_at;
            """
            cursor.execute(query, (name, email))
        else:
            raise ValueError("Access denied. Please contact admin to request access.")
        result = cursor.fetchone()
        conn.commit()
        return {
            'id': str(result[0]),
            'email': result[1],
            'name': result[2],
            'role': result[3],
            'created_at': result[4]
        }
        
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def get_all_users():
    """Get all users (admin only)"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        query = """
            SELECT id, email, name, role, created_at
            FROM users 
            ORDER BY created_at DESC;
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        users = []
        for row in results:
            users.append({
                'id': str(row[0]),
                'email': row[1],
                'name': row[2],
                'role': row[3],
                'created_at': row[4]
            })
        return users
    finally:
        conn.close()

def add_user(email: str, name: str, role: str):
    """Add new user (admin only)"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            raise ValueError("User with this email already exists")
        
        # Validate role
        valid_roles = ['presales_viewer', 'presales_creator', 'presales_admin']
        if role not in valid_roles:
            raise ValueError(f"Invalid role. Must be one of: {', '.join(valid_roles)}")
        
        query = """
            INSERT INTO users (email, name, role, created_at)
            VALUES (%s, %s, %s, %s)
            RETURNING id, email, name, role, created_at;
        """
        
        cursor.execute(query, (email, name, role, datetime.now()))
        result = cursor.fetchone()
        conn.commit()
        
        return {
            'id': str(result[0]),
            'email': result[1],
            'name': result[2],
            'role': result[3],
            'created_at': result[4]
        }
        
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def update_user_role(user_id: str, role: str):
    """Update user role (admin only)"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Validate role
        valid_roles = ['presales_viewer', 'presales_creator', 'presales_admin']
        if role not in valid_roles:
            raise ValueError(f"Invalid role. Must be one of: {', '.join(valid_roles)}")
        
        query = """
            UPDATE users 
            SET role = %s
            WHERE id = %s
            RETURNING id, email, name, role, created_at;
        """
        
        cursor.execute(query, (role, user_id))
        result = cursor.fetchone()
        conn.commit()
        
        if not result:
            raise ValueError("User not found")
        
        return {
            'id': str(result[0]),
            'email': result[1],
            'name': result[2],
            'role': result[3],
            'created_at': result[4]
        }
        
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def delete_user(user_id: str):
    """Delete user (admin only)"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        query = """
            DELETE FROM users 
            WHERE id = %s
            RETURNING id, email;
        """
        
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()
        conn.commit()
        
        if not result:
            raise ValueError("User not found")
        
        return {
            'id': str(result[0]),
            'email': result[1]
        }
        
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()
