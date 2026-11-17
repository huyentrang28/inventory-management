from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import PermissionEnum
from app.dependencies.auth import get_current_user, require_permissions
from app.models.auth import User
from app.models.audit import SystemSetting
from app.schemas.audit import SystemSettingResponse, SystemSettingUpdate

router = APIRouter(prefix="/settings", tags=["System Settings"])


@router.get("", response_model=List[SystemSettingResponse])
async def list_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.is_superuser or any(r.name == "Admin" for r in current_user.roles):
        stmt = select(SystemSetting).order_by(SystemSetting.key.asc())
    else:
        stmt = select(SystemSetting).where(SystemSetting.is_public == True).order_by(SystemSetting.key.asc())
    return list((await db.execute(stmt)).scalars().all())


@router.patch("/{key}", response_model=SystemSettingResponse)
async def update_setting(
    key: str,
    data: SystemSettingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.SYSTEM_MANAGE.value)),
):
    setting = (await db.execute(select(SystemSetting).where(SystemSetting.key == key))).scalar_one_or_none()
    if not setting:
        raise HTTPException(status_code=404, detail="Không tìm thấy cài đặt này")

    setting.value = data.value
    if data.description is not None:
        setting.description = data.description

    await db.commit()
    await db.refresh(setting)
    return setting

