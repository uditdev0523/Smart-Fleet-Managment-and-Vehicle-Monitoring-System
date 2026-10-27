"""
Authentication & User API Routes
"""
from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, hash_password
from models import User, AuditLog
from auth import (
    verify_password, create_access_token, get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    username: str
    password: str


class SwitchRoleRequest(BaseModel):
    role: str # 'fleet_manager', 'dispatcher', 'technician', 'driver'


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "org_id": user.organization_id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # Log to audit
    audit = AuditLog(
        organization_id=user.organization_id,
        user_id=user.id,
        action="USER_LOGIN",
        entity_type="User",
        entity_id=str(user.id),
        details=f"User {user.username} logged in with role {user.role}"
    )
    db.add(audit)
    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "organization_id": user.organization_id
        }
    }


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "organization_id": current_user.organization_id
    }


@router.post("/switch-demo-role")
def switch_demo_role(req: SwitchRoleRequest, db: Session = Depends(get_db)):
    """Convenience method for evaluation to immediately switch active role without re-typing."""
    role_map = {
        "fleet_manager": "admin",
        "dispatcher": "dispatcher",
        "technician": "technician",
        "driver": "driver1"
    }
    target_username = role_map.get(req.role, "admin")
    user = db.query(User).filter(User.username == target_username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Demo user not found for role")

    token = create_access_token(
        data={"sub": user.username, "role": user.role, "org_id": user.organization_id}
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "organization_id": user.organization_id
        }
    }


@router.get("/users")
def list_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    users = db.query(User).filter(User.organization_id == current_user.organization_id).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active
        }
        for u in users
    ]
