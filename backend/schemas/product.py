from pydantic import BaseModel
from typing import Optional
from datetime import date

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    quantity: int
    unit: Optional[str] = None
    category: Optional[str] = None
    image: Optional[str] = None
    is_organic: Optional[bool] = False
    harvest_date: Optional[date] = None
    location: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductOut(ProductBase):
    id: int
    owner_id: int

    class Config:
        orm_mode = True 