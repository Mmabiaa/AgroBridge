from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GPTLogBase(BaseModel):
    user_id: int
    query: Optional[str] = None
    image_url: Optional[str] = None
    response: Optional[str] = None

class GPTLogCreate(GPTLogBase):
    pass

class GPTLogOut(GPTLogBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True 