
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import enum

class ProductCategory(str, enum.Enum):
    ELECTRONICS = "electronics"
    TEXTILES = "textiles" 
    PACKAGING = "packaging"
    FURNITURE = "furniture"
    OTHER = "other"

class ProductStatus(str, enum.Enum):
    AVAILABLE = "available"
    SOLD = "sold"
    OUT_OF_STOCK = "out_of_stock"

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    category = Column(Enum(ProductCategory), nullable=False)
    price = Column(Float, nullable=False)
    weight = Column(Float)  # kg
    status = Column(Enum(ProductStatus), default=ProductStatus.AVAILABLE)
    impact_placeholder = Column(Float, default=0.0)  # CO₂ equivalent
    producer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    producer = relationship("User", back_populates="products")
    orders = relationship("Order", back_populates="product")