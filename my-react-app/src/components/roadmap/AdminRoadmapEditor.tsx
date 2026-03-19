import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  subjectId: undefined,
  description: '',
  estimatedCompletionDays: 30,
  status: 'GENERATED',
};

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
      subjectId: initialRoadmap.subjectId,
      description: initialRoadmap.description,
      status: initialRoadmap.status,
      estimatedCompletionDays: initialRoadmap.estimatedCompletionDays,
    };
  }, [initialRoadmap]);

  const [createForm, setCreateForm] = useState<CreateAdminRoadmapRequest>(createInitialValue);
  const [updateForm, setUpdateForm] = useState<UpdateAdminRoadmapRequest>(updateInitialValue);

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

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === 'create') {
      const normalizedEstimatedDays =
        typeof createForm.estimatedDays === 'number' && createForm.estimatedDays > 0
          ? createForm.estimatedDays
          : undefined;

      const payload: CreateAdminRoadmapRequest = {
        name: createForm.name.trim(),
        subjectId: createForm.subjectId,
        description: createForm.description.trim(),
        estimatedDays: normalizedEstimatedDays,
      };

      if (!payload.name || !payload.subjectId || !payload.description) return;
      onSubmit(payload);
      return;
    }

    const payload: UpdateAdminRoadmapRequest = {
      description: updateForm.description,
      estimatedCompletionDays: updateForm.estimatedCompletionDays,
      status: updateForm.status,
      subjectId:
        updateForm.subjectId && updateForm.subjectId !== initialRoadmap?.subjectId
          ? updateForm.subjectId
          : undefined,
    };

    onSubmit(payload);
  };

  const submitLabel = mode === 'create' ? 'Create roadmap' : 'Update roadmap';
  let subjectPlaceholderLabel = 'Select subject';
  if (subjectsQuery.isLoading) {
    subjectPlaceholderLabel = 'Loading subjects...';
  } else if (activeSubjects.length === 0) {
    subjectPlaceholderLabel = 'No active subjects';
  }

  return (
    <form className="admin-roadmap-editor" onSubmit={handleSubmit}>
      <header className="admin-roadmap-editor__header">
        <h3>{mode === 'create' ? 'Create roadmap template' : 'Update roadmap metadata'}</h3>
        <p>
          {mode === 'create'
            ? 'Fill in academic metadata. Topics and lesson links are managed in the topic panel below.'
            : 'Update roadmap metadata first, then add topics with many lessons in one request.'}
        </p>
      </header>

      <div className="admin-roadmap-editor__fields">
        {mode === 'create' && (
          <label className="admin-roadmap-editor__field">
            <span>Roadmap name</span>
            <input
              value={createForm.name}
              onChange={(event) => setCreateField('name', event.target.value)}
              required
            />
          </label>
        )}

        <label className="admin-roadmap-editor__field">
          <span>{mode === 'create' ? 'Subject' : 'Change subject (optional)'}</span>
          <select
            value={mode === 'create' ? createForm.subjectId : updateForm.subjectId ?? ''}
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
                {subject.primaryGradeLevel ? ` - Grade ${subject.primaryGradeLevel}` : ''}
              </option>
            ))}
          </select>
        </label>

        {mode === 'edit' && initialRoadmap && (
          <label className="admin-roadmap-editor__field">
            <span>Current subject (read-only)</span>
            <input value={initialRoadmap.subject} readOnly />
          </label>
        )}

        {mode === 'edit' && initialRoadmap && (
          <label className="admin-roadmap-editor__field">
            <span>Current grade level (read-only)</span>
            <input value={initialRoadmap.gradeLevel} readOnly />
          </label>
        )}

        <label className="admin-roadmap-editor__field admin-roadmap-editor__field--wide">
          <span>Description</span>
          <textarea
            value={mode === 'create' ? createForm.description : updateForm.description ?? ''}
            onChange={(event) =>
              mode === 'create'
                ? setCreateField('description', event.target.value)
                : setUpdateField('description', event.target.value)
            }
            rows={4}
            required
          />
        </label>

        <label className="admin-roadmap-editor__field">
          <span>{mode === 'create' ? 'Estimated days' : 'Estimated completion days'}</span>
          <input
            type="number"
            min={1}
            value={
              mode === 'create'
                ? createForm.estimatedDays ?? 30
                : updateForm.estimatedCompletionDays ?? 30
            }
            onChange={(event) => {
              const value = Number(event.target.value) || 30;
              if (mode === 'create') {
                setCreateField('estimatedDays', value);
              } else {
                setUpdateField('estimatedCompletionDays', value);
              }
            }}
            required
          />
        </label>

        {mode === 'edit' && (
          <label className="admin-roadmap-editor__field">
            <span>Status</span>
            <select
              value={updateForm.status ?? 'GENERATED'}
              onChange={(event) => setUpdateField('status', event.target.value as RoadmapStatus)}
            >
              <option value="GENERATED">GENERATED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </label>
        )}
      </div>

      <div className="admin-roadmap-editor__actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
