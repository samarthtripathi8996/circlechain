from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, UserRole, Product, RawMaterial, MaterialPurchase

from schemas.product import ProductCreate, ProductResponse, ProductUpdate
from schemas.material import MaterialPurchaseCreate, MaterialPurchaseResponse, RawMaterialResponse
from auth import get_current_user
from utils.environmental import calculate_product_impact
from utils.transactions import log_transaction

router = APIRouter(prefix="/producer", tags=["Producer"])

def verify_producer(current_user: User):
    if current_user.role != UserRole.PRODUCER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Producer role required."
        )
    return current_user

@router.post("/products", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_producer(current_user)
    
    # Calculate environmental impact
    impact = calculate_product_impact(product.category.value, product.weight or 1.0)
    
    db_product = Product(
        **product.dict(),
        producer_id=current_user.id,
        impact_placeholder=impact
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    # Log transaction
    log_transaction(db, "product_created", current_user.id, db_product.id, 
                   details=f"Created product: {product.name}")
    
    return db_product

@router.get("/products", response_model=List[ProductResponse])
def get_my_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_producer(current_user)
    products = db.query(Product).filter(Product.producer_id == current_user.id).all()
    return products

@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_producer(current_user)
    
    db_product = db.query(Product).filter(
        Product.id == product_id,
        Product.producer_id == current_user.id
    ).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    # Recalculate impact if weight changed
    if "weight" in update_data:
        db_product.impact_placeholder = calculate_product_impact(
            db_product.category.value, db_product.weight or 1.0
        )
    
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_producer(current_user)
    
    db_product = db.query(Product).filter(
        Product.id == product_id,
        Product.producer_id == current_user.id
    ).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted successfully"}

@router.get("/raw-materials", response_model=List[RawMaterialResponse])
def get_available_materials(db: Session = Depends(get_db)):
    """Get all available raw materials for purchase"""
    materials = db.query(RawMaterial).filter(
        RawMaterial.status == "available"
    ).all()
    return materials

@router.post("/raw-materials/purchase", response_model=MaterialPurchaseResponse)
def purchase_raw_material(
    purchase: MaterialPurchaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_producer(current_user)
    
    # Get material
    material = db.query(RawMaterial).filter(RawMaterial.id == purchase.material_id).first()
    if not material or material.status != "available":
        raise HTTPException(status_code=404, detail="Material not available")
    
    if purchase.quantity > material.quantity:
        raise HTTPException(status_code=400, detail="Insufficient material quantity")
    
    total_price = purchase.quantity * material.price_per_kg
    
    # Create purchase record
    db_purchase = MaterialPurchase(
        quantity=purchase.quantity,
        total_price=total_price,
        producer_id=current_user.id,
        material_id=material.id
    )
    db.add(db_purchase)
    
    # Update material quantity
    material.quantity -= purchase.quantity
    if material.quantity <= 0:
        material.status = "sold"
    
    db.commit()
    db.refresh(db_purchase)
    
    # Log transaction
    log_transaction(db, "material_purchase", current_user.id, db_purchase.id, 
                   total_price, f"Purchased {purchase.quantity}kg of {material.name}")
    
    return db_purchase