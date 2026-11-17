import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Settings, Building, ShieldCheck, KeyRound, Save, CheckCircle } from 'lucide-react';
import { systemSettingService, authService } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { showToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<'company' | 'system' | 'security'>('company');

  // Change password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // System settings query
  const { data: settings = [] } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await systemSettingService.getAll();
      return res.data;
    },
  });

  // Local settings state
  const [formData, setFormData] = useState<Record<string, string>>({
    company_name: 'CÔNG TY TNHH QUẢN LÝ KHO DOANH NGHIỆP',
    tax_code: '0101234567',
    address: 'Tầng 12, Tòa nhà TechnoPark, Gia Lâm, Hà Nội',
    phone: '024 3999 8888',
    email: 'contact@stockmanager.local',
    currency: 'VND',
    valuation_method: 'WEIGHTED_AVERAGE',
    low_stock_threshold: '10',
  });

  // Sync loaded settings
  React.useEffect(() => {
    if (settings.length > 0) {
      const map: Record<string, string> = {};
      for (const s of settings) {
        map[s.key] = s.value;
      }
      setFormData((prev) => ({ ...prev, ...map }));
    }
  }, [settings]);

  // Save system settings mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      for (const [key, value] of Object.entries(data)) {
        await systemSettingService.update(key, { value, description: '' });
      }
    },
    onSuccess: () => {
      showToast({ type: 'success', message: 'Cập nhật cấu hình hệ thống thành công!' });
    },
    onError: () => {
      showToast({ type: 'error', message: 'Không thể lưu cấu hình, vui lòng thử lại.' });
    },
  });

  // Change password mutation
  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error('Mật khẩu mới không trùng khớp');
      }
      if (newPassword.length < 8) {
        throw new Error('Mật khẩu mới phải có tối thiểu 8 ký tự');
      }
      await authService.changePassword(oldPassword, newPassword);
    },
    onSuccess: () => {
      showToast({ type: 'success', message: 'Đổi mật khẩu thành công!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: any) => {
      showToast({
        type: 'error',
        message: err.response?.data?.detail || err.message || 'Lỗi khi đổi mật khẩu',
      });
    },
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    passwordMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cài đặt hệ thống</h1>
        <p className="text-sm text-slate-500 mt-1">
          Quản lý thông số doanh nghiệp, chính sách tính giá hàng tồn và bảo mật tài khoản
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('company')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'company'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          Thông tin doanh nghiệp
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'system'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          Tham số kho & Kế toán
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'security'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          Bảo mật & Mật khẩu
        </button>
      </div>

      {/* Tab 1: Company Profile */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Thông tin đại diện doanh nghiệp</h2>
            <p className="text-xs text-slate-500">Thông tin này xuất hiện trên tiêu đề các phiếu Nhập/Xuất/Chuyển kho và Báo cáo</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Tên doanh nghiệp"
                value={formData.company_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, company_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Input
                label="Mã số thuế"
                value={formData.tax_code}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, tax_code: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Số điện thoại liên hệ"
                value={formData.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Địa chỉ trụ sở chính"
                value={formData.address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Email liên hệ"
                type="email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Đơn vị tiền tệ chính"
                value={formData.currency}
                disabled
                helperText="Được gán mặc định là VND theo quy chuẩn kế toán Việt Nam"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              type="submit"
              icon={<Save className="w-4 h-4" />}
              isLoading={saveMutation.isPending}
            >
              Lưu thông tin doanh nghiệp
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: System Settings */}
      {activeTab === 'system' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Quy tắc nghiệp vụ tồn kho</h2>
            <p className="text-xs text-slate-500">Thiết lập thuật toán định giá và quy tắc kiểm soát tồn kho</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phương pháp định giá hàng tồn kho
              </label>
              <select
                value={formData.valuation_method}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, valuation_method: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="WEIGHTED_AVERAGE">Bình quân gia quyền liên hoàn (Weighted Average Cost - Khuyên dùng)</option>
                <option value="FIFO">Nhập trước xuất trước (FIFO)</option>
                <option value="LIFO" disabled>Nhập sau xuất trước (LIFO - Đã dừng theo Chuẩn mực Kế toán VN)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Giá vốn bình quân được cập nhật tự động ngay khi phiếu Nhập kho chuyển sang trạng thái Hoàn thành.
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-sm text-slate-900">Cho phép tồn kho âm (Negative Stock)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                  VÔ HIỆU HÓA (KHÓA CỨNG)
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-2">
                Hệ thống áp dụng khóa hàng cơ sở dữ liệu (`SELECT FOR UPDATE`) ở tầng giao dịch. Mọi thao tác xuất kho vượt số lượng tồn thực tế đều bị chặn ngay lập tức để bảo toàn tính toàn vẹn dữ liệu.
              </p>
            </div>

            <div>
              <Input
                label="Ngưỡng cảnh báo tồn kho tối thiểu mặc định"
                type="number"
                value={formData.low_stock_threshold}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                helperText="Hệ thống sẽ gửi cảnh báo trên Dashboard khi tồn khả dụng của sản phẩm thấp hơn giá trị này"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              type="submit"
              icon={<Save className="w-4 h-4" />}
              isLoading={saveMutation.isPending}
            >
              Lưu tham số hệ thống
            </Button>
          </div>
        </form>
      )}

      {/* Tab 3: Security & Password */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* User profile */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Thông tin phiên đăng nhập
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Họ và tên:</span>
                <span className="font-semibold text-slate-800">{user?.full_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Email:</span>
                <span className="font-semibold text-slate-800">{user?.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Vai trò:</span>
                <span className="font-semibold text-indigo-600">
                  {user?.roles?.map((r) => r.name).join(', ') || 'Super Admin'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                  <CheckCircle className="w-3.5 h-3.5" /> Hoạt động bình thường
                </span>
              </div>
            </div>
          </div>

          {/* Change password form */}
          <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Đổi mật khẩu tài khoản
            </h2>

            <Input
              label="Mật khẩu hiện tại"
              type="password"
              value={oldPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOldPassword(e.target.value)}
              required
            />

            <Input
              label="Mật khẩu mới"
              type="password"
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
              helperText="Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số"
              required
            />

            <Input
              label="Xác nhận mật khẩu mới"
              type="password"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={passwordMutation.isPending}
              >
                Cập nhật mật khẩu mới
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
