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

    return rawSlides.map((slide, index) => {
      const item = (slide ?? {}) as Partial<LessonSlideItem>;
      return {
        slideNumber: Number(item.slideNumber) || index + 1,
        slideType: item.slideType || 'CONTENT',
        heading: item.heading || '',
        content: item.content || '',
      };
    });
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

const replaceInlineLatexCommands = (input: string): string => {
  if (!input) return input;

  return input
    .replace(/\\textbf\{([^{}]+)\}/g, '$1')
    .replace(/\\textit\{([^{}]+)\}/g, '$1')
    .replace(/\\emph\{([^{}]+)\}/g, '$1')
    .replace(/\\quad/g, ' ')
    .replace(/\\cdot/g, ' * ')
    .replace(/\\times/g, ' x ')
    .replace(/\\ne/g, ' != ')
    .replace(/\\leq/g, ' <= ')
    .replace(/\\geq/g, ' >= ')
    .replace(/\\in/g, ' in ')
    .replace(/\\mathbb\{Z\}/g, 'Z')
    .replace(/\\mathbb\{N\}/g, 'N')
    .replace(/\\mathbb\{Q\}/g, 'Q')
    .replace(/\\mathbb\{R\}/g, 'R')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
};

const normalizeLatexForPptx = (input: string): string => {
  if (!input) return input;

  const normalized = input
    .replace(/\\\\/g, '\\')
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, expr: string) => replaceInlineLatexCommands(expr.trim()))
    .replace(/\$([^$\n]+?)\$/g, (_, expr: string) => replaceInlineLatexCommands(expr.trim()))
    .replace(/\\\(([^)]+?)\\\)/g, (_, expr: string) => replaceInlineLatexCommands(expr.trim()))
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, expr: string) => replaceInlineLatexCommands(expr.trim()))
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}')
    .replace(/\\_/g, '_')
    .replace(/\\%/g, '%')
    .replace(/\\&/g, '&')
    .replace(/\\#/g, '#')
    .replace(/\\\$/g, '$')
    .replace(/\\,/g, ' ')
    .replace(/\\;/g, ' ')
    .replace(/\\!/g, '')
    .replace(/\\:/g, ':')
    .replace(/\\\n/g, '\n')
    .replace(/\\\\/g, '\n')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .trim();

  return replaceInlineLatexCommands(normalized)
    .replace(/\s{2,}/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .trim();
};

const wrapBareLatexForOfficeMath = (input: string): string => {
  if (!input) return input;

  const normalized = input.replace(/\\n/g, '\n');
  const latexChunkRegex =
    /(\\(?:frac|cdot|times|sqrt|sum|int|alpha|beta|gamma|delta|theta|lambda|pi|sigma|omega|mathbb|in|neq|ne|leq|geq|pm|mp|div|Box)(?:\{[^{}]*\})*(?:\s*[_^]\{?[^\s{}]+\}?)?(?:\s*[_^]\{?[^\s{}]+\}?)?)/g;

  return normalized.replace(latexChunkRegex, (chunk, _cmd, offset, fullText) => {
    const before = fullText.slice(0, offset);
    const after = fullText.slice(offset + chunk.length);
    const inDollarMath = before.lastIndexOf('$') > before.lastIndexOf('\n') && after.includes('$');

    if (inDollarMath) {
      return chunk;
    }

    return `$${chunk}$`;
  });
};

const renderSlideText = (
  text: string,
  outputFormat: LessonSlideOutputFormat,
  keyPrefix: string
): React.ReactNode => {
  if (!text) return null;

  if (!supportsMathRendering(outputFormat)) {
    return text;
  }

  return parseMathSegments(text).map((segment, index) => {
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
  const [equationMode, setEquationMode] = useState<LessonSlideEquationMode>('OMML');
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
  const [preparedPptxBlob, setPreparedPptxBlob] = useState<Blob | null>(null);
  const [preparedPptxFilename, setPreparedPptxFilename] = useState('lesson-slides.pptx');

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
  const [updatingGeneratedVisibilityId, setUpdatingGeneratedVisibilityId] = useState('');
  const [downloadingGeneratedFileId, setDownloadingGeneratedFileId] = useState('');
  const [publicGeneratedFiles, setPublicGeneratedFiles] = useState<LessonSlideGeneratedFile[]>([]);
  const [loadingPublicGeneratedFiles, setLoadingPublicGeneratedFiles] = useState(false);
  const [downloadingPublicGeneratedFileId, setDownloadingPublicGeneratedFileId] = useState('');

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
        const fileName = (file.fileName || '').toLowerCase();
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
          return (a.fileName || '').localeCompare(b.fileName || '');
        case 'NAME_DESC':
          return (b.fileName || '').localeCompare(a.fileName || '');
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

  const resolvedOutputFormat = useMemo(
    () => normalizeOutputFormat(generated?.outputFormat || outputFormat),
    [generated?.outputFormat, outputFormat]
  );

  const publicLessonIdForPreview = lessonId || selectedGeneratedFile?.lessonId || '';

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
    setActiveWizardStep(1);
  };

  const applyLessonSlideContentToEditor = (lesson: LessonResponse) => {
    const parsedSlides = parseSlidesFromLessonContent(lesson.lessonContent);

    if (!parsedSlides.length) {
      setError('Bài này chưa có nội dung slide đã gen để xem lại.');
      return;
    }

    const restoredResult: GenerateSlideContentResult = {
      subjectId,
      chapterId,
      lessonId: lesson.id,
      lessonTitle: lesson.title || selectedLesson?.title || 'Lesson',
      slideCount: parsedSlides.length,
      outputFormat,
      slides: parsedSlides,
    };

    setGenerated(restoredResult);
    setLessonId(lesson.id);
    setEditableSlides(parsedSlides);
    setActivePreviewIndex(0);
    setPreparedPptxBlob(null);
    setPreparedPptxFilename('lesson-slides.pptx');
    setSuccess('Đã nạp lại nội dung slide đã gen. Bạn có thể chỉnh sửa và xuất PPTX.');
    setError('');
    setActiveWizardStep(4);
  };

  const loadGeneratedFiles = useCallback(
    async (targetLessonId?: string) => {
      setLoadingGeneratedFiles(true);

      try {
        const response = await LessonSlideService.getGeneratedFiles(targetLessonId);
        const files = response.result || [];
        setGeneratedFiles(files);

        if (files.length === 0) {
          setSelectedGeneratedFileId('');
          setSelectedGeneratedLesson(null);
        } else if (!files.some((file) => file.id === selectedGeneratedFileId)) {
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
        setLoadingGeneratedFiles(false);
      }
    },
    [selectedGeneratedFileId]
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

  const loadPublicGeneratedFiles = useCallback(async (targetLessonId?: string) => {
    if (!targetLessonId) {
      setPublicGeneratedFiles([]);
      return;
    }

    setLoadingPublicGeneratedFiles(true);
    try {
      const response = await LessonSlideService.getPublicGeneratedFilesByLessonId(targetLessonId);
      setPublicGeneratedFiles(response.result || []);
    } catch {
      // Public endpoint can legitimately fail when lesson is not published yet.
      setPublicGeneratedFiles([]);
    } finally {
      setLoadingPublicGeneratedFiles(false);
    }
  }, []);

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

  const handleToggleGeneratedVisibility = async (
    generatedFileId: string,
    shouldPublish: boolean
  ) => {
    setUpdatingGeneratedVisibilityId(generatedFileId);
    setError('');
    setSuccess('');

    try {
      if (shouldPublish) {
        await LessonSlideService.publishGeneratedFile(generatedFileId);
        setSuccess('Đã publish file slide cho student thành công.');
      } else {
        await LessonSlideService.unpublishGeneratedFile(generatedFileId);
        setSuccess('Đã unpublish file slide. Student sẽ không thấy file này nữa.');
      }

      await loadGeneratedFiles(lessonId || undefined);
      await loadPublicGeneratedFiles(lessonId || undefined);
    } catch (err) {
      const apiError = err as Error & { code?: number };
      if (apiError.code === 1166) {
        setError('Không tìm thấy file slide để cập nhật trạng thái.');
      } else if (apiError.code === 1167) {
        setError('Bạn không có quyền cập nhật trạng thái file slide này.');
      } else {
        setError(
          err instanceof Error ? err.message : 'Không thể cập nhật trạng thái public của file slide'
        );
      }
    } finally {
      setUpdatingGeneratedVisibilityId('');
    }
  };

  const handleDownloadPublicGeneratedFile = async (generatedFileId: string) => {
    setDownloadingPublicGeneratedFileId(generatedFileId);
    setError('');
    setSuccess('');

    try {
      const response = await LessonSlideService.downloadPublicGeneratedFile(generatedFileId);
      triggerBlobDownload(response.blob, response.filename || 'generated-slide.pptx');
      setSuccess('Đã tải file từ endpoint public (student) thành công.');
    } catch (err) {
      const apiError = err as Error & { code?: number };
      if (apiError.code === 1168) {
        setError('File chưa public hoặc lesson chưa ở trạng thái PUBLISHED.');
      } else {
        setError(err instanceof Error ? err.message : 'Không thể tải file public cho student');
      }
    } finally {
      setDownloadingPublicGeneratedFileId('');
    }
  };

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
    void loadPublicGeneratedFiles(publicLessonIdForPreview || undefined);
  }, [publicLessonIdForPreview, loadPublicGeneratedFiles]);

  useEffect(() => {
    if (!selectedGeneratedFile) {
      setSelectedGeneratedLesson(null);
      return;
    }

    void loadLessonDetailFromGeneratedFile(selectedGeneratedFile);
  }, [selectedGeneratedFile, loadLessonDetailFromGeneratedFile]);

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

    setGeneratingContent(true);
    try {
      const response = await LessonSlideService.generateContent({
        schoolGradeId,
        subjectId,
        chapterId,
        lessonId,
        slideCount,
        additionalPrompt: additionalPrompt.trim() || undefined,
        outputFormat,
      });

      const normalizedResult: GenerateSlideContentResult = {
        ...response.result,
        outputFormat: normalizeOutputFormat(response.result.outputFormat),
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
          navigate('/student/wallet');
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
      const outputFormatForPptx: LessonSlideOutputFormat =
        equationMode === 'PLAIN_TEXT'
          ? 'PLAIN_TEXT'
          : resolvedOutputFormat === 'PLAIN_TEXT'
            ? 'LATEX'
            : resolvedOutputFormat;

      const slidesForPptx =
        equationMode === 'PLAIN_TEXT'
          ? editableSlides.map((slide) => ({
              ...slide,
              heading: normalizeLatexForPptx(slide.heading || ''),
              content: normalizeLatexForPptx(slide.content || ''),
            }))
          : editableSlides.map((slide) => ({
              ...slide,
              heading: wrapBareLatexForOfficeMath(slide.heading || ''),
              content: wrapBareLatexForOfficeMath(slide.content || ''),
            }));

      const response = await LessonSlideService.generatePptx({
        lessonId,
        templateId,
        outputFormat: outputFormatForPptx,
        equationMode,
        slides: slidesForPptx,
      });

      setPreparedPptxBlob(response.blob);
      setPreparedPptxFilename(response.filename || 'lesson-slides.pptx');
      setSuccess(`PPTX da san sang voi che do cong thuc: ${getEquationModeLabel(equationMode)}.`);
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
            <h2>Slide Library</h2>

            <div className="ai-slide-management-card">
              <div className="ai-slide-management-header">
                <h3>Thư viện file đã generate</h3>
                <p>
                  {lessonId
                    ? `Đang lọc theo lesson: ${lessonId}`
                    : 'Đang hiển thị tất cả file generated của bạn.'}
                </p>
              </div>

              <div className="ai-slide-management-toolbar">
                <label className="ai-slide-management-search">
                  <span>Tìm theo tên file / lessonId</span>
                  <input
                    type="text"
                    value={generatedSearch}
                    placeholder="VD: algebra hoặc 8c5d..."
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
              <div className="ai-slide-management-layout">
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
                    <div className="ai-slide-table-wrap">
                      <table className="ai-slide-table">
                        <thead>
                          <tr>
                            <th>File</th>
                            <th>Lesson</th>
                            <th>Created</th>
                            <th>Size</th>
                            <th>Public</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {managedGeneratedFiles.map((file) => (
                            <tr
                              key={file.id}
                              className={selectedGeneratedFileId === file.id ? 'active' : ''}
                              onClick={() => {
                                setSelectedGeneratedFileId(file.id);
                                setSuccess('');
                                setError('');
                              }}
                            >
                              <td title={file.fileName}>
                                {file.fileName || 'generated-slide.pptx'}
                              </td>
                              <td>{lessonTitleById[file.lessonId] || 'Đang tải tên bài...'}</td>
                              <td>{formatDateTime(file.createdAt)}</td>
                              <td>{formatFileSize(file.fileSizeBytes)}</td>
                              <td>
                                <span
                                  className={`ai-slide-public-badge ${file.isPublic ? 'yes' : 'no'}`}
                                >
                                  {file.isPublic ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleDownloadGeneratedFile(file.id);
                                  }}
                                  disabled={downloadingGeneratedFileId === file.id}
                                >
                                  Tải
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="ai-slide-management-detail-panel">
                  <div className="ai-slide-management-header">
                    <h3>Chi tiết file</h3>
                    <p>
                      {selectedGeneratedFile
                        ? `Đã chọn: ${selectedGeneratedFile.fileName || 'generated-slide.pptx'}`
                        : 'Chọn 1 dòng trong bảng để thao tác.'}
                    </p>
                  </div>

                  <div className="ai-slide-management-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={
                        !selectedGeneratedFile ||
                        selectedGeneratedFile.isPublic ||
                        updatingGeneratedVisibilityId === selectedGeneratedFile.id
                      }
                      onClick={() =>
                        selectedGeneratedFile &&
                        void handleToggleGeneratedVisibility(selectedGeneratedFile.id, true)
                      }
                    >
                      {selectedGeneratedFile &&
                      updatingGeneratedVisibilityId === selectedGeneratedFile.id
                        ? 'Đang cập nhật...'
                        : 'Publish'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={
                        !selectedGeneratedFile ||
                        !selectedGeneratedFile.isPublic ||
                        updatingGeneratedVisibilityId === selectedGeneratedFile.id
                      }
                      onClick={() =>
                        selectedGeneratedFile &&
                        void handleToggleGeneratedVisibility(selectedGeneratedFile.id, false)
                      }
                    >
                      Unpublish
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={
                        !selectedGeneratedFile ||
                        downloadingGeneratedFileId === selectedGeneratedFile.id
                      }
                      onClick={() =>
                        selectedGeneratedFile &&
                        void handleDownloadGeneratedFile(selectedGeneratedFile.id)
                      }
                    >
                      {selectedGeneratedFile &&
                      downloadingGeneratedFileId === selectedGeneratedFile.id
                        ? 'Đang tải...'
                        : 'Tải lại file'}
                    </button>
                  </div>

                  {loadingSelectedGeneratedLesson && (
                    <p className="ai-slide-info">Đang tải chi tiết lesson từ file đã chọn...</p>
                  )}

                  {!loadingSelectedGeneratedLesson && selectedGeneratedLesson && (
                    <div className="ai-slide-selected-lesson">
                      <div>
                        <strong>{selectedGeneratedLesson.title || 'Bài học'}</strong>
                        <span>Trạng thái lesson: {selectedGeneratedLesson.status || '--'}</span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                          applyLessonSlideContentToEditor(selectedGeneratedLesson);
                          setActiveMainTab('GENERATE');
                        }}
                      >
                        Xem lại nội dung đã gen
                      </button>
                    </div>
                  )}

                  <div className="ai-slide-management-header">
                    <h3>Student view (public files)</h3>
                    <p>Các file công khai mà học sinh có thể tải.</p>
                  </div>

                  {loadingPublicGeneratedFiles && (
                    <p className="ai-slide-info">Đang tải danh sách public generated...</p>
                  )}

                  {!loadingPublicGeneratedFiles && !publicLessonIdForPreview && (
                    <p className="ai-slide-info">
                      Chọn 1 generated file để preview danh sách public theo lesson tương ứng.
                    </p>
                  )}

                  {!loadingPublicGeneratedFiles &&
                    publicLessonIdForPreview &&
                    publicGeneratedFiles.length === 0 && (
                      <p className="ai-slide-info">Bài học này hiện chưa có file công khai.</p>
                    )}

                  {!loadingPublicGeneratedFiles && publicGeneratedFiles.length > 0 && (
                    <div className="ai-slide-table-wrap compact">
                      <table className="ai-slide-table">
                        <thead>
                          <tr>
                            <th>File</th>
                            <th>Published</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {publicGeneratedFiles.map((file) => (
                            <tr key={file.id}>
                              <td>{file.fileName || 'generated-slide.pptx'}</td>
                              <td>{formatDateTime(file.publishedAt)}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  disabled={downloadingPublicGeneratedFileId === file.id}
                                  onClick={() => void handleDownloadPublicGeneratedFile(file.id)}
                                >
                                  {downloadingPublicGeneratedFileId === file.id
                                    ? 'Đang tải...'
                                    : 'Download'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
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
                    min={1}
                    max={30}
                    value={slideCount}
                    onChange={(e) => setSlideCount(Number(e.target.value || 1))}
                  />
                </label>
              </div>

              <label className="ai-slide-full-width">
                <span>Additional Prompt</span>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Giải Phương Trình Bậc 2"
                  value={additionalPrompt}
                  onChange={(e) => setAdditionalPrompt(e.target.value)}
                />
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

            <label className="ai-slide-full-width">
              <span>Cach xuat cong thuc cho PowerPoint</span>
              <select
                value={equationMode}
                onChange={(e) => setEquationMode(e.target.value as LessonSlideEquationMode)}
              >
                <option value="OMML">OMML (Office Equation, khuyen nghi)</option>
                <option value="IMAGE">IMAGE (ve cong thuc thanh anh)</option>
                <option value="PLAIN_TEXT">PLAIN_TEXT (khong khuyen nghi)</option>
              </select>
              <p className="ai-slide-format-hint">
                OMML giu cong thuc dang Equation native cua Office. IMAGE dung khi cong thuc phuc
                tap.
              </p>
            </label>

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
                </div>

                <article className="ai-slide-preview-canvas">
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
      </div>
    </DashboardLayout>
  );
};

export default AISlideGenerator;
