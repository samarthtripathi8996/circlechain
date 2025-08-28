from pydantic import BaseModel
from datetime import datetime
from models.order import OrderStatus
from schemas.product import ProductResponse

class OrderCreate(BaseModel):
    product_id: int
    quantity: int = 1

class OrderResponse(BaseModel):
    id: int
    quantity: int
    total_price: float
    status: OrderStatus
    consumer_id: int
    product_id: int
    created_at: datetime
    product: ProductResponse

    class Config:
        from_attributes = True