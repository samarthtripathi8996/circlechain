from pydantic import BaseModel
from datetime import datetime
from models.material import MaterialType, MaterialStatus
from typing import Optional

class RawMaterialCreate(BaseModel):
    name: str
    material_type: MaterialType
    quantity: float
    price_per_kg: float

class RawMaterialResponse(BaseModel):
    id: int
    name: str
    material_type: MaterialType
    quantity: float
    price_per_kg: float
    status: MaterialStatus
    recycler_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class MaterialPurchaseCreate(BaseModel):
    material_id: int
    quantity: float

class MaterialPurchaseResponse(BaseModel):
    id: int
    quantity: float
    total_price: float
    producer_id: int
    material_id: int
    created_at: datetime
    material: RawMaterialResponse

    class Config:
        from_attributes = True