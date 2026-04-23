import { useQuery } from '@tanstack/react-query';
import { useEffect, useId, useMemo, useState } from 'react';
import { SubjectService } from '../../services/api/subject.service';
import type {
  CreateAdminRoadmapRequest,
  RoadmapDetail,
  RoadmapStatus,
  SubjectResponse,
  UpdateAdminRoadmapRequest,
} from '../../types';
import './admin-roadmap-editor.css';

interface AdminRoadmapEditorProps {
  readonly initialRoadmap?: RoadmapDetail;
  readonly submitting?: boolean;
  readonly mode: 'create' | 'edit';
  readonly onSubmit: (payload: CreateAdminRoadmapRequest | UpdateAdminRoadmapRequest) => void;
}

const defaultCreatePayload: CreateAdminRoadmapRequest = {
  name: '',
  subjectId: '',
  description: '',
  estimatedDays: 30,
};

const defaultUpdatePayload: UpdateAdminRoadmapRequest = {
  name: '',
  subjectId: undefined,
  description: '',
  estimatedCompletionDays: 30,
  status: 'GENERATED',
};

function daysFieldDisplay(
  mode: 'create' | 'edit',
  createForm: CreateAdminRoadmapRequest,
  updateForm: UpdateAdminRoadmapRequest
): string {
  if (mode === 'create') {
    const d = createForm.estimatedDays;
    return d !== undefined && d > 0 ? String(d) : '';
  }
  const d = updateForm.estimatedCompletionDays;
  return d !== undefined && d > 0 ? String(d) : '';
}

export default function AdminRoadmapEditor({
  initialRoadmap,
  submitting,
  mode,
  onSubmit,
}: Readonly<AdminRoadmapEditorProps>) {
  const subjectsQuery = useQuery({
    queryKey: ['subjects', 'list'],
    queryFn: () => SubjectService.getSubjects(),
  });
  const subjects: SubjectResponse[] = Array.isArray(subjectsQuery.data?.result)
    ? subjectsQuery.data.result
    : [];
  const activeSubjects = subjects.filter((subject) => subject.isActive === true);

  const createInitialValue = useMemo<CreateAdminRoadmapRequest>(() => {
    if (!initialRoadmap) return defaultCreatePayload;

    return {
      name: initialRoadmap.name,
      subjectId: initialRoadmap.subjectId,
      description: initialRoadmap.description,
      estimatedDays: initialRoadmap.estimatedCompletionDays,
    };
  }, [initialRoadmap]);

  const updateInitialValue = useMemo<UpdateAdminRoadmapRequest>(() => {
    if (!initialRoadmap) return defaultUpdatePayload;

    return {
      name: initialRoadmap.name,
      subjectId: initialRoadmap.subjectId,
      description: initialRoadmap.description,
      status: initialRoadmap.status,
      estimatedCompletionDays: initialRoadmap.estimatedCompletionDays,
    };
  }, [initialRoadmap]);

  const [createForm, setCreateForm] = useState<CreateAdminRoadmapRequest>(createInitialValue);
  const [updateForm, setUpdateForm] = useState<UpdateAdminRoadmapRequest>(updateInitialValue);
  const [estimatedDaysError, setEstimatedDaysError] = useState<string | null>(null);
  const daysHintId = useId();
  const daysErrorId = useId();

  useEffect(() => {
    setCreateForm(createInitialValue);
  }, [createInitialValue]);

  useEffect(() => {
    setUpdateForm(updateInitialValue);
  }, [updateInitialValue]);

  const setCreateField = <K extends keyof CreateAdminRoadmapRequest>(
    key: K,
    value: CreateAdminRoadmapRequest[K]
  ) => {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
  };

  const setUpdateField = <K extends keyof UpdateAdminRoadmapRequest>(
    key: K,
    value: UpdateAdminRoadmapRequest[K]
  ) => {
    setUpdateForm((prev) => ({ ...prev, [key]: value }));
  };

  const isValidPositiveInt = (n: number | undefined) =>
    n !== undefined && Number.isInteger(n) && n > 0;

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEstimatedDaysError(null);
    if (mode === 'create') {
      const est = createForm.estimatedDays;
      if (!isValidPositiveInt(est)) {
        setEstimatedDaysError('Số ngày dự kiến phải là số nguyên lớn hơn 0.');
        return;
      }

      const payload: CreateAdminRoadmapRequest = {
        name: createForm.name.trim(),
        subjectId: createForm.subjectId,
        description: createForm.description.trim(),
        estimatedDays: est,
      };

      if (!payload.name || !payload.subjectId || !payload.description) return;
      onSubmit(payload);
      return;
    }

    const est = updateForm.estimatedCompletionDays;
    if (!isValidPositiveInt(est)) {
      setEstimatedDaysError('Số ngày dự kiến hoàn thành phải là số nguyên lớn hơn 0.');
      return;
    }

    const payload: UpdateAdminRoadmapRequest = {
      name: updateForm.name?.trim(),
      description: updateForm.description,
      estimatedCompletionDays: est,
      status: updateForm.status,
      subjectId:
        updateForm.subjectId && updateForm.subjectId !== initialRoadmap?.subjectId
          ? updateForm.subjectId
          : undefined,
    };

    onSubmit(payload);
  };

  const submitLabel = mode === 'create' ? 'Tạo lộ trình' : 'Cập nhật lộ trình';
  let subjectPlaceholderLabel = 'Chọn môn học';
  if (subjectsQuery.isLoading) {
    subjectPlaceholderLabel = 'Đang tải danh sách môn...';
  } else if (activeSubjects.length === 0) {
    subjectPlaceholderLabel = 'Không có môn đang hoạt động';
  }

  return (
    <form className="admin-roadmap-editor" onSubmit={handleSubmit}>
      <header className="admin-roadmap-editor__header">
        <h3>{mode === 'create' ? 'Thông tin lộ trình mới' : 'Cập nhật thông tin lộ trình'}</h3>
        <p>
          {mode === 'create'
            ? 'Điền tên, môn, mô tả và số ngày dự kiến. Các chủ đề sẽ được thiết lập ở bước sau.'
            : 'Cập nhật môn, mô tả, thời gian và trạng thái, rồi bổ sung chủ đề cùng bài học khi cần.'}
        </p>
      </header>

      <div className="admin-roadmap-editor__fields">
        {mode === 'create' && (
          <label className="admin-roadmap-editor__field">
            <span>Tên lộ trình</span>
            <input
              value={createForm.name}
              onChange={(event) => setCreateField('name', event.target.value)}
              required
            />
          </label>
        )}

        {mode === 'edit' && (
          <label className="admin-roadmap-editor__field">
            <span>Tên lộ trình</span>
            <input
              value={updateForm.name ?? ''}
              onChange={(event) => setUpdateField('name', event.target.value)}
              placeholder="Nhập tên lộ trình..."
            />
          </label>
        )}

        <label className="admin-roadmap-editor__field">
          <span>{mode === 'create' ? 'Môn học' : 'Đổi môn (tùy chọn)'}</span>
          <select
            value={mode === 'create' ? createForm.subjectId : (updateForm.subjectId ?? '')}
            onChange={(event) =>
              mode === 'create'
                ? setCreateField('subjectId', event.target.value)
                : setUpdateField('subjectId', event.target.value)
            }
            required={mode === 'create'}
            disabled={subjectsQuery.isLoading || activeSubjects.length === 0}
          >
            <option value="" disabled>
              {subjectPlaceholderLabel}
            </option>
            {activeSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
                {subject.primaryGradeLevel ? ` — Khối ${subject.primaryGradeLevel}` : ''}
              </option>
            ))}
          </select>
        </label>

        {mode === 'edit' && initialRoadmap && (
          <label className="admin-roadmap-editor__field">
            <span>Môn hiện tại (chỉ đọc)</span>
            <input value={initialRoadmap.subject} readOnly />
          </label>
        )}

        {mode === 'edit' && initialRoadmap && (
          <label className="admin-roadmap-editor__field">
            <span>Khối hiện tại (chỉ đọc)</span>
            <input value={initialRoadmap.gradeLevel} readOnly />
          </label>
        )}

        <label className="admin-roadmap-editor__field admin-roadmap-editor__field--wide">
          <span>Mô tả</span>
          <textarea
            value={mode === 'create' ? createForm.description : (updateForm.description ?? '')}
            onChange={(event) =>
              mode === 'create'
                ? setCreateField('description', event.target.value)
                : setUpdateField('description', event.target.value)
            }
            rows={4}
            required
          />
        </label>

        {mode === 'create' && (
          <label
            className={`admin-roadmap-editor__field${estimatedDaysError ? ' admin-roadmap-editor__field--invalid' : ''}`}
          >
            <span>Số ngày dự kiến</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              name="estimatedDays"
              placeholder="ví dụ: 30"
              aria-invalid={!!estimatedDaysError}
              aria-describedby={estimatedDaysError ? `${daysHintId} ${daysErrorId}` : daysHintId}
              value={daysFieldDisplay('create', createForm, updateForm)}
              onChange={(event) => {
                setEstimatedDaysError(null);
                const raw = event.target.value.trim();
                if (raw === '') {
                  setCreateField('estimatedDays', 0);
                  return;
                }
                if (!/^\d+$/.test(raw)) {
                  return;
                }
                const n = Number.parseInt(raw, 10);
                if (Number.isNaN(n)) {
                  return;
                }
                setCreateField('estimatedDays', n);
              }}
            />
            <p id={daysHintId} className="admin-roadmap-editor__hint">
              Chỉ nhập số nguyên dương (ví dụ 1, 7, 30).
            </p>
            {estimatedDaysError && (
              <p id={daysErrorId} className="admin-roadmap-editor__inline-error" role="alert">
                {estimatedDaysError}
              </p>
            )}
          </label>
        )}

        {mode === 'edit' && (
          <div className="admin-roadmap-editor__pair-row">
            <div className="admin-roadmap-editor__pair-left">
              <label
                className={`admin-roadmap-editor__field${estimatedDaysError ? ' admin-roadmap-editor__field--invalid' : ''}`}
              >
                <span>Số ngày dự kiến hoàn thành</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  name="estimatedCompletionDays"
                  placeholder="ví dụ: 30"
                  aria-invalid={!!estimatedDaysError}
                  aria-describedby={
                    estimatedDaysError ? `${daysHintId} ${daysErrorId}` : daysHintId
                  }
                  value={daysFieldDisplay('edit', createForm, updateForm)}
                  onChange={(event) => {
                    setEstimatedDaysError(null);
                    const raw = event.target.value.trim();
                    if (raw === '') {
                      setUpdateField('estimatedCompletionDays', 0);
                      return;
                    }
                    if (!/^\d+$/.test(raw)) {
                      return;
                    }
                    const n = Number.parseInt(raw, 10);
                    if (Number.isNaN(n)) {
                      return;
                    }
                    setUpdateField('estimatedCompletionDays', n);
                  }}
                />
              </label>
              <p id={daysHintId} className="admin-roadmap-editor__hint">
                Chỉ nhập số nguyên dương (ví dụ 1, 7, 30).
              </p>
              {estimatedDaysError && (
                <p id={daysErrorId} className="admin-roadmap-editor__inline-error" role="alert">
                  {estimatedDaysError}
                </p>
              )}
            </div>
            <label className="admin-roadmap-editor__field">
              <span>Trạng thái</span>
              <select
                value={updateForm.status ?? 'GENERATED'}
                onChange={(event) => setUpdateField('status', event.target.value as RoadmapStatus)}
              >
                <option value="GENERATED">Sẵn sàng</option>
                <option value="IN_PROGRESS">Đang học</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="ARCHIVED">Lưu trữ</option>
              </select>
            </label>
          </div>
        )}
      </div>

      <div className="admin-roadmap-editor__actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Đang lưu...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
