import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Search, Eye, Filter } from "lucide-react";
import { api } from "../../services/api";
import { PaginatedResponse, StockReceipt, Warehouse } from "../../types";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/Badge";
import { TableSkeleton } from "../../components/ui/Skeleton";

export const ReceiptListPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["warehouses-all"],
    queryFn: async () => (await api.get("/warehouses/all")).data,
  });

  const { data, isLoading } = useQuery<PaginatedResponse<StockReceipt>>({
    queryKey: ["receipts", page, search, warehouseId, statusFilter],
    queryFn: async () => {
      const params: any = { page, page_size: 15 };
      if (search) params.search = search;
      if (warehouseId) params.warehouse_id = warehouseId;
      if (statusFilter) params.status = statusFilter;
      return (await api.get("/receipts", { params })).data;
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản lý Nhập kho</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lập phiếu, phê duyệt và hoàn tất nhập kho tăng số dư tồn
          </p>
        </div>
        <Link to="/receipts/create">
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
            Tạo phiếu nhập
          </Button>
        </Link>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo mã phiếu..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-indigo-600"
            />
          </div>

          <select
            value={warehouseId}
            onChange={(e) => {
              setWarehouseId(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:bg-white focus:border-indigo-600"
          >
            <option value="">Tất cả kho nhận</option>
            {warehouses?.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:bg-white focus:border-indigo-600"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="PENDING_APPROVAL">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="COMPLETED">Đã hoàn tất</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Tổng số: <strong className="text-slate-800">{data?.total || 0}</strong> phiếu nhập
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Mã phiếu</th>
                <th className="py-3 px-4">Ngày nhập</th>
                <th className="py-3 px-4">Kho nhận</th>
                <th className="py-3 px-4">Nhà cung cấp</th>
                <th className="py-3 px-4 text-right">Tổng tiền</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4">Người lập</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-6">
                    <TableSkeleton rows={5} cols={8} />
                  </td>
                </tr>
              ) : data?.items && data.items.length > 0 ? (
                data.items.map((rcpt) => (
                  <tr key={rcpt.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      <Link to={`/receipts/${rcpt.id}`} className="hover:underline">
                        {rcpt.receipt_code}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDateTime(rcpt.receipt_date)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{rcpt.warehouse?.name}</td>
                    <td className="py-3 px-4 text-slate-700">{rcpt.supplier?.name || "-"}</td>
                    <td className="py-3 px-4 text-right font-bold text-indigo-700">
                      {formatCurrency(rcpt.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={rcpt.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-500">{rcpt.creator?.full_name || "-"}</td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        to={`/receipts/${rcpt.id}`}
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-slate-100"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    Chưa có phiếu nhập kho nào
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

