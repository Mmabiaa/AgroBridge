from sqlalchemy import Column, Integer, String, Float, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit = Column(String)
    category = Column(String)
    image = Column(String)
    is_organic = Column(Boolean, default=False)
    harvest_date = Column(Date)
    location = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id")) 