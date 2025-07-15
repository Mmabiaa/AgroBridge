from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SensorDataBase(BaseModel):
    farm_id: int
    temperature: Optional[float] = None
    moisture: Optional[float] = None
    humidity: Optional[float] = None

class SensorDataCreate(SensorDataBase):
    pass

class SensorDataOut(SensorDataBase):
    id: int
    timestamp: datetime

    class Config:
        orm_mode = True 