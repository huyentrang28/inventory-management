import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { Search, AlertTriangle, SlidersHorizontal, ArrowUpDown, Eye } from "lucide-react";
import { api } from "../../services/api";
import { InventoryBalance, PaginatedResponse, Warehouse } from "../../types";
import { formatCurrency, formatNumber } from "../../utils/formatters";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { AdjustmentModal } from "./AdjustmentModal";

export const InventoryOverviewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const lowStockParam = searchParams.get("low_stock") === "true";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(lowStockParam);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<InventoryBalance | null>(null);

  // Warehouses list
  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["warehouses-all"],
    queryFn: async () => (await api.get("/warehouses/all")).data,
  });

  // Balances query
  const { data, isLoading, refetch } = useQuery<PaginatedResponse<InventoryBalance>>({
    queryKey: ["inventory-balances", page, search, warehouseId, lowStockOnly],
    queryFn: async () => {
      const params: any = { page, page_size: 20 };
      if (search) params.search = search;
      if (warehouseId) params.warehouse_id = warehouseId;
      if (lowStockOnly) params.low_stock_only = true;
      return (await api.get("/inventory", { params })).data;
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản lý Tồn kho tổng hợp</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi số lượng tức thời, giá trị tồn bình quân và cảnh báo sắp hết hàng
          </p>
        </div>
        <Link to="/inventory/transactions">
          <Button variant="outline" size="sm">
            Xem nhật ký giao dịch kho
          </Button>
        </Link>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo SKU hoặc tên..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-indigo-600"
            />
          </div>

          <select
            value={warehouseId}
            onChange={(e) => {
              setWarehouseId(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:bg-white focus:border-indigo-600 focus:outline-none"
          >
            <option value="">Tất cả kho hàng</option>
            {warehouses?.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} ({wh.code})
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 px-3 py-2 border border-slate-200 rounded-lg">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => {
                setLowStockOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-amber-700 font-semibold">Chỉ hiện hàng sắp hết</span>
          </label>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Tìm thấy: <strong className="text-slate-800">{data?.total || 0}</strong> bản ghi tồn
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Kho hàng</th>
                <th className="py-3 px-4">Mã SKU</th>
                <th className="py-3 px-4">Tên sản phẩm</th>
                <th className="py-3 px-4">Đơn vị</th>
                <th className="py-3 px-4 text-right">Số lượng tồn</th>
                <th className="py-3 px-4 text-center">Tồn tối thiểu</th>
                <th className="py-3 px-4 text-right">Giá vốn BQ</th>
                <th className="py-3 px-4 text-right">Tổng giá trị</th>
                <th className="py-3 px-4 text-center">Tình trạng</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="p-6">
                    <TableSkeleton rows={6} cols={10} />
                  </td>
                </tr>
              ) : data?.items && data.items.length > 0 ? (
                data.items.map((bal) => {
                  const onHand = Number(bal.quantity_on_hand);
                  const minLevel = Number(bal.product?.min_stock_level || 0);
                  const isLow = onHand <= minLevel && onHand > 0;
                  const isOut = onHand === 0;

                  return (
                    <tr key={bal.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {bal.warehouse?.name}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        <Link to={`/products/${bal.product_id}`} className="hover:underline">
                          {bal.product?.sku}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {bal.product?.name}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{bal.product?.unit?.name || "-"}</td>
                      <td className="py-3 px-4 text-right font-bold text-base text-slate-900">
                        {formatNumber(onHand)}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 font-medium">
                        {formatNumber(minLevel)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700 font-medium">
                        {formatCurrency(bal.avg_cost)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-indigo-700">
                        {formatCurrency(onHand * Number(bal.avg_cost))}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isOut ? (
                          <Badge variant="danger" dot>Hết hàng</Badge>
                        ) : isLow ? (
                          <Badge variant="warning" dot>Sắp hết hàng</Badge>
                        ) : (
                          <Badge variant="success" dot>Đầy đủ</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBalance(bal);
                            setAdjustModalOpen(true);
                          }}
                        >
                          Điều chỉnh
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-slate-400">
                    Không có thông tin tồn kho phù hợp
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
              Trang <span className="font-semibold text-slate-800">{page}</span> /{" "}
              {data.total_pages}
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

      <AdjustmentModal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        balance={selectedBalance}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

