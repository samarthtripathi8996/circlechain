from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List
from database import get_db
from models import User, UserRole, RecycleRequest, RecycleStatus, RawMaterial

from schemas.recycle import RecycleRequestResponse, RecycleRequestUpdate
from schemas.material import RawMaterialCreate, RawMaterialResponse
from auth import get_current_user
from utils.transactions import log_transaction

router = APIRouter(prefix="/recycler", tags=["Recycler"])

def verify_recycler(current_user: User):
    if current_user.role != UserRole.RECYCLER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Recycler role required."
        )
    return current_user

@router.get("/recycle-requests", response_model=List[RecycleRequestResponse])
def get_available_recycle_requests(db: Session = Depends(get_db)):
    """Get all available recycle requests"""
    requests = db.query(RecycleRequest).filter(
        RecycleRequest.status == RecycleStatus.SUBMITTED
    ).all()
    return requests

@router.put("/recycle-requests/{request_id}/accept", response_model=RecycleRequestResponse)
def accept_recycle_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_recycler(current_user)
    
    db_request = db.query(RecycleRequest).filter(RecycleRequest.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Recycle request not found")
    
    if db_request.status != RecycleStatus.SUBMITTED:
        raise HTTPException(status_code=400, detail="Request already processed")
    
    db_request.status = RecycleStatus.ACCEPTED
    db_request.recycler_id = current_user.id
    db.commit()
    db.refresh(db_request)
    
    # Log transaction
    log_transaction(db, "recycle_accept", current_user.id, db_request.id,
                   details=f"Accepted recycle request: {db_request.item_description}")
    
    return db_request

@router.put("/recycle-requests/{request_id}/complete", response_model=RecycleRequestResponse)
def complete_recycle_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_recycler(current_user)
    
    db_request = db.query(RecycleRequest).filter(
        RecycleRequest.id == request_id,
        RecycleRequest.recycler_id == current_user.id
    ).first()
    
    if not db_request:
        raise HTTPException(status_code=404, detail="Recycle request not found")
    
    db_request.status = RecycleStatus.COMPLETED
    db_request.processed_at = func.now()
    db.commit()
    db.refresh(db_request)
    
    # Log transaction
    log_transaction(db, "recycle_complete", current_user.id, db_request.id,
                   details=f"Completed recycling: {db_request.item_description}")
    
    return db_request

@router.get("/my-requests", response_model=List[RecycleRequestResponse])
def get_my_recycle_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_recycler(current_user)
    requests = db.query(RecycleRequest).filter(RecycleRequest.recycler_id == current_user.id).all()
    return requests

@router.post("/raw-materials", response_model=RawMaterialResponse)
def create_raw_material(
    material: RawMaterialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_recycler(current_user)
    
    db_material = RawMaterial(
        **material.dict(),
        recycler_id=current_user.id
    )
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    
    # Log transaction
    log_transaction(db, "material_created", current_user.id, db_material.id,
                   details=f"Created raw material: {material.name}")
    
    return db_material

@router.get("/raw-materials", response_model=List[RawMaterialResponse])
def get_my_raw_materials(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_recycler(current_user)
    materials = db.query(RawMaterial).filter(RawMaterial.recycler_id == current_user.id).all()
    return materials