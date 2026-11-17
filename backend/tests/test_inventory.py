from decimal import Decimal
import pytest
from fastapi import HTTPException
from sqlalchemy import select

from app.models.inventory import InventoryBalance, ReferenceType, TransactionType
from app.models.master import Product, Warehouse
from app.services.inventory_service import InventoryService


@pytest.mark.asyncio
async def test_inventory_inbound(test_session):
    wh = (await test_session.execute(select(Warehouse))).scalars().first()
    prod = (await test_session.execute(select(Product))).scalars().first()

    # Record first inbound of 10 items at cost 100,000
    tx1 = await InventoryService.record_inbound(
        db=test_session,
        warehouse_id=wh.id,
        product_id=prod.id,
        quantity=Decimal("10.000"),
        unit_cost=Decimal("100000.00"),
        reference_type=ReferenceType.RECEIPT.value,
        reference_id=1,
        reference_code="PNK-001",
    )
    await test_session.commit()

    assert tx1.transaction_type == TransactionType.INBOUND.value
    assert tx1.balance_before == Decimal("0.000")
    assert tx1.balance_after == Decimal("10.000")
    assert tx1.quantity == Decimal("10.000")

    # Verify balance record
    bal = (
        await test_session.execute(
            select(InventoryBalance).where(
                InventoryBalance.warehouse_id == wh.id,
                InventoryBalance.product_id == prod.id,
            )
        )
    ).scalar_one()
    assert bal.quantity_on_hand == Decimal("10.000")
    assert bal.avg_cost == Decimal("100000.00")

    # Record second inbound of 10 items at cost 120,000 -> weighted average should be 110,000
    tx2 = await InventoryService.record_inbound(
        db=test_session,
        warehouse_id=wh.id,
        product_id=prod.id,
        quantity=Decimal("10.000"),
        unit_cost=Decimal("120000.00"),
        reference_type=ReferenceType.RECEIPT.value,
        reference_id=2,
        reference_code="PNK-002",
    )
    await test_session.commit()

    assert tx2.balance_before == Decimal("10.000")
    assert tx2.balance_after == Decimal("20.000")

    await test_session.refresh(bal)
    assert bal.quantity_on_hand == Decimal("20.000")
    assert bal.avg_cost == Decimal("110000.00")


@pytest.mark.asyncio
async def test_inventory_outbound_success(test_session):
    wh = (await test_session.execute(select(Warehouse))).scalars().first()
    prod = (await test_session.execute(select(Product))).scalars().first()

    # Inbound 15 items
    await InventoryService.record_inbound(
        db=test_session,
        warehouse_id=wh.id,
        product_id=prod.id,
        quantity=Decimal("15.000"),
        unit_cost=Decimal("50000.00"),
        reference_type=ReferenceType.RECEIPT.value,
        reference_id=3,
        reference_code="PNK-003",
    )
    await test_session.commit()

    # Outbound 5 items
    tx_out = await InventoryService.record_outbound(
        db=test_session,
        warehouse_id=wh.id,
        product_id=prod.id,
        quantity=Decimal("5.000"),
        reference_type=ReferenceType.ISSUE.value,
        reference_id=1,
        reference_code="PXK-001",
    )
    await test_session.commit()

    assert tx_out.transaction_type == TransactionType.OUTBOUND.value
    assert tx_out.quantity == Decimal("5.000")
    assert tx_out.balance_after == Decimal("10.000")


@pytest.mark.asyncio
async def test_inventory_outbound_exceed_fails(test_session):
    wh = (await test_session.execute(select(Warehouse))).scalars().first()
    prod = (await test_session.execute(select(Product))).scalars().first()

    # Attempting to issue 9999 items when on-hand is low must raise 400
    with pytest.raises(HTTPException) as excinfo:
        await InventoryService.record_outbound(
            db=test_session,
            warehouse_id=wh.id,
            product_id=prod.id,
            quantity=Decimal("9999.000"),
            reference_type=ReferenceType.ISSUE.value,
            reference_id=99,
            reference_code="PXK-EXCEED",
        )
    assert excinfo.value.status_code == 400
    assert "Tồn kho không đủ" in excinfo.value.detail


@pytest.mark.asyncio
async def test_inventory_negative_quantity_fails(test_session):
    wh = (await test_session.execute(select(Warehouse))).scalars().first()
    prod = (await test_session.execute(select(Product))).scalars().first()

    # Attempt negative inbound
    with pytest.raises(HTTPException) as excinfo:
        await InventoryService.record_inbound(
            db=test_session,
            warehouse_id=wh.id,
            product_id=prod.id,
            quantity=Decimal("-5.000"),
            unit_cost=Decimal("10000.00"),
            reference_type=ReferenceType.RECEIPT.value,
            reference_id=999,
            reference_code="PNK-NEG",
        )
    assert excinfo.value.status_code == 400

    # Attempt negative outbound
    with pytest.raises(HTTPException) as excinfo:
        await InventoryService.record_outbound(
            db=test_session,
            warehouse_id=wh.id,
            product_id=prod.id,
            quantity=Decimal("-2.000"),
            reference_type=ReferenceType.ISSUE.value,
            reference_id=999,
            reference_code="PXK-NEG",
        )
    assert excinfo.value.status_code == 400

