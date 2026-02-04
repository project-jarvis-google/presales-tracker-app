"""
Flux API - Main Application
FastAPI server with Google SSO and Role-Based Access Control
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date
import crud
import auth
from database import test_connection, close_connector
from google.oauth2 import id_token
from google.auth.transport import requests
import os

app = FastAPI(title="Flux API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "https://presales-ui-455538062800.us-central1.run.app" 
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Google OAuth Client ID from environment
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "455538062800-d4q7u1r4r8h82qjofeqev4nq5d1hbbe6.apps.googleusercontent.com")

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
    """Opportunity creation model"""
    account_name: str
    opportunity: Optional[str] = None
    region_location: Optional[str] = None
    region: Optional[str] = None
    sub_region: Optional[str] = None
    deal_value_usd: Optional[float] = None
    scoping_doc: Optional[str] = None
    vector_link: Optional[str] = None
    charging_on_vector: bool = False
    period_of_presales_weeks: Optional[int] = None
    status: Optional[str] = None
    assignee_from_gsd: Optional[str] = None
    pursuit_lead: Optional[str] = None
    delivery_manager: Optional[str] = None
    presales_start_date: Optional[date] = None
    expected_planned_start: Optional[date] = None
    sow_signature_date: Optional[date] = None
    staffing_completed_flag: bool = False
    staffing_poc: Optional[str] = None
    remarks: Optional[str] = None

class OpportunityUpdate(BaseModel):
    """Opportunity update model"""
    account_name: Optional[str] = None
    opportunity: Optional[str] = None
    region_location: Optional[str] = None
    region: Optional[str] = None
    sub_region: Optional[str] = None
    deal_value_usd: Optional[float] = None
    scoping_doc: Optional[str] = None
    vector_link: Optional[str] = None
    charging_on_vector: Optional[bool] = None
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

def get_user_from_header(request: Request):
    """Extract and validate user from request header"""
    user_id = request.headers.get("user-id") or request.headers.get("User-Id")
    
    if not user_id:
        raise HTTPException(
            status_code=401, 
            detail="Not authenticated - missing user-id header"
        )
    
    try:
        user = auth.get_user_by_email(user_id)  # Using email as ID
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}")

def check_permission(user: dict, required_permissions: list):
    """
    Check if user has required permissions based on role
    
    Role Permissions:
    - presales_admin: view, create, edit, delete, manage_users
    - presales_creator: view, create
    - presales_viewer: view
    """
    role_permissions = {
        'presales_admin': ['view', 'create', 'edit', 'delete', 'manage_users'],
        'presales_creator': ['view', 'create'],
        'presales_viewer': ['view']
    }
    
    user_permissions = role_permissions.get(user['role'], [])
    
    for permission in required_permissions:
        if permission not in user_permissions:
            raise HTTPException(
                status_code=403, 
                detail=f"Access denied. '{user['role']}' role cannot '{permission}'."
            )

@app.on_event("startup")
def startup():
    """Application startup"""
    print("\n" + "="*60)
    print(" Starting Flux API with Google SSO...") 
    print("="*60)
    test_connection()
    print("="*60 + "\n")

@app.on_event("shutdown")
def shutdown():
    """Application shutdown"""
    print("\n" + "="*60)
    print(" Shutting down Flux API...")
    print("="*60)
    close_connector()
    print(" Shutdown complete\n")

@app.post("/auth/google")
def google_auth(auth_request: GoogleAuthRequest):
    """
    Authenticate with Google SSO
    Only allows @google.com emails that are pre-approved by admin
    """
    try:
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(
            auth_request.token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        if not email.endswith('@google.com'):
            raise HTTPException(
                status_code=403, 
                detail="Only @google.com accounts are allowed. Please contact admin for access."
            )
        user = auth.create_or_update_user(email, name)
        return {
            "message": "Login successful",
            "user": user
        }
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
    
@app.get("/users/")
def get_all_users_endpoint(request: Request):
    """Get all users (admin only)"""
    user = get_user_from_header(request)
    check_permission(user, ['manage_users'])
    try:
        users = auth.get_all_users()
        return {"data": users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/users/", status_code=201)
def add_user_endpoint(user_data: UserCreate, request: Request):
    """Add new user (admin only)"""
    admin_user = get_user_from_header(request)
    check_permission(admin_user, ['manage_users'])
    try:
        # Validate @google.com email
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
        return {"message": "User added successfully", "user": new_user}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/users/role")
def update_user_role_endpoint(role_update: UserRoleUpdate, request: Request):
    """Update user role (admin only)"""
    admin_user = get_user_from_header(request)
    check_permission(admin_user, ['manage_users'])
    
    try:
        updated_user = auth.update_user_role(
            role_update.user_id, 
            role_update.role,
            admin_user['name']
        )
        return {"message": "User role updated successfully", "user": updated_user}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/users/{user_id}")
def delete_user_endpoint(user_id: str, request: Request):
    """Delete user (admin only)"""
    admin_user = get_user_from_header(request)
    check_permission(admin_user, ['manage_users'])
    try:
        deleted_user = auth.delete_user(user_id, admin_user['name'])
        return {"message": "User deleted successfully", "user": deleted_user}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def root():
    """API root endpoint"""
    return {
        "message": "Flux API with Google SSO",
        "version": "2.0.0",
        "status": "active",
        "docs": "/docs",
        "features": [
            "Google SSO Authentication",
            "Role-Based Access Control",
            "Presales Opportunity Tracking",
            "Email Notifications"
        ]
    }

@app.post("/opportunities/", status_code=201)
def create_opportunity(opportunity: OpportunityCreate, request: Request):
    """Create new opportunity (presales_creator, presales_admin)"""
    user = get_user_from_header(request)
    check_permission(user, ['create'])
    
    try:
        result = crud.create_record(opportunity.model_dump())
        return {"message": "Created successfully", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/opportunities/")
def get_all_opportunities(request: Request):
    """Get all opportunities (all roles)"""
    user = get_user_from_header(request)
    check_permission(user, ['view'])
    
    try:
        results = crud.get_all_records()
        return {"count": len(results), "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/opportunities/{id}")
def get_opportunity(id: int, request: Request):
    """Get opportunity by ID (all roles)"""
    user = get_user_from_header(request)
    check_permission(user, ['view'])
    
    try:
        result = crud.get_record_by_id(id)
        if result is None:
            raise HTTPException(status_code=404, detail="Record not found")
        return {"data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/opportunities/{id}")
def update_opportunity(id: int, opportunity: OpportunityUpdate, request: Request):
    """Update opportunity by ID (presales_admin only)"""
    user = get_user_from_header(request)
    check_permission(user, ['edit'])
    
    try:
        data = opportunity.model_dump(exclude_none=True)
        if not data:
            raise HTTPException(status_code=400, detail="No data provided for update")
        
        result = crud.update_record(id, data)
        if result is None:
            raise HTTPException(status_code=404, detail="Record not found")
        
        return {"message": "Updated successfully", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/opportunities/{id}")
def delete_opportunity(id: int, request: Request):
    """Delete opportunity by ID (presales_admin only)"""
    user = get_user_from_header(request)
    check_permission(user, ['delete'])
    
    try:
        success = crud.delete_record(id)
        if not success:
            raise HTTPException(status_code=404, detail="Record not found")
        
        return {"message": "Deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
