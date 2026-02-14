"""
Email Service Module - SMTP with App Password
Sends notification emails for user management with approval/rejection flow
Production-ready version for Cloud Run deployment
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

# Email configuration from environment variables
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
APP_BASE_URL = os.getenv("APP_BASE_URL", "https://presales-backend-455538062800.us-central1.run.app")

# SMTP Settings (App Password Method)
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")  # Your Gmail address
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")  # Your Gmail App Password
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL")  # Email address shown as sender

def send_invite_email(user_email: str, user_name: str, role: str, admin_name: str, invite_token: str):
    """
    Send invitation email to user with approve/reject links
    
    Args:
        user_email: User's email address
        user_name: User's name
        role: User's role (presales_viewer, presales_creator, presales_admin)
        admin_name: Name of the admin who added them
        invite_token: Unique invite token for this invitation
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    if not SMTP_FROM_EMAIL:
        print(" SMTP_FROM_EMAIL not configured in .env file")
        return False
    
    approve_url = f"{APP_BASE_URL}/invite/approve?token={invite_token}"
    reject_url = f"{APP_BASE_URL}/invite/reject?token={invite_token}"
    
    role_labels = {
        'presales_admin': 'Presales Admin',
        'presales_creator': 'Presales Creator',
        'presales_viewer': 'Presales Viewer',
    }
    role_label = role_labels.get(role, role)
    
    subject = "You've Been Invited to Join Flux"
    
    body = f"""
Hello {user_name},

Great news! You've been invited to join the Flux Presales Tracking System by {admin_name}.

Please verify the below details:
 Email:        {user_email}
 Name:         {user_name}
 Role:         {role_label}
 Invited by:   {admin_name}

Your role ({role_label}) will give you the following permissions:
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
"""
    else:  # presales_viewer
        body += """
 View all opportunities
"""
    body += f"""
 ACTION REQUIRED
Please click one of the links below to respond to this invitation:

 ACCEPT INVITATION
   {approve_url}

 DECLINE INVITATION
   {reject_url}

If you accept, you'll be able to sign in using your Google account at:
 {APP_BASE_URL}

This invitation will expire in 7 days.

If you have any questions, please contact {admin_name} at {ADMIN_EMAIL}.

Best regards,
The Flux Team
    """
    
    return send_email(user_email, subject, body)

def send_approval_notification_to_admin(user_email: str, user_name: str, admin_email: str):
    """
    Notify admin that user accepted the invitation
    
    Args:
        user_email: User's email address
        user_name: User's name
        admin_email: Admin's email address
    
    Returns:
        bool: True if email sent successfully
    """
    subject = f" {user_name} Accepted Your Flux Invitation"
    
    body = f"""
Hello,

Good news! {user_name} ({user_email}) has accepted your invitation to join Flux.

User:         {user_name}
 Email:        {user_email}
 Status:       ACCEPTED 

The user can now sign in to Flux using their Google account.
You can manage their permissions at any time through the People Management page.

Best regards,
The Flux Team
    """
    
    return send_email(admin_email, subject, body)

def send_rejection_notification_to_admin(user_email: str, user_name: str, admin_email: str):
    """
    Notify admin that user rejected the invitation
    
    Args:
        user_email: User's email address
        user_name: User's name
        admin_email: Admin's email address
    
    Returns:
        bool: True if email sent successfully
    """
    subject = f" {user_name} Declined Your Flux Invitation"
    
    body = f"""
Hello,

{user_name} ({user_email}) has declined your invitation to join Flux.

User:         {user_name}
 Email:        {user_email}
 Status:       DECLINED 

The user account has not been activated. If you believe this was a mistake, 
you can send another invitation through the People Management page.

Best regards,
The Flux Team
    """
    
    return send_email(admin_email, subject, body)

def send_user_added_email(user_email: str, user_name: str, role: str, admin_name: str):
    """
    Send email to user when they are added to the system by an admin
    (Legacy function - use send_invite_email instead)
    """
    # This function is deprecated - invites now require a token
    print(" Warning: send_user_added_email is deprecated. Use send_invite_email instead.")
    return False

def send_role_changed_email(user_email: str, user_name: str, old_role: str, new_role: str, admin_name: str):
    """
    Send email to user when their role is changed by an admin
    """
    role_labels = {
        'presales_admin': 'Presales Admin',
        'presales_creator': 'Presales Creator',
        'presales_viewer': 'Presales Viewer',
    }
    old_role_label = role_labels.get(old_role, old_role)
    new_role_label = role_labels.get(new_role, new_role)
    
    subject = "Your Flux Role Has Been Updated"
    
    body = f"""
Hello {user_name},

Your role in the Flux Presales Tracking System has been updated by {admin_name}.

 Email:         {user_email}
 Name:          {user_name}
 Previous Role: {old_role_label}
 New Role:      {new_role_label}
 Updated by:    {admin_name}

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
"""
    else:  # presales_viewer
        body += """
 View all opportunities
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
    """
    subject = " Your Flux Account Has Been Removed"
    
    body = f"""
Hello {user_name},

Your access to the Flux Presales Tracking System has been removed by {admin_name}.

 Email:        {user_email}
 Name:         {user_name}
 Removed by:   {admin_name}

You will no longer be able to access the Flux system. If you believe this is an error 
or would like to request access again, please contact the administrator at {ADMIN_EMAIL}.

Thank you for using Flux.

Best regards,
The Flux Team
    """
    
    return send_email(user_email, subject, body)

def send_email(to_email: str, subject: str, body: str):
    """
    Send email using SMTP with app password
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        body: Email body (plain text)
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        print(f" Preparing to send email to {to_email}")
        
        # Validate configuration
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            print(" SMTP credentials not configured")
            print("   Please set SMTP_USERNAME and SMTP_PASSWORD in .env")
            return False
        
        # Create message
        message = MIMEMultipart()
        message['From'] = SMTP_FROM_EMAIL or SMTP_USERNAME
        message['To'] = to_email
        message['Subject'] = subject
        
        message.attach(MIMEText(body, 'plain'))
        
        # Connect to SMTP server and send email
        print(f" Connecting to {SMTP_SERVER}:{SMTP_PORT}...")
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.set_debuglevel(0)  # Set to 1 for verbose debugging
            
            # Start TLS encryption
            print(" Starting TLS encryption...")
            server.starttls()
            
            # Login
            print(" Logging in...")
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            
            # Send email
            print("Sending email...")
            server.send_message(message)
        
        print(f" Email sent successfully to {to_email}")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f" SMTP Authentication failed")
        print(f"   Error: {e}")
        print(f"\nTroubleshooting:")
        print(f"   1. Verify SMTP_USERNAME is correct")
        print(f"   2. Verify SMTP_PASSWORD is a valid App Password")
        print(f"   3. For Gmail, enable 2-Step Verification and generate App Password")
        print(f"   4. App Password format: 16 characters, no spaces")
        return False
        
    except smtplib.SMTPException as e:
        print(f" SMTP error occurred")
        print(f"   Error: {e}")
        print(f"\n Troubleshooting:")
        print(f"   1. Check SMTP_SERVER and SMTP_PORT settings")
        print(f"   2. Verify network connectivity")
        print(f"   3. Check if SMTP is blocked by firewall")
        return False
        
    except Exception as e:
        print(f" Failed to send email to {to_email}")
        print(f"   Error: {e}")
        return False