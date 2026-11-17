import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit2, UserCheck, Shield, Phone, Mail } from "lucide-react";
import { api } from "../../services/api";
import { PaginatedResponse, Role, User } from "../../types";
import { formatDateTime } from "../../utils/formatters";
import { useUIStore } from "../../stores/uiStore";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { TableSkeleton } from "../../components/ui/Skeleton";

const userSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  full_name: z.string().min(1, "Họ và tên là bắt buộc"),
  phone: z.string().optional(),
  password: z.string().optional(),
  role_ids: z.array(z.number()).min(1, "Vui lòng chọn ít nhất 1 vai trò"),
});

type UserFormData = z.infer<typeof userSchema>;

export const UserManagementPage: React.FC = () => {
  const { showToast } = useUIStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data: roles } = useQuery<Role[]>({
    queryKey: ["roles-all"],
    queryFn: async () => (await api.get("/users/roles/all")).data,
  });

  const { data, isLoading, refetch } = useQuery<PaginatedResponse<User>>({
    queryKey: ["users-list"],
    queryFn: async () => (await api.get("/users")).data,
  });

  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone: "",
    password: "",
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ email: "", full_name: "", phone: "", password: "" });
    setSelectedRoleIds([]);
    setModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name,
      phone: user.phone || "",
      password: "",
    });
    setSelectedRoleIds(user.roles?.map((r) => r.id) || []);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email) {
      showToast({ type: "error", message: "Vui lòng điền đầy đủ email và họ tên" });
      return;
    }
    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      showToast({ type: "error", message: "Mật khẩu tối thiểu 6 ký tự" });
      return;
    }

    try {
      if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, {
          full_name: formData.full_name,
          phone: formData.phone,
          password: formData.password || undefined,
          role_ids: selectedRoleIds,
        });
        showToast({ type: "success", message: "Cập nhật người dùng thành công" });
      } else {
        await api.post("/users", {
          ...formData,
          role_ids: selectedRoleIds,
        });
        showToast({ type: "success", message: "Tạo người dùng mới thành công" });
      }
      setModalOpen(false);
      refetch();
    } catch (err: any) {
      showToast({ type: "error", message: err.response?.data?.detail || "Lỗi khi lưu người dùng" });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản lý Tài khoản & Người dùng</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị viên, nhân viên kho, bán hàng và gán vai trò quyền hạn
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreateModal} icon={<Plus className="w-4 h-4" />}>
          Thêm người dùng
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Họ và tên</th>
              <th className="py-3 px-4">Email đăng nhập</th>
              <th className="py-3 px-4">Số điện thoại</th>
              <th className="py-3 px-4">Vai trò</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
              <th className="py-3 px-4">Đăng nhập gần nhất</th>
              <th className="py-3 px-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={7} className="p-6"><TableSkeleton rows={4} cols={7} /></td></tr>
            ) : data?.items && data.items.length > 0 ? (
              data.items.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-slate-900">{u.full_name}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono">{u.email}</td>
                  <td className="py-3 px-4 text-slate-600">{u.phone || "-"}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {u.is_superuser && <Badge variant="purple">SuperAdmin</Badge>}
                      {u.roles?.map((r) => (
                        <Badge key={r.id} variant="info">{r.name}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {u.is_active ? <Badge variant="success" dot>Hoạt động</Badge> : <Badge variant="danger" dot>Khóa</Badge>}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{formatDateTime(u.last_login_at)}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => openEditModal(u)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="py-8 text-center text-slate-400">Không có người dùng nào</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email *"
            type="email"
            value={formData.email}
            disabled={!!editingUser}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="user@stockmanager.local"
          />
          <Input
            label="Họ và tên *"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="Nguyễn Văn A"
          />
          <Input
            label="Số điện thoại"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="0912345678"
          />
          <Input
            label={editingUser ? "Mật khẩu mới (bỏ trống nếu không đổi)" : "Mật khẩu *"}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
              Gán vai trò (Roles)
            </label>
            <div className="space-y-2">
              {roles?.map((r) => (
                <label key={r.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(r.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRoleIds([...selectedRoleIds, r.id]);
                      } else {
                        setSelectedRoleIds(selectedRoleIds.filter((id) => id !== r.id));
                      }
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    <strong>{r.name}</strong> - <span className="text-slate-500">{r.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary">
              Lưu người dùng
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

