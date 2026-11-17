import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Download, Search, Building2, Filter } from "lucide-react";
import { api } from "../../services/api";
import { StockMovementItem, Warehouse } from "../../types";
import { formatCurrency, formatNumber } from "../../utils/formatters";
import { Button } from "../../components/ui/Button";
import { TableSkeleton } from "../../components/ui/Skeleton";

export const ReportsPage: React.FC = () => {
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [search, setSearch] = useState("");

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["warehouses-all"],
    queryFn: async () => (await api.get("/warehouses/all")).data,
  });

  const { data: movementReport, isLoading } = useQuery<StockMovementItem[]>({
    queryKey: ["stock-movement-report", warehouseId],
    queryFn: async () => {
      const params = warehouseId ? { warehouse_id: warehouseId } : {};
      return (await api.get("/reports/stock-movement", { params })).data;
    },
  });

  const filteredData = movementReport?.filter(
    (item) =>
      item.product_name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportExcel = () => {
    const url = `/api/v1/reports/export/movement/excel${
      warehouseId ? `?warehouse_id=${warehouseId}` : ""
    }`;
    window.open(url, "_blank");
  };

  const totalClosingValue = filteredData?.reduce((sum, it) => sum + Number(it.closing_value), 0) || 0;
  const totalInboundQty = filteredData?.reduce((sum, it) => sum + Number(it.total_inbound), 0) || 0;
  const totalOutboundQty = filteredData?.reduce((sum, it) => sum + Number(it.total_outbound), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Báo cáo Xuất - Nhập - Tồn kho</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bảng tổng hợp đối soát số dư đầu kỳ, biến động nhập xuất và số dư cuối kỳ theo sản phẩm
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleExportExcel} icon={<Download className="w-4 h-4" />}>
          Xuất Báo cáo Excel
        </Button>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Tổng nhập trong kỳ</p>
          <p className="text-lg font-bold text-emerald-600 mt-1">{formatNumber(totalInboundQty)} sản phẩm</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Tổng xuất trong kỳ</p>
          <p className="text-lg font-bold text-sky-600 mt-1">{formatNumber(totalOutboundQty)} sản phẩm</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Tổng giá trị tồn cuối kỳ</p>
          <p className="text-lg font-bold text-indigo-700 mt-1">{formatCurrency(totalClosingValue)}</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã SKU hoặc tên sản phẩm..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-indigo-600"
            />
          </div>

          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:bg-white focus:border-indigo-600"
          >
            <option value="">Tất cả các kho hàng</option>
            {warehouses?.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} ({wh.code})
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Hiển thị: <strong className="text-slate-800">{filteredData?.length || 0}</strong> mặt hàng
        </span>
      </div>

      {/* Movement Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Mã SKU</th>
                <th className="py-3 px-4">Tên hàng hóa</th>
                <th className="py-3 px-4">Danh mục</th>
                <th className="py-3 px-4">Đơn vị</th>
                <th className="py-3 px-4 text-right">Tồn đầu kỳ</th>
                <th className="py-3 px-4 text-right text-emerald-700">Tổng nhập</th>
                <th className="py-3 px-4 text-right text-sky-700">Tổng xuất</th>
                <th className="py-3 px-4 text-right">Tồn cuối kỳ</th>
                <th className="py-3 px-4 text-right">Giá trị tồn cuối</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-6">
                    <TableSkeleton rows={6} cols={9} />
                  </td>
                </tr>
              ) : filteredData && filteredData.length > 0 ? (
                filteredData.map((it) => (
                  <tr key={it.product_id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{it.sku}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{it.product_name}</td>
                    <td className="py-3 px-4 text-slate-600">{it.category_name}</td>
                    <td className="py-3 px-4 text-slate-500">{it.unit_name}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">{formatNumber(it.opening_balance)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">+{formatNumber(it.total_inbound)}</td>
                    <td className="py-3 px-4 text-right font-bold text-sky-600">-{formatNumber(it.total_outbound)}</td>
                    <td className="py-3 px-4 text-right font-bold text-base text-slate-900">{formatNumber(it.closing_balance)}</td>
                    <td className="py-3 px-4 text-right font-bold text-indigo-700">{formatCurrency(it.closing_value)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-400">
                    Không có dữ liệu phát sinh trong kỳ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

