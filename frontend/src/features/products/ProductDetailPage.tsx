import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Package,
  Layers,
  Building2,
  DollarSign,
  AlertTriangle,
  History,
  Boxes,
} from "lucide-react";
import { api } from "../../services/api";
import {
  InventoryBalance,
  InventoryTransaction,
  PaginatedResponse,
  Product,
} from "../../types";
import { formatCurrency, formatDateTime, formatNumber } from "../../utils/formatters";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Product master data
  const { data: product, isLoading: isProdLoading } = useQuery<Product>({
    queryKey: ["product-detail", id],
    queryFn: async () => (await api.get(`/products/${id}`)).data,
  });

  // Balances across all warehouses
  const { data: balances, isLoading: isBalLoading } = useQuery<InventoryBalance[]>({
    queryKey: ["product-balances", id],
    queryFn: async () => (await api.get(`/products/${id}/balances`)).data,
  });

  // Transaction history for this product
  const { data: txData, isLoading: isTxLoading } = useQuery<PaginatedResponse<InventoryTransaction>>({
    queryKey: ["product-transactions", id],
    queryFn: async () => (await api.get(`/inventory/transactions?product_id=${id}&page_size=20`)).data,
  });

  if (isProdLoading) {
    return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
  }

  if (!product) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        Không tìm thấy thông tin sản phẩm.
        <div className="mt-4">
          <Link to="/products" className="text-indigo-600 font-semibold hover:underline">
            Quay lại danh sách sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  const totalOnHand = balances?.reduce((sum, b) => sum + Number(b.quantity_on_hand), 0) || 0;
  const isLowStock = totalOnHand <= Number(product.min_stock_level);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh mục sản phẩm
        </Link>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded">
                  {product.sku}
                </span>
                {product.is_active ? (
                  <Badge variant="success" dot>Đang kinh doanh</Badge>
                ) : (
                  <Badge variant="neutral" dot>Ngừng kinh doanh</Badge>
                )}
                {isLowStock && (
                  <Badge variant="warning" dot>Cảnh báo tồn thấp</Badge>
                )}
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">{product.name}</h1>
              {product.barcode && (
                <p className="text-xs text-slate-400 font-mono mt-0.5">Mã vạch: {product.barcode}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-medium">Giá nhập vốn</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">
                {formatCurrency(product.cost_price)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-medium">Giá bán niêm yết</p>
              <p className="text-base font-bold text-indigo-600 mt-0.5">
                {formatCurrency(product.selling_price)}
              </p>
            </div>
          </div>
        </div>

        {/* Specs Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-[11px] text-slate-400 font-medium uppercase">Danh mục</span>
            <p className="text-xs font-semibold text-slate-800 mt-1">
              {product.category?.name || "Chưa phân loại"}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-[11px] text-slate-400 font-medium uppercase">Đơn vị tính</span>
            <p className="text-xs font-semibold text-slate-800 mt-1">
              {product.unit?.name || "-"}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-[11px] text-slate-400 font-medium uppercase">Tổng tồn khả dụng</span>
            <p className={`text-xs font-bold mt-1 ${isLowStock ? "text-amber-600" : "text-emerald-600"}`}>
              {formatNumber(totalOnHand)} {product.unit?.name}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-[11px] text-slate-400 font-medium uppercase">Tồn tối thiểu</span>
            <p className="text-xs font-semibold text-slate-800 mt-1">
              {formatNumber(product.min_stock_level)} {product.unit?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Stock by Warehouse Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-600" /> Tồn kho theo từng kho lưu trữ
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Chi tiết số lượng thực tế và giá vốn bình quân gia quyền tại từng địa điểm kho
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isBalLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : balances && balances.length > 0 ? (
            balances.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    {b.warehouse?.name} ({b.warehouse?.code})
                  </span>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {formatNumber(b.quantity_on_hand)} {product.unit?.name}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between text-xs text-slate-500">
                  <span>Giá vốn BQ:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(b.avg_cost)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 py-6 text-center text-xs text-slate-400">
              Sản phẩm chưa có tồn kho tại kho nào
            </div>
          )}
        </div>
      </div>

      {/* Recent Inventory Transactions */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" /> Lịch sử biến động kho gần nhất
          </h3>
          <span className="text-xs text-slate-400">Nhật ký bất biến (Immutable Ledger)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-4">Mã GD</th>
                <th className="py-2.5 px-4">Thời gian</th>
                <th className="py-2.5 px-4">Kho</th>
                <th className="py-2.5 px-4">Loại GD</th>
                <th className="py-2.5 px-4 text-right">Số lượng</th>
                <th className="py-2.5 px-4 text-right">Tồn trước</th>
                <th className="py-2.5 px-4 text-right">Tồn sau</th>
                <th className="py-2.5 px-4">Chứng từ liên quan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isTxLoading ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center">Đang tải lịch sử...</td>
                </tr>
              ) : txData?.items && txData.items.length > 0 ? (
                txData.items.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-mono font-semibold text-indigo-600">
                      {tx.transaction_code}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{formatDateTime(tx.created_at)}</td>
                    <td className="py-2.5 px-4 text-slate-800 font-medium">{tx.warehouse?.name}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                      {formatNumber(tx.quantity)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-500">
                      {formatNumber(tx.balance_before)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-indigo-600">
                      {formatNumber(tx.balance_after)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono text-[11px]">
                      {tx.reference_code}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                    Chưa có giao dịch biến động kho nào
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

