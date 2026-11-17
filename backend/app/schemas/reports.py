from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    total_products: int
    total_warehouses: int
    total_stock_quantity: Decimal
    total_stock_value: Decimal
    monthly_receipt_amount: Decimal
    monthly_issue_amount: Decimal
    low_stock_products_count: int
    out_of_stock_products_count: int
    pending_receipts_count: int
    pending_issues_count: int


class StockMovementReportItem(BaseModel):
    product_id: int
    sku: str
    product_name: str
    category_name: Optional[str] = None
    unit_name: Optional[str] = None
    opening_balance: Decimal
    total_inbound: Decimal
    total_outbound: Decimal
    closing_balance: Decimal
    closing_value: Decimal


class WarehouseValuationReportItem(BaseModel):
    warehouse_id: int
    warehouse_code: str
    warehouse_name: str
    total_items: int
    total_quantity: Decimal
    total_valuation: Decimal


class ChartDataPoint(BaseModel):
    date: str
    inbound_qty: Decimal = Decimal("0")
    outbound_qty: Decimal = Decimal("0")
    inbound_amount: Decimal = Decimal("0")
    outbound_amount: Decimal = Decimal("0")


class TopProductItem(BaseModel):
    product_id: int
    sku: str
    product_name: str
    quantity: Decimal
    total_amount: Decimal

