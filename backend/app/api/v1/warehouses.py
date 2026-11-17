from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import PermissionEnum
from app.dependencies.auth import get_current_user, require_permissions
from app.models.auth import User
from app.models.inventory import InventoryBalance, InventoryTransaction
from app.models.master import Warehouse
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.master import WarehouseCreate, WarehouseResponse, WarehouseUpdate

router = APIRouter(prefix="/warehouses", tags=["Warehouses"])


@router.get("", response_model=PaginatedResponse[WarehouseResponse])
async def list_warehouses(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Warehouse)
    count_stmt = select(func.count(Warehouse.id))

    if search:
        f = Warehouse.name.ilike(f"%{search}%") | Warehouse.code.ilike(f"%{search}%") | Warehouse.manager_name.ilike(f"%{search}%")
        stmt = stmt.where(f)
        count_stmt = count_stmt.where(f)

    if is_active is not None:
        stmt = stmt.where(Warehouse.is_active == is_active)
        count_stmt = count_stmt.where(Warehouse.is_active == is_active)

    total = (await db.execute(count_stmt)).scalar() or 0
    total_pages = (total + page_size - 1) // page_size
    warehouses = (await db.execute(stmt.order_by(Warehouse.id.asc()).offset((page - 1) * page_size).limit(page_size))).scalars().all()

    return PaginatedResponse[WarehouseResponse](
        items=list(warehouses),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/all", response_model=List[WarehouseResponse])
async def list_all_warehouses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Warehouse).where(Warehouse.is_active == True).order_by(Warehouse.id.asc())
    return list((await db.execute(stmt)).scalars().all())


@router.get("/{wh_id}", response_model=WarehouseResponse)
async def get_warehouse(
    wh_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wh = (await db.execute(select(Warehouse).where(Warehouse.id == wh_id))).scalar_one_or_none()
    if not wh:
        raise HTTPException(status_code=404, detail="Không tìm thấy kho hàng")
    return wh


@router.post("", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
async def create_warehouse(
    data: WarehouseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.WAREHOUSE_CREATE.value)),
):
    existing = (await db.execute(select(Warehouse).where(Warehouse.code == data.code))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Mã kho này đã tồn tại")

    wh = Warehouse(**data.model_dump())
    db.add(wh)
    await db.commit()
    await db.refresh(wh)
    return wh


@router.patch("/{wh_id}", response_model=WarehouseResponse)
async def update_warehouse(
    wh_id: int,
    data: WarehouseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.WAREHOUSE_UPDATE.value)),
):
    wh = (await db.execute(select(Warehouse).where(Warehouse.id == wh_id))).scalar_one_or_none()
    if not wh:
        raise HTTPException(status_code=404, detail="Không tìm thấy kho hàng")

    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(wh, field, val)

    await db.commit()
    await db.refresh(wh)
    return wh


@router.delete("/{wh_id}", response_model=MessageResponse)
async def delete_warehouse(
    wh_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.WAREHOUSE_DELETE.value)),
):
    wh = (await db.execute(select(Warehouse).where(Warehouse.id == wh_id))).scalar_one_or_none()
    if not wh:
        raise HTTPException(status_code=404, detail="Không tìm thấy kho hàng")

    # Strict check: Cannot delete warehouse with transaction history
    has_tx = (await db.execute(select(InventoryTransaction.id).where(InventoryTransaction.warehouse_id == wh_id).limit(1))).scalar_one_or_none()
    if has_tx:
        wh.is_active = False
        await db.commit()
        return MessageResponse(
            message="Kho đã phát sinh giao dịch xuất nhập, hệ thống đã chuyển kho sang trạng thái ngưng hoạt động thay vì xóa cứng."
        )

    await db.delete(wh)
    await db.commit()
    return MessageResponse(message="Xóa kho hàng thành công")

