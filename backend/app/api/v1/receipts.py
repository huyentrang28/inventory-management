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
from app.models.inventory import ReferenceType
from app.models.master import Product, Supplier, Warehouse
from app.models.receipt import ReceiptStatus, StockReceipt, StockReceiptItem
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.receipt import (
    StockReceiptCreate,
    StockReceiptResponse,
    StockReceiptUpdate,
)
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/receipts", tags=["Stock Receipts (Inbound)"])


def _generate_receipt_code() -> str:
    timestamp_part = datetime.now(timezone.utc).strftime("%y%m%d%H%M")
    random_part = uuid.uuid4().hex[:4].upper()
    return f"PNK-{timestamp_part}-{random_part}"


@router.get("", response_model=PaginatedResponse[StockReceiptResponse])
async def list_receipts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    warehouse_id: Optional[int] = None,
    supplier_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(StockReceipt)
        .options(
            selectinload(StockReceipt.warehouse),
            selectinload(StockReceipt.supplier),
            selectinload(StockReceipt.creator),
            selectinload(StockReceipt.approver),
            selectinload(StockReceipt.items).selectinload(StockReceiptItem.product),
        )
    )
    count_stmt = select(func.count(StockReceipt.id))

    if warehouse_id is not None:
        stmt = stmt.where(StockReceipt.warehouse_id == warehouse_id)
        count_stmt = count_stmt.where(StockReceipt.warehouse_id == warehouse_id)

    if supplier_id is not None:
        stmt = stmt.where(StockReceipt.supplier_id == supplier_id)
        count_stmt = count_stmt.where(StockReceipt.supplier_id == supplier_id)

    if status_filter:
        stmt = stmt.where(StockReceipt.status == status_filter)
        count_stmt = count_stmt.where(StockReceipt.status == status_filter)

    if search:
        stmt = stmt.where(StockReceipt.receipt_code.ilike(f"%{search}%"))
        count_stmt = count_stmt.where(StockReceipt.receipt_code.ilike(f"%{search}%"))

    if start_date:
        stmt = stmt.where(StockReceipt.receipt_date >= start_date)
        count_stmt = count_stmt.where(StockReceipt.receipt_date >= start_date)

    if end_date:
        stmt = stmt.where(StockReceipt.receipt_date <= end_date)
        count_stmt = count_stmt.where(StockReceipt.receipt_date <= end_date)

    total = (await db.execute(count_stmt)).scalar() or 0
    total_pages = (total + page_size - 1) // page_size
    receipts = (
        (await db.execute(stmt.order_by(StockReceipt.id.desc()).offset((page - 1) * page_size).limit(page_size)))
        .scalars()
        .all()
    )

    return PaginatedResponse[StockReceiptResponse](
        items=list(receipts),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{receipt_id}", response_model=StockReceiptResponse)
async def get_receipt(
    receipt_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(StockReceipt)
        .options(
            selectinload(StockReceipt.warehouse),
            selectinload(StockReceipt.supplier),
            selectinload(StockReceipt.creator),
            selectinload(StockReceipt.approver),
            selectinload(StockReceipt.items).selectinload(StockReceiptItem.product),
        )
        .where(StockReceipt.id == receipt_id)
    )
    receipt = (await db.execute(stmt)).scalar_one_or_none()
    if not receipt:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu nhập kho")
    return receipt


@router.post("", response_model=StockReceiptResponse, status_code=status.HTTP_201_CREATED)
async def create_receipt(
    data: StockReceiptCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.RECEIPT_CREATE.value)),
):
    # Verify warehouse
    wh = (await db.execute(select(Warehouse).where(Warehouse.id == data.warehouse_id))).scalar_one_or_none()
    if not wh or not wh.is_active:
        raise HTTPException(status_code=400, detail="Kho nhập không hợp lệ hoặc đang ngưng hoạt động")

    total_amount = Decimal("0.00")
    items_to_create = []

    for item_data in data.items:
        prod = (await db.execute(select(Product).where(Product.id == item_data.product_id))).scalar_one_or_none()
        if not prod or not prod.is_active:
            raise HTTPException(status_code=400, detail=f"Sản phẩm ID {item_data.product_id} không tồn tại hoặc đã ngừng kinh doanh")
        
        item_total = (item_data.quantity * item_data.unit_price).quantize(Decimal("0.01"))
        total_amount += item_total
        items_to_create.append(
            StockReceiptItem(
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                total_amount=item_total,
                notes=item_data.notes,
            )
        )

    receipt = StockReceipt(
        receipt_code=_generate_receipt_code(),
        receipt_date=data.receipt_date or datetime.now(timezone.utc),
        warehouse_id=data.warehouse_id,
        supplier_id=data.supplier_id,
        total_amount=total_amount,
        status=ReceiptStatus.DRAFT.value,
        notes=data.notes,
        created_by=current_user.id,
        items=items_to_create,
    )
    db.add(receipt)
    await db.commit()
    await db.refresh(receipt)

    return await get_receipt(receipt.id, db, current_user)


@router.post("/{receipt_id}/submit", response_model=StockReceiptResponse)
async def submit_receipt(
    receipt_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.RECEIPT_UPDATE.value)),
):
    receipt = (await db.execute(select(StockReceipt).where(StockReceipt.id == receipt_id))).scalar_one_or_none()
    if not receipt:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu nhập kho")
    if receipt.status != ReceiptStatus.DRAFT.value:
        raise HTTPException(status_code=400, detail="Chỉ phiếu ở trạng thái Nháp mới có thể gửi duyệt")

    receipt.status = ReceiptStatus.PENDING_APPROVAL.value
    await db.commit()
    return await get_receipt(receipt.id, db, current_user)


@router.post("/{receipt_id}/approve", response_model=StockReceiptResponse)
async def approve_receipt(
    receipt_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.RECEIPT_APPROVE.value)),
):
    receipt = (await db.execute(select(StockReceipt).where(StockReceipt.id == receipt_id))).scalar_one_or_none()
    if not receipt:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu nhập kho")
    if receipt.status != ReceiptStatus.PENDING_APPROVAL.value:
        raise HTTPException(status_code=400, detail="Chỉ phiếu ở trạng thái Chờ duyệt mới có thể phê duyệt")

    receipt.status = ReceiptStatus.APPROVED.value
    receipt.approved_by = current_user.id
    await db.commit()
    return await get_receipt(receipt.id, db, current_user)


@router.post("/{receipt_id}/complete", response_model=StockReceiptResponse)
async def complete_receipt(
    receipt_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.RECEIPT_COMPLETE.value)),
):
    """
    Completes stock receipt and increases inventory balances atomically.
    Strictly prevents double execution.
    """
    stmt = (
        select(StockReceipt)
        .options(selectinload(StockReceipt.items))
        .where(StockReceipt.id == receipt_id)
        .with_for_update()
    )
    receipt = (await db.execute(stmt)).scalar_one_or_none()
    if not receipt:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu nhập kho")

    if receipt.status == ReceiptStatus.COMPLETED.value:
        raise HTTPException(status_code=400, detail="Phiếu nhập kho này đã được hoàn tất trước đó!")
    if receipt.status not in (ReceiptStatus.APPROVED.value, ReceiptStatus.PENDING_APPROVAL.value, ReceiptStatus.DRAFT.value):
        raise HTTPException(status_code=400, detail=f"Không thể hoàn tất phiếu ở trạng thái {receipt.status}")

    # Process inventory inbound for all items within this transaction
    for item in receipt.items:
        await InventoryService.record_inbound(
            db=db,
            warehouse_id=receipt.warehouse_id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_cost=item.unit_price,
            reference_type=ReferenceType.RECEIPT.value,
            reference_id=receipt.id,
            reference_code=receipt.receipt_code,
            user_id=current_user.id,
            notes=f"Nhập kho theo phiếu {receipt.receipt_code}",
        )

    receipt.status = ReceiptStatus.COMPLETED.value
    if not receipt.approved_by:
        receipt.approved_by = current_user.id

    await db.commit()
    return await get_receipt(receipt.id, db, current_user)


@router.post("/{receipt_id}/cancel", response_model=StockReceiptResponse)
async def cancel_receipt(
    receipt_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.RECEIPT_CANCEL.value)),
):
    receipt = (await db.execute(select(StockReceipt).where(StockReceipt.id == receipt_id))).scalar_one_or_none()
    if not receipt:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu nhập kho")
    if receipt.status == ReceiptStatus.COMPLETED.value:
        raise HTTPException(status_code=400, detail="Không thể hủy phiếu nhập đã hoàn tất nhập kho")

    receipt.status = ReceiptStatus.CANCELLED.value
    await db.commit()
    return await get_receipt(receipt.id, db, current_user)

