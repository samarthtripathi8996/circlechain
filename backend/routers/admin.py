from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User, UserRole, Product, ProductCategory, Order, RecycleRequest

from auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])

def verify_admin(current_user: User):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin role required."
        )
    return current_user

@router.get("/impact/summary")
def get_impact_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_admin(current_user)
    
    # Get impact totals by category
    impact_by_category = db.query(
        Product.category,
        func.sum(Product.impact_placeholder).label('total_impact'),
        func.count(Product.id).label('product_count')
    ).group_by(Product.category).all()
    
    # Get overall stats
    total_products = db.query(Product).count()
    total_orders = db.query(Order).count()
    total_recycle_requests = db.query(RecycleRequest).count()
    total_impact = db.query(func.sum(Product.impact_placeholder)).scalar() or 0
    
    return {
        "overall": {
            "total_products": total_products,
            "total_orders": total_orders,
            "total_recycle_requests": total_recycle_requests,
            "total_co2_impact": total_impact
        },
        "by_category": [
            {
                "category": category,
                "total_impact": float(total_impact or 0),
                "product_count": product_count
            }
            for category, cat_impact, product_count in impact_by_category
        ]
    }