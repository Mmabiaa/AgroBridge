from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    date: Optional[datetime] = None
    created_by: int

class EventCreate(EventBase):
    pass

class EventOut(EventBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True 