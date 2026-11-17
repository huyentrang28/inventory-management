from datetime import datetime, timezone
from decimal import Decimal
import uuid
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inventory import (
    InventoryBalance,
    InventoryTransaction,
    ReferenceType,
    TransactionType,
)
from app.models.master import Product


class InventoryService:
    @staticmethod
    def _generate_tx_code(prefix: str = "TX") -> str:
        timestamp_part = datetime.now(timezone.utc).strftime("%y%m%d%H%M%S")
        uuid_part = uuid.uuid4().hex[:6].upper()
        return f"{prefix}-{timestamp_part}-{uuid_part}"

    @classmethod
    async def get_or_create_balance_for_update(
        cls,
        db: AsyncSession,
        warehouse_id: int,
        product_id: int,
    ) -> InventoryBalance:
        """
        Pessimistic lock on inventory_balances row via SELECT FOR UPDATE.
        If row does not exist, creates it with 0 quantity and locks it.
        """
        stmt = (
            select(InventoryBalance)
            .where(
                InventoryBalance.warehouse_id == warehouse_id,
                InventoryBalance.product_id == product_id,
            )
            .with_for_update()
        )
        balance = (await db.execute(stmt)).scalar_one_or_none()

        if balance is None:
            # Insert row first
            new_balance = InventoryBalance(
                warehouse_id=warehouse_id,
                product_id=product_id,
                quantity_on_hand=Decimal("0.000"),
                quantity_reserved=Decimal("0.000"),
                avg_cost=Decimal("0.00"),
            )
            db.add(new_balance)
            await db.flush()

            # Now re-select with FOR UPDATE
            balance = (await db.execute(stmt)).scalar_one()

        return balance

    @classmethod
    async def record_inbound(
        cls,
        db: AsyncSession,
        warehouse_id: int,
        product_id: int,
        quantity: Decimal,
        unit_cost: Decimal,
        reference_type: str,
        reference_id: int,
        reference_code: str,
        user_id: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> InventoryTransaction:
        if quantity <= Decimal("0"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Số lượng nhập kho phải lớn hơn 0",
            )
        if unit_cost < Decimal("0"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Đơn giá nhập không được nhỏ hơn 0",
            )

        # 1. Lock current balance row
        balance = await cls.get_or_create_balance_for_update(db, warehouse_id, product_id)
        balance_before = balance.quantity_on_hand

        # 2. Calculate weighted average unit cost
        # (current_qty * current_avg + in_qty * unit_cost) / (current_qty + in_qty)
        total_qty = balance.quantity_on_hand + quantity
        if total_qty > Decimal("0"):
            current_value = balance.quantity_on_hand * balance.avg_cost
            inbound_value = quantity * unit_cost
            balance.avg_cost = ((current_value + inbound_value) / total_qty).quantize(Decimal("0.01"))

        # 3. Increase on-hand quantity
        balance.quantity_on_hand += quantity
        balance_after = balance.quantity_on_hand

        # 4. Insert immutable transaction log
        total_tx_value = (quantity * unit_cost).quantize(Decimal("0.01"))
        tx = InventoryTransaction(
            transaction_code=cls._generate_tx_code("TX-IN"),
            warehouse_id=warehouse_id,
            product_id=product_id,
            transaction_type=TransactionType.INBOUND.value,
            quantity=quantity,
            unit_cost=unit_cost,
            total_value=total_tx_value,
            balance_before=balance_before,
            balance_after=balance_after,
            reference_type=reference_type,
            reference_id=reference_id,
            reference_code=reference_code,
            notes=notes,
            created_by=user_id,
        )
        db.add(tx)
        await db.flush()

        # Update product cost_price in master table as latest cost
        prod = (await db.execute(select(Product).where(Product.id == product_id))).scalar_one_or_none()
        if prod and unit_cost > Decimal("0"):
            prod.cost_price = unit_cost

        return tx

    @classmethod
    async def record_outbound(
        cls,
        db: AsyncSession,
        warehouse_id: int,
        product_id: int,
        quantity: Decimal,
        reference_type: str,
        reference_id: int,
        reference_code: str,
        user_id: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> InventoryTransaction:
        if quantity <= Decimal("0"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Số lượng xuất kho phải lớn hơn 0",
            )

        # 1. Lock current balance row
        balance = await cls.get_or_create_balance_for_update(db, warehouse_id, product_id)
        balance_before = balance.quantity_on_hand

        # 2. Strict check: cannot issue more than available
        if balance.quantity_on_hand < quantity:
            # Query product name for clear error message
            prod = (await db.execute(select(Product).where(Product.id == product_id))).scalar_one_or_none()
            prod_name = prod.name if prod else f"ID {product_id}"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Tồn kho không đủ để xuất cho sản phẩm '{prod_name}'. "
                    f"Yêu cầu: {quantity}, Tồn kho khả dụng: {balance.quantity_on_hand}"
                ),
            )

        # 3. Deduct on-hand quantity
        balance.quantity_on_hand -= quantity
        balance_after = balance.quantity_on_hand
        unit_cost = balance.avg_cost
        total_tx_value = (quantity * unit_cost).quantize(Decimal("0.01"))

        # 4. Insert immutable transaction log
        tx = InventoryTransaction(
            transaction_code=cls._generate_tx_code("TX-OUT"),
            warehouse_id=warehouse_id,
            product_id=product_id,
            transaction_type=TransactionType.OUTBOUND.value,
            quantity=quantity,
            unit_cost=unit_cost,
            total_value=total_tx_value,
            balance_before=balance_before,
            balance_after=balance_after,
            reference_type=reference_type,
            reference_id=reference_id,
            reference_code=reference_code,
            notes=notes,
            created_by=user_id,
        )
        db.add(tx)
        await db.flush()
        return tx

    @classmethod
    async def record_transfer_dispatch(
        cls,
        db: AsyncSession,
        source_warehouse_id: int,
        product_id: int,
        quantity: Decimal,
        transfer_id: int,
        transfer_code: str,
        user_id: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> InventoryTransaction:
        """Deducts stock from source warehouse when transfer enters IN_TRANSIT status."""
        if quantity <= Decimal("0"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Số lượng chuyển kho phải lớn hơn 0",
            )

        balance = await cls.get_or_create_balance_for_update(db, source_warehouse_id, product_id)
        balance_before = balance.quantity_on_hand

        if balance.quantity_on_hand < quantity:
            prod = (await db.execute(select(Product).where(Product.id == product_id))).scalar_one_or_none()
            prod_name = prod.name if prod else f"ID {product_id}"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Kho nguồn không đủ tồn để chuyển sản phẩm '{prod_name}'. "
                    f"Cần chuyển: {quantity}, Hiện có: {balance.quantity_on_hand}"
                ),
            )

        balance.quantity_on_hand -= quantity
        balance_after = balance.quantity_on_hand
        unit_cost = balance.avg_cost
        total_tx_value = (quantity * unit_cost).quantize(Decimal("0.01"))

        tx = InventoryTransaction(
            transaction_code=cls._generate_tx_code("TX-TR-OUT"),
            warehouse_id=source_warehouse_id,
            product_id=product_id,
            transaction_type=TransactionType.TRANSFER_OUT.value,
            quantity=quantity,
            unit_cost=unit_cost,
            total_value=total_tx_value,
            balance_before=balance_before,
            balance_after=balance_after,
            reference_type=ReferenceType.TRANSFER.value,
            reference_id=transfer_id,
            reference_code=transfer_code,
            notes=notes,
            created_by=user_id,
        )
        db.add(tx)
        await db.flush()
        return tx

    @classmethod
    async def record_transfer_receive(
        cls,
        db: AsyncSession,
        dest_warehouse_id: int,
        product_id: int,
        quantity: Decimal,
        unit_cost: Decimal,
        transfer_id: int,
        transfer_code: str,
        user_id: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> InventoryTransaction:
        """Adds stock to destination warehouse when transfer is RECEIVED."""
        balance = await cls.get_or_create_balance_for_update(db, dest_warehouse_id, product_id)
        balance_before = balance.quantity_on_hand

        total_qty = balance.quantity_on_hand + quantity
        if total_qty > Decimal("0"):
            current_value = balance.quantity_on_hand * balance.avg_cost
            inbound_value = quantity * unit_cost
            balance.avg_cost = ((current_value + inbound_value) / total_qty).quantize(Decimal("0.01"))

        balance.quantity_on_hand += quantity
        balance_after = balance.quantity_on_hand
        total_tx_value = (quantity * unit_cost).quantize(Decimal("0.01"))

        tx = InventoryTransaction(
            transaction_code=cls._generate_tx_code("TX-TR-IN"),
            warehouse_id=dest_warehouse_id,
            product_id=product_id,
            transaction_type=TransactionType.TRANSFER_IN.value,
            quantity=quantity,
            unit_cost=unit_cost,
            total_value=total_tx_value,
            balance_before=balance_before,
            balance_after=balance_after,
            reference_type=ReferenceType.TRANSFER.value,
            reference_id=transfer_id,
            reference_code=transfer_code,
            notes=notes,
            created_by=user_id,
        )
        db.add(tx)
        await db.flush()
        return tx

    @classmethod
    async def record_stock_count_adjustment(
        cls,
        db: AsyncSession,
        warehouse_id: int,
        product_id: int,
        system_quantity: Decimal,
        actual_quantity: Decimal,
        count_id: int,
        count_code: str,
        user_id: Optional[int] = None,
        reason: Optional[str] = None,
    ) -> Optional[InventoryTransaction]:
        """Applies difference adjustment when stock count is approved and completed."""
        diff = actual_quantity - system_quantity
        if diff == Decimal("0"):
            return None

        balance = await cls.get_or_create_balance_for_update(db, warehouse_id, product_id)
        balance_before = balance.quantity_on_hand

        if diff > Decimal("0"):
            # Surplus: add to balance
            balance.quantity_on_hand += diff
            balance_after = balance.quantity_on_hand
            tx_type = TransactionType.COUNT_ADJUST_ADD.value
            adj_qty = diff
        else:
            # Deficit: deduct from balance
            adj_qty = abs(diff)
            if balance.quantity_on_hand < adj_qty:
                balance.quantity_on_hand = Decimal("0.000")
            else:
                balance.quantity_on_hand -= adj_qty
            balance_after = balance.quantity_on_hand
            tx_type = TransactionType.COUNT_ADJUST_SUB.value

        tx = InventoryTransaction(
            transaction_code=cls._generate_tx_code("TX-ADJ"),
            warehouse_id=warehouse_id,
            product_id=product_id,
            transaction_type=tx_type,
            quantity=adj_qty,
            unit_cost=balance.avg_cost,
            total_value=(adj_qty * balance.avg_cost).quantize(Decimal("0.01")),
            balance_before=balance_before,
            balance_after=balance_after,
            reference_type=ReferenceType.STOCK_COUNT.value,
            reference_id=count_id,
            reference_code=count_code,
            notes=reason or "Điều chỉnh kiểm kê kho",
            created_by=user_id,
        )
        db.add(tx)
        await db.flush()
        return tx

