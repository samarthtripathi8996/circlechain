# models/recycle.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
from models.product import ProductCategory
import enum

class RecycleStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    ACCEPTED = "accepted"
    IN_PROCESS = "in_process"
    COMPLETED = "completed"
    REJECTED = "rejected"

class RecycleRequest(Base):
    __tablename__ = "recycle_requests"

    id = Column(Integer, primary_key=True, index=True)
    item_description = Column(String, nullable=False)
    weight = Column(Float)  # kg
    category = Column(Enum(ProductCategory), nullable=False)
    status = Column(Enum(RecycleStatus), default=RecycleStatus.SUBMITTED)
    consumer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recycler_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    consumer = relationship("User", foreign_keys=[consumer_id], back_populates="recycle_requests_as_consumer")
    recycler = relationship("User", foreign_keys=[recycler_id], back_populates="recycle_requests_as_recycler")