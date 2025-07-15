from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database

router = APIRouter(prefix="/products", tags=["products"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[schemas.product.ProductOut])
def list_products(db: Session = Depends(get_db)):
    return db.query(models.product.Product).all()

@router.post("/", response_model=schemas.product.ProductOut)
def create_product(product: schemas.product.ProductCreate, db: Session = Depends(get_db)):
    db_product = models.product.Product(**product.dict(), owner_id=1)  # TODO: Replace with real user ID from auth
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product 