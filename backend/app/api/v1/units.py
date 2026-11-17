from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import PermissionEnum
from app.dependencies.auth import get_current_user, require_permissions
from app.models.auth import User
from app.models.master import Unit
from app.schemas.common import MessageResponse
from app.schemas.master import UnitCreate, UnitResponse, UnitUpdate

router = APIRouter(prefix="/units", tags=["Units"])


@router.get("", response_model=List[UnitResponse])
async def list_units(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Unit).order_by(Unit.name.asc())
    units = (await db.execute(stmt)).scalars().all()
    return list(units)


@router.post("", response_model=UnitResponse, status_code=status.HTTP_201_CREATED)
async def create_unit(
    data: UnitCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CATEGORY_MANAGE.value)),
):
    existing = (await db.execute(select(Unit).where(Unit.code == data.code))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Mã đơn vị tính đã tồn tại")

    unit = Unit(**data.model_dump())
    db.add(unit)
    await db.commit()
    await db.refresh(unit)
    return unit


@router.patch("/{unit_id}", response_model=UnitResponse)
async def update_unit(
    unit_id: int,
    data: UnitUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CATEGORY_MANAGE.value)),
):
    unit = (await db.execute(select(Unit).where(Unit.id == unit_id))).scalar_one_or_none()
    if not unit:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn vị tính")

    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(unit, field, val)

    await db.commit()
    await db.refresh(unit)
    return unit

