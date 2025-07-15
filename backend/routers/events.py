from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database

router = APIRouter(prefix="/events", tags=["events"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.event.EventOut)
def create_event(event: schemas.event.EventCreate, db: Session = Depends(get_db)):
    db_event = models.event.Event(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.get("/", response_model=List[schemas.event.EventOut])
def list_events(db: Session = Depends(get_db)):
    return db.query(models.event.Event).all()

@router.get("/{event_id}", response_model=schemas.event.EventOut)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.event.Event).filter(models.event.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event 