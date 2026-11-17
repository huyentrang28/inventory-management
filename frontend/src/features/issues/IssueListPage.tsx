import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Search, Eye } from "lucide-react";
import { api } from "../../services/api";
import { PaginatedResponse, StockIssue, Warehouse } from "../../types";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/Badge";
import { TableSkeleton } from "../../components/ui/Skeleton";

export const IssueListPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["warehouses-all"],
    queryFn: async () => (await api.get("/warehouses/all")).data,
  });

  const { data, isLoading } = useQuery<PaginatedResponse<StockIssue>>({
    queryKey: ["issues", page, search, warehouseId, statusFilter],
    queryFn: async () => {
      const params: any = { page, page_size: 15 };
      if (search) params.search = search;
      if (warehouseId) params.warehouse_id = warehouseId;
      if (statusFilter) params.status = statusFilter;
      return (await api.get("/issues", { params })).data;
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản lý Xuất kho</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lập phiếu xuất bán, kiểm tra tồn an toàn và trừ số dư tự động
          </p>
        </div>
        <Link to="/issues/create">
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
            Tạo phiếu xuất
          </Button>
        </Link>
      </div>

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
              placeholder="Tìm theo mã phiếu xuất..."
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
            <option value="">Tất cả kho xuất</option>
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
          Tổng số: <strong className="text-slate-800">{data?.total || 0}</strong> phiếu xuất
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Mã phiếu</th>
                <th className="py-3 px-4">Ngày xuất</th>
                <th className="py-3 px-4">Kho xuất</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Lý do xuất</th>
                <th className="py-3 px-4 text-right">Tổng tiền</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
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
                data.items.map((issue) => (
                  <tr key={issue.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      <Link to={`/issues/${issue.id}`} className="hover:underline">
                        {issue.issue_code}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDateTime(issue.issue_date)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{issue.warehouse?.name}</td>
                    <td className="py-3 px-4 text-slate-700">{issue.customer?.name || "-"}</td>
                    <td className="py-3 px-4 text-slate-600">{issue.reason || "-"}</td>
                    <td className="py-3 px-4 text-right font-bold text-indigo-700">
                      {formatCurrency(issue.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={issue.status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        to={`/issues/${issue.id}`}
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
                    Chưa có phiếu xuất kho nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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

