from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import SessionLocal
from schemas.blockchain_certificate import BlockchainCertificateCreate, BlockchainCertificateOut
from backend.models.blockchain_certificate import BlockchainCertificate

router = APIRouter(prefix="/certificates", tags=["blockchain"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/verify", response_model=BlockchainCertificateOut)
def verify_certificate(cert: BlockchainCertificateCreate, db: Session = Depends(get_db)):
    db_cert = BlockchainCertificate(**cert.dict())
    db_cert.status = "valid"
    db.add(db_cert)
    db.commit()
    db.refresh(db_cert)
    return db_cert

@router.get("/{cert_id}", response_model=BlockchainCertificateOut)
def get_certificate(cert_id: int, db: Session = Depends(get_db)):
    cert_obj = db.query(BlockchainCertificate).filter(BlockchainCertificate.id == cert_id).first()
    if not cert_obj:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return cert_obj 