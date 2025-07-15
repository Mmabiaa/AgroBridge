from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BlockchainCertificateBase(BaseModel):
    product_id: int
    certificate_hash: str
    issued_by: Optional[str] = None
    status: Optional[str] = "valid"

class BlockchainCertificateCreate(BlockchainCertificateBase):
    pass

class BlockchainCertificateOut(BlockchainCertificateBase):
    id: int
    issued_at: datetime

    class Config:
        orm_mode = True 