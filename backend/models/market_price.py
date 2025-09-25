from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, DateTime
from ..database import Base
from datetime import datetime

class MarketPrice(Base):
  __tablename__ = "market_prices"
  id = Column(Integer, primary_key=True, index=True)
  crop_type = Column(String, index=True, nullable=False)
  date = Column(Date, index=True, nullable=False)
  region = Column(String, index=True, nullable=False)
  price = Column(Float, nullable=False)

class Transaction(Base):
  __tablename__ = "transactions"
  id = Column(Integer, primary_key=True, index=True)
  user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
  type = Column(String, nullable=False)
  amount = Column(Float, nullable=False)
  created_at = Column(DateTime, default=datetime.utcnow) 