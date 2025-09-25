from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database

router = APIRouter(prefix="/plans", tags=["plans"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.plan.PlanOut)
def create_plan(plan: schemas.plan.PlanCreate, db: Session = Depends(get_db)):
    db_plan = models.plan.Plan(**plan.dict())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.get("/", response_model=List[schemas.plan.PlanOut])
def list_plans(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.plan.Plan).filter(models.plan.Plan.user_id == user_id).all() 