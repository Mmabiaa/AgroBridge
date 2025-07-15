from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database

router = APIRouter(prefix="/reminders", tags=["reminders"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.reminder.ReminderOut)
def create_reminder(reminder: schemas.reminder.ReminderCreate, db: Session = Depends(get_db)):
    db_reminder = models.reminder.Reminder(**reminder.dict())
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

@router.get("/", response_model=List[schemas.reminder.ReminderOut])
def list_reminders(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.reminder.Reminder).filter(models.reminder.Reminder.user_id == user_id).all() 