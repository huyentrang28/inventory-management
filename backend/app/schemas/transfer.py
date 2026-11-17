from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.auth import UserResponse
from app.schemas.master import ProductResponse, WarehouseResponse


class StockTransferItemCreate(BaseModel):
    product_id: int
    quantity: Decimal = Field(gt=0)
    notes: Optional[str] = None


class StockTransferItemResponse(BaseModel):
    id: int
    transfer_id: int
    product_id: int
    quantity: Decimal
    notes: Optional[str] = None
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


class StockTransferCreate(BaseModel):
    source_warehouse_id: int
    dest_warehouse_id: int
    transfer_date: Optional[datetime] = None
    notes: Optional[str] = None
    items: List[StockTransferItemCreate] = Field(min_length=1)


class StockTransferUpdate(BaseModel):
    source_warehouse_id: Optional[int] = None
    dest_warehouse_id: Optional[int] = None
    transfer_date: Optional[datetime] = None
    notes: Optional[str] = None
    items: Optional[List[StockTransferItemCreate]] = None


class StockTransferResponse(BaseModel):
    id: int
    transfer_code: str
    transfer_date: datetime
    source_warehouse_id: int
    dest_warehouse_id: int
    status: str
    notes: Optional[str] = None
    created_by: Optional[int] = None
    approved_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    source_warehouse: Optional[WarehouseResponse] = None
    dest_warehouse: Optional[WarehouseResponse] = None
    creator: Optional[UserResponse] = None
    approver: Optional[UserResponse] = None
    items: List[StockTransferItemResponse] = []

    class Config:
        from_attributes = True

