from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, UserRole, Product, ProductStatus, Order, RecycleRequest

from schemas.product import ProductResponse
from schemas.order import OrderCreate, OrderResponse
from schemas.recycle import RecycleRequestCreate, RecycleRequestResponse
from auth import get_current_user
from utils.transactions import log_transaction

router = APIRouter(prefix="/consumer", tags=["Consumer"])

def verify_consumer(current_user: User):
    if current_user.role != UserRole.CONSUMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Consumer role required."
        )
    return current_user

@router.get("/products", response_model=List[ProductResponse])
def browse_products(db: Session = Depends(get_db)):
    """Browse all available products"""
    products = db.query(Product).filter(Product.status == ProductStatus.AVAILABLE).all()
    return products

@router.post("/orders", response_model=OrderResponse)
def create_order(
    order: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_consumer(current_user)
    
    # Get product
    product = db.query(Product).filter(Product.id == order.product_id).first()
    if not product or product.status != ProductStatus.AVAILABLE:
        raise HTTPException(status_code=404, detail="Product not available")
    
    total_price = product.price * order.quantity
    
    # Create order
    db_order = Order(
        quantity=order.quantity,
        total_price=total_price,
        consumer_id=current_user.id,
        product_id=product.id
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    # Log transaction
    log_transaction(db, "product_purchase", current_user.id, db_order.id, 
                   total_price, f"Purchased {order.quantity}x {product.name}")
    
    return db_order

@router.get("/orders", response_model=List[OrderResponse])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_consumer(current_user)
    orders = db.query(Order).filter(Order.consumer_id == current_user.id).all()
    return orders

@router.post("/recycle-requests", response_model=RecycleRequestResponse)
def submit_recycle_request(
    request: RecycleRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_consumer(current_user)
    
    db_request = RecycleRequest(
        **request.dict(),
        consumer_id=current_user.id
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    # Log transaction
    log_transaction(db, "recycle_request", current_user.id, db_request.id,
                   details=f"Submitted recycle request: {request.item_description}")
    
    return db_request

@router.get("/recycle-requests", response_model=List[RecycleRequestResponse])
def get_my_recycle_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_consumer(current_user)
    requests = db.query(RecycleRequest).filter(RecycleRequest.consumer_id == current_user.id).all()
    return requests
