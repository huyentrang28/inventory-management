from enum import Enum
from typing import Dict, List


class RoleEnum(str, Enum):
    ADMIN = "Admin"
    WAREHOUSE_MANAGER = "Warehouse Manager"
    WAREHOUSE_STAFF = "Warehouse Staff"
    SALES_STAFF = "Sales Staff"
    VIEWER = "Viewer"


class PermissionEnum(str, Enum):
    # Product
    PRODUCT_VIEW = "product:view"
    PRODUCT_CREATE = "product:create"
    PRODUCT_UPDATE = "product:update"
    PRODUCT_DELETE = "product:delete"

    # Category & Unit
    CATEGORY_MANAGE = "category:manage"

    # Warehouse
    WAREHOUSE_VIEW = "warehouse:view"
    WAREHOUSE_CREATE = "warehouse:create"
    WAREHOUSE_UPDATE = "warehouse:update"
    WAREHOUSE_DELETE = "warehouse:delete"

    # Inventory
    INVENTORY_VIEW = "inventory:view"

    # Receipts
    RECEIPT_VIEW = "receipt:view"
    RECEIPT_CREATE = "receipt:create"
    RECEIPT_UPDATE = "receipt:update"
    RECEIPT_APPROVE = "receipt:approve"
    RECEIPT_COMPLETE = "receipt:complete"
    RECEIPT_CANCEL = "receipt:cancel"

    # Issues
    ISSUE_VIEW = "issue:view"
    ISSUE_CREATE = "issue:create"
    ISSUE_UPDATE = "issue:update"
    ISSUE_APPROVE = "issue:approve"
    ISSUE_COMPLETE = "issue:complete"
    ISSUE_CANCEL = "issue:cancel"

    # Transfers
    TRANSFER_VIEW = "transfer:view"
    TRANSFER_CREATE = "transfer:create"
    TRANSFER_UPDATE = "transfer:update"
    TRANSFER_APPROVE = "transfer:approve"
    TRANSFER_COMPLETE = "transfer:complete"
    TRANSFER_CANCEL = "transfer:cancel"

    # Stock Counts
    COUNT_VIEW = "count:view"
    COUNT_CREATE = "count:create"
    COUNT_UPDATE = "count:update"
    COUNT_APPROVE = "count:approve"
    COUNT_COMPLETE = "count:complete"

    # Partners (Suppliers & Customers)
    SUPPLIER_VIEW = "supplier:view"
    SUPPLIER_MANAGE = "supplier:manage"
    CUSTOMER_VIEW = "customer:view"
    CUSTOMER_MANAGE = "customer:manage"

    # Reports
    REPORT_VIEW = "report:view"
    REPORT_EXPORT = "report:export"

    # Admin
    USER_MANAGE = "user:manage"
    ROLE_MANAGE = "role:manage"
    AUDIT_VIEW = "audit:view"
    SYSTEM_MANAGE = "system:manage"


# Default Permissions per Role
ROLE_PERMISSIONS: Dict[str, List[str]] = {
    RoleEnum.ADMIN.value: [perm.value for perm in PermissionEnum],
    
    RoleEnum.WAREHOUSE_MANAGER.value: [
        PermissionEnum.PRODUCT_VIEW.value,
        PermissionEnum.PRODUCT_CREATE.value,
        PermissionEnum.PRODUCT_UPDATE.value,
        PermissionEnum.CATEGORY_MANAGE.value,
        PermissionEnum.WAREHOUSE_VIEW.value,
        PermissionEnum.INVENTORY_VIEW.value,
        PermissionEnum.RECEIPT_VIEW.value,
        PermissionEnum.RECEIPT_CREATE.value,
        PermissionEnum.RECEIPT_UPDATE.value,
        PermissionEnum.RECEIPT_APPROVE.value,
        PermissionEnum.RECEIPT_COMPLETE.value,
        PermissionEnum.RECEIPT_CANCEL.value,
        PermissionEnum.ISSUE_VIEW.value,
        PermissionEnum.ISSUE_CREATE.value,
        PermissionEnum.ISSUE_UPDATE.value,
        PermissionEnum.ISSUE_APPROVE.value,
        PermissionEnum.ISSUE_COMPLETE.value,
        PermissionEnum.ISSUE_CANCEL.value,
        PermissionEnum.TRANSFER_VIEW.value,
        PermissionEnum.TRANSFER_CREATE.value,
        PermissionEnum.TRANSFER_UPDATE.value,
        PermissionEnum.TRANSFER_APPROVE.value,
        PermissionEnum.TRANSFER_COMPLETE.value,
        PermissionEnum.TRANSFER_CANCEL.value,
        PermissionEnum.COUNT_VIEW.value,
        PermissionEnum.COUNT_CREATE.value,
        PermissionEnum.COUNT_UPDATE.value,
        PermissionEnum.COUNT_APPROVE.value,
        PermissionEnum.COUNT_COMPLETE.value,
        PermissionEnum.SUPPLIER_VIEW.value,
        PermissionEnum.SUPPLIER_MANAGE.value,
        PermissionEnum.CUSTOMER_VIEW.value,
        PermissionEnum.REPORT_VIEW.value,
        PermissionEnum.REPORT_EXPORT.value,
        PermissionEnum.AUDIT_VIEW.value,
    ],
    
    RoleEnum.WAREHOUSE_STAFF.value: [
        PermissionEnum.PRODUCT_VIEW.value,
        PermissionEnum.WAREHOUSE_VIEW.value,
        PermissionEnum.INVENTORY_VIEW.value,
        PermissionEnum.RECEIPT_VIEW.value,
        PermissionEnum.RECEIPT_CREATE.value,
        PermissionEnum.RECEIPT_UPDATE.value,
        PermissionEnum.ISSUE_VIEW.value,
        PermissionEnum.ISSUE_CREATE.value,
        PermissionEnum.ISSUE_UPDATE.value,
        PermissionEnum.TRANSFER_VIEW.value,
        PermissionEnum.TRANSFER_CREATE.value,
        PermissionEnum.TRANSFER_UPDATE.value,
        PermissionEnum.COUNT_VIEW.value,
        PermissionEnum.COUNT_CREATE.value,
        PermissionEnum.COUNT_UPDATE.value,
        PermissionEnum.SUPPLIER_VIEW.value,
        PermissionEnum.CUSTOMER_VIEW.value,
        PermissionEnum.REPORT_VIEW.value,
    ],
    
    RoleEnum.SALES_STAFF.value: [
        PermissionEnum.PRODUCT_VIEW.value,
        PermissionEnum.WAREHOUSE_VIEW.value,
        PermissionEnum.INVENTORY_VIEW.value,
        PermissionEnum.ISSUE_VIEW.value,
        PermissionEnum.ISSUE_CREATE.value,
        PermissionEnum.CUSTOMER_VIEW.value,
        PermissionEnum.CUSTOMER_MANAGE.value,
        PermissionEnum.REPORT_VIEW.value,
    ],
    
    RoleEnum.VIEWER.value: [
        PermissionEnum.PRODUCT_VIEW.value,
        PermissionEnum.WAREHOUSE_VIEW.value,
        PermissionEnum.INVENTORY_VIEW.value,
        PermissionEnum.RECEIPT_VIEW.value,
        PermissionEnum.ISSUE_VIEW.value,
        PermissionEnum.TRANSFER_VIEW.value,
        PermissionEnum.COUNT_VIEW.value,
        PermissionEnum.SUPPLIER_VIEW.value,
        PermissionEnum.CUSTOMER_VIEW.value,
        PermissionEnum.REPORT_VIEW.value,
    ],
}

