from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from schemas.wallet import (
    WalletBalanceResponse, PaymentRequest, RewardRequest, 
    RecyclingRewardRequest, TransactionHistoryResponse, 
    WalletSummaryResponse, TransactionResponse
)
from schemas.user import UserResponse
from utils.wallet import WalletService
from typing import List

router = APIRouter(prefix="/wallet", tags=["wallet"])

@router.get("/balance", response_model=WalletBalanceResponse)
def get_wallet_balance(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's wallet balance"""
    wallet_service = WalletService(db)
    balance = wallet_service.get_user_balance(current_user.id)
    
    return WalletBalanceResponse(
        balance=balance,
        user_id=current_user.id
    )

@router.post("/payment")
def process_payment(
    payment: PaymentRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process a payment transaction"""
    wallet_service = WalletService(db)
    
    try:
        result = wallet_service.process_payment(
            user_id=current_user.id,
            amount=payment.amount,
            product_name=payment.product_name,
            product_id=payment.product_id
        )
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment processing failed: {str(e)}")

@router.post("/reward")
def process_reward(
    reward: RewardRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process a reward transaction"""
    wallet_service = WalletService(db)
    
    try:
        result = wallet_service.process_reward(
            user_id=current_user.id,
            amount=reward.amount,
            reason=reward.reason
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reward processing failed: {str(e)}")

@router.post("/recycling-reward")
def process_recycling_reward(
    recycling: RecyclingRewardRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process a recycling reward transaction"""
    wallet_service = WalletService(db)
    
    try:
        result = wallet_service.process_recycling_reward(
            user_id=current_user.id,
            material_type=recycling.material_type,
            quantity=recycling.quantity
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recycling reward processing failed: {str(e)}")

@router.get("/transactions")
def get_transaction_history(
    limit: int = 50,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's transaction history"""
    wallet_service = WalletService(db)
    
    try:
        transactions = wallet_service.get_transaction_history(current_user.id, limit)
        
        # Calculate totals
        total_earned = sum(
            tx["amount"] for tx in transactions 
            if tx["tx_type"] == "reward" and tx["amount"] > 0
        )
        
        total_spent = sum(
            tx["amount"] for tx in transactions 
            if tx["tx_type"] == "payment" and tx["amount"] > 0
        )
        
        # Convert to response format
        transaction_responses = [
            TransactionResponse(
                id=tx["id"],
                tx_type=tx["tx_type"],
                user_id=tx["user_id"],
                related_id=tx["related_id"],
                amount=tx["amount"],
                details=tx["details"],
                created_at=tx["created_at"],
                status=tx["status"]
            )
            for tx in transactions
        ]
        
        return TransactionHistoryResponse(
            transactions=transaction_responses,
            total_earned=total_earned,
            total_spent=total_spent
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch transaction history: {str(e)}")

@router.get("/summary", response_model=WalletSummaryResponse)
def get_wallet_summary(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get complete wallet summary for user"""
    wallet_service = WalletService(db)
    
    try:
        summary = wallet_service.get_wallet_summary(current_user.id)
        
        # Convert transactions to response format
        recent_transactions = [
            TransactionResponse(
                id=tx["id"],
                tx_type=tx["tx_type"],
                user_id=tx["user_id"],
                related_id=tx["related_id"],
                amount=tx["amount"],
                details=tx["details"],
                created_at=tx["created_at"],
                status=tx["status"]
            )
            for tx in summary["recent_transactions"]
        ]
        
        return WalletSummaryResponse(
            balance=summary["balance"],
            total_earned=summary["total_earned"],
            total_spent=summary["total_spent"],
            recent_transactions=recent_transactions
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch wallet summary: {str(e)}")

@router.get("/health")
def wallet_health_check():
    """Health check endpoint for wallet service"""
    return {"status": "healthy", "service": "wallet"}