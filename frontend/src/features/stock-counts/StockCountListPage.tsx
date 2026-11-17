import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, ClipboardCheck, Eye, Search } from "lucide-react";
import { api } from "../../services/api";
import { PaginatedResponse, StockCount, Warehouse } from "../../types";
import { formatDateTime } from "../../utils/formatters";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { useUIStore } from "../../stores/uiStore";

export const StockCountListPage: React.FC = () => {
  const { showToast } = useUIStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [warehouseId, setWarehouseId] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["warehouses-all"],
    queryFn: async () => (await api.get("/warehouses/all")).data,
  });

  const { data, isLoading, refetch } = useQuery<PaginatedResponse<StockCount>>({
    queryKey: ["stock-counts"],
    queryFn: async () => (await api.get("/stock-counts")).data,
  });

  const handleCreateCount = async () => {
    if (!warehouseId) {
      showToast({ type: "error", message: "Vui lòng chọn kho kiểm kê" });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.post("/stock-counts", {
        warehouse_id: Number(warehouseId),
        notes,
      });
      showToast({ type: "success", message: "Khởi tạo đợt kiểm kê thành công" });
      setModalOpen(false);
      refetch();
    } catch (err: any) {
      showToast({ type: "error", message: err.response?.data?.detail || "Lỗi khi tạo đợt kiểm kê" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản lý Kiểm kê kho</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tạo snapshot tồn hệ thống, đối chiếu số lượng thực tế và tự động cân chỉnh lệch kho
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Tạo đợt kiểm kê mới
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Mã đợt kiểm</th>
              <th className="py-3 px-4">Ngày bắt đầu</th>
              <th className="py-3 px-4">Kho kiểm kê</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
              <th className="py-3 px-4">Người tạo</th>
              <th className="py-3 px-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={6} className="p-6"><TableSkeleton rows={4} cols={6} /></td></tr>
            ) : data?.items && data.items.length > 0 ? (
              data.items.map((sc) => (
                <tr key={sc.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                    <Link to={`/stock-counts/${sc.id}`} className="hover:underline">
                      {sc.count_code}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{formatDateTime(sc.count_date)}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{sc.warehouse?.name}</td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={sc.status} />
                  </td>
                  <td className="py-3 px-4 text-slate-500">{sc.creator?.full_name || "-"}</td>
                  <td className="py-3 px-4 text-center">
                    <Link
                      to={`/stock-counts/${sc.id}`}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="py-12 text-center text-xs text-slate-400">Chưa có đợt kiểm kê nào</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Khởi tạo đợt kiểm kê mới">
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Hệ thống sẽ tự động chụp snapshot số lượng tồn sổ sách hiện tại của tất cả sản phẩm trong kho.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Chọn kho kiểm kê *
            </label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value ? Number(e.target.value) : "")}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-600"
            >
              <option value="">-- Chọn kho cần kiểm kê --</option>
              {warehouses?.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Ghi chú đợt kiểm kê
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Kiểm kê định kỳ cuối quý..."
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" isLoading={isSubmitting} onClick={handleCreateCount}>
              Bắt đầu kiểm kê
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

