from pydantic import BaseModel
from datetime import datetime
from models.product import ProductCategory, ProductStatus
from typing import Optional

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: ProductCategory
    price: float
    weight: Optional[float] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    weight: Optional[float] = None
    status: Optional[ProductStatus] = None

class ProductResponse(ProductBase):
    id: int
    status: ProductStatus
    impact_placeholder: float
    producer_id: int
    created_at: datetime

    class Config:
        from_attributes = True