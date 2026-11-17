from datetime import datetime, timezone
from decimal import Decimal
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.permissions import PermissionEnum
from app.dependencies.auth import get_current_user, require_permissions
from app.models.auth import User
from app.models.inventory import InventoryBalance
from app.models.master import Product, Warehouse
from app.models.stock_count import CountStatus, StockCount, StockCountItem
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.stock_count import (
    StockCountCreate,
    StockCountItemUpdate,
    StockCountResponse,
)
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/stock-counts", tags=["Stock Counts (Kiểm kê kho)"])


def _generate_count_code() -> str:
    timestamp_part = datetime.now(timezone.utc).strftime("%y%m%d%H%M")
    random_part = uuid.uuid4().hex[:4].upper()
    return f"PKK-{timestamp_part}-{random_part}"


@router.get("", response_model=PaginatedResponse[StockCountResponse])
async def list_stock_counts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    warehouse_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(StockCount)
        .options(
            selectinload(StockCount.warehouse),
            selectinload(StockCount.creator),
            selectinload(StockCount.approver),
            selectinload(StockCount.items).selectinload(StockCountItem.product),
        )
    )
    count_stmt = select(func.count(StockCount.id))

    if warehouse_id:
        stmt = stmt.where(StockCount.warehouse_id == warehouse_id)
        count_stmt = count_stmt.where(StockCount.warehouse_id == warehouse_id)

    if status_filter:
        stmt = stmt.where(StockCount.status == status_filter)
        count_stmt = count_stmt.where(StockCount.status == status_filter)

    total = (await db.execute(count_stmt)).scalar() or 0
    total_pages = (total + page_size - 1) // page_size
    counts = (
        (await db.execute(stmt.order_by(StockCount.id.desc()).offset((page - 1) * page_size).limit(page_size)))
        .scalars()
        .all()
    )

    return PaginatedResponse[StockCountResponse](
        items=list(counts),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{count_id}", response_model=StockCountResponse)
async def get_stock_count(
    count_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(StockCount)
        .options(
            selectinload(StockCount.warehouse),
            selectinload(StockCount.creator),
            selectinload(StockCount.approver),
            selectinload(StockCount.items).selectinload(StockCountItem.product),
        )
        .where(StockCount.id == count_id)
    )
    sc = (await db.execute(stmt)).scalar_one_or_none()
    if not sc:
        raise HTTPException(status_code=404, detail="Không tìm thấy đợt kiểm kê")
    return sc


@router.post("", response_model=StockCountResponse, status_code=status.HTTP_201_CREATED)
async def create_stock_count(
    data: StockCountCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.COUNT_CREATE.value)),
):
    wh = (await db.execute(select(Warehouse).where(Warehouse.id == data.warehouse_id))).scalar_one_or_none()
    if not wh or not wh.is_active:
        raise HTTPException(status_code=400, detail="Kho kiểm kê không hợp lệ")

    items_to_create = []

    if data.items:
        for it in data.items:
            # Query snapshot balance
            bal = (
                await db.execute(
                    select(InventoryBalance).where(
                        InventoryBalance.warehouse_id == data.warehouse_id,
                        InventoryBalance.product_id == it.product_id,
                    )
                )
            ).scalar_one_or_none()
            sys_qty = bal.quantity_on_hand if bal else Decimal("0.000")
            diff = it.actual_quantity - sys_qty
            items_to_create.append(
                StockCountItem(
                    product_id=it.product_id,
                    system_quantity=sys_qty,
                    actual_quantity=it.actual_quantity,
                    difference_quantity=diff,
                    reason=it.reason,
                    notes=it.notes,
                )
            )
    else:
        # Snapshot all products in warehouse or all active products
        all_prods = (await db.execute(select(Product).where(Product.is_active == True))).scalars().all()
        for p in all_prods:
            bal = (
                await db.execute(
                    select(InventoryBalance).where(
                        InventoryBalance.warehouse_id == data.warehouse_id,
                        InventoryBalance.product_id == p.id,
                    )
                )
            ).scalar_one_or_none()
            sys_qty = bal.quantity_on_hand if bal else Decimal("0.000")
            items_to_create.append(
                StockCountItem(
                    product_id=p.id,
                    system_quantity=sys_qty,
                    actual_quantity=sys_qty, # defaults to system qty until counted
                    difference_quantity=Decimal("0.000"),
                )
            )

    sc = StockCount(
        count_code=_generate_count_code(),
        count_date=data.count_date or datetime.now(timezone.utc),
        warehouse_id=data.warehouse_id,
        status=CountStatus.IN_PROGRESS.value,
        notes=data.notes,
        created_by=current_user.id,
        items=items_to_create,
    )
    db.add(sc)
    await db.commit()
    await db.refresh(sc)

    return await get_stock_count(sc.id, db, current_user)


@router.patch("/{count_id}/items/{item_id}", response_model=StockCountResponse)
async def update_count_item(
    count_id: int,
    item_id: int,
    data: StockCountItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.COUNT_UPDATE.value)),
):
    sc = (await db.execute(select(StockCount).where(StockCount.id == count_id))).scalar_one_or_none()
    if not sc:
        raise HTTPException(status_code=404, detail="Không tìm thấy đợt kiểm kê")
    if sc.status in (CountStatus.COMPLETED.value, CountStatus.CANCELLED.value):
        raise HTTPException(status_code=400, detail="Không thể cập nhật đợt kiểm kê đã kết thúc")

    item = (
        await db.execute(
            select(StockCountItem).where(
                StockCountItem.id == item_id, StockCountItem.stock_count_id == count_id
            )
        )
    ).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm trong phiếu kiểm kê")

    item.actual_quantity = data.actual_quantity
    item.difference_quantity = data.actual_quantity - item.system_quantity
    if data.reason is not None:
        item.reason = data.reason
    if data.notes is not None:
        item.notes = data.notes

    await db.commit()
    return await get_stock_count(count_id, db, current_user)


@router.post("/{count_id}/complete", response_model=StockCountResponse)
async def complete_stock_count(
    count_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.COUNT_COMPLETE.value)),
):
    """
    Finalizes stock count: applies difference adjustments to inventory balances.
    """
    stmt = (
        select(StockCount)
        .options(selectinload(StockCount.items))
        .where(StockCount.id == count_id)
        .with_for_update()
    )
    sc = (await db.execute(stmt)).scalar_one_or_none()
    if not sc:
        raise HTTPException(status_code=404, detail="Không tìm thấy đợt kiểm kê")
    if sc.status == CountStatus.COMPLETED.value:
        raise HTTPException(status_code=400, detail="Đợt kiểm kê này đã được hoàn tất trước đó")

    # Apply inventory adjustments for items with non-zero difference
    for item in sc.items:
        if item.difference_quantity != Decimal("0.000"):
            await InventoryService.record_stock_count_adjustment(
                db=db,
                warehouse_id=sc.warehouse_id,
                product_id=item.product_id,
                system_quantity=item.system_quantity,
                actual_quantity=item.actual_quantity,
                count_id=sc.id,
                count_code=sc.count_code,
                user_id=current_user.id,
                reason=item.reason or f"Điều chỉnh theo kiểm kê {sc.count_code}",
            )

    sc.status = CountStatus.COMPLETED.value
    sc.approved_by = current_user.id
    await db.commit()
    return await get_stock_count(sc.id, db, current_user)

