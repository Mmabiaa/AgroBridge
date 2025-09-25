from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base
from datetime import datetime

class GPTLog(Base):
    __tablename__ = "gpt_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    query = Column(String)
    image_url = Column(String)
    response = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow) 