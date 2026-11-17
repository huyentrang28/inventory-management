import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, ArrowLeft, Save, Send } from "lucide-react";
import { api } from "../../services/api";
import { Customer, Product, Warehouse } from "../../types";
import { formatCurrency } from "../../utils/formatters";
import { useUIStore } from "../../stores/uiStore";
import { Button } from "../../components/ui/Button";

interface IssueItemRow {
  product_id: number;
  quantity: number;
  unit_price: number;
  notes?: string;
}

export const CreateIssuePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useUIStore();

  const [warehouseId, setWarehouseId] = useState<number | "">("");
  const [customerId, setCustomerId] = useState<number | "">("");
  const [reason, setReason] = useState("Xuất bán hàng");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<IssueItemRow[]>([
    { product_id: 0, quantity: 1, unit_price: 0, notes: "" },
  ]);

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["warehouses-all"],
    queryFn: async () => (await api.get("/warehouses/all")).data,
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["customers-all"],
    queryFn: async () => (await api.get("/customers/all")).data,
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["products-all"],
    queryFn: async () => (await api.get("/products/all")).data,
  });

  const addItemRow = () => {
    setItems([...items, { product_id: 0, quantity: 1, unit_price: 0, notes: "" }]);
  };

  const removeItemRow = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof IssueItemRow, value: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };

    if (field === "product_id" && products) {
      const prod = products.find((p) => p.id === Number(value));
      if (prod) {
        updated[idx].unit_price = Number(prod.selling_price);
      }
    }
    setItems(updated);
  };

  const totalAmount = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
    0
  );

  const handleSubmit = async (submitForApproval: boolean = false) => {
    if (!warehouseId) {
      showToast({ type: "error", message: "Vui lòng chọn kho xuất hàng" });
      return;
    }

    const invalidItems = items.filter((it) => !it.product_id || it.quantity <= 0);
    if (invalidItems.length > 0) {
      showToast({ type: "error", message: "Vui lòng chọn sản phẩm và nhập số lượng xuất > 0" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        warehouse_id: Number(warehouseId),
        customer_id: customerId ? Number(customerId) : undefined,
        reason,
        notes,
        items: items.map((it) => ({
          product_id: Number(it.product_id),
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
          notes: it.notes,
        })),
      };

      const res = await api.post("/issues", payload);
      const issueId = res.data.id;

      if (submitForApproval) {
        await api.post(`/issues/${issueId}/submit`);
        showToast({ type: "success", message: "Tạo và gửi duyệt phiếu xuất kho thành công" });
      } else {
        showToast({ type: "success", message: "Lưu bản nháp phiếu xuất kho thành công" });
      }

      navigate(`/issues/${issueId}`);
    } catch (err: any) {
      showToast({
        type: "error",
        message: err.response?.data?.detail || "Đã xảy ra lỗi khi tạo phiếu xuất kho",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/issues" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Danh sách phiếu xuất
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Lập phiếu xuất kho mới</h1>
          <p className="text-xs text-slate-500">Tạo phiếu xuất bán, xuất chuyển kho hoặc xuất nội bộ</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            isLoading={isSubmitting}
            onClick={() => handleSubmit(false)}
            icon={<Save className="w-4 h-4" />}
          >
            Lưu bản nháp
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            onClick={() => handleSubmit(true)}
            icon={<Send className="w-4 h-4" />}
          >
            Lưu & Gửi duyệt
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">
          Thông tin xuất kho
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Kho xuất hàng *
            </label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value ? Number(e.target.value) : "")}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-600"
            >
              <option value="">-- Chọn kho xuất hàng --</option>
              {warehouses?.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Khách hàng / Đại lý
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : "")}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-600"
            >
              <option value="">-- Chọn khách hàng --</option>
              {customers?.map((cust) => (
                <option key={cust.id} value={cust.id}>
                  {cust.name} ({cust.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Lý do xuất kho
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-600"
            >
              <option value="Xuất bán hàng">Xuất bán hàng</option>
              <option value="Xuất bảo hành đổi trả">Xuất bảo hành đổi trả</option>
              <option value="Xuất tiêu hao nội bộ">Xuất tiêu hao nội bộ</option>
              <option value="Xuất hủy hàng hỏng">Xuất hủy hàng hỏng</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Ghi chú phiếu xuất
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Số đơn hàng bán, người nhận..."
            className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-600"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Danh mục sản phẩm xuất</h3>
          <Button variant="outline" size="sm" onClick={addItemRow} icon={<Plus className="w-4 h-4" />}>
            Thêm dòng sản phẩm
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Sản phẩm *</th>
                <th className="py-3 px-4 w-32 text-right">Số lượng xuất *</th>
                <th className="py-3 px-4 w-40 text-right">Đơn giá bán (VND)</th>
                <th className="py-3 px-4 w-44 text-right">Thành tiền (VND)</th>
                <th className="py-3 px-4">Ghi chú</th>
                <th className="py-3 px-4 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((row, idx) => {
                const subtotal = (Number(row.quantity) || 0) * (Number(row.unit_price) || 0);
                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
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
                    <td className="py-3 px-4 text-right">
                      <input
                        type="number"
                        min="0"
                        value={row.unit_price}
                        onChange={(e) => updateItem(idx, "unit_price", Number(e.target.value))}
                        className="w-full text-right text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-indigo-700">
                      {formatCurrency(subtotal)}
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={row.notes || ""}
                        onChange={(e) => updateItem(idx, "notes", e.target.value)}
                        placeholder="Ghi chú dòng..."
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
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-sm">
          <span className="text-slate-600 font-medium">Tổng giá trị đơn xuất:</span>
          <span className="text-xl font-bold text-indigo-700">{formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </div>
  );
};

