import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  BookText,
  FolderTree,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  X,
} from 'lucide-react';
import { AcademicStructureService } from '../../services/api/academic-structure.service';
import type {
  ChapterResponse,
  CreateChapterRequest,
  CreateLessonRequest,
  CreateSchoolGradeRequest,
  CreateSubjectRequest,
  LessonDifficulty,
  LessonResponse,
  LessonStatus,
  SchoolGradeResponse,
  SubjectResponse,
  UpdateChapterRequest,
  UpdateLessonRequest,
  UpdateSchoolGradeRequest,
  UpdateSubjectRequest,
} from '../../types/academic.types';
import { useToast } from '../../context/ToastContext';
import './academic-node-modal.css';

export type ModalTarget =
  | { type: 'grade'; mode: 'create' }
  | { type: 'grade'; mode: 'edit'; data: SchoolGradeResponse }
  | { type: 'subject'; mode: 'create'; parentGradeId: string }
  | { type: 'subject'; mode: 'edit'; data: SubjectResponse; parentGradeId: string }
  | { type: 'chapter'; mode: 'create'; parentSubjectId: string }
  | { type: 'chapter'; mode: 'edit'; data: ChapterResponse; parentSubjectId: string }
  | { type: 'lesson'; mode: 'create'; parentChapterId: string }
  | { type: 'lesson'; mode: 'edit'; data: LessonResponse; parentChapterId: string };

interface Props {
  target: ModalTarget | null;
  grades?: SchoolGradeResponse[];
  onClose: () => void;
  onSuccess?: (type: ModalTarget['type'], id: string) => void;
}

type NumberInput = number | '';

interface GradeFormState {
  gradeLevel: NumberInput;
  name: string;
  description: string;
  active: boolean;
}

interface SubjectFormState {
  name: string;
  description: string;
  schoolGradeId: string;
}

interface ChapterFormState {
  title: string;
  description: string;
  orderIndex: NumberInput;
}

interface LessonFormState {
  title: string;
  learningObjectives: string;
  lessonContent: string;
  summary: string;
  orderIndex: NumberInput;
  durationMinutes: NumberInput;
  difficulty: LessonDifficulty;
  status: LessonStatus;
}

function parseOptional(v: NumberInput): number | undefined {
  if (v === '') return undefined;
  return Number(v);
}

function parseRequired(v: NumberInput): number {
  if (v === '') return 0;
  return Number(v);
}

const DIFFICULTY_OPTIONS: { value: LessonDifficulty; label: string }[] = [
  { value: 'EASY', label: 'Dễ' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HARD', label: 'Khó' },
];

const STATUS_OPTIONS: { value: LessonStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'PUBLISHED', label: 'Đã xuất bản' },
  { value: 'ARCHIVED', label: 'Lưu trữ' },
];

function getTitle(target: ModalTarget): string {
  const verbs = { create: 'Thêm', edit: 'Chỉnh sửa' };
  const nouns: Record<ModalTarget['type'], string> = {
    grade: 'lớp / chương trình',
    subject: 'môn học',
    chapter: 'chương',
    lesson: 'bài học',
  };
  return `${verbs[target.mode]} ${nouns[target.type]}`;
}

function getIcon(type: ModalTarget['type']) {
  switch (type) {
    case 'grade':
      return GraduationCap;
    case 'subject':
      return BookOpen;
    case 'chapter':
      return FolderTree;
    case 'lesson':
      return BookText;
  }
}

export function AcademicNodeModal({ target, grades = [], onClose, onSuccess }: Readonly<Props>) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [gradeForm, setGradeForm] = useState<GradeFormState>({
    gradeLevel: '',
    name: '',
    description: '',
    active: true,
  });

  const [subjectForm, setSubjectForm] = useState<SubjectFormState>({
    name: '',
    description: '',
    schoolGradeId: '',
  });

  const [chapterForm, setChapterForm] = useState<ChapterFormState>({
    title: '',
    description: '',
    orderIndex: '',
  });

  const [lessonForm, setLessonForm] = useState<LessonFormState>({
    title: '',
    learningObjectives: '',
    lessonContent: '',
    summary: '',
    orderIndex: '',
    durationMinutes: '',
    difficulty: 'EASY',
    status: 'DRAFT',
  });

  // Hydrate form when target changes
  useEffect(() => {
    if (!target) return;

    if (target.type === 'grade') {
      if (target.mode === 'edit') {
        setGradeForm({
          gradeLevel: target.data.gradeLevel,
          name: target.data.name,
          description: target.data.description ?? '',
          active: target.data.active,
        });
      } else {
        setGradeForm({ gradeLevel: '', name: '', description: '', active: true });
      }
    }

    if (target.type === 'subject') {
      if (target.mode === 'edit') {
        setSubjectForm({
          name: target.data.name,
          description: target.data.description ?? '',
          schoolGradeId: target.data.schoolGradeId ?? target.parentGradeId,
        });
      } else {
        setSubjectForm({ name: '', description: '', schoolGradeId: target.parentGradeId });
      }
    }

    if (target.type === 'chapter') {
      if (target.mode === 'edit') {
        setChapterForm({
          title: target.data.title,
          description: target.data.description ?? '',
          orderIndex: target.data.orderIndex ?? '',
        });
      } else {
        setChapterForm({ title: '', description: '', orderIndex: '' });
      }
    }

    if (target.type === 'lesson') {
      if (target.mode === 'edit') {
        setLessonForm({
          title: target.data.title,
          learningObjectives: target.data.learningObjectives ?? '',
          lessonContent: target.data.lessonContent ?? '',
          summary: target.data.summary ?? '',
          orderIndex: target.data.orderIndex ?? '',
          durationMinutes: target.data.durationMinutes ?? '',
          difficulty: target.data.difficulty ?? 'EASY',
          status: target.data.status ?? 'DRAFT',
        });
      } else {
        setLessonForm({
          title: '',
          learningObjectives: '',
          lessonContent: '',
          summary: '',
          orderIndex: '',
          durationMinutes: '',
          difficulty: 'EASY',
          status: 'DRAFT',
        });
      }
    }
  }, [target]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!target) throw new Error('No target');

      switch (target.type) {
        case 'grade': {
          if (!gradeForm.name.trim()) throw new Error('Vui lòng nhập tên lớp');
          if (gradeForm.gradeLevel === '') throw new Error('Vui lòng nhập khối lớp (1–12)');
          const level = parseRequired(gradeForm.gradeLevel);
          if (target.mode === 'edit') {
            const payload: UpdateSchoolGradeRequest = {
              gradeLevel: level,
              name: gradeForm.name.trim(),
              description: gradeForm.description.trim() || undefined,
              active: gradeForm.active,
            };
            return AcademicStructureService.updateSchoolGrade(target.data.id, payload);
          }
          const payload: CreateSchoolGradeRequest = {
            gradeLevel: level,
            name: gradeForm.name.trim(),
            description: gradeForm.description.trim() || undefined,
          };
          return AcademicStructureService.createSchoolGrade(payload);
        }

        case 'subject': {
          if (!subjectForm.name.trim()) throw new Error('Vui lòng nhập tên môn học');
          if (!subjectForm.schoolGradeId) throw new Error('Vui lòng chọn lớp');
          if (target.mode === 'edit') {
            const payload: UpdateSubjectRequest = {
              name: subjectForm.name.trim(),
              description: subjectForm.description.trim() || undefined,
              schoolGradeId: subjectForm.schoolGradeId,
            };
            return AcademicStructureService.updateSubject(target.data.id, payload);
          }
          const payload: CreateSubjectRequest = {
            name: subjectForm.name.trim(),
            schoolGradeId: subjectForm.schoolGradeId,
          };
          return AcademicStructureService.createSubject(payload);
        }

        case 'chapter': {
          if (!chapterForm.title.trim()) throw new Error('Vui lòng nhập tên chương');
          if (target.mode === 'edit') {
            const payload: UpdateChapterRequest = {
              title: chapterForm.title.trim(),
              description: chapterForm.description.trim() || undefined,
              orderIndex: parseOptional(chapterForm.orderIndex),
            };
            return AcademicStructureService.updateChapter(target.data.id, payload);
          }
          const payload: CreateChapterRequest = {
            subjectId: target.parentSubjectId,
            title: chapterForm.title.trim(),
            description: chapterForm.description.trim() || undefined,
            orderIndex: parseOptional(chapterForm.orderIndex),
          };
          return AcademicStructureService.createChapter(payload);
        }

        case 'lesson': {
          if (!lessonForm.title.trim()) throw new Error('Vui lòng nhập tên bài học');
          if (target.mode === 'edit') {
            const payload: UpdateLessonRequest = {
              title: lessonForm.title.trim(),
              learningObjectives: lessonForm.learningObjectives.trim() || undefined,
              lessonContent: lessonForm.lessonContent.trim() || undefined,
              summary: lessonForm.summary.trim() || undefined,
              orderIndex: parseOptional(lessonForm.orderIndex),
              durationMinutes: parseOptional(lessonForm.durationMinutes),
              difficulty: lessonForm.difficulty,
              status: lessonForm.status,
            };
            return AcademicStructureService.updateLesson(target.data.id, payload);
          }
          const payload: CreateLessonRequest = {
            chapterId: target.parentChapterId,
            title: lessonForm.title.trim(),
            learningObjectives: lessonForm.learningObjectives.trim() || undefined,
            lessonContent: lessonForm.lessonContent.trim() || undefined,
            summary: lessonForm.summary.trim() || undefined,
            orderIndex: parseOptional(lessonForm.orderIndex),
            durationMinutes: parseOptional(lessonForm.durationMinutes),
            difficulty: lessonForm.difficulty,
          };
          return AcademicStructureService.createLesson(payload);
        }
      }
    },
    onSuccess: (response) => {
      if (!target) return;

      // Invalidate relevant queries
      switch (target.type) {
        case 'grade':
          void queryClient.invalidateQueries({ queryKey: ['admin-academic', 'grades'] });
          break;
        case 'subject':
          void queryClient.invalidateQueries({
            queryKey: ['admin-academic', 'subjects', target.parentGradeId],
          });
          break;
        case 'chapter':
          void queryClient.invalidateQueries({
            queryKey: ['admin-academic', 'chapters', target.parentSubjectId],
          });
          break;
        case 'lesson':
          void queryClient.invalidateQueries({
            queryKey: ['admin-academic', 'lessons'],
          });
          break;
      }

      const verb = target.mode === 'create' ? 'Đã tạo' : 'Đã cập nhật';
      const nouns: Record<ModalTarget['type'], string> = {
        grade: 'lớp',
        subject: 'môn học',
        chapter: 'chương',
        lesson: 'bài học',
      };
      showToast({ type: 'success', message: `${verb} ${nouns[target.type]} thành công` });

      const result = response?.result as { id: string } | null;
      if (result?.id) {
        onSuccess?.(target.type, result.id);
      }
      onClose();
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể lưu. Vui lòng thử lại.',
      });
    },
  });

  if (!target) return null;

  const Icon = getIcon(target.type);
  const title = getTitle(target);
  const isCreate = target.mode === 'create';

  const renderGradeForm = () => (
    <>
      <div className="anm-field">
        <label className="anm-label">
          Khối lớp <span className="anm-required">*</span>
        </label>
        <input
          type="number"
          min={1}
          max={12}
          className="anm-input"
          placeholder="VD: 10"
          value={gradeForm.gradeLevel}
          onChange={(e) =>
            setGradeForm((f) => ({
              ...f,
              gradeLevel: e.target.value === '' ? '' : Number(e.target.value),
            }))
          }
          autoFocus
        />
      </div>
      <div className="anm-field">
        <label className="anm-label">
          Tên <span className="anm-required">*</span>
        </label>
        <input
          type="text"
          className="anm-input"
          placeholder="VD: Khối 10"
          value={gradeForm.name}
          onChange={(e) => setGradeForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div className="anm-field">
        <label className="anm-label">Mô tả</label>
        <textarea
          className="anm-textarea"
          placeholder="Mô tả về chương trình..."
          value={gradeForm.description}
          onChange={(e) => setGradeForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>
      {!isCreate && (
        <label className="anm-check">
          <input
            type="checkbox"
            checked={gradeForm.active}
            onChange={(e) => setGradeForm((f) => ({ ...f, active: e.target.checked }))}
          />
          Đang hoạt động
        </label>
      )}
    </>
  );

  const renderSubjectForm = () => (
    <>
      <div className="anm-field">
        <label className="anm-label">
          Tên môn học <span className="anm-required">*</span>
        </label>
        <input
          type="text"
          className="anm-input"
          placeholder="VD: Đại Số"
          value={subjectForm.name}
          onChange={(e) => setSubjectForm((f) => ({ ...f, name: e.target.value }))}
          autoFocus
        />
      </div>
      {grades.length > 0 && (
        <div className="anm-field">
          <label className="anm-label">
            Lớp <span className="anm-required">*</span>
          </label>
          <select
            className="anm-input"
            value={subjectForm.schoolGradeId}
            onChange={(e) => setSubjectForm((f) => ({ ...f, schoolGradeId: e.target.value }))}
            disabled={target.type === 'subject' && target.mode === 'edit'}
          >
            <option value="">Chọn lớp...</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {`Lớp ${g.gradeLevel} – ${g.name}`}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="anm-field">
        <label className="anm-label">Mô tả</label>
        <textarea
          className="anm-textarea"
          placeholder="Mô tả về môn học..."
          value={subjectForm.description}
          onChange={(e) => setSubjectForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>
    </>
  );

  const renderChapterForm = () => (
    <>
      <div className="anm-field">
        <label className="anm-label">
          Tên chương <span className="anm-required">*</span>
        </label>
        <input
          type="text"
          className="anm-input"
          placeholder="VD: Chương 1: Hàm số và đồ thị"
          value={chapterForm.title}
          onChange={(e) => setChapterForm((f) => ({ ...f, title: e.target.value }))}
          autoFocus
        />
      </div>
      <div className="anm-field">
        <label className="anm-label">Mô tả</label>
        <textarea
          className="anm-textarea"
          placeholder="Mô tả về chương..."
          value={chapterForm.description}
          onChange={(e) => setChapterForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>
      <div className="anm-field">
        <label className="anm-label">Thứ tự (tùy chọn)</label>
        <input
          type="number"
          className="anm-input"
          placeholder="Tự động nếu để trống"
          value={chapterForm.orderIndex}
          onChange={(e) =>
            setChapterForm((f) => ({
              ...f,
              orderIndex: e.target.value === '' ? '' : Number(e.target.value),
            }))
          }
        />
      </div>
    </>
  );

  const renderLessonForm = () => (
    <>
      <div className="anm-field">
        <label className="anm-label">
          Tên bài học <span className="anm-required">*</span>
        </label>
        <input
          type="text"
          className="anm-input"
          placeholder="VD: Bài 1: Khái niệm hàm số"
          value={lessonForm.title}
          onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))}
          autoFocus
        />
      </div>
      <div className="anm-field">
        <label className="anm-label">Mục tiêu học tập</label>
        <textarea
          className="anm-textarea"
          placeholder="Sau bài học, học sinh sẽ..."
          value={lessonForm.learningObjectives}
          onChange={(e) => setLessonForm((f) => ({ ...f, learningObjectives: e.target.value }))}
        />
      </div>
      <div className="anm-field">
        <label className="anm-label">Nội dung bài học</label>
        <textarea
          className="anm-textarea anm-textarea--tall"
          placeholder="Nội dung chi tiết bài học..."
          value={lessonForm.lessonContent}
          onChange={(e) => setLessonForm((f) => ({ ...f, lessonContent: e.target.value }))}
        />
      </div>
      <div className="anm-field">
        <label className="anm-label">Tóm tắt</label>
        <textarea
          className="anm-textarea"
          placeholder="Tóm tắt ngắn gọn bài học..."
          value={lessonForm.summary}
          onChange={(e) => setLessonForm((f) => ({ ...f, summary: e.target.value }))}
        />
      </div>
      <div className="anm-row-2">
        <div className="anm-field">
          <label className="anm-label">Thứ tự</label>
          <input
            type="number"
            className="anm-input"
            placeholder="Tự động"
            value={lessonForm.orderIndex}
            onChange={(e) =>
              setLessonForm((f) => ({
                ...f,
                orderIndex: e.target.value === '' ? '' : Number(e.target.value),
              }))
            }
          />
        </div>
        <div className="anm-field">
          <label className="anm-label">Thời lượng (phút)</label>
          <input
            type="number"
            className="anm-input"
            placeholder="VD: 45"
            value={lessonForm.durationMinutes}
            onChange={(e) =>
              setLessonForm((f) => ({
                ...f,
                durationMinutes: e.target.value === '' ? '' : Number(e.target.value),
              }))
            }
          />
        </div>
      </div>
      <div className="anm-row-2">
        <div className="anm-field">
          <label className="anm-label">Độ khó</label>
          <select
            className="anm-input"
            value={lessonForm.difficulty}
            onChange={(e) =>
              setLessonForm((f) => ({ ...f, difficulty: e.target.value as LessonDifficulty }))
            }
          >
            {DIFFICULTY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {!isCreate && (
          <div className="anm-field">
            <label className="anm-label">Trạng thái</label>
            <select
              className="anm-input"
              value={lessonForm.status}
              onChange={(e) =>
                setLessonForm((f) => ({ ...f, status: e.target.value as LessonStatus }))
              }
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </>
  );

  const renderForm = () => {
    switch (target.type) {
      case 'grade':
        return renderGradeForm();
      case 'subject':
        return renderSubjectForm();
      case 'chapter':
        return renderChapterForm();
      case 'lesson':
        return renderLessonForm();
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className="anm-overlay" onClick={onClose}>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div className="anm-card" onClick={(e) => e.stopPropagation()}>
        <div className="anm-header">
          <div className="anm-header__title">
            <div className="anm-header__icon">
              <Icon size={18} />
            </div>
            <h2>{title}</h2>
          </div>
          <button type="button" className="anm-close" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <form
          className="anm-body"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          {renderForm()}

          {mutation.error && (
            <p className="anm-error" role="alert">
              {mutation.error instanceof Error ? mutation.error.message : 'Có lỗi xảy ra'}
            </p>
          )}

          <div className="anm-footer">
            <button type="button" className="anm-btn anm-btn--ghost" onClick={onClose}>
              Hủy
            </button>
            <button
              type="submit"
              className="anm-btn anm-btn--primary"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 size={14} className="anm-spin" />
              ) : isCreate ? (
                <Plus size={14} />
              ) : (
                <Pencil size={14} />
              )}
              {mutation.isPending ? 'Đang lưu...' : isCreate ? 'Thêm mới' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
