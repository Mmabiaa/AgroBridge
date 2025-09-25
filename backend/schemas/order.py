from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class OrderBase(BaseModel):
    product_id: int
    buyer_id: int
    farmer_id: int
    quantity: int
    total_price: float
    status: Optional[str] = "pending"

class OrderCreate(OrderBase):
    pass

class OrderOut(OrderBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True 