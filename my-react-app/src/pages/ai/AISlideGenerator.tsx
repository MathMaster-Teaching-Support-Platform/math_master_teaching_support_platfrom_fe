import { useQuery, useQueryClient } from '@tanstack/react-query';
import 'katex/dist/katex.min.css';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileStack,
  Globe,
  Layers,
  Lock,
  Pencil,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { mockTeacher } from '../../data/mockData';
import { AuthService } from '../../services/api/auth.service';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import { notifySubscriptionUpdated } from '../../services/api/subscription-plan.service';
import type { LessonResponse } from '../../types/lesson.types';
import type {
  ChapterBySubject,
  GenerateSlideContentResult,
  LessonByChapter,
  LessonSlideEquationMode,
  LessonSlideGeneratedFile,
  LessonSlideItem,
  LessonSlideOutputFormat,
  LessonSlideTemplate,
  SchoolGrade,
  SubjectByGrade,
} from '../../types/lessonSlide.types';
import './AISlideGenerator.css';

const LoadingSpinner: React.FC<{ label: string }> = ({ label }) => (
  <span
    className="inline-flex items-center gap-2 font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]"
    role="status"
    aria-live="polite"
  >
    <span
      className="w-3.5 h-3.5 rounded-full border-2 border-[#E8E6DC] border-t-[#7C6FAB] animate-spin flex-shrink-0"
      aria-hidden="true"
    />
    {label}
  </span>
);

const getTemplatePreviewUrl = (templateId: string, previewImage?: string | null): string => {
  if (previewImage && /^https?:\/\//i.test(previewImage)) {
    return previewImage;
  }
  if (previewImage) {
    const normalizedPath = previewImage.startsWith('/') ? previewImage : `/${previewImage}`;
    return `${API_BASE_URL}${normalizedPath}`;
  }
  // Fallback: use teacher-accessible endpoint by template ID
  return `${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_TEMPLATE_PREVIEW_IMAGE(templateId)}`;
};

const normalizeVietnameseHeading = (heading?: string | null): string => {
  const value = (heading || '').trim();
  if (!value) return '';

  const openingMatch = value.match(/^khoi\s+dong$/i);
  if (openingMatch) {
    return 'Khởi động';
  }

  const mainContentMatch = value.match(/^noi\s+dung\s+chinh(\s+\d+)?$/i);
  if (mainContentMatch) {
    return `Nội dung chính${mainContentMatch[1] || ''}`;
  }

  return heading || '';
};

const normalizeSlideItem = (slide: unknown, index: number): LessonSlideItem => {
  const item = (slide ?? {}) as Partial<LessonSlideItem> & {
    preview_image_url?: string | null;
    previewUrl?: string | null;
    imageUrl?: string | null;
  };

  return {
    slideNumber: Number(item.slideNumber) || index + 1,
    slideType: item.slideType || 'MAIN_CONTENT',
    heading: normalizeVietnameseHeading(item.heading),
    content: (item.content || '').replace(/\\n/g, '\n'),
    previewImageUrl:
      item.previewImageUrl || item.preview_image_url || item.previewUrl || item.imageUrl || null,
  };
};

type MathSegment =
  | { type: 'text'; value: string }
  | { type: 'inline-math'; value: string }
  | { type: 'block-math'; value: string };

const parseSlidesFromLessonContent = (lessonContent?: string | null): LessonSlideItem[] => {
  if (!lessonContent) return [];

  try {
    const parsed = JSON.parse(lessonContent) as unknown;

    let rawSlides: unknown[] = [];

    if (Array.isArray(parsed)) {
      rawSlides = parsed;
    } else if (parsed && typeof parsed === 'object') {
      const container = parsed as { slides?: unknown; result?: { slides?: unknown } };
      if (Array.isArray(container.slides)) {
        rawSlides = container.slides;
      } else if (Array.isArray(container.result?.slides)) {
        rawSlides = container.result.slides;
      }
    }

    return rawSlides.map((slide, index) => normalizeSlideItem(slide, index));
  } catch {
    return [];
  }
};

const normalizeOutputFormat = (value?: string): LessonSlideOutputFormat => {
  if (value === 'LATEX' || value === 'HYBRID') {
    return value;
  }

  return 'PLAIN_TEXT';
};

const supportsMathRendering = (outputFormat: LessonSlideOutputFormat): boolean =>
  outputFormat === 'LATEX' || outputFormat === 'HYBRID';

const OUTPUT_FORMAT_LABELS: Record<LessonSlideOutputFormat, string> = {
  PLAIN_TEXT: 'Text',
  LATEX: 'Latex',
  HYBRID: 'Hybrid',
};

const EQUATION_MODE_LABELS: Record<LessonSlideEquationMode, string> = {
  OMML: 'OMML (Office Equation)',
  IMAGE: 'Image (render cong thuc thanh anh)',
  PLAIN_TEXT: 'Plain Text',
};

const getOutputFormatLabel = (format: LessonSlideOutputFormat): string =>
  OUTPUT_FORMAT_LABELS[format];

const getEquationModeLabel = (mode: LessonSlideEquationMode): string => EQUATION_MODE_LABELS[mode];

const formatFileSize = (sizeInBytes: number): string => {
  if (!Number.isFinite(sizeInBytes) || sizeInBytes < 0) return '--';
  if (sizeInBytes < 1024) return `${sizeInBytes} B`;
  if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return '--';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString('vi-VN');
};

const getGeneratedDisplayName = (file: LessonSlideGeneratedFile): string => {
  const preferredName = file.name?.trim();
  if (preferredName) return preferredName;
  const fallbackName = (file.fileName || '').trim();
  return fallbackName.replace(/\.[^/.]+$/, '') || 'generated-slide';
};

const parseMathSegments = (text: string): MathSegment[] => {
  if (!text) return [{ type: 'text', value: '' }];

  const segments: MathSegment[] = [];
  const mathRegex = /\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined || match[3] !== undefined) {
      segments.push({ type: 'block-math', value: (match[1] ?? match[3] ?? '').trim() });
    } else {
      segments.push({ type: 'inline-math', value: (match[2] ?? match[4] ?? '').trim() });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments.length ? segments : [{ type: 'text', value: text }];
};

const normalizePreviewText = (input: string): string => {
  if (!input) return input;

  return (
    input
      // Backend may return escaped latex commands (e.g. \\vec), normalize to \vec.
      .replace(/\\\\(?=[a-zA-Z])/g, '\\')
      // Preserve latex line-break markers as real line breaks in text preview.
      .replace(/\\\\(?=\s|$)/g, '\n')
      .replace(/\\\\\\\\/g, '\\')
      .replace(/^khoi\s+dong\b/gim, 'Khởi động')
      .replace(/\\begin\{itemize\}/gi, '')
      .replace(/\\end\{itemize\}/gi, '')
      .replace(/\\item\s*/g, '\n• ')
      .replace(/\\textbf\{([^{}]+)\}/g, '$1')
      .replace(/\\textit\{([^{}]+)\}/g, '$1')
      .replace(/\\emph\{([^{}]+)\}/g, '$1')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\n[ \t]+/g, '\n')
      .trim()
  );
};

const renderSlideText = (
  text: string,
  outputFormat: LessonSlideOutputFormat,
  keyPrefix: string
): React.ReactNode => {
  if (!text) return null;
  const normalizedText = normalizePreviewText(text);

  if (!supportsMathRendering(outputFormat)) {
    return normalizedText;
  }

  return parseMathSegments(normalizedText).map((segment, index) => {
    const key = `${keyPrefix}-${index}`;

    if (segment.type === 'text') {
      return <span key={key}>{segment.value}</span>;
    }

    if (segment.type === 'block-math') {
      return (
        <span key={key} className="ai-slide-math-block">
          <BlockMath math={segment.value} />
        </span>
      );
    }

    return <InlineMath key={key} math={segment.value} />;
  });
};

const AISlideGenerator: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [subjects, setSubjects] = useState<SubjectByGrade[]>([]);
  const [chapters, setChapters] = useState<ChapterBySubject[]>([]);
  const [lessons, setLessons] = useState<LessonByChapter[]>([]);

  const [schoolGradeId, setSchoolGradeId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [lessonId, setLessonId] = useState('');

  const [slideCount, setSlideCount] = useState(10);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [outputFormat, setOutputFormat] = useState<LessonSlideOutputFormat>('PLAIN_TEXT');
  const [equationMode] = useState<LessonSlideEquationMode>('OMML');
  const [templateId, setTemplateId] = useState('');
  const [templatePreviewBlobUrls, setTemplatePreviewBlobUrls] = useState<Record<string, string>>(
    {}
  );
  const [loadingTemplatePreviews, setLoadingTemplatePreviews] = useState(false);
  const templatePreviewObjectUrlsRef = useRef<string[]>([]);

  const [generated, setGenerated] = useState<GenerateSlideContentResult | null>(null);
  const [editableSlides, setEditableSlides] = useState<LessonSlideItem[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [renderingPreviewSlideNumber, setRenderingPreviewSlideNumber] = useState<number | null>(
    null
  );
  const [preparedPptxBlob, setPreparedPptxBlob] = useState<Blob | null>(null);
  const [preparedPptxFilename, setPreparedPptxFilename] = useState('lesson-slides.pptx');
  const [newSlideName, setNewSlideName] = useState('');
  const [newSlideThumbnailFile, setNewSlideThumbnailFile] = useState<File | null>(null);
  const [newSlideThumbnailPreview, setNewSlideThumbnailPreview] = useState<string | null>(null);

  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [generatingPptx, setGeneratingPptx] = useState(false);
  const schoolGradesQuery = useQuery({
    queryKey: ['lesson-slide', 'school-grades', 'ai-slide-generator'],
    queryFn: () => LessonSlideService.getSchoolGrades(true),
    staleTime: 5 * 60_000,
  });
  const templatesQuery = useQuery({
    queryKey: ['lesson-slide', 'templates', 'ai-slide-generator'],
    queryFn: () => LessonSlideService.getTemplates(true),
    staleTime: 5 * 60_000,
  });
  const schoolGrades: SchoolGrade[] = schoolGradesQuery.data?.result || [];
  const templates: LessonSlideTemplate[] = templatesQuery.data?.result || [];
  const loadingGrades = schoolGradesQuery.isLoading || schoolGradesQuery.isFetching;
  const loadingTemplates = templatesQuery.isLoading || templatesQuery.isFetching;

  const [activeMainTab, setActiveMainTab] = useState<'GENERATE' | 'MANAGE'>('GENERATE');
  const [activeWizardStep, setActiveWizardStep] = useState(1);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedFiles, setGeneratedFiles] = useState<LessonSlideGeneratedFile[]>([]);
  const [lessonTitleById, setLessonTitleById] = useState<Record<string, string>>({});
  const [generatedVisibilityFilter, setGeneratedVisibilityFilter] = useState<
    'ALL' | 'PUBLIC' | 'PRIVATE'
  >('ALL');
  const [generatedSearch, setGeneratedSearch] = useState('');
  const [generatedSort, setGeneratedSort] = useState<
    'NEWEST' | 'OLDEST' | 'NAME_ASC' | 'NAME_DESC' | 'SIZE_DESC' | 'SIZE_ASC' | 'PUBLIC_FIRST'
  >('NEWEST');
  const [selectedGeneratedFileId, setSelectedGeneratedFileId] = useState('');
  const [selectedGeneratedLesson, setSelectedGeneratedLesson] = useState<LessonResponse | null>(
    null
  );
  const [loadingGeneratedFiles, setLoadingGeneratedFiles] = useState(false);
  const [loadingSelectedGeneratedLesson, setLoadingSelectedGeneratedLesson] = useState(false);
  const [downloadingGeneratedFileId, setDownloadingGeneratedFileId] = useState('');
  const [deletingGeneratedFileId, setDeletingGeneratedFileId] = useState('');
  const [deletingGeneratedFile, setDeletingGeneratedFile] =
    useState<LessonSlideGeneratedFile | null>(null);
  const [generatedPage, setGeneratedPage] = useState(1);
  const [generatedPageSize, setGeneratedPageSize] = useState(12);
  const [isGeneratedPreviewOpen, setIsGeneratedPreviewOpen] = useState(false);
  const [loadingGeneratedPreviewPdf, setLoadingGeneratedPreviewPdf] = useState(false);
  const [openingGeneratedPreviewPdfTab, setOpeningGeneratedPreviewPdfTab] = useState(false);
  const [generatedPreviewPdfUrl, setGeneratedPreviewPdfUrl] = useState('');
  const [previewIframeLoaded, setPreviewIframeLoaded] = useState(false);
  const [generatedPreviewIndex, setGeneratedPreviewIndex] = useState(0);
  const generatedPreviewPdfObjectUrlRef = useRef<string | null>(null);
  const [generatedThumbnailUrls, setGeneratedThumbnailUrls] = useState<Record<string, string>>({});
  const generatedThumbnailObjectUrlsRef = useRef<string[]>([]);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
  const [editingMetadataFile, setEditingMetadataFile] = useState<LessonSlideGeneratedFile | null>(
    null
  );
  const [metadataName, setMetadataName] = useState('');
  const [metadataThumbnailFile, setMetadataThumbnailFile] = useState<File | null>(null);
  const [metadataIsPublic, setMetadataIsPublic] = useState(false);
  const [updatingMetadata, setUpdatingMetadata] = useState(false);
  const previewRenderRequestSeqRef = useRef(0);
  const previewRenderTimerRef = useRef<number | null>(null);
  const lastAutoPreviewSignatureRef = useRef('');

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === lessonId),
    [lessons, lessonId]
  );

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === templateId),
    [templates, templateId]
  );

  const currentPreviewSlide = useMemo(
    () => editableSlides[activePreviewIndex] || null,
    [editableSlides, activePreviewIndex]
  );

  const selectedGeneratedFile = useMemo(
    () => generatedFiles.find((file) => file.id === selectedGeneratedFileId) || null,
    [generatedFiles, selectedGeneratedFileId]
  );

  const generatedPreviewSlides = useMemo(
    () => parseSlidesFromLessonContent(selectedGeneratedLesson?.lessonContent),
    [selectedGeneratedLesson?.lessonContent]
  );

  const currentGeneratedPreviewSlide = useMemo(
    () => generatedPreviewSlides[generatedPreviewIndex] || null,
    [generatedPreviewIndex, generatedPreviewSlides]
  );

  const managedGeneratedFiles = useMemo(() => {
    const normalizedSearch = generatedSearch.trim().toLowerCase();

    let files = [...generatedFiles];

    if (generatedVisibilityFilter === 'PUBLIC') {
      files = files.filter((file) => file.isPublic);
    } else if (generatedVisibilityFilter === 'PRIVATE') {
      files = files.filter((file) => !file.isPublic);
    }

    if (normalizedSearch) {
      files = files.filter((file) => {
        const fileName = getGeneratedDisplayName(file).toLowerCase();
        const lesson = (file.lessonId || '').toLowerCase();
        return fileName.includes(normalizedSearch) || lesson.includes(normalizedSearch);
      });
    }

    const getTime = (value?: string | null) => new Date(value || 0).getTime() || 0;

    files.sort((a, b) => {
      switch (generatedSort) {
        case 'OLDEST':
          return getTime(a.createdAt) - getTime(b.createdAt);
        case 'NAME_ASC':
          return getGeneratedDisplayName(a).localeCompare(getGeneratedDisplayName(b));
        case 'NAME_DESC':
          return getGeneratedDisplayName(b).localeCompare(getGeneratedDisplayName(a));
        case 'SIZE_ASC':
          return a.fileSizeBytes - b.fileSizeBytes;
        case 'SIZE_DESC':
          return b.fileSizeBytes - a.fileSizeBytes;
        case 'PUBLIC_FIRST':
          if (a.isPublic === b.isPublic) return getTime(b.createdAt) - getTime(a.createdAt);
          return a.isPublic ? -1 : 1;
        case 'NEWEST':
        default:
          return getTime(b.createdAt) - getTime(a.createdAt);
      }
    });

    return files;
  }, [generatedFiles, generatedSearch, generatedSort, generatedVisibilityFilter]);

  const totalManagedGeneratedPages = useMemo(
    () => Math.max(1, Math.ceil(managedGeneratedFiles.length / generatedPageSize)),
    [managedGeneratedFiles.length, generatedPageSize]
  );

  const pagedManagedGeneratedFiles = useMemo(() => {
    const start = (generatedPage - 1) * generatedPageSize;
    const end = start + generatedPageSize;
    return managedGeneratedFiles.slice(start, end);
  }, [generatedPage, managedGeneratedFiles, generatedPageSize]);

  const openMetadataModal = (file: LessonSlideGeneratedFile) => {
    setEditingMetadataFile(file);
    setMetadataName(file.name || '');
    setMetadataThumbnailFile(null);
    setMetadataIsPublic(file.isPublic ?? false);
    setIsMetadataModalOpen(true);
    setError('');
    setSuccess('');
  };

  const closeMetadataModal = () => {
    if (updatingMetadata) return;
    setIsMetadataModalOpen(false);
    setEditingMetadataFile(null);
    setMetadataName('');
    setMetadataThumbnailFile(null);
    setMetadataIsPublic(false);
  };

  const handleUpdateMetadata = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingMetadataFile) return;

    setUpdatingMetadata(true);
    setError('');
    setSuccess('');

    try {
      await LessonSlideService.updateGeneratedFileMetadata(editingMetadataFile.id, {
        name: metadataName.trim(),
        thumbnail: metadataThumbnailFile || undefined,
      });

      if (metadataIsPublic !== (editingMetadataFile.isPublic ?? false)) {
        if (metadataIsPublic) {
          await LessonSlideService.publishGeneratedFile(editingMetadataFile.id);
        } else {
          await LessonSlideService.unpublishGeneratedFile(editingMetadataFile.id);
        }
      }

      setSuccess('Đã cập nhật slide thành công.');
      closeMetadataModal();
      await queryClient.invalidateQueries({ queryKey: ['lesson-slides'] });
      await loadGeneratedFiles(lessonId || undefined);
    } catch (err) {
      const apiError = err as Error & { code?: number };
      if (apiError.code === 1166) {
        setError('File slide không còn tồn tại. Vui lòng refresh danh sách.');
      } else if (apiError.code === 1167) {
        setError('Bạn không có quyền cập nhật metadata của file này.');
      } else {
        setError(err instanceof Error ? err.message : 'Không thể cập nhật metadata slide');
      }
    } finally {
      setUpdatingMetadata(false);
    }
  };

  const resolvedOutputFormat = useMemo(
    () => normalizeOutputFormat(generated?.outputFormat || outputFormat),
    [generated?.outputFormat, outputFormat]
  );

  const showSubjectStep = Boolean(schoolGradeId);
  const showChapterStep = Boolean(subjectId);
  const showLessonStep = Boolean(chapterId);

  const canConfigureAi = Boolean(lessonId);
  const canChooseTemplate = canConfigureAi;
  const visualWizardStep = Math.min(activeWizardStep, 5);
  const wizardSteps = [
    'Chọn bài dạy',
    'Chọn template',
    'Tạo nội dung',
    'Xác nhận nội dung',
    'Tải file PPTX',
  ];

  const clearGeneratedData = () => {
    setGenerated(null);
    setEditableSlides([]);
    setActivePreviewIndex(0);
    setPreparedPptxBlob(null);
    setPreparedPptxFilename('lesson-slides.pptx');
    setNewSlideName('');
    if (newSlideThumbnailPreview) window.URL.revokeObjectURL(newSlideThumbnailPreview);
    setNewSlideThumbnailFile(null);
    setNewSlideThumbnailPreview(null);
    setActiveWizardStep(1);
  };

  const selectedGeneratedFileIdRef = useRef(selectedGeneratedFileId);
  selectedGeneratedFileIdRef.current = selectedGeneratedFileId;

  const loadGeneratedFiles = useCallback(
    async (targetLessonId?: string, options?: { showLoading?: boolean }) => {
      const showLoading = options?.showLoading ?? true;
      if (showLoading) {
        setLoadingGeneratedFiles(true);
      }

      try {
        const response = await LessonSlideService.getGeneratedFiles(targetLessonId);
        const files = response.result || [];
        setGeneratedFiles(files);

        if (files.length === 0) {
          setSelectedGeneratedFileId('');
          setSelectedGeneratedLesson(null);
        } else if (!files.some((file) => file.id === selectedGeneratedFileIdRef.current)) {
          setSelectedGeneratedFileId(files[0].id);
        }
      } catch (err) {
        setGeneratedFiles([]);
        setSelectedGeneratedFileId('');
        setSelectedGeneratedLesson(null);
        setError(
          err instanceof Error ? err.message : 'Không thể tải danh sách file slide đã generate'
        );
      } finally {
        if (showLoading) {
          setLoadingGeneratedFiles(false);
        }
      }
    },
    []
  );

  const loadLessonDetailFromGeneratedFile = useCallback(
    async (generatedFile: LessonSlideGeneratedFile) => {
      setLoadingSelectedGeneratedLesson(true);

      try {
        const response = await LessonSlideService.getTeacherLessonSlideByLessonId(
          generatedFile.lessonId
        );
        setSelectedGeneratedLesson(response.result);
      } catch (err) {
        setSelectedGeneratedLesson(null);
        setError(
          err instanceof Error ? err.message : 'Không thể tải lesson của file slide đã chọn'
        );
      } finally {
        setLoadingSelectedGeneratedLesson(false);
      }
    },
    []
  );

  const triggerBlobDownload = (blob: Blob, fileName: string) => {
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || 'generated-slide.pptx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

  const handleDownloadGeneratedFile = async (generatedFileId: string) => {
    setDownloadingGeneratedFileId(generatedFileId);
    setError('');
    setSuccess('');

    try {
      const response = await LessonSlideService.downloadGeneratedFile(generatedFileId);
      triggerBlobDownload(response.blob, response.filename || 'generated-slide.pptx');
      setSuccess('Đã tải lại file slide đã generate thành công.');
    } catch (err) {
      const apiError = err as Error & { code?: number };
      if (apiError.code === 1166) {
        setError('File slide đã generate không còn tồn tại. Vui lòng refresh danh sách.');
      } else if (apiError.code === 1167) {
        setError('Bạn không có quyền tải file này.');
      } else {
        setError(err instanceof Error ? err.message : 'Không thể tải file slide đã generate');
      }
    } finally {
      setDownloadingGeneratedFileId('');
    }
  };

  const handleRequestDeleteGeneratedFile = (generatedFileId: string) => {
    const targetFile = generatedFiles.find((file) => file.id === generatedFileId) || null;
    if (!targetFile) {
      setError('Không tìm thấy file để xóa. Vui lòng refresh danh sách.');
      return;
    }

    setDeletingGeneratedFile(targetFile);
    setError('');
    setSuccess('');
  };

  const closeDeleteGeneratedModal = () => {
    if (deletingGeneratedFileId) return;
    setDeletingGeneratedFile(null);
  };

  const handleDeleteGeneratedFile = async () => {
    if (!deletingGeneratedFile) return;
    const generatedFileId = deletingGeneratedFile.id;
    const targetLessonId = lessonId || undefined;

    setDeletingGeneratedFileId(generatedFileId);
    setError('');
    setSuccess('');

    try {
      await LessonSlideService.deleteGeneratedFile(generatedFileId);

      setGeneratedFiles((prev) => prev.filter((file) => file.id !== generatedFileId));
      setGeneratedThumbnailUrls((prev) => {
        const next = { ...prev };
        delete next[generatedFileId];
        return next;
      });

      if (selectedGeneratedFileId === generatedFileId) {
        setSelectedGeneratedFileId('');
        setSelectedGeneratedLesson(null);
        setGeneratedPreviewIndex(0);
      }

      if (isGeneratedPreviewOpen && selectedGeneratedFileId === generatedFileId) {
        setIsGeneratedPreviewOpen(false);
      }

      setDeletingGeneratedFile(null);
      setSuccess('Đã xóa slide thành công.');
      await queryClient.invalidateQueries({ queryKey: ['lesson-slides'] });
      await loadGeneratedFiles(targetLessonId, { showLoading: false });
    } catch (err) {
      const apiError = err as Error & { code?: number };
      if (apiError.code === 1166) {
        setError('File slide không còn tồn tại hoặc đã bị xóa. Vui lòng refresh danh sách.');
      } else if (apiError.code === 1167) {
        setError('Bạn không có quyền xóa file này. Chỉ owner hoặc ADMIN mới được xóa.');
      } else {
        setError(err instanceof Error ? err.message : 'Không thể xóa file slide đã generate');
      }
    } finally {
      setDeletingGeneratedFileId('');
    }
  };

  const handleOpenGeneratedPreview = (generatedFileId?: string) => {
    const targetFile = generatedFileId
      ? generatedFiles.find((file) => file.id === generatedFileId) || null
      : selectedGeneratedFile;

    if (!targetFile) {
      setError('Vui lòng chọn 1 file trước khi xem trước.');
      return;
    }

    if (targetFile.id !== selectedGeneratedFileId) {
      setSelectedGeneratedFileId(targetFile.id);
    }

    setGeneratedPreviewIndex(0);
    if (generatedPreviewPdfObjectUrlRef.current) {
      window.URL.revokeObjectURL(generatedPreviewPdfObjectUrlRef.current);
      generatedPreviewPdfObjectUrlRef.current = null;
    }
    setGeneratedPreviewPdfUrl('');
    setIsGeneratedPreviewOpen(true);
    setError('');
    setSuccess('');

    if (selectedGeneratedLesson?.id !== targetFile.lessonId) {
      void loadLessonDetailFromGeneratedFile(targetFile);
    }
  };

  const loadGeneratedPreviewPdf = useCallback(async (generatedFileId: string) => {
    setLoadingGeneratedPreviewPdf(true);

    try {
      const response = await LessonSlideService.getGeneratedFilePreviewPdf(generatedFileId);
      const blobUrl = window.URL.createObjectURL(response.blob);

      if (generatedPreviewPdfObjectUrlRef.current) {
        window.URL.revokeObjectURL(generatedPreviewPdfObjectUrlRef.current);
      }

      generatedPreviewPdfObjectUrlRef.current = blobUrl;
      setPreviewIframeLoaded(false);
      setGeneratedPreviewPdfUrl(blobUrl);
    } catch {
      if (generatedPreviewPdfObjectUrlRef.current) {
        window.URL.revokeObjectURL(generatedPreviewPdfObjectUrlRef.current);
        generatedPreviewPdfObjectUrlRef.current = null;
      }
      setGeneratedPreviewPdfUrl('');
    } finally {
      setLoadingGeneratedPreviewPdf(false);
    }
  }, []);

  const handleOpenGeneratedPreviewInNewTab = useCallback(async () => {
    if (!selectedGeneratedFile) {
      setError('Vui lòng chọn 1 file trước khi mở tab mới.');
      return;
    }

    setOpeningGeneratedPreviewPdfTab(true);
    setError('');
    setSuccess('');

    try {
      let pdfUrl = generatedPreviewPdfUrl;

      if (!pdfUrl) {
        const response = await LessonSlideService.getGeneratedFilePreviewPdf(
          selectedGeneratedFile.id
        );
        const blobUrl = window.URL.createObjectURL(response.blob);

        if (generatedPreviewPdfObjectUrlRef.current) {
          window.URL.revokeObjectURL(generatedPreviewPdfObjectUrlRef.current);
        }

        generatedPreviewPdfObjectUrlRef.current = blobUrl;
        setGeneratedPreviewPdfUrl(blobUrl);
        pdfUrl = blobUrl;
      }

      if (!pdfUrl) {
        throw new Error('Không tạo được URL mở preview.');
      }

      const newTab = window.open(pdfUrl, '_blank', 'noopener,noreferrer');

      if (!newTab) {
        throw new Error('Trình duyệt đã chặn popup. Hãy cho phép mở tab mới rồi thử lại.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể mở preview trong tab mới');
    } finally {
      setOpeningGeneratedPreviewPdfTab(false);
    }
  }, [generatedPreviewPdfUrl, selectedGeneratedFile]);

  useEffect(() => {
    if (schoolGradesQuery.error instanceof Error) {
      setError(schoolGradesQuery.error.message);
    }
  }, [schoolGradesQuery.error]);

  useEffect(() => {
    if (templatesQuery.error instanceof Error) {
      setError(templatesQuery.error.message);
    }
  }, [templatesQuery.error]);

  useEffect(() => {
    if (!templates.length) {
      setTemplateId('');
      return;
    }

    if (!templateId || !templates.some((template) => template.id === templateId)) {
      setTemplateId(templates[0].id);
    }
  }, [templates, templateId]);

  useEffect(() => {
    return () => {
      templatePreviewObjectUrlsRef.current.forEach((url) => {
        window.URL.revokeObjectURL(url);
      });
    };
  }, []);

  useEffect(() => {
    void loadGeneratedFiles(lessonId || undefined);
  }, [lessonId, loadGeneratedFiles]);

  useEffect(() => {
    if (!selectedGeneratedFile) {
      setSelectedGeneratedLesson(null);
      if (generatedPreviewPdfObjectUrlRef.current) {
        window.URL.revokeObjectURL(generatedPreviewPdfObjectUrlRef.current);
        generatedPreviewPdfObjectUrlRef.current = null;
      }
      setGeneratedPreviewPdfUrl('');
      return;
    }

    void loadLessonDetailFromGeneratedFile(selectedGeneratedFile);

    if (isGeneratedPreviewOpen) {
      void loadGeneratedPreviewPdf(selectedGeneratedFile.id);
    }
  }, [
    isGeneratedPreviewOpen,
    selectedGeneratedFile,
    loadLessonDetailFromGeneratedFile,
    loadGeneratedPreviewPdf,
  ]);

  useEffect(() => {
    return () => {
      if (generatedPreviewPdfObjectUrlRef.current) {
        window.URL.revokeObjectURL(generatedPreviewPdfObjectUrlRef.current);
        generatedPreviewPdfObjectUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadGeneratedThumbnails = async () => {
      const targets = generatedFiles.filter((file) => Boolean(file.thumbnail));
      if (!targets.length) {
        generatedThumbnailObjectUrlsRef.current.forEach((url) => window.URL.revokeObjectURL(url));
        generatedThumbnailObjectUrlsRef.current = [];
        setGeneratedThumbnailUrls({});
        return;
      }

      const nextUrls: Record<string, string> = {};
      await Promise.all(
        targets.map(async (file) => {
          try {
            const blob = await LessonSlideService.getGeneratedFileThumbnailImage(file.id);
            if (cancelled) return;
            const objectUrl = window.URL.createObjectURL(blob);
            nextUrls[file.id] = objectUrl;
          } catch {
            // Ignore failed thumbnail and keep fallback UI.
          }
        })
      );

      if (cancelled) {
        Object.values(nextUrls).forEach((url) => window.URL.revokeObjectURL(url));
        return;
      }

      generatedThumbnailObjectUrlsRef.current.forEach((url) => window.URL.revokeObjectURL(url));
      generatedThumbnailObjectUrlsRef.current = Object.values(nextUrls);
      setGeneratedThumbnailUrls(nextUrls);
    };

    void loadGeneratedThumbnails();

    return () => {
      cancelled = true;
    };
  }, [generatedFiles]);

  useEffect(() => {
    return () => {
      generatedThumbnailObjectUrlsRef.current.forEach((url) => window.URL.revokeObjectURL(url));
      generatedThumbnailObjectUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!isGeneratedPreviewOpen) {
      return;
    }

    const handleEscClose = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsGeneratedPreviewOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscClose);
    return () => {
      window.removeEventListener('keydown', handleEscClose);
    };
  }, [isGeneratedPreviewOpen]);

  useEffect(() => {
    const missingLessonIds = Array.from(
      new Set(
        managedGeneratedFiles
          .map((file) => file.lessonId)
          .filter((id) => id && !lessonTitleById[id])
      )
    );

    if (!missingLessonIds.length) {
      return;
    }

    let cancelled = false;

    const loadLessonTitles = async () => {
      const entries = await Promise.all(
        missingLessonIds.map(async (targetLessonId) => {
          try {
            const response =
              await LessonSlideService.getTeacherLessonSlideByLessonId(targetLessonId);
            return [targetLessonId, response.result?.title || targetLessonId] as const;
          } catch {
            return [targetLessonId, targetLessonId] as const;
          }
        })
      );

      if (cancelled) return;

      setLessonTitleById((prev) => {
        const next = { ...prev };
        entries.forEach(([id, title]) => {
          next[id] = title;
        });
        return next;
      });
    };

    void loadLessonTitles();

    return () => {
      cancelled = true;
    };
  }, [managedGeneratedFiles, lessonTitleById]);

  useEffect(() => {
    setGeneratedPage(1);
  }, [lessonId, generatedSearch, generatedSort, generatedVisibilityFilter, generatedPageSize]);

  useEffect(() => {
    setGeneratedPage((prev) => Math.min(prev, totalManagedGeneratedPages));
  }, [totalManagedGeneratedPages]);

  useEffect(() => {
    const previewsToLoad = templates;

    if (!previewsToLoad.length) {
      templatePreviewObjectUrlsRef.current.forEach((url) => {
        window.URL.revokeObjectURL(url);
      });
      templatePreviewObjectUrlsRef.current = [];
      setTemplatePreviewBlobUrls({});
      setLoadingTemplatePreviews(false);
      return;
    }

    const token = AuthService.getToken();
    if (!token) {
      setTemplatePreviewBlobUrls({});
      setLoadingTemplatePreviews(false);
      return;
    }

    const abortController = new AbortController();
    let committed = false;
    const transientUrls: string[] = [];

    const loadTemplatePreviews = async () => {
      setLoadingTemplatePreviews(true);

      try {
        const nextUrls: Record<string, string> = {};

        await Promise.all(
          previewsToLoad.map(async (template) => {
            const previewUrl = getTemplatePreviewUrl(template.id, template.previewImage);

            const response = await fetch(previewUrl, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                accept: '*/*',
              },
              signal: abortController.signal,
            });

            if (!response.ok) return;

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            transientUrls.push(blobUrl);
            nextUrls[template.id] = blobUrl;
          })
        );

        if (abortController.signal.aborted) return;

        templatePreviewObjectUrlsRef.current.forEach((url) => {
          window.URL.revokeObjectURL(url);
        });
        templatePreviewObjectUrlsRef.current = Object.values(nextUrls);
        setTemplatePreviewBlobUrls(nextUrls);
        committed = true;
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          setTemplatePreviewBlobUrls({});
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoadingTemplatePreviews(false);
        }
      }
    };

    void loadTemplatePreviews();

    return () => {
      abortController.abort();

      if (!committed) {
        transientUrls.forEach((url) => {
          window.URL.revokeObjectURL(url);
        });
      }
    };
  }, [templates]);

  const handleSchoolGradeChange = async (value: string) => {
    setSchoolGradeId(value);
    setSubjectId('');
    setChapterId('');
    setLessonId('');
    setSubjects([]);
    setChapters([]);
    setLessons([]);
    clearGeneratedData();
    setSuccess('');
    setError('');

    if (!value) return;

    setLoadingSubjects(true);
    try {
      const response = await LessonSlideService.getSubjectsBySchoolGrade(value);
      setSubjects(response.result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách môn học');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleSubjectChange = async (value: string) => {
    setSubjectId(value);
    setChapterId('');
    setLessonId('');
    setChapters([]);
    setLessons([]);
    clearGeneratedData();
    setSuccess('');
    setError('');

    if (!value) return;

    setLoadingChapters(true);
    try {
      const response = await LessonSlideService.getChaptersBySubject(value);
      setChapters(response.result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách chương');
    } finally {
      setLoadingChapters(false);
    }
  };

  const handleChapterChange = async (value: string) => {
    setChapterId(value);
    setLessonId('');
    setLessons([]);
    clearGeneratedData();
    setSuccess('');
    setError('');

    if (!value) return;

    setLoadingLessons(true);
    try {
      const response = await LessonSlideService.getLessonsByChapter(value);
      setLessons(response.result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách bài học');
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleGenerateContent = async () => {
    setError('');
    setSuccess('');

    if (!schoolGradeId || !subjectId || !chapterId || !lessonId) {
      setError('Vui lòng chọn đầy đủ Lớp, Môn, Chương và Bài học trước khi tạo nội dung.');
      return;
    }

    if (slideCount < 5 || slideCount > 15) {
      setError('Số lượng slide phải nằm trong khoảng từ 5 đến 15.');
      return;
    }

    const trimmedPrompt = additionalPrompt.trim();
    if (!trimmedPrompt) {
      setError('Additional Prompt là bắt buộc. Vui lòng nhập mô tả để AI tạo nội dung.');
      return;
    }

    setGeneratingContent(true);
    try {
      const response = await LessonSlideService.generateContent({
        schoolGradeId,
        subjectId,
        chapterId,
        lessonId,
        slideCount,
        additionalPrompt: trimmedPrompt,
        outputFormat,
      });

      const normalizedResult: GenerateSlideContentResult = {
        ...response.result,
        outputFormat: normalizeOutputFormat(response.result.outputFormat),
        slides: (response.result.slides || []).map((slide, index) =>
          normalizeSlideItem(slide, index)
        ),
      };

      setGenerated(normalizedResult);
      setEditableSlides(normalizedResult.slides || []);
      setActivePreviewIndex(0);
      setPreparedPptxBlob(null);
      setPreparedPptxFilename('lesson-slides.pptx');
      notifySubscriptionUpdated();
      setSuccess('Đã tạo nội dung slide bằng AI. Vui lòng kiểm tra và confirm nội dung.');
      setActiveWizardStep(4);
      await loadGeneratedFiles(response.result.lessonId);
    } catch (err) {
      const apiError = err as Error & { code?: number };
      if (apiError.code === 1164) {
        setError('Ban chua co goi active. Vui long mua goi truoc khi dung AI Slide.');
        if (window.confirm('Ban chua co goi active. Mo trang mua goi ngay?')) {
          navigate('/pricing');
        }
      } else if (apiError.code === 1165) {
        setError('Token khong du (Slide can 3 token/lan). Vui long mua goi hoac nap them vi.');
        if (window.confirm('Token khong du. Mo trang vi de nap tien?')) {
          navigate('/teacher/wallet');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Không thể tạo nội dung slide');
      }
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleSlideChange = (index: number, field: 'heading' | 'content', value: string) => {
    setEditableSlides((prev) =>
      prev.map((slide, i) => (i === index ? { ...slide, [field]: value } : slide))
    );
  };

  const renderSlidePreview = useCallback(
    async (slideIndex: number, slideSnapshot?: LessonSlideItem, options?: { silent?: boolean }) => {
      const targetSlide = slideSnapshot;
      if (!targetSlide || !lessonId || !templateId) return;

      const requestSeq = ++previewRenderRequestSeqRef.current;
      setRenderingPreviewSlideNumber(targetSlide.slideNumber);

      try {
        const previewImageUrl = await LessonSlideService.renderSlidePreview({
          lessonId,
          templateId,
          outputFormat: resolvedOutputFormat,
          equationMode: resolvedOutputFormat === 'LATEX' ? undefined : equationMode,
          slideNumber: targetSlide.slideNumber,
          slide: {
            ...targetSlide,
            heading: targetSlide.heading || '',
            content: targetSlide.content || '',
          },
          slides: [
            {
              ...targetSlide,
              heading: targetSlide.heading || '',
              content: targetSlide.content || '',
            },
          ],
          // Hint backend to expand LaTeX rendered area to reduce clipping.
          renderHints: {
            expandWidthPt: 72,
            expandHeightPt: 36,
          },
        });

        if (requestSeq !== previewRenderRequestSeqRef.current) return;

        setEditableSlides((prev) =>
          prev.map((slide, index) =>
            slide.slideNumber === targetSlide.slideNumber || index === slideIndex
              ? {
                  ...slide,
                  previewImageUrl,
                }
              : slide
          )
        );
      } catch (err) {
        if (!options?.silent) {
          setError(err instanceof Error ? err.message : 'Không thể cập nhật ảnh preview cho slide');
        }
      } finally {
        if (requestSeq === previewRenderRequestSeqRef.current) {
          setRenderingPreviewSlideNumber(null);
        }
      }
    },
    [equationMode, lessonId, resolvedOutputFormat, templateId]
  );

  useEffect(() => {
    if (activeWizardStep !== 4 || !currentPreviewSlide || !lessonId || !templateId) {
      lastAutoPreviewSignatureRef.current = '';
      return;
    }

    const nextSignature = [
      activePreviewIndex,
      currentPreviewSlide.slideNumber,
      currentPreviewSlide.heading,
      currentPreviewSlide.content,
      lessonId,
      templateId,
      resolvedOutputFormat,
    ].join('::');

    if (lastAutoPreviewSignatureRef.current === nextSignature) {
      return;
    }

    lastAutoPreviewSignatureRef.current = nextSignature;

    if (previewRenderTimerRef.current) {
      window.clearTimeout(previewRenderTimerRef.current);
    }

    previewRenderTimerRef.current = window.setTimeout(() => {
      void renderSlidePreview(activePreviewIndex, currentPreviewSlide, { silent: true });
    }, 700);

    return () => {
      if (previewRenderTimerRef.current) {
        window.clearTimeout(previewRenderTimerRef.current);
        previewRenderTimerRef.current = null;
      }
    };
  }, [
    activePreviewIndex,
    activeWizardStep,
    currentPreviewSlide,
    lessonId,
    renderSlidePreview,
    resolvedOutputFormat,
    templateId,
  ]);

  const handlePreparePptx = async () => {
    setError('');
    setSuccess('');

    if (!lessonId) {
      setError('Vui lòng chọn bài học trước khi tạo PPTX.');
      return;
    }

    if (!templateId) {
      setError('Vui long chon template truoc khi tao PPTX.');
      return;
    }

    if (!editableSlides.length) {
      setError('Chưa có nội dung slide. Vui lòng bấm Tạo nội dung AI trước.');
      return;
    }

    setGeneratingPptx(true);
    try {
      const outputFormatForPptx: LessonSlideOutputFormat = resolvedOutputFormat;
      const slidesForPptx = editableSlides.map((slide) => ({
        ...slide,
        heading: slide.heading || '',
        content: slide.content || '',
      }));

      const response = await LessonSlideService.generatePptx({
        lessonId,
        templateId,
        outputFormat: outputFormatForPptx,
        equationMode: outputFormatForPptx === 'LATEX' ? undefined : equationMode,
        slides: slidesForPptx,
      });

      setPreparedPptxBlob(response.blob);
      setPreparedPptxFilename(response.filename || 'lesson-slides.pptx');

      // Apply name / thumbnail on the newly created file
      if (newSlideName.trim() || newSlideThumbnailFile) {
        try {
          const prevIds = new Set(generatedFiles.map((f) => f.id));
          const freshRes = await LessonSlideService.getGeneratedFiles(lessonId);
          const freshFiles = freshRes.result || [];
          const newFile = freshFiles.find((f) => !prevIds.has(f.id));
          if (newFile) {
            await LessonSlideService.updateGeneratedFileMetadata(newFile.id, {
              name: newSlideName.trim() || undefined,
              thumbnail: newSlideThumbnailFile || undefined,
            });
          }
          setGeneratedFiles(freshFiles);
        } catch {
          // non-blocking
        }
      }

      setSuccess(
        outputFormatForPptx === 'LATEX'
          ? 'PPTX đã sẵn sàng! Đã xuất theo chế độ LATEX.'
          : `PPTX đã sẵn sàng! Chế độ công thức: ${getEquationModeLabel(equationMode)}.`
      );
      setActiveWizardStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo PPTX');
    } finally {
      setGeneratingPptx(false);
    }
  };

  const handleDownloadPreparedPptx = () => {
    if (!preparedPptxBlob) {
      setError('Chưa có file PPTX sẵn sàng. Vui lòng bấm Confirm tạo PPTX trước.');
      return;
    }

    const blobUrl = window.URL.createObjectURL(preparedPptxBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = preparedPptxFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
    setSuccess('Đã tải file PPTX về máy thành công.');
    void loadGeneratedFiles(lessonId || undefined);
  };

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: mockTeacher.name, avatar: mockTeacher.avatar!, role: 'teacher' }}
      notificationCount={5}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
        <div className="space-y-6">
          {/* â”€â”€ Page header â”€â”€ */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413]">
                  Slide
                </h1>
                <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5">
                  {generatedFiles.length > 0
                    ? `${generatedFiles.length} file đã tạo`
                    : 'Tạo bài giảng với AI hỗ trợ'}
                </p>
              </div>
            </div>
          </div>

          {/* â”€â”€ Main tabs â”€â”€ */}
          <div
            className="flex items-center gap-1 p-1 bg-[#F0EEE6] rounded-xl w-fit"
            role="tablist"
            aria-label="Chế độ AI Slide"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeMainTab === 'GENERATE'}
              className={
                activeMainTab === 'GENERATE'
                  ? 'bg-[#141413] text-[#FAF9F5] rounded-lg px-3.5 py-1.5 font-[Be_Vietnam_Pro] text-[13px] font-semibold'
                  : 'bg-transparent text-[#5E5D59] rounded-lg px-3.5 py-1.5 font-[Be_Vietnam_Pro] text-[13px] font-medium hover:bg-[#E8E6DC] hover:text-[#141413] transition-colors duration-150'
              }
              onClick={() => setActiveMainTab('GENERATE')}
            >
              Tạo slide
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMainTab === 'MANAGE'}
              className={
                activeMainTab === 'MANAGE'
                  ? 'bg-[#141413] text-[#FAF9F5] rounded-lg px-3.5 py-1.5 font-[Be_Vietnam_Pro] text-[13px] font-semibold'
                  : 'bg-transparent text-[#5E5D59] rounded-lg px-3.5 py-1.5 font-[Be_Vietnam_Pro] text-[13px] font-medium hover:bg-[#E8E6DC] hover:text-[#141413] transition-colors duration-150'
              }
              onClick={() => setActiveMainTab('MANAGE')}
            >
              Thư viện slide
            </button>
          </div>

          {/* â”€â”€ Stepper â”€â”€ */}
          {activeMainTab === 'GENERATE' && (
            <ol className="flex items-center gap-0" aria-label="Tiến trình tạo slide">
              {wizardSteps.map((stepLabel, index) => {
                const stepNumber = index + 1;
                const isDone = visualWizardStep > stepNumber;
                const isActive = visualWizardStep === stepNumber;

                return (
                  <React.Fragment key={stepLabel}>
                    <li
                      className="flex items-center gap-2"
                      aria-current={isActive ? 'step' : undefined}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-[Be_Vietnam_Pro] text-[11px] font-bold flex-shrink-0 ${
                          isDone
                            ? 'bg-[#5E5D59] text-[#FAF9F5]'
                            : isActive
                              ? 'bg-[#7C6FAB] text-[#FAF9F5]'
                              : 'bg-[#E8E6DC] text-[#87867F]'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : stepNumber}
                      </div>
                      <span
                        className={`font-[Be_Vietnam_Pro] text-[12px] hidden sm:block ${
                          isActive
                            ? 'text-[#141413] font-semibold'
                            : isDone
                              ? 'text-[#5E5D59]'
                              : 'text-[#87867F]'
                        }`}
                      >
                        {stepLabel}
                      </span>
                    </li>
                    {index < wizardSteps.length - 1 && (
                      <div
                        className="flex-1 h-px bg-[#E8E6DC] mx-2 min-w-[12px]"
                        aria-hidden="true"
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </ol>
          )}

          {/* â”€â”€ Global status messages â”€â”€ */}
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle className="w-4 h-4 text-[#B53333] mt-0.5 flex-shrink-0" />
              <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#B53333]">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-3 px-4 py-3 bg-[#ECFDF5] border border-green-100 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-[#2EAD7A] mt-0.5 flex-shrink-0" />
              <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#2EAD7A]">{success}</p>
            </div>
          )}

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              STEP 1 â€” Chọn bài dạy
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeMainTab === 'GENERATE' && activeWizardStep === 1 && (
            <div className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F0EEE6] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-[Playfair_Display] text-[20px] font-medium text-[#141413]">
                    Chọn bài dạy
                  </h2>
                  <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                    Chọn lớp, môn, chương và bài học
                  </p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {/* Grade */}
                <div>
                  <label className="font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#141413] block mb-1.5">
                    Lớp
                  </label>
                  <select
                    value={schoolGradeId}
                    onChange={(e) => void handleSchoolGradeChange(e.target.value)}
                    disabled={loadingGrades}
                    className="w-full border border-[#E8E6DC] rounded-xl px-3 py-2.5 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#3898EC] focus:ring-2 focus:ring-[#3898EC]/20 bg-white transition-all duration-150 disabled:bg-[#F5F4ED] disabled:text-[#87867F]"
                  >
                    <option value="">-- Chọn lớp --</option>
                    {schoolGrades.map((grade) => (
                      <option key={grade.id} value={grade.id}>
                        {grade.name}
                      </option>
                    ))}
                  </select>
                  {loadingGrades && (
                    <div className="mt-1.5">
                      <LoadingSpinner label="Đang tải danh sách lớp..." />
                    </div>
                  )}
                </div>

                {/* Subject */}
                {showSubjectStep && (
                  <div>
                    <label className="font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#141413] block mb-1.5">
                      Môn học
                    </label>
                    <select
                      value={subjectId}
                      onChange={(e) => void handleSubjectChange(e.target.value)}
                      disabled={loadingSubjects}
                      className="w-full border border-[#E8E6DC] rounded-xl px-3 py-2.5 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#3898EC] focus:ring-2 focus:ring-[#3898EC]/20 bg-white transition-all duration-150 disabled:bg-[#F5F4ED] disabled:text-[#87867F]"
                    >
                      <option value="">-- Chọn môn học --</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                    {loadingSubjects && (
                      <div className="mt-1.5">
                        <LoadingSpinner label="Đang tải môn học..." />
                      </div>
                    )}
                    {!loadingSubjects && subjects.length === 0 && (
                      <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-1.5">
                        Lớp này chưa có môn học.
                      </p>
                    )}
                  </div>
                )}

                {/* Chapter */}
                {showChapterStep && (
                  <div>
                    <label className="font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#141413] block mb-1.5">
                      Chương
                    </label>
                    <select
                      value={chapterId}
                      onChange={(e) => void handleChapterChange(e.target.value)}
                      disabled={loadingChapters}
                      className="w-full border border-[#E8E6DC] rounded-xl px-3 py-2.5 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#3898EC] focus:ring-2 focus:ring-[#3898EC]/20 bg-white transition-all duration-150 disabled:bg-[#F5F4ED] disabled:text-[#87867F]"
                    >
                      <option value="">-- Chọn chương --</option>
                      {chapters.map((chapter) => (
                        <option key={chapter.id} value={chapter.id}>
                          {chapter.orderIndex}. {chapter.title}
                        </option>
                      ))}
                    </select>
                    {loadingChapters && (
                      <div className="mt-1.5">
                        <LoadingSpinner label="Đang tải chương..." />
                      </div>
                    )}
                    {!loadingChapters && chapters.length === 0 && (
                      <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-1.5">
                        Môn học này chưa có chương.
                      </p>
                    )}
                  </div>
                )}

                {/* Lesson */}
                {showLessonStep && (
                  <div>
                    <label className="font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#141413] block mb-1.5">
                      Bài học
                    </label>
                    <select
                      value={lessonId}
                      onChange={(e) => {
                        const nextLessonId = e.target.value;
                        setLessonId(nextLessonId);
                        clearGeneratedData();
                        setSuccess('');
                        setError('');
                        if (nextLessonId) {
                          void loadGeneratedFiles(nextLessonId);
                        } else {
                          setSelectedGeneratedLesson(null);
                          void loadGeneratedFiles();
                        }
                      }}
                      disabled={loadingLessons}
                      className="w-full border border-[#E8E6DC] rounded-xl px-3 py-2.5 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#3898EC] focus:ring-2 focus:ring-[#3898EC]/20 bg-white transition-all duration-150 disabled:bg-[#F5F4ED] disabled:text-[#87867F]"
                    >
                      <option value="">-- Chọn bài học --</option>
                      {lessons.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.orderIndex}. {lesson.title}
                        </option>
                      ))}
                    </select>
                    {loadingLessons && (
                      <div className="mt-1.5">
                        <LoadingSpinner label="Đang tải bài học..." />
                      </div>
                    )}
                    {!loadingLessons && lessons.length === 0 && (
                      <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-1.5">
                        Chương này chưa có bài học.
                      </p>
                    )}
                  </div>
                )}

                {/* Selected summary */}
                {selectedLesson && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#F0EEE6] rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#7C6FAB] flex-shrink-0" />
                    <span className="font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59]">
                      Bài học đã chọn:{' '}
                      <strong className="text-[#141413]">{selectedLesson.title}</strong>
                    </span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    disabled={!canConfigureAi}
                    onClick={() => setActiveWizardStep(2)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C6FAB] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Tiếp tục: Chọn template <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              STEP 2 â€” Chọn template
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeMainTab === 'GENERATE' && activeWizardStep === 2 && (
            <div className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F0EEE6] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-[Playfair_Display] text-[20px] font-medium text-[#141413]">
                      Chọn template
                    </h2>
                    <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                      Chọn bố cục slide cho bài giảng
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveWizardStep(1)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8E6DC] text-[#4D4C48] font-[Be_Vietnam_Pro] text-[13px] font-medium hover:bg-[#D1CFC5] active:scale-[0.98] transition-all duration-150"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Quay lại
                </button>
              </div>

              <fieldset className="p-6 space-y-5" disabled={!canChooseTemplate}>
                {/* Template select */}
                <div>
                  <label className="font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#141413] block mb-1.5">
                    Template slide
                  </label>
                  <select
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    disabled={loadingTemplates || templates.length === 0}
                    className="w-full border border-[#E8E6DC] rounded-xl px-3 py-2.5 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#3898EC] focus:ring-2 focus:ring-[#3898EC]/20 bg-white transition-all duration-150 disabled:bg-[#F5F4ED] disabled:text-[#87867F]"
                  >
                    <option value="">
                      {loadingTemplates ? 'Đang tải template...' : '-- Chọn template --'}
                    </option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  {loadingTemplates && (
                    <div className="mt-1.5">
                      <LoadingSpinner label="Đang tải template..." />
                    </div>
                  )}
                  {!loadingTemplates && templates.length === 0 && (
                    <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-1.5">
                      Chưa có template nào.
                    </p>
                  )}
                </div>

                {/* Template gallery */}
                {!loadingTemplates && templates.length > 0 && (
                  <div
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
                    role="listbox"
                    aria-label="Template previews"
                  >
                    {templates.map((template) => {
                      const previewUrl = templatePreviewBlobUrls[template.id];
                      const selected = template.id === templateId;

                      return (
                        <button
                          key={template.id}
                          type="button"
                          className={`group rounded-xl border-2 overflow-hidden text-left transition-all duration-200 ${
                            selected
                              ? 'border-[#7C6FAB] shadow-[0px_0px_0px_1px_#7C6FAB]'
                              : 'border-[#E8E6DC] hover:border-[#D1CFC5] hover:shadow-[rgba(0,0,0,0.05)_0px_4px_16px]'
                          }`}
                          onClick={() => setTemplateId(template.id)}
                          aria-selected={selected}
                        >
                          <div className="h-[100px] bg-[#E8E6DC] overflow-hidden">
                            {previewUrl ? (
                              <img
                                src={previewUrl}
                                alt={`Template: ${template.name}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                {loadingTemplatePreviews ? (
                                  <LoadingSpinner label="" />
                                ) : (
                                  <Layers className="w-6 h-6 text-[#87867F]" />
                                )}
                              </div>
                            )}
                          </div>
                          <div className="px-3 py-2 bg-white">
                            <p className="font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#141413] truncate">
                              {template.name}
                            </p>
                            {template.description && (
                              <p className="font-[Be_Vietnam_Pro] text-[11px] text-[#87867F] truncate mt-0.5">
                                {template.description}
                              </p>
                            )}
                          </div>
                          {selected && (
                            <div className="flex items-center gap-1 px-3 py-1.5 bg-[#7C6FAB]/10">
                              <CheckCircle2 className="w-3 h-3 text-[#7C6FAB]" />
                              <span className="font-[Be_Vietnam_Pro] text-[11px] font-semibold text-[#7C6FAB]">
                                Đã chọn
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedLesson && selectedTemplate && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#F0EEE6] rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#7C6FAB] flex-shrink-0" />
                    <span className="font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59]">
                      <strong className="text-[#141413]">{selectedLesson.title}</strong>{' '}
                      &nbsp;·&nbsp;{' '}
                      <strong className="text-[#141413]">{selectedTemplate.name}</strong>
                    </span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => setActiveWizardStep(3)}
                    disabled={!templateId}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C6FAB] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Tiếp tục: Tạo nội dung <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </fieldset>
            </div>
          )}

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              STEP 3 â€” Tạo nội dung AI
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeMainTab === 'GENERATE' && activeWizardStep === 3 && (
            <div className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F0EEE6] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-[Playfair_Display] text-[20px] font-medium text-[#141413]">
                      Tạo nội dung
                    </h2>
                    <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                      Cấu hình AI để tạo nội dung slide
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveWizardStep(2)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8E6DC] text-[#4D4C48] font-[Be_Vietnam_Pro] text-[13px] font-medium hover:bg-[#D1CFC5] active:scale-[0.98] transition-all duration-150"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Quay lại
                </button>
              </div>

              <fieldset className="p-6 space-y-4" disabled={!canConfigureAi}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Slide count */}
                  <div>
                    <label className="font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#141413] block mb-1.5">
                      Số lượng slide <span className="text-[#87867F] font-normal">(5–15)</span>
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={15}
                      value={slideCount}
                      onChange={(e) => {
                        const nextValue = Number(e.target.value || 5);
                        const clamped = Math.max(5, Math.min(15, nextValue));
                        setSlideCount(clamped);
                      }}
                      className="w-full border border-[#E8E6DC] rounded-xl px-3 py-2.5 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#3898EC] focus:ring-2 focus:ring-[#3898EC]/20 bg-white transition-all duration-150"
                    />
                  </div>

                  {/* Output format */}
                  <div>
                    <label className="font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#141413] block mb-1.5">
                      Định dạng đầu ra
                    </label>
                    <select
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value as LessonSlideOutputFormat)}
                      className="w-full border border-[#E8E6DC] rounded-xl px-3 py-2.5 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#3898EC] focus:ring-2 focus:ring-[#3898EC]/20 bg-white transition-all duration-150"
                    >
                      <option value="PLAIN_TEXT">Text</option>
                      <option value="LATEX">Latex</option>
                      <option value="HYBRID">Hybrid</option>
                    </select>
                  </div>
                </div>

                {/* Slide name */}
                <div>
                  <label className="font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#141413] block mb-1.5">
                    Tên slide
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Cấp Số Cộng - Lớp 11"
                    value={newSlideName}
                    onChange={(e) => setNewSlideName(e.target.value)}
                    className="w-full border border-[#E8E6DC] rounded-xl px-3 py-2.5 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] placeholder:text-[#87867F] outline-none focus:border-[#3898EC] focus:ring-2 focus:ring-[#3898EC]/20 bg-white transition-all duration-150"
                  />
                </div>

                {/* Thumbnail upload */}
                <div>
                  <p className="font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#141413] mb-1.5">
                    Ảnh thumbnail
                  </p>
                  <label className="block cursor-pointer">
                    <div
                      className={`border-2 border-dashed rounded-xl overflow-hidden transition-colors ${newSlideThumbnailPreview ? 'border-[#E8E6DC]' : 'border-[#E8E6DC] hover:border-[#7C6FAB]/50'}`}
                    >
                      {newSlideThumbnailPreview ? (
                        <img
                          src={newSlideThumbnailPreview}
                          alt="Thumbnail preview"
                          className="w-full h-[120px] object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 py-8 bg-[#F5F4ED]">
                          <Upload className="w-5 h-5 text-[#87867F]" />
                          <span className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]">
                            Chọn ảnh thumbnail
                          </span>
                          <span className="font-[Be_Vietnam_Pro] text-[11px] text-[#B0AEA5]">
                            PNG, JPG, WEBP
                          </span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setNewSlideThumbnailFile(file);
                        if (newSlideThumbnailPreview)
                          window.URL.revokeObjectURL(newSlideThumbnailPreview);
                        setNewSlideThumbnailPreview(file ? window.URL.createObjectURL(file) : null);
                      }}
                    />
                  </label>
                  {newSlideThumbnailFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewSlideThumbnailFile(null);
                        if (newSlideThumbnailPreview)
                          window.URL.revokeObjectURL(newSlideThumbnailPreview);
                        setNewSlideThumbnailPreview(null);
                      }}
                      className="mt-1.5 flex items-center gap-1 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] hover:text-[#B53333] transition-colors"
                    >
                      <X className="w-3 h-3" /> Xóa ảnh
                    </button>
                  )}
                </div>

                {/* Prompt */}
                <div>
                  <label className="font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#141413] block mb-1.5">
                    Mô tả yêu cầu AI <span className="text-[#B53333]">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="VD: Tập trung vào các ví dụ thực tế và bài tập..."
                    value={additionalPrompt}
                    onChange={(e) => setAdditionalPrompt(e.target.value)}
                    required
                    className="w-full border border-[#E8E6DC] rounded-xl px-3 py-2.5 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] placeholder:text-[#87867F] outline-none focus:border-[#3898EC] focus:ring-2 focus:ring-[#3898EC]/20 bg-white transition-all duration-150 resize-none"
                  />
                  <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-1">Bắt buộc.</p>
                </div>

                {selectedLesson && selectedTemplate && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#F0EEE6] rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#7C6FAB] flex-shrink-0" />
                    <span className="font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59]">
                      <strong className="text-[#141413]">{selectedLesson.title}</strong>{' '}
                      &nbsp;·&nbsp;{' '}
                      <strong className="text-[#141413]">{selectedTemplate.name}</strong>
                    </span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => void handleGenerateContent()}
                    disabled={generatingContent || !templateId}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C6FAB] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {generatingContent ? (
                      <LoadingSpinner label="Đang tạo nội dung..." />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" /> Tạo nội dung AI
                      </>
                    )}
                  </button>
                </div>
              </fieldset>
            </div>
          )}

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              STEP 4 — Confirm & chỉnh sửa
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeMainTab === 'GENERATE' && activeWizardStep === 4 && generated && (
            <div className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F0EEE6] flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-[Playfair_Display] text-[20px] font-medium text-[#141413]">
                      Kiểm tra nội dung
                    </h2>
                    <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                      {generated.lessonTitle} &nbsp;·&nbsp; {generated.slideCount} slide
                      &nbsp;·&nbsp; {getOutputFormatLabel(resolvedOutputFormat)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveWizardStep(3)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8E6DC] text-[#4D4C48] font-[Be_Vietnam_Pro] text-[13px] font-medium hover:bg-[#D1CFC5] active:scale-[0.98] transition-all duration-150"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Quay lại
                </button>
              </div>

              <div className="p-6 space-y-5">
                {currentPreviewSlide && (
                  <>
                    {/* Slide navigation */}
                    <div className="flex items-center justify-between gap-3">
                      <button
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8E6DC] text-[#4D4C48] font-[Be_Vietnam_Pro] text-[13px] font-medium hover:bg-[#D1CFC5] active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() => setActivePreviewIndex((prev) => Math.max(0, prev - 1))}
                        disabled={activePreviewIndex === 0}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Trước
                      </button>
                      <span className="font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59]">
                        Slide <strong className="text-[#141413]">{activePreviewIndex + 1}</strong> /{' '}
                        {editableSlides.length}
                      </span>
                      <button
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8E6DC] text-[#4D4C48] font-[Be_Vietnam_Pro] text-[13px] font-medium hover:bg-[#D1CFC5] active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() =>
                          setActivePreviewIndex((prev) =>
                            Math.min(editableSlides.length - 1, prev + 1)
                          )
                        }
                        disabled={activePreviewIndex === editableSlides.length - 1}
                      >
                        Sau <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Preview canvas */}
                    <article className="relative bg-white border border-[#E8E6DC] rounded-2xl p-6 min-h-[180px] shadow-[rgba(0,0,0,0.03)_0px_2px_12px]">
                      <div
                        className="font-[Playfair_Display] text-[20px] font-medium text-[#141413] leading-[1.3] mb-3"
                        role="heading"
                        aria-level={3}
                      >
                        {renderSlideText(
                          currentPreviewSlide.heading || 'Chưa có tiêu đề',
                          resolvedOutputFormat,
                          `heading-${currentPreviewSlide.slideNumber}`
                        )}
                      </div>
                      <div className="font-[Be_Vietnam_Pro] text-[14px] text-[#5E5D59] leading-[1.6] whitespace-pre-wrap">
                        {renderSlideText(
                          currentPreviewSlide.content || 'Chưa có nội dung',
                          resolvedOutputFormat,
                          `content-${currentPreviewSlide.slideNumber}`
                        )}
                      </div>
                      {renderingPreviewSlideNumber === currentPreviewSlide.slideNumber && (
                        <div className="absolute bottom-3 right-3">
                          <LoadingSpinner label="Đang render..." />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#F0EEE6] font-[Be_Vietnam_Pro] text-[10px] font-semibold text-[#87867F] uppercase tracking-[0.5px]">
                          {currentPreviewSlide.slideType}
                        </span>
                      </div>
                    </article>

                    {/* Edit panel */}
                    <div className="bg-white border border-[#E8E6DC] rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413]">
                          Chỉnh sửa slide {currentPreviewSlide.slideNumber}
                        </h3>
                        <span className="font-[Be_Vietnam_Pro] text-[11px] text-[#87867F] uppercase tracking-[0.5px]">
                          {currentPreviewSlide.slideType}
                        </span>
                      </div>
                      <div>
                        <label className="font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#141413] block mb-1.5">
                          Tiêu đề
                        </label>
                        <input
                          type="text"
                          value={currentPreviewSlide.heading}
                          onChange={(e) =>
                            handleSlideChange(activePreviewIndex, 'heading', e.target.value)
                          }
                          className="w-full border border-[#E8E6DC] rounded-xl px-3 py-2.5 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#3898EC] focus:ring-2 focus:ring-[#3898EC]/20 bg-white transition-all duration-150"
                        />
                      </div>
                      <div>
                        <label className="font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#141413] block mb-1.5">
                          Nội dung
                        </label>
                        <textarea
                          rows={6}
                          value={currentPreviewSlide.content}
                          onChange={(e) =>
                            handleSlideChange(activePreviewIndex, 'content', e.target.value)
                          }
                          className="w-full border border-[#E8E6DC] rounded-xl px-3 py-2.5 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#3898EC] focus:ring-2 focus:ring-[#3898EC]/20 bg-white transition-all duration-150 resize-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => void handlePreparePptx()}
                    disabled={generatingPptx || !editableSlides.length}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C6FAB] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {generatingPptx ? (
                      <LoadingSpinner label="Đang tạo PPTX..." />
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Xác nhận & tạo PPTX
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              STEP 5 — Tải PPTX
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeMainTab === 'GENERATE' && activeWizardStep === 5 && (
            <div className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F0EEE6] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-[Playfair_Display] text-[20px] font-medium text-[#141413]">
                      Tải file PPTX
                    </h2>
                    <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                      File đã sẵn sàng để tải về
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveWizardStep(4)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8E6DC] text-[#4D4C48] font-[Be_Vietnam_Pro] text-[13px] font-medium hover:bg-[#D1CFC5] active:scale-[0.98] transition-all duration-150"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Quay lại
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4 p-5 bg-[#F0EEE6] rounded-xl mb-5">
                  <div className="w-12 h-12 rounded-xl bg-[#E8E6DC] flex items-center justify-center flex-shrink-0">
                    <FileStack className="w-5 h-5 text-[#5E5D59]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413] truncate">
                      {preparedPptxFilename}
                    </p>
                    <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-0.5">
                      Đã sẵn sàng tải về
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadPreparedPptx}
                  disabled={!preparedPptxBlob}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C6FAB] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" /> Tải PPTX về máy
                </button>
              </div>
            </div>
          )}

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              MANAGE TAB — Thư viện slide
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeMainTab === 'MANAGE' && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* Search */}
                <div className="flex-1 flex items-center gap-2 bg-[#FAF9F5] border border-[#E8E6DC] rounded-xl px-4 py-2.5 focus-within:border-[#3898EC] focus-within:shadow-[0_0_0_3px_rgba(56,152,236,0.12)] transition-all duration-150 min-w-0">
                  <Search className="w-4 h-4 text-[#87867F] flex-shrink-0" />
                  <input
                    type="text"
                    value={generatedSearch}
                    placeholder="Tìm kiếm slide..."
                    onChange={(e) => setGeneratedSearch(e.target.value)}
                    className="flex-1 font-[Be_Vietnam_Pro] text-[14px] text-[#141413] placeholder:text-[#87867F] bg-transparent outline-none min-w-0"
                  />
                </div>

                {/* Sort */}
                <select
                  value={generatedSort}
                  onChange={(e) => setGeneratedSort(e.target.value as typeof generatedSort)}
                  className="border border-[#E8E6DC] rounded-xl px-3 py-2.5 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#3898EC] focus:ring-2 focus:ring-[#3898EC]/20 bg-white transition-all duration-150"
                >
                  <option value="NEWEST">Mới nhất</option>
                  <option value="OLDEST">Cũ nhất</option>
                  <option value="NAME_ASC">Tên A-Z</option>
                  <option value="NAME_DESC">Tên Z-A</option>
                  <option value="SIZE_DESC">Dung lượng lớn</option>
                  <option value="SIZE_ASC">Dung lượng nhỏ</option>
                  <option value="PUBLIC_FIRST">Công khai trước</option>
                </select>

                {/* Page size */}
                <select
                  value={generatedPageSize}
                  onChange={(e) => setGeneratedPageSize(Number(e.target.value))}
                  className="border border-[#E8E6DC] rounded-xl px-3 py-2.5 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#3898EC] focus:ring-2 focus:ring-[#3898EC]/20 bg-white transition-all duration-150"
                >
                  <option value={12}>12 / trang</option>
                  <option value={24}>24 / trang</option>
                  <option value={48}>48 / trang</option>
                </select>
              </div>

              {/* Visibility filter tabs */}
              <div
                className="flex items-center gap-1 p-1 bg-[#F0EEE6] rounded-xl w-fit"
                role="group"
                aria-label="Lọc file"
              >
                {[
                  { key: 'ALL' as const, label: 'Tất cả' },
                  { key: 'PUBLIC' as const, label: 'Công khai' },
                  { key: 'PRIVATE' as const, label: 'Chỉ mình tôi' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    disabled={loadingGeneratedFiles}
                    onClick={() => setGeneratedVisibilityFilter(key)}
                    className={
                      generatedVisibilityFilter === key
                        ? 'bg-[#141413] text-[#FAF9F5] rounded-lg px-3.5 py-1.5 font-[Be_Vietnam_Pro] text-[13px] font-semibold'
                        : 'bg-transparent text-[#5E5D59] rounded-lg px-3.5 py-1.5 font-[Be_Vietnam_Pro] text-[13px] font-medium hover:bg-[#E8E6DC] hover:text-[#141413] transition-colors duration-150 disabled:opacity-50'
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Loading skeleton */}
              {loadingGeneratedFiles && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] h-52 animate-pulse"
                    />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loadingGeneratedFiles && managedGeneratedFiles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#E8E6DC] flex items-center justify-center">
                    <FileStack className="w-5 h-5 text-[#87867F]" />
                  </div>
                  <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F]">
                    Không có file nào phù hợp
                  </p>
                  <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#B0AEA5]">
                    Thử đổi từ khóa tìm kiếm hoặc tạo file mới
                  </p>
                </div>
              )}

              {/* File grid */}
              {!loadingGeneratedFiles && managedGeneratedFiles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pagedManagedGeneratedFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`bg-[#FAF9F5] rounded-2xl border overflow-hidden group cursor-pointer transition-all duration-200 ${
                        selectedGeneratedFileId === file.id
                          ? 'border-[#7C6FAB] shadow-[0px_0px_0px_1px_#7C6FAB]'
                          : 'border-[#F0EEE6] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] hover:shadow-[0px_0px_0px_1px_#D1CFC5,rgba(0,0,0,0.08)_0px_8px_30px] hover:-translate-y-0.5'
                      }`}
                      onClick={() => {
                        setSelectedGeneratedFileId(file.id);
                        setSuccess('');
                        setError('');
                      }}
                    >
                      {/* Thumbnail */}
                      <div className="h-[120px] bg-[#E8E6DC] relative overflow-hidden">
                        {generatedThumbnailUrls[file.id] ? (
                          <img
                            src={generatedThumbnailUrls[file.id]}
                            alt={getGeneratedDisplayName(file)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="font-[Playfair_Display] text-[32px] font-medium text-[#B0AEA5]">
                              {getGeneratedDisplayName(file).slice(0, 1).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="absolute top-2.5 right-2.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-[Be_Vietnam_Pro] text-[10px] font-semibold ${
                              file.isPublic
                                ? 'bg-[#ECFDF5] text-[#2EAD7A]'
                                : 'bg-[#FAF9F5]/90 text-[#87867F]'
                            }`}
                          >
                            {file.isPublic ? (
                              <Globe className="w-2.5 h-2.5" />
                            ) : (
                              <Lock className="w-2.5 h-2.5" />
                            )}
                            {file.isPublic ? 'Công khai' : 'Riêng tư'}
                          </span>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-4">
                        <p
                          className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413] truncate mb-2"
                          title={getGeneratedDisplayName(file)}
                        >
                          {getGeneratedDisplayName(file)}
                        </p>
                        <dl className="space-y-1">
                          <div className="flex items-center justify-between">
                            <dt className="font-[Be_Vietnam_Pro] text-[11px] text-[#87867F] uppercase tracking-[0.5px]">
                              Bài dạy
                            </dt>
                            <dd className="font-[Be_Vietnam_Pro] text-[12px] text-[#5E5D59] truncate max-w-[60%] text-right">
                              {lessonTitleById[file.lessonId] || '...'}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="font-[Be_Vietnam_Pro] text-[11px] text-[#87867F] uppercase tracking-[0.5px]">
                              Ngày tạo
                            </dt>
                            <dd className="font-[Be_Vietnam_Pro] text-[12px] text-[#5E5D59]">
                              {formatDateTime(file.createdAt)}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="font-[Be_Vietnam_Pro] text-[11px] text-[#87867F] uppercase tracking-[0.5px]">
                              Dung lượng
                            </dt>
                            <dd className="font-[Be_Vietnam_Pro] text-[12px] text-[#5E5D59]">
                              {formatFileSize(file.fileSizeBytes)}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 px-4 pb-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenGeneratedPreview(file.id);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[12px] font-semibold hover:bg-[#30302E] active:scale-[0.98] transition-all duration-150"
                        >
                          <Eye className="w-3.5 h-3.5" /> Xem
                        </button>
                        <button
                          type="button"
                          title="Tải xuống"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDownloadGeneratedFile(file.id);
                          }}
                          disabled={downloadingGeneratedFileId === file.id}
                          className="w-9 h-9 rounded-xl bg-[#E8E6DC] text-[#5E5D59] flex items-center justify-center hover:bg-[#D1CFC5] active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
                        >
                          {downloadingGeneratedFileId === file.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          title="Chỉnh sửa"
                          onClick={(e) => {
                            e.stopPropagation();
                            openMetadataModal(file);
                          }}
                          className="w-9 h-9 rounded-xl bg-[#E8E6DC] text-[#5E5D59] flex items-center justify-center hover:bg-[#D1CFC5] active:scale-[0.98] transition-all duration-150"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Xóa"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestDeleteGeneratedFile(file.id);
                          }}
                          disabled={deletingGeneratedFileId === file.id}
                          className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!loadingGeneratedFiles && managedGeneratedFiles.length > 0 && (
                <div
                  className="flex items-center justify-between gap-3 pt-2"
                  role="navigation"
                  aria-label="Phân trang"
                >
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8E6DC] text-[#4D4C48] font-[Be_Vietnam_Pro] text-[13px] font-medium hover:bg-[#D1CFC5] active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => setGeneratedPage((prev) => Math.max(1, prev - 1))}
                    disabled={generatedPage <= 1}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Trước
                  </button>
                  <span className="font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59]">
                    Trang <strong className="text-[#141413]">{generatedPage}</strong> /{' '}
                    {totalManagedGeneratedPages} &nbsp;·&nbsp; {managedGeneratedFiles.length} file
                  </span>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8E6DC] text-[#4D4C48] font-[Be_Vietnam_Pro] text-[13px] font-medium hover:bg-[#D1CFC5] active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() =>
                      setGeneratedPage((prev) => Math.min(totalManagedGeneratedPages, prev + 1))
                    }
                    disabled={generatedPage >= totalManagedGeneratedPages}
                  >
                    Sau <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          GENERATING OVERLAY
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {generatingContent && (
        <div
          className="fixed inset-0 z-50 bg-[#141413]/50 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Đang tạo nội dung AI"
        >
          <div className="bg-[#FAF9F5] rounded-2xl shadow-[rgba(0,0,0,0.20)_0px_20px_60px] w-full max-w-sm p-8 flex flex-col items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-[#E8E6DC] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#7C6FAB]" />
            </div>
            <div className="text-center">
              <h3 className="font-[Playfair_Display] text-[20px] font-medium text-[#141413]">
                AI đang tạo nội dung
              </h3>
              <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-2">
                Vui lòng đợi trong giây lát...
              </p>
            </div>
            <div className="w-full h-1.5 bg-[#E8E6DC] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#7C6FAB] rounded-full animate-[indeterminate_1.5s_ease_infinite]"
                style={{ width: '60%' }}
              />
            </div>
            <div className="flex flex-col items-center gap-1" aria-hidden="true">
              {[
                'Phân tích bài học',
                'Dựng dàn ý',
                'Tối ưu biểu thức toán',
                'Hoàn tất nội dung',
              ].map((step) => (
                <span key={step} className="font-[Be_Vietnam_Pro] text-[12px] text-[#B0AEA5]">
                  {step}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          PREVIEW MODAL
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {isGeneratedPreviewOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#141413]/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsGeneratedPreviewOpen(false)}
        >
          <div
            className="bg-[#FAF9F5] rounded-2xl shadow-[rgba(0,0,0,0.20)_0px_20px_60px] w-full max-w-4xl flex flex-col max-h-[90vh]"
            role="dialog"
            aria-modal="true"
            aria-label="Xem trước slide"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EEE6] flex-shrink-0">
              <h3 className="font-[Playfair_Display] text-[20px] font-medium text-[#141413]">
                Xem trước slide
              </h3>
              <button
                type="button"
                onClick={() => setIsGeneratedPreviewOpen(false)}
                aria-label="Đóng xem trước"
                className="w-8 h-8 rounded-lg bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] hover:bg-[#D1CFC5] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              {(loadingSelectedGeneratedLesson || loadingGeneratedPreviewPdf) && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-10 h-10 rounded-full border-2 border-[#E8E6DC] border-t-[#7C6FAB] animate-spin" />
                  <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]">
                    Đang tải preview...
                  </p>
                </div>
              )}

              {!loadingGeneratedPreviewPdf && generatedPreviewPdfUrl && (
                <div
                  className="relative rounded-xl overflow-hidden bg-[#E8E6DC]"
                  style={{ minHeight: 400 }}
                >
                  {!previewIframeLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full border-2 border-[#E8E6DC] border-t-[#7C6FAB] animate-spin" />
                    </div>
                  )}
                  <iframe
                    className={`w-full transition-opacity duration-300 ${previewIframeLoaded ? 'opacity-100' : 'opacity-0'}`}
                    style={{ height: 500 }}
                    src={generatedPreviewPdfUrl}
                    title="Preview PDF"
                    loading="eager"
                    onLoad={() => setPreviewIframeLoaded(true)}
                  />
                </div>
              )}

              {!loadingSelectedGeneratedLesson &&
                !generatedPreviewPdfUrl &&
                currentGeneratedPreviewSlide && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8E6DC] text-[#4D4C48] font-[Be_Vietnam_Pro] text-[13px] font-medium hover:bg-[#D1CFC5] active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() => setGeneratedPreviewIndex((prev) => Math.max(0, prev - 1))}
                        disabled={generatedPreviewIndex === 0}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Trước
                      </button>
                      <span className="font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59]">
                        Slide{' '}
                        <strong className="text-[#141413]">{generatedPreviewIndex + 1}</strong> /{' '}
                        {generatedPreviewSlides.length}
                      </span>
                      <button
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8E6DC] text-[#4D4C48] font-[Be_Vietnam_Pro] text-[13px] font-medium hover:bg-[#D1CFC5] active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() =>
                          setGeneratedPreviewIndex((prev) =>
                            Math.min(generatedPreviewSlides.length - 1, prev + 1)
                          )
                        }
                        disabled={generatedPreviewIndex === generatedPreviewSlides.length - 1}
                      >
                        Sau <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <article className="bg-white border border-[#E8E6DC] rounded-2xl p-6 min-h-[160px]">
                      <div
                        className="font-[Playfair_Display] text-[20px] font-medium text-[#141413] mb-3"
                        role="heading"
                        aria-level={4}
                      >
                        {renderSlideText(
                          currentGeneratedPreviewSlide.heading || 'Chưa có tiêu đề',
                          resolvedOutputFormat,
                          `manage-heading-${currentGeneratedPreviewSlide.slideNumber}`
                        )}
                      </div>
                      <div className="font-[Be_Vietnam_Pro] text-[14px] text-[#5E5D59] leading-[1.6] whitespace-pre-wrap">
                        {renderSlideText(
                          currentGeneratedPreviewSlide.content || 'Chưa có nội dung',
                          resolvedOutputFormat,
                          `manage-content-${currentGeneratedPreviewSlide.slideNumber}`
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-[#F0EEE6]">
                        <span className="font-[Be_Vietnam_Pro] text-[10px] font-semibold text-[#87867F] uppercase tracking-[0.5px]">
                          {currentGeneratedPreviewSlide.slideType}
                        </span>
                      </div>
                    </article>
                  </div>
                )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-[#F0EEE6] flex-shrink-0 flex-wrap">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8E6DC] text-[#4D4C48] font-[Be_Vietnam_Pro] text-[13px] font-medium hover:bg-[#D1CFC5] active:scale-[0.98] transition-all duration-150"
                onClick={() => setIsGeneratedPreviewOpen(false)}
              >
                Đóng
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8E6DC] text-[#4D4C48] font-[Be_Vietnam_Pro] text-[13px] font-medium hover:bg-[#D1CFC5] active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={
                    !selectedGeneratedFile ||
                    loadingGeneratedPreviewPdf ||
                    openingGeneratedPreviewPdfTab
                  }
                  onClick={() => void handleOpenGeneratedPreviewInNewTab()}
                >
                  {openingGeneratedPreviewPdfTab ? 'Đang mở...' : 'Mở tab mới'}
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C6FAB] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={
                    !selectedGeneratedFile ||
                    downloadingGeneratedFileId === selectedGeneratedFile?.id
                  }
                  onClick={() =>
                    selectedGeneratedFile &&
                    void handleDownloadGeneratedFile(selectedGeneratedFile.id)
                  }
                >
                  <Download className="w-3.5 h-3.5" />
                  {selectedGeneratedFile && downloadingGeneratedFileId === selectedGeneratedFile.id
                    ? 'Đang tải...'
                    : 'Tải file này'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          METADATA EDIT MODAL
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {isMetadataModalOpen && editingMetadataFile && (
        <div
          className="fixed inset-0 z-50 bg-[#141413]/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeMetadataModal}
        >
          <div
            className="bg-[#FAF9F5] rounded-2xl shadow-[rgba(0,0,0,0.20)_0px_20px_60px] w-full max-w-md flex flex-col max-h-[90vh]"
            role="dialog"
            aria-modal="true"
            aria-label="Chỉnh sửa slide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EEE6] flex-shrink-0">
              <h3 className="font-[Playfair_Display] text-[20px] font-medium text-[#141413]">
                Chỉnh sửa slide
              </h3>
              <button
                type="button"
                onClick={closeMetadataModal}
                aria-label="Đóng"
                className="w-8 h-8 rounded-lg bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] hover:bg-[#D1CFC5] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              id="slide-edit-form"
              className="flex-1 overflow-y-auto p-6 space-y-4"
              onSubmit={(e) => void handleUpdateMetadata(e)}
            >
              {/* Current thumbnail preview */}
              <div className="h-[100px] rounded-xl overflow-hidden bg-[#E8E6DC]">
                {generatedThumbnailUrls[editingMetadataFile.id] ? (
                  <img
                    src={generatedThumbnailUrls[editingMetadataFile.id]}
                    alt={getGeneratedDisplayName(editingMetadataFile)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-[Playfair_Display] text-[32px] font-medium text-[#B0AEA5]">
                      {getGeneratedDisplayName(editingMetadataFile).slice(0, 1).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#141413] block mb-1.5">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={metadataName}
                  onChange={(e) => setMetadataName(e.target.value)}
                  placeholder="Nhập tên hiển thị mới"
                  className="w-full border border-[#E8E6DC] rounded-xl px-3 py-2.5 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] placeholder:text-[#87867F] outline-none focus:border-[#3898EC] focus:ring-2 focus:ring-[#3898EC]/20 bg-white transition-all duration-150"
                />
              </div>

              {/* Status */}
              <div>
                <label className="font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#141413] block mb-1.5">
                  Trạng thái
                </label>
                <select
                  value={metadataIsPublic ? 'public' : 'draft'}
                  onChange={(e) => setMetadataIsPublic(e.target.value === 'public')}
                  className="w-full border border-[#E8E6DC] rounded-xl px-3 py-2.5 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#3898EC] focus:ring-2 focus:ring-[#3898EC]/20 bg-white transition-all duration-150"
                >
                  <option value="draft">Chỉ mình tôi</option>
                  <option value="public">Công khai</option>
                </select>
              </div>

              {/* Thumbnail upload */}
              <div>
                <p className="font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#141413] mb-1.5">
                  Ảnh thumbnail mới
                </p>
                <label className="block cursor-pointer">
                  <div
                    className={`border-2 border-dashed rounded-xl overflow-hidden transition-colors ${metadataThumbnailFile ? 'border-[#E8E6DC]' : 'border-[#E8E6DC] hover:border-[#7C6FAB]/50'}`}
                  >
                    {metadataThumbnailFile ? (
                      <img
                        src={window.URL.createObjectURL(metadataThumbnailFile)}
                        alt="preview"
                        className="w-full h-[80px] object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 py-5 bg-[#F5F4ED]">
                        <Upload className="w-4 h-4 text-[#87867F]" />
                        <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                          Chọn ảnh mới
                        </span>
                        <span className="font-[Be_Vietnam_Pro] text-[11px] text-[#B0AEA5]">
                          PNG, JPG, WEBP
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => setMetadataThumbnailFile(e.target.files?.[0] || null)}
                  />
                </label>
                {metadataThumbnailFile && (
                  <button
                    type="button"
                    onClick={() => setMetadataThumbnailFile(null)}
                    className="mt-1 flex items-center gap-1 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] hover:text-[#B53333] transition-colors"
                  >
                    <X className="w-3 h-3" /> Xóa ảnh mới
                  </button>
                )}
              </div>
            </form>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#F0EEE6] flex-shrink-0">
              <button
                type="button"
                onClick={closeMetadataModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8E6DC] text-[#4D4C48] font-[Be_Vietnam_Pro] text-[13px] font-medium hover:bg-[#D1CFC5] active:scale-[0.98] transition-all duration-150"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="slide-edit-form"
                disabled={updatingMetadata}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C6FAB] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {updatingMetadata ? <LoadingSpinner label="Đang lưu..." /> : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          DELETE CONFIRM MODAL
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {deletingGeneratedFile && (
        <div
          className="fixed inset-0 z-50 bg-[#141413]/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeDeleteGeneratedModal}
        >
          <div
            className="bg-[#FAF9F5] rounded-2xl shadow-[rgba(0,0,0,0.20)_0px_20px_60px] w-full max-w-sm p-6 flex flex-col gap-4"
            role="dialog"
            aria-modal="true"
            aria-label="Xác nhận xóa slide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="text-center">
              <h3 className="font-[Playfair_Display] text-[18px] font-medium text-[#141413]">
                Xóa slide
              </h3>
              {deletingGeneratedFileId ? (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <LoadingSpinner label="Đang xóa..." />
                </div>
              ) : (
                <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-2">
                  Bạn có chắc muốn xóa{' '}
                  <strong className="text-[#141413]">
                    {getGeneratedDisplayName(deletingGeneratedFile)}
                  </strong>
                  ?
                  <br />
                  File sẽ bị xóa vĩnh viễn.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors active:scale-[0.98]"
                onClick={closeDeleteGeneratedModal}
                disabled={Boolean(deletingGeneratedFileId)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-[Be_Vietnam_Pro] text-[13px] font-semibold transition-colors active:scale-[0.98] disabled:opacity-40"
                onClick={() => void handleDeleteGeneratedFile()}
                disabled={Boolean(deletingGeneratedFileId)}
              >
                {deletingGeneratedFileId ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AISlideGenerator;
