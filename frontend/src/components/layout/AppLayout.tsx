import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Layers,
  Building2,
  Warehouse as WarehouseIcon,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ClipboardCheck,
  Truck,
  Users2,
  BarChart3,
  UserCheck,
  ShieldAlert,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
  Bell,
  Search,
  User as UserIcon,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useUIStore } from "../../stores/uiStore";
import { ToastContainer } from "../ui/ToastContainer";

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  group?: string;
}

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const menuItems: MenuItem[] = [
    { name: "Tổng quan", path: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" />, group: "Chính" },
    { name: "Sản phẩm", path: "/products", icon: <Package className="w-4 h-4" />, group: "Hàng hóa" },
    { name: "Danh mục", path: "/categories", icon: <Layers className="w-4 h-4" />, group: "Hàng hóa" },
    { name: "Quản lý kho", path: "/warehouses", icon: <Building2 className="w-4 h-4" />, group: "Kho bãi" },
    { name: "Tồn kho", path: "/inventory", icon: <WarehouseIcon className="w-4 h-4" />, group: "Kho bãi" },
    { name: "Nhập kho", path: "/receipts", icon: <ArrowDownLeft className="w-4 h-4" />, group: "Nghiệp vụ" },
    { name: "Xuất kho", path: "/issues", icon: <ArrowUpRight className="w-4 h-4" />, group: "Nghiệp vụ" },
    { name: "Chuyển kho", path: "/transfers", icon: <ArrowLeftRight className="w-4 h-4" />, group: "Nghiệp vụ" },
    { name: "Kiểm kê kho", path: "/stock-counts", icon: <ClipboardCheck className="w-4 h-4" />, group: "Nghiệp vụ" },
    { name: "Nhà cung cấp", path: "/suppliers", icon: <Truck className="w-4 h-4" />, group: "Đối tác" },
    { name: "Khách hàng", path: "/customers", icon: <Users2 className="w-4 h-4" />, group: "Đối tác" },
    { name: "Báo cáo thống kê", path: "/reports", icon: <BarChart3 className="w-4 h-4" />, group: "Báo cáo" },
    { name: "Người dùng", path: "/users", icon: <UserCheck className="w-4 h-4" />, group: "Hệ thống" },
    { name: "Vai trò & Quyền", path: "/roles", icon: <ShieldAlert className="w-4 h-4" />, group: "Hệ thống" },
    { name: "Nhật ký hoạt động", path: "/audit-logs", icon: <History className="w-4 h-4" />, group: "Hệ thống" },
    { name: "Cài đặt", path: "/settings", icon: <Settings className="w-4 h-4" />, group: "Hệ thống" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Group menus by section
  const groups = ["Chính", "Hàng hóa", "Kho bãi", "Nghiệp vụ", "Đối tác", "Báo cáo", "Hệ thống"];

  const renderNavContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-14 px-3.5 border-b border-slate-800">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20 shrink-0">
            W
          </div>
          {sidebarOpen && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white tracking-wide truncate">
                StockManager
              </span>
              <span className="text-[10px] text-slate-400 font-medium truncate">
                Enterprise WMS
              </span>
            </div>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="hidden md:flex text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          title={sidebarOpen ? "Thu gọn sidebar" : "Mở rộng sidebar"}
        >
          {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto py-2.5 px-2.5 space-y-3">
        {groups.map((group) => {
          const items = menuItems.filter((m) => m.group === group);
          return (
            <div key={group} className="space-y-0.5">
              {sidebarOpen && (
                <div className="px-2.5 text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  {group}
                </div>
              )}
              {items.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    } ${!sidebarOpen ? "justify-center px-1.5" : ""}`}
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {sidebarOpen && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer User info */}
      <div className="p-3 border-t border-slate-800">
        <div
          className={`flex items-center gap-3 p-2 rounded-lg bg-slate-800/60 ${
            !sidebarOpen ? "justify-center p-1" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-semibold text-xs border border-indigo-500/30 shrink-0">
            {user?.full_name?.charAt(0) || "U"}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col transition-all duration-200 ease-in-out shrink-0 z-30 ${
          sidebarOpen ? "w-56" : "w-16"
        }`}
      >
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 max-w-[85vw] h-full shadow-2xl z-10">
            {renderNavContent()}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-slate-200/80 px-3 md:px-5 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Quick search input */}
            <div className="hidden sm:flex items-center relative w-56 md:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm mã SKU, đơn hàng, kho..."
                className="w-full text-xs bg-slate-100 border border-transparent rounded-lg pl-8 pr-3 py-1 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Notifications */}
            <button className="text-slate-500 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
            </button>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center">
                  {user?.full_name?.charAt(0) || "U"}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">
                    {user?.full_name}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {user?.roles?.[0]?.name || (user?.is_superuser ? "Admin" : "Nhân viên")}
                  </p>
                </div>
              </button>

              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {user?.full_name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      Hồ sơ cá nhân & Cài đặt
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Route View */}
        <main className="flex-1 overflow-y-auto p-3.5 md:p-5 lg:p-6 bg-slate-50">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};

