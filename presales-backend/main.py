"""
Flux API - Production Ready for Cloud Run
FastAPI server with Google SSO, RBAC, JWT Sessions, and Email Invite Flow
"""

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date, datetime, timedelta
import crud
import auth as auth
from database import test_connection, close_connector
from google.oauth2 import id_token
from google.auth.transport import requests
import os
import logging
import jwt

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

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

if not GOOGLE_CLIENT_ID:
    logger.warning("GOOGLE_CLIENT_ID not configured")

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

security = HTTPBearer()

# ── Auth models ───────────────────────────────────────────────────────────────

class GoogleAuthRequest(BaseModel):
    token: str

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    role: str

class UserRoleUpdate(BaseModel):
    user_id: str
    role: str


class OpportunityCreate(BaseModel):
    model_config = {"populate_by_name": True}

    account_name:             str                  # Required

    opportunity:              Optional[str]   = None
    region_location:          Optional[str]   = None
    region:                   Optional[str]   = None
    sub_region:               Optional[str]   = None
    deal_value_usd:           Optional[float] = None

    # "Estimation/pricing sheet" in DB — frontend sends as estimation_pricing_sheet
    estimation_pricing_sheet: Optional[str]   = None
    scoping_doc:              Optional[str]   = None
    # "supporting docs" in DB — frontend sends as supporting_docs
    supporting_docs:          Optional[str]   = None

    vector_link:              Optional[str]   = None
    charging_on_vector:       Optional[str]   = None
    period_of_presales_weeks: Optional[int]   = None
    status:                   Optional[str]   = None

    # "Primary POC from GSD" in DB — frontend sends as primary_poc_from_gsd
    primary_poc_from_gsd:     Optional[str]   = None
    # "supporting team" in DB — frontend sends as supporting_team
    supporting_team:          Optional[str]   = None

    pursuit_lead:             Optional[str]   = None
    delivery_manager:         Optional[str]   = None
    presales_start_date:      Optional[date]  = None
    expected_planned_start:   Optional[date]  = None
    sow_signature_date:       Optional[date]  = None
    staffing_completed_flag:  Optional[bool]  = False
    staffing_poc:             Optional[str]   = None
    remarks:                  Optional[str]   = None

    def to_db_dict(self) -> dict:
        """Map Python field names → exact DB column names for crud.py"""
        raw = self.model_dump()
        return {
            'account_name':             raw.get('account_name'),
            'opportunity':              raw.get('opportunity'),
            'region_location':          raw.get('region_location'),
            'region':                   raw.get('region'),
            'sub_region':               raw.get('sub_region'),
            'deal_value_usd':           raw.get('deal_value_usd'),
            'Estimation/pricing sheet': raw.get('estimation_pricing_sheet'),
            'scoping_doc':              raw.get('scoping_doc'),
            'supporting docs':          raw.get('supporting_docs'),
            'vector_link':              raw.get('vector_link'),
            'charging_on_vector':       raw.get('charging_on_vector'),
            'period_of_presales_weeks': raw.get('period_of_presales_weeks'),
            'status':                   raw.get('status'),
            'Primary POC from GSD':     raw.get('primary_poc_from_gsd'),
            'supporting team':          raw.get('supporting_team'),
            'pursuit_lead':             raw.get('pursuit_lead'),
            'delivery_manager':         raw.get('delivery_manager'),
            'presales_start_date':      raw.get('presales_start_date'),
            'expected_planned_start':   raw.get('expected_planned_start'),
            'sow_signature_date':       raw.get('sow_signature_date'),
            'staffing_completed_flag':  raw.get('staffing_completed_flag', False),
            'staffing_poc':             raw.get('staffing_poc'),
            'remarks':                  raw.get('remarks'),
        }


class OpportunityUpdate(BaseModel):
    model_config = {"populate_by_name": True}

    account_name:             Optional[str]   = None
    opportunity:              Optional[str]   = None
    region_location:          Optional[str]   = None
    region:                   Optional[str]   = None
    sub_region:               Optional[str]   = None
    deal_value_usd:           Optional[float] = None
    estimation_pricing_sheet: Optional[str]   = None
    scoping_doc:              Optional[str]   = None
    supporting_docs:          Optional[str]   = None
    vector_link:              Optional[str]   = None
    charging_on_vector:       Optional[str]   = None
    period_of_presales_weeks: Optional[int]   = None
    status:                   Optional[str]   = None
    primary_poc_from_gsd:     Optional[str]   = None
    supporting_team:          Optional[str]   = None
    pursuit_lead:             Optional[str]   = None
    delivery_manager:         Optional[str]   = None
    presales_start_date:      Optional[date]  = None
    expected_planned_start:   Optional[date]  = None
    sow_signature_date:       Optional[date]  = None
    staffing_completed_flag:  Optional[bool]  = None
    staffing_poc:             Optional[str]   = None
    remarks:                  Optional[str]   = None

    def to_db_dict(self) -> dict:
        """Only include fields actually sent in the request, mapped to exact DB names."""
        field_map = {
            'account_name':             'account_name',
            'opportunity':              'opportunity',
            'region_location':          'region_location',
            'region':                   'region',
            'sub_region':               'sub_region',
            'deal_value_usd':           'deal_value_usd',
            'estimation_pricing_sheet': 'Estimation/pricing sheet',
            'scoping_doc':              'scoping_doc',
            'supporting_docs':          'supporting docs',
            'vector_link':              'vector_link',
            'charging_on_vector':       'charging_on_vector',
            'period_of_presales_weeks': 'period_of_presales_weeks',
            'status':                   'status',
            'primary_poc_from_gsd':     'Primary POC from GSD',
            'supporting_team':          'supporting team',
            'pursuit_lead':             'pursuit_lead',
            'delivery_manager':         'delivery_manager',
            'presales_start_date':      'presales_start_date',
            'expected_planned_start':   'expected_planned_start',
            'sow_signature_date':       'sow_signature_date',
            'staffing_completed_flag':  'staffing_completed_flag',
            'staffing_poc':             'staffing_poc',
            'remarks':                  'remarks',
        }
        provided = {k: v for k, v in self.model_dump().items() if k in self.model_fields_set}
        return {field_map[k]: v for k, v in provided.items() if k in field_map}


# ── JWT helpers ───────────────────────────────────────────────────────────────

def create_jwt_token(user_email: str) -> str:
    expiration = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {"email": user_email, "exp": expiration, "iat": datetime.utcnow()}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = verify_jwt_token(credentials.credentials)
        user_email = payload.get("email")
        if not user_email:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        user = auth.get_user_by_email(user_email)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}")

def check_permission(user: dict, required_permissions: list):
    role_permissions = {
        'presales_admin':   ['view', 'create', 'edit', 'delete', 'manage_users'],
        'presales_creator': ['view', 'create', 'edit'],
        'presales_viewer':  ['view'],
    }
    user_permissions = role_permissions.get(user['role'], [])
    for permission in required_permissions:
        if permission not in user_permissions:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. '{user['role']}' role cannot '{permission}'."
            )

# ── Lifecycle ─────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    logger.info("Starting Flux API")
    logger.info(f"CORS enabled for: {ALLOWED_ORIGINS}")
    test_connection()

@app.on_event("shutdown")
async def shutdown():
    logger.info("Shutting down Flux API")
    close_connector()

# ── Basic endpoints ───────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "Flux API", "version": "2.0.0", "status": "active", "docs": "/docs"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "flux-api"}

# ── Auth endpoints ────────────────────────────────────────────────────────────

@app.post("/auth/google")
async def google_auth(auth_request: GoogleAuthRequest):
    try:
        idinfo = id_token.verify_oauth2_token(auth_request.token, requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo['email']
        name  = idinfo.get('name', email.split('@')[0])

        if not email.endswith('@google.com'):
            raise HTTPException(status_code=403, detail="Only @google.com accounts are allowed.")

        user      = auth.create_or_update_user(email, name)
        jwt_token = create_jwt_token(email)
        logger.info(f"Successful login: {email}")
        return {"message": "Login successful", "user": user, "token": jwt_token}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

@app.get("/auth/verify")
async def verify_token(user: dict = Depends(get_current_user)):
    return {"valid": True, "user": user}

# ── Invite endpoints ──────────────────────────────────────────────────────────

@app.get("/invite/approve")
async def approve_invite(token: str):
    try:
        result = auth.approve_invite(token, ADMIN_EMAIL)
        return {"message": "Invitation approved successfully!", "status": "approved", "user": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/invite/reject")
async def reject_invite(token: str):
    try:
        result = auth.reject_invite(token, ADMIN_EMAIL)
        return {"message": "Invitation declined.", "status": "rejected", "user": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── User management endpoints ─────────────────────────────────────────────────

@app.get("/users/")
async def get_all_users_endpoint(user: dict = Depends(get_current_user)):
    check_permission(user, ['manage_users'])
    try:
        return {"data": auth.get_all_users()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/users/", status_code=201)
async def add_user_endpoint(user_data: UserCreate, admin_user: dict = Depends(get_current_user)):
    check_permission(admin_user, ['manage_users'])
    try:
        if not user_data.email.endswith('@google.com'):
            raise HTTPException(status_code=400, detail="Only @google.com email addresses are allowed")
        new_user = auth.add_user(user_data.email, user_data.name, user_data.role, admin_user['name'])
        return {"message": "User invitation sent successfully.", "user": new_user}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/users/role")
async def update_user_role_endpoint(role_update: UserRoleUpdate, admin_user: dict = Depends(get_current_user)):
    check_permission(admin_user, ['manage_users'])
    try:
        updated_user = auth.update_user_role(role_update.user_id, role_update.role, admin_user['name'])
        return {"message": "User role updated successfully", "user": updated_user}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/users/{user_id}")
async def delete_user_endpoint(user_id: str, admin_user: dict = Depends(get_current_user)):
    check_permission(admin_user, ['manage_users'])
    try:
        deleted_user = auth.delete_user(user_id, admin_user['name'])
        return {"message": "User deleted successfully", "user": deleted_user}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Opportunity endpoints ─────────────────────────────────────────────────────

@app.post("/opportunities/", status_code=201)
async def create_opportunity(opportunity: OpportunityCreate, user: dict = Depends(get_current_user)):
    check_permission(user, ['create'])
    try:
        # to_db_dict() maps snake_case keys → exact DB column names
        data   = opportunity.to_db_dict()
        result = crud.create_record(data)
        logger.info(f"Opportunity created by {user['email']}: {result['id']}")
        return {"message": "Created successfully", "data": result}
    except Exception as e:
        logger.error(f"Failed to create opportunity: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/opportunities/")
async def get_all_opportunities(user: dict = Depends(get_current_user)):
    check_permission(user, ['view'])
    try:
        results = crud.get_all_records()
        return {"count": len(results), "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/opportunities/{id}")
async def get_opportunity(id: int, user: dict = Depends(get_current_user)):
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
async def update_opportunity(id: int, opportunity: OpportunityUpdate, user: dict = Depends(get_current_user)):
    check_permission(user, ['edit'])
    try:
        # to_db_dict() only includes fields actually sent, mapped to exact DB names
        provided_fields = opportunity.to_db_dict()
        if not provided_fields:
            raise HTTPException(status_code=400, detail="No data provided for update")

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
        raise HTTPException(status_code=500, detail=str(e))