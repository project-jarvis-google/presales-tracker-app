"""
Authentication and Authorization Module - Enhanced
Handles Google SSO authentication, role-based access control, and invite approvals
Uses database for invite token storage instead of in-memory
"""

from datetime import datetime, timedelta
from database import get_db
import email_service as email_service
import secrets

def generate_invite_token():
    """Generate a secure random token for invites"""
    return secrets.token_urlsafe(32)

def get_user_by_email(email: str):
    """Get user by email"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        query = """
            SELECT id, email, name, role, created_at, invite_status
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
            'created_at': result[4],
            'invite_status': result[5] if len(result) > 5 else 'approved'
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
            # Check if invite was approved
            if existing_user.get('invite_status') == 'pending':
                raise ValueError("Your invitation is pending. Please check your email and approve the invitation first.")
            elif existing_user.get('invite_status') == 'rejected':
                raise ValueError("Your invitation was declined. Please contact the administrator for a new invitation.")
            
            # Update user name
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
            SELECT id, email, name, role, created_at, invite_status
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
                'created_at': row[4],
                'invite_status': row[5] if len(row) > 5 else 'approved'
            })
        return users
    finally:
        conn.close()

def add_user(email: str, name: str, role: str, admin_name: str):
    """Add new user and send invitation email (admin only)"""
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
        
        # Generate invite token
        invite_token = generate_invite_token()
        token_expiry = datetime.now() + timedelta(days=7)  # Token valid for 7 days
        
        # Insert user with pending status
        user_query = """
            INSERT INTO users (email, name, role, created_at, invite_status)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, email, name, role, created_at;
        """
        
        cursor.execute(user_query, (email, name, role, datetime.now(), 'pending'))
        result = cursor.fetchone()
        
        # Store invite token in database
        token_query = """
            INSERT INTO invite_tokens (token, email, status, created_at, expires_at)
            VALUES (%s, %s, %s, %s, %s);
        """
        
        cursor.execute(token_query, (invite_token, email, 'pending', datetime.now(), token_expiry))
        conn.commit()
        
        user_data = {
            'id': str(result[0]),
            'email': result[1],
            'name': result[2],
            'role': result[3],
            'created_at': result[4]
        }
        
        # Send invitation email
        email_service.send_invite_email(email, name, role, admin_name, invite_token)
        
        return user_data
        
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def approve_invite(token: str, admin_email: str):
    """Approve user invitation"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Verify token exists and is valid
        token_query = """
            SELECT email, status, expires_at
            FROM invite_tokens
            WHERE token = %s;
        """
        
        cursor.execute(token_query, (token,))
        token_result = cursor.fetchone()
        
        if not token_result:
            raise ValueError("Invalid or expired invitation token")
        
        user_email, status, expires_at = token_result
        
        # Check if token is expired
        if datetime.now() > expires_at:
            raise ValueError("This invitation has expired. Please contact the administrator for a new invitation.")
        
        # Check if already processed
        if status != 'pending':
            raise ValueError("This invitation has already been processed")
        
        # Update user status in database
        user_query = """
            UPDATE users 
            SET invite_status = 'approved'
            WHERE email = %s
            RETURNING id, email, name, role;
        """
        
        cursor.execute(user_query, (user_email,))
        result = cursor.fetchone()
        
        if not result:
            raise ValueError("User not found")
        
        user_name = result[2]
        
        # Mark token as approved
        update_token_query = """
            UPDATE invite_tokens
            SET status = 'approved'
            WHERE token = %s;
        """
        
        cursor.execute(update_token_query, (token,))
        conn.commit()
        
        # Notify admin
        email_service.send_approval_notification_to_admin(user_email, user_name, admin_email)
        
        return {
            'id': str(result[0]),
            'email': result[1],
            'name': result[2],
            'role': result[3],
            'status': 'approved'
        }
        
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def reject_invite(token: str, admin_email: str):
    """Reject user invitation"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Verify token exists and is valid
        token_query = """
            SELECT email, status, expires_at
            FROM invite_tokens
            WHERE token = %s;
        """
        
        cursor.execute(token_query, (token,))
        token_result = cursor.fetchone()
        
        if not token_result:
            raise ValueError("Invalid or expired invitation token")
        
        user_email, status, expires_at = token_result
        
        # Check if token is expired
        if datetime.now() > expires_at:
            raise ValueError("This invitation has expired")
        
        # Check if already processed
        if status != 'pending':
            raise ValueError("This invitation has already been processed")
        
        # Update user status in database
        user_query = """
            UPDATE users 
            SET invite_status = 'rejected'
            WHERE email = %s
            RETURNING id, email, name, role;
        """
        
        cursor.execute(user_query, (user_email,))
        result = cursor.fetchone()
        
        if not result:
            raise ValueError("User not found")
        
        user_name = result[2]
        
        # Mark token as rejected
        update_token_query = """
            UPDATE invite_tokens
            SET status = 'rejected'
            WHERE token = %s;
        """
        
        cursor.execute(update_token_query, (token,))
        conn.commit()
        
        # Notify admin
        email_service.send_rejection_notification_to_admin(user_email, user_name, admin_email)
        
        return {
            'id': str(result[0]),
            'email': result[1],
            'name': result[2],
            'role': result[3],
            'status': 'rejected'
        }
        
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def update_user_role(user_id: str, role: str, admin_name: str):
    """Update user role (admin only)"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Get old role first
        cursor.execute("SELECT email, name, role FROM users WHERE id = %s", (user_id,))
        old_data = cursor.fetchone()
        
        if not old_data:
            raise ValueError("User not found")
        
        old_email, old_name, old_role = old_data
        
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
        
        user_data = {
            'id': str(result[0]),
            'email': result[1],
            'name': result[2],
            'role': result[3],
            'created_at': result[4]
        }
        
        # Send role change notification
        email_service.send_role_changed_email(old_email, old_name, old_role, role, admin_name)
        
        return user_data
        
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def delete_user(user_id: str, admin_name: str):
    """Delete user (admin only)"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Get user data first for email notification
        cursor.execute("SELECT email, name, role FROM users WHERE id = %s", (user_id,))
        user_data = cursor.fetchone()
        
        if not user_data:
            raise ValueError("User not found")
        
        user_email, user_name, user_role = user_data
        
        # Prevent deletion of admin role users
        if user_role == 'presales_admin':
            raise ValueError("Cannot delete admin users. Please change their role first if needed.")
        
        query = """
            DELETE FROM users 
            WHERE id = %s
            RETURNING id, email;
        """
        
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()
        conn.commit()
        
        # Send removal notification
        email_service.send_user_removed_email(user_email, user_name, admin_name)
        
        return {
            'id': str(result[0]),
            'email': result[1]
        }
        
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()