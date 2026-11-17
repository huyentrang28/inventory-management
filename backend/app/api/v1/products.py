import io
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
import openpyxl
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.permissions import PermissionEnum
from app.dependencies.auth import get_current_user, require_permissions
from app.models.auth import User
from app.models.inventory import InventoryBalance, InventoryTransaction
from app.models.master import Category, Product, Unit, Warehouse
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.inventory import InventoryBalanceResponse
from app.schemas.master import ProductCreate, ProductResponse, ProductUpdate

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=PaginatedResponse[ProductResponse])
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Product)
        .options(selectinload(Product.category), selectinload(Product.unit))
    )
    count_stmt = select(func.count(Product.id))

    if search:
        f = (
            Product.name.ilike(f"%{search}%")
            | Product.sku.ilike(f"%{search}%")
            | Product.barcode.ilike(f"%{search}%")
        )
        stmt = stmt.where(f)
        count_stmt = count_stmt.where(f)

    if category_id is not None:
        stmt = stmt.where(Product.category_id == category_id)
        count_stmt = count_stmt.where(Product.category_id == category_id)

    if is_active is not None:
        stmt = stmt.where(Product.is_active == is_active)
        count_stmt = count_stmt.where(Product.is_active == is_active)

    total = (await db.execute(count_stmt)).scalar() or 0
    total_pages = (total + page_size - 1) // page_size
    items = (
        (await db.execute(stmt.order_by(Product.id.desc()).offset((page - 1) * page_size).limit(page_size)))
        .scalars()
        .all()
    )

    return PaginatedResponse[ProductResponse](
        items=list(items),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/all", response_model=List[ProductResponse])
async def list_all_products(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Product)
        .options(selectinload(Product.category), selectinload(Product.unit))
        .where(Product.is_active == True)
        .order_by(Product.name.asc())
    )
    return list((await db.execute(stmt)).scalars().all())


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Product)
        .options(selectinload(Product.category), selectinload(Product.unit))
        .where(Product.id == product_id)
    )
    product = (await db.execute(stmt)).scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
    return product


@router.get("/{product_id}/balances", response_model=List[InventoryBalanceResponse])
async def get_product_balances(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(InventoryBalance)
        .options(selectinload(InventoryBalance.warehouse))
        .where(InventoryBalance.product_id == product_id)
    )
    return list((await db.execute(stmt)).scalars().all())


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.PRODUCT_CREATE.value)),
):
    existing = (await db.execute(select(Product).where(Product.sku == data.sku))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Mã SKU này đã tồn tại trong hệ thống")

    product = Product(**data.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)

    stmt = (
        select(Product)
        .options(selectinload(Product.category), selectinload(Product.unit))
        .where(Product.id == product.id)
    )
    return (await db.execute(stmt)).scalar_one()


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.PRODUCT_UPDATE.value)),
):
    product = (await db.execute(select(Product).where(Product.id == product_id))).scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")

    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(product, field, val)

    await db.commit()
    await db.refresh(product)

    stmt = (
        select(Product)
        .options(selectinload(Product.category), selectinload(Product.unit))
        .where(Product.id == product_id)
    )
    return (await db.execute(stmt)).scalar_one()


@router.delete("/{product_id}", response_model=MessageResponse)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(PermissionEnum.PRODUCT_DELETE.value)),
):
    product = (await db.execute(select(Product).where(Product.id == product_id))).scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")

    # Strict business rule: Do not hard-delete product with inventory transactions
    has_tx = (
        await db.execute(
            select(InventoryTransaction.id).where(InventoryTransaction.product_id == product_id).limit(1)
        )
    ).scalar_one_or_none()

    if has_tx:
        product.is_active = False
        await db.commit()
        return MessageResponse(
            message="Sản phẩm đã có lịch sử giao dịch kho, đã chuyển sang trạng thái ngưng kinh doanh thay vì xóa cứng"
        )

    await db.delete(product)
    await db.commit()
    return MessageResponse(message="Xóa sản phẩm thành công")


@router.get("/export/excel")
async def export_products_excel(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Product)
        .options(selectinload(Product.category), selectinload(Product.unit))
        .order_by(Product.sku.asc())
    )
    products = (await db.execute(stmt)).scalars().all()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Danh sách sản phẩm"

    headers = [
        "Mã SKU",
        "Mã Barcode",
        "Tên sản phẩm",
        "Danh mục",
        "Đơn vị tính",
        "Giá nhập tham khảo",
        "Giá bán tham khảo",
        "Tồn kho tối thiểu",
        "Trạng thái",
    ]
    ws.append(headers)

    for p in products:
        ws.append([
            p.sku,
            p.barcode or "",
            p.name,
            p.category.name if p.category else "",
            p.unit.name if p.unit else "",
            float(p.cost_price),
            float(p.selling_price),
            float(p.min_stock_level),
            "Đang kinh doanh" if p.is_active else "Ngừng kinh doanh",
        ])

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)

    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="danh_sach_san_pham.xlsx"'},
    )

