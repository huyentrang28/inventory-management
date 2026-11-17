import asyncio
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.logging import logger
from app.core.permissions import PermissionEnum, ROLE_PERMISSIONS, RoleEnum
from app.core.security import get_password_hash
from app.models.auth import Permission, Role, User
from app.models.master import Category, Customer, Product, Supplier, Unit, Warehouse
from app.models.audit import SystemSetting


async def seed_database(session: AsyncSession) -> None:
    logger.info("Checking and seeding database initial data...")

    # 1. Seed Permissions
    existing_perms = (await session.execute(select(Permission))).scalars().all()
    existing_perm_codes = {p.code for p in existing_perms}

    perm_objects = {}
    for perm_enum in PermissionEnum:
        code = perm_enum.value
        if code not in existing_perm_codes:
            module = code.split(":")[0]
            name = code.replace(":", " ").title()
            p = Permission(code=code, name=name, module=module)
            session.add(p)
            perm_objects[code] = p
        else:
            perm_objects[code] = next(p for p in existing_perms if p.code == code)
    await session.flush()

    # 2. Seed Roles
    existing_roles = (await session.execute(select(Role))).scalars().all()
    existing_role_names = {r.name for r in existing_roles}

    role_objects = {}
    for role_enum in RoleEnum:
        name = role_enum.value
        if name not in existing_role_names:
            r = Role(name=name, description=f"Vai trò {name}", is_system=True)
            # Assign permissions
            target_perms = ROLE_PERMISSIONS.get(name, [])
            r.permissions = [perm_objects[p] for p in target_perms if p in perm_objects]
            session.add(r)
            role_objects[name] = r
        else:
            role_objects[name] = next(r for r in existing_roles if r.name == name)
    await session.flush()

    # 3. Seed Super Admin User
    admin_email = settings.FIRST_SUPERUSER_EMAIL
    existing_admin = (
        await session.execute(select(User).where(User.email == admin_email))
    ).scalar_one_or_none()

    if not existing_admin:
        admin_user = User(
            email=admin_email,
            hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            full_name=settings.FIRST_SUPERUSER_FULLNAME,
            phone="0987654321",
            is_active=True,
            is_superuser=True,
        )
        admin_user.roles = [role_objects[RoleEnum.ADMIN.value]]
        session.add(admin_user)
        logger.info(f"Created initial admin user: {admin_email}")

    # 4. Seed Categories
    cats_data = [
        ("CAT-ELEC", "Điện tử & Phụ kiện", "Các thiết bị điện tử, máy tính và phụ kiện công nghệ"),
        ("CAT-OFFICE", "Thiết bị văn phòng", "Dụng cụ, thiết bị phục vụ văn phòng làm việc"),
        ("CAT-HOME", "Gia dụng & Tiện ích", "Thiết bị và đồ dùng gia dụng"),
        ("CAT-PACK", "Bao bì & Đóng gói", "Vật liệu và bao bì phục vụ xuất kho"),
    ]
    existing_cats = {c.code: c for c in (await session.execute(select(Category))).scalars().all()}
    for code, name, desc in cats_data:
        if code not in existing_cats:
            cat = Category(code=code, name=name, description=desc, is_active=True)
            session.add(cat)
            existing_cats[code] = cat
    await session.flush()

    # 5. Seed Units
    units_data = [
        ("PCS", "Cái", "Đơn vị tính từng cái riêng lẻ"),
        ("BOX", "Thùng", "Đơn vị thùng tiêu chuẩn"),
        ("PKT", "Hộp", "Đơn vị đóng hộp nhỏ"),
        ("SET", "Bộ", "Đơn vị theo bộ sản phẩm"),
        ("KG", "Kg", "Đơn vị kilôgam"),
    ]
    existing_units = {u.code: u for u in (await session.execute(select(Unit))).scalars().all()}
    for code, name, desc in units_data:
        if code not in existing_units:
            unit = Unit(code=code, name=name, description=desc)
            session.add(unit)
            existing_units[code] = unit
    await session.flush()

    # 6. Seed Warehouses
    warehouses_data = [
        ("WH-HN", "Kho Tổng Hà Nội", "Số 15 Phố Duy Tân, Cầu Giấy, Hà Nội", "Nguyễn Văn An", "0912345678", "Kho trung tâm miền Bắc"),
        ("WH-HCM", "Kho Miền Nam", "Lô A3 Khu Công Nghệ Cao, TP. Thủ Đức, TP. HCM", "Trần Thị Bình", "0923456789", "Kho phân phối chính miền Nam"),
        ("WH-DN", "Kho Đà Nẵng", "Đường số 2, KCN Hòa Cầm, Cẩm Lệ, Đà Nẵng", "Lê Văn Cường", "0934567890", "Kho trung chuyển miền Trung"),
    ]
    existing_whs = {w.code: w for w in (await session.execute(select(Warehouse))).scalars().all()}
    for code, name, addr, mgr, phone, desc in warehouses_data:
        if code not in existing_whs:
            wh = Warehouse(code=code, name=name, address=addr, manager_name=mgr, phone=phone, description=desc, is_active=True)
            session.add(wh)
            existing_whs[code] = wh
    await session.flush()

    # 7. Seed Suppliers
    suppliers_data = [
        ("SUP-001", "Công ty TNHH Công Nghệ Toàn Cầu", "0243888999", "contact@toancau-tech.vn", "Tòa nhà TTC, Cầu Giấy, Hà Nội", "0109988776", "Nguyễn Minh Tuấn", "Nhà cung cấp phụ kiện máy tính chính hãng"),
        ("SUP-002", "Nhà Phân Phối Thiết Bị An Phát", "0287111222", "sales@anphat-dist.com", "Quận 10, TP. Hồ Chí Minh", "0301122334", "Phạm Quốc Huy", "Chuyên phân phối màn hình và linh kiện"),
        ("SUP-003", "Tổng Kho Điện Máy Phúc Hưng", "0236355566", "kinhdoanh@phuchung.vn", "Khu Dân Cư An Hải, Đà Nẵng", "0403344556", "Võ Hoàng Nam", "Đối tác thiết bị mạng và phụ kiện"),
    ]
    existing_sups = {s.code: s for s in (await session.execute(select(Supplier))).scalars().all()}
    for code, name, phone, email, addr, tax, contact, notes in suppliers_data:
        if code not in existing_sups:
            sup = Supplier(code=code, name=name, phone=phone, email=email, address=addr, tax_id=tax, contact_person=contact, notes=notes, is_active=True)
            session.add(sup)
            existing_sups[code] = sup
    await session.flush()

    # 8. Seed Customers
    customers_data = [
        ("CUST-001", "Công ty Cổ phần Bán lẻ Minh Tâm", "0908123456", "muahang@minhtam-retail.com", "120 Hai Bà Trưng, Quận 1, TP. HCM", "0311223399", "Đặng Thùy Dung", "Khách hàng đại lý VIP"),
        ("CUST-002", "Chuỗi Siêu Thị Điện Máy Á Châu", "0918765432", "procurement@achau-elec.vn", "45 Nguyễn Trãi, Thanh Xuân, Hà Nội", "0102233445", "Bùi Thanh Phong", "Chuỗi bán lẻ điện máy"),
        ("CUST-003", "Công ty TNHH Giải Pháp Trí Tuệ Số", "0939112233", "it@digitalsolutions.vn", "Khu Công Viên Phần Mềm Quang Trung, TP. HCM", "0319887766", "Hoàng Kim Oanh", "Doanh nghiệp mua sắm thiết bị nội bộ"),
    ]
    existing_custs = {c.code: c for c in (await session.execute(select(Customer))).scalars().all()}
    for code, name, phone, email, addr, tax, contact, notes in customers_data:
        if code not in existing_custs:
            cust = Customer(code=code, name=name, phone=phone, email=email, address=addr, tax_id=tax, contact_person=contact, notes=notes, is_active=True)
            session.add(cust)
            existing_custs[code] = cust
    await session.flush()

    # 9. Seed Products
    products_data = [
        ("LOGI-MX3S", "69321045001", "Chuột không dây Logitech MX Master 3S", "CAT-ELEC", "PCS", Decimal("1850000"), Decimal("2450000"), Decimal("10")),
        ("KEY-K2P", "69321045002", "Bàn phím cơ không dây Keychron K2 Pro", "CAT-ELEC", "PCS", Decimal("1950000"), Decimal("2650000"), Decimal("5")),
        ("DELL-U27", "69321045003", "Màn hình đồ họa Dell UltraSharp U2723QE 4K", "CAT-ELEC", "PCS", Decimal("11200000"), Decimal("13990000"), Decimal("3")),
        ("SONY-XM5", "69321045004", "Tai nghe chống ồn Sony WH-1000XM5", "CAT-ELEC", "PCS", Decimal("6200000"), Decimal("7990000"), Decimal("4")),
        ("ANKER-100W", "69321045005", "Cáp sạc siêu bền Anker 100W Type-C 1.8m", "CAT-ELEC", "PCS", Decimal("160000"), Decimal("250000"), Decimal("20")),
        ("OFF-CHAIR-ERG", "69321045006", "Ghế công thái học Sihoo Doro C300", "CAT-OFFICE", "PCS", Decimal("5100000"), Decimal("6800000"), Decimal("5")),
        ("OFF-DESK-MAT", "69321045007", "Thảm da trải bàn làm việc cỡ lớn 90x45cm", "CAT-OFFICE", "PCS", Decimal("110000"), Decimal("190000"), Decimal("15")),
        ("BOX-CARTON-M", "69321045008", "Thùng carton 3 lớp đóng hàng 30x20x15cm", "CAT-PACK", "BOX", Decimal("8000"), Decimal("15000"), Decimal("100")),
    ]
    existing_prods = {p.sku: p for p in (await session.execute(select(Product))).scalars().all()}
    for sku, barcode, name, cat_code, unit_code, cost, sell, min_stock in products_data:
        if sku not in existing_prods:
            cat_id = existing_cats[cat_code].id if cat_code in existing_cats else None
            unit_id = existing_units[unit_code].id if unit_code in existing_units else None
            prod = Product(
                sku=sku,
                barcode=barcode,
                name=name,
                category_id=cat_id,
                unit_id=unit_id,
                cost_price=cost,
                selling_price=sell,
                min_stock_level=min_stock,
                is_active=True,
            )
            session.add(prod)
            existing_prods[sku] = prod
    await session.flush()

    # 10. Seed System Settings
    settings_data = [
        ("COMPANY_NAME", "Công ty TNHH Quản Lý Kho Vận Việt Nam", "Tên doanh nghiệp", True),
        ("CURRENCY", "VND", "Đơn vị tiền tệ chính", True),
        ("TIMEZONE", "Asia/Ho_Chi_Minh", "Múi giờ hệ thống", True),
        ("LOW_STOCK_ALERT_THRESHOLD", "10", "Ngưỡng cảnh báo tồn kho thấp mặc định", False),
    ]
    existing_settings = {s.key: s for s in (await session.execute(select(SystemSetting))).scalars().all()}
    for key, val, desc, is_pub in settings_data:
        if key not in existing_settings:
            s = SystemSetting(key=key, value=val, description=desc, is_public=is_pub)
            session.add(s)
    
    await session.commit()
    logger.info("Database seeding completed successfully.")


async def main():
    async with AsyncSessionLocal() as session:
        await seed_database(session)


if __name__ == "__main__":
    asyncio.run(main())

