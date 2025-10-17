from sqlalchemy import Column, Integer, String, DateTime, Enum, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import enum

class UserRole(str, enum.Enum):
    PRODUCER = "producer"
    CONSUMER = "consumer"
    RECYCLER = "recycler"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    wallet_balance = Column(Float, default=1000.0, nullable=False)  # Initial ECT tokens
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    products = relationship("Product", back_populates="producer")
    orders = relationship("Order", back_populates="consumer") 
    recycle_requests_as_consumer = relationship("RecycleRequest", foreign_keys="RecycleRequest.consumer_id", back_populates="consumer")
    recycle_requests_as_recycler = relationship("RecycleRequest", foreign_keys="RecycleRequest.recycler_id", back_populates="recycler")
    raw_materials = relationship("RawMaterial", back_populates="recycler")
    material_purchases = relationship("MaterialPurchase", back_populates="producer")
    transaction_logs = relationship("TxLog", back_populates="user")
