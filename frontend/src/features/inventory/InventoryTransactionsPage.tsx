import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { History, Search, ArrowLeft, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, CheckSquare } from "lucide-react";
import { api } from "../../services/api";
import { InventoryTransaction, PaginatedResponse, Warehouse } from "../../types";
import { formatCurrency, formatDateTime, formatNumber } from "../../utils/formatters";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { Button } from "../../components/ui/Button";

export const InventoryTransactionsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["warehouses-all"],
    queryFn: async () => (await api.get("/warehouses/all")).data,
  });

  const { data, isLoading } = useQuery<PaginatedResponse<InventoryTransaction>>({
    queryKey: ["inventory-transactions", page, warehouseId, typeFilter],
    queryFn: async () => {
      const params: any = { page, page_size: 25 };
      if (warehouseId) params.warehouse_id = warehouseId;
      if (typeFilter) params.transaction_type = typeFilter;
      return (await api.get("/inventory/transactions", { params })).data;
    },
  });

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case "INBOUND":
        return <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold"><ArrowDownLeft className="w-3.5 h-3.5" /> Nhập kho</span>;
      case "OUTBOUND":
        return <span className="inline-flex items-center gap-1 text-sky-600 font-semibold"><ArrowUpRight className="w-3.5 h-3.5" /> Xuất kho</span>;
      case "TRANSFER_OUT":
        return <span className="inline-flex items-center gap-1 text-purple-600 font-semibold"><ArrowLeftRight className="w-3.5 h-3.5" /> Xuất chuyển</span>;
      case "TRANSFER_IN":
        return <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold"><ArrowLeftRight className="w-3.5 h-3.5" /> Nhận chuyển</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-amber-600 font-semibold"><CheckSquare className="w-3.5 h-3.5" /> Kiểm kê</span>;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/inventory" className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Tồn kho
            </Link>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Sổ Nhật ký Biến động kho</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lịch sử giao dịch bất biến (Immutable Audit Trail) ghi nhận toàn bộ xuất, nhập, chuyển và điều chỉnh tồn kho
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <select
          value={warehouseId}
          onChange={(e) => {
            setWarehouseId(e.target.value);
            setPage(1);
          }}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:bg-white focus:border-indigo-600"
        >
          <option value="">Tất cả kho hàng</option>
          {warehouses?.map((wh) => (
            <option key={wh.id} value={wh.id}>
              {wh.name}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:bg-white focus:border-indigo-600"
        >
          <option value="">Tất cả loại nghiệp vụ</option>
          <option value="INBOUND">Nhập kho (INBOUND)</option>
          <option value="OUTBOUND">Xuất kho (OUTBOUND)</option>
          <option value="TRANSFER_OUT">Xuất chuyển kho</option>
          <option value="TRANSFER_IN">Nhận chuyển kho</option>
          <option value="COUNT_ADJUST_ADD">Kiểm kê thừa</option>
          <option value="COUNT_ADJUST_SUB">Kiểm kê thiếu</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Mã GD</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Kho hàng</th>
                <th className="py-3 px-4">Sản phẩm</th>
                <th className="py-3 px-4">Nghiệp vụ</th>
                <th className="py-3 px-4 text-right">Số lượng</th>
                <th className="py-3 px-4 text-right">Tồn trước</th>
                <th className="py-3 px-4 text-right">Tồn sau</th>
                <th className="py-3 px-4 text-right">Đơn giá vốn</th>
                <th className="py-3 px-4">Chứng từ gốc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="p-6">
                    <TableSkeleton rows={8} cols={10} />
                  </td>
                </tr>
              ) : data?.items && data.items.length > 0 ? (
                data.items.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      {tx.transaction_code}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDateTime(tx.created_at)}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{tx.warehouse?.name}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{tx.product?.name}</p>
                      <p className="font-mono text-[10px] text-slate-400">{tx.product?.sku}</p>
                    </td>
                    <td className="py-3 px-4">{renderTypeIcon(tx.transaction_type)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 text-sm">
                      {formatNumber(tx.quantity)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono">
                      {formatNumber(tx.balance_before)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-indigo-700 font-mono">
                      {formatNumber(tx.balance_after)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700">
                      {formatCurrency(tx.unit_cost)}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-600">
                      {tx.reference_code}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-slate-400">
                    Không có giao dịch nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs">
            <span className="text-slate-500">
              Trang <span className="font-semibold text-slate-800">{page}</span> / {data.total_pages}
            </span>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.total_pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Tiếp theo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

