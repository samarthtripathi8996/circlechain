from sqlalchemy.orm import Session
from models.transaction import TxLog

def log_transaction(db: Session, tx_type: str, user_id: int, related_id: int = None, amount: float = None, details: str = None):
    """Log a transaction"""
    tx = TxLog(
        tx_type=tx_type,
        user_id=user_id,
        related_id=related_id,
        amount=amount,
        details=details
    )
    db.add(tx)
    db.commit()
    return tx