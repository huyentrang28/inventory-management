import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit2, Trash2, Layers, Search } from "lucide-react";
import { api } from "../../services/api";
import { Category, PaginatedResponse } from "../../types";
import { useUIStore } from "../../stores/uiStore";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { TableSkeleton } from "../../components/ui/Skeleton";

const categorySchema = z.object({
  code: z.string().min(1, "Mã danh mục là bắt buộc"),
  name: z.string().min(1, "Tên danh mục là bắt buộc"),
  description: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export const CategoryPage: React.FC = () => {
  const { showToast } = useUIStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [search, setSearch] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  const { data, isLoading, refetch } = useQuery<PaginatedResponse<Category>>({
    queryKey: ["categories", search],
    queryFn: async () => {
      const params = search ? { search } : {};
      return (await api.get("/categories", { params })).data;
    },
  });

  const openCreateModal = () => {
    setEditingCategory(null);
    reset({ code: "", name: "", description: "" });
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    reset({ code: cat.code, name: cat.name, description: cat.description || "" });
    setModalOpen(true);
  };

  const onSubmit = async (formData: CategoryFormData) => {
    try {
      if (editingCategory) {
        await api.patch(`/categories/${editingCategory.id}`, formData);
        showToast({ type: "success", message: "Cập nhật danh mục thành công" });
      } else {
        await api.post("/categories", formData);
        showToast({ type: "success", message: "Tạo danh mục mới thành công" });
      }
      setModalOpen(false);
      refetch();
    } catch (err: any) {
      showToast({
        type: "error",
        message: err.response?.data?.detail || "Đã xảy ra lỗi khi lưu danh mục",
      });
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Bạn có chắc muốn xóa hoặc ngưng danh mục "${cat.name}"?`)) return;
    try {
      const res = await api.delete(`/categories/${cat.id}`);
      showToast({ type: "success", message: res.data.message });
      refetch();
    } catch (err: any) {
      showToast({ type: "error", message: err.response?.data?.detail || "Lỗi khi xóa" });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Danh mục sản phẩm</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân loại hàng hóa theo nhóm ngành để tối ưu báo cáo và tìm kiếm
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreateModal} icon={<Plus className="w-4 h-4" />}>
          Thêm danh mục
        </Button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã hoặc tên danh mục..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-indigo-600"
          />
        </div>
        <span className="text-xs text-slate-500">
          Tổng số: <strong className="text-slate-800">{data?.total || 0}</strong> nhóm
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Mã danh mục</th>
              <th className="py-3 px-4">Tên danh mục</th>
              <th className="py-3 px-4">Mô tả</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
              <th className="py-3 px-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={5} className="p-6"><TableSkeleton rows={4} cols={5} /></td></tr>
            ) : data?.items && data.items.length > 0 ? (
              data.items.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{cat.code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{cat.name}</td>
                  <td className="py-3 px-4 text-slate-600">{cat.description || "-"}</td>
                  <td className="py-3 px-4 text-center">
                    {cat.is_active ? (
                      <Badge variant="success" dot>Hoạt động</Badge>
                    ) : (
                      <Badge variant="neutral" dot>Ngừng hoạt động</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400">Không có danh mục nào</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Mã danh mục *"
            placeholder="VD: CAT-ELEC"
            error={errors.code?.message}
            disabled={!!editingCategory}
            {...register("code")}
          />
          <Input
            label="Tên danh mục *"
            placeholder="VD: Thiết bị điện tử"
            error={errors.name?.message}
            {...register("name")}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Mô tả
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              {...register("description")}
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Lưu danh mục
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

