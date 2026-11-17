import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit2, Search, Truck, Phone, Mail, Building, FileText } from "lucide-react";
import { api } from "../../services/api";
import { PaginatedResponse, Supplier } from "../../types";
import { useUIStore } from "../../stores/uiStore";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { TableSkeleton } from "../../components/ui/Skeleton";

const supplierSchema = z.object({
  code: z.string().min(1, "Mã NCC là bắt buộc"),
  name: z.string().min(1, "Tên NCC là bắt buộc"),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  tax_id: z.string().optional(),
  contact_person: z.string().optional(),
  notes: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export const SupplierListPage: React.FC = () => {
  const { showToast } = useUIStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [search, setSearch] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
  });

  const { data, isLoading, refetch } = useQuery<PaginatedResponse<Supplier>>({
    queryKey: ["suppliers", search],
    queryFn: async () => {
      const params = search ? { search } : {};
      return (await api.get("/suppliers", { params })).data;
    },
  });

  const openCreateModal = () => {
    setEditingSupplier(null);
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

  const openEditModal = (sup: Supplier) => {
    setEditingSupplier(sup);
    reset({
      code: sup.code,
      name: sup.name,
      phone: sup.phone || "",
      email: sup.email || "",
      address: sup.address || "",
      tax_id: sup.tax_id || "",
      contact_person: sup.contact_person || "",
      notes: sup.notes || "",
    });
    setModalOpen(true);
  };

  const onSubmit = async (formData: SupplierFormData) => {
    try {
      if (editingSupplier) {
        await api.patch(`/suppliers/${editingSupplier.id}`, formData);
        showToast({ type: "success", message: "Cập nhật nhà cung cấp thành công" });
      } else {
        await api.post("/suppliers", formData);
        showToast({ type: "success", message: "Thêm nhà cung cấp mới thành công" });
      }
      setModalOpen(false);
      refetch();
    } catch (err: any) {
      showToast({
        type: "error",
        message: err.response?.data?.detail || "Lỗi khi lưu nhà cung cấp",
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản lý Nhà cung cấp</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Danh sách đối tác nhập hàng, thông tin liên hệ và mã số thuế
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreateModal} icon={<Plus className="w-4 h-4" />}>
          Thêm nhà cung cấp
        </Button>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, mã NCC, SĐT..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-indigo-600"
          />
        </div>
        <span className="text-xs text-slate-500">
          Tổng số: <strong className="text-slate-800">{data?.total || 0}</strong> đối tác
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Mã NCC</th>
              <th className="py-3 px-4">Tên nhà cung cấp</th>
              <th className="py-3 px-4">Người liên hệ</th>
              <th className="py-3 px-4">Số điện thoại</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Mã số thuế</th>
              <th className="py-3 px-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={7} className="p-6"><TableSkeleton rows={4} cols={7} /></td></tr>
            ) : data?.items && data.items.length > 0 ? (
              data.items.map((sup) => (
                <tr key={sup.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{sup.code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{sup.name}</td>
                  <td className="py-3 px-4 text-slate-700">{sup.contact_person || "-"}</td>
                  <td className="py-3 px-4 text-slate-700">{sup.phone || "-"}</td>
                  <td className="py-3 px-4 text-slate-500">{sup.email || "-"}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{sup.tax_id || "-"}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => openEditModal(sup)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="py-8 text-center text-slate-400">Không có nhà cung cấp nào</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSupplier ? "Chỉnh sửa nhà cung cấp" : "Thêm nhà cung cấp mới"}
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Mã nhà cung cấp *"
              placeholder="VD: SUP-001"
              error={errors.code?.message}
              disabled={!!editingSupplier}
              {...register("code")}
            />
            <Input
              label="Tên nhà cung cấp *"
              placeholder="VD: Công ty TNHH Thiết Bị..."
              error={errors.name?.message}
              {...register("name")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Người liên hệ"
              placeholder="Nguyễn Văn A"
              {...register("contact_person")}
            />
            <Input
              label="Mã số thuế"
              placeholder="0101234567"
              {...register("tax_id")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Số điện thoại"
              placeholder="0912345678"
              {...register("phone")}
            />
            <Input
              label="Email"
              type="email"
              placeholder="supplier@company.vn"
              {...register("email")}
            />
          </div>

          <Input
            label="Địa chỉ"
            placeholder="Số nhà, đường, quận, thành phố..."
            {...register("address")}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Lưu nhà cung cấp
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

