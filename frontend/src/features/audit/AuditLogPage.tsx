import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Search, Eye, RefreshCw } from 'lucide-react';
import { auditLogService } from '../../services/api';
import { AuditLog } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { formatDateTime } from '../../utils/formatters';

export const AuditLogPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['audit-logs', page, actionFilter, entityFilter, search],
    queryFn: async () => {
      const res = await auditLogService.getAll({
        page,
        size: 20,
        action: actionFilter || undefined,
        entity_name: entityFilter || undefined,
        search: search || undefined,
      });
      return res.data;
    },
  });

  const logs: AuditLog[] = data?.items || [];
  const total = data?.total || 0;
  const pages = data?.total_pages || 1;

  const getActionBadge = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'CREATE':
        return <Badge variant="success">CREATE</Badge>;
      case 'UPDATE':
        return <Badge variant="warning">UPDATE</Badge>;
      case 'DELETE':
        return <Badge variant="danger">DELETE</Badge>;
      case 'APPROVE':
        return <Badge variant="indigo">APPROVE</Badge>;
      case 'REJECT':
        return <Badge variant="danger">REJECT</Badge>;
      case 'LOGIN':
        return <Badge variant="info">LOGIN</Badge>;
      case 'LOGOUT':
        return <Badge variant="neutral">LOGOUT</Badge>;
      default:
        return <Badge variant="neutral">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nhật ký hoạt động (Audit Trail)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Ghi vết bất biến toàn bộ hành động người dùng, lịch sử truy cập và thay đổi trạng thái dữ liệu
          </p>
        </div>
        <Button
          variant="secondary"
          icon={<RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />}
          onClick={() => refetch()}
        >
          Làm mới
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo ID, mô tả..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Tất cả hành động --</option>
            <option value="CREATE">CREATE (Tạo mới)</option>
            <option value="UPDATE">UPDATE (Cập nhật)</option>
            <option value="DELETE">DELETE (Xoá)</option>
            <option value="APPROVE">APPROVE (Duyệt)</option>
            <option value="REJECT">REJECT (Từ chối)</option>
            <option value="LOGIN">LOGIN (Đăng nhập)</option>
            <option value="LOGOUT">LOGOUT (Đăng xuất)</option>
          </select>
        </div>

        <div>
          <select
            value={entityFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Tất cả đối tượng --</option>
            <option value="receipt">Phiếu nhập kho (Receipt)</option>
            <option value="issue">Phiếu xuất kho (Issue)</option>
            <option value="transfer">Phiếu chuyển kho (Transfer)</option>
            <option value="stock_count">Phiếu kiểm kê (Stock Count)</option>
            <option value="product">Sản phẩm (Product)</option>
            <option value="user">Người dùng (User)</option>
            <option value="auth">Xác thực (Auth)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <SkeletonTable rows={10} cols={7} />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <History className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-700">Không tìm thấy bản ghi nhật ký nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Tài khoản</th>
                  <th className="py-3 px-4">Hành động</th>
                  <th className="py-3 px-4">Đối tượng</th>
                  <th className="py-3 px-4">Entity ID</th>
                  <th className="py-3 px-4">Địa chỉ IP</th>
                  <th className="py-3 px-4 text-center">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log: AuditLog) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{log.user?.email || log.user_email || 'Hệ thống'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {log.user_id ? String(log.user_id) : 'System'}
                      </div>
                    </td>
                    <td className="py-3 px-4">{getActionBadge(log.action)}</td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-indigo-600">
                      {log.entity_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {log.entity_id ? log.entity_id.slice(0, 12) + '...' : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {log.ip_address || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600">
            <div>
              Tổng số <span className="font-semibold text-slate-900">{total}</span> bản ghi
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <span className="px-3 py-1 text-xs font-medium bg-slate-100 rounded-md flex items-center">
                Trang {page} / {pages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Chi tiết vết kiểm toán (Audit Trail)"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500">Thời gian:</span>{' '}
                <span className="font-semibold">{formatDateTime(selectedLog.created_at)}</span>
              </div>
              <div>
                <span className="text-slate-500">Người thực hiện:</span>{' '}
                <span className="font-semibold">{selectedLog.user?.email || selectedLog.user_email || 'Hệ thống'}</span>
              </div>
              <div>
                <span className="text-slate-500">Hành động:</span> {getActionBadge(selectedLog.action)}
              </div>
              <div>
                <span className="text-slate-500">Đối tượng:</span>{' '}
                <span className="font-mono font-semibold">{selectedLog.entity_name}</span>
              </div>
              <div>
                <span className="text-slate-500">Entity ID:</span>{' '}
                <span className="font-mono">{selectedLog.entity_id || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">IP Address:</span>{' '}
                <span className="font-mono">{selectedLog.ip_address || '-'}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase mb-1">Dữ liệu trước thay đổi (Old Values)</h4>
              <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-xs overflow-x-auto font-mono max-h-48">
                {selectedLog.old_values ? JSON.stringify(selectedLog.old_values, null, 2) : 'null'}
              </pre>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase mb-1">Dữ liệu sau thay đổi (New Values)</h4>
              <pre className="bg-slate-900 text-indigo-300 p-3 rounded-lg text-xs overflow-x-auto font-mono max-h-48">
                {selectedLog.new_values ? JSON.stringify(selectedLog.new_values, null, 2) : 'null'}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogPage;
