import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { API_BASE_URL } from '../../config/api.config';
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
import 'katex/dist/katex.min.css';
import './AISlideGenerator.css';

const LoadingSpinner: React.FC<{ label: string }> = ({ label }) => (
  <span className="ai-slide-loading-inline" role="status" aria-live="polite">
    <span className="ai-slide-spinner" aria-hidden="true" />
    {label}
  </span>
);

const getTemplatePreviewUrl = (previewImage?: string | null): string | null => {
  if (!previewImage) return null;

  if (/^https?:\/\//i.test(previewImage)) {
    return previewImage;
  }

  const normalizedPath = previewImage.startsWith('/') ? previewImage : `/${previewImage}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const resolveSlidePreviewImageUrl = (previewImageUrl?: string | null): string | null => {
  if (!previewImageUrl) return null;
  if (/^https?:\/\//i.test(previewImageUrl)) return previewImageUrl;

  const normalizedPath = previewImageUrl.startsWith('/') ? previewImageUrl : `/${previewImageUrl}`;
  return `${API_BASE_URL}${normalizedPath}`;
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

  return input
    .replace(/^khoi\s+dong\b/gim, 'Khởi động')
    .replace(/\\begin\{itemize\}/gi, '')
    .replace(/\\end\{itemize\}/gi, '')
    .replace(/\\item\s*/g, '\n• ')
    .replace(/\\textbf\{([^{}]+)\}/g, '$1')
    .replace(/\\textit\{([^{}]+)\}/g, '$1')
    .replace(/\\emph\{([^{}]+)\}/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n[ \t]+/g, '\n')
    .trim();
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
  const [schoolGrades, setSchoolGrades] = useState<SchoolGrade[]>([]);
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
  const [templates, setTemplates] = useState<LessonSlideTemplate[]>([]);
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

  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [generatingPptx, setGeneratingPptx] = useState(false);

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

  const currentPreviewImageUrl = useMemo(
    () => resolveSlidePreviewImageUrl(currentPreviewSlide?.previewImageUrl),
    [currentPreviewSlide?.previewImageUrl]
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
  const loadingAnyCatalog =
    loadingGrades || loadingSubjects || loadingChapters || loadingLessons || loadingTemplates;
  const visualWizardStep = Math.min(activeWizardStep, 5);
  const wizardSteps = [
    'Chọn bài dạy',
    'Chọn template',
    'Gen nội dung',
    'Confirm nội dung',
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
    const loadSchoolGrades = async () => {
      setLoadingGrades(true);
      setError('');

      try {
        const response = await LessonSlideService.getSchoolGrades(true);
        setSchoolGrades(response.result || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách khối lớp');
      } finally {
        setLoadingGrades(false);
      }
    };

    void loadSchoolGrades();
  }, []);

  useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true);

      try {
        const response = await LessonSlideService.getTemplates(true);
        setTemplates(response.result || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Khong the tai danh sach template slide');
      } finally {
        setLoadingTemplates(false);
      }
    };

    void loadTemplates();
  }, []);

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
    const previewsToLoad = templates.filter((template) => Boolean(template.previewImage));

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
            const previewUrl = getTemplatePreviewUrl(template.previewImage);
            if (!previewUrl) return;

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
      setError('Vui lòng chọn đầy đủ Khối, Môn, Chương và Bài học trước khi tạo nội dung.');
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
    >
      <div className="ai-slide-page">
        <div className="ai-slide-header">
          <h1 className="ai-slide-title">AI Slide Generator</h1>
          <div className="ai-slide-main-tabs" role="tablist" aria-label="Che do AI Slide">
            <button
              type="button"
              role="tab"
              aria-selected={activeMainTab === 'GENERATE'}
              className={`ai-slide-main-tab ${activeMainTab === 'GENERATE' ? 'active' : ''}`}
              onClick={() => setActiveMainTab('GENERATE')}
            >
              Generate Slide
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMainTab === 'MANAGE'}
              className={`ai-slide-main-tab ${activeMainTab === 'MANAGE' ? 'active' : ''}`}
              onClick={() => setActiveMainTab('MANAGE')}
            >
              Quản lý Slide
            </button>
          </div>

          {activeMainTab === 'GENERATE' && (
            <ol className="ai-slide-stepper" aria-label="Tiến trình tạo slide">
              {wizardSteps.map((stepLabel, index) => {
                const stepNumber = index + 1;
                const isDone = visualWizardStep > stepNumber;
                const isActive = visualWizardStep === stepNumber;

                return (
                  <li
                    key={stepLabel}
                    className={`ai-slide-step-item ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    <span className="ai-slide-step-dot" aria-hidden="true">
                      {stepNumber}
                    </span>
                    <span className="ai-slide-step-text">{stepLabel}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {activeMainTab === 'GENERATE' && activeWizardStep === 1 && (
          <section className="ai-slide-card">
            <h2>Bước 1: Chọn dữ liệu bài dạy</h2>

            <div className="ai-slide-step-list">
              <label>
                <span>Chọn Khối (School Grade)</span>
                <select
                  value={schoolGradeId}
                  onChange={(e) => void handleSchoolGradeChange(e.target.value)}
                  disabled={loadingGrades}
                >
                  <option value="">-- Chọn khối --</option>
                  {schoolGrades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      Khối {grade.gradeLevel} - {grade.name}
                    </option>
                  ))}
                </select>
              </label>

              {!schoolGradeId && (
                <p className="ai-slide-info">Vui lòng chọn khối để mở bước tiếp theo.</p>
              )}

              {showSubjectStep && (
                <label>
                  <span>Chọn Môn học (Subject)</span>
                  <select
                    value={subjectId}
                    onChange={(e) => void handleSubjectChange(e.target.value)}
                    disabled={loadingSubjects}
                  >
                    <option value="">-- Chọn môn học --</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {showSubjectStep && !loadingSubjects && subjects.length === 0 && (
                <p className="ai-slide-info">Khối này chưa có môn học.</p>
              )}

              {showChapterStep && (
                <label>
                  <span>Chọn Chương (Chapter)</span>
                  <select
                    value={chapterId}
                    onChange={(e) => void handleChapterChange(e.target.value)}
                    disabled={loadingChapters}
                  >
                    <option value="">-- Chọn chương --</option>
                    {chapters.map((chapter) => (
                      <option key={chapter.id} value={chapter.id}>
                        {chapter.orderIndex}. {chapter.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {showChapterStep && !loadingChapters && chapters.length === 0 && (
                <p className="ai-slide-info">Môn học này chưa có chương.</p>
              )}

              {showLessonStep && (
                <label>
                  <span>Chọn Bài học (Lesson)</span>
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
                  >
                    <option value="">-- Chọn bài học --</option>
                    {lessons.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.orderIndex}. {lesson.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {showLessonStep && !loadingLessons && lessons.length === 0 && (
                <p className="ai-slide-info">Chương này chưa có bài học.</p>
              )}

              <div
                className="ai-slide-actions"
                style={{ marginTop: '1.5rem', justifyContent: 'flex-end' }}
              >
                <button
                  className="btn btn-primary"
                  disabled={!canConfigureAi}
                  onClick={() => setActiveWizardStep(2)}
                >
                  Tiếp tục: Chọn template →
                </button>
              </div>
            </div>
          </section>
        )}

        {activeMainTab === 'MANAGE' && (
          <section className="ai-slide-card">
            <div className="ai-slide-management-card">
              <div className="ai-slide-management-header">
                <h3>Thư Viện Slide</h3>
              </div>

              <div className="ai-slide-management-toolbar">
                <label className="ai-slide-management-search">
                  <span>Tìm Kiếm</span>
                  <input
                    type="text"
                    value={generatedSearch}
                    placeholder="Ví dụ: Xác suất hoặc Hình học ..."
                    onChange={(e) => setGeneratedSearch(e.target.value)}
                  />
                </label>

                <label className="ai-slide-management-sort">
                  <span>Sắp xếp</span>
                  <select
                    value={generatedSort}
                    onChange={(e) =>
                      setGeneratedSort(
                        e.target.value as
                          | 'NEWEST'
                          | 'OLDEST'
                          | 'NAME_ASC'
                          | 'NAME_DESC'
                          | 'SIZE_DESC'
                          | 'SIZE_ASC'
                          | 'PUBLIC_FIRST'
                      )
                    }
                  >
                    <option value="NEWEST">Mới nhất</option>
                    <option value="OLDEST">Cũ nhất</option>
                    <option value="NAME_ASC">Tên A-Z</option>
                    <option value="NAME_DESC">Tên Z-A</option>
                    <option value="SIZE_DESC">Size lớn trước</option>
                    <option value="SIZE_ASC">Size nhỏ trước</option>
                    <option value="PUBLIC_FIRST">Public trước</option>
                  </select>
                </label>

                <label className="ai-slide-management-sort">
                  <span>Số lượng mỗi trang</span>
                  <select
                    value={generatedPageSize}
                    onChange={(e) => setGeneratedPageSize(Number(e.target.value))}
                  >
                    <option value={12}>12 / trang</option>
                    <option value={24}>24 / trang</option>
                    <option value={48}>48 / trang</option>
                  </select>
                </label>
              </div>

              <div className="ai-slide-status-tabs" role="group" aria-label="Loc file generated">
                <button
                  type="button"
                  className={`ai-slide-status-tab ${generatedVisibilityFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setGeneratedVisibilityFilter('ALL')}
                  disabled={loadingGeneratedFiles}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  className={`ai-slide-status-tab ${generatedVisibilityFilter === 'PUBLIC' ? 'active' : ''}`}
                  onClick={() => setGeneratedVisibilityFilter('PUBLIC')}
                  disabled={loadingGeneratedFiles}
                >
                  Public
                </button>
                <button
                  type="button"
                  className={`ai-slide-status-tab ${generatedVisibilityFilter === 'PRIVATE' ? 'active' : ''}`}
                  onClick={() => setGeneratedVisibilityFilter('PRIVATE')}
                  disabled={loadingGeneratedFiles}
                >
                  Private
                </button>
              </div>
              <div className="ai-slide-management-list-panel">
                {loadingGeneratedFiles && (
                  <p className="ai-slide-info">Đang tải danh sách file generated...</p>
                )}

                {!loadingGeneratedFiles && managedGeneratedFiles.length === 0 && (
                  <p className="ai-slide-info">
                    Khong co file nao phu hop bo loc. Thu doi tu khoa tim kiem hoac tao file moi.
                  </p>
                )}

                {!loadingGeneratedFiles && managedGeneratedFiles.length > 0 && (
                  <div className="ai-slide-card-grid">
                    {pagedManagedGeneratedFiles.map((file) => (
                      <div
                        key={file.id}
                        className={`ai-slide-file-card ${selectedGeneratedFileId === file.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedGeneratedFileId(file.id);
                          setSuccess('');
                          setError('');
                        }}
                      >
                        <div className="ai-slide-file-card-thumb">
                          {generatedThumbnailUrls[file.id] ? (
                            <img
                              src={generatedThumbnailUrls[file.id]}
                              alt={getGeneratedDisplayName(file)}
                            />
                          ) : (
                            <div className="ai-slide-file-card-thumb-placeholder">
                              {getGeneratedDisplayName(file).slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <span
                            className={`ai-slide-file-card-badge ${file.isPublic ? 'published' : 'draft'}`}
                          >
                            {file.isPublic ? 'PUBLISHED' : 'DRAFT'}
                          </span>
                        </div>

                        <div className="ai-slide-file-card-body">
                          <p
                            className="ai-slide-file-card-title"
                            title={getGeneratedDisplayName(file)}
                          >
                            {getGeneratedDisplayName(file)}
                          </p>
                          <ul className="ai-slide-file-card-meta">
                            <li>
                              <span>FILE</span>
                              <span title={file.fileName}>
                                {file.fileName || 'generated-slide.pptx'}
                              </span>
                            </li>
                            <li>
                              <span>BÀI DẠY</span>
                              <span>{lessonTitleById[file.lessonId] || '...'}</span>
                            </li>
                            <li>
                              <span>NGÀY TẠO</span>
                              <span>{formatDateTime(file.createdAt)}</span>
                            </li>
                            <li>
                              <span>DUNG LƯỢNG</span>
                              <span>{formatFileSize(file.fileSizeBytes)}</span>
                            </li>
                          </ul>
                        </div>

                        <div className="ai-slide-file-card-actions">
                          <button
                            type="button"
                            className="ai-slide-file-card-btn primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenGeneratedPreview(file.id);
                            }}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            Xem
                          </button>
                          <button
                            type="button"
                            className="ai-slide-file-card-btn icon"
                            title="Tải xuống"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDownloadGeneratedFile(file.id);
                            }}
                            disabled={downloadingGeneratedFileId === file.id}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="ai-slide-file-card-btn icon"
                            title="Chỉnh sửa"
                            onClick={(e) => {
                              e.stopPropagation();
                              openMetadataModal(file);
                            }}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="ai-slide-file-card-btn icon danger"
                            title="Xóa"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestDeleteGeneratedFile(file.id);
                            }}
                            disabled={deletingGeneratedFileId === file.id}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!loadingGeneratedFiles && managedGeneratedFiles.length > 0 && (
                  <div
                    className="ai-slide-pagination"
                    role="navigation"
                    aria-label="Phan trang file"
                  >
                    <button
                      type="button"
                      className="ai-slide-pagination-btn"
                      onClick={() => setGeneratedPage((prev) => Math.max(1, prev - 1))}
                      disabled={generatedPage <= 1}
                    >
                      ← Trước
                    </button>
                    <span className="ai-slide-pagination-meta">
                      Trang {generatedPage}/{totalManagedGeneratedPages} •{' '}
                      {managedGeneratedFiles.length} file • {generatedPageSize} / trang
                    </span>
                    <button
                      type="button"
                      className="ai-slide-pagination-btn"
                      onClick={() =>
                        setGeneratedPage((prev) => Math.min(totalManagedGeneratedPages, prev + 1))
                      }
                      disabled={generatedPage >= totalManagedGeneratedPages}
                    >
                      Sau →
                    </button>
                  </div>
                )}
              </div>

              {error && <p className="ai-slide-error">{error}</p>}
              {success && <p className="ai-slide-success">{success}</p>}
            </div>
          </section>
        )}

        {activeMainTab === 'GENERATE' && activeWizardStep === 2 && (
          <section className="ai-slide-card">
            <h2>Bước 2: Chọn template slide</h2>
            <div
              className="ai-slide-actions"
              style={{ marginBottom: '1rem', justifyContent: 'flex-start' }}
            >
              <button className="btn btn-outline" onClick={() => setActiveWizardStep(1)}>
                ← Quay lại Bài dạy
              </button>
            </div>

            <fieldset className="ai-slide-fieldset" disabled={!canChooseTemplate}>
              <div className="ai-slide-grid ai-slide-config-grid">
                <label>
                  <span>Template slide</span>
                  <select
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    disabled={loadingTemplates || templates.length === 0}
                  >
                    <option value="">
                      {loadingTemplates ? 'Dang tai template...' : '-- Chon template --'}
                    </option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {!loadingTemplates && templates.length === 0 && (
                <p className="ai-slide-info">Chua co template nao dang active.</p>
              )}

              {!loadingTemplates && templates.length > 0 && (
                <div
                  className="ai-slide-template-gallery"
                  role="listbox"
                  aria-label="Template previews"
                >
                  {templates.map((template) => {
                    const previewUrl = templatePreviewBlobUrls[template.id];
                    const selected = template.id === templateId;
                    const hasPreviewSource = Boolean(template.previewImage);

                    return (
                      <button
                        key={template.id}
                        type="button"
                        className={`ai-slide-template-card ${selected ? 'active' : ''}`}
                        onClick={() => setTemplateId(template.id)}
                        aria-selected={selected}
                      >
                        <div className="ai-slide-template-thumb">
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt={`Template preview: ${template.name}`}
                              loading="lazy"
                            />
                          ) : (
                            <div className="ai-slide-template-placeholder">
                              {hasPreviewSource
                                ? loadingTemplatePreviews
                                  ? 'Dang tai preview...'
                                  : 'Preview unavailable'
                                : 'No preview'}
                            </div>
                          )}
                        </div>
                        <div className="ai-slide-template-meta">
                          <strong>{template.name}</strong>
                          <span>{template.description || template.originalFileName}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedTemplate && (
                <p className="ai-slide-info">
                  Template da chon: {selectedTemplate.name} ({selectedTemplate.originalFileName})
                </p>
              )}

              <div className="ai-slide-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => setActiveWizardStep(3)}
                  disabled={!templateId}
                >
                  Tiếp tục: Gen nội dung →
                </button>
              </div>
            </fieldset>

            {loadingAnyCatalog && <LoadingSpinner label="Đang tải dữ liệu danh mục..." />}
            {selectedLesson && (
              <p className="ai-slide-info">Bài học đã chọn: {selectedLesson.title}</p>
            )}
            {error && <p className="ai-slide-error">{error}</p>}
            {success && <p className="ai-slide-success">{success}</p>}
          </section>
        )}

        {activeMainTab === 'GENERATE' && activeWizardStep === 3 && (
          <section className="ai-slide-card">
            <h2>Bước 3: Gen nội dung slide bằng AI</h2>
            <div
              className="ai-slide-actions"
              style={{ marginBottom: '1rem', justifyContent: 'flex-start' }}
            >
              <button className="btn btn-outline" onClick={() => setActiveWizardStep(2)}>
                ← Quay lại Template
              </button>
            </div>

            <fieldset className="ai-slide-fieldset" disabled={!canConfigureAi}>
              <div className="ai-slide-grid ai-slide-config-grid">
                <label>
                  <span>Số lượng slide</span>
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
                  />
                  <small className="ai-slide-format-hint">Cho phép từ 5 đến 15 slide.</small>
                </label>
              </div>

              <label className="ai-slide-full-width">
                <span>Tên slide</span>
                <input
                  type="text"
                  placeholder="VD: Cấp Số Cộng - Lớp 11"
                  value={newSlideName}
                  onChange={(e) => setNewSlideName(e.target.value)}
                />
              </label>

              <div className="ai-slide-full-width">
                <span className="ai-slide-field-label">Ảnh thumbnail</span>
                <label className="ai-slide-thumb-upload">
                  {newSlideThumbnailPreview ? (
                    <img
                      src={newSlideThumbnailPreview}
                      alt="preview"
                      className="ai-slide-thumb-upload-preview"
                    />
                  ) : (
                    <div className="ai-slide-thumb-upload-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span>Chọn ảnh thumbnail</span>
                      <small>PNG, JPG, WEBP</small>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                    style={{ display: 'none' }}
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
                    className="ai-slide-thumb-remove"
                    onClick={() => {
                      setNewSlideThumbnailFile(null);
                      if (newSlideThumbnailPreview)
                        window.URL.revokeObjectURL(newSlideThumbnailPreview);
                      setNewSlideThumbnailPreview(null);
                    }}
                  >
                    ✕ Xóa ảnh
                  </button>
                )}
              </div>

              <label className="ai-slide-full-width">
                <span>Additional Prompt</span>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Giải Phương Trình Bậc 2"
                  value={additionalPrompt}
                  onChange={(e) => setAdditionalPrompt(e.target.value)}
                  required
                />
                <small className="ai-slide-format-hint">Trường bắt buộc.</small>
              </label>

              <label className="ai-slide-full-width">
                <span>Định dạng đầu ra</span>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as LessonSlideOutputFormat)}
                >
                  <option value="PLAIN_TEXT">Text</option>
                  <option value="LATEX">Latex</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </label>

              <div className="ai-slide-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => void handleGenerateContent()}
                  disabled={generatingContent || !templateId}
                >
                  {generatingContent ? (
                    <LoadingSpinner label="Đang tạo nội dung..." />
                  ) : (
                    'Tạo nội dung AI'
                  )}
                </button>
              </div>
            </fieldset>

            {selectedLesson && selectedTemplate && (
              <p className="ai-slide-info">
                Bài học: {selectedLesson.title} | Template: {selectedTemplate.name}
              </p>
            )}
            {error && <p className="ai-slide-error">{error}</p>}
            {success && <p className="ai-slide-success">{success}</p>}
          </section>
        )}

        {activeMainTab === 'GENERATE' && activeWizardStep === 4 && generated && (
          <section className="ai-slide-card">
            <h2>Bước 4: Confirm và chỉnh sửa nội dung</h2>
            <div
              className="ai-slide-actions"
              style={{ marginBottom: '1rem', justifyContent: 'flex-start' }}
            >
              <button className="btn btn-outline" onClick={() => setActiveWizardStep(3)}>
                ← Quay lại Gen nội dung
              </button>
            </div>

            <p className="ai-slide-info">
              Lesson: <strong>{generated.lessonTitle}</strong> | Số slide:{' '}
              <strong>{generated.slideCount}</strong> | Output format:{' '}
              <strong>{getOutputFormatLabel(resolvedOutputFormat)}</strong>
            </p>

            {currentPreviewSlide && (
              <div className="ai-slide-preview-wrap">
                <div className="ai-slide-preview-toolbar">
                  <button
                    className="btn btn-outline"
                    onClick={() => setActivePreviewIndex((prev) => Math.max(0, prev - 1))}
                    disabled={activePreviewIndex === 0}
                  >
                    Slide trước
                  </button>
                  <span>
                    Slide {activePreviewIndex + 1}/{editableSlides.length}
                  </span>
                  <button
                    className="btn btn-outline"
                    onClick={() =>
                      setActivePreviewIndex((prev) => Math.min(editableSlides.length - 1, prev + 1))
                    }
                    disabled={activePreviewIndex === editableSlides.length - 1}
                  >
                    Slide sau
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => void renderSlidePreview(activePreviewIndex, currentPreviewSlide)}
                    disabled={Boolean(renderingPreviewSlideNumber)}
                  >
                    {renderingPreviewSlideNumber === currentPreviewSlide.slideNumber
                      ? 'Đang cập nhật ảnh...'
                      : 'Làm mới preview ảnh'}
                  </button>
                </div>

                <article className="ai-slide-preview-canvas">
                  {currentPreviewImageUrl ? (
                    <img
                      src={currentPreviewImageUrl}
                      alt={`Preview slide ${currentPreviewSlide.slideNumber}`}
                      className="ai-slide-preview-rendered-image"
                    />
                  ) : (
                    <>
                      <div className="ai-slide-preview-heading" role="heading" aria-level={3}>
                        {renderSlideText(
                          currentPreviewSlide.heading || 'Chưa có tiêu đề',
                          resolvedOutputFormat,
                          `heading-${currentPreviewSlide.slideNumber}`
                        )}
                      </div>
                      <div className="ai-slide-preview-content">
                        {renderSlideText(
                          currentPreviewSlide.content || 'Chưa có nội dung',
                          resolvedOutputFormat,
                          `content-${currentPreviewSlide.slideNumber}`
                        )}
                      </div>
                    </>
                  )}
                  {renderingPreviewSlideNumber === currentPreviewSlide.slideNumber && (
                    <span className="ai-slide-preview-loading">Đang render lại preview...</span>
                  )}
                  <span className="ai-slide-preview-tag">{currentPreviewSlide.slideType}</span>
                </article>

                <div className="ai-slide-item">
                  <div className="ai-slide-item-header">
                    <strong>Chỉnh sửa Slide {currentPreviewSlide.slideNumber}</strong>
                    <span>{currentPreviewSlide.slideType}</span>
                  </div>

                  <label>
                    <span>Heading</span>
                    <input
                      type="text"
                      value={currentPreviewSlide.heading}
                      onChange={(e) =>
                        handleSlideChange(activePreviewIndex, 'heading', e.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span>Content</span>
                    <textarea
                      rows={6}
                      value={currentPreviewSlide.content}
                      onChange={(e) =>
                        handleSlideChange(activePreviewIndex, 'content', e.target.value)
                      }
                    />
                  </label>
                </div>
              </div>
            )}

            <div className="ai-slide-actions" style={{ marginTop: '1.25rem' }}>
              <button
                className="btn btn-primary"
                onClick={() => void handlePreparePptx()}
                disabled={generatingPptx || !editableSlides.length}
              >
                {generatingPptx ? (
                  <LoadingSpinner label="Đang tạo PPTX..." />
                ) : (
                  'Confirm nội dung và tạo PPTX'
                )}
              </button>
            </div>

            {error && <p className="ai-slide-error">{error}</p>}
            {success && <p className="ai-slide-success">{success}</p>}
          </section>
        )}

        {activeMainTab === 'GENERATE' && activeWizardStep === 5 && (
          <section className="ai-slide-card">
            <h2>Bước 5: Tải file PPTX</h2>
            <div
              className="ai-slide-actions"
              style={{ marginBottom: '1rem', justifyContent: 'flex-start' }}
            >
              <button className="btn btn-outline" onClick={() => setActiveWizardStep(4)}>
                ← Quay lại Confirm nội dung
              </button>
            </div>

            <p className="ai-slide-info">
              File đã sẵn sàng: <strong>{preparedPptxFilename}</strong>
            </p>

            <div className="ai-slide-actions">
              <button
                className="btn btn-primary"
                onClick={handleDownloadPreparedPptx}
                disabled={!preparedPptxBlob}
              >
                Tải PPTX về máy
              </button>
            </div>

            {error && <p className="ai-slide-error">{error}</p>}
            {success && <p className="ai-slide-success">{success}</p>}
          </section>
        )}

        {generatingContent && (
          <div
            className="ai-slide-generating-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Đang tạo nội dung AI"
          >
            <div className="ai-slide-generating-popup">
              <div className="ai-slide-math-loader" role="status" aria-live="polite">
                <div className="ai-slide-math-loader-ring" aria-hidden="true" />
                <div className="ai-slide-math-loader-symbols" aria-hidden="true">
                  <span>x²</span>
                  <span>∫</span>
                  <span>π</span>
                  <span>√</span>
                  <span>Δ</span>
                </div>
                <p>AI đang tạo nội dung slide...</p>
              </div>

              <div className="ai-slide-generating-steps" aria-hidden="true">
                <span>Đang phân tích bài học</span>
                <span>Đang dựng dàn ý theo</span>
                <span>Đang tối ưu biểu thức toán học</span>
                <span>Đang hoàn tất nội dung</span>
              </div>
            </div>
          </div>
        )}

        {isGeneratedPreviewOpen && (
          <div className="ai-slide-modal-overlay" onClick={() => setIsGeneratedPreviewOpen(false)}>
            <div
              className="ai-slide-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Xem trước slide"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="ai-slide-modal-header">
                <h3>Xem trước slide trước khi tải</h3>
                <button
                  type="button"
                  className="ai-slide-modal-close"
                  onClick={() => setIsGeneratedPreviewOpen(false)}
                  aria-label="Đóng xem trước"
                >
                  ×
                </button>
              </div>

              <div className="ai-slide-modal-body">
                {(loadingSelectedGeneratedLesson || loadingGeneratedPreviewPdf) && (
                  <div className="ai-slide-math-loader" role="status" aria-live="polite">
                    <div className="ai-slide-math-loader-ring" aria-hidden="true" />
                    <div className="ai-slide-math-loader-symbols" aria-hidden="true">
                      <span>x²</span>
                      <span>∫</span>
                      <span>π</span>
                      <span>√</span>
                      <span>Δ</span>
                    </div>
                    <p>Đang dựng preview PDF...</p>
                  </div>
                )}

                {!loadingGeneratedPreviewPdf && generatedPreviewPdfUrl && (
                  <div className="ai-slide-office-viewer-wrap">
                    {!previewIframeLoaded && (
                      <div className="ai-slide-iframe-skeleton" aria-hidden="true">
                        <div className="ai-slide-iframe-skeleton__bar ai-slide-iframe-skeleton__bar--title" />
                        <div className="ai-slide-iframe-skeleton__slides">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="ai-slide-iframe-skeleton__slide">
                              <div className="ai-slide-iframe-skeleton__slide-inner" />
                            </div>
                          ))}
                        </div>
                        <div className="ai-slide-iframe-skeleton__hint">
                          <span className="ai-slide-iframe-skeleton__ring" />
                          Đang tải slide...
                        </div>
                      </div>
                    )}
                    <iframe
                      className={`ai-slide-office-viewer-frame${previewIframeLoaded ? ' ai-slide-office-viewer-frame--loaded' : ''}`}
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
                    <div className="ai-slide-preview-wrap ai-slide-modal-preview-wrap">
                      <div className="ai-slide-preview-toolbar">
                        <button
                          className="btn btn-outline"
                          onClick={() => setGeneratedPreviewIndex((prev) => Math.max(0, prev - 1))}
                          disabled={generatedPreviewIndex === 0}
                        >
                          Slide trước
                        </button>
                        <span>
                          Slide {generatedPreviewIndex + 1}/{generatedPreviewSlides.length}
                        </span>
                        <button
                          className="btn btn-outline"
                          onClick={() =>
                            setGeneratedPreviewIndex((prev) =>
                              Math.min(generatedPreviewSlides.length - 1, prev + 1)
                            )
                          }
                          disabled={generatedPreviewIndex === generatedPreviewSlides.length - 1}
                        >
                          Slide sau
                        </button>
                      </div>

                      <article className="ai-slide-preview-canvas">
                        <div className="ai-slide-preview-heading" role="heading" aria-level={4}>
                          {renderSlideText(
                            currentGeneratedPreviewSlide.heading || 'Chưa có tiêu đề',
                            resolvedOutputFormat,
                            `manage-heading-${currentGeneratedPreviewSlide.slideNumber}`
                          )}
                        </div>
                        <div className="ai-slide-preview-content">
                          {renderSlideText(
                            currentGeneratedPreviewSlide.content || 'Chưa có nội dung',
                            resolvedOutputFormat,
                            `manage-content-${currentGeneratedPreviewSlide.slideNumber}`
                          )}
                        </div>
                        <span className="ai-slide-preview-tag">
                          {currentGeneratedPreviewSlide.slideType}
                        </span>
                      </article>
                    </div>
                  )}
              </div>

              <div className="ai-slide-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsGeneratedPreviewOpen(false)}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={
                    !selectedGeneratedFile ||
                    loadingGeneratedPreviewPdf ||
                    openingGeneratedPreviewPdfTab
                  }
                  onClick={() => void handleOpenGeneratedPreviewInNewTab()}
                  title="Mở preview PDF trên tab mới"
                >
                  {openingGeneratedPreviewPdfTab ? 'Đang mở...' : 'Mở tab mới'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={
                    !selectedGeneratedFile ||
                    downloadingGeneratedFileId === selectedGeneratedFile.id
                  }
                  onClick={() =>
                    selectedGeneratedFile &&
                    void handleDownloadGeneratedFile(selectedGeneratedFile.id)
                  }
                >
                  {selectedGeneratedFile && downloadingGeneratedFileId === selectedGeneratedFile.id
                    ? 'Đang tải...'
                    : 'Tải file này'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isMetadataModalOpen && editingMetadataFile && (
          <div className="ai-slide-modal-overlay" onClick={closeMetadataModal}>
            <div
              className="ai-slide-modal ai-slide-metadata-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Chỉnh sửa slide"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="ai-slide-modal-header">
                <h3>Chỉnh sửa slide</h3>
                <button
                  type="button"
                  className="ai-slide-modal-close"
                  onClick={closeMetadataModal}
                  aria-label="Đóng"
                >
                  ×
                </button>
              </div>

              <form
                id="slide-edit-form"
                className="ai-slide-metadata-form"
                onSubmit={(e) => void handleUpdateMetadata(e)}
              >
                <div className="ai-slide-metadata-preview">
                  {generatedThumbnailUrls[editingMetadataFile.id] ? (
                    <img
                      src={generatedThumbnailUrls[editingMetadataFile.id]}
                      alt={getGeneratedDisplayName(editingMetadataFile)}
                      className="ai-slide-meta-thumb-img"
                    />
                  ) : (
                    <div className="ai-slide-meta-thumb-placeholder">
                      {getGeneratedDisplayName(editingMetadataFile).slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <label>
                  <span>Tên hiển thị</span>
                  <input
                    type="text"
                    value={metadataName}
                    onChange={(e) => setMetadataName(e.target.value)}
                    placeholder="Nhập tên hiển thị mới"
                  />
                </label>

                <label>
                  <span>Trạng thái</span>
                  <select
                    value={metadataIsPublic ? 'public' : 'draft'}
                    onChange={(e) => setMetadataIsPublic(e.target.value === 'public')}
                  >
                    <option value="draft">Nháp</option>
                    <option value="public">Công khai</option>
                  </select>
                </label>

                <div>
                  <span className="ai-slide-field-label">Ảnh thumbnail mới</span>
                  <label className="ai-slide-thumb-upload">
                    {metadataThumbnailFile ? (
                      <img
                        src={window.URL.createObjectURL(metadataThumbnailFile)}
                        alt="preview"
                        className="ai-slide-thumb-upload-preview"
                      />
                    ) : (
                      <div className="ai-slide-thumb-upload-placeholder">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <span>Chọn ảnh mới</span>
                        <small>PNG, JPG, WEBP</small>
                      </div>
                    )}
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                      style={{ display: 'none' }}
                      onChange={(e) => setMetadataThumbnailFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {metadataThumbnailFile && (
                    <button
                      type="button"
                      className="ai-slide-thumb-remove"
                      onClick={() => setMetadataThumbnailFile(null)}
                    >
                      ✕ Xóa ảnh mới
                    </button>
                  )}
                </div>
              </form>

              <div className="ai-slide-modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeMetadataModal}>
                  Hủy
                </button>
                <button
                  type="submit"
                  form="slide-edit-form"
                  className="btn btn-primary"
                  disabled={updatingMetadata}
                >
                  {updatingMetadata ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        )}

        {deletingGeneratedFile && (
          <div className="ai-slide-modal-overlay" onClick={closeDeleteGeneratedModal}>
            <div
              className="ai-slide-modal ai-slide-delete-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Xác nhận xóa slide"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="ai-slide-modal-header">
                <h3>Xác nhận xóa slide</h3>
                <button
                  type="button"
                  className="ai-slide-modal-close"
                  onClick={closeDeleteGeneratedModal}
                  aria-label="Đóng"
                  disabled={Boolean(deletingGeneratedFileId)}
                >
                  ×
                </button>
              </div>

              <div className="ai-slide-modal-body ai-slide-delete-modal-body">
                {deletingGeneratedFileId ? (
                  <div className="ai-slide-math-loader" role="status" aria-live="polite">
                    <div className="ai-slide-math-loader-ring" aria-hidden="true" />
                    <div className="ai-slide-math-loader-symbols" aria-hidden="true">
                      <span>x²</span>
                      <span>∫</span>
                      <span>π</span>
                      <span>√</span>
                      <span>Δ</span>
                    </div>
                    <p>Đang xóa slide...</p>
                  </div>
                ) : (
                  <p className="ai-slide-info ai-slide-delete-message">
                    Bạn có chắc muốn xóa{' '}
                    <strong>{getGeneratedDisplayName(deletingGeneratedFile)}</strong>?<br />
                    File sẽ bị ẩn khỏi danh sách ngay sau khi xác nhận.
                  </p>
                )}
              </div>

              <div className="ai-slide-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeDeleteGeneratedModal}
                  disabled={Boolean(deletingGeneratedFileId)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void handleDeleteGeneratedFile()}
                  disabled={Boolean(deletingGeneratedFileId)}
                >
                  {deletingGeneratedFileId ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AISlideGenerator;
