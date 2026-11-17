from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.auth import UserResponse
from app.schemas.master import ProductResponse, SupplierResponse, WarehouseResponse


class StockReceiptItemCreate(BaseModel):
    product_id: int
    quantity: Decimal = Field(gt=0)
    unit_price: Decimal = Field(ge=0)
    notes: Optional[str] = None


class StockReceiptItemResponse(BaseModel):
    id: int
    receipt_id: int
    product_id: int
    quantity: Decimal
    unit_price: Decimal
    total_amount: Decimal
    notes: Optional[str] = None
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


class StockReceiptCreate(BaseModel):
    warehouse_id: int
    supplier_id: Optional[int] = None
    receipt_date: Optional[datetime] = None
    notes: Optional[str] = None
    items: List[StockReceiptItemCreate] = Field(min_length=1)


class StockReceiptUpdate(BaseModel):
    warehouse_id: Optional[int] = None
    supplier_id: Optional[int] = None
    receipt_date: Optional[datetime] = None
    notes: Optional[str] = None
    items: Optional[List[StockReceiptItemCreate]] = None


class StockReceiptResponse(BaseModel):
    id: int
    receipt_code: str
    receipt_date: datetime
    warehouse_id: int
    supplier_id: Optional[int] = None
    total_amount: Decimal
    status: str
    notes: Optional[str] = None
    created_by: Optional[int] = None
    approved_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    warehouse: Optional[WarehouseResponse] = None
    supplier: Optional[SupplierResponse] = None
    creator: Optional[UserResponse] = None
    approver: Optional[UserResponse] = None
    items: List[StockReceiptItemResponse] = []

    class Config:
        from_attributes = True

