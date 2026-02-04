"""
Email Service Module
Sends notification emails for user management actions
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

# Email configuration from environment variables
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")

def send_user_added_email(user_email: str, user_name: str, role: str, admin_name: str):
    """
    Send email to user when they are added to the system by an admin
    
    Args:
        user_email: User's email address
        user_name: User's name
        role: User's role (presales_viewer, presales_creator, presales_admin)
        admin_name: Name of the admin who added them
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print("⚠️ Warning: Email configuration missing. Email not sent.")
        return False
    
    role_labels = {
        'presales_admin': 'Presales Admin',
        'presales_creator': 'Presales Creator',
        'presales_viewer': 'Presales Viewer',
    }
    role_label = role_labels.get(role, role)
    
    subject = "🎉 Welcome to Flux - Your Account Has Been Created"
    
    body = f"""
Hello {user_name},

Great news! Your Flux account has been created by {admin_name}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Email:        {user_email}
 Name:         {user_name}
 Role:         {role_label}
 Added by:     {admin_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You can now log in to the Flux Presales Tracking System using your Google account:
 https://flux.yourcompany.com

Get started by:
1. Signing in with your @google.com email
2. Exploring the opportunities dashboard
3. Managing your presales pipeline

Your role ({role_label}) gives you the following permissions:
"""
    
    if role == 'presales_admin':
        body += """
 View all opportunities
 Create new opportunities
Edit opportunities
 Delete opportunities
 Manage users
"""
    elif role == 'presales_creator':
        body += """
 View all opportunities
 Create new opportunities
 Edit opportunities (admin only)
 Delete opportunities (admin only)
Manage users (admin only)
"""
    else:  # presales_viewer
        body += """
 View all opportunities
 Create opportunities (creator/admin only)
 Edit opportunities (creator/admin only)
 Delete opportunities (admin only)
 Manage users (admin only)
"""
    
    body += f"""

If you have any questions, please contact the administrator at {ADMIN_EMAIL}.

Best regards,
The Flux Team
    """
    
    return send_email(user_email, subject, body)

def send_role_changed_email(user_email: str, user_name: str, old_role: str, new_role: str, admin_name: str):
    """
    Send email to user when their role is changed by an admin
    
    Args:
        user_email: User's email address
        user_name: User's name
        old_role: Previous role
        new_role: New role
        admin_name: Name of the admin who changed the role
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print("⚠️ Warning: Email configuration missing. Email not sent.")
        return False
    
    role_labels = {
        'presales_admin': 'Presales Admin',
        'presales_creator': 'Presales Creator',
        'presales_viewer': 'Presales Viewer',
    }
    old_role_label = role_labels.get(old_role, old_role)
    new_role_label = role_labels.get(new_role, new_role)
    
    subject = "🔄 Your Flux Role Has Been Updated"
    
    body = f"""
Hello {user_name},

Your role in the Flux Presales Tracking System has been updated by {admin_name}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email:        {user_email}
 Name:         {user_name}
 Previous Role: {old_role_label}
 New Role:      {new_role_label}
 Updated by:   {admin_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your new role ({new_role_label}) gives you the following permissions:
"""
    
    if new_role == 'presales_admin':
        body += """
 View all opportunities
 Create new opportunities
 Edit opportunities
 Delete opportunities
 Manage users
"""
    elif new_role == 'presales_creator':
        body += """
 View all opportunities
 Create new opportunities
 Edit opportunities (admin only)
 Delete opportunities (admin only)
 Manage users (admin only)
"""
    else:  # presales_viewer
        body += """
 View all opportunities
 Create opportunities (creator/admin only)
 Edit opportunities (creator/admin only)
 Delete opportunities (admin only)
Manage users (admin only)
"""
    
    body += f"""

If you have any questions about this change, please contact the administrator at {ADMIN_EMAIL}.

Best regards,
The Flux Team
    """
    
    return send_email(user_email, subject, body)

def send_user_removed_email(user_email: str, user_name: str, admin_name: str):
    """
    Send email to user when they are removed from the system by an admin
    
    Args:
        user_email: User's email address
        user_name: User's name
        admin_name: Name of the admin who removed them
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print(" Warning: Email configuration missing. Email not sent.")
        return False
    
    subject = " Your Flux Account Has Been Removed"
    
    body = f"""
Hello {user_name},

Your access to the Flux Presales Tracking System has been removed by {admin_name}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Email:        {user_email}
 Name:         {user_name}
 Removed by:   {admin_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You will no longer be able to access the Flux system. If you believe this is an error or would like to request access again, please contact the administrator at {ADMIN_EMAIL}.

Thank you for using Flux.

Best regards,
The Flux Team
    """
    
    return send_email(user_email, subject, body)

def send_email(to_email: str, subject: str, body: str):
    """
    Send email using SMTP
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        body: Email body (plain text)
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Attach body
        msg.attach(MIMEText(body, 'plain'))
        
        # Connect to SMTP server
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()  # Enable TLS encryption
        server.login(SMTP_USER, SMTP_PASSWORD)
        
        # Send email
        server.send_message(msg)
        server.quit()
        
        print(f" Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        print(f" Failed to send email to {to_email}")
        print(f"   Error: {e}")
        return False

# Test function (optional - for debugging)
def test_email_config():
    """Test email configuration"""
    print("\n" + "="*50)
    print("Testing Email Configuration")
    print("="*50)
    
    if not SMTP_USER:
        print(" SMTP_USER not configured")
        return False
    
    if not SMTP_PASSWORD:
        print("SMTP_PASSWORD not configured")
        return False
    
    if not ADMIN_EMAIL:
        print(" ADMIN_EMAIL not configured")
        return False
    
    print(f"SMTP_HOST: {SMTP_HOST}")
    print(f"SMTP_PORT: {SMTP_PORT}")
    print(f" SMTP_USER: {SMTP_USER}")
    print(f" ADMIN_EMAIL: {ADMIN_EMAIL}")
    print("="*50 + "\n")
    
    return True