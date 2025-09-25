from sqlalchemy import Column, Integer, String, Boolean, Enum, JSON
from sqlalchemy.orm import relationship
from ..database import Base
import enum

class UserRole(str, enum.Enum):
    farmer = "farmer"
    poultry_keeper = "poultry_keeper"
    buyer = "buyer"
    ngo = "ngo"
    admin = "admin"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    role = Column(Enum(UserRole), default=UserRole.farmer)
    permissions = Column(JSON, default=dict)  # Store role-specific permissions
    profile_data = Column(JSON, default=dict)  # Store additional profile information 