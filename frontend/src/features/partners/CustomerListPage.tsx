import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit2, Search, Users2, Phone, Mail } from "lucide-react";
import { api } from "../../services/api";
import { Customer, PaginatedResponse } from "../../types";
import { useUIStore } from "../../stores/uiStore";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { TableSkeleton } from "../../components/ui/Skeleton";

const customerSchema = z.object({
  code: z.string().min(1, "Mã khách hàng là bắt buộc"),
  name: z.string().min(1, "Tên khách hàng là bắt buộc"),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  tax_id: z.string().optional(),
  contact_person: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export const CustomerListPage: React.FC = () => {
  const { showToast } = useUIStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  const { data, isLoading, refetch } = useQuery<PaginatedResponse<Customer>>({
    queryKey: ["customers", search],
    queryFn: async () => {
      const params = search ? { search } : {};
      return (await api.get("/customers", { params })).data;
    },
  });

  const openCreateModal = () => {
    setEditingCustomer(null);
    reset({
      code: "",
      name: "",
      phone: "",
      email: "",
      address: "",
      tax_id: "",
      contact_person: "",
      notes: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    reset({
      code: cust.code,
      name: cust.name,
      phone: cust.phone || "",
      email: cust.email || "",
      address: cust.address || "",
      tax_id: cust.tax_id || "",
      contact_person: cust.contact_person || "",
      notes: cust.notes || "",
    });
    setModalOpen(true);
  };

  const onSubmit = async (formData: CustomerFormData) => {
    try {
      if (editingCustomer) {
        await api.patch(`/customers/${editingCustomer.id}`, formData);
        showToast({ type: "success", message: "Cập nhật khách hàng thành công" });
      } else {
        await api.post("/customers", formData);
        showToast({ type: "success", message: "Thêm khách hàng mới thành công" });
      }
      setModalOpen(false);
      refetch();
    } catch (err: any) {
      showToast({
        type: "error",
        message: err.response?.data?.detail || "Lỗi khi lưu khách hàng",
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản lý Khách hàng</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Danh sách đại lý, khách lẻ và đối tác xuất hàng
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreateModal} icon={<Plus className="w-4 h-4" />}>
          Thêm khách hàng
        </Button>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, mã KH, SĐT..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-indigo-600"
          />
        </div>
        <span className="text-xs text-slate-500">
          Tổng số: <strong className="text-slate-800">{data?.total || 0}</strong> khách hàng
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Mã KH</th>
              <th className="py-3 px-4">Tên khách hàng</th>
              <th className="py-3 px-4">Người liên hệ</th>
              <th className="py-3 px-4">Số điện thoại</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Địa chỉ</th>
              <th className="py-3 px-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={7} className="p-6"><TableSkeleton rows={4} cols={7} /></td></tr>
            ) : data?.items && data.items.length > 0 ? (
              data.items.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{cust.code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{cust.name}</td>
                  <td className="py-3 px-4 text-slate-700">{cust.contact_person || "-"}</td>
                  <td className="py-3 px-4 text-slate-700">{cust.phone || "-"}</td>
                  <td className="py-3 px-4 text-slate-500">{cust.email || "-"}</td>
                  <td className="py-3 px-4 text-slate-600">{cust.address || "-"}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => openEditModal(cust)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="py-8 text-center text-slate-400">Không có khách hàng nào</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCustomer ? "Chỉnh sửa khách hàng" : "Thêm khách hàng mới"}
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Mã khách hàng *"
              placeholder="VD: CUST-001"
              error={errors.code?.message}
              disabled={!!editingCustomer}
              {...register("code")}
            />
            <Input
              label="Tên khách hàng *"
              placeholder="VD: Công ty TNHH Bán lẻ..."
              error={errors.name?.message}
              {...register("name")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Người liên hệ"
              placeholder="Trần Văn B"
              {...register("contact_person")}
            />
            <Input
              label="Mã số thuế"
              placeholder="0309988776"
              {...register("tax_id")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Số điện thoại"
              placeholder="0901234567"
              {...register("phone")}
            />
            <Input
              label="Email"
              type="email"
              placeholder="customer@domain.vn"
              {...register("email")}
            />
          </div>

          <Input
            label="Địa chỉ"
            placeholder="Địa chỉ giao hàng / hóa đơn..."
            {...register("address")}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Lưu khách hàng
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

