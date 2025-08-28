# schemas/__init__.py

# Import all schema modules
from .user import UserBase, UserCreate, UserResponse
from .auth import SignupRequest, LoginRequest, Token, TokenData
from .product import ProductBase, ProductCreate, ProductUpdate, ProductResponse
from .order import OrderCreate, OrderResponse
from .recycle import RecycleRequestCreate, RecycleRequestUpdate, RecycleRequestResponse
from .material import (
    RawMaterialCreate, 
    RawMaterialResponse, 
    MaterialPurchaseCreate, 
    MaterialPurchaseResponse
)

# Export all schemas for easy importing
__all__ = [
    'UserBase',
    'UserCreate',
    'UserResponse',
    'SignupRequest',
    'LoginRequest',
    'Token',
    'TokenData',
    'ProductBase',
    'ProductCreate',
    'ProductUpdate',
    'ProductResponse',
    'OrderCreate',
    'OrderResponse',
    'RecycleRequestCreate',
    'RecycleRequestUpdate',
    'RecycleRequestResponse',
    'RawMaterialCreate',
    'RawMaterialResponse',
    'MaterialPurchaseCreate',
    'MaterialPurchaseResponse'
]