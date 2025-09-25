from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import SessionLocal
from models.user import User, UserRole
from models.permissions import get_user_permissions
from models.audit_log import AuditLog
from models.market_price import MarketPrice
from models.farm import Farm, Crop
from routers.auth import get_current_user
from typing import List, Dict

router = APIRouter(prefix="/api", tags=["rbac"])

def get_db():
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()

@router.get("/navigation")
async def get_navigation(current_user: User = Depends(get_current_user)):
  role = current_user.role.value
  base = [
    {"href": "/dashboard", "label": "Dashboard"},
    {"href": "/settings", "label": "Settings"},
    {"href": "/notifications", "label": "Notifications"},
    {"href": "/support", "label": "Support"},
  ]
  role_specific: Dict[str, List[Dict]] = {
    "farmer": [
      {"href": "/monitoring", "label": "Farm Monitor"},
      {"href": "/analytics", "label": "Analytics"},
      {"href": "/agrigpt", "label": "AgriGPT"},
      {"href": "/marketplace", "label": "Marketplace"},
    ],
    "ngo": [
      {"href": "/analytics", "label": "Analytics"},
      {"href": "/community", "label": "Community"},
      {"href": "/learning", "label": "Learning"},
    ],
    "admin": [
      {"href": "/admin", "label": "Admin Panel"},
    ]
  }
  return base + role_specific.get(role, [])

@router.post("/admin/roles/{user_id}")
async def update_user_role(user_id: int, role: UserRole, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
  if current_user.role != UserRole.admin:
    raise HTTPException(status_code=403, detail="Not authorized")
  target = db.query(User).filter(User.id == user_id).first()
  if not target:
    raise HTTPException(status_code=404, detail="User not found")
  target.role = role
  db.add(AuditLog(actor_id=current_user.id, action=f"change_role_to_{role.value}", target=str(user_id)))
  db.commit()
  db.refresh(target)
  return {"id": target.id, "role": target.role.value}

@router.get("/farmers/{id}/crops")
async def get_farmer_crops(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
  if current_user.role != UserRole.admin and current_user.id != id:
    raise HTTPException(status_code=403, detail="Forbidden")
  farms = db.query(Farm).filter(Farm.user_id == id).all()
  result = []
  for farm in farms:
    for crop in farm.crops:
      result.append({
        "farm_id": farm.id,
        "crop_id": crop.id,
        "crop_type": crop.crop_type,
        "planted_date": str(crop.planted_date) if crop.planted_date else None,
        "expected_harvest": str(crop.expected_harvest) if crop.expected_harvest else None,
      })
  return result

@router.get("/market-prices")
async def get_market_prices(crop: str, region: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
  prices = db.query(MarketPrice).filter(MarketPrice.crop_type == crop, MarketPrice.region == region).order_by(MarketPrice.date.desc()).limit(30).all()
  return [{"date": str(p.date), "price": p.price} for p in prices] 