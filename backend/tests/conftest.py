import asyncio
from decimal import Decimal
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base
from app.core.security import get_password_hash
from app.models.auth import Role, User
from app.models.master import Category, Product, Unit, Warehouse

# SQLite async URL for unit tests
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_session():
    engine = create_async_engine(TEST_DB_URL, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # Seed test warehouse & product
        wh = Warehouse(code="WH-TEST", name="Kho Test", is_active=True)
        session.add(wh)

        cat = Category(code="CAT-TEST", name="Danh mục test", is_active=True)
        session.add(cat)

        unit = Unit(code="PCS", name="Cái")
        session.add(unit)
        await session.flush()

        prod = Product(
            sku="TEST-SKU-001",
            name="Sản phẩm Test 01",
            category_id=cat.id,
            unit_id=unit.id,
            cost_price=Decimal("100000.00"),
            selling_price=Decimal("150000.00"),
            min_stock_level=Decimal("5.000"),
            is_active=True,
        )
        session.add(prod)

        admin = User(
            email="admin@test.local",
            hashed_password=get_password_hash("Admin@123"),
            full_name="Admin Test",
            is_active=True,
            is_superuser=True,
        )
        session.add(admin)

        await session.commit()
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

