import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import { Category, Product, Unit } from "../../types";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";

const productSchema = z.object({
  sku: z.string().min(1, "Mã SKU là bắt buộc"),
  barcode: z.string().optional(),
  name: z.string().min(1, "Tên sản phẩm là bắt buộc"),
  category_id: z.coerce.number().optional().nullable(),
  unit_id: z.coerce.number().optional().nullable(),
  cost_price: z.coerce.number().min(0, "Giá vốn không được âm"),
  selling_price: z.coerce.number().min(0, "Giá bán không được âm"),
  min_stock_level: z.coerce.number().min(0, "Tồn tối thiểu không được âm"),
  description: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSuccess: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}) => {
  const isEditing = !!product;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  // Load categories and units
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories-all"],
    queryFn: async () => (await api.get("/categories/all")).data,
  });

  const { data: units } = useQuery<Unit[]>({
    queryKey: ["units-all"],
    queryFn: async () => (await api.get("/units")).data,
  });

  useEffect(() => {
    if (product) {
      reset({
        sku: product.sku,
        barcode: product.barcode || "",
        name: product.name,
        category_id: product.category_id || undefined,
        unit_id: product.unit_id || undefined,
        cost_price: Number(product.cost_price),
        selling_price: Number(product.selling_price),
        min_stock_level: Number(product.min_stock_level),
        description: product.description || "",
      });
    } else {
      reset({
        sku: "",
        barcode: "",
        name: "",
        category_id: undefined,
        unit_id: undefined,
        cost_price: 0,
        selling_price: 0,
        min_stock_level: 5,
        description: "",
      });
    }
  }, [product, reset, isOpen]);

  const onSubmit = async (data: ProductFormData) => {
    if (isEditing && product) {
      await api.patch(`/products/${product.id}`, data);
    } else {
      await api.post("/products", data);
    }
    onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Chỉnh sửa sản phẩm" : "Thêm mới sản phẩm"}
      description="Điền thông tin chi tiết sản phẩm, giá vốn và định mức tồn kho tối thiểu"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Mã SKU *"
            placeholder="VD: LOGI-MX3S"
            error={errors.sku?.message}
            disabled={isEditing}
            {...register("sku")}
          />
          <Input
            label="Mã vạch (Barcode)"
            placeholder="VD: 89350012345"
            error={errors.barcode?.message}
            {...register("barcode")}
          />
        </div>

        <Input
          label="Tên sản phẩm *"
          placeholder="VD: Chuột không dây Logitech MX Master 3S"
          error={errors.name?.message}
          {...register("name")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Danh mục hàng hóa"
            placeholder="-- Chọn danh mục --"
            options={categories?.map((c) => ({ value: c.id, label: c.name })) || []}
            error={errors.category_id?.message}
            {...register("category_id")}
          />
          <Select
            label="Đơn vị tính"
            placeholder="-- Chọn đơn vị --"
            options={units?.map((u) => ({ value: u.id, label: `${u.name} (${u.code})` })) || []}
            error={errors.unit_id?.message}
            {...register("unit_id")}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Giá nhập tham khảo (VND)"
            type="number"
            error={errors.cost_price?.message}
            {...register("cost_price")}
          />
          <Input
            label="Giá bán tham khảo (VND)"
            type="number"
            error={errors.selling_price?.message}
            {...register("selling_price")}
          />
          <Input
            label="Định mức tồn tối thiểu"
            type="number"
            error={errors.min_stock_level?.message}
            {...register("min_stock_level")}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Mô tả sản phẩm
          </label>
          <textarea
            rows={3}
            placeholder="Thông số kỹ thuật, quy cách đóng gói..."
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            {...register("description")}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? "Lưu thay đổi" : "Tạo sản phẩm"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

