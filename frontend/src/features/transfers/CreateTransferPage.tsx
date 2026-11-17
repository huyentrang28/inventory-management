import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, ArrowLeft, ArrowLeftRight } from "lucide-react";
import { api } from "../../services/api";
import { Product, Warehouse } from "../../types";
import { useUIStore } from "../../stores/uiStore";
import { Button } from "../../components/ui/Button";

interface TransferItemRow {
  product_id: number;
  quantity: number;
  notes?: string;
}

export const CreateTransferPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useUIStore();

  const [sourceWarehouseId, setSourceWarehouseId] = useState<number | "">("");
  const [destWarehouseId, setDestWarehouseId] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<TransferItemRow[]>([
    { product_id: 0, quantity: 1, notes: "" },
  ]);

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["warehouses-all"],
    queryFn: async () => (await api.get("/warehouses/all")).data,
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["products-all"],
    queryFn: async () => (await api.get("/products/all")).data,
  });

  const addItemRow = () => {
    setItems([...items, { product_id: 0, quantity: 1, notes: "" }]);
  };

  const removeItemRow = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof TransferItemRow, value: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async () => {
    if (!sourceWarehouseId || !destWarehouseId) {
      showToast({ type: "error", message: "Vui lòng chọn kho nguồn và kho đích" });
      return;
    }
    if (sourceWarehouseId === destWarehouseId) {
      showToast({ type: "error", message: "Kho nguồn và kho đích không được trùng nhau" });
      return;
    }

    const invalidItems = items.filter((it) => !it.product_id || it.quantity <= 0);
    if (invalidItems.length > 0) {
      showToast({ type: "error", message: "Vui lòng chọn sản phẩm và số lượng chuyển > 0" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        source_warehouse_id: Number(sourceWarehouseId),
        dest_warehouse_id: Number(destWarehouseId),
        notes,
        items: items.map((it) => ({
          product_id: Number(it.product_id),
          quantity: Number(it.quantity),
          notes: it.notes,
        })),
      };

      const res = await api.post("/transfers", payload);
      showToast({ type: "success", message: "Lập phiếu chuyển kho thành công" });
      navigate(`/transfers/${res.data.id}`);
    } catch (err: any) {
      showToast({
        type: "error",
        message: err.response?.data?.detail || "Lỗi khi lập phiếu chuyển kho",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <Link to="/transfers" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium mb-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Danh sách chuyển kho
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Lập phiếu chuyển kho liên chi nhánh</h1>
        <p className="text-xs text-slate-500">Chuyển điều phối hàng hóa giữa các kho trong hệ thống</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-indigo-600" /> Tuyến điều chuyển
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Kho nguồn (Xuất chuyển) *
            </label>
            <select
              value={sourceWarehouseId}
              onChange={(e) => setSourceWarehouseId(e.target.value ? Number(e.target.value) : "")}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-600"
            >
              <option value="">-- Chọn kho nguồn --</option>
              {warehouses?.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Kho đích (Nhận chuyển) *
            </label>
            <select
              value={destWarehouseId}
              onChange={(e) => setDestWarehouseId(e.target.value ? Number(e.target.value) : "")}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-600"
            >
              <option value="">-- Chọn kho đích --</option>
              {warehouses
                ?.filter((wh) => wh.id !== Number(sourceWarehouseId))
                .map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Ghi chú điều chuyển
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Lý do điều chuyển, đơn vị vận chuyển..."
            className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-600"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Danh mục sản phẩm chuyển</h3>
          <Button variant="outline" size="sm" onClick={addItemRow} icon={<Plus className="w-4 h-4" />}>
            Thêm sản phẩm
          </Button>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Sản phẩm *</th>
              <th className="py-3 px-4 w-40 text-right">Số lượng chuyển *</th>
              <th className="py-3 px-4">Ghi chú</th>
              <th className="py-3 px-4 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((row, idx) => (
              <tr key={idx}>
                <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                <td className="py-3 px-4">
                  <select
                    value={row.product_id}
                    onChange={(e) => updateItem(idx, "product_id", Number(e.target.value))}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    <option value={0}>-- Chọn sản phẩm --</option>
                    {products?.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.sku}] {p.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-3 px-4 text-right">
                  <input
                    type="number"
                    min="1"
                    value={row.quantity}
                    onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                    className="w-full text-right text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </td>
                <td className="py-3 px-4">
                  <input
                    type="text"
                    value={row.notes || ""}
                    onChange={(e) => updateItem(idx, "notes", e.target.value)}
                    placeholder="Quy cách, số kiện..."
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    disabled={items.length <= 1}
                    className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>
            Tạo phiếu chuyển kho
          </Button>
        </div>
      </div>
    </div>
  );
};

