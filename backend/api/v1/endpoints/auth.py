from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from core import security
from core.config import settings
from core.security import get_password_hash
from db import get_db
from models.user import User, UserRole
from schemas.token import Token
from schemas.user import UserCreate, UserInDB, UserOut
from utils import send_new_account_email

router = APIRouter()

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """
    Create new user.
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    # Create new user
    user_data = user_in.dict(exclude={"password"})
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        **user_data,
        hashed_password=hashed_password,
        is_active=True,
        is_superuser=False,
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Send welcome email
    if settings.EMAILS_ENABLED and user_in.email:
        send_new_account_email(
            email_to=user_in.email, 
            username=user_in.email,
            password=user_in.password
        )
    
    return db_user

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
        "user": user,
    }

@router.post("/test-token", response_model=UserOut)
def test_token(current_user: User = Depends(security.get_current_user)) -> Any:
    """
    Test access token
    """
    return current_user
