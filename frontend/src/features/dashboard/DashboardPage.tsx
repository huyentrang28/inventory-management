import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ScanBarcode,
  Warehouse as WarehouseIcon,
  Layers,
  Banknote,
  PackagePlus,
  PackageMinus,
  TrendingDown,
  PackageX,
  FileClock,
  CheckCircle,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { api } from "../../services/api";
import {
  ChartDataPoint,
  DashboardSummary,
  TopProductItem,
  Warehouse,
  WarehouseValuationItem,
} from "../../types";
import { formatCurrency, formatNumber } from "../../utils/formatters";
import { Skeleton } from "../../components/ui/Skeleton";
import { Button } from "../../components/ui/Button";

export const DashboardPage: React.FC = () => {
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | "">("");

  // Warehouses list
  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["warehouses-all"],
    queryFn: async () => (await api.get("/warehouses/all")).data,
  });

  // Dashboard summary KPIs
  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary", selectedWarehouse],
    queryFn: async () => {
      const params = selectedWarehouse ? { warehouse_id: selectedWarehouse } : {};
      return (await api.get("/reports/dashboard-summary", { params })).data;
    },
  });

  // Timeline charts
  const { data: timelineData, isLoading: isTimelineLoading } = useQuery<ChartDataPoint[]>({
    queryKey: ["movement-timeline", selectedWarehouse],
    queryFn: async () => {
      const params = {
        days: 14,
        ...(selectedWarehouse ? { warehouse_id: selectedWarehouse } : {}),
      };
      return (await api.get("/reports/charts/movement-timeline", { params })).data;
    },
  });

  // Top products
  const { data: topProducts, isLoading: isTopLoading } = useQuery<TopProductItem[]>({
    queryKey: ["top-products"],
    queryFn: async () => (await api.get("/reports/charts/top-products?limit=5")).data,
  });

  // Warehouse valuations
  const { data: warehouseValuations } = useQuery<WarehouseValuationItem[]>({
    queryKey: ["warehouse-valuations"],
    queryFn: async () => (await api.get("/reports/warehouse-valuations")).data,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tổng quan kho vận
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi thời gian thực các chỉ số xuất nhập tồn và tình trạng kho hàng
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Warehouse Filter */}
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value ? Number(e.target.value) : "")}
            className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          >
            <option value="">Tất cả các kho</option>
            {warehouses?.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} ({wh.code})
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchSummary()}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* 10 Core KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Products */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
            <ScanBarcode className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              Tổng sản phẩm
            </p>
            <h3 className="text-lg font-extrabold text-slate-900 mt-0.5 tracking-tight">
              {isSummaryLoading ? <Skeleton className="h-6 w-16" /> : formatNumber(summary?.total_products)}
            </h3>
          </div>
        </div>

        {/* Total Warehouses */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0 shadow-xs">
            <WarehouseIcon className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              Kho hoạt động
            </p>
            <h3 className="text-lg font-extrabold text-slate-900 mt-0.5 tracking-tight">
              {isSummaryLoading ? <Skeleton className="h-6 w-16" /> : summary?.total_warehouses}
            </h3>
          </div>
        </div>

        {/* Total Stock Quantity */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
            <Layers className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              Tổng số lượng tồn
            </p>
            <h3 className="text-lg font-extrabold text-slate-900 mt-0.5 tracking-tight">
              {isSummaryLoading ? <Skeleton className="h-6 w-20" /> : formatNumber(summary?.total_stock_quantity)}
            </h3>
          </div>
        </div>

        {/* Total Stock Valuation */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-3 sm:col-span-2 lg:col-span-2">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
            <Banknote className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              Tổng giá trị tồn kho (VND)
            </p>
            <h3 className="text-lg font-extrabold text-slate-900 mt-0.5 tracking-tight">
              {isSummaryLoading ? <Skeleton className="h-6 w-32" /> : formatCurrency(summary?.total_stock_value)}
            </h3>
          </div>
        </div>

        {/* Monthly Inbound Amount */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center shrink-0 shadow-xs">
            <PackagePlus className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              Nhập trong tháng
            </p>
            <h3 className="text-sm font-extrabold text-slate-900 mt-0.5 tracking-tight">
              {isSummaryLoading ? <Skeleton className="h-5 w-24" /> : formatCurrency(summary?.monthly_receipt_amount)}
            </h3>
          </div>
        </div>

        {/* Monthly Outbound Amount */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
            <PackageMinus className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              Xuất trong tháng
            </p>
            <h3 className="text-sm font-extrabold text-slate-900 mt-0.5 tracking-tight">
              {isSummaryLoading ? <Skeleton className="h-5 w-24" /> : formatCurrency(summary?.monthly_issue_amount)}
            </h3>
          </div>
        </div>

        {/* Low Stock Warning */}
        <Link
          to="/inventory?low_stock=true"
          className="bg-amber-50/50 rounded-xl p-3.5 border border-amber-200 shadow-xs hover:shadow-md hover:border-amber-300 transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <TrendingDown className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider truncate">
              Sắp hết hàng
            </p>
            <h3 className="text-lg font-extrabold text-amber-900 mt-0.5 tracking-tight">
              {isSummaryLoading ? <Skeleton className="h-6 w-12" /> : summary?.low_stock_products_count}
            </h3>
          </div>
        </Link>

        {/* Out of Stock */}
        <div className="bg-rose-50/50 rounded-xl p-3.5 border border-rose-200 shadow-xs hover:shadow-md hover:border-rose-300 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-xs">
            <PackageX className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-rose-800 uppercase tracking-wider truncate">
              Đã hết hàng
            </p>
            <h3 className="text-lg font-extrabold text-rose-900 mt-0.5 tracking-tight">
              {isSummaryLoading ? <Skeleton className="h-6 w-12" /> : summary?.out_of_stock_products_count}
            </h3>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-xs">
            <FileClock className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              Phiếu chờ duyệt
            </p>
            <h3 className="text-lg font-extrabold text-slate-900 mt-0.5 tracking-tight">
              {isSummaryLoading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                (summary?.pending_receipts_count || 0) + (summary?.pending_issues_count || 0)
              )}
            </h3>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inbound & Outbound Movement Timeline */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Xu hướng Nhập & Xuất kho (14 ngày gần nhất)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Biểu đồ so sánh số lượng hàng hóa nhập và xuất theo ngày
              </p>
            </div>
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" /> Dữ liệu trực tiếp
            </span>
          </div>

          <div className="h-72">
            {isTimelineLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderRadius: "8px",
                      color: "#fff",
                      border: "none",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Bar dataKey="inbound_qty" name="Số lượng nhập" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outbound_qty" name="Số lượng xuất" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top 5 Most Issued Products */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            Top 5 sản phẩm xuất nhiều nhất
          </h3>
          <p className="text-xs text-slate-500 mb-4">Dựa trên các phiếu xuất đã hoàn tất</p>

          <div className="space-y-3.5">
            {isTopLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : topProducts && topProducts.length > 0 ? (
              topProducts.map((p, idx) => (
                <div key={p.product_id} className="flex items-center justify-between pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{p.product_name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{p.sku}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-indigo-600">{formatNumber(p.quantity)} cái</p>
                    <p className="text-[10px] text-slate-400">{formatCurrency(p.total_amount)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Chưa có dữ liệu xuất kho trong kỳ
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warehouse Status Grid */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">
          Tình trạng và Giá trị tồn theo từng Kho hàng
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Tổng quan số mặt hàng, số lượng và tổng giá trị định giá tồn kho theo phương pháp bình quân gia quyền
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {warehouseValuations?.map((wh) => (
            <div
              key={wh.warehouse_id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {wh.warehouse_code}
                </span>
                <span className="text-xs text-slate-500">{wh.total_items} sản phẩm</span>
              </div>
              <h4 className="text-sm font-semibold text-slate-900">{wh.warehouse_name}</h4>
              <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Số lượng tồn</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                    {formatNumber(wh.total_quantity)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase">Giá trị tồn kho</p>
                  <p className="text-sm font-bold text-indigo-700 mt-0.5">
                    {formatCurrency(wh.total_valuation)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

