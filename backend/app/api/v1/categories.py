from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import PermissionEnum
from app.dependencies.auth import get_current_user, require_permissions
from app.models.auth import User
from app.models.master import Category, Product
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.master import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=PaginatedResponse[CategoryResponse])
async def list_categories(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Category)
    count_stmt = select(func.count(Category.id))

    if search:
        f = Category.name.ilike(f"%{search}%") | Category.code.ilike(f"%{search}%")
        stmt = stmt.where(f)
        count_stmt = count_stmt.where(f)

    total = (await db.execute(count_stmt)).scalar() or 0
    total_pages = (total + page_size - 1) // page_size
    categories = (await db.execute(stmt.order_by(Category.name.asc()).offset((page - 1) * page_size).limit(page_size))).scalars().all()

    return PaginatedResponse[CategoryResponse](
        items=list(categories),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/all", response_model=List[CategoryResponse])
async def list_all_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Category).where(Category.is_active == True).order_by(Category.name.asc())
    return list((await db.execute(stmt)).scalars().all())


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CATEGORY_MANAGE.value)),
):
    existing = (await db.execute(select(Category).where(Category.code == data.code))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Mã danh mục đã tồn tại")

    cat = Category(**data.model_dump())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat


@router.patch("/{cat_id}", response_model=CategoryResponse)
async def update_category(
    cat_id: int,
    data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CATEGORY_MANAGE.value)),
):
    cat = (await db.execute(select(Category).where(Category.id == cat_id))).scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục")

    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(cat, field, val)

    await db.commit()
    await db.refresh(cat)
    return cat


@router.delete("/{cat_id}", response_model=MessageResponse)
async def delete_category(
    cat_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.CATEGORY_MANAGE.value)),
):
    cat = (await db.execute(select(Category).where(Category.id == cat_id))).scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục")

    # Check if category has products
    has_prods = (await db.execute(select(Product.id).where(Product.category_id == cat_id).limit(1))).scalar_one_or_none()
    if has_prods:
        # Soft delete / deactivate
        cat.is_active = False
        await db.commit()
        return MessageResponse(message="Danh mục có sản phẩm liên kết nên đã được chuyển sang trạng thái ngưng hoạt động")

    await db.delete(cat)
    await db.commit()
    return MessageResponse(message="Xóa danh mục thành công")

