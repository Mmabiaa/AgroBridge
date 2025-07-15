from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ForumBase(BaseModel):
    title: str
    description: Optional[str] = None
    created_by: int

class ForumCreate(ForumBase):
    pass

class ForumOut(ForumBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True 