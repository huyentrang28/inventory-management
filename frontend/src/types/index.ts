export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  is_superuser: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  roles: Role[];
}

export interface Role {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_system: boolean;
  permissions: Permission[];
}

export interface Permission {
  id: number;
  code: string;
  name: string;
  module: string;
  description?: string;
}

export interface Category {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  address?: string;
  manager_name?: string;
  phone?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_id?: string;
  contact_person?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  id: number;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_id?: string;
  contact_person?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: number;
  sku: string;
  barcode?: string;
  name: string;
  category_id?: number;
  unit_id?: number;
  cost_price: number;
  selling_price: number;
  min_stock_level: number;
  image_url?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  unit?: Unit;
}

export interface InventoryBalance {
  id: number;
  warehouse_id: number;
  product_id: number;
  quantity_on_hand: number;
  quantity_reserved: number;
  avg_cost: number;
  updated_at: string;
  warehouse?: Warehouse;
  product?: Product;
}

export interface InventoryTransaction {
  id: number;
  transaction_code: string;
  warehouse_id: number;
  product_id: number;
  transaction_type: string;
  quantity: number;
  unit_cost: number;
  total_value: number;
  balance_before: number;
  balance_after: number;
  reference_type: string;
  reference_id: number;
  reference_code: string;
  notes?: string;
  created_by?: number;
  created_at: string;
  warehouse?: Warehouse;
  product?: Product;
}

export interface StockReceiptItem {
  id: number;
  receipt_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_amount: number;
  notes?: string;
  product?: Product;
}

export interface StockReceipt {
  id: number;
  receipt_code: string;
  receipt_date: string;
  warehouse_id: number;
  supplier_id?: number;
  total_amount: number;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "COMPLETED" | "CANCELLED" | "REJECTED";
  notes?: string;
  created_by?: number;
  approved_by?: number;
  created_at: string;
  updated_at: string;
  warehouse?: Warehouse;
  supplier?: Supplier;
  creator?: User;
  approver?: User;
  items: StockReceiptItem[];
}

export interface StockIssueItem {
  id: number;
  issue_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_amount: number;
  notes?: string;
  product?: Product;
}

export interface StockIssue {
  id: number;
  issue_code: string;
  issue_date: string;
  warehouse_id: number;
  customer_id?: number;
  reason?: string;
  total_amount: number;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "COMPLETED" | "CANCELLED" | "REJECTED";
  notes?: string;
  created_by?: number;
  approved_by?: number;
  created_at: string;
  updated_at: string;
  warehouse?: Warehouse;
  customer?: Customer;
  creator?: User;
  approver?: User;
  items: StockIssueItem[];
}

export interface StockTransferItem {
  id: number;
  transfer_id: number;
  product_id: number;
  quantity: number;
  notes?: string;
  product?: Product;
}

export interface StockTransfer {
  id: number;
  transfer_code: string;
  transfer_date: string;
  source_warehouse_id: number;
  dest_warehouse_id: number;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "IN_TRANSIT" | "RECEIVED" | "CANCELLED";
  notes?: string;
  created_by?: number;
  approved_by?: number;
  created_at: string;
  source_warehouse?: Warehouse;
  dest_warehouse?: Warehouse;
  creator?: User;
  approver?: User;
  items: StockTransferItem[];
}

export interface StockCountItem {
  id: number;
  stock_count_id: number;
  product_id: number;
  system_quantity: number;
  actual_quantity: number;
  difference_quantity: number;
  reason?: string;
  notes?: string;
  product?: Product;
}

export interface StockCount {
  id: number;
  count_code: string;
  count_date: string;
  warehouse_id: number;
  status: "DRAFT" | "IN_PROGRESS" | "PENDING_APPROVAL" | "APPROVED" | "COMPLETED" | "CANCELLED";
  notes?: string;
  created_by?: number;
  approved_by?: number;
  created_at: string;
  warehouse?: Warehouse;
  creator?: User;
  approver?: User;
  items: StockCountItem[];
}

export interface DashboardSummary {
  total_products: number;
  total_warehouses: number;
  total_stock_quantity: number;
  total_stock_value: number;
  monthly_receipt_amount: number;
  monthly_issue_amount: number;
  low_stock_products_count: number;
  out_of_stock_products_count: number;
  pending_receipts_count: number;
  pending_issues_count: number;
}

export interface ChartDataPoint {
  date: string;
  inbound_qty: number;
  outbound_qty: number;
  inbound_amount: number;
  outbound_amount: number;
}

export interface TopProductItem {
  product_id: number;
  sku: string;
  product_name: string;
  quantity: number;
  total_amount: number;
}

export interface WarehouseValuationItem {
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
  total_items: number;
  total_quantity: number;
  total_valuation: number;
}

export interface StockMovementItem {
  product_id: number;
  sku: string;
  product_name: string;
  category_name?: string;
  unit_name?: string;
  opening_balance: number;
  total_inbound: number;
  total_outbound: number;
  closing_balance: number;
  closing_value: number;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_email?: string;
  action: string;
  entity_name: string;
  entity_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: User;
}

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description?: string;
  is_public: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
