from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database

router = APIRouter(prefix="/forums", tags=["forums"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.forum.ForumOut)
def create_forum(forum: schemas.forum.ForumCreate, db: Session = Depends(get_db)):
    db_forum = models.forum.Forum(**forum.dict())
    db.add(db_forum)
    db.commit()
    db.refresh(db_forum)
    return db_forum

@router.get("/", response_model=List[schemas.forum.ForumOut])
def list_forums(db: Session = Depends(get_db)):
    return db.query(models.forum.Forum).all()

@router.get("/{forum_id}", response_model=schemas.forum.ForumOut)
def get_forum(forum_id: int, db: Session = Depends(get_db)):
    forum = db.query(models.forum.Forum).filter(models.forum.Forum.id == forum_id).first()
    if not forum:
        raise HTTPException(status_code=404, detail="Forum not found")
    return forum 