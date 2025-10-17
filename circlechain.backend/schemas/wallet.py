from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class TransactionBase(BaseModel):
    tx_type: str
    amount: Optional[float] = None
    details: Optional[str] = None

class TransactionCreate(TransactionBase):
    related_id: Optional[int] = None

class TransactionResponse(TransactionBase):
    id: str
    user_id: int
    related_id: Optional[int] = None
    created_at: datetime
    status: str = "confirmed"
    
    class Config:
        from_attributes = True

class WalletBalanceResponse(BaseModel):
    balance: float
    user_id: int

class PaymentRequest(BaseModel):
    product_name: str
    amount: float
    product_id: Optional[int] = None

class RewardRequest(BaseModel):
    amount: float
    reason: str

class RecyclingRewardRequest(BaseModel):
    material_type: str
    quantity: float

class TransactionHistoryResponse(BaseModel):
    transactions: List[TransactionResponse]
    total_earned: float
    total_spent: float

class WalletSummaryResponse(BaseModel):
    balance: float
    total_earned: float
    total_spent: float
    recent_transactions: List[TransactionResponse]