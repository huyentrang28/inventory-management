from datetime import datetime
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.permissions import PermissionEnum
from app.dependencies.auth import get_current_user, require_permissions
from app.models.auth import User
from app.models.inventory import InventoryBalance, InventoryTransaction
from app.models.master import Product, Warehouse
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.inventory import (
    InventoryBalanceResponse,
    InventoryTransactionResponse,
    StockAdjustmentRequest,
)
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/inventory", tags=["Inventory Engine"])


@router.get("", response_model=PaginatedResponse[InventoryBalanceResponse])
async def list_inventory_balances(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    warehouse_id: Optional[int] = None,
    product_id: Optional[int] = None,
    search: Optional[str] = None,
    low_stock_only: Optional[bool] = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(InventoryBalance)
        .join(InventoryBalance.product)
        .options(
            selectinload(InventoryBalance.warehouse),
            selectinload(InventoryBalance.product).selectinload(Product.category),
            selectinload(InventoryBalance.product).selectinload(Product.unit),
        )
    )
    count_stmt = select(func.count(InventoryBalance.id)).join(InventoryBalance.product)

    if warehouse_id is not None:
        stmt = stmt.where(InventoryBalance.warehouse_id == warehouse_id)
        count_stmt = count_stmt.where(InventoryBalance.warehouse_id == warehouse_id)

    if product_id is not None:
        stmt = stmt.where(InventoryBalance.product_id == product_id)
        count_stmt = count_stmt.where(InventoryBalance.product_id == product_id)

    if search:
        f = Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%")
        stmt = stmt.where(f)
        count_stmt = count_stmt.where(f)

    if low_stock_only:
        stmt = stmt.where(InventoryBalance.quantity_on_hand <= Product.min_stock_level)
        count_stmt = count_stmt.where(InventoryBalance.quantity_on_hand <= Product.min_stock_level)

    total = (await db.execute(count_stmt)).scalar() or 0
    total_pages = (total + page_size - 1) // page_size
    items = (
        (await db.execute(stmt.order_by(InventoryBalance.quantity_on_hand.asc()).offset((page - 1) * page_size).limit(page_size)))
        .scalars()
        .all()
    )

    return PaginatedResponse[InventoryBalanceResponse](
        items=list(items),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/transactions", response_model=PaginatedResponse[InventoryTransactionResponse])
async def list_inventory_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    warehouse_id: Optional[int] = None,
    product_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(InventoryTransaction)
        .options(
            selectinload(InventoryTransaction.warehouse),
            selectinload(InventoryTransaction.product),
        )
    )
    count_stmt = select(func.count(InventoryTransaction.id))

    if warehouse_id is not None:
        stmt = stmt.where(InventoryTransaction.warehouse_id == warehouse_id)
        count_stmt = count_stmt.where(InventoryTransaction.warehouse_id == warehouse_id)

    if product_id is not None:
        stmt = stmt.where(InventoryTransaction.product_id == product_id)
        count_stmt = count_stmt.where(InventoryTransaction.product_id == product_id)

    if transaction_type:
        stmt = stmt.where(InventoryTransaction.transaction_type == transaction_type)
        count_stmt = count_stmt.where(InventoryTransaction.transaction_type == transaction_type)

    if start_date:
        stmt = stmt.where(InventoryTransaction.created_at >= start_date)
        count_stmt = count_stmt.where(InventoryTransaction.created_at >= start_date)

    if end_date:
        stmt = stmt.where(InventoryTransaction.created_at <= end_date)
        count_stmt = count_stmt.where(InventoryTransaction.created_at <= end_date)

    total = (await db.execute(count_stmt)).scalar() or 0
    total_pages = (total + page_size - 1) // page_size
    items = (
        (await db.execute(stmt.order_by(InventoryTransaction.id.desc()).offset((page - 1) * page_size).limit(page_size)))
        .scalars()
        .all()
    )

    return PaginatedResponse[InventoryTransactionResponse](
        items=list(items),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("/adjust", response_model=InventoryTransactionResponse)
async def adjust_stock(
    data: StockAdjustmentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.COUNT_APPROVE.value)),
):
    """
    Direct inventory adjustment strictly through InventoryService with transaction locking.
    """
    balance = await InventoryService.get_or_create_balance_for_update(
        db, data.warehouse_id, data.product_id
    )
    diff = data.new_quantity - balance.quantity_on_hand

    tx = await InventoryService.record_stock_count_adjustment(
        db=db,
        warehouse_id=data.warehouse_id,
        product_id=data.product_id,
        system_quantity=balance.quantity_on_hand,
        actual_quantity=data.new_quantity,
        count_id=0,
        count_code="MANUAL-ADJUST",
        user_id=current_user.id,
        reason=data.reason,
    )
    await db.commit()
    if tx:
        await db.refresh(tx)
        stmt = (
            select(InventoryTransaction)
            .options(
                selectinload(InventoryTransaction.warehouse),
                selectinload(InventoryTransaction.product),
            )
            .where(InventoryTransaction.id == tx.id)
        )
        return (await db.execute(stmt)).scalar_one()

    raise HTTPException(status_code=400, detail="Số lượng mới bằng với số lượng tồn hiện tại")

