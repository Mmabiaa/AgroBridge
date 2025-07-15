from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PlanBase(BaseModel):
    user_id: int
    name: str
    budget: Optional[float] = None
    description: Optional[str] = None

class PlanCreate(PlanBase):
    pass

class PlanOut(PlanBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True 