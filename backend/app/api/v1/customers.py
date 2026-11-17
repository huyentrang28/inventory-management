from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import PermissionEnum
from app.dependencies.auth import get_current_user, require_permissions
from app.models.auth import User
from app.models.master import Customer
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.master import CustomerCreate, CustomerResponse, CustomerUpdate

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("", response_model=PaginatedResponse[CustomerResponse])
async def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Customer)
    count_stmt = select(func.count(Customer.id))

    if search:
        f = (
            Customer.name.ilike(f"%{search}%")
            | Customer.code.ilike(f"%{search}%")
            | Customer.phone.ilike(f"%{search}%")
            | Customer.contact_person.ilike(f"%{search}%")
        )
        stmt = stmt.where(f)
        count_stmt = count_stmt.where(f)

    if is_active is not None:
        stmt = stmt.where(Customer.is_active == is_active)
        count_stmt = count_stmt.where(Customer.is_active == is_active)

    total = (await db.execute(count_stmt)).scalar() or 0
    total_pages = (total + page_size - 1) // page_size
    items = (await db.execute(stmt.order_by(Customer.name.asc()).offset((page - 1) * page_size).limit(page_size))).scalars().all()

    return PaginatedResponse[CustomerResponse](
        items=list(items),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/all", response_model=List[CustomerResponse])
async def list_all_customers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Customer).where(Customer.is_active == True).order_by(Customer.name.asc())
    return list((await db.execute(stmt)).scalars().all())


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    data: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CUSTOMER_MANAGE.value)),
):
    existing = (await db.execute(select(Customer).where(Customer.code == data.code))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Mã khách hàng đã tồn tại")

    cust = Customer(**data.model_dump())
    db.add(cust)
    await db.commit()
    await db.refresh(cust)
    return cust


@router.patch("/{cust_id}", response_model=CustomerResponse)
async def update_customer(
    cust_id: int,
    data: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CUSTOMER_MANAGE.value)),
):
    cust = (await db.execute(select(Customer).where(Customer.id == cust_id))).scalar_one_or_none()
    if not cust:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")

    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(cust, field, val)

    await db.commit()
    await db.refresh(cust)
    return cust

