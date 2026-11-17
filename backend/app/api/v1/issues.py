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
from app.models.inventory import InventoryBalance, ReferenceType
from app.models.issue import IssueStatus, StockIssue, StockIssueItem
from app.models.master import Customer, Product, Warehouse
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.issue import (
    StockIssueCreate,
    StockIssueResponse,
    StockIssueUpdate,
)
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/issues", tags=["Stock Issues (Outbound)"])


def _generate_issue_code() -> str:
    timestamp_part = datetime.now(timezone.utc).strftime("%y%m%d%H%M")
    random_part = uuid.uuid4().hex[:4].upper()
    return f"PXK-{timestamp_part}-{random_part}"


@router.get("", response_model=PaginatedResponse[StockIssueResponse])
async def list_issues(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    warehouse_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(StockIssue)
        .options(
            selectinload(StockIssue.warehouse),
            selectinload(StockIssue.customer),
            selectinload(StockIssue.creator),
            selectinload(StockIssue.approver),
            selectinload(StockIssue.items).selectinload(StockIssueItem.product),
        )
    )
    count_stmt = select(func.count(StockIssue.id))

    if warehouse_id is not None:
        stmt = stmt.where(StockIssue.warehouse_id == warehouse_id)
        count_stmt = count_stmt.where(StockIssue.warehouse_id == warehouse_id)

    if customer_id is not None:
        stmt = stmt.where(StockIssue.customer_id == customer_id)
        count_stmt = count_stmt.where(StockIssue.customer_id == customer_id)

    if status_filter:
        stmt = stmt.where(StockIssue.status == status_filter)
        count_stmt = count_stmt.where(StockIssue.status == status_filter)

    if search:
        stmt = stmt.where(StockIssue.issue_code.ilike(f"%{search}%"))
        count_stmt = count_stmt.where(StockIssue.issue_code.ilike(f"%{search}%"))

    if start_date:
        stmt = stmt.where(StockIssue.issue_date >= start_date)
        count_stmt = count_stmt.where(StockIssue.issue_date >= start_date)

    if end_date:
        stmt = stmt.where(StockIssue.issue_date <= end_date)
        count_stmt = count_stmt.where(StockIssue.issue_date <= end_date)

    total = (await db.execute(count_stmt)).scalar() or 0
    total_pages = (total + page_size - 1) // page_size
    issues = (
        (await db.execute(stmt.order_by(StockIssue.id.desc()).offset((page - 1) * page_size).limit(page_size)))
        .scalars()
        .all()
    )

    return PaginatedResponse[StockIssueResponse](
        items=list(issues),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{issue_id}", response_model=StockIssueResponse)
async def get_issue(
    issue_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(StockIssue)
        .options(
            selectinload(StockIssue.warehouse),
            selectinload(StockIssue.customer),
            selectinload(StockIssue.creator),
            selectinload(StockIssue.approver),
            selectinload(StockIssue.items).selectinload(StockIssueItem.product),
        )
        .where(StockIssue.id == issue_id)
    )
    issue = (await db.execute(stmt)).scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu xuất kho")
    return issue


@router.post("", response_model=StockIssueResponse, status_code=status.HTTP_201_CREATED)
async def create_issue(
    data: StockIssueCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.ISSUE_CREATE.value)),
):
    # Verify warehouse
    wh = (await db.execute(select(Warehouse).where(Warehouse.id == data.warehouse_id))).scalar_one_or_none()
    if not wh or not wh.is_active:
        raise HTTPException(status_code=400, detail="Kho xuất không hợp lệ hoặc đang ngưng hoạt động")

    total_amount = Decimal("0.00")
    items_to_create = []

    # Quick pre-validation of requested stock
    for item_data in data.items:
        prod = (await db.execute(select(Product).where(Product.id == item_data.product_id))).scalar_one_or_none()
        if not prod or not prod.is_active:
            raise HTTPException(status_code=400, detail=f"Sản phẩm ID {item_data.product_id} không tồn tại hoặc đã ngừng kinh doanh")
        
        # Check current balance as preliminary validation
        bal = (
            await db.execute(
                select(InventoryBalance).where(
                    InventoryBalance.warehouse_id == data.warehouse_id,
                    InventoryBalance.product_id == item_data.product_id,
                )
            )
        ).scalar_one_or_none()
        avail = bal.quantity_on_hand if bal else Decimal("0.000")
        if avail < item_data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sản phẩm '{prod.name}' không đủ tồn kho để xuất. Tồn hiện tại: {avail}, Yêu cầu: {item_data.quantity}",
            )

        item_total = (item_data.quantity * item_data.unit_price).quantize(Decimal("0.01"))
        total_amount += item_total
        items_to_create.append(
            StockIssueItem(
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                total_amount=item_total,
                notes=item_data.notes,
            )
        )

    issue = StockIssue(
        issue_code=_generate_issue_code(),
        issue_date=data.issue_date or datetime.now(timezone.utc),
        warehouse_id=data.warehouse_id,
        customer_id=data.customer_id,
        reason=data.reason or "Xuất bán hàng",
        total_amount=total_amount,
        status=IssueStatus.DRAFT.value,
        notes=data.notes,
        created_by=current_user.id,
        items=items_to_create,
    )
    db.add(issue)
    await db.commit()
    await db.refresh(issue)

    return await get_issue(issue.id, db, current_user)


@router.post("/{issue_id}/submit", response_model=StockIssueResponse)
async def submit_issue(
    issue_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.ISSUE_UPDATE.value)),
):
    issue = (await db.execute(select(StockIssue).where(StockIssue.id == issue_id))).scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu xuất kho")
    if issue.status != IssueStatus.DRAFT.value:
        raise HTTPException(status_code=400, detail="Chỉ phiếu ở trạng thái Nháp mới có thể gửi duyệt")

    issue.status = IssueStatus.PENDING_APPROVAL.value
    await db.commit()
    return await get_issue(issue.id, db, current_user)


@router.post("/{issue_id}/approve", response_model=StockIssueResponse)
async def approve_issue(
    issue_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.ISSUE_APPROVE.value)),
):
    issue = (await db.execute(select(StockIssue).where(StockIssue.id == issue_id))).scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu xuất kho")
    if issue.status != IssueStatus.PENDING_APPROVAL.value:
        raise HTTPException(status_code=400, detail="Chỉ phiếu ở trạng thái Chờ duyệt mới có thể phê duyệt")

    issue.status = IssueStatus.APPROVED.value
    issue.approved_by = current_user.id
    await db.commit()
    return await get_issue(issue.id, db, current_user)


@router.post("/{issue_id}/complete", response_model=StockIssueResponse)
async def complete_issue(
    issue_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.ISSUE_COMPLETE.value)),
):
    """
    Completes stock issue and deducts inventory with SELECT FOR UPDATE.
    Guarantees no race condition, prevents negative stock, prevents double-deduction.
    """
    stmt = (
        select(StockIssue)
        .options(selectinload(StockIssue.items))
        .where(StockIssue.id == issue_id)
        .with_for_update()
    )
    issue = (await db.execute(stmt)).scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu xuất kho")

    if issue.status == IssueStatus.COMPLETED.value:
        raise HTTPException(status_code=400, detail="Phiếu xuất kho này đã được hoàn tất trước đó!")
    if issue.status not in (IssueStatus.APPROVED.value, IssueStatus.PENDING_APPROVAL.value, IssueStatus.DRAFT.value):
        raise HTTPException(status_code=400, detail=f"Không thể hoàn tất xuất kho ở trạng thái {issue.status}")

    # Process outbound deduction for all items atomically
    for item in issue.items:
        await InventoryService.record_outbound(
            db=db,
            warehouse_id=issue.warehouse_id,
            product_id=item.product_id,
            quantity=item.quantity,
            reference_type=ReferenceType.ISSUE.value,
            reference_id=issue.id,
            reference_code=issue.issue_code,
            user_id=current_user.id,
            notes=f"Xuất kho theo phiếu {issue.issue_code}",
        )

    issue.status = IssueStatus.COMPLETED.value
    if not issue.approved_by:
        issue.approved_by = current_user.id

    await db.commit()
    return await get_issue(issue.id, db, current_user)


@router.post("/{issue_id}/cancel", response_model=StockIssueResponse)
async def cancel_issue(
    issue_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.ISSUE_CANCEL.value)),
):
    issue = (await db.execute(select(StockIssue).where(StockIssue.id == issue_id))).scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu xuất kho")
    if issue.status == IssueStatus.COMPLETED.value:
        raise HTTPException(status_code=400, detail="Không thể hủy phiếu xuất đã hoàn tất")

    issue.status = IssueStatus.CANCELLED.value
    await db.commit()
    return await get_issue(issue.id, db, current_user)

