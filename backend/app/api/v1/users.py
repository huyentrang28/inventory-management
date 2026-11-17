from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.permissions import PermissionEnum
from app.core.security import get_password_hash
from app.dependencies.auth import get_current_user, require_permissions
from app.models.auth import Permission, Role, User
from app.schemas.auth import (
    PermissionResponse,
    RoleCreate,
    RoleResponse,
    RoleUpdate,
    UserCreate,
    UserResponse,
    UserUpdate,
)
from app.schemas.common import MessageResponse, PaginatedResponse

router = APIRouter(prefix="/users", tags=["Users & Permissions"])


@router.get("", response_model=PaginatedResponse[UserResponse])
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.USER_MANAGE.value)),
):
    stmt = select(User).options(selectinload(User.roles).selectinload(Role.permissions))
    count_stmt = select(func.count(User.id))

    if search:
        search_filter = User.email.ilike(f"%{search}%") | User.full_name.ilike(f"%{search}%")
        stmt = stmt.where(search_filter)
        count_stmt = count_stmt.where(search_filter)

    if is_active is not None:
        stmt = stmt.where(User.is_active == is_active)
        count_stmt = count_stmt.where(User.is_active == is_active)

    total = (await db.execute(count_stmt)).scalar() or 0
    total_pages = (total + page_size - 1) // page_size

    stmt = stmt.order_by(User.id.desc()).offset((page - 1) * page_size).limit(page_size)
    users = (await db.execute(stmt)).scalars().all()

    return PaginatedResponse[UserResponse](
        items=list(users),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.USER_MANAGE.value)),
):
    # Check duplicate email
    existing = (
        await db.execute(select(User).where(User.email == data.email))
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này đã được sử dụng bởi người dùng khác",
        )

    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        phone=data.phone,
        is_active=data.is_active,
        is_superuser=data.is_superuser,
    )

    if data.role_ids:
        roles_stmt = select(Role).where(Role.id.in_(data.role_ids))
        roles = (await db.execute(roles_stmt)).scalars().all()
        user.roles = list(roles)

    db.add(user)
    await db.commit()
    await db.refresh(user)

    stmt = (
        select(User)
        .options(selectinload(User.roles).selectinload(Role.permissions))
        .where(User.id == user.id)
    )
    return (await db.execute(stmt)).scalar_one()


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.USER_MANAGE.value)),
):
    stmt = (
        select(User)
        .options(selectinload(User.roles).selectinload(Role.permissions))
        .where(User.id == user_id)
    )
    user = (await db.execute(stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.phone is not None:
        user.phone = data.phone
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.password:
        user.hashed_password = get_password_hash(data.password)

    if data.role_ids is not None:
        roles_stmt = select(Role).where(Role.id.in_(data.role_ids))
        roles = (await db.execute(roles_stmt)).scalars().all()
        user.roles = list(roles)

    await db.commit()
    await db.refresh(user)
    return user


# Roles & Permissions Endpoints
@router.get("/roles/all", response_model=List[RoleResponse])
async def list_all_roles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Role).options(selectinload(Role.permissions)).order_by(Role.id.asc())
    roles = (await db.execute(stmt)).scalars().all()
    return list(roles)


@router.get("/permissions/all", response_model=List[PermissionResponse])
async def list_all_permissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Permission).order_by(Permission.module.asc(), Permission.code.asc())
    perms = (await db.execute(stmt)).scalars().all()
    return list(perms)


@router.post("/roles", response_model=RoleResponse)
async def create_role(
    data: RoleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.ROLE_MANAGE.value)),
):
    existing = (await db.execute(select(Role).where(Role.name == data.name))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Tên vai trò này đã tồn tại")

    role = Role(name=data.name, description=data.description, is_system=False)
    if data.permission_ids:
        perms = (await db.execute(select(Permission).where(Permission.id.in_(data.permission_ids)))).scalars().all()
        role.permissions = list(perms)

    db.add(role)
    await db.commit()
    await db.refresh(role)
    return role


@router.patch("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    data: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.ROLE_MANAGE.value)),
):
    role = (await db.execute(select(Role).options(selectinload(Role.permissions)).where(Role.id == role_id))).scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Không tìm thấy vai trò")

    if data.name:
        role.name = data.name
    if data.description is not None:
        role.description = data.description
    if data.permission_ids is not None:
        perms = (await db.execute(select(Permission).where(Permission.id.in_(data.permission_ids)))).scalars().all()
        role.permissions = list(perms)

    await db.commit()
    await db.refresh(role)
    return role

