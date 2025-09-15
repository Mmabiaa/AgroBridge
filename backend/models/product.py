from sqlalchemy import Column, Integer, String, Float, Boolean, Date, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from ..database import Base
import enum

class DeliveryOptionEnum(str, enum.Enum):
    PICKUP = "Pickup"
    LOCAL_DELIVERY = "Local Delivery"
    REGIONAL_SHIPPING = "Regional Shipping"
    NATIONWIDE_SHIPPING = "Nationwide Shipping"

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    price = Column(Float)
    previous_price = Column(Float, name="previous_price")
    unit = Column(String)
    quantity = Column(Integer)
    rating = Column(Float, default=0.0)
    category = Column(String)
    image = Column(String)
    is_organic = Column(Boolean, default=False, name="is_organic")
    harvest_date = Column(Date, name="harvest_date")
    location = Column(String)
    farmer = Column(String)
    delivery_options = Column(JSON)  # Store as JSON array of DeliveryOptionEnum values
    min_order = Column(Integer, nullable=True, name="min_order")
    max_order = Column(Integer, nullable=True, name="max_order")
    stock_status = Column(String, nullable=True, name="stock_status")
    
    # Relationships
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="products")