from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.auth import UserResponse
from app.schemas.master import CustomerResponse, ProductResponse, WarehouseResponse


class StockIssueItemCreate(BaseModel):
    product_id: int
    quantity: Decimal = Field(gt=0)
    unit_price: Decimal = Field(ge=0)
    notes: Optional[str] = None


class StockIssueItemResponse(BaseModel):
    id: int
    issue_id: int
    product_id: int
    quantity: Decimal
    unit_price: Decimal
    total_amount: Decimal
    notes: Optional[str] = None
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


class StockIssueCreate(BaseModel):
    warehouse_id: int
    customer_id: Optional[int] = None
    issue_date: Optional[datetime] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    items: List[StockIssueItemCreate] = Field(min_length=1)


class StockIssueUpdate(BaseModel):
    warehouse_id: Optional[int] = None
    customer_id: Optional[int] = None
    issue_date: Optional[datetime] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[List[StockIssueItemCreate]] = None


class StockIssueResponse(BaseModel):
    id: int
    issue_code: str
    issue_date: datetime
    warehouse_id: int
    customer_id: Optional[int] = None
    reason: Optional[str] = None
    total_amount: Decimal
    status: str
    notes: Optional[str] = None
    created_by: Optional[int] = None
    approved_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    warehouse: Optional[WarehouseResponse] = None
    customer: Optional[CustomerResponse] = None
    creator: Optional[UserResponse] = None
    approver: Optional[UserResponse] = None
    items: List[StockIssueItemResponse] = []

    class Config:
        from_attributes = True

