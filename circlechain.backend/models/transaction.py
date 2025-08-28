from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class TxLog(Base):
    __tablename__ = "transaction_logs"

    id = Column(Integer, primary_key=True, index=True)
    tx_type = Column(String, nullable=False)  # "product_sale", "recycle_request", "material_purchase"
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    related_id = Column(Integer, nullable=True)  # ID of related record
    amount = Column(Float, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="transaction_logs")
