from sqlalchemy import Column, Integer, String, ForeignKey, Date, Float
from sqlalchemy.orm import relationship
from ..database import Base

class Farm(Base):
  __tablename__ = "farms"
  id = Column(Integer, primary_key=True, index=True)
  user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
  location = Column(String, nullable=True)
  size_ha = Column(Float, nullable=True)
  crops = relationship("Crop", back_populates="farm", cascade="all, delete-orphan")

class Crop(Base):
  __tablename__ = "crops"
  id = Column(Integer, primary_key=True, index=True)
  farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False, index=True)
  crop_type = Column(String, nullable=False)
  planted_date = Column(Date, nullable=True)
  expected_harvest = Column(Date, nullable=True)
  farm = relationship("Farm", back_populates="crops") 