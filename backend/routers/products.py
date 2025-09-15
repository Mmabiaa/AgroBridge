from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, database
from ..models.user import User
from fastapi.security.oauth2 import OAuth2PasswordBearer
from jose import JWTError, jwt
from ..config import settings

router = APIRouter(prefix="/products", tags=["products"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == username).first()
    if user is None:
        raise credentials_exception
    return user

@router.get("/", response_model=List[schemas.product.ProductOut])
def list_products(
    db: Session = Depends(get_db),
    skip: int = 0, 
    limit: int = 100,
    category: Optional[str] = None,
    location: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    organic_only: bool = False
):
    query = db.query(models.product.Product)
    
    if category:
        query = query.filter(models.product.Product.category == category)
    if location:
        query = query.filter(models.product.Product.location.ilike(f"%{location}%"))
    if min_price is not None:
        query = query.filter(models.product.Product.price >= min_price)
    if max_price is not None:
        query = query.filter(models.product.Product.price <= max_price)
    if organic_only:
        query = query.filter(models.product.Product.is_organic == True)
    
    return query.offset(skip).limit(limit).all()

@router.get("/{product_id}", response_model=schemas.product.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(models.product.Product).filter(models.product.Product.id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@router.post("/", response_model=schemas.product.ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    product: schemas.product.ProductCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_product = models.product.Product(
        **product.dict(exclude_unset=True),
        owner_id=current_user.id
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/{product_id}", response_model=schemas.product.ProductOut)
def update_product(
    product_id: int, 
    product: schemas.product.ProductCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_product = db.query(models.product.Product).filter(models.product.Product.id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    if db_product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this product")
    
    update_data = product.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_product = db.query(models.product.Product).filter(models.product.Product.id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    if db_product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this product")
    
    db.delete(db_product)
    db.commit()
    return {"ok": True}