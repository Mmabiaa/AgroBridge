from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base
from datetime import datetime

class SensorData(Base):
    __tablename__ = "sensor_data"
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("users.id"))
    temperature = Column(Float)
    moisture = Column(Float)
    humidity = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow) 