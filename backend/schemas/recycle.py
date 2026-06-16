from pydantic import BaseModel
from datetime import datetime, timezone
from models.recycle import RecycleStatus
from models.product import ProductCategory
from typing import Optional

class RecycleRequestCreate(BaseModel):
    item_description: str
    weight: Optional[float] = None
    category: ProductCategory

class RecycleRequestUpdate(BaseModel):
    status: RecycleStatus

class RecycleRequestResponse(BaseModel):
    id: int
    item_description: str
    weight: Optional[float]
    category: ProductCategory
    status: RecycleStatus
    consumer_id: int
    recycler_id: Optional[int]
    created_at: datetime
    processed_at: Optional[datetime]

    class Config:
        from_attributes = True