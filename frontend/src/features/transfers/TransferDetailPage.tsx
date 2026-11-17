import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Truck, CheckCircle, Package } from "lucide-react";
import { api } from "../../services/api";
import { StockTransfer } from "../../types";
import { formatDateTime, formatNumber } from "../../utils/formatters";
import { useUIStore } from "../../stores/uiStore";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";

export const TransferDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useUIStore();
  const [loading, setLoading] = useState(false);

  const { data: transfer, isLoading, refetch } = useQuery<StockTransfer>({
    queryKey: ["transfer-detail", id],
    queryFn: async () => (await api.get(`/transfers/${id}`)).data,
  });

  const handleDispatch = async () => {
    setLoading(true);
    try {
      await api.post(`/transfers/${id}/dispatch`);
      showToast({ type: "success", message: "Đã xuất hàng chuyển đi và trừ tồn kho nguồn!" });
      refetch();
    } catch (err: any) {
      showToast({ type: "error", message: err.response?.data?.detail || "Lỗi khi xuất chuyển" });
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async () => {
    setLoading(true);
    try {
      await api.post(`/transfers/${id}/receive`);
      showToast({ type: "success", message: "Đã nhận hàng thành công và cộng tồn kho đích!" });
      refetch();
    } catch (err: any) {
      showToast({ type: "error", message: err.response?.data?.detail || "Lỗi khi nhận hàng" });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
  if (!transfer) return <div className="p-12 text-center text-slate-500">Không tìm thấy phiếu chuyển kho</div>;

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link to="/transfers" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Danh sách chuyển kho
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 font-mono">{transfer.transfer_code}</h1>
            <StatusBadge status={transfer.status} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {transfer.status === "DRAFT" && (
            <Button variant="primary" size="sm" isLoading={loading} onClick={handleDispatch} icon={<Truck className="w-4 h-4" />}>
              Xuất chuyển hàng (Deduct Source)
            </Button>
          )}
          {transfer.status === "IN_TRANSIT" && (
            <Button variant="success" size="sm" isLoading={loading} onClick={handleReceive} icon={<CheckCircle className="w-4 h-4" />}>
              Xác nhận đã nhận hàng (Add Dest)
            </Button>
          )}
        </div>
      </div>

      {/* Route display card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Kho nguồn xuất</span>
            <h3 className="text-base font-bold text-slate-900 mt-1">{transfer.source_warehouse?.name}</h3>
            <p className="text-xs text-slate-500 font-mono">{transfer.source_warehouse?.code}</p>
          </div>
          <div className="flex flex-col items-center px-4">
            <span className="text-xs text-indigo-600 font-semibold mb-1 flex items-center gap-1">
              <Truck className="w-4 h-4" /> Vận chuyển
            </span>
            <div className="w-32 sm:w-48 h-0.5 bg-indigo-200 relative flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-indigo-600 absolute right-0" />
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Kho đích nhận</span>
            <h3 className="text-base font-bold text-slate-900 mt-1">{transfer.dest_warehouse?.name}</h3>
            <p className="text-xs text-slate-500 font-mono">{transfer.dest_warehouse?.code}</p>
          </div>
        </div>
      </div>

      {/* Items list */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-semibold text-sm text-slate-900">
          Danh mục sản phẩm điều chuyển
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Mã SKU</th>
              <th className="py-3 px-4">Tên hàng hóa</th>
              <th className="py-3 px-4 text-right">Số lượng chuyển</th>
              <th className="py-3 px-4">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transfer.items.map((it) => (
              <tr key={it.id}>
                <td className="py-3 px-4 font-mono font-bold text-indigo-600">{it.product?.sku}</td>
                <td className="py-3 px-4 font-medium text-slate-900">{it.product?.name}</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">{formatNumber(it.quantity)}</td>
                <td className="py-3 px-4 text-slate-500">{it.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

