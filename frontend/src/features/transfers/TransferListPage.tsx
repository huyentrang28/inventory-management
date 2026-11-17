import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, ArrowLeftRight, Eye, Search } from "lucide-react";
import { api } from "../../services/api";
import { PaginatedResponse, StockTransfer, Warehouse } from "../../types";
import { formatDateTime } from "../../utils/formatters";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/Badge";
import { TableSkeleton } from "../../components/ui/Skeleton";

export const TransferListPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery<PaginatedResponse<StockTransfer>>({
    queryKey: ["transfers", page, search, statusFilter],
    queryFn: async () => {
      const params: any = { page, page_size: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      return (await api.get("/transfers", { params })).data;
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản lý Chuyển kho</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi luồng điều phối hàng hóa giữa các kho và trạng thái vận chuyển
          </p>
        </div>
        <Link to="/transfers/create">
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
            Lập phiếu chuyển
          </Button>
        </Link>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo mã phiếu chuyển..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-indigo-600"
            />
          </div>

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
            <option value="IN_TRANSIT">Đang vận chuyển</option>
            <option value="RECEIVED">Đã nhận hàng</option>
          </select>
        </div>

        <span className="text-xs text-slate-500">
          Tổng số: <strong className="text-slate-800">{data?.total || 0}</strong> phiếu
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Mã phiếu</th>
                <th className="py-3 px-4">Ngày chuyển</th>
                <th className="py-3 px-4">Kho nguồn</th>
                <th className="py-3 px-4">Kho đích</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4">Người lập</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-6">
                    <TableSkeleton rows={4} cols={7} />
                  </td>
                </tr>
              ) : data?.items && data.items.length > 0 ? (
                data.items.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      <Link to={`/transfers/${tr.id}`} className="hover:underline">
                        {tr.transfer_code}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDateTime(tr.transfer_date)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {tr.source_warehouse?.name}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {tr.dest_warehouse?.name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={tr.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-500">{tr.creator?.full_name || "-"}</td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        to={`/transfers/${tr.id}`}
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
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    Không có phiếu chuyển kho nào
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

