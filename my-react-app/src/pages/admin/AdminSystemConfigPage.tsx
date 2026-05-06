import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Plus,
  RotateCcw,
  Save,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import { mockAdmin } from '../../data/mockData';
import {
  SystemConfigService,
  type PrivacyPolicyContent,
  type PrivacyPolicySection,
} from '../../services/api/systemConfig.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

const emptySection = (): PrivacyPolicySection => ({
  title: '',
  paragraphs: [],
  bulletPoints: [],
});

const deepClone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

// ── Edit history ──────────────────────────────────────────────────────────────

interface EditHistoryEntry {
  editor: string;
  timestamp: string; // ISO
  label: string; // formatted display string
  snapshot?: PrivacyPolicyContent; // undefined for legacy entries
}

const HISTORY_KEY = 'mathmaster_config_edit_history';

const formatViDatetime = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}, ngày ${pad(d.getDate())} tháng ${pad(d.getMonth() + 1)} năm ${d.getFullYear()}`;
};

const formatViDate = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `ngày ${pad(d.getDate())} tháng ${pad(d.getMonth() + 1)} năm ${d.getFullYear()}`;
};

const computeSectionChanges = (
  os: PrivacyPolicySection[],
  ns: PrivacyPolicySection[]
): string[] => {
  const changes: string[] = [];
  if (os.length !== ns.length) changes.push(`Số phần nội dung: ${os.length} → ${ns.length}`);
  const maxLen = Math.max(os.length, ns.length);
  for (let i = 0; i < maxLen; i++) {
    const o = os[i];
    const n = ns[i];
    if (!o) {
      changes.push(`Phần ${i + 1}: "${n.title}" được thêm mới`);
      continue;
    }
    if (!n) {
      changes.push(`Phần ${i + 1}: "${o.title}" đã bị xoá`);
      continue;
    }
    if (o.title !== n.title) changes.push(`Phần ${i + 1}: tiêu đề "${o.title}" → "${n.title}"`);
    if (JSON.stringify(o.paragraphs) !== JSON.stringify(n.paragraphs))
      changes.push(`Phần ${i + 1} ("${n.title}"): đoạn văn đã thay đổi`);
    if (JSON.stringify(o.bulletPoints) !== JSON.stringify(n.bulletPoints))
      changes.push(`Phần ${i + 1} ("${n.title}"): danh sách gạch đầu dòng đã thay đổi`);
    if (o.footer !== n.footer) changes.push(`Phần ${i + 1} ("${n.title}"): footer đã thay đổi`);
  }
  return changes;
};

const computeChanges = (older: PrivacyPolicyContent, newer: PrivacyPolicyContent): string[] => {
  const changes: string[] = [];
  if (older.lastUpdated !== newer.lastUpdated)
    changes.push(`Ngày cập nhật: "${older.lastUpdated}" → "${newer.lastUpdated}"`);
  if (older.introBanner !== newer.introBanner) changes.push('Banner giới thiệu đã thay đổi');
  if (older.contactEmail !== newer.contactEmail)
    changes.push(`Email liên hệ: "${older.contactEmail ?? ''}" → "${newer.contactEmail ?? ''}"`);
  if (older.contactWebsite !== newer.contactWebsite)
    changes.push(`Website: "${older.contactWebsite ?? ''}" → "${newer.contactWebsite ?? ''}"`);
  if (older.responseTime !== newer.responseTime)
    changes.push(
      `Thời gian phản hồi: "${older.responseTime ?? ''}" → "${newer.responseTime ?? ''}"`
    );
  return [...changes, ...computeSectionChanges(older.sections ?? [], newer.sections ?? [])];
};

const loadHistory = (): EditHistoryEntry[] => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  } catch {
    return [];
  }
};

const appendHistory = (entry: EditHistoryEntry): EditHistoryEntry[] => {
  const prev = loadHistory();
  const next = [...prev, entry].slice(-10); // keep last 10 (snapshots can be large)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
};

// ── Sub-components ────────────────────────────────────────────────────────────

interface SectionEditorProps {
  section: PrivacyPolicySection;
  index: number;
  onChange: (index: number, updated: PrivacyPolicySection) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
}

const SectionEditor: React.FC<SectionEditorProps> = ({
  section,
  index,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) => {
  const [expanded, setExpanded] = useState(true);

  const set = (patch: Partial<PrivacyPolicySection>) => onChange(index, { ...section, ...patch });

  const updateParagraph = (pi: number, val: string) => {
    const next = [...(section.paragraphs ?? [])];
    next[pi] = val;
    set({ paragraphs: next });
  };

  const removeParagraph = (pi: number) => {
    const next = [...(section.paragraphs ?? [])];
    next.splice(pi, 1);
    set({ paragraphs: next });
  };

  const updateBullet = (bi: number, val: string) => {
    const next = [...(section.bulletPoints ?? [])];
    next[bi] = val;
    set({ bulletPoints: next });
  };

  const removeBullet = (bi: number) => {
    const next = [...(section.bulletPoints ?? [])];
    next.splice(bi, 1);
    set({ bulletPoints: next });
  };

  return (
    <div className="border border-[#E8E6DC] rounded-xl overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#F5F4ED] border-b border-[#E8E6DC]">
        <span className="text-[#87867F] text-[12px] font-mono w-5 text-center">{index + 1}</span>
        <input
          className="flex-1 bg-transparent border-none outline-none font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413] placeholder:text-[#C4C3BB]"
          placeholder="Tiêu đề phần..."
          value={section.title}
          onChange={(e) => set({ title: e.target.value })}
        />
        <div className="flex items-center gap-1 ml-auto flex-shrink-0">
          <button
            onClick={() => onMoveUp(index)}
            disabled={isFirst}
            className="p-1 rounded text-[#87867F] hover:text-[#141413] hover:bg-[#E8E6DC] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Di chuyển lên"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMoveDown(index)}
            disabled={isLast}
            className="p-1 rounded text-[#87867F] hover:text-[#141413] hover:bg-[#E8E6DC] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Di chuyển xuống"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRemove(index)}
            className="p-1 rounded text-[#87867F] hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Xoá phần"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="p-1 rounded text-[#87867F] hover:text-[#141413] hover:bg-[#E8E6DC] transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-4 space-y-4 bg-white">
          {/* Paragraphs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59] uppercase tracking-wide">
                Đoạn văn
              </span>
              <button
                onClick={() => set({ paragraphs: [...(section.paragraphs ?? []), ''] })}
                className="flex items-center gap-1 text-[12px] text-[#C96442] hover:text-[#A8532E] font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm đoạn
              </button>
            </div>
            <div className="space-y-2">
              {(section.paragraphs ?? []).map((p, pi) => (
                <div key={pi} className="flex items-start gap-2">
                  <textarea
                    rows={2}
                    className="flex-1 border border-[#E8E6DC] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] resize-y outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] transition-colors"
                    placeholder={`Đoạn ${pi + 1}...`}
                    value={p}
                    onChange={(e) => updateParagraph(pi, e.target.value)}
                  />
                  <button
                    onClick={() => removeParagraph(pi)}
                    className="mt-2 p-1.5 rounded text-[#87867F] hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {(section.paragraphs ?? []).length === 0 && (
                <p className="text-[12px] text-[#C4C3BB] italic">Chưa có đoạn văn nào.</p>
              )}
            </div>
          </div>

          {/* Bullet points */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59] uppercase tracking-wide">
                Danh sách gạch đầu dòng
              </span>
              <button
                onClick={() => set({ bulletPoints: [...(section.bulletPoints ?? []), ''] })}
                className="flex items-center gap-1 text-[12px] text-[#C96442] hover:text-[#A8532E] font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm mục
              </button>
            </div>
            <div className="space-y-2">
              {(section.bulletPoints ?? []).map((b, bi) => (
                <div key={bi} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C96442] flex-shrink-0" />
                  <input
                    className="flex-1 border border-[#E8E6DC] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] transition-colors"
                    placeholder={`Mục ${bi + 1}...`}
                    value={b}
                    onChange={(e) => updateBullet(bi, e.target.value)}
                  />
                  <button
                    onClick={() => removeBullet(bi)}
                    className="p-1.5 rounded text-[#87867F] hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {(section.bulletPoints ?? []).length === 0 && (
                <p className="text-[12px] text-[#C4C3BB] italic">Chưa có mục nào.</p>
              )}
            </div>
          </div>

          {/* Optional footer */}
          <div>
            <span className="font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59] uppercase tracking-wide block mb-2">
              Footer (tuỳ chọn)
            </span>
            <textarea
              rows={2}
              className="w-full border border-[#E8E6DC] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] resize-y outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] transition-colors"
              placeholder="Văn bản footer phần này (có thể để trống)..."
              value={section.footer ?? ''}
              onChange={(e) => set({ footer: e.target.value || undefined })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ── Diff Modal ────────────────────────────────────────────────────────────────

const DiffModal: React.FC<{
  a: EditHistoryEntry;
  b: EditHistoryEntry;
  onClose: () => void;
}> = ({ a, b, onClose }) => {
  const [older, newer] = a.timestamp < b.timestamp ? [a, b] : [b, a];
  const changes = computeChanges(
    older.snapshot as PrivacyPolicyContent,
    newer.snapshot as PrivacyPolicyContent
  );

  return (
    <div
      className="fixed inset-0 bg-[#141413]/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      tabIndex={-1}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="So sánh phiên bản"
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#E8E6DC] bg-white">
          <ArrowLeftRight className="w-5 h-5 text-[#C96442] flex-shrink-0" />
          <h3 className="font-[Be_Vietnam_Pro] text-[16px] font-semibold text-[#141413] flex-1">
            So sánh phiên bản
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#87867F] hover:text-[#141413] hover:bg-[#F5F4ED] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Version tags */}
        <div className="grid grid-cols-2 divide-x divide-[#E8E6DC] border-b border-[#E8E6DC] bg-[#F9F8F6]">
          <div className="px-6 py-5">
            <div className="font-[Be_Vietnam_Pro] text-[11px] text-[#87867F] uppercase tracking-widest mb-2.5">
              Phiên bản cũ hơn
            </div>
            <div className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413] mb-1.5">
              {older.editor}
            </div>
            <div className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">{older.label}</div>
          </div>
          <div className="px-6 py-5">
            <div className="font-[Be_Vietnam_Pro] text-[11px] text-[#87867F] uppercase tracking-widest mb-2.5">
              Phiên bản mới hơn
            </div>
            <div className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413] mb-1.5">
              {newer.editor}
            </div>
            <div className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">{newer.label}</div>
          </div>
        </div>

        {/* Changes list */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          {changes.length === 0 ? (
            <p className="text-center font-[Be_Vietnam_Pro] text-[13px] text-[#C4C3BB] italic py-12">
              Không có sự khác biệt giữa hai phiên bản.
            </p>
          ) : (
            <>
              <div className="font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] mb-4 inline-block px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg">
                Phát hiện {changes.length} thay đổi
              </div>
              {changes.map((change, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-amber-50/60 border border-amber-100/80 hover:bg-amber-100/50 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                  <span className="font-[Be_Vietnam_Pro] text-[13px] text-[#141413] leading-relaxed">
                    {change}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8E6DC] bg-[#F9F8F6] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] active:scale-[0.98] transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const AdminSystemConfigPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const {
    data: rawConfig,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin', 'system-config', 'privacy_policy'],
    queryFn: () => SystemConfigService.getPrivacyPolicy(),
  });

  const [draft, setDraft] = useState<PrivacyPolicyContent | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [editHistory, setEditHistory] = useState<EditHistoryEntry[]>(() => loadHistory());
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [diffModal, setDiffModal] = useState<{ a: EditHistoryEntry; b: EditHistoryEntry } | null>(
    null
  );

  // Seed draft from server data (only on first load)
  useEffect(() => {
    if (rawConfig && !isDirty) {
      setDraft(deepClone(rawConfig));
    }
  }, [rawConfig, isDirty]);

  const mutation = useMutation({
    mutationFn: (content: PrivacyPolicyContent) =>
      SystemConfigService.update('privacy_policy', JSON.stringify(content)),
    onSuccess: (_data, savedContent) => {
      queryClient.invalidateQueries({ queryKey: ['privacy-policy'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'system-config', 'privacy_policy'] });
      setIsDirty(false);
      const now = new Date();
      const entry: EditHistoryEntry = {
        editor: mockAdmin.name,
        timestamp: now.toISOString(),
        label: formatViDatetime(now),
        snapshot: savedContent,
      };
      setEditHistory(appendHistory(entry));
      setSelectedForCompare([]);
      showToast({ type: 'success', message: 'Đã lưu chính sách bảo mật thành công!' });
    },
    onError: (err: Error) => {
      showToast({ type: 'error', message: `Lưu thất bại: ${err.message}` });
    },
  });

  const patchDraft = (patch: Partial<PrivacyPolicyContent>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
    setIsDirty(true);
  };

  const handleSectionChange = (index: number, updated: PrivacyPolicySection) => {
    if (!draft) return;
    const next = [...draft.sections];
    next[index] = updated;
    patchDraft({ sections: next });
  };

  const handleAddSection = () => {
    if (!draft) return;
    patchDraft({ sections: [...draft.sections, emptySection()] });
  };

  const handleRemoveSection = (index: number) => {
    if (!draft) return;
    const next = [...draft.sections];
    next.splice(index, 1);
    patchDraft({ sections: next });
  };

  const handleMoveUp = (index: number) => {
    if (!draft || index === 0) return;
    const next = [...draft.sections];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    patchDraft({ sections: next });
  };

  const handleMoveDown = (index: number) => {
    if (!draft || index === draft.sections.length - 1) return;
    const next = [...draft.sections];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    patchDraft({ sections: next });
  };

  const handleReset = () => {
    if (!rawConfig) return;
    setDraft(deepClone(rawConfig));
    setIsDirty(false);
  };

  const toggleCompareSelect = (ts: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(ts)) return prev.filter((x) => x !== ts);
      if (prev.length >= 2) return prev;
      return [...prev, ts];
    });
  };

  const handleOpenDiff = () => {
    const [tsA, tsB] = selectedForCompare;
    const a = editHistory.find((e) => e.timestamp === tsA);
    const b = editHistory.find((e) => e.timestamp === tsB);
    if (a?.snapshot && b?.snapshot) setDiffModal({ a, b });
  };

  const handleSave = () => {
    if (!draft) return;
    const now = new Date();
    const lastUpdated = formatViDate(now);
    const payload = { ...draft, lastUpdated };
    setDraft(payload);
    mutation.mutate(payload);
  };

  // ── Render ──

  if (isLoading) {
    return (
      <DashboardLayout
        role="admin"
        user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      >
        <div className="flex items-center justify-center py-32">
          <div className="text-[#87867F] font-[Be_Vietnam_Pro] text-[14px] animate-pulse">
            Đang tải cấu hình...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !draft) {
    return (
      <DashboardLayout
        role="admin"
        user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      >
        <div className="flex items-center justify-center py-32">
          <div className="text-red-500 font-[Be_Vietnam_Pro] text-[14px]">
            Không thể tải cấu hình. Vui lòng thử lại.
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
      <div className="px-6 py-8 lg:px-8">
        <div className="space-y-6">
          {/* Page header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413]">
                  Chính sách
                </h1>
                <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5">
                  Chính sách bảo mật — hiển thị khi giáo viên đăng ký
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isDirty && (
                <button
                  onClick={handleReset}
                  disabled={mutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E8E6DC] bg-white text-[#5E5D59] font-[Be_Vietnam_Pro] text-[13px] font-medium hover:bg-[#F5F4ED] disabled:opacity-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Huỷ
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!isDirty || mutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150"
              >
                <Save className="w-3.5 h-3.5" />
                {mutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>

          {isDirty && (
            <div className="px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 font-[Be_Vietnam_Pro] text-[13px] text-amber-700">
              Bạn có thay đổi chưa được lưu.
            </div>
          )}

          {/* Meta fields */}
          <div className="bg-white rounded-2xl border border-[#E8E6DC] p-5 space-y-4">
            <h2 className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#5E5D59] uppercase tracking-wide">
              Thông tin chung
            </h2>

            <div>
              <span className="block font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mb-1.5">
                Ngày cập nhật cuối
              </span>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F5F4ED] border border-[#E8E6DC]">
                <span className="font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59] flex-1">
                  {draft.lastUpdated ? (
                    draft.lastUpdated
                  ) : (
                    <span className="text-[#C4C3BB] italic">Tự động điền khi lưu</span>
                  )}
                </span>
                <span className="font-[Be_Vietnam_Pro] text-[11px] text-[#B0AEA5] flex-shrink-0">
                  Tự động
                </span>
              </div>
            </div>

            <div>
              <label className="block font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mb-1.5">
                Banner giới thiệu
              </label>
              <textarea
                rows={3}
                className="w-full border border-[#E8E6DC] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] resize-y outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] transition-colors"
                placeholder="Mô tả ngắn về cam kết bảo mật..."
                value={draft.introBanner ?? ''}
                onChange={(e) => patchDraft({ introBanner: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mb-1.5">
                  Email liên hệ
                </label>
                <input
                  className="w-full border border-[#E8E6DC] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] transition-colors"
                  placeholder="privacy@mathmaster.vn"
                  value={draft.contactEmail ?? ''}
                  onChange={(e) => patchDraft({ contactEmail: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mb-1.5">
                  Website liên hệ
                </label>
                <input
                  className="w-full border border-[#E8E6DC] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] transition-colors"
                  placeholder="mathmaster.vn"
                  value={draft.contactWebsite ?? ''}
                  onChange={(e) => patchDraft({ contactWebsite: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mb-1.5">
                Thời gian phản hồi
              </label>
              <input
                className="w-full border border-[#E8E6DC] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] transition-colors"
                placeholder="5 ngày làm việc"
                value={draft.responseTime ?? ''}
                onChange={(e) => patchDraft({ responseTime: e.target.value })}
              />
            </div>
          </div>

          {/* Sections editor */}
          <div className="bg-white rounded-2xl border border-[#E8E6DC] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#5E5D59] uppercase tracking-wide">
                Các phần nội dung ({draft.sections.length})
              </h2>
              <button
                onClick={handleAddSection}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E6DC] text-[12px] text-[#C96442] hover:bg-[#F5F4ED] font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm phần
              </button>
            </div>

            {draft.sections.length === 0 && (
              <p className="text-center text-[13px] text-[#C4C3BB] italic py-8">
                Chưa có phần nào. Nhấn "Thêm phần" để bắt đầu.
              </p>
            )}

            <div className="space-y-3">
              {draft.sections.map((section, idx) => (
                <SectionEditor
                  key={idx}
                  section={section}
                  index={idx}
                  onChange={handleSectionChange}
                  onRemove={handleRemoveSection}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  isFirst={idx === 0}
                  isLast={idx === draft.sections.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Edit history */}
          <div className="bg-white rounded-2xl border border-[#E8E6DC] p-5 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Clock className="w-4 h-4 text-[#87867F]" />
              <h2 className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#5E5D59] uppercase tracking-wide">
                Lịch sử chỉnh sửa
              </h2>
              {editHistory.length > 0 && (
                <span className="font-[Be_Vietnam_Pro] text-[11px] text-[#B0AEA5]">
                  {editHistory.length} lần lưu
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                {selectedForCompare.length === 1 && (
                  <span className="font-[Be_Vietnam_Pro] text-[11px] text-[#87867F]">
                    Chọn thêm 1 phiên bản nữa để so sánh
                  </span>
                )}
                {selectedForCompare.length === 2 && (
                  <button
                    onClick={handleOpenDiff}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#C96442] text-[12px] text-[#C96442] hover:bg-orange-50 font-medium transition-colors"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    So sánh 2 phiên bản
                  </button>
                )}
                {selectedForCompare.length > 0 && (
                  <button
                    onClick={() => setSelectedForCompare([])}
                    className="font-[Be_Vietnam_Pro] text-[11px] text-[#87867F] hover:text-[#141413] transition-colors"
                  >
                    Bỏ chọn
                  </button>
                )}
              </div>
            </div>

            {editHistory.length === 0 ? (
              <p className="text-center font-[Be_Vietnam_Pro] text-[13px] text-[#C4C3BB] italic py-6">
                Chưa có lịch sử chỉnh sửa. Lưu lần đầu để bắt đầu theo dõi.
              </p>
            ) : (
              <div className="space-y-2">
                {[...editHistory].reverse().map((entry, i) => {
                  const isSelected = selectedForCompare.includes(entry.timestamp);
                  const hasSnapshot = !!entry.snapshot;
                  const isDisabled =
                    (!isSelected && selectedForCompare.length >= 2) || !hasSnapshot;
                  return (
                    <div
                      key={entry.timestamp}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                        isSelected
                          ? 'bg-orange-50 border-[#C96442]'
                          : 'bg-[#F5F4ED] border-[#F0EEE6]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => toggleCompareSelect(entry.timestamp)}
                        className="w-3.5 h-3.5 rounded accent-[#C96442] cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
                        title={hasSnapshot ? '' : 'Phiên bản cũ không có dữ liệu so sánh'}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#141413]">
                          {entry.editor}
                        </span>
                        <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] ml-2">
                          đã lưu lúc {entry.label}
                        </span>
                      </div>
                      {i === 0 && (
                        <span className="flex-shrink-0 font-[Be_Vietnam_Pro] text-[10px] font-semibold text-[#C96442] bg-[#FAF9F5] border border-[#E8E6DC] px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Mới nhất
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom action bar */}
          <div className="flex items-center justify-end gap-2 pb-8">
            {isDirty && (
              <button
                onClick={handleReset}
                disabled={mutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white text-[#5E5D59] font-[Be_Vietnam_Pro] text-[13px] font-medium hover:bg-[#F5F4ED] disabled:opacity-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Huỷ thay đổi
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!isDirty || mutation.isPending}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150"
            >
              <Save className="w-4 h-4" />
              {mutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>

      {diffModal && (
        <DiffModal a={diffModal.a} b={diffModal.b} onClose={() => setDiffModal(null)} />
      )}
    </DashboardLayout>
  );
};

export default AdminSystemConfigPage;
