from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, database

router = APIRouter(prefix="/sensors", tags=["sensors"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/data", response_model=schemas.sensor_data.SensorDataOut)
def create_sensor_data(data: schemas.sensor_data.SensorDataCreate, db: Session = Depends(get_db)):
    db_data = models.sensor_data.SensorData(**data.dict())
    db.add(db_data)
    db.commit()
    db.refresh(db_data)
    return db_data

@router.get("/data", response_model=List[schemas.sensor_data.SensorDataOut])
def list_sensor_data(farm_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    query = db.query(models.sensor_data.SensorData)
    if farm_id:
        query = query.filter(models.sensor_data.SensorData.farm_id == farm_id)
    return query.all() 