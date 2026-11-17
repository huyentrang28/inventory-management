import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Check, Lock, Info } from 'lucide-react';
import { roleService } from '../../services/api';
import { Role, Permission } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { SkeletonTable } from '../../components/ui/Skeleton';

export const RoleManagementPage: React.FC = () => {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  const { data: roles = [], isLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await roleService.getAll();
      return res.data;
    },
  });

  const selectedRole = roles.find((r: Role) => r.id === selectedRoleId) || roles[0];

  // Group permissions by module
  const groupedPermissions = React.useMemo(() => {
    if (!selectedRole || !selectedRole.permissions) return {};
    const groups: Record<string, Permission[]> = {};
    for (const p of selectedRole.permissions) {
      const parts = p.code.split(':');
      const moduleName = parts[0] ? parts[0].toUpperCase() : 'KHÁC';
      if (!groups[moduleName]) groups[moduleName] = [];
      groups[moduleName].push(p);
    }
    return groups;
  }, [selectedRole]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Vai trò & Phân quyền</h1>
        <p className="text-sm text-slate-500 mt-1">
          Hệ thống kiểm soát truy cập theo vai trò (Role-Based Access Control - RBAC) bảo mật chuẩn doanh nghiệp
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 text-sm text-blue-900">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Bảo mật hệ thống:</span> Các vai trò mặc định (Super Admin, Quản lý kho, Nhân viên kho, Nhân viên mua hàng, Nhân viên kinh doanh, Kiểm toán viên) được gán các đặc quyền cố định tuân thủ quy tắc ma trận phân quyền tối thiểu (Least Privilege).
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} columns={4} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Roles list */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
            <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              Danh sách vai trò ({roles.length})
            </div>
            <div className="divide-y divide-slate-100">
              {roles.map((role: Role) => {
                const isSelected = selectedRole?.id === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`w-full text-left p-4 transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50/70 border-l-4 border-indigo-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{role.name}</span>
                        {role.code === 'SUPER_ADMIN' && (
                          <Badge variant="indigo" size="sm">Toàn quyền</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{role.description || role.code}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {role.permissions?.length || 0} quyền
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Permissions detail */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            {selectedRole ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-indigo-600" />
                      Quyền hạn của vai trò: {selectedRole.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 font-mono">Mã vai trò: {selectedRole.code}</p>
                  </div>
                  <Badge variant="success">Kích hoạt</Badge>
                </div>

                <div className="space-y-6">
                  {Object.keys(groupedPermissions).length === 0 ? (
                    <p className="text-sm text-slate-500 italic">Chưa có quyền hạn nào được gán cho vai trò này.</p>
                  ) : (
                    Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                      <div key={moduleName} className="border border-slate-200 rounded-lg p-4">
                        <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">
                          Phân hệ {moduleName}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {perms.map((p: Permission) => (
                            <div
                              key={p.id}
                              className="flex items-center gap-2.5 text-xs bg-slate-50 border border-slate-200/60 rounded-md p-2"
                            >
                              <div className="w-4 h-4 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800">{p.name}</p>
                                <p className="text-[11px] text-slate-400 font-mono">{p.code}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400">Chọn vai trò để xem chi tiết phân quyền</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagementPage;
