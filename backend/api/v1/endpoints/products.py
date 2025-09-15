from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
import shutil
import os
import uuid

from core.security import get_current_active_user
from db import get_db
from models.product import Product, ProductCategory
from models.user import User
from schemas.product import ProductCreate, ProductUpdate, ProductOut, ProductInDB
from core.config import settings

router = APIRouter()

def save_upload_file(upload_file: UploadFile, destination: str) -> str:
    try:
        os.makedirs(os.path.dirname(destination), exist_ok=True)
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
    finally:
        upload_file.file.close()
    return destination

@router.get("/", response_model=List[ProductOut])
def list_products(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    category: Optional[ProductCategory] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    user_id: Optional[int] = None,
) -> Any:
    """
    Retrieve products with optional filtering.
    """
    query = db.query(Product)
    
    if category:
        query = query.filter(Product.category == category)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) | 
            (Product.description.ilike(f"%{search}%"))
        )
    if user_id is not None:
        query = query.filter(Product.owner_id == user_id)
    
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=ProductOut, status_code=201)
def create_product(
    *,
    db: Session = Depends(get_db),
    name: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    category: ProductCategory = Form(...),
    quantity: int = Form(1),
    unit: str = Form("kg"),
    is_organic: bool = Form(False),
    image: UploadFile = File(None),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create new product.
    """
    image_url = None
    if image:
        # Generate a unique filename
        file_ext = os.path.splitext(image.filename)[1]
        filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, "products", filename)
        save_upload_file(image, file_path)
        image_url = f"/static/products/{filename}"
    
    product_in = ProductCreate(
        name=name,
        description=description,
        price=price,
        category=category,
        quantity=quantity,
        unit=unit,
        is_organic=is_organic,
        image_url=image_url,
    )
    
    product = Product(**product_in.dict(), owner_id=current_user.id)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.get("/{product_id}", response_model=ProductOut)
def read_product(
    *,
    db: Session = Depends(get_db),
    product_id: int,
) -> Any:
    """
    Get product by ID.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    *,
    db: Session = Depends(get_db),
    product_id: int,
    product_in: ProductUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update a product.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_data = product_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}", response_model=dict)
def delete_product(
    *,
    db: Session = Depends(get_db),
    product_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Delete a product.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Delete associated image if exists
    if product.image_url and os.path.exists(product.image_url.lstrip('/')):
        os.remove(product.image_url.lstrip('/'))
    
    db.delete(product)
    db.commit()
    return {"ok": True}
