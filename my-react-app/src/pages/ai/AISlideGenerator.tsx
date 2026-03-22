import React, { useEffect, useMemo, useRef, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { API_BASE_URL } from '../../config/api.config';
import { mockTeacher } from '../../data/mockData';
import { AuthService } from '../../services/api/auth.service';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import type {
  ChapterBySubject,
  GenerateSlideContentResult,
  LessonByChapter,
  LessonSlideItem,
  LessonSlideTemplate,
  SchoolGrade,
  SubjectByGrade,
} from '../../types/lessonSlide.types';
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

const AISlideGenerator: React.FC = () => {
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

  const [activeWizardStep, setActiveWizardStep] = useState(1);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const showSubjectStep = Boolean(schoolGradeId);
  const showChapterStep = Boolean(subjectId);
  const showLessonStep = Boolean(chapterId);

  const canConfigureAi = Boolean(lessonId);
  const canChooseTemplate = canConfigureAi;
  const loadingAnyCatalog =
    loadingGrades || loadingSubjects || loadingChapters || loadingLessons || loadingTemplates;
  const visualWizardStep = Math.min(activeWizardStep, 4);
  const wizardSteps = ['Chọn bài dạy', 'Chọn template', 'Gen nội dung', 'Confirm nội dung'];

  const clearGeneratedData = () => {
    setGenerated(null);
    setEditableSlides([]);
    setActivePreviewIndex(0);
    setPreparedPptxBlob(null);
    setPreparedPptxFilename('lesson-slides.pptx');
    setActiveWizardStep(1);
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
      });

      setGenerated(response.result);
      setEditableSlides(response.result.slides || []);
      setActivePreviewIndex(0);
      setPreparedPptxBlob(null);
      setPreparedPptxFilename('lesson-slides.pptx');
      setSuccess('Đã tạo nội dung slide bằng AI. Vui lòng kiểm tra và confirm nội dung.');
      setActiveWizardStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo nội dung slide');
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
      const response = await LessonSlideService.generatePptx({
        lessonId,
        templateId,
        slides: editableSlides,
      });

      setPreparedPptxBlob(response.blob);
      setPreparedPptxFilename(response.filename || 'lesson-slides.pptx');
      setSuccess('PPTX đã sẵn sàng. Bạn có thể xem preview slide và bấm tải khi muốn.');
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
        </div>

        {activeWizardStep === 1 && (
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
                      setLessonId(e.target.value);
                      clearGeneratedData();
                      setSuccess('');
                      setError('');
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

        {activeWizardStep === 2 && (
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

        {activeWizardStep === 3 && (
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

        {activeWizardStep === 4 && generated && (
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
              <strong>{generated.slideCount}</strong>
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
                </div>

                <article className="ai-slide-preview-canvas">
                  <h3>{currentPreviewSlide.heading || 'Chưa có tiêu đề'}</h3>
                  <p>{currentPreviewSlide.content || 'Chưa có nội dung'}</p>
                  <span>{currentPreviewSlide.slideType}</span>
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

        {activeWizardStep === 5 && (
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
