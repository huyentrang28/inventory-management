import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit2, Trash2, Building2, MapPin, Phone, User as UserIcon } from "lucide-react";
import { api } from "../../services/api";
import { PaginatedResponse, Warehouse } from "../../types";
import { useUIStore } from "../../stores/uiStore";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { TableSkeleton } from "../../components/ui/Skeleton";

const warehouseSchema = z.object({
  code: z.string().min(1, "Mã kho là bắt buộc"),
  name: z.string().min(1, "Tên kho là bắt buộc"),
  address: z.string().optional(),
  manager_name: z.string().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

export const WarehousePage: React.FC = () => {
  const { showToast } = useUIStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState<Warehouse | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
  });

  const { data, isLoading, refetch } = useQuery<PaginatedResponse<Warehouse>>({
    queryKey: ["warehouses"],
    queryFn: async () => (await api.get("/warehouses")).data,
  });

  const openCreateModal = () => {
    setEditingWh(null);
    reset({ code: "", name: "", address: "", manager_name: "", phone: "", description: "" });
    setModalOpen(true);
  };

  const openEditModal = (wh: Warehouse) => {
    setEditingWh(wh);
    reset({
      code: wh.code,
      name: wh.name,
      address: wh.address || "",
      manager_name: wh.manager_name || "",
      phone: wh.phone || "",
      description: wh.description || "",
    });
    setModalOpen(true);
  };

  const onSubmit = async (formData: WarehouseFormData) => {
    try {
      if (editingWh) {
        await api.patch(`/warehouses/${editingWh.id}`, formData);
        showToast({ type: "success", message: "Cập nhật kho thành công" });
      } else {
        await api.post("/warehouses", formData);
        showToast({ type: "success", message: "Tạo kho mới thành công" });
      }
      setModalOpen(false);
      refetch();
    } catch (err: any) {
      showToast({
        type: "error",
        message: err.response?.data?.detail || "Lỗi khi lưu kho hàng",
      });
    }
  };

  const handleDelete = async (wh: Warehouse) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa kho "${wh.name}"?`)) return;
    try {
      const res = await api.delete(`/warehouses/${wh.id}`);
      showToast({ type: "success", message: res.data.message });
      refetch();
    } catch (err: any) {
      showToast({ type: "error", message: err.response?.data?.detail || "Lỗi khi xóa kho" });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản lý kho hàng</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình các kho độc lập, điểm lưu trữ và người phụ trách
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreateModal} icon={<Plus className="w-4 h-4" />}>
          Thêm kho hàng
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-3"><TableSkeleton rows={3} cols={3} /></div>
        ) : data?.items && data.items.length > 0 ? (
          data.items.map((wh) => (
            <div
              key={wh.id}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded">
                    {wh.code}
                  </span>
                  {wh.is_active ? (
                    <Badge variant="success" dot>Hoạt động</Badge>
                  ) : (
                    <Badge variant="neutral" dot>Ngừng hoạt động</Badge>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900">{wh.name}</h3>

                <div className="space-y-2 mt-4 text-xs text-slate-600">
                  {wh.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{wh.address}</span>
                    </div>
                  )}
                  {wh.manager_name && (
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Quản lý: <strong>{wh.manager_name}</strong></span>
                    </div>
                  )}
                  {wh.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Điện thoại: {wh.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEditModal(wh)} icon={<Edit2 className="w-3.5 h-3.5" />}>
                  Sửa
                </Button>
                <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(wh)} icon={<Trash2 className="w-3.5 h-3.5" />}>
                  Xóa
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 py-12 text-center text-xs text-slate-400">
            Chưa có kho hàng nào
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingWh ? "Chỉnh sửa kho hàng" : "Tạo kho hàng mới"}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Mã kho *"
              placeholder="VD: WH-HCM"
              error={errors.code?.message}
              disabled={!!editingWh}
              {...register("code")}
            />
            <Input
              label="Tên kho *"
              placeholder="VD: Kho Tổng TP. HCM"
              error={errors.name?.message}
              {...register("name")}
            />
          </div>

          <Input
            label="Địa chỉ kho"
            placeholder="Số nhà, đường, quận, thành phố..."
            error={errors.address?.message}
            {...register("address")}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Người quản lý"
              placeholder="Nguyễn Văn A"
              error={errors.manager_name?.message}
              {...register("manager_name")}
            />
            <Input
              label="Số điện thoại"
              placeholder="0912345678"
              error={errors.phone?.message}
              {...register("phone")}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Lưu kho hàng
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

