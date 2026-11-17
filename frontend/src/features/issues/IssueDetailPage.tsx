import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle,
  Printer,
  XCircle,
  Send,
  Building2,
  Calendar,
  Users2,
} from "lucide-react";
import { api } from "../../services/api";
import { StockIssue } from "../../types";
import { formatCurrency, formatDateTime, formatNumber } from "../../utils/formatters";
import { useUIStore } from "../../stores/uiStore";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";

export const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useUIStore();
  const [actionLoading, setActionLoading] = useState(false);

  const { data: issue, isLoading, refetch } = useQuery<StockIssue>({
    queryKey: ["issue-detail", id],
    queryFn: async () => (await api.get(`/issues/${id}`)).data,
  });

  const handleAction = async (endpoint: string, successMsg: string) => {
    setActionLoading(true);
    try {
      await api.post(`/issues/${id}/${endpoint}`);
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

  if (!issue) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        Không tìm thấy phiếu xuất kho
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/issues"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Danh sách phiếu xuất
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 font-mono">
              {issue.issue_code}
            </h1>
            <StatusBadge status={issue.status} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} icon={<Printer className="w-4 h-4" />}>
            In phiếu
          </Button>

          {issue.status === "DRAFT" && (
            <Button
              variant="primary"
              size="sm"
              isLoading={actionLoading}
              onClick={() => handleAction("submit", "Gửi duyệt phiếu xuất thành công")}
              icon={<Send className="w-4 h-4" />}
            >
              Gửi duyệt
            </Button>
          )}

          {issue.status === "PENDING_APPROVAL" && (
            <Button
              variant="primary"
              size="sm"
              isLoading={actionLoading}
              onClick={() => handleAction("approve", "Phê duyệt phiếu xuất thành công")}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              Phê duyệt
            </Button>
          )}

          {(issue.status === "APPROVED" || issue.status === "PENDING_APPROVAL") && (
            <Button
              variant="success"
              size="sm"
              isLoading={actionLoading}
              onClick={() => handleAction("complete", "Đã hoàn tất xuất kho và trừ tồn kho an toàn!")}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              Hoàn tất xuất kho
            </Button>
          )}

          {issue.status !== "COMPLETED" && issue.status !== "CANCELLED" && (
            <Button
              variant="danger"
              size="sm"
              isLoading={actionLoading}
              onClick={() => handleAction("cancel", "Đã hủy phiếu xuất kho")}
              icon={<XCircle className="w-4 h-4" />}
            >
              Hủy phiếu
            </Button>
          )}
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">1</span>
            <span className="font-semibold text-slate-800">Lập phiếu nháp</span>
          </div>
          <div className="h-0.5 flex-1 mx-3 bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full font-bold flex items-center justify-center ${
              issue.status !== "DRAFT" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
            }`}>2</span>
            <span className="font-semibold text-slate-800">Chờ duyệt</span>
          </div>
          <div className="h-0.5 flex-1 mx-3 bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full font-bold flex items-center justify-center ${
              issue.status === "APPROVED" || issue.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
            }`}>3</span>
            <span className="font-semibold text-slate-800">Đã duyệt</span>
          </div>
          <div className="h-0.5 flex-1 mx-3 bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full font-bold flex items-center justify-center ${
              issue.status === "COMPLETED" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
            }`}>4</span>
            <span className="font-semibold text-slate-800">Hoàn tất xuất</span>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-400 font-medium">Kho xuất hàng</span>
          <p className="font-semibold text-slate-900 mt-1">{issue.warehouse?.name}</p>
        </div>
        <div>
          <span className="text-slate-400 font-medium">Khách hàng nhận</span>
          <p className="font-semibold text-slate-900 mt-1">{issue.customer?.name || "Khách lẻ"}</p>
        </div>
        <div>
          <span className="text-slate-400 font-medium">Lý do xuất</span>
          <p className="font-semibold text-slate-900 mt-1">{issue.reason || "Xuất bán"}</p>
        </div>
        <div>
          <span className="text-slate-400 font-medium">Thời gian xuất</span>
          <p className="font-semibold text-slate-900 mt-1">{formatDateTime(issue.issue_date)}</p>
        </div>
      </div>

      {/* Items list */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-semibold text-sm text-slate-900">
          Danh mục hàng hóa xuất kho
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Mã SKU</th>
              <th className="py-3 px-4">Tên hàng hóa</th>
              <th className="py-3 px-4 text-right">Số lượng xuất</th>
              <th className="py-3 px-4 text-right">Đơn giá bán</th>
              <th className="py-3 px-4 text-right">Thành tiền</th>
              <th className="py-3 px-4">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {issue.items.map((item) => (
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
          <span className="font-semibold text-slate-700">Tổng giá trị phiếu xuất:</span>
          <span className="text-xl font-bold text-indigo-700">{formatCurrency(issue.total_amount)}</span>
        </div>
      </div>
    </div>
  );
};

