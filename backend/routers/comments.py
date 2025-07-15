from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database

router = APIRouter(prefix="/comments", tags=["comments"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.comment.CommentOut)
def create_comment(comment: schemas.comment.CommentCreate, db: Session = Depends(get_db)):
    db_comment = models.comment.Comment(**comment.dict())
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

@router.get("/", response_model=List[schemas.comment.CommentOut])
def list_comments(forum_id: int, db: Session = Depends(get_db)):
    return db.query(models.comment.Comment).filter(models.comment.Comment.forum_id == forum_id).all() 