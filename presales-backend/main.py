"""
Flux API - Production Ready for Cloud Run
FastAPI server with Google SSO, RBAC, JWT Sessions, and Email Invite Flow
FIXED VERSION - Properly handles NULL values from frontend
"""

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Union
from datetime import date, datetime, timedelta
import crud
import auth as auth
from database import test_connection, close_connector
from google.oauth2 import id_token
from google.auth.transport import requests
import os
import logging
import jwt

# Configure logging for Cloud Run
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Flux API",
    description="Presales Tracking System API",
    version="2.0.0"
)

# Environment Variables
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

if not GOOGLE_CLIENT_ID:
    logger.warning("GOOGLE_CLIENT_ID not configured")

# CORS Configuration - CRITICAL: Must be configured properly
ALLOWED_ORIGINS = [
    "https://presales-ui-455538062800.us-central1.run.app",
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Security
security = HTTPBearer()

class GoogleAuthRequest(BaseModel):
    """Google SSO token request"""
    token: str

class UserCreate(BaseModel):
    """Admin adds new user"""
    email: EmailStr
    name: str
    role: str

class UserRoleUpdate(BaseModel):
    """Admin updates user role"""
    user_id: str
    role: str

class OpportunityCreate(BaseModel):
    """
    Opportunity creation model
    FIXED: All fields except account_name are Optional and can be None
    charging_on_vector is now a string (not bool) to match UI options like "Yes", "No", "Not Yet"
    """
    account_name: str  # Only required field
    opportunity: Optional[str] = None
    region_location: Optional[str] = None
    region: Optional[str] = None
    sub_region: Optional[str] = None
    deal_value_usd: Optional[float] = None
    scoping_doc: Optional[str] = None
    vector_link: Optional[str] = None
    charging_on_vector: Optional[str] = None  # FIXED: Changed from bool to Optional[str]
    period_of_presales_weeks: Optional[int] = None
    status: Optional[str] = None
    assignee_from_gsd: Optional[str] = None
    pursuit_lead: Optional[str] = None
    delivery_manager: Optional[str] = None
    presales_start_date: Optional[date] = None
    expected_planned_start: Optional[date] = None
    sow_signature_date: Optional[date] = None
    staffing_completed_flag: Optional[bool] = False  # FIXED: Made optional with default False
    staffing_poc: Optional[str] = None
    remarks: Optional[str] = None
    
    class Config:
        # Allow None values to be passed explicitly
        use_enum_values = True
        validate_assignment = True

class OpportunityUpdate(BaseModel):
    """
    Opportunity update model
    FIXED: All fields are Optional to allow partial updates
    """
    account_name: Optional[str] = None
    opportunity: Optional[str] = None
    region_location: Optional[str] = None
    region: Optional[str] = None
    sub_region: Optional[str] = None
    deal_value_usd: Optional[float] = None
    scoping_doc: Optional[str] = None
    vector_link: Optional[str] = None
    charging_on_vector: Optional[str] = None  # FIXED: Changed from Optional[bool] to Optional[str]
    period_of_presales_weeks: Optional[int] = None
    status: Optional[str] = None
    assignee_from_gsd: Optional[str] = None
    pursuit_lead: Optional[str] = None
    delivery_manager: Optional[str] = None
    presales_start_date: Optional[date] = None
    expected_planned_start: Optional[date] = None
    sow_signature_date: Optional[date] = None
    staffing_completed_flag: Optional[bool] = None
    staffing_poc: Optional[str] = None
    remarks: Optional[str] = None
    
    class Config:
        use_enum_values = True
        validate_assignment = True

def create_jwt_token(user_email: str) -> str:
    """Create JWT token for user session"""
    expiration = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "email": user_email,
        "exp": expiration,
        "iat": datetime.utcnow()
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token

def verify_jwt_token(token: str) -> dict:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Extract and validate user from JWT token"""
    try:
        # Verify JWT token
        payload = verify_jwt_token(credentials.credentials)
        user_email = payload.get("email")
        
        if not user_email:
            logger.warning("Token missing email")
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        # Get user from database
        user = auth.get_user_by_email(user_email)
        
        if not user:
            logger.warning(f"User not found: {user_email}")
            raise HTTPException(status_code=401, detail="User not found")
        
        logger.info(f"Authenticated user: {user['email']} ({user['role']})")
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}")

def check_permission(user: dict, required_permissions: list):
    """Check if user has required permissions based on role"""
    role_permissions = {
        'presales_admin': ['view', 'create', 'edit', 'delete', 'manage_users'],
        'presales_creator': ['view', 'create', 'edit'],
        'presales_viewer': ['view']
    }
    
    user_permissions = role_permissions.get(user['role'], [])
    
    for permission in required_permissions:
        if permission not in user_permissions:
            logger.warning(f"Permission denied for {user['email']}: {permission}")
            raise HTTPException(
                status_code=403, 
                detail=f"Access denied. '{user['role']}' role cannot '{permission}'."
            )

@app.on_event("startup")
async def startup():
    """Application startup"""
    logger.info("Starting Flux API")
    logger.info(f"Environment: Cloud Run")
    logger.info(f"CORS enabled for: {ALLOWED_ORIGINS}")
    test_connection()

@app.on_event("shutdown")
async def shutdown():
    """Application shutdown"""
    logger.info("Shutting down Flux API")
    close_connector()

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Flux API",
        "version": "2.0.0",
        "status": "active",
        "environment": "production",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for Cloud Run"""
    return {"status": "healthy", "service": "flux-api"}

# ============ AUTH ENDPOINTS ============

@app.post("/auth/google")
async def google_auth(auth_request: GoogleAuthRequest):
    """Authenticate with Google SSO"""
    try:
        logger.info("Attempting Google authentication")
        
        idinfo = id_token.verify_oauth2_token(
            auth_request.token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        
        logger.info(f"Google token verified for: {email}")
        
        if not email.endswith('@google.com'):
            logger.warning(f"Rejected non-@google.com login attempt: {email}")
            raise HTTPException(
                status_code=403, 
                detail="Only @google.com accounts are allowed. Please contact admin for access."
            )
        
        user = auth.create_or_update_user(email, name)
        
        # Create JWT token for session
        jwt_token = create_jwt_token(email)
        
        logger.info(f"Successful login: {email}")
        
        return {
            "message": "Login successful",
            "user": user,
            "token": jwt_token
        }
    except ValueError as e:
        logger.error(f"Login validation error: {str(e)}")
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Login failed: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

@app.get("/auth/verify")
async def verify_token(user: dict = Depends(get_current_user)):
    """Verify JWT token and return user info"""
    return {
        "valid": True,
        "user": user
    }

# ============ INVITE APPROVAL ENDPOINTS ============

@app.get("/invite/approve")
async def approve_invite(token: str):
    """Approve user invitation"""
    try:
        result = auth.approve_invite(token, ADMIN_EMAIL)
        logger.info(f"Invite approved: {result['email']}")
        return {
            "message": "Invitation approved successfully! You can now sign in to Flux.",
            "status": "approved",
            "user": result
        }
    except ValueError as e:
        logger.error(f"Invite approval failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Invite approval error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error approving invitation: {str(e)}")

@app.get("/invite/reject")
async def reject_invite(token: str):
    """Reject user invitation"""
    try:
        result = auth.reject_invite(token, ADMIN_EMAIL)
        logger.info(f"Invite rejected: {result['email']}")
        return {
            "message": "Invitation declined. The administrator has been notified.",
            "status": "rejected",
            "user": result
        }
    except ValueError as e:
        logger.error(f"Invite rejection failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Invite rejection error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error rejecting invitation: {str(e)}")

# ============ USER MANAGEMENT ENDPOINTS ============
    
@app.get("/users/")
async def get_all_users_endpoint(user: dict = Depends(get_current_user)):
    """Get all users (admin only)"""
    check_permission(user, ['manage_users'])
    try:
        users = auth.get_all_users()
        return {"data": users}
    except Exception as e:
        logger.error(f"Failed to get users: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/users/", status_code=201)
async def add_user_endpoint(user_data: UserCreate, admin_user: dict = Depends(get_current_user)):
    """Add new user and send invitation email (admin only)"""
    check_permission(admin_user, ['manage_users'])
    try:
        if not user_data.email.endswith('@google.com'):
            raise HTTPException(
                status_code=400,
                detail="Only @google.com email addresses are allowed"
            )
        
        new_user = auth.add_user(
            user_data.email, 
            user_data.name, 
            user_data.role,
            admin_user['name']
        )
        
        logger.info(f"User added by {admin_user['email']}: {user_data.email}")
        
        return {
            "message": "User invitation sent successfully.",
            "user": new_user
        }
    except ValueError as e:
        logger.error(f"Failed to add user: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error adding user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/users/role")
async def update_user_role_endpoint(role_update: UserRoleUpdate, admin_user: dict = Depends(get_current_user)):
    """Update user role (admin only)"""
    check_permission(admin_user, ['manage_users'])
    
    try:
        updated_user = auth.update_user_role(
            role_update.user_id, 
            role_update.role,
            admin_user['name']
        )
        logger.info(f"Role updated by {admin_user['email']}: {updated_user['email']} -> {role_update.role}")
        return {"message": "User role updated successfully", "user": updated_user}
    except ValueError as e:
        logger.error(f"Failed to update role: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating role: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/users/{user_id}")
async def delete_user_endpoint(user_id: str, admin_user: dict = Depends(get_current_user)):
    """Delete user (admin only)"""
    check_permission(admin_user, ['manage_users'])
    try:
        deleted_user = auth.delete_user(user_id, admin_user['name'])
        logger.info(f"User deleted by {admin_user['email']}: {deleted_user['email']}")
        return {"message": "User deleted successfully", "user": deleted_user}
    except ValueError as e:
        logger.error(f"Failed to delete user: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ OPPORTUNITY ENDPOINTS ============

@app.post("/opportunities/", status_code=201)
async def create_opportunity(opportunity: OpportunityCreate, user: dict = Depends(get_current_user)):
    """Create new opportunity - FIXED to handle null values properly"""
    check_permission(user, ['create'])
    
    try:
        # Convert Pydantic model to dict, including None values
        data = opportunity.model_dump()
        
        # Log the incoming data for debugging
        logger.info(f"Creating opportunity with data: {data}")
        
        result = crud.create_record(data)
        logger.info(f"Opportunity created by {user['email']}: {result['id']}")
        return {"message": "Created successfully", "data": result}
    except Exception as e:
        logger.error(f"Failed to create opportunity: {str(e)}")
        logger.error(f"Data received: {opportunity.model_dump()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/opportunities/")
async def get_all_opportunities(user: dict = Depends(get_current_user)):
    """Get all opportunities"""
    check_permission(user, ['view'])
    
    try:
        results = crud.get_all_records()
        return {"count": len(results), "data": results}
    except Exception as e:
        logger.error(f"Failed to get opportunities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/opportunities/{id}")
async def get_opportunity(id: int, user: dict = Depends(get_current_user)):
    """Get opportunity by ID"""
    check_permission(user, ['view'])
    
    try:
        result = crud.get_record_by_id(id)
        if result is None:
            raise HTTPException(status_code=404, detail="Record not found")
        return {"data": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get opportunity: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/opportunities/{id}")
async def update_opportunity(id: int, opportunity: OpportunityUpdate, user: dict = Depends(get_current_user)):
    """Update opportunity by ID - FIXED to handle null values properly"""
    check_permission(user, ['edit'])
    
    try:
        # Include all fields, even if None (don't use exclude_none)
        # This allows clearing fields by setting them to null
        data = opportunity.model_dump()
        
        # Filter to only include fields that were actually provided in the request
        # This prevents overwriting fields with None if they weren't in the request
        provided_fields = {k: v for k, v in data.items() if k in opportunity.__fields_set__}
        
        if not provided_fields:
            raise HTTPException(status_code=400, detail="No data provided for update")
        
        logger.info(f"Updating opportunity {id} with fields: {list(provided_fields.keys())}")
        
        result = crud.update_record(id, provided_fields)
        if result is None:
            raise HTTPException(status_code=404, detail="Record not found")
        
        logger.info(f"Opportunity updated by {user['email']}: {id}")
        return {"message": "Updated successfully", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update opportunity: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/opportunities/{id}")
async def delete_opportunity(id: int, user: dict = Depends(get_current_user)):
    """Delete opportunity by ID"""
    check_permission(user, ['delete'])
    
    try:
        success = crud.delete_record(id)
        if not success:
            raise HTTPException(status_code=404, detail="Record not found")
        
        logger.info(f"Opportunity deleted by {user['email']}: {id}")
        return {"message": "Deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete opportunity: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))