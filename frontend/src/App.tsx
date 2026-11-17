import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { ToastContainer } from './components/ui/ToastContainer';

// Feature Pages (Named Exports)
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ProductListPage } from './features/products/ProductListPage';
import { ProductDetailPage } from './features/products/ProductDetailPage';
import { CategoryPage } from './features/categories/CategoryPage';
import { WarehousePage } from './features/warehouses/WarehousePage';
import { SupplierListPage } from './features/partners/SupplierListPage';
import { CustomerListPage } from './features/partners/CustomerListPage';
import { InventoryOverviewPage } from './features/inventory/InventoryOverviewPage';
import { InventoryTransactionsPage } from './features/inventory/InventoryTransactionsPage';
import { ReceiptListPage } from './features/receipts/ReceiptListPage';
import { CreateReceiptPage } from './features/receipts/CreateReceiptPage';
import { ReceiptDetailPage } from './features/receipts/ReceiptDetailPage';
import { IssueListPage } from './features/issues/IssueListPage';
import { CreateIssuePage } from './features/issues/CreateIssuePage';
import { IssueDetailPage } from './features/issues/IssueDetailPage';
import { TransferListPage } from './features/transfers/TransferListPage';
import { CreateTransferPage } from './features/transfers/CreateTransferPage';
import { TransferDetailPage } from './features/transfers/TransferDetailPage';
import { StockCountListPage } from './features/stock-counts/StockCountListPage';
import { StockCountDetailPage } from './features/stock-counts/StockCountDetailPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { UserManagementPage } from './features/users/UserManagementPage';
import { RoleManagementPage } from './features/users/RoleManagementPage';
import { AuditLogPage } from './features/audit/AuditLogPage';
import { SettingsPage } from './features/settings/SettingsPage';

// 404 Not Found Page
function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
        <span className="text-3xl font-extrabold font-mono">404</span>
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Trang không tồn tại</h2>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        Đường dẫn bạn yêu cầu không khả dụng hoặc đã được di chuyển sang địa chỉ khác.
      </p>
      <a
        href="/dashboard"
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors"
      >
        Về Bảng điều khiển
      </a>
    </div>
  );
}

export const App: React.FC = () => {
  return (
    <>
      <ToastContainer />
      <Routes>
        {/* Public Authentication Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Application Routes wrapped by AppLayout with <Outlet /> */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Master Data */}
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/categories" element={<CategoryPage />} />
          <Route path="/warehouses" element={<WarehousePage />} />
          <Route path="/suppliers" element={<SupplierListPage />} />
          <Route path="/customers" element={<CustomerListPage />} />

          {/* Inventory Operations */}
          <Route path="/inventory" element={<InventoryOverviewPage />} />
          <Route path="/inventory/transactions" element={<InventoryTransactionsPage />} />
          <Route path="/receipts" element={<ReceiptListPage />} />
          <Route path="/receipts/create" element={<CreateReceiptPage />} />
          <Route path="/receipts/:id" element={<ReceiptDetailPage />} />
          <Route path="/issues" element={<IssueListPage />} />
          <Route path="/issues/create" element={<CreateIssuePage />} />
          <Route path="/issues/:id" element={<IssueDetailPage />} />
          <Route path="/transfers" element={<TransferListPage />} />
          <Route path="/transfers/create" element={<CreateTransferPage />} />
          <Route path="/transfers/:id" element={<TransferDetailPage />} />
          <Route path="/stock-counts" element={<StockCountListPage />} />
          <Route path="/stock-counts/:id" element={<StockCountDetailPage />} />

          {/* Reports, Administration & Audit */}
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/users" element={<UserManagementPage />} />
          <Route path="/roles" element={<RoleManagementPage />} />
          <Route path="/audit-logs" element={<AuditLogPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
