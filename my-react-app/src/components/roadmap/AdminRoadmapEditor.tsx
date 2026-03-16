import { useMemo, useState } from 'react';
import type { AdminRoadmapPayload, RoadmapDetail, RoadmapLevel, RoadmapStatus } from '../../types';
import AdminRoadmapLessonEditor from './AdminRoadmapLessonEditor';
import AdminRoadmapModuleEditor from './AdminRoadmapModuleEditor';
import './admin-roadmap-editor.css';

interface AdminRoadmapEditorProps {
  readonly initialRoadmap?: RoadmapDetail;
  readonly submitting?: boolean;
  readonly onSubmit: (payload: AdminRoadmapPayload) => void;
}

const defaultPayload: AdminRoadmapPayload = {
  title: '',
  slug: '',
  description: '',
  level: 'BEGINNER',
  status: 'DRAFT',
  estimatedHours: 10,
  tags: [],
};

export default function AdminRoadmapEditor({
  initialRoadmap,
  submitting,
  onSubmit,
}: Readonly<AdminRoadmapEditorProps>) {
  const initialValue = useMemo<AdminRoadmapPayload>(() => {
    if (!initialRoadmap) return defaultPayload;

    return {
      title: initialRoadmap.title,
      slug: initialRoadmap.slug,
      description: initialRoadmap.description,
      level: initialRoadmap.level,
      status: initialRoadmap.status,
      estimatedHours: initialRoadmap.estimatedHours,
      tags: initialRoadmap.tags,
    };
  }, [initialRoadmap]);

  const [form, setForm] = useState<AdminRoadmapPayload>(initialValue);

  const setField = <K extends keyof AdminRoadmapPayload>(key: K, value: AdminRoadmapPayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="admin-roadmap-editor" onSubmit={handleSubmit}>
      <div className="admin-roadmap-editor__fields">
        <label className="admin-roadmap-editor__field">
          <span>Title</span>
          <input
            value={form.title}
            onChange={(event) => setField('title', event.target.value)}
            required
          />
        </label>

        <label className="admin-roadmap-editor__field">
          <span>Slug</span>
          <input
            value={form.slug}
            onChange={(event) => setField('slug', event.target.value)}
            required
          />
        </label>

        <label className="admin-roadmap-editor__field admin-roadmap-editor__field--wide">
          <span>Description</span>
          <textarea
            value={form.description}
            onChange={(event) => setField('description', event.target.value)}
            rows={4}
            required
          />
        </label>

        <label className="admin-roadmap-editor__field">
          <span>Level</span>
          <select
            value={form.level}
            onChange={(event) => setField('level', event.target.value as RoadmapLevel)}
          >
            <option value="BEGINNER">BEGINNER</option>
            <option value="INTERMEDIATE">INTERMEDIATE</option>
            <option value="ADVANCED">ADVANCED</option>
          </select>
        </label>

        <label className="admin-roadmap-editor__field">
          <span>Status</span>
          <select
            value={form.status}
            onChange={(event) => setField('status', event.target.value as RoadmapStatus)}
          >
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </label>

        <label className="admin-roadmap-editor__field">
          <span>Estimated hours</span>
          <input
            type="number"
            min={1}
            value={form.estimatedHours}
            onChange={(event) => setField('estimatedHours', Number(event.target.value))}
            required
          />
        </label>

        <label className="admin-roadmap-editor__field admin-roadmap-editor__field--wide">
          <span>Tags (comma separated)</span>
          <input
            value={form.tags.join(', ')}
            onChange={(event) =>
              setField(
                'tags',
                event.target.value
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean)
              )
            }
          />
        </label>
      </div>

      <div className="admin-roadmap-editor__actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save roadmap'}
        </button>
      </div>

      <AdminRoadmapModuleEditor modules={initialRoadmap?.modules ?? []} />
      <AdminRoadmapLessonEditor modules={initialRoadmap?.modules ?? []} />
    </form>
  );
}
