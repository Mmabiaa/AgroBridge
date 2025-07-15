from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from models.gpt_log import GPTLog
from schemas.gpt_log import GPTLogCreate, GPTLogOut
from database import SessionLocal

router = APIRouter(prefix="/agri-gpt", tags=["agri-gpt"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/ask", response_model=GPTLogOut)
def ask_gpt(log: GPTLogCreate, db: Session = Depends(get_db)):
    db_log = GPTLog(**log.dict())
    db_log.response = "Sample response"
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.post("/detect-disease", response_model=GPTLogOut)
def detect_disease(log: GPTLogCreate, db: Session = Depends(get_db)):
    db_log = GPTLog(**log.dict())
    db_log.response = "Disease detected: None"
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/logs", response_model=List[GPTLogOut])
def list_gpt_logs(db: Session = Depends(get_db)):
    return db.query(GPTLog).all() 