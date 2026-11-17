from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import PermissionEnum
from app.dependencies.auth import get_current_user, require_permissions
from app.models.auth import User
from app.models.master import Supplier
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.master import SupplierCreate, SupplierResponse, SupplierUpdate

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


@router.get("", response_model=PaginatedResponse[SupplierResponse])
async def list_suppliers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Supplier)
    count_stmt = select(func.count(Supplier.id))

    if search:
        f = (
            Supplier.name.ilike(f"%{search}%")
            | Supplier.code.ilike(f"%{search}%")
            | Supplier.phone.ilike(f"%{search}%")
            | Supplier.contact_person.ilike(f"%{search}%")
        )
        stmt = stmt.where(f)
        count_stmt = count_stmt.where(f)

    if is_active is not None:
        stmt = stmt.where(Supplier.is_active == is_active)
        count_stmt = count_stmt.where(Supplier.is_active == is_active)

    total = (await db.execute(count_stmt)).scalar() or 0
    total_pages = (total + page_size - 1) // page_size
    items = (await db.execute(stmt.order_by(Supplier.name.asc()).offset((page - 1) * page_size).limit(page_size))).scalars().all()

    return PaginatedResponse[SupplierResponse](
        items=list(items),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/all", response_model=List[SupplierResponse])
async def list_all_suppliers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Supplier).where(Supplier.is_active == True).order_by(Supplier.name.asc())
    return list((await db.execute(stmt)).scalars().all())


@router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
async def create_supplier(
    data: SupplierCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.SUPPLIER_MANAGE.value)),
):
    existing = (await db.execute(select(Supplier).where(Supplier.code == data.code))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Mã nhà cung cấp đã tồn tại")

    sup = Supplier(**data.model_dump())
    db.add(sup)
    await db.commit()
    await db.refresh(sup)
    return sup


@router.patch("/{sup_id}", response_model=SupplierResponse)
async def update_supplier(
    sup_id: int,
    data: SupplierUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.SUPPLIER_MANAGE.value)),
):
    sup = (await db.execute(select(Supplier).where(Supplier.id == sup_id))).scalar_one_or_none()
    if not sup:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhà cung cấp")

    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(sup, field, val)

    await db.commit()
    await db.refresh(sup)
    return sup

