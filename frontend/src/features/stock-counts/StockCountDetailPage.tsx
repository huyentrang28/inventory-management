import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Save, Printer, AlertTriangle } from "lucide-react";
import { api } from "../../services/api";
import { StockCount } from "../../types";
import { formatDateTime, formatNumber } from "../../utils/formatters";
import { useUIStore } from "../../stores/uiStore";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";

export const StockCountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [actualCounts, setActualCounts] = useState<Record<number, number>>({});

  const { data: count, isLoading, refetch } = useQuery<StockCount>({
    queryKey: ["stock-count-detail", id],
    queryFn: async () => {
      const res = await api.get(`/stock-counts/${id}`);
      // Initialize count map
      const map: Record<number, number> = {};
      res.data.items?.forEach((it: any) => {
        map[it.id] = Number(it.actual_quantity);
      });
      setActualCounts(map);
      return res.data;
    },
  });

  const handleUpdateItem = async (itemId: number, actualQty: number) => {
    try {
      await api.patch(`/stock-counts/${id}/items/${itemId}`, {
        actual_quantity: actualQty,
      });
      showToast({ type: "success", message: "Đã cập nhật số lượng kiểm đếm" });
      refetch();
    } catch (err: any) {
      showToast({ type: "error", message: err.response?.data?.detail || "Lỗi khi cập nhật" });
    }
  };

  const handleComplete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hoàn tất đợt kiểm kê? Các chênh lệch tồn sẽ được tự động đồng bộ vào số dư kho.")) {
      return;
    }
    setLoading(true);
    try {
      await api.post(`/stock-counts/${id}/complete`);
      showToast({ type: "success", message: "Đã hoàn tất đợt kiểm kê và đồng bộ tồn kho!" });
      refetch();
    } catch (err: any) {
      showToast({ type: "error", message: err.response?.data?.detail || "Lỗi khi hoàn tất kiểm kê" });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
  if (!count) return <div className="p-12 text-center text-slate-500">Không tìm thấy đợt kiểm kê</div>;

  const isCompleted = count.status === "COMPLETED";

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link to="/stock-counts" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Danh sách kiểm kê
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 font-mono">{count.count_code}</h1>
            <StatusBadge status={count.status} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isCompleted && (
            <Button
              variant="success"
              size="sm"
              isLoading={loading}
              onClick={handleComplete}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              Hoàn tất & Cân chỉnh tồn kho
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()} icon={<Printer className="w-4 h-4" />}>
            In biên bản
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm grid grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-slate-400 font-medium">Kho kiểm kê</span>
          <p className="font-semibold text-slate-900 mt-1">{count.warehouse?.name}</p>
        </div>
        <div>
          <span className="text-slate-400 font-medium">Thời gian bắt đầu</span>
          <p className="font-semibold text-slate-900 mt-1">{formatDateTime(count.count_date)}</p>
        </div>
        <div>
          <span className="text-slate-400 font-medium">Người tạo</span>
          <p className="font-semibold text-slate-900 mt-1">{count.creator?.full_name || "-"}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-semibold text-sm text-slate-900 flex justify-between items-center">
          <span>Bảng đối chiếu số liệu kiểm kê thực tế</span>
          <span className="text-xs text-slate-400 font-normal">Chênh lệch = Thực tế - Sổ sách</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Mã SKU</th>
              <th className="py-3 px-4">Tên hàng hóa</th>
              <th className="py-3 px-4 text-right">Tồn hệ thống</th>
              <th className="py-3 px-4 w-40 text-right">Thực tế kiểm đếm</th>
              <th className="py-3 px-4 text-right">Chênh lệch</th>
              {!isCompleted && <th className="py-3 px-4 w-24 text-center">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {count.items.map((it) => {
              const sysQty = Number(it.system_quantity);
              const currentInput = actualCounts[it.id] ?? Number(it.actual_quantity);
              const diff = currentInput - sysQty;

              return (
                <tr key={it.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{it.product?.sku}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{it.product?.name}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-600">{formatNumber(sysQty)}</td>
                  <td className="py-3 px-4 text-right">
                    {isCompleted ? (
                      <span className="font-bold text-slate-900">{formatNumber(it.actual_quantity)}</span>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        value={currentInput}
                        onChange={(e) =>
                          setActualCounts({ ...actualCounts, [it.id]: Number(e.target.value) })
                        }
                        className="w-full text-right text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-bold"
                      />
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {diff === 0 ? (
                      <span className="text-slate-400 font-medium">Khớp</span>
                    ) : diff > 0 ? (
                      <span className="text-emerald-600 font-bold">+{formatNumber(diff)} (Thừa)</span>
                    ) : (
                      <span className="text-rose-600 font-bold">{formatNumber(diff)} (Thiếu)</span>
                    )}
                  </td>
                  {!isCompleted && (
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateItem(it.id, currentInput)}
                      >
                        Lưu
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

