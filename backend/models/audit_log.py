from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from ..database import Base

class AuditLog(Base):
  __tablename__ = "audit_logs"
  id = Column(Integer, primary_key=True, index=True)
  actor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
  action = Column(String, nullable=False)
  target = Column(String, nullable=True)
  timestamp = Column(DateTime, default=datetime.utcnow) 