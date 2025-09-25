from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from enum import Enum

class DeliveryOption(str, Enum):
    PICKUP = "Pickup"
    LOCAL_DELIVERY = "Local Delivery"
    REGIONAL_SHIPPING = "Regional Shipping"
    NATIONWIDE_SHIPPING = "Nationwide Shipping"

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    previous_price: float = Field(..., alias="previousPrice")
    unit: str
    quantity: int
    rating: float = 0.0
    category: str
    image: str
    is_organic: bool = Field(False, alias="isOrganic")
    harvest_date: date = Field(..., alias="harvestDate")
    location: str
    farmer: str
    delivery_options: List[DeliveryOption] = Field(..., alias="deliveryOptions")
    min_order: Optional[int] = Field(None, alias="minOrder")
    max_order: Optional[int] = Field(None, alias="maxOrder")
    stock_status: Optional[str] = Field(None, alias="stockStatus")

    class Config:
        allow_population_by_field_name = True
        use_enum_values = True

class ProductCreate(ProductBase):
    pass

class ProductOut(ProductBase):
    id: int
    owner_id: int = Field(..., alias="ownerId")

    class Config(ProductBase.Config):
        orm_mode = True