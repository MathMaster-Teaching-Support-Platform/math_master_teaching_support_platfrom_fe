import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, BookText, FolderTree, GraduationCap, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import { mockAdmin } from '../../data/mockData';
import { useDebounce } from '../../hooks/useDebounce';
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
import './admin-academic-structure-page.css';

const LESSON_DIFFICULTY_OPTIONS: LessonDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];
const LESSON_STATUS_OPTIONS: LessonStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

type NumberInput = number | '';

function parseOptionalNumber(value: NumberInput): number | undefined {
  if (value === '') return undefined;
  return Number(value);
}

function parseRequiredNumber(value: NumberInput): number {
  if (value === '') return 0;
  return Number(value);
}

export default function AdminAcademicStructurePage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [lessonSearch, setLessonSearch] = useState('');

  const debouncedLessonSearch = useDebounce(lessonSearch, 300);

  const [gradeForm, setGradeForm] = useState<{
    id: string;
    gradeLevel: NumberInput;
    name: string;
    description: string;
    active: boolean;
  }>({
    id: '',
    gradeLevel: '',
    name: '',
    description: '',
    active: true,
  });

  const [subjectForm, setSubjectForm] = useState<{
    id: string;
    name: string;
    description: string;
    gradeMin: NumberInput;
    gradeMax: NumberInput;
    isActive: boolean;
    schoolGradeId: string;
  }>({
    id: '',
    name: '',
    description: '',
    gradeMin: '',
    gradeMax: '',
    isActive: true,
    schoolGradeId: '',
  });

  const [chapterForm, setChapterForm] = useState<{
    id: string;
    title: string;
    description: string;
    orderIndex: NumberInput;
    subjectId: string;
  }>({
    id: '',
    title: '',
    description: '',
    orderIndex: '',
    subjectId: '',
  });

  const [lessonForm, setLessonForm] = useState<{
    id: string;
    title: string;
    learningObjectives: string;
    lessonContent: string;
    summary: string;
    orderIndex: NumberInput;
    durationMinutes: NumberInput;
    difficulty: LessonDifficulty;
    status: LessonStatus;
    chapterId: string;
  }>({
    id: '',
    title: '',
    learningObjectives: '',
    lessonContent: '',
    summary: '',
    orderIndex: '',
    durationMinutes: '',
    difficulty: 'EASY',
    status: 'DRAFT',
    chapterId: '',
  });

  const gradesQuery = useQuery({
    queryKey: ['admin-academic', 'grades'],
    queryFn: () => AcademicStructureService.getSchoolGrades(false),
  });

  const subjectsQuery = useQuery({
    queryKey: ['admin-academic', 'subjects', selectedGradeId],
    queryFn: () => AcademicStructureService.getSubjectsBySchoolGrade(selectedGradeId),
    enabled: Boolean(selectedGradeId),
  });

  const chaptersQuery = useQuery({
    queryKey: ['admin-academic', 'chapters', selectedSubjectId],
    queryFn: () => AcademicStructureService.getChaptersBySubject(selectedSubjectId),
    enabled: Boolean(selectedSubjectId),
  });

  const lessonsQuery = useQuery({
    queryKey: ['admin-academic', 'lessons', selectedChapterId, debouncedLessonSearch],
    queryFn: () =>
      AcademicStructureService.getLessonsByChapter(selectedChapterId, debouncedLessonSearch),
    enabled: Boolean(selectedChapterId),
  });

  const grades = gradesQuery.data?.result ?? [];
  const subjects = subjectsQuery.data?.result ?? [];
  const chapters = chaptersQuery.data?.result ?? [];
  const lessons = lessonsQuery.data?.result ?? [];

  const selectedGrade = useMemo(
    () => grades.find((grade) => grade.id === selectedGradeId),
    [grades, selectedGradeId]
  );
  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId),
    [subjects, selectedSubjectId]
  );
  const selectedChapter = useMemo(
    () => chapters.find((chapter) => chapter.id === selectedChapterId),
    [chapters, selectedChapterId]
  );
  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId),
    [lessons, selectedLessonId]
  );

  useEffect(() => {
    if (!selectedGradeId) return;
    if (!grades.some((grade) => grade.id === selectedGradeId)) {
      setSelectedGradeId('');
      setSelectedSubjectId('');
      setSelectedChapterId('');
      setSelectedLessonId('');
    }
  }, [grades, selectedGradeId]);

  useEffect(() => {
    if (!selectedSubjectId) return;
    if (!subjects.some((subject) => subject.id === selectedSubjectId)) {
      setSelectedSubjectId('');
      setSelectedChapterId('');
      setSelectedLessonId('');
    }
  }, [selectedSubjectId, subjects]);

  useEffect(() => {
    if (!selectedChapterId) return;
    if (!chapters.some((chapter) => chapter.id === selectedChapterId)) {
      setSelectedChapterId('');
      setSelectedLessonId('');
    }
  }, [chapters, selectedChapterId]);

  useEffect(() => {
    if (!selectedLessonId) return;
    if (!lessons.some((lesson) => lesson.id === selectedLessonId)) {
      setSelectedLessonId('');
    }
  }, [lessons, selectedLessonId]);

  useEffect(() => {
    if (!selectedGrade) {
      setGradeForm({ id: '', gradeLevel: '', name: '', description: '', active: true });
      return;
    }

    setGradeForm({
      id: selectedGrade.id,
      gradeLevel: selectedGrade.gradeLevel,
      name: selectedGrade.name,
      description: selectedGrade.description ?? '',
      active: selectedGrade.active,
    });
  }, [selectedGrade]);

  useEffect(() => {
    if (!selectedSubject) {
      setSubjectForm({
        id: '',
        name: '',
        description: '',
        gradeMin: '',
        gradeMax: '',
        isActive: true,
        schoolGradeId: selectedGradeId,
      });
      return;
    }

    setSubjectForm({
      id: selectedSubject.id,
      name: selectedSubject.name,
      description: selectedSubject.description ?? '',
      gradeMin: selectedSubject.gradeMin ?? '',
      gradeMax: selectedSubject.gradeMax ?? '',
      isActive: selectedSubject.isActive ?? true,
      schoolGradeId: selectedSubject.schoolGradeId ?? selectedGradeId,
    });
  }, [selectedGradeId, selectedSubject]);

  useEffect(() => {
    if (!selectedChapter) {
      setChapterForm({
        id: '',
        title: '',
        description: '',
        orderIndex: '',
        subjectId: selectedSubjectId,
      });
      return;
    }

    setChapterForm({
      id: selectedChapter.id,
      title: selectedChapter.title,
      description: selectedChapter.description ?? '',
      orderIndex: selectedChapter.orderIndex ?? '',
      subjectId: selectedChapter.subjectId,
    });
  }, [selectedChapter, selectedSubjectId]);

  useEffect(() => {
    if (!selectedLesson) {
      setLessonForm({
        id: '',
        title: '',
        learningObjectives: '',
        lessonContent: '',
        summary: '',
        orderIndex: '',
        durationMinutes: '',
        difficulty: 'EASY',
        status: 'DRAFT',
        chapterId: selectedChapterId,
      });
      return;
    }

    setLessonForm({
      id: selectedLesson.id,
      title: selectedLesson.title,
      learningObjectives: selectedLesson.learningObjectives ?? '',
      lessonContent: selectedLesson.lessonContent ?? '',
      summary: selectedLesson.summary ?? '',
      orderIndex: selectedLesson.orderIndex ?? '',
      durationMinutes: selectedLesson.durationMinutes ?? '',
      difficulty: selectedLesson.difficulty ?? 'EASY',
      status: selectedLesson.status ?? 'DRAFT',
      chapterId: selectedLesson.chapterId,
    });
  }, [selectedChapterId, selectedLesson]);

  const saveGradeMutation = useMutation({
    mutationFn: async () => {
      if (!gradeForm.name.trim()) {
        throw new Error('Vui lòng nhập tên khối lớp');
      }

      if (gradeForm.id) {
        const payload: UpdateSchoolGradeRequest = {
          gradeLevel: parseRequiredNumber(gradeForm.gradeLevel),
          name: gradeForm.name.trim(),
          description: gradeForm.description.trim() || undefined,
          active: gradeForm.active,
        };
        return AcademicStructureService.updateSchoolGrade(gradeForm.id, payload);
      }

      const payload: CreateSchoolGradeRequest = {
        gradeLevel: parseRequiredNumber(gradeForm.gradeLevel),
        name: gradeForm.name.trim(),
        description: gradeForm.description.trim() || undefined,
      };
      return AcademicStructureService.createSchoolGrade(payload);
    },
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-academic', 'grades'] });
      setSelectedGradeId(response.result.id);
      showToast({
        type: 'success',
        message: gradeForm.id ? 'Đã cập nhật khối lớp' : 'Đã tạo khối lớp mới',
      });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể lưu khối lớp',
      });
    },
  });

  const saveSubjectMutation = useMutation({
    mutationFn: async () => {
      if (!subjectForm.name.trim()) {
        throw new Error('Vui lòng nhập tên môn học');
      }
      if (!subjectForm.schoolGradeId) {
        throw new Error('Vui lòng chọn school grade cho môn học');
      }
      if (
        subjectForm.gradeMin !== '' &&
        subjectForm.gradeMax !== '' &&
        Number(subjectForm.gradeMin) > Number(subjectForm.gradeMax)
      ) {
        throw new Error('gradeMin phải nhỏ hơn hoặc bằng gradeMax');
      }

      if (subjectForm.id) {
        const payload: UpdateSubjectRequest = {
          name: subjectForm.name.trim(),
          description: subjectForm.description.trim() || undefined,
          gradeMin: parseOptionalNumber(subjectForm.gradeMin),
          gradeMax: parseOptionalNumber(subjectForm.gradeMax),
          isActive: subjectForm.isActive,
          schoolGradeId: subjectForm.schoolGradeId,
        };
        return AcademicStructureService.updateSubject(subjectForm.id, payload);
      }

      const payload: CreateSubjectRequest = {
        name: subjectForm.name.trim(),
        schoolGradeId: subjectForm.schoolGradeId,
      };
      return AcademicStructureService.createSubject(payload);
    },
    onSuccess: (response) => {
      void queryClient.invalidateQueries({
        queryKey: ['admin-academic', 'subjects', selectedGradeId],
      });
      setSelectedSubjectId(response.result.id);
      showToast({
        type: 'success',
        message: subjectForm.id ? 'Đã cập nhật môn học' : 'Đã tạo môn học mới',
      });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể lưu môn học',
      });
    },
  });

  const saveChapterMutation = useMutation({
    mutationFn: async () => {
      if (!chapterForm.title.trim()) {
        throw new Error('Vui lòng nhập tên chương');
      }
      if (!chapterForm.subjectId) {
        throw new Error('Vui lòng chọn subject');
      }

      if (chapterForm.id) {
        const payload: UpdateChapterRequest = {
          title: chapterForm.title.trim(),
          description: chapterForm.description.trim() || undefined,
          orderIndex: parseOptionalNumber(chapterForm.orderIndex),
        };
        return AcademicStructureService.updateChapter(chapterForm.id, payload);
      }

      const payload: CreateChapterRequest = {
        subjectId: chapterForm.subjectId,
        title: chapterForm.title.trim(),
        description: chapterForm.description.trim() || undefined,
        orderIndex: parseOptionalNumber(chapterForm.orderIndex),
      };
      return AcademicStructureService.createChapter(payload);
    },
    onSuccess: (response) => {
      void queryClient.invalidateQueries({
        queryKey: ['admin-academic', 'chapters', selectedSubjectId],
      });
      setSelectedChapterId(response.result.id);
      showToast({
        type: 'success',
        message: chapterForm.id ? 'Đã cập nhật chương' : 'Đã tạo chương mới',
      });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể lưu chương',
      });
    },
  });

  const saveLessonMutation = useMutation({
    mutationFn: async () => {
      if (!lessonForm.title.trim()) {
        throw new Error('Vui lòng nhập tên bài học');
      }
      if (!lessonForm.chapterId) {
        throw new Error('Vui lòng chọn chapter');
      }

      if (lessonForm.id) {
        const payload: UpdateLessonRequest = {
          title: lessonForm.title.trim(),
          learningObjectives: lessonForm.learningObjectives.trim() || undefined,
          lessonContent: lessonForm.lessonContent.trim() || undefined,
          summary: lessonForm.summary.trim() || undefined,
          orderIndex: parseOptionalNumber(lessonForm.orderIndex),
          durationMinutes: parseOptionalNumber(lessonForm.durationMinutes),
          difficulty: lessonForm.difficulty,
          status: lessonForm.status,
        };
        return AcademicStructureService.updateLesson(lessonForm.id, payload);
      }

      const payload: CreateLessonRequest = {
        chapterId: lessonForm.chapterId,
        title: lessonForm.title.trim(),
        learningObjectives: lessonForm.learningObjectives.trim() || undefined,
        lessonContent: lessonForm.lessonContent.trim() || undefined,
        summary: lessonForm.summary.trim() || undefined,
        orderIndex: parseOptionalNumber(lessonForm.orderIndex),
        durationMinutes: parseOptionalNumber(lessonForm.durationMinutes),
        difficulty: lessonForm.difficulty,
      };
      return AcademicStructureService.createLesson(payload);
    },
    onSuccess: (response) => {
      void queryClient.invalidateQueries({
        queryKey: ['admin-academic', 'lessons', selectedChapterId, debouncedLessonSearch],
      });
      setSelectedLessonId(response.result.id);
      showToast({
        type: 'success',
        message: lessonForm.id ? 'Đã cập nhật bài học' : 'Đã tạo bài học mới',
      });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể lưu bài học',
      });
    },
  });

  const deleteGradeMutation = useMutation({
    mutationFn: (gradeId: string) => AcademicStructureService.deleteSchoolGrade(gradeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-academic', 'grades'] });
      setSelectedGradeId('');
      setSelectedSubjectId('');
      setSelectedChapterId('');
      setSelectedLessonId('');
      showToast({ type: 'success', message: 'Đã xóa (soft delete) school grade' });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể xóa school grade',
      });
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: (subjectId: string) => AcademicStructureService.deleteSubject(subjectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['admin-academic', 'subjects', selectedGradeId],
      });
      setSelectedSubjectId('');
      setSelectedChapterId('');
      setSelectedLessonId('');
      showToast({ type: 'success', message: 'Đã xóa (soft delete) subject' });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể xóa subject',
      });
    },
  });

  const deleteChapterMutation = useMutation({
    mutationFn: (chapterId: string) => AcademicStructureService.deleteChapter(chapterId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['admin-academic', 'chapters', selectedSubjectId],
      });
      setSelectedChapterId('');
      setSelectedLessonId('');
      showToast({ type: 'success', message: 'Đã xóa (soft delete) chapter' });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể xóa chapter',
      });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (lessonId: string) => AcademicStructureService.deleteLesson(lessonId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['admin-academic', 'lessons', selectedChapterId, debouncedLessonSearch],
      });
      setSelectedLessonId('');
      showToast({ type: 'success', message: 'Đã xóa (soft delete) lesson' });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể xóa lesson',
      });
    },
  });

  const resetGradeForm = () => {
    setSelectedGradeId('');
    setGradeForm({ id: '', gradeLevel: '', name: '', description: '', active: true });
  };

  const resetSubjectForm = () => {
    setSelectedSubjectId('');
    setSubjectForm({
      id: '',
      name: '',
      description: '',
      gradeMin: '',
      gradeMax: '',
      isActive: true,
      schoolGradeId: selectedGradeId,
    });
  };

  const resetChapterForm = () => {
    setSelectedChapterId('');
    setChapterForm({
      id: '',
      title: '',
      description: '',
      orderIndex: '',
      subjectId: selectedSubjectId,
    });
  };

  const resetLessonForm = () => {
    setSelectedLessonId('');
    setLessonForm({
      id: '',
      title: '',
      learningObjectives: '',
      lessonContent: '',
      summary: '',
      orderIndex: '',
      durationMinutes: '',
      difficulty: 'EASY',
      status: 'DRAFT',
      chapterId: selectedChapterId,
    });
  };

  const handleDeleteGrade = () => {
    if (!selectedGradeId) return;
    if (!globalThis.confirm('Xác nhận xóa (soft delete) school grade này?')) return;
    deleteGradeMutation.mutate(selectedGradeId);
  };

  const handleDeleteSubject = () => {
    if (!selectedSubjectId) return;
    if (!globalThis.confirm('Xác nhận xóa (soft delete) subject này?')) return;
    deleteSubjectMutation.mutate(selectedSubjectId);
  };

  const handleDeleteChapter = () => {
    if (!selectedChapterId) return;
    if (!globalThis.confirm('Xác nhận xóa (soft delete) chapter này?')) return;
    deleteChapterMutation.mutate(selectedChapterId);
  };

  const handleDeleteLesson = () => {
    if (!selectedLessonId) return;
    if (!globalThis.confirm('Xác nhận xóa (soft delete) lesson này?')) return;
    deleteLessonMutation.mutate(selectedLessonId);
  };

  const getGradeLabel = (grade: SchoolGradeResponse) => `${grade.gradeLevel} - ${grade.name}`;
  const getSubjectLabel = (subject: SubjectResponse) => subject.name;
  const getChapterLabel = (chapter: ChapterResponse) => chapter.title;
  const getLessonLabel = (lesson: LessonResponse) => lesson.title;

  return (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      notificationCount={2}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="module-layout-container aas-page">
        <div className="aas-page__bg" aria-hidden="true" />
        <section className="module-page teacher-courses-page aas-page__content">
          <header className="aas-header">
            <div>
              <p className="aas-kicker">Admin</p>
              <h1>Cây học thuật</h1>
              <p>CRUD School Grade - Subject - Chapter - Lesson theo contract backend mới.</p>
            </div>
          </header>

          <div className="aas-grid">
            <article className="aas-card">
              <div className="aas-card__head">
                <h2>
                  <GraduationCap size={18} />
                  School Grade
                </h2>
                <span>{grades.length}</span>
              </div>
              <div className="aas-list">
                {grades.map((grade) => (
                  <button
                    key={grade.id}
                    type="button"
                    onClick={() => {
                      setSelectedGradeId(grade.id);
                      setSelectedSubjectId('');
                      setSelectedChapterId('');
                      setSelectedLessonId('');
                    }}
                    className={`aas-list__item${selectedGradeId === grade.id ? ' is-active' : ''}`}
                  >
                    <strong>{getGradeLabel(grade)}</strong>
                    <span>{grade.active ? 'active' : 'inactive'}</span>
                  </button>
                ))}
                {!gradesQuery.isLoading && grades.length === 0 && (
                  <p className="aas-empty">Chưa có school grade</p>
                )}
              </div>
              <form
                className="aas-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveGradeMutation.mutate();
                }}
              >
                <input
                  type="number"
                  min={1}
                  placeholder="Grade level"
                  value={gradeForm.gradeLevel}
                  onChange={(event) =>
                    setGradeForm((prev) => ({
                      ...prev,
                      gradeLevel: event.target.value === '' ? '' : Number(event.target.value),
                    }))
                  }
                />
                <input
                  type="text"
                  placeholder="Tên khối"
                  value={gradeForm.name}
                  onChange={(event) =>
                    setGradeForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
                <textarea
                  placeholder="Mô tả"
                  value={gradeForm.description}
                  onChange={(event) =>
                    setGradeForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
                <label className="aas-check">
                  <input
                    type="checkbox"
                    checked={gradeForm.active}
                    onChange={(event) =>
                      setGradeForm((prev) => ({ ...prev, active: event.target.checked }))
                    }
                  />
                  Active
                </label>
                <div className="aas-actions">
                  <button type="submit" disabled={saveGradeMutation.isPending}>
                    {gradeForm.id ? <Save size={14} /> : <Plus size={14} />}
                    {gradeForm.id ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                  <button type="button" className="ghost" onClick={resetGradeForm}>
                    Làm mới
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={handleDeleteGrade}
                    disabled={!selectedGradeId || deleteGradeMutation.isPending}
                  >
                    <Trash2 size={14} />
                    Xóa
                  </button>
                </div>
              </form>
            </article>

            <article className="aas-card">
              <div className="aas-card__head">
                <h2>
                  <BookOpen size={18} />
                  Subject
                </h2>
                <span>{subjects.length}</span>
              </div>
              <div className="aas-list">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => {
                      setSelectedSubjectId(subject.id);
                      setSelectedChapterId('');
                      setSelectedLessonId('');
                    }}
                    className={`aas-list__item${selectedSubjectId === subject.id ? ' is-active' : ''}`}
                  >
                    <strong>{getSubjectLabel(subject)}</strong>
                    <span>{subject.isActive === false ? 'inactive' : 'active'}</span>
                  </button>
                ))}
                {!subjectsQuery.isLoading && selectedGradeId && subjects.length === 0 && (
                  <p className="aas-empty">Khối này chưa có môn học</p>
                )}
                {!selectedGradeId && <p className="aas-empty">Chọn school grade trước</p>}
              </div>
              <form
                className="aas-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveSubjectMutation.mutate();
                }}
              >
                <select
                  value={subjectForm.schoolGradeId}
                  onChange={(event) =>
                    setSubjectForm((prev) => ({ ...prev, schoolGradeId: event.target.value }))
                  }
                >
                  <option value="">Chọn school grade</option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {getGradeLabel(grade)}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Tên môn học"
                  value={subjectForm.name}
                  onChange={(event) =>
                    setSubjectForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
                <textarea
                  placeholder="Mô tả môn học"
                  value={subjectForm.description}
                  onChange={(event) =>
                    setSubjectForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
                <div className="aas-inline-2">
                  <input
                    type="number"
                    placeholder="gradeMin"
                    value={subjectForm.gradeMin}
                    onChange={(event) =>
                      setSubjectForm((prev) => ({
                        ...prev,
                        gradeMin: event.target.value === '' ? '' : Number(event.target.value),
                      }))
                    }
                  />
                  <input
                    type="number"
                    placeholder="gradeMax"
                    value={subjectForm.gradeMax}
                    onChange={(event) =>
                      setSubjectForm((prev) => ({
                        ...prev,
                        gradeMax: event.target.value === '' ? '' : Number(event.target.value),
                      }))
                    }
                  />
                </div>
                <label className="aas-check">
                  <input
                    type="checkbox"
                    checked={subjectForm.isActive}
                    onChange={(event) =>
                      setSubjectForm((prev) => ({ ...prev, isActive: event.target.checked }))
                    }
                  />
                  Active
                </label>
                <div className="aas-actions">
                  <button
                    type="submit"
                    disabled={saveSubjectMutation.isPending || !selectedGradeId}
                  >
                    {subjectForm.id ? <Save size={14} /> : <Plus size={14} />}
                    {subjectForm.id ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                  <button type="button" className="ghost" onClick={resetSubjectForm}>
                    Làm mới
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={handleDeleteSubject}
                    disabled={!selectedSubjectId || deleteSubjectMutation.isPending}
                  >
                    <Trash2 size={14} />
                    Xóa
                  </button>
                </div>
              </form>
            </article>

            <article className="aas-card">
              <div className="aas-card__head">
                <h2>
                  <FolderTree size={18} />
                  Chapter
                </h2>
                <span>{chapters.length}</span>
              </div>
              <div className="aas-list">
                {chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    type="button"
                    onClick={() => {
                      setSelectedChapterId(chapter.id);
                      setSelectedLessonId('');
                    }}
                    className={`aas-list__item${selectedChapterId === chapter.id ? ' is-active' : ''}`}
                  >
                    <strong>{getChapterLabel(chapter)}</strong>
                    <span>order {chapter.orderIndex ?? '-'}</span>
                  </button>
                ))}
                {!chaptersQuery.isLoading && selectedSubjectId && chapters.length === 0 && (
                  <p className="aas-empty">Môn này chưa có chapter</p>
                )}
                {!selectedSubjectId && <p className="aas-empty">Chọn subject trước</p>}
              </div>
              <form
                className="aas-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveChapterMutation.mutate();
                }}
              >
                <input
                  type="text"
                  placeholder="Tên chapter"
                  value={chapterForm.title}
                  onChange={(event) =>
                    setChapterForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                />
                <textarea
                  placeholder="Mô tả chapter"
                  value={chapterForm.description}
                  onChange={(event) =>
                    setChapterForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
                <input
                  type="number"
                  placeholder="orderIndex"
                  value={chapterForm.orderIndex}
                  onChange={(event) =>
                    setChapterForm((prev) => ({
                      ...prev,
                      orderIndex: event.target.value === '' ? '' : Number(event.target.value),
                    }))
                  }
                />
                <div className="aas-actions">
                  <button
                    type="submit"
                    disabled={saveChapterMutation.isPending || !selectedSubjectId}
                  >
                    {chapterForm.id ? <Save size={14} /> : <Plus size={14} />}
                    {chapterForm.id ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                  <button type="button" className="ghost" onClick={resetChapterForm}>
                    Làm mới
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={handleDeleteChapter}
                    disabled={!selectedChapterId || deleteChapterMutation.isPending}
                  >
                    <Trash2 size={14} />
                    Xóa
                  </button>
                </div>
              </form>
            </article>

            <article className="aas-card">
              <div className="aas-card__head">
                <h2>
                  <BookText size={18} />
                  Lesson
                </h2>
                <span>{lessons.length}</span>
              </div>
              <div className="aas-filter">
                <input
                  type="search"
                  placeholder="Tìm theo tên bài học"
                  value={lessonSearch}
                  onChange={(event) => setLessonSearch(event.target.value)}
                />
              </div>
              <div className="aas-list">
                {lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => setSelectedLessonId(lesson.id)}
                    className={`aas-list__item${selectedLessonId === lesson.id ? ' is-active' : ''}`}
                  >
                    <strong>{getLessonLabel(lesson)}</strong>
                    <span>{lesson.status ?? 'DRAFT'}</span>
                  </button>
                ))}
                {!lessonsQuery.isLoading && selectedChapterId && lessons.length === 0 && (
                  <p className="aas-empty">Chapter này chưa có lesson</p>
                )}
                {!selectedChapterId && <p className="aas-empty">Chọn chapter trước</p>}
              </div>
              <form
                className="aas-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveLessonMutation.mutate();
                }}
              >
                <input
                  type="text"
                  placeholder="Tên lesson"
                  value={lessonForm.title}
                  onChange={(event) =>
                    setLessonForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                />
                <textarea
                  placeholder="Learning objectives"
                  value={lessonForm.learningObjectives}
                  onChange={(event) =>
                    setLessonForm((prev) => ({ ...prev, learningObjectives: event.target.value }))
                  }
                />
                <textarea
                  placeholder="Lesson content"
                  value={lessonForm.lessonContent}
                  onChange={(event) =>
                    setLessonForm((prev) => ({ ...prev, lessonContent: event.target.value }))
                  }
                />
                <textarea
                  placeholder="Summary"
                  value={lessonForm.summary}
                  onChange={(event) =>
                    setLessonForm((prev) => ({ ...prev, summary: event.target.value }))
                  }
                />
                <div className="aas-inline-2">
                  <input
                    type="number"
                    placeholder="orderIndex"
                    value={lessonForm.orderIndex}
                    onChange={(event) =>
                      setLessonForm((prev) => ({
                        ...prev,
                        orderIndex: event.target.value === '' ? '' : Number(event.target.value),
                      }))
                    }
                  />
                  <input
                    type="number"
                    placeholder="durationMinutes"
                    value={lessonForm.durationMinutes}
                    onChange={(event) =>
                      setLessonForm((prev) => ({
                        ...prev,
                        durationMinutes:
                          event.target.value === '' ? '' : Number(event.target.value),
                      }))
                    }
                  />
                </div>
                <div className="aas-inline-2">
                  <select
                    value={lessonForm.difficulty}
                    onChange={(event) =>
                      setLessonForm((prev) => ({
                        ...prev,
                        difficulty: event.target.value as LessonDifficulty,
                      }))
                    }
                  >
                    {LESSON_DIFFICULTY_OPTIONS.map((difficulty) => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty}
                      </option>
                    ))}
                  </select>
                  <select
                    value={lessonForm.status}
                    onChange={(event) =>
                      setLessonForm((prev) => ({
                        ...prev,
                        status: event.target.value as LessonStatus,
                      }))
                    }
                    disabled={!lessonForm.id}
                  >
                    {LESSON_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="aas-actions">
                  <button
                    type="submit"
                    disabled={saveLessonMutation.isPending || !selectedChapterId}
                  >
                    {lessonForm.id ? <Save size={14} /> : <Plus size={14} />}
                    {lessonForm.id ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                  <button type="button" className="ghost" onClick={resetLessonForm}>
                    Làm mới
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={handleDeleteLesson}
                    disabled={!selectedLessonId || deleteLessonMutation.isPending}
                  >
                    <Trash2 size={14} />
                    Xóa
                  </button>
                </div>
              </form>
            </article>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
