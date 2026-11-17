from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.master import ProductResponse, WarehouseResponse


class InventoryBalanceResponse(BaseModel):
    id: int
    warehouse_id: int
    product_id: int
    quantity_on_hand: Decimal
    quantity_reserved: Decimal
    avg_cost: Decimal
    updated_at: datetime
    warehouse: Optional[WarehouseResponse] = None
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


class InventoryTransactionResponse(BaseModel):
    id: int
    transaction_code: str
    warehouse_id: int
    product_id: int
    transaction_type: str
    quantity: Decimal
    unit_cost: Decimal
    total_value: Decimal
    balance_before: Decimal
    balance_after: Decimal
    reference_type: str
    reference_id: int
    reference_code: str
    notes: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    warehouse: Optional[WarehouseResponse] = None
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


class StockAdjustmentRequest(BaseModel):
    warehouse_id: int
    product_id: int
    new_quantity: Decimal = Field(ge=0)
    reason: str = Field(min_length=1)

