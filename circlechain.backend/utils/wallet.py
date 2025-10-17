from sqlalchemy.orm import Session
from models.user import User
from models.transaction import TxLog
from utils.transactions import log_transaction
from fastapi import HTTPException
from typing import List, Dict
import uuid
from datetime import datetime

class WalletService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_balance(self, user_id: int) -> float:
        """Get user's current wallet balance"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user.wallet_balance
    
    def update_balance(self, user_id: int, amount: float) -> float:
        """Update user's wallet balance"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.wallet_balance += amount
        if user.wallet_balance < 0:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        
        self.db.commit()
        return user.wallet_balance
    
    def process_payment(self, user_id: int, amount: float, product_name: str, product_id: int = None) -> Dict:
        """Process a payment transaction"""
        # Check if user has sufficient balance
        current_balance = self.get_user_balance(user_id)
        if current_balance < amount:
            raise HTTPException(status_code=400, detail=f"Insufficient balance. Current: {current_balance}, Required: {amount}")
        
        # Update balance
        new_balance = self.update_balance(user_id, -amount)
        
        # Log transaction
        transaction = log_transaction(
            self.db,
            tx_type="payment",
            user_id=user_id,
            related_id=product_id,
            amount=amount,
            details=f"Payment for {product_name}"
        )
        
        return {
            "transaction_id": f"tx_{transaction.id}_{uuid.uuid4().hex[:8]}",
            "amount": amount,
            "new_balance": new_balance,
            "product_name": product_name,
            "status": "confirmed",
            "timestamp": transaction.created_at
        }
    
    def process_reward(self, user_id: int, amount: float, reason: str) -> Dict:
        """Process a reward transaction"""
        # Update balance
        new_balance = self.update_balance(user_id, amount)
        
        # Log transaction
        transaction = log_transaction(
            self.db,
            tx_type="reward",
            user_id=user_id,
            amount=amount,
            details=reason
        )
        
        return {
            "transaction_id": f"tx_{transaction.id}_{uuid.uuid4().hex[:8]}",
            "amount": amount,
            "new_balance": new_balance,
            "reason": reason,
            "status": "confirmed",
            "timestamp": transaction.created_at
        }
    
    def process_recycling_reward(self, user_id: int, material_type: str, quantity: float) -> Dict:
        """Process recycling reward based on material type and quantity"""
        reward_rates = {
            "plastic": 10,
            "metal": 15,
            "glass": 8,
            "paper": 5,
            "fabric": 12,
            "composite": 20
        }
        
        base_reward = reward_rates.get(material_type.lower(), 10)
        total_reward = base_reward * quantity
        
        return self.process_reward(
            user_id, 
            total_reward, 
            f"Recycling reward for {quantity} {material_type} items"
        )
    
    def get_transaction_history(self, user_id: int, limit: int = 50) -> List[Dict]:
        """Get user's transaction history"""
        transactions = self.db.query(TxLog).filter(
            TxLog.user_id == user_id
        ).order_by(TxLog.created_at.desc()).limit(limit).all()
        
        return [
            {
                "id": f"tx_{tx.id}_{uuid.uuid4().hex[:8]}",
                "tx_type": tx.tx_type,
                "amount": tx.amount or 0,
                "details": tx.details or "",
                "created_at": tx.created_at,
                "status": "confirmed",
                "user_id": tx.user_id,
                "related_id": tx.related_id
            }
            for tx in transactions
        ]
    
    def get_wallet_summary(self, user_id: int) -> Dict:
        """Get complete wallet summary for user"""
        balance = self.get_user_balance(user_id)
        transactions = self.get_transaction_history(user_id)
        
        total_earned = sum(
            tx["amount"] for tx in transactions 
            if tx["tx_type"] == "reward" and tx["amount"] > 0
        )
        
        total_spent = sum(
            tx["amount"] for tx in transactions 
            if tx["tx_type"] == "payment" and tx["amount"] > 0
        )
        
        return {
            "balance": balance,
            "total_earned": total_earned,
            "total_spent": total_spent,
            "recent_transactions": transactions[:10]  # Last 10 transactions
        }