import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Coins,
  Edit3,
  History,
  Layout,
  MessageSquare,
  Save,
  Settings,
  ShieldAlert,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import { mockAdmin } from '../../data/mockData';
import { tokenConfigService } from '../../services/tokenConfig.service';

const featureMeta: Record<string, { icon: React.ReactNode; label: string; description: string; color: string }> = {
  slide: {
    icon: <Layout className="w-5 h-5" />,
    label: 'Gen Slide',
    description: 'Tạo bài giảng Slide tự động từ nội dung bài học bằng AI.',
    color: 'blue',
  },
  mindmap: {
    icon: <Zap className="w-5 h-5" />,
    label: 'Gen Mindmap',
    description: 'Tạo bản đồ tư duy trực quan từ từ khóa hoặc đoạn văn bản.',
    color: 'orange',
  },
  chat: {
    icon: <MessageSquare className="w-5 h-5" />,
    label: 'AI Chat',
    description: 'Trò chuyện và giải đáp thắc mắc trực tiếp với trợ lý ảo.',
    color: 'green',
  },
};

const TokenConfigPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  const [showHistory, setShowHistory] = useState(false);

  const {
    data: configs,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin', 'token-config'],
    queryFn: () => tokenConfigService.getAllConfigs(),
  });

  const {
    data: historyLogs,
    isLoading: isHistoryLoading,
  } = useQuery({
    queryKey: ['admin', 'token-config-history'],
    queryFn: () => tokenConfigService.getHistory(),
    enabled: showHistory,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, costPerUse, isActive }: { id: string; costPerUse?: number; isActive?: boolean }) =>
      tokenConfigService.updateConfig(id, { costPerUse, isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'token-config'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'token-config-history'] });
      showToast({ type: 'success', message: 'Cập nhật hệ thống thành công!' });
      setEditingId(null);
    },
    onError: (err: any) => {
      showToast({ type: 'error', message: `Lỗi: ${err.message || 'Không thể cập nhật'}` });
    },
  });

  const handleSaveCost = (id: string) => {
    const cost = editValues[id];
    if (cost === undefined) {
      setEditingId(null);
      return;
    }
    if (cost < 0 || cost > 1000) {
      showToast({ type: 'error', message: 'Hạn mức token không hợp lệ (0-1000)' });
      return;
    }
    updateMutation.mutate({ id, costPerUse: cost });
  };

  if (isLoading) {
    return (
      <DashboardLayout role="admin" user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}>
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
          <div className="text-[#87867F] font-[Be_Vietnam_Pro] text-[14px]">Đang tải cấu hình...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !configs) {
    return (
      <DashboardLayout role="admin" user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}>
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="text-red-500 font-[Be_Vietnam_Pro] text-[16px] font-medium text-center">
            Không thể kết nối với máy chủ.<br />
            <span className="text-[13px] font-normal opacity-70">Vui lòng kiểm tra lại kết nối Database.</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-10 max-w-7xl mx-auto space-y-10">
        {/* Page Title Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E8E6DC]">
          <div className="space-y-2">
            <div className="inline-flex items-center px-3 py-1 bg-orange-50 text-orange-600 rounded-full gap-2 text-[12px] font-bold tracking-tight uppercase">
              <Activity className="w-3.5 h-3.5" />
              Quản trị hệ thống
            </div>
            <h1 className="font-[Playfair_Display] text-[32px] font-bold text-[#141413]">
              Cấu hình Chi phí Token
            </h1>
            <p className="font-[Be_Vietnam_Pro] text-[15px] text-[#87867F] max-w-2xl">
              Điều chỉnh số lượng token tiêu tốn cho mỗi lần sử dụng các tính năng AI. 
              Các thay đổi sẽ có hiệu lực ngay lập tức cho toàn bộ người dùng trên hệ thống.
            </p>
          </div>
          
          <button 
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E8E6DC] rounded-xl font-[Be_Vietnam_Pro] text-[14px] font-medium text-[#5E5D59] hover:bg-[#FAF9F6] transition-all shadow-sm"
          >
            <History className="w-4 h-4" />
            Xem lịch sử thay đổi
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {configs.map((config) => {
            const meta = featureMeta[config.featureKey] || {
              icon: <Settings />,
              description: 'Tính năng hệ thống đang hoạt động.',
              color: 'gray'
            };
            const isEditing = editingId === config.id;

            return (
              <div
                key={config.id}
                className={`relative bg-white rounded-3xl border-2 transition-all duration-300 overflow-hidden ${
                  isEditing ? 'border-orange-400 shadow-xl scale-[1.02] z-10' : 'border-[#E8E6DC] hover:border-orange-200 hover:shadow-lg'
                }`}
              >
                {/* Status Header */}
                <div className={`px-6 py-4 flex items-center justify-between border-b ${
                  config.isActive ? 'bg-green-50/50 border-green-100' : 'bg-gray-50/50 border-gray-100'
                }`}>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${config.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                      <span className={`text-[11px] font-bold uppercase tracking-widest ${config.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                        {config.isActive ? 'Đang hoạt động' : 'Tạm ngắt trừ token'}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#87867F] mt-0.5">
                      {config.isActive ? 'Token sẽ bị trừ khi sử dụng' : 'Tính năng sẽ miễn phí tạm thời'}
                    </span>
                  </div>
                  
                  {/* Status Toggle */}
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={() => updateMutation.mutate({ id: config.id, isActive: !config.isActive })}
                      disabled={updateMutation.isPending}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                        config.isActive ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                      title={config.isActive ? "Nhấn để tạm ngắt trừ token" : "Nhấn để kích hoạt trừ token"}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        config.isActive ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  {/* Icon & Label */}
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-inner ${
                      config.featureKey === 'slide' ? 'bg-blue-500' :
                      config.featureKey === 'mindmap' ? 'bg-orange-500' : 'bg-green-500'
                    }`}>
                      {meta.icon}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-[Be_Vietnam_Pro] text-[18px] font-bold text-[#141413]">
                        {config.featureLabel}
                      </h3>
                      <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] leading-relaxed line-clamp-2">
                        {meta.description}
                      </p>
                    </div>
                  </div>

                  {/* Cost Display/Edit Area */}
                  <div className={`rounded-2xl p-6 transition-colors ${isEditing ? 'bg-orange-50' : 'bg-[#FAF9F6]'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-[#87867F]">Chi phí mỗi lần sử dụng</span>
                      {!isEditing && (
                        <button 
                          onClick={() => {
                            setEditingId(config.id);
                            setEditValues(prev => ({ ...prev, [config.id]: config.costPerUse }));
                          }}
                          className="text-orange-600 hover:text-orange-700 p-1 rounded-md hover:bg-orange-100 transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="mt-2 flex items-baseline gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-3 w-full mt-1">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              autoFocus
                              value={editValues[config.id] ?? config.costPerUse}
                              onChange={(e) => setEditValues(prev => ({ ...prev, [config.id]: parseInt(e.target.value) || 0 }))}
                              className="w-full bg-white border-2 border-orange-200 rounded-xl px-4 py-2.5 font-[Be_Vietnam_Pro] text-[24px] font-bold text-[#141413] outline-none focus:border-orange-500 transition-all"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-[#87867F] font-medium">tokens</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleSaveCost(config.id)}
                              disabled={updateMutation.isPending}
                              className="p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all shadow-md"
                            >
                              <Save className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-2 bg-white text-[#87867F] border border-[#E8E6DC] rounded-lg hover:bg-gray-50 transition-all"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="text-[32px] font-bold text-[#141413]">{config.costPerUse}</span>
                          <span className="text-[14px] font-medium text-[#87867F]">tokens / lượt dùng</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Metadata Footer */}
                  <div className="flex items-center justify-between text-[12px] text-[#A8A7A0] pt-2">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Cập nhật: {new Date(config.updatedAt).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="font-medium text-[#87867F]">
                      ID: <span className="font-mono">{config.featureKey}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Info Box */}
        <div className="bg-[#141413] rounded-[32px] p-8 md:p-10 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-[20px] font-bold">Lưu ý bảo mật & Hệ thống</h2>
              </div>
              <p className="text-gray-400 text-[14px] max-w-xl leading-relaxed">
                Tất cả các thay đổi về chi phí sẽ được ghi lại trong nhật ký hệ thống kèm theo định danh của Admin thực hiện. 
                Hãy đảm bảo bạn đã thông báo cho bộ phận CSKH trước khi có sự thay đổi lớn về giá để tránh gây hiểu lầm cho người dùng.
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-4 min-w-[200px]">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-[13px] font-medium">DB Connection: Healthy</span>
              </div>
              <div className="text-[11px] text-gray-500 uppercase tracking-tighter">Server Time: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>
          
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
        </div>

        {/* History Modal */}
        {showHistory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
            <div className="relative bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="px-8 py-6 border-b border-[#E8E6DC] flex items-center justify-between bg-[#FAF9F6]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                    <History className="w-5 h-5" />
                  </div>
                  <h3 className="text-[20px] font-bold text-[#141413]">Nhật ký thay đổi</h3>
                </div>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X className="w-6 h-6 text-[#87867F]" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-8">
                {isHistoryLoading ? (
                  <div className="flex flex-col items-center py-10 gap-3">
                    <div className="w-8 h-8 border-3 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
                    <p className="text-[13px] text-[#87867F]">Đang tải dữ liệu...</p>
                  </div>
                ) : historyLogs && historyLogs.length > 0 ? (
                  <div className="space-y-8">
                    {historyLogs.map((log, idx) => {
                      const meta = featureMeta[log.featureKey];
                      const isStatusChange = log.changeType === 'STATUS_TOGGLE' || log.changeType === 'STATUS_UPDATE';
                      
                      // Format values for human readability
                      const formatValue = (val: string) => {
                        if (val === 'true') return (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-green-600 font-bold text-[13px] tracking-tight">Hoạt động</span>
                          </div>
                        );
                        if (val === 'false') return (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            <span className="text-gray-400 font-bold text-[13px] tracking-tight">Tạm ngắt</span>
                          </div>
                        );
                        return <span className="font-bold text-[15px]">{val} <span className="text-[11px] font-normal text-[#87867F]">tokens</span></span>;
                      };

                      return (
                        <div key={log.id} className="relative pl-10 group">
                          {/* Timeline Line */}
                          {idx !== historyLogs.length - 1 && (
                            <div className="absolute left-[15px] top-10 bottom-0 w-0.5 bg-gradient-to-b from-[#E8E6DC] to-transparent" />
                          )}
                          
                          {/* Timeline Dot with Icon */}
                          <div className={`absolute left-0 top-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-sm z-10 transition-transform group-hover:scale-110 ${
                            isStatusChange ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                          }`}>
                            {isStatusChange ? <Activity className="w-4 h-4" /> : <Coins className="w-4 h-4" />}
                          </div>

                          <div className="bg-white border border-[#E8E6DC] rounded-2xl p-5 hover:border-orange-200 hover:shadow-md transition-all duration-300">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-[#141413] text-[15px]">
                                  {meta?.label || log.featureKey}
                                </h4>
                                <span className="text-[#87867F]">•</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  isStatusChange ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                                }`}>
                                  {isStatusChange ? 'Thay đổi trạng thái' : 'Điều chỉnh chi phí'}
                                </span>
                              </div>
                              <time className="text-[12px] text-[#87867F] font-medium bg-[#FAF9F6] px-2 py-1 rounded-lg">
                                {new Date(log.createdAt).toLocaleString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </time>
                            </div>
                            
                            <div className={`flex items-center gap-4 py-4 px-6 rounded-2xl border ${
                              isStatusChange ? 'bg-blue-50/30 border-blue-100' : 'bg-orange-50/30 border-orange-100'
                            }`}>
                              <div className="flex-1 flex items-center justify-center gap-6">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-[9px] uppercase font-bold text-[#A8A7A0]">Trước</span>
                                  {formatValue(log.oldValue)}
                                </div>
                                <div className="flex flex-col items-center justify-center pt-3">
                                  <div className="h-0.5 w-16 bg-[#E8E6DC] relative">
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-[#E8E6DC]" />
                                  </div>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-[9px] uppercase font-bold text-[#A8A7A0]">Sau</span>
                                  {formatValue(log.newValue)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4 flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-2 text-[#87867F]">
                                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold">
                                  {log.adminName ? log.adminName.charAt(0) : 'A'}
                                </div>
                                <span>Thực hiện bởi: <span className="font-medium text-[#5E5D59]">{log.adminName || 'Quản trị viên'}</span></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 space-y-2">
                    <History className="w-12 h-12 text-gray-200 mx-auto" />
                    <p className="text-[#87867F] text-[14px]">Chưa có lịch sử thay đổi nào được ghi lại.</p>
                  </div>
                )}
              </div>

              <div className="px-8 py-6 bg-[#FAF9F6] border-t border-[#E8E6DC] flex justify-end">
                <button 
                  onClick={() => setShowHistory(false)}
                  className="px-6 py-2.5 bg-[#141413] text-white rounded-xl font-bold text-[14px] hover:bg-black transition-all"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TokenConfigPage;
