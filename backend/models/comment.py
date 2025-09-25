from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base
from datetime import datetime

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    forum_id = Column(Integer, ForeignKey("forums.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow) 

class BlockchainCertificate(Base):
    __tablename__ = "blockchain_certificates"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    certificate_hash = Column(String, nullable=False)
    issued_by = Column(String)
    issued_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="valid") 