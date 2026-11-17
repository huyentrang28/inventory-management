from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.auth import UserResponse
from app.schemas.master import ProductResponse, WarehouseResponse


class StockCountItemCreate(BaseModel):
    product_id: int
    actual_quantity: Decimal = Field(ge=0)
    reason: Optional[str] = None
    notes: Optional[str] = None


class StockCountItemUpdate(BaseModel):
    actual_quantity: Decimal = Field(ge=0)
    reason: Optional[str] = None
    notes: Optional[str] = None


class StockCountItemResponse(BaseModel):
    id: int
    stock_count_id: int
    product_id: int
    system_quantity: Decimal
    actual_quantity: Decimal
    difference_quantity: Decimal
    reason: Optional[str] = None
    notes: Optional[str] = None
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


class StockCountCreate(BaseModel):
    warehouse_id: int
    count_date: Optional[datetime] = None
    notes: Optional[str] = None
    # If items is empty or omitted, can snapshot all active products in the warehouse
    items: Optional[List[StockCountItemCreate]] = None


class StockCountResponse(BaseModel):
    id: int
    count_code: str
    count_date: datetime
    warehouse_id: int
    status: str
    notes: Optional[str] = None
    created_by: Optional[int] = None
    approved_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    warehouse: Optional[WarehouseResponse] = None
    creator: Optional[UserResponse] = None
    approver: Optional[UserResponse] = None
    items: List[StockCountItemResponse] = []

    class Config:
        from_attributes = True

