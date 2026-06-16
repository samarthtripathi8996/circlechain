# models/__init__.py

# Import all models to make them available when importing from models package
from .user import User, UserRole
from .product import Product, ProductCategory, ProductStatus
from .order import Order, OrderStatus
from .recycle import RecycleRequest, RecycleStatus
from .material import RawMaterial, MaterialPurchase, MaterialType, MaterialStatus
from .transaction import TxLog

# Export all models for easy importing
__all__ = [
    'User',
    'UserRole',
    'Product', 
    'ProductCategory',
    'ProductStatus',
    'Order',
    'OrderStatus',
    'RecycleRequest',
    'RecycleStatus',
    'RawMaterial',
    'MaterialPurchase',
    'MaterialType',
    'MaterialStatus',
    'TxLog'
]