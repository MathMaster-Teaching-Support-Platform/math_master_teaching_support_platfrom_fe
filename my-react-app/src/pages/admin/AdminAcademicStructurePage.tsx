import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  BookText,
  ChevronDown,
  ChevronRight,
  FolderTree,
  GraduationCap,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import { mockAdmin } from '../../data/mockData';
import { useDebounce } from '../../hooks/useDebounce';
import { AcademicStructureService } from '../../services/api/academic-structure.service';
import { AcademicNodeModal } from './AcademicNodeModal';
import type { ModalTarget } from './AcademicNodeModal';
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

type EditorMode = 'program' | 'subject' | 'chapter' | 'lesson';

type NumberInput = number | '';

function parseOptionalNumber(value: NumberInput): number | undefined {
  if (value === '') return undefined;
  return Number(value);
}

function parseRequiredNumber(value: NumberInput): number {
  if (value === '') return 0;
  return Number(value);
}

function mapDeleteConstraintError(error: unknown): string {
  if (!(error instanceof Error)) return 'Thao tác bị từ chối bởi ràng buộc dữ liệu';
  const message = error.message || '';

  if (message.includes('CHAPTER_HAS_LESSONS')) {
    return 'Không thể vô hiệu hóa chương khi còn bài học';
  }
  if (message.includes('SUBJECT_HAS_CHAPTERS')) {
    return 'Không thể vô hiệu hóa môn học khi còn chương';
  }
  if (message.includes('SCHOOL_GRADE_HAS_SUBJECTS')) {
    return 'Không thể vô hiệu hóa chương trình khi còn môn học đang hoạt động';
  }

  return message;
}

export default function AdminAcademicStructurePage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [editorMode, setEditorMode] = useState<EditorMode>('program');
  const [expandedGradeIds, setExpandedGradeIds] = useState<string[]>([]);
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<string[]>([]);
  const [expandedChapterIds, setExpandedChapterIds] = useState<string[]>([]);
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null);

  const debouncedGlobalSearch = useDebounce(globalSearch, 300);

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
    queryKey: ['admin-academic', 'lessons', selectedChapterId, debouncedGlobalSearch],
    queryFn: () =>
      AcademicStructureService.getLessonsByChapter(selectedChapterId, debouncedGlobalSearch),
    enabled: Boolean(selectedChapterId),
  });

  const lessonsForDeleteQuery = useQuery({
    queryKey: ['admin-academic', 'lessons', selectedChapterId, '__all_for_delete__'],
    queryFn: () => AcademicStructureService.getLessonsByChapter(selectedChapterId),
    enabled: Boolean(selectedChapterId),
  });

  const grades = gradesQuery.data?.result ?? [];
  const subjects = subjectsQuery.data?.result ?? [];
  const chapters = chaptersQuery.data?.result ?? [];
  const lessons = lessonsQuery.data?.result ?? [];
  const allChapterLessons = lessonsForDeleteQuery.data?.result ?? [];

  const hasActiveSubjects = subjects.some((subject) => subject.isActive !== false);
  const hasChapters = chapters.length > 0;
  const hasLessons = allChapterLessons.length > 0;

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
    if (selectedLessonId) {
      setEditorMode('lesson');
      return;
    }
    if (selectedChapterId) {
      setEditorMode('chapter');
      return;
    }
    if (selectedSubjectId) {
      setEditorMode('subject');
      return;
    }
    setEditorMode('program');
  }, [selectedChapterId, selectedLessonId, selectedSubjectId]);

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
        throw new Error('Vui lòng nhập tên chương trình');
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
      setExpandedGradeIds((prev) => Array.from(new Set([...prev, response.result.id])));
      showToast({
        type: 'success',
        message: gradeForm.id ? 'Đã cập nhật chương trình' : 'Đã tạo chương trình mới',
      });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể lưu chương trình',
      });
    },
  });

  const saveSubjectMutation = useMutation({
    mutationFn: async () => {
      if (!subjectForm.name.trim()) {
        throw new Error('Vui lòng nhập tên môn học');
      }
      if (!subjectForm.schoolGradeId) {
        throw new Error('Vui lòng chọn lớp cho môn học');
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
      setExpandedSubjectIds((prev) => Array.from(new Set([...prev, response.result.id])));
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
      setExpandedChapterIds((prev) => Array.from(new Set([...prev, response.result.id])));
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
        queryKey: ['admin-academic', 'lessons', selectedChapterId, debouncedGlobalSearch],
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
      showToast({ type: 'success', message: 'Đã vô hiệu hóa chương trình' });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: mapDeleteConstraintError(error),
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
      showToast({ type: 'success', message: 'Đã vô hiệu hóa môn học' });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: mapDeleteConstraintError(error),
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
      showToast({ type: 'success', message: 'Đã vô hiệu hóa chương' });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: mapDeleteConstraintError(error),
      });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (lessonId: string) => AcademicStructureService.deleteLesson(lessonId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['admin-academic', 'lessons', selectedChapterId, debouncedGlobalSearch],
      });
      setSelectedLessonId('');
      showToast({ type: 'success', message: 'Đã vô hiệu hóa bài học' });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể vô hiệu hóa bài học',
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
    if (!globalThis.confirm('Xác nhận vô hiệu hóa chương trình này?')) return;
    deleteGradeMutation.mutate(selectedGradeId);
  };

  const handleDeleteSubject = () => {
    if (!selectedSubjectId) return;
    if (!globalThis.confirm('Xác nhận vô hiệu hóa môn học này?')) return;
    deleteSubjectMutation.mutate(selectedSubjectId);
  };

  const handleDeleteChapter = () => {
    if (!selectedChapterId) return;
    if (!globalThis.confirm('Xác nhận vô hiệu hóa chương này?')) return;
    deleteChapterMutation.mutate(selectedChapterId);
  };

  const handleDeleteLesson = () => {
    if (!selectedLessonId) return;
    if (!globalThis.confirm('Xác nhận vô hiệu hóa bài học này?')) return;
    deleteLessonMutation.mutate(selectedLessonId);
  };

  const openModal = (target: ModalTarget) => {
    setModalTarget(target);
  };

  const closeModal = () => {
    setModalTarget(null);
  };

  const handleModalSuccess = (type: ModalTarget['type'], id: string) => {
    switch (type) {
      case 'grade':
        setSelectedGradeId(id);
        setExpandedGradeIds((prev) => Array.from(new Set([...prev, id])));
        break;
      case 'subject':
        setSelectedSubjectId(id);
        setExpandedSubjectIds((prev) => Array.from(new Set([...prev, id])));
        break;
      case 'chapter':
        setSelectedChapterId(id);
        setExpandedChapterIds((prev) => Array.from(new Set([...prev, id])));
        break;
      case 'lesson':
        setSelectedLessonId(id);
        break;
    }
  };

  const toggleExpanded = (collection: string[], id: string) => {
    if (collection.includes(id)) {
      return collection.filter((item) => item !== id);
    }
    return [...collection, id];
  };

  const getGradeLabel = (grade: SchoolGradeResponse) => {
    const levelLabel = `Lớp ${grade.gradeLevel}`;
    const name = grade.name?.trim() ?? '';

    if (!name) return levelLabel;
    if (name.toLowerCase() === levelLabel.toLowerCase()) return levelLabel;

    return `${levelLabel} - ${name}`;
  };

  const getGradeTreeLabel = (grade: SchoolGradeResponse) => {
    if (grade.id !== gradeForm.id) return getGradeLabel(grade);

    const previewGrade: SchoolGradeResponse = {
      ...grade,
      gradeLevel: gradeForm.gradeLevel === '' ? grade.gradeLevel : Number(gradeForm.gradeLevel),
      name: gradeForm.name || grade.name,
    };

    return getGradeLabel(previewGrade);
  };

  const getSubjectLabel = (subject: SubjectResponse) => subject.name;
  const getSubjectTreeLabel = (subject: SubjectResponse) => {
    if (subject.id !== subjectForm.id) return getSubjectLabel(subject);
    return subjectForm.name.trim() || subject.name;
  };

  const getChapterLabel = (chapter: ChapterResponse) => chapter.title;
  const getChapterTreeLabel = (chapter: ChapterResponse) => {
    if (chapter.id !== chapterForm.id) return getChapterLabel(chapter);
    return chapterForm.title.trim() || chapter.title;
  };

  const getLessonLabel = (lesson: LessonResponse) => lesson.title;
  const getLessonTreeLabel = (lesson: LessonResponse) => {
    if (lesson.id !== lessonForm.id) return getLessonLabel(lesson);
    return lessonForm.title.trim() || lesson.title;
  };

  const normalizedGlobalSearch = debouncedGlobalSearch.trim().toLowerCase();
  const isGlobalSearching = normalizedGlobalSearch.length > 0;

  const matchesGlobalSearch = (value: string) =>
    value.toLowerCase().includes(normalizedGlobalSearch);

  const breadcrumbs = [
    selectedGrade ? getGradeLabel(selectedGrade) : 'Chọn chương trình',
    selectedSubject ? getSubjectLabel(selectedSubject) : 'Chọn môn học',
    selectedChapter ? getChapterLabel(selectedChapter) : 'Chọn chương',
    selectedLesson ? getLessonLabel(selectedLesson) : 'Chọn bài học',
  ];

  const draftPreview = (() => {
    if (editorMode === 'program' && !gradeForm.id) {
      const level = gradeForm.gradeLevel === '' ? 'Lớp ?' : `Lớp ${gradeForm.gradeLevel}`;
      const name = gradeForm.name.trim();
      return {
        icon: GraduationCap,
        label: name ? `${level} - ${name}` : level,
      };
    }

    if (editorMode === 'subject' && !subjectForm.id) {
      const name = subjectForm.name.trim();
      return {
        icon: BookOpen,
        label: name || 'Môn học mới',
      };
    }

    if (editorMode === 'chapter' && !chapterForm.id) {
      const title = chapterForm.title.trim();
      return {
        icon: FolderTree,
        label: title || 'Chương mới',
      };
    }

    if (editorMode === 'lesson' && !lessonForm.id) {
      const title = lessonForm.title.trim();
      return {
        icon: BookText,
        label: title || 'Bài học mới',
      };
    }

    return null;
  })();

  const renderProgramEditor = () => (
    <form
      className="aas-form"
      onSubmit={(event) => {
        event.preventDefault();
        saveGradeMutation.mutate();
      }}
    >
      <h3 className="aas-form__title">Chương trình</h3>
      <input
        type="number"
        min={1}
        placeholder="Lớp"
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
        placeholder="Tên chương trình"
        value={gradeForm.name}
        onChange={(event) => setGradeForm((prev) => ({ ...prev, name: event.target.value }))}
      />
      <textarea
        placeholder="Mô tả"
        value={gradeForm.description}
        onChange={(event) => setGradeForm((prev) => ({ ...prev, description: event.target.value }))}
      />
      {gradeForm.id && (
        <label className="aas-check">
          <input
            type="checkbox"
            checked={gradeForm.active}
            onChange={(event) =>
              setGradeForm((prev) => ({ ...prev, active: event.target.checked }))
            }
          />
          Đang hoạt động
        </label>
      )}
      <div className="aas-actions">
        <button type="submit" disabled={saveGradeMutation.isPending}>
          {gradeForm.id ? <Save size={14} /> : <Plus size={14} />}
          {gradeForm.id ? 'Lưu cập nhật' : 'Thêm mới'}
        </button>
        {gradeForm.id ? (
          <button type="button" className="ghost" onClick={resetGradeForm}>
            Tạo chương trình mới
          </button>
        ) : (
          <button
            type="button"
            className="ghost"
            onClick={() =>
              setGradeForm({ id: '', gradeLevel: '', name: '', description: '', active: true })
            }
          >
            Xóa trắng form
          </button>
        )}
        <button
          type="button"
          className="danger"
          onClick={handleDeleteGrade}
          disabled={
            !selectedGradeId ||
            deleteGradeMutation.isPending ||
            subjectsQuery.isLoading ||
            hasActiveSubjects
          }
        >
          <Trash2 size={14} />
          Vô hiệu hóa
        </button>
      </div>
      {selectedGradeId && hasActiveSubjects && (
        <p className="aas-helper">
          Không thể vô hiệu hóa vì chương trình vẫn còn môn học đang hoạt động.
        </p>
      )}
    </form>
  );

  const renderSubjectEditor = () => (
    <form
      className="aas-form"
      onSubmit={(event) => {
        event.preventDefault();
        saveSubjectMutation.mutate();
      }}
    >
      <h3 className="aas-form__title">Môn học</h3>
      <select
        value={subjectForm.schoolGradeId}
        onChange={(event) =>
          setSubjectForm((prev) => ({ ...prev, schoolGradeId: event.target.value }))
        }
      >
        <option value="">Chọn chương trình</option>
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
        onChange={(event) => setSubjectForm((prev) => ({ ...prev, name: event.target.value }))}
      />
      <textarea
        placeholder="Mô tả"
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
      {subjectForm.id && (
        <label className="aas-check">
          <input
            type="checkbox"
            checked={subjectForm.isActive}
            onChange={(event) =>
              setSubjectForm((prev) => ({ ...prev, isActive: event.target.checked }))
            }
          />
          Đang hoạt động
        </label>
      )}
      <div className="aas-actions">
        <button type="submit" disabled={saveSubjectMutation.isPending || !selectedGradeId}>
          {subjectForm.id ? <Save size={14} /> : <Plus size={14} />}
          {subjectForm.id ? 'Lưu cập nhật' : 'Thêm mới'}
        </button>
        {subjectForm.id ? (
          <button type="button" className="ghost" onClick={resetSubjectForm}>
            Tạo môn học mới
          </button>
        ) : (
          <button
            type="button"
            className="ghost"
            onClick={() =>
              setSubjectForm({
                id: '',
                name: '',
                description: '',
                gradeMin: '',
                gradeMax: '',
                isActive: true,
                schoolGradeId: selectedGradeId,
              })
            }
          >
            Xóa trắng form
          </button>
        )}
        <button
          type="button"
          className="danger"
          onClick={handleDeleteSubject}
          disabled={
            !selectedSubjectId ||
            deleteSubjectMutation.isPending ||
            chaptersQuery.isLoading ||
            hasChapters
          }
        >
          <Trash2 size={14} />
          Vô hiệu hóa
        </button>
      </div>
      {selectedSubjectId && hasChapters && (
        <p className="aas-helper">Không thể vô hiệu hóa vì môn học vẫn còn chương.</p>
      )}
    </form>
  );

  const renderChapterEditor = () => (
    <form
      className="aas-form"
      onSubmit={(event) => {
        event.preventDefault();
        saveChapterMutation.mutate();
      }}
    >
      <h3 className="aas-form__title">Chương</h3>
      <input
        type="text"
        placeholder="Tên chương"
        value={chapterForm.title}
        onChange={(event) => setChapterForm((prev) => ({ ...prev, title: event.target.value }))}
      />
      <textarea
        placeholder="Mô tả chương"
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
        <button type="submit" disabled={saveChapterMutation.isPending || !selectedSubjectId}>
          {chapterForm.id ? <Save size={14} /> : <Plus size={14} />}
          {chapterForm.id ? 'Lưu cập nhật' : 'Thêm mới'}
        </button>
        <button
          type="button"
          className="danger"
          onClick={handleDeleteChapter}
          disabled={
            !selectedChapterId ||
            deleteChapterMutation.isPending ||
            lessonsForDeleteQuery.isLoading ||
            hasLessons
          }
        >
          <Trash2 size={14} />
          Vô hiệu hóa
        </button>
      </div>
      {selectedChapterId && hasLessons && (
        <p className="aas-helper">Không thể vô hiệu hóa chương vì vẫn còn bài học.</p>
      )}
    </form>
  );

  const renderLessonEditor = () => (
    <form
      className="aas-form"
      onSubmit={(event) => {
        event.preventDefault();
        saveLessonMutation.mutate();
      }}
    >
      <h3 className="aas-form__title">Bài học</h3>
      <input
        type="text"
        placeholder="Tên bài học"
        value={lessonForm.title}
        onChange={(event) => setLessonForm((prev) => ({ ...prev, title: event.target.value }))}
      />
      <textarea
        placeholder="Mục tiêu học tập"
        value={lessonForm.learningObjectives}
        onChange={(event) =>
          setLessonForm((prev) => ({ ...prev, learningObjectives: event.target.value }))
        }
      />
      <textarea
        placeholder="Nội dung bài học"
        value={lessonForm.lessonContent}
        onChange={(event) =>
          setLessonForm((prev) => ({ ...prev, lessonContent: event.target.value }))
        }
      />
      <textarea
        placeholder="Tóm tắt"
        value={lessonForm.summary}
        onChange={(event) => setLessonForm((prev) => ({ ...prev, summary: event.target.value }))}
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
              durationMinutes: event.target.value === '' ? '' : Number(event.target.value),
            }))
          }
        />
      </div>
      <div className="aas-actions">
        <button type="submit" disabled={saveLessonMutation.isPending || !selectedChapterId}>
          {lessonForm.id ? <Save size={14} /> : <Plus size={14} />}
          {lessonForm.id ? 'Lưu cập nhật' : 'Thêm mới'}
        </button>
        {lessonForm.id ? (
          <button type="button" className="ghost" onClick={resetLessonForm}>
            Tạo bài học mới
          </button>
        ) : (
          <button
            type="button"
            className="ghost"
            onClick={() =>
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
              })
            }
          >
            Xóa trắng form
          </button>
        )}
        <button
          type="button"
          className="danger"
          onClick={handleDeleteLesson}
          disabled={!selectedLessonId || deleteLessonMutation.isPending}
        >
          <Trash2 size={14} />
          Vô hiệu hóa
        </button>
      </div>
    </form>
  );

  const renderEditor = () => {
    if (editorMode === 'subject') return renderSubjectEditor();
    if (editorMode === 'chapter') return renderChapterEditor();
    if (editorMode === 'lesson') return renderLessonEditor();
    return renderProgramEditor();
  };

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
          <div className="flex items-center justify-between gap-4 flex-wrap pb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8E6DC] text-[#5E5D59]">
                <FolderTree className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413]">
                    Quản lý chương trình
                  </h1>
                  {!gradesQuery.isLoading && (
                    <span className="inline-flex items-center rounded-full bg-[#E8E6DC] px-2 py-0.5 font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]">
                      {grades.length}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]">
                  Cấu trúc phân cấp Chương trình • Môn học • Chương • Bài học
                </p>
              </div>
            </div>
          </div>

          <div className="aas-layout">
            <article className="aas-tree-shell">
              <div className="aas-tree-shell__head">
                <h2>
                  <FolderTree size={18} />
                  Cây chương trình
                </h2>
                <div className="aas-tree-shell__head-actions">
                  <span>{grades.length} chương trình</span>
                  <button
                    type="button"
                    className="aas-add-btn"
                    onClick={() => openModal({ type: 'grade', mode: 'create' })}
                  >
                    <Plus size={12} />
                    Thêm lớp
                  </button>
                </div>
              </div>
              <div className="aas-search-wrap">
                <Search size={15} />
                <input
                  type="search"
                  placeholder="Tìm kiếm"
                  value={globalSearch}
                  onChange={(event) => setGlobalSearch(event.target.value)}
                />
              </div>
              <div className="aas-tree">
                {editorMode === 'program' && !gradeForm.id && (
                  <div className="aas-tree-node lvl-0">
                    <button type="button" className="aas-node-btn is-draft">
                      <Plus size={14} />
                      <GraduationCap size={14} />
                      <span>
                        {(() => {
                          const level =
                            gradeForm.gradeLevel === '' ? 'Lớp ?' : `Lớp ${gradeForm.gradeLevel}`;
                          const name = gradeForm.name.trim();
                          return name ? `${level} - ${name}` : level;
                        })()}
                      </span>
                    </button>
                  </div>
                )}

                {grades.map((grade) => {
                  const gradeOpen = expandedGradeIds.includes(grade.id) || isGlobalSearching;
                  const gradeActive = selectedGradeId === grade.id;
                  const gradeLabel = getGradeTreeLabel(grade);

                  const gradeMatchedByName = matchesGlobalSearch(gradeLabel);
                  const matchedSubjects = gradeActive
                    ? subjects.filter((subject) =>
                        matchesGlobalSearch(getSubjectTreeLabel(subject))
                      )
                    : [];
                  const matchedChapters = gradeActive
                    ? chapters.filter((chapter) =>
                        matchesGlobalSearch(getChapterTreeLabel(chapter))
                      )
                    : [];
                  const matchedLessons = gradeActive
                    ? lessons.filter((lesson) => matchesGlobalSearch(getLessonTreeLabel(lesson)))
                    : [];

                  if (
                    isGlobalSearching &&
                    !gradeMatchedByName &&
                    matchedSubjects.length === 0 &&
                    matchedChapters.length === 0 &&
                    matchedLessons.length === 0
                  ) {
                    return null;
                  }

                  const visibleSubjects = !isGlobalSearching
                    ? subjects
                    : subjects.filter(
                        (subject) =>
                          matchesGlobalSearch(getSubjectTreeLabel(subject)) ||
                          (subject.id === selectedSubjectId &&
                            (matchedChapters.length > 0 || matchedLessons.length > 0))
                      );

                  return (
                    <div key={grade.id} className="aas-tree-node lvl-0">
                      <div className="aas-node-row">
                        <button
                          type="button"
                          className={`aas-node-btn${gradeActive ? ' is-active' : ''}`}
                          onClick={() => {
                            setExpandedGradeIds((prev) => toggleExpanded(prev, grade.id));
                            setSelectedGradeId(grade.id);
                            setSelectedSubjectId('');
                            setSelectedChapterId('');
                            setSelectedLessonId('');
                          }}
                        >
                          {gradeOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <GraduationCap size={14} />
                          <span>{gradeLabel}</span>
                        </button>
                        <div className="aas-node-actions">
                          <button
                            type="button"
                            className="aas-node-action-btn"
                            title="Chỉnh sửa lớp"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal({ type: 'grade', mode: 'edit', data: grade });
                            }}
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            className="aas-node-action-btn aas-node-action-btn--add"
                            title="Thêm môn học"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGradeId(grade.id);
                              setExpandedGradeIds((prev) =>
                                Array.from(new Set([...prev, grade.id]))
                              );
                              openModal({
                                type: 'subject',
                                mode: 'create',
                                parentGradeId: grade.id,
                              });
                            }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>

                      {gradeOpen && (
                        <div className="aas-tree-children">
                          {gradeActive && editorMode === 'subject' && !subjectForm.id && (
                            <div className="aas-tree-node lvl-1">
                              <button type="button" className="aas-node-btn is-draft">
                                <Plus size={14} />
                                <BookOpen size={14} />
                                <span>{subjectForm.name.trim() || 'Môn học mới'}</span>
                              </button>
                            </div>
                          )}

                          {gradeActive &&
                            visibleSubjects.map((subject) => {
                              const subjectOpen =
                                expandedSubjectIds.includes(subject.id) || isGlobalSearching;
                              const subjectActive = selectedSubjectId === subject.id;
                              const subjectLabel = getSubjectTreeLabel(subject);

                              const visibleChapters = !isGlobalSearching
                                ? chapters
                                : chapters.filter(
                                    (chapter) =>
                                      matchesGlobalSearch(getChapterTreeLabel(chapter)) ||
                                      (chapter.id === selectedChapterId &&
                                        matchedLessons.length > 0)
                                  );

                              return (
                                <div key={subject.id} className="aas-tree-node lvl-1">
                                  <div className="aas-node-row">
                                    <button
                                      type="button"
                                      className={`aas-node-btn${subjectActive ? ' is-active' : ''}${subject.isActive === false ? ' is-inactive' : ''}`}
                                      onClick={() => {
                                        setExpandedSubjectIds((prev) =>
                                          toggleExpanded(prev, subject.id)
                                        );
                                        setSelectedSubjectId(subject.id);
                                        setSelectedChapterId('');
                                        setSelectedLessonId('');
                                      }}
                                    >
                                      {subjectOpen ? (
                                        <ChevronDown size={14} />
                                      ) : (
                                        <ChevronRight size={14} />
                                      )}
                                      <BookOpen size={14} />
                                      <span>{subjectLabel}</span>
                                      {subject.isActive === false && (
                                        <span className="aas-inactive-badge">Tắt</span>
                                      )}
                                    </button>
                                    <div className="aas-node-actions">
                                      <button
                                        type="button"
                                        className="aas-node-action-btn"
                                        title="Chỉnh sửa môn học"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openModal({
                                            type: 'subject',
                                            mode: 'edit',
                                            data: subject,
                                            parentGradeId: subject.schoolGradeId ?? selectedGradeId,
                                          });
                                        }}
                                      >
                                        <Pencil size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        className="aas-node-action-btn aas-node-action-btn--add"
                                        title="Thêm chương"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedSubjectId(subject.id);
                                          setExpandedSubjectIds((prev) =>
                                            Array.from(new Set([...prev, subject.id]))
                                          );
                                          openModal({
                                            type: 'chapter',
                                            mode: 'create',
                                            parentSubjectId: subject.id,
                                          });
                                        }}
                                      >
                                        <Plus size={12} />
                                      </button>
                                    </div>
                                  </div>

                                  {subjectOpen && subjectActive && (
                                    <div className="aas-tree-children">
                                      {editorMode === 'chapter' && !chapterForm.id && (
                                        <div className="aas-tree-node lvl-2">
                                          <button type="button" className="aas-node-btn is-draft">
                                            <Plus size={14} />
                                            <FolderTree size={14} />
                                            <span>{chapterForm.title.trim() || 'Chương mới'}</span>
                                          </button>
                                        </div>
                                      )}

                                      {visibleChapters.map((chapter) => {
                                        const chapterOpen =
                                          expandedChapterIds.includes(chapter.id) ||
                                          isGlobalSearching;
                                        const chapterActive = selectedChapterId === chapter.id;
                                        const chapterLabel = getChapterTreeLabel(chapter);

                                        const visibleLessons = !isGlobalSearching
                                          ? lessons
                                          : lessons.filter((lesson) =>
                                              matchesGlobalSearch(getLessonTreeLabel(lesson))
                                            );

                                        return (
                                          <div key={chapter.id} className="aas-tree-node lvl-2">
                                            <div className="aas-node-row">
                                              <button
                                                type="button"
                                                className={`aas-node-btn${chapterActive ? ' is-active' : ''}`}
                                                onClick={() => {
                                                  setExpandedChapterIds((prev) =>
                                                    toggleExpanded(prev, chapter.id)
                                                  );
                                                  setSelectedChapterId(chapter.id);
                                                  setSelectedLessonId('');
                                                }}
                                              >
                                                {chapterOpen ? (
                                                  <ChevronDown size={14} />
                                                ) : (
                                                  <ChevronRight size={14} />
                                                )}
                                                <FolderTree size={14} />
                                                <span>{chapterLabel}</span>
                                              </button>
                                              <div className="aas-node-actions">
                                                <button
                                                  type="button"
                                                  className="aas-node-action-btn"
                                                  title="Chỉnh sửa chương"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    openModal({
                                                      type: 'chapter',
                                                      mode: 'edit',
                                                      data: chapter,
                                                      parentSubjectId: chapter.subjectId,
                                                    });
                                                  }}
                                                >
                                                  <Pencil size={12} />
                                                </button>
                                                <button
                                                  type="button"
                                                  className="aas-node-action-btn aas-node-action-btn--add"
                                                  title="Thêm bài học"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedChapterId(chapter.id);
                                                    setExpandedChapterIds((prev) =>
                                                      Array.from(new Set([...prev, chapter.id]))
                                                    );
                                                    openModal({
                                                      type: 'lesson',
                                                      mode: 'create',
                                                      parentChapterId: chapter.id,
                                                    });
                                                  }}
                                                >
                                                  <Plus size={12} />
                                                </button>
                                              </div>
                                            </div>

                                            {chapterOpen && chapterActive && (
                                              <div className="aas-tree-children">
                                                {editorMode === 'lesson' && !lessonForm.id && (
                                                  <div className="aas-tree-node lvl-3">
                                                    <button
                                                      type="button"
                                                      className="aas-node-btn is-draft"
                                                    >
                                                      <Plus size={14} />
                                                      <BookText size={14} />
                                                      <span>
                                                        {lessonForm.title.trim() || 'Bài học mới'}
                                                      </span>
                                                    </button>
                                                  </div>
                                                )}

                                                {visibleLessons.map((lesson) => (
                                                  <div
                                                    key={lesson.id}
                                                    className="aas-tree-node lvl-3"
                                                  >
                                                    <div className="aas-node-row">
                                                      <button
                                                        type="button"
                                                        className={`aas-node-btn${selectedLessonId === lesson.id ? ' is-active' : ''}`}
                                                        onClick={() =>
                                                          setSelectedLessonId(lesson.id)
                                                        }
                                                      >
                                                        <BookText size={14} />
                                                        <span>{getLessonTreeLabel(lesson)}</span>
                                                      </button>
                                                      <div className="aas-node-actions">
                                                        <button
                                                          type="button"
                                                          className="aas-node-action-btn"
                                                          title="Chỉnh sửa bài học"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            openModal({
                                                              type: 'lesson',
                                                              mode: 'edit',
                                                              data: lesson,
                                                              parentChapterId: lesson.chapterId,
                                                            });
                                                          }}
                                                        >
                                                          <Pencil size={12} />
                                                        </button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                                {!lessonsQuery.isLoading &&
                                                  lessons.length === 0 && (
                                                    <p className="aas-empty">
                                                      Chương này chưa có bài học
                                                    </p>
                                                  )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                      {!chaptersQuery.isLoading && chapters.length === 0 && (
                                        <p className="aas-empty">Môn này chưa có chương</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          {gradeActive && !subjectsQuery.isLoading && subjects.length === 0 && (
                            <p className="aas-empty">Chương trình này chưa có môn học</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {!gradesQuery.isLoading && grades.length === 0 && (
                  <p className="aas-empty">Chưa có chương trình nào</p>
                )}
              </div>
            </article>

            <article className="aas-editor-shell">
              <div className="aas-editor-shell__head">
                <h2>Trình chỉnh sửa</h2>
                <p>{breadcrumbs.join(' / ')}</p>
              </div>

              <div className="aas-editor-tabs">
                <button
                  type="button"
                  className={editorMode === 'program' ? 'is-active' : ''}
                  onClick={() => setEditorMode('program')}
                >
                  Chương trình
                </button>
                <button
                  type="button"
                  className={editorMode === 'subject' ? 'is-active' : ''}
                  onClick={() => setEditorMode('subject')}
                  disabled={!selectedGradeId}
                >
                  Môn học
                </button>
                <button
                  type="button"
                  className={editorMode === 'chapter' ? 'is-active' : ''}
                  onClick={() => setEditorMode('chapter')}
                  disabled={!selectedSubjectId}
                >
                  Chương
                </button>
                <button
                  type="button"
                  className={editorMode === 'lesson' ? 'is-active' : ''}
                  onClick={() => setEditorMode('lesson')}
                  disabled={!selectedChapterId}
                >
                  Bài học
                </button>
              </div>

              {draftPreview && (
                <div className="aas-draft-preview" aria-label="Xem trước mục đang tạo">
                  <span className="aas-draft-preview__label">Xem trước:</span>
                  <div className="aas-draft-preview__chip">
                    <draftPreview.icon size={14} />
                    <span>{draftPreview.label}</span>
                  </div>
                </div>
              )}

              <div className="aas-editor-card">{renderEditor()}</div>
            </article>
          </div>
        </section>
      </div>

      <AcademicNodeModal
        target={modalTarget}
        grades={grades}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
      />
    </DashboardLayout>
  );
}
