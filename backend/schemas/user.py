from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from ..models.user import UserRole

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    is_active: bool
    permissions: Optional[List[str]] = []
    profile_data: Optional[Dict[str, Any]] = {}

    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    profile_data: Optional[Dict[str, Any]] = None

class UserPermissions(BaseModel):
    role: str
    permissions: List[str]
    accessible_routes: List[str] 