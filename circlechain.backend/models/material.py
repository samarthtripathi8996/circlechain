from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import enum

class MaterialType(str, enum.Enum):
    PLASTIC = "plastic"
    METAL = "metal"
    FABRIC = "fabric"
    GLASS = "glass"
    PAPER = "paper"
    COMPOSITE = "composite"

class MaterialStatus(str, enum.Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    SOLD = "sold"

class RawMaterial(Base):
    __tablename__ = "raw_materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    material_type = Column(Enum(MaterialType), nullable=False)
    quantity = Column(Float, nullable=False)  # kg
    price_per_kg = Column(Float, nullable=False)
    status = Column(Enum(MaterialStatus), default=MaterialStatus.AVAILABLE)
    recycler_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recycle_request_id = Column(Integer, ForeignKey("recycle_requests.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    recycler = relationship("User", back_populates="raw_materials")
    material_purchases = relationship("MaterialPurchase", back_populates="material")

class MaterialPurchase(Base):
    __tablename__ = "material_purchases"

    id = Column(Integer, primary_key=True, index=True)
    quantity = Column(Float, nullable=False)  # kg
    total_price = Column(Float, nullable=False)
    producer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("raw_materials.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    producer = relationship("User", back_populates="material_purchases")
    material = relationship("RawMaterial", back_populates="material_purchases")
