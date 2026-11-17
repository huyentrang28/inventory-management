import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Download,
  Filter,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { api } from "../../services/api";
import { Category, PaginatedResponse, Product } from "../../types";
import { formatCurrency, formatNumber } from "../../utils/formatters";
import { useUIStore } from "../../stores/uiStore";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { ProductModal } from "./ProductModal";

export const ProductListPage: React.FC = () => {
  const { showToast } = useUIStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Categories for filter
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories-all"],
    queryFn: async () => (await api.get("/categories/all")).data,
  });

  // Query products
  const { data, isLoading, refetch } = useQuery<PaginatedResponse<Product>>({
    queryKey: ["products", page, search, selectedCategory],
    queryFn: async () => {
      const params: any = { page, page_size: 15 };
      if (search) params.search = search;
      if (selectedCategory) params.category_id = selectedCategory;
      return (await api.get("/products", { params })).data;
    },
  });

  const handleDelete = async (prod: Product) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa hoặc ngừng kinh doanh sản phẩm "${prod.name}"?`)) {
      return;
    }
    try {
      const res = await api.delete(`/products/${prod.id}`);
      showToast({ type: "success", message: res.data.message });
      refetch();
    } catch (err: any) {
      showToast({
        type: "error",
        message: err.response?.data?.detail || "Không thể xóa sản phẩm",
      });
    }
  };

  const handleExportExcel = () => {
    window.open("/api/v1/products/export/excel", "_blank");
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Danh mục Sản phẩm</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý mã hàng SKU, giá vốn tham khảo và định mức an toàn
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            icon={<Download className="w-4 h-4" />}
          >
            Xuất Excel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingProduct(null);
              setModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Thêm sản phẩm
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên, SKU, mã vạch..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:bg-white focus:border-indigo-600 focus:outline-none"
          >
            <option value="">Tất cả danh mục</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Tổng cộng: <span className="text-slate-900 font-bold">{data?.total || 0}</span> sản phẩm
        </div>
      </div>

      {/* Products Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Mã SKU</th>
                <th className="py-3 px-4">Tên sản phẩm</th>
                <th className="py-3 px-4">Danh mục</th>
                <th className="py-3 px-4">Đơn vị</th>
                <th className="py-3 px-4 text-right">Giá nhập</th>
                <th className="py-3 px-4 text-right">Giá bán</th>
                <th className="py-3 px-4 text-center">Tồn tối thiểu</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-6">
                    <TableSkeleton rows={5} cols={9} />
                  </td>
                </tr>
              ) : data?.items && data.items.length > 0 ? (
                data.items.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-600">
                      <Link to={`/products/${prod.id}`} className="hover:underline">
                        {prod.sku}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <Link to={`/products/${prod.id}`} className="hover:text-indigo-600">
                        {prod.name}
                      </Link>
                      {prod.barcode && (
                        <p className="text-[10px] text-slate-400 font-mono">Barcode: {prod.barcode}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {prod.category?.name || <span className="text-slate-400">-</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {prod.unit?.name || <span className="text-slate-400">-</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      {formatCurrency(prod.cost_price)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-indigo-700">
                      {formatCurrency(prod.selling_price)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">
                      {formatNumber(prod.min_stock_level)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {prod.is_active ? (
                        <Badge variant="success" dot>Đang kinh doanh</Badge>
                      ) : (
                        <Badge variant="neutral" dot>Ngừng kinh doanh</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          to={`/products/${prod.id}`}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                          title="Xem chi tiết & tồn kho"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setEditingProduct(prod);
                            setModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(prod)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Xóa / Ngưng kinh doanh"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-400">
                    Không tìm thấy sản phẩm nào phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs">
            <span className="text-slate-500">
              Trang <span className="font-semibold text-slate-800">{page}</span> /{" "}
              {data.total_pages}
            </span>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.total_pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Tiếp theo
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Product Add/Edit Modal */}
      <ProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        product={editingProduct}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

