import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Printer,
  XCircle,
  FileText,
  User,
  Building2,
  Calendar,
  Send,
} from "lucide-react";
import { api } from "../../services/api";
import { StockReceipt } from "../../types";
import { formatCurrency, formatDateTime, formatNumber } from "../../utils/formatters";
import { useUIStore } from "../../stores/uiStore";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";

export const ReceiptDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useUIStore();
  const [actionLoading, setActionLoading] = useState(false);

  const { data: receipt, isLoading, refetch } = useQuery<StockReceipt>({
    queryKey: ["receipt-detail", id],
    queryFn: async () => (await api.get(`/receipts/${id}`)).data,
  });

  const handleAction = async (endpoint: string, successMsg: string) => {
    setActionLoading(true);
    try {
      await api.post(`/receipts/${id}/${endpoint}`);
      showToast({ type: "success", message: successMsg });
      refetch();
    } catch (err: any) {
      showToast({
        type: "error",
        message: err.response?.data?.detail || "Đã xảy ra lỗi khi thực hiện thao tác",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
  }

  if (!receipt) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        Không tìm thấy phiếu nhập kho
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/receipts"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Danh sách phiếu nhập
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 font-mono">
              {receipt.receipt_code}
            </h1>
            <StatusBadge status={receipt.status} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} icon={<Printer className="w-4 h-4" />}>
            In phiếu
          </Button>

          {receipt.status === "DRAFT" && (
            <Button
              variant="primary"
              size="sm"
              isLoading={actionLoading}
              onClick={() => handleAction("submit", "Gửi duyệt phiếu thành công")}
              icon={<Send className="w-4 h-4" />}
            >
              Gửi duyệt
            </Button>
          )}

          {receipt.status === "PENDING_APPROVAL" && (
            <Button
              variant="primary"
              size="sm"
              isLoading={actionLoading}
              onClick={() => handleAction("approve", "Phê duyệt phiếu nhập thành công")}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              Phê duyệt
            </Button>
          )}

          {(receipt.status === "APPROVED" || receipt.status === "PENDING_APPROVAL") && (
            <Button
              variant="success"
              size="sm"
              isLoading={actionLoading}
              onClick={() => handleAction("complete", "Đã hoàn tất nhập kho và cộng tồn kho!")}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              Hoàn tất nhập kho
            </Button>
          )}

          {receipt.status !== "COMPLETED" && receipt.status !== "CANCELLED" && (
            <Button
              variant="danger"
              size="sm"
              isLoading={actionLoading}
              onClick={() => handleAction("cancel", "Đã hủy phiếu nhập kho")}
              icon={<XCircle className="w-4 h-4" />}
            >
              Hủy phiếu
            </Button>
          )}
        </div>
      </div>

      {/* Process Stepper */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">1</span>
            <span className="font-semibold text-slate-800">Lập phiếu nháp</span>
          </div>
          <div className="h-0.5 flex-1 mx-3 bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full font-bold flex items-center justify-center ${
              receipt.status !== "DRAFT" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
            }`}>2</span>
            <span className="font-semibold text-slate-800">Chờ duyệt</span>
          </div>
          <div className="h-0.5 flex-1 mx-3 bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full font-bold flex items-center justify-center ${
              receipt.status === "APPROVED" || receipt.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
            }`}>3</span>
            <span className="font-semibold text-slate-800">Đã duyệt</span>
          </div>
          <div className="h-0.5 flex-1 mx-3 bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full font-bold flex items-center justify-center ${
              receipt.status === "COMPLETED" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
            }`}>4</span>
            <span className="font-semibold text-slate-800">Hoàn tất nhập</span>
          </div>
        </div>
      </div>

      {/* Metadata Overview */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-400 font-medium">Kho nhận hàng</span>
          <p className="font-semibold text-slate-900 mt-1">{receipt.warehouse?.name}</p>
        </div>
        <div>
          <span className="text-slate-400 font-medium">Nhà cung cấp</span>
          <p className="font-semibold text-slate-900 mt-1">{receipt.supplier?.name || "Nhập khác"}</p>
        </div>
        <div>
          <span className="text-slate-400 font-medium">Ngày lập phiếu</span>
          <p className="font-semibold text-slate-900 mt-1">{formatDateTime(receipt.receipt_date)}</p>
        </div>
        <div>
          <span className="text-slate-400 font-medium">Người lập</span>
          <p className="font-semibold text-slate-900 mt-1">{receipt.creator?.full_name || "-"}</p>
        </div>
      </div>

      {/* Items list */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-semibold text-sm text-slate-900">
          Chi tiết danh sách hàng hóa
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Mã SKU</th>
              <th className="py-3 px-4">Tên hàng hóa</th>
              <th className="py-3 px-4 text-right">Số lượng nhập</th>
              <th className="py-3 px-4 text-right">Đơn giá vốn</th>
              <th className="py-3 px-4 text-right">Thành tiền</th>
              <th className="py-3 px-4">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {receipt.items.map((item) => (
              <tr key={item.id}>
                <td className="py-3 px-4 font-mono font-bold text-indigo-600">{item.product?.sku}</td>
                <td className="py-3 px-4 font-medium text-slate-900">{item.product?.name}</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">{formatNumber(item.quantity)}</td>
                <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(item.unit_price)}</td>
                <td className="py-3 px-4 text-right font-bold text-indigo-700">{formatCurrency(item.total_amount)}</td>
                <td className="py-3 px-4 text-slate-500">{item.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-sm">
          <span className="font-semibold text-slate-700">Tổng cộng thành tiền:</span>
          <span className="text-xl font-bold text-indigo-700">{formatCurrency(receipt.total_amount)}</span>
        </div>
      </div>
    </div>
  );
};

