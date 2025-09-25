from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import SessionLocal
from backend.models.order import Order
from schemas.order import OrderCreate, OrderOut

router = APIRouter(prefix="/orders", tags=["orders"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=OrderOut)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    db_order = Order(**order.dict())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@router.get("/", response_model=List[OrderOut])
def list_orders(buyer_id: Optional[int] = Query(None), farmer_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    print("Order:", Order, type(Order))
    print("db:", db, type(db))
    query = db.query(Order)
    if buyer_id is not None:
        query = query.filter(Order.buyer_id == buyer_id)
    if farmer_id is not None:
        query = query.filter(Order.farmer_id == farmer_id)
    return query.all()

@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/{order_id}/status", response_model=OrderOut)
def update_order_status(order_id: int, status: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status
    db.commit()
    db.refresh(order)
    return order 