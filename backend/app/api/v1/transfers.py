from datetime import datetime, timezone
from decimal import Decimal
import uuid
from typing import Optional
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
from app.models.transfer import StockTransfer, StockTransferItem, TransferStatus
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.transfer import (
    StockTransferCreate,
    StockTransferResponse,
    StockTransferUpdate,
)
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/transfers", tags=["Stock Transfers"])


def _generate_transfer_code() -> str:
    timestamp_part = datetime.now(timezone.utc).strftime("%y%m%d%H%M")
    random_part = uuid.uuid4().hex[:4].upper()
    return f"PCK-{timestamp_part}-{random_part}"


@router.get("", response_model=PaginatedResponse[StockTransferResponse])
async def list_transfers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    source_warehouse_id: Optional[int] = None,
    dest_warehouse_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(StockTransfer)
        .options(
            selectinload(StockTransfer.source_warehouse),
            selectinload(StockTransfer.dest_warehouse),
            selectinload(StockTransfer.creator),
            selectinload(StockTransfer.approver),
            selectinload(StockTransfer.items).selectinload(StockTransferItem.product),
        )
    )
    count_stmt = select(func.count(StockTransfer.id))

    if source_warehouse_id:
        stmt = stmt.where(StockTransfer.source_warehouse_id == source_warehouse_id)
        count_stmt = count_stmt.where(StockTransfer.source_warehouse_id == source_warehouse_id)

    if dest_warehouse_id:
        stmt = stmt.where(StockTransfer.dest_warehouse_id == dest_warehouse_id)
        count_stmt = count_stmt.where(StockTransfer.dest_warehouse_id == dest_warehouse_id)

    if status_filter:
        stmt = stmt.where(StockTransfer.status == status_filter)
        count_stmt = count_stmt.where(StockTransfer.status == status_filter)

    if search:
        stmt = stmt.where(StockTransfer.transfer_code.ilike(f"%{search}%"))
        count_stmt = count_stmt.where(StockTransfer.transfer_code.ilike(f"%{search}%"))

    total = (await db.execute(count_stmt)).scalar() or 0
    total_pages = (total + page_size - 1) // page_size
    transfers = (
        (await db.execute(stmt.order_by(StockTransfer.id.desc()).offset((page - 1) * page_size).limit(page_size)))
        .scalars()
        .all()
    )

    return PaginatedResponse[StockTransferResponse](
        items=list(transfers),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{transfer_id}", response_model=StockTransferResponse)
async def get_transfer(
    transfer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(StockTransfer)
        .options(
            selectinload(StockTransfer.source_warehouse),
            selectinload(StockTransfer.dest_warehouse),
            selectinload(StockTransfer.creator),
            selectinload(StockTransfer.approver),
            selectinload(StockTransfer.items).selectinload(StockTransferItem.product),
        )
        .where(StockTransfer.id == transfer_id)
    )
    transfer = (await db.execute(stmt)).scalar_one_or_none()
    if not transfer:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu chuyển kho")
    return transfer


@router.post("", response_model=StockTransferResponse, status_code=status.HTTP_201_CREATED)
async def create_transfer(
    data: StockTransferCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.TRANSFER_CREATE.value)),
):
    if data.source_warehouse_id == data.dest_warehouse_id:
        raise HTTPException(status_code=400, detail="Kho nguồn và kho đích phải khác nhau")

    src_wh = (await db.execute(select(Warehouse).where(Warehouse.id == data.source_warehouse_id))).scalar_one_or_none()
    dst_wh = (await db.execute(select(Warehouse).where(Warehouse.id == data.dest_warehouse_id))).scalar_one_or_none()
    if not src_wh or not dst_wh or not src_wh.is_active or not dst_wh.is_active:
        raise HTTPException(status_code=400, detail="Kho nguồn hoặc kho đích không hợp lệ")

    items_to_create = []
    for item_data in data.items:
        prod = (await db.execute(select(Product).where(Product.id == item_data.product_id))).scalar_one_or_none()
        if not prod or not prod.is_active:
            raise HTTPException(status_code=400, detail=f"Sản phẩm ID {item_data.product_id} không hợp lệ")

        items_to_create.append(
            StockTransferItem(
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                notes=item_data.notes,
            )
        )

    transfer = StockTransfer(
        transfer_code=_generate_transfer_code(),
        transfer_date=data.transfer_date or datetime.now(timezone.utc),
        source_warehouse_id=data.source_warehouse_id,
        dest_warehouse_id=data.dest_warehouse_id,
        status=TransferStatus.DRAFT.value,
        notes=data.notes,
        created_by=current_user.id,
        items=items_to_create,
    )
    db.add(transfer)
    await db.commit()
    await db.refresh(transfer)

    return await get_transfer(transfer.id, db, current_user)


@router.post("/{transfer_id}/dispatch", response_model=StockTransferResponse)
async def dispatch_transfer(
    transfer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.TRANSFER_UPDATE.value)),
):
    """
    Dispatches stock: deducts from source warehouse and puts status to IN_TRANSIT.
    """
    stmt = (
        select(StockTransfer)
        .options(selectinload(StockTransfer.items))
        .where(StockTransfer.id == transfer_id)
        .with_for_update()
    )
    transfer = (await db.execute(stmt)).scalar_one_or_none()
    if not transfer:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu chuyển kho")

    if transfer.status in (TransferStatus.IN_TRANSIT.value, TransferStatus.RECEIVED.value):
        raise HTTPException(status_code=400, detail="Hàng trong phiếu đã được xuất chuyển đi trước đó")

    # Deduct stock from source warehouse for each item
    for item in transfer.items:
        await InventoryService.record_transfer_dispatch(
            db=db,
            source_warehouse_id=transfer.source_warehouse_id,
            product_id=item.product_id,
            quantity=item.quantity,
            transfer_id=transfer.id,
            transfer_code=transfer.transfer_code,
            user_id=current_user.id,
            notes=f"Xuất kho chuyển hàng sang kho đích theo phiếu {transfer.transfer_code}",
        )

    transfer.status = TransferStatus.IN_TRANSIT.value
    await db.commit()
    return await get_transfer(transfer.id, db, current_user)


@router.post("/{transfer_id}/receive", response_model=StockTransferResponse)
async def receive_transfer(
    transfer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.TRANSFER_COMPLETE.value)),
):
    """
    Receives stock: adds to destination warehouse and marks RECEIVED.
    """
    stmt = (
        select(StockTransfer)
        .options(selectinload(StockTransfer.items))
        .where(StockTransfer.id == transfer_id)
        .with_for_update()
    )
    transfer = (await db.execute(stmt)).scalar_one_or_none()
    if not transfer:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu chuyển kho")

    if transfer.status != TransferStatus.IN_TRANSIT.value:
        raise HTTPException(status_code=400, detail="Chỉ phiếu ở trạng thái Đang vận chuyển (IN_TRANSIT) mới có thể xác nhận nhận hàng")

    # Add stock to destination warehouse
    for item in transfer.items:
        # Get source cost from product or balance
        prod = (await db.execute(select(Product).where(Product.id == item.product_id))).scalar_one_or_none()
        cost = prod.cost_price if prod else Decimal("0.00")

        await InventoryService.record_transfer_receive(
            db=db,
            dest_warehouse_id=transfer.dest_warehouse_id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_cost=cost,
            transfer_id=transfer.id,
            transfer_code=transfer.transfer_code,
            user_id=current_user.id,
            notes=f"Nhận hàng chuyển đến từ kho nguồn theo phiếu {transfer.transfer_code}",
        )

    transfer.status = TransferStatus.RECEIVED.value
    transfer.approved_by = current_user.id
    await db.commit()
    return await get_transfer(transfer.id, db, current_user)

