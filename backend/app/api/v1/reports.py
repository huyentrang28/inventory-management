from datetime import datetime, timedelta, timezone
from decimal import Decimal
import io
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
import openpyxl
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.auth import User
from app.models.inventory import InventoryBalance, InventoryTransaction, TransactionType
from app.models.issue import IssueStatus, StockIssue, StockIssueItem
from app.models.master import Category, Product, Warehouse
from app.models.receipt import ReceiptStatus, StockReceipt, StockReceiptItem
from app.schemas.reports import (
    ChartDataPoint,
    DashboardSummaryResponse,
    StockMovementReportItem,
    TopProductItem,
    WarehouseValuationReportItem,
)

router = APIRouter(prefix="/reports", tags=["Reports & Dashboard Analytics"])


@router.get("/dashboard-summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    warehouse_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)

    # Products count
    total_products = (await db.execute(select(func.count(Product.id)).where(Product.is_active == True))).scalar() or 0
    total_warehouses = (await db.execute(select(func.count(Warehouse.id)).where(Warehouse.is_active == True))).scalar() or 0

    # Stock quantity & value
    bal_stmt = select(
        func.coalesce(func.sum(InventoryBalance.quantity_on_hand), Decimal("0.000")),
        func.coalesce(func.sum(InventoryBalance.quantity_on_hand * InventoryBalance.avg_cost), Decimal("0.00")),
    )
    if warehouse_id:
        bal_stmt = bal_stmt.where(InventoryBalance.warehouse_id == warehouse_id)
    
    bal_row = (await db.execute(bal_stmt)).one()
    total_stock_quantity = bal_row[0]
    total_stock_value = bal_row[1]

    # Monthly receipt total
    rcpt_stmt = (
        select(func.coalesce(func.sum(StockReceipt.total_amount), Decimal("0.00")))
        .where(
            StockReceipt.status == ReceiptStatus.COMPLETED.value,
            StockReceipt.created_at >= month_start,
        )
    )
    if warehouse_id:
        rcpt_stmt = rcpt_stmt.where(StockReceipt.warehouse_id == warehouse_id)
    monthly_receipt_amount = (await db.execute(rcpt_stmt)).scalar() or Decimal("0.00")

    # Monthly issue total
    issue_stmt = (
        select(func.coalesce(func.sum(StockIssue.total_amount), Decimal("0.00")))
        .where(
            StockIssue.status == IssueStatus.COMPLETED.value,
            StockIssue.created_at >= month_start,
        )
    )
    if warehouse_id:
        issue_stmt = issue_stmt.where(StockIssue.warehouse_id == warehouse_id)
    monthly_issue_amount = (await db.execute(issue_stmt)).scalar() or Decimal("0.00")

    # Low stock & out of stock products
    # Subquery product total across warehouses
    subq = (
        select(
            InventoryBalance.product_id,
            func.sum(InventoryBalance.quantity_on_hand).label("total_on_hand")
        )
        .group_by(InventoryBalance.product_id)
        .subquery()
    )

    low_stmt = (
        select(func.count(Product.id))
        .outerjoin(subq, Product.id == subq.c.product_id)
        .where(
            Product.is_active == True,
            func.coalesce(subq.c.total_on_hand, Decimal("0.000")) <= Product.min_stock_level,
            func.coalesce(subq.c.total_on_hand, Decimal("0.000")) > Decimal("0.000"),
        )
    )
    low_stock_products_count = (await db.execute(low_stmt)).scalar() or 0

    out_stmt = (
        select(func.count(Product.id))
        .outerjoin(subq, Product.id == subq.c.product_id)
        .where(
            Product.is_active == True,
            func.coalesce(subq.c.total_on_hand, Decimal("0.000")) == Decimal("0.000"),
        )
    )
    out_of_stock_products_count = (await db.execute(out_stmt)).scalar() or 0

    # Pending counts
    pending_receipts_count = (
        await db.execute(
            select(func.count(StockReceipt.id)).where(StockReceipt.status == ReceiptStatus.PENDING_APPROVAL.value)
        )
    ).scalar() or 0

    pending_issues_count = (
        await db.execute(
            select(func.count(StockIssue.id)).where(StockIssue.status == IssueStatus.PENDING_APPROVAL.value)
        )
    ).scalar() or 0

    return DashboardSummaryResponse(
        total_products=total_products,
        total_warehouses=total_warehouses,
        total_stock_quantity=total_stock_quantity,
        total_stock_value=total_stock_value,
        monthly_receipt_amount=monthly_receipt_amount,
        monthly_issue_amount=monthly_issue_amount,
        low_stock_products_count=low_stock_products_count,
        out_of_stock_products_count=out_of_stock_products_count,
        pending_receipts_count=pending_receipts_count,
        pending_issues_count=pending_issues_count,
    )


@router.get("/charts/movement-timeline", response_model=List[ChartDataPoint])
async def get_movement_timeline(
    days: int = Query(30, ge=7, le=90),
    warehouse_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=days)

    # Inbound transactions
    in_stmt = (
        select(
            func.date_trunc("day", InventoryTransaction.created_at).label("day"),
            func.sum(InventoryTransaction.quantity).label("qty"),
            func.sum(InventoryTransaction.total_value).label("amount"),
        )
        .where(
            InventoryTransaction.transaction_type == TransactionType.INBOUND.value,
            InventoryTransaction.created_at >= start_date,
        )
    )
    if warehouse_id:
        in_stmt = in_stmt.where(InventoryTransaction.warehouse_id == warehouse_id)
    in_stmt = in_stmt.group_by("day")
    in_rows = {row[0].strftime("%d/%m"): (row[1], row[2]) for row in (await db.execute(in_stmt)).all()}

    # Outbound transactions
    out_stmt = (
        select(
            func.date_trunc("day", InventoryTransaction.created_at).label("day"),
            func.sum(InventoryTransaction.quantity).label("qty"),
            func.sum(InventoryTransaction.total_value).label("amount"),
        )
        .where(
            InventoryTransaction.transaction_type == TransactionType.OUTBOUND.value,
            InventoryTransaction.created_at >= start_date,
        )
    )
    if warehouse_id:
        out_stmt = out_stmt.where(InventoryTransaction.warehouse_id == warehouse_id)
    out_stmt = out_stmt.group_by("day")
    out_rows = {row[0].strftime("%d/%m"): (row[1], row[2]) for row in (await db.execute(out_stmt)).all()}

    # Aggregate by continuous timeline
    data_points = []
    for d in range(days, -1, -1):
        target_day = (now - timedelta(days=d)).strftime("%d/%m")
        in_qty, in_amt = in_rows.get(target_day, (Decimal("0"), Decimal("0")))
        out_qty, out_amt = out_rows.get(target_day, (Decimal("0"), Decimal("0")))
        data_points.append(
            ChartDataPoint(
                date=target_day,
                inbound_qty=in_qty,
                outbound_qty=out_qty,
                inbound_amount=in_amt,
                outbound_amount=out_amt,
            )
        )
    return data_points


@router.get("/charts/top-products", response_model=List[TopProductItem])
async def get_top_issued_products(
    limit: int = Query(10, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(
            Product.id,
            Product.sku,
            Product.name,
            func.coalesce(func.sum(StockIssueItem.quantity), Decimal("0")).label("qty"),
            func.coalesce(func.sum(StockIssueItem.total_amount), Decimal("0")).label("amount"),
        )
        .join(StockIssueItem, Product.id == StockIssueItem.product_id)
        .join(StockIssue, StockIssueItem.issue_id == StockIssue.id)
        .where(StockIssue.status == IssueStatus.COMPLETED.value)
        .group_by(Product.id, Product.sku, Product.name)
        .order_by(func.sum(StockIssueItem.quantity).desc())
        .limit(limit)
    )
    rows = (await db.execute(stmt)).all()
    return [
        TopProductItem(
            product_id=r[0],
            sku=r[1],
            product_name=r[2],
            quantity=r[3],
            total_amount=r[4],
        )
        for r in rows
    ]


@router.get("/warehouse-valuations", response_model=List[WarehouseValuationReportItem])
async def get_warehouse_valuations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(
            Warehouse.id,
            Warehouse.code,
            Warehouse.name,
            func.count(InventoryBalance.id).label("total_items"),
            func.coalesce(func.sum(InventoryBalance.quantity_on_hand), Decimal("0.000")),
            func.coalesce(func.sum(InventoryBalance.quantity_on_hand * InventoryBalance.avg_cost), Decimal("0.00")),
        )
        .outerjoin(InventoryBalance, Warehouse.id == InventoryBalance.warehouse_id)
        .where(Warehouse.is_active == True)
        .group_by(Warehouse.id, Warehouse.code, Warehouse.name)
        .order_by(Warehouse.id.asc())
    )
    rows = (await db.execute(stmt)).all()
    return [
        WarehouseValuationReportItem(
            warehouse_id=r[0],
            warehouse_code=r[1],
            warehouse_name=r[2],
            total_items=r[3],
            total_quantity=r[4],
            total_valuation=r[5],
        )
        for r in rows
    ]


@router.get("/stock-movement", response_model=List[StockMovementReportItem])
async def get_stock_movement_report(
    warehouse_id: Optional[int] = None,
    category_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Computes stock movement (Báo cáo Nhập - Xuất - Tồn).
    """
    stmt = (
        select(Product)
        .options(selectinload(Product.category), selectinload(Product.unit))
        .where(Product.is_active == True)
    )
    if category_id:
        stmt = stmt.where(Product.category_id == category_id)

    products = (await db.execute(stmt.order_by(Product.name.asc()))).scalars().all()
    results = []

    for p in products:
        # Closing balance
        bal_stmt = select(
            func.coalesce(func.sum(InventoryBalance.quantity_on_hand), Decimal("0.000")),
            func.coalesce(func.avg(InventoryBalance.avg_cost), p.cost_price),
        ).where(InventoryBalance.product_id == p.id)
        if warehouse_id:
            bal_stmt = bal_stmt.where(InventoryBalance.warehouse_id == warehouse_id)

        closing_qty, avg_cost = (await db.execute(bal_stmt)).one()

        # Inbound during period
        in_stmt = select(func.coalesce(func.sum(InventoryTransaction.quantity), Decimal("0.000"))).where(
            InventoryTransaction.product_id == p.id,
            InventoryTransaction.transaction_type.in_([TransactionType.INBOUND.value, TransactionType.TRANSFER_IN.value, TransactionType.COUNT_ADJUST_ADD.value])
        )
        if warehouse_id:
            in_stmt = in_stmt.where(InventoryTransaction.warehouse_id == warehouse_id)
        if start_date:
            in_stmt = in_stmt.where(InventoryTransaction.created_at >= start_date)
        if end_date:
            in_stmt = in_stmt.where(InventoryTransaction.created_at <= end_date)
        inbound_qty = (await db.execute(in_stmt)).scalar() or Decimal("0.000")

        # Outbound during period
        out_stmt = select(func.coalesce(func.sum(InventoryTransaction.quantity), Decimal("0.000"))).where(
            InventoryTransaction.product_id == p.id,
            InventoryTransaction.transaction_type.in_([TransactionType.OUTBOUND.value, TransactionType.TRANSFER_OUT.value, TransactionType.COUNT_ADJUST_SUB.value])
        )
        if warehouse_id:
            out_stmt = out_stmt.where(InventoryTransaction.warehouse_id == warehouse_id)
        if start_date:
            out_stmt = out_stmt.where(InventoryTransaction.created_at >= start_date)
        if end_date:
            out_stmt = out_stmt.where(InventoryTransaction.created_at <= end_date)
        outbound_qty = (await db.execute(out_stmt)).scalar() or Decimal("0.000")

        opening_qty = closing_qty - inbound_qty + outbound_qty
        if opening_qty < Decimal("0.000"):
            opening_qty = Decimal("0.000")

        results.append(
            StockMovementReportItem(
                product_id=p.id,
                sku=p.sku,
                product_name=p.name,
                category_name=p.category.name if p.category else "Chưa phân loại",
                unit_name=p.unit.name if p.unit else "",
                opening_balance=opening_qty,
                total_inbound=inbound_qty,
                total_outbound=outbound_qty,
                closing_balance=closing_qty,
                closing_value=(closing_qty * avg_cost).quantize(Decimal("0.01")),
            )
        )
    return results


@router.get("/export/movement/excel")
async def export_movement_excel(
    warehouse_id: Optional[int] = None,
    category_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    movement_data = await get_stock_movement_report(
        warehouse_id=warehouse_id,
        category_id=category_id,
        db=db,
        current_user=current_user,
    )

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Báo cáo nhập xuất tồn"

    headers = [
        "Mã SKU",
        "Tên sản phẩm",
        "Danh mục",
        "Đơn vị",
        "Tồn đầu kỳ",
        "Tổng nhập",
        "Tổng xuất",
        "Tồn cuối kỳ",
        "Giá trị tồn cuối (VND)",
    ]
    ws.append(headers)

    for item in movement_data:
        ws.append([
            item.sku,
            item.product_name,
            item.category_name,
            item.unit_name,
            float(item.opening_balance),
            float(item.total_inbound),
            float(item.total_outbound),
            float(item.closing_balance),
            float(item.closing_value),
        ])

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)

    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="bao_cao_nhap_xuat_ton.xlsx"'},
    )

