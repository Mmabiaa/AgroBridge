from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReminderBase(BaseModel):
    user_id: int
    message: str
    due_date: Optional[datetime] = None
    is_completed: Optional[bool] = False

class ReminderCreate(ReminderBase):
    pass

class ReminderOut(ReminderBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True 