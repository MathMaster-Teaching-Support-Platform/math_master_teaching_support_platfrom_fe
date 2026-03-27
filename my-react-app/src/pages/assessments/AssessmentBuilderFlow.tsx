import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { TemplateFormModal } from '../question-templates/TemplateFormModal';
import {
  useArchiveTemplate,
  useCreateQuestionTemplate,
  useGenerateQuestions,
  useGetMyQuestionTemplates,
  usePublishTemplate,
  useUpdateQuestionTemplate,
} from '../../hooks/useQuestionTemplate';
import {
  useBulkApproveQuestions,
  useGetQuestionsByBank,
  useDeleteQuestion,
  useReviewQuestions,
  useUpdateQuestion,
} from '../../hooks/useQuestion';
import { TemplateStatus, type QuestionTemplateRequest, type QuestionTemplateResponse } from '../../types/questionTemplate';
import { QuestionBankFormModal } from '../question-banks/QuestionBankFormModal';
import {
  useCreateQuestionBank,
  useSearchQuestionBanks,
} from '../../hooks/useQuestionBank';
import type { QuestionResponse, UpdateQuestionRequest } from '../../types/question';
import type { QuestionBankRequest } from '../../types/questionBank';
import {
  useAddBankMapping,
  useCreateExamMatrix,
  useGetBankMappings,
  useGetMyExamMatrices,
  useMatrixValidation,
  useRemoveBankMapping,
} from '../../hooks/useExamMatrix';
import { ExamMatrixFormModal } from '../exam-matrices/ExamMatrixFormModal';
import type { AddBankMappingRequest, ExamMatrixRequest } from '../../types/examMatrix';
import {
  useAssessment,
  useAssessmentQuestions,
  useGenerateAssessmentFromMatrix,
  usePublishAssessment,
} from '../../hooks/useAssessment';
import type {
  AssessmentGenerationSummary,
  AssessmentQuestionItem,
  AssessmentSelectionStrategy,
} from '../../types/assessment.types';
import '../../styles/module-refactor.css';
import './assessment-builder-flow.css';

type ToastState = {
  type: 'success' | 'error';
  message: string;
};

type DifficultyValue = 'EASY' | 'MEDIUM' | 'HARD';

type QuestionEditModalProps = Readonly<{
  isOpen: boolean;
  question: QuestionResponse | null;
  onClose: () => void;
  onSubmit: (request: UpdateQuestionRequest) => Promise<void>;
}>;

function QuestionEditModal({ isOpen, question, onClose, onSubmit }: QuestionEditModalProps) {
  const [questionText, setQuestionText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyValue>('MEDIUM');
  const [cognitiveLevel, setCognitiveLevel] = useState('THONG_HIEU');
  const [points, setPoints] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !question) return;
    setQuestionText(question.questionText || '');
    setExplanation(question.explanation || '');
    setDifficulty((question.difficulty as DifficultyValue) || 'MEDIUM');
    setCognitiveLevel(question.cognitiveLevel || 'THONG_HIEU');
    setPoints(question.points || 1);
  }, [isOpen, question]);

  if (!isOpen || !question) return null;

  async function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        questionText,
        explanation,
        difficulty,
        cognitiveLevel: cognitiveLevel as UpdateQuestionRequest['cognitiveLevel'],
        points,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="module-layout-container">
      <div className="modal-layer">
        <div className="modal-card" style={{ width: 'min(720px, 100%)' }}>
          <div className="modal-header">
            <div>
              <h3>Chinh sua cau hoi</h3>
              <p className="muted" style={{ marginTop: 4 }}>
                Dieu chinh noi dung truoc khi phe duyet vao ngan hang.
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Noi dung cau hoi
                </p>
                <textarea
                  className="textarea"
                  rows={4}
                  required
                  value={questionText}
                  onChange={(event) => setQuestionText(event.target.value)}
                />
              </label>

              <div className="form-grid">
                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>
                    Do kho
                  </p>
                  <select
                    className="select"
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value as DifficultyValue)}
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </label>

                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>
                    Cognitive level
                  </p>
                  <select
                    className="select"
                    value={cognitiveLevel}
                    onChange={(event) => setCognitiveLevel(event.target.value)}
                  >
                    <option value="NHAN_BIET">NHAN_BIET</option>
                    <option value="THONG_HIEU">THONG_HIEU</option>
                    <option value="VAN_DUNG">VAN_DUNG</option>
                    <option value="VAN_DUNG_CAO">VAN_DUNG_CAO</option>
                    <option value="REMEMBER">REMEMBER</option>
                    <option value="UNDERSTAND">UNDERSTAND</option>
                    <option value="APPLY">APPLY</option>
                    <option value="ANALYZE">ANALYZE</option>
                    <option value="EVALUATE">EVALUATE</option>
                    <option value="CREATE">CREATE</option>
                  </select>
                </label>

                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>
                    Diem
                  </p>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    step={0.5}
                    value={points}
                    onChange={(event) => setPoints(Number(event.target.value))}
                  />
                </label>
              </div>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Giai thich
                </p>
                <textarea
                  className="textarea"
                  rows={3}
                  value={explanation}
                  onChange={(event) => setExplanation(event.target.value)}
                />
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn secondary" onClick={onClose}>
                Huy
              </button>
              <button type="submit" className="btn" disabled={saving}>
                {saving ? 'Dang luu...' : 'Luu thay doi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

type BankMappingModalProps = Readonly<{
  isOpen: boolean;
  bankOptions: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSubmit: (request: AddBankMappingRequest) => Promise<void>;
}>;

function BankMappingModal({ isOpen, bankOptions, onClose, onSubmit }: BankMappingModalProps) {
  const [questionBankId, setQuestionBankId] = useState('');
  const [easy, setEasy] = useState(0);
  const [medium, setMedium] = useState(0);
  const [hard, setHard] = useState(0);
  const [cognitiveLevel, setCognitiveLevel] = useState('THONG_HIEU');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setQuestionBankId('');
    setEasy(0);
    setMedium(0);
    setHard(0);
    setCognitiveLevel('THONG_HIEU');
    setSaving(false);
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        questionBankId,
        cognitiveLevel,
        difficultyDistribution: {
          EASY: easy,
          MEDIUM: medium,
          HARD: hard,
        },
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="module-layout-container">
      <div className="modal-layer">
        <div className="modal-card" style={{ width: 'min(680px, 100%)' }}>
          <div className="modal-header">
            <div>
              <h3>Them bank mapping</h3>
              <p className="muted" style={{ marginTop: 4 }}>
                Cau hinh so luong cau hoi theo do kho va muc nhan thuc.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Question bank
                </p>
                <select
                  className="select"
                  required
                  value={questionBankId}
                  onChange={(event) => setQuestionBankId(event.target.value)}
                >
                  <option value="">Chon ngan hang</option>
                  {bankOptions.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="form-grid">
                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>
                    EASY
                  </p>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    value={easy}
                    onChange={(event) => setEasy(Number(event.target.value))}
                  />
                </label>
                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>
                    MEDIUM
                  </p>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    value={medium}
                    onChange={(event) => setMedium(Number(event.target.value))}
                  />
                </label>
                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>
                    HARD
                  </p>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    value={hard}
                    onChange={(event) => setHard(Number(event.target.value))}
                  />
                </label>
              </div>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Cognitive level
                </p>
                <select
                  className="select"
                  value={cognitiveLevel}
                  onChange={(event) => setCognitiveLevel(event.target.value)}
                >
                  <option value="NHAN_BIET">NHAN_BIET</option>
                  <option value="THONG_HIEU">THONG_HIEU</option>
                  <option value="VAN_DUNG">VAN_DUNG</option>
                  <option value="VAN_DUNG_CAO">VAN_DUNG_CAO</option>
                  <option value="REMEMBER">REMEMBER</option>
                  <option value="UNDERSTAND">UNDERSTAND</option>
                  <option value="APPLY">APPLY</option>
                  <option value="ANALYZE">ANALYZE</option>
                  <option value="EVALUATE">EVALUATE</option>
                  <option value="CREATE">CREATE</option>
                </select>
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn secondary" onClick={onClose}>
                Huy
              </button>
              <button type="submit" className="btn" disabled={saving || !questionBankId}>
                {saving ? 'Dang them...' : 'Them mapping'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const templateStatusClass: Record<TemplateStatus, string> = {
  DRAFT: 'badge draft',
  PUBLISHED: 'badge published',
  ARCHIVED: 'badge archived',
};

const difficultyLabel: Record<string, string> = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
};

function normalizeQuestionsPayload(payload: unknown): QuestionResponse[] {
  if (!payload || typeof payload !== 'object') return [];
  const candidate = payload as { result?: unknown };
  const result = candidate.result;
  if (Array.isArray(result)) return result as QuestionResponse[];
  if (result && typeof result === 'object') {
    const paged = result as { content?: unknown };
    if (Array.isArray(paged.content)) return paged.content as QuestionResponse[];
  }
  return [];
}

function getQuestionStatusBadgeClass(status?: string) {
  if (status === 'APPROVED') return 'published';
  if (status === 'AI_DRAFT') return 'assessment-builder-flow__badge-ai-draft';
  return 'draft';
}

// NOSONAR: Orchestrator screen intentionally keeps multi-step flow state in one place.
export default function AssessmentBuilderFlow() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [templateMode, setTemplateMode] = useState<'create' | 'edit'>('create');
  const [templateEditing, setTemplateEditing] = useState<QuestionTemplateResponse | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const [generateCount, setGenerateCount] = useState(20);
  const [easyCount, setEasyCount] = useState(8);
  const [mediumCount, setMediumCount] = useState(8);
  const [hardCount, setHardCount] = useState(4);

  const [questionSearch, setQuestionSearch] = useState('');
  const [questionStatusFilter, setQuestionStatusFilter] = useState<'ALL' | 'AI_DRAFT' | 'APPROVED'>('ALL');
  const [questionDifficultyFilter, setQuestionDifficultyFilter] = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');
  const [questionCognitiveFilter, setQuestionCognitiveFilter] = useState('ALL');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<string[]>([]);
  const [questionEditTarget, setQuestionEditTarget] = useState<QuestionResponse | null>(null);

  const [bankFormOpen, setBankFormOpen] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState('');

  const [matrixFormOpen, setMatrixFormOpen] = useState(false);
  const [selectedMatrixId, setSelectedMatrixId] = useState('');
  const [mappingModalOpen, setMappingModalOpen] = useState(false);

  const [selectionStrategy, setSelectionStrategy] = useState<AssessmentSelectionStrategy>('BANK_FIRST');
  const [reuseApprovedQuestions, setReuseApprovedQuestions] = useState(true);
  const [lastGeneration, setLastGeneration] = useState<AssessmentGenerationSummary | null>(null);
  const [generatedAssessmentId, setGeneratedAssessmentId] = useState('');

  const templatesQuery = useGetMyQuestionTemplates(0, 200, 'createdAt', 'DESC');
  const createTemplateMutation = useCreateQuestionTemplate();
  const updateTemplateMutation = useUpdateQuestionTemplate();
  const publishTemplateMutation = usePublishTemplate();
  const archiveTemplateMutation = useArchiveTemplate();
  const generateQuestionsMutation = useGenerateQuestions();

  const reviewQuestionsQuery = useReviewQuestions(selectedTemplateId, !!selectedTemplateId);
  const bulkApproveMutation = useBulkApproveQuestions();
  const updateQuestionMutation = useUpdateQuestion();
  const deleteQuestionMutation = useDeleteQuestion();

  const banksQuery = useSearchQuestionBanks({
    page: 0,
    size: 100,
    sortBy: 'createdAt',
    sortDirection: 'DESC',
  });
  const createBankMutation = useCreateQuestionBank();
  const bankQuestionsQuery = useGetQuestionsByBank(selectedBankId, 0, 100, !!selectedBankId);

  const matricesQuery = useGetMyExamMatrices();
  const createMatrixMutation = useCreateExamMatrix();
  const bankMappingsQuery = useGetBankMappings(selectedMatrixId, !!selectedMatrixId);
  const matrixValidationQuery = useMatrixValidation(selectedMatrixId, !!selectedMatrixId);
  const addBankMappingMutation = useAddBankMapping();
  const removeBankMappingMutation = useRemoveBankMapping();

  const generateAssessmentMutation = useGenerateAssessmentFromMatrix();
  const generatedAssessmentQuery = useAssessment(generatedAssessmentId, {
    enabled: !!generatedAssessmentId,
  });
  const assessmentQuestionsQuery = useAssessmentQuestions(generatedAssessmentId, {
    enabled: !!generatedAssessmentId,
  });
  const publishAssessmentMutation = usePublishAssessment();

  const templates = templatesQuery.data?.result?.content ?? [];
  const selectedTemplate = templates.find((item) => item.id === selectedTemplateId) || null;

  const reviewQuestions = useMemo(
    () => normalizeQuestionsPayload(reviewQuestionsQuery.data),
    [reviewQuestionsQuery.data]
  );

  const filteredReviewQuestions = useMemo(() => {
    return reviewQuestions.filter((item) => {
      if (questionStatusFilter !== 'ALL' && item.questionStatus !== questionStatusFilter) return false;
      if (questionDifficultyFilter !== 'ALL' && item.difficulty !== questionDifficultyFilter) return false;
      if (questionCognitiveFilter !== 'ALL' && item.cognitiveLevel !== questionCognitiveFilter) return false;
      if (!questionSearch.trim()) return true;
      const q = questionSearch.toLowerCase();
      return (
        item.questionText.toLowerCase().includes(q) ||
        (item.explanation?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [reviewQuestions, questionStatusFilter, questionDifficultyFilter, questionCognitiveFilter, questionSearch]);

  const approvedCount = reviewQuestions.filter((item) => item.questionStatus === 'APPROVED').length;

  const questionBanks = banksQuery.data?.result?.content ?? [];
  const selectedBank = questionBanks.find((item) => item.id === selectedBankId) || null;

  const bankQuestions = normalizeQuestionsPayload(bankQuestionsQuery.data);

  const bankDifficultyDistribution = useMemo(() => {
    return bankQuestions.reduce(
      (acc, item) => {
        if (item.difficulty === 'EASY') acc.EASY += 1;
        if (item.difficulty === 'MEDIUM') acc.MEDIUM += 1;
        if (item.difficulty === 'HARD') acc.HARD += 1;
        return acc;
      },
      { EASY: 0, MEDIUM: 0, HARD: 0 }
    );
  }, [bankQuestions]);

  const matrices = matricesQuery.data?.result ?? [];
  const selectedMatrix = matrices.find((item) => item.id === selectedMatrixId) || null;
  const bankMappings = bankMappingsQuery.data?.result ?? [];
  const validation = matrixValidationQuery.data?.result;

  const generatedAssessment = generatedAssessmentQuery.data?.result;
  const assessmentQuestions = assessmentQuestionsQuery.data?.result ?? [];

  useEffect(() => {
    if (!toast) return;
    const timer = globalThis.setTimeout(() => setToast(null), 3200);
    return () => globalThis.clearTimeout(timer);
  }, [toast]);

  async function handleSaveTemplate(payload: QuestionTemplateRequest) {
    if (templateMode === 'create') {
      const response = await createTemplateMutation.mutateAsync(payload);
      const createdId = response.result?.id;
      if (createdId) setSelectedTemplateId(createdId);
      setToast({ type: 'success', message: 'Tao template thanh cong.' });
      return;
    }
    if (!templateEditing) return;
    await updateTemplateMutation.mutateAsync({ id: templateEditing.id, request: payload });
    setToast({ type: 'success', message: 'Cap nhat template thanh cong.' });
  }

  async function generateQuestions() {
    if (!selectedTemplateId) {
      setToast({ type: 'error', message: 'Hay chon template truoc khi tao cau hoi AI.' });
      return;
    }
    if (generateCount <= 0) {
      setToast({ type: 'error', message: 'So luong cau hoi phai lon hon 0.' });
      return;
    }

    try {
      const response = await generateQuestionsMutation.mutateAsync({
        id: selectedTemplateId,
        count: generateCount,
        difficultyDistribution: {
          EASY: easyCount,
          MEDIUM: mediumCount,
          HARD: hardCount,
        },
      });
      await reviewQuestionsQuery.refetch();
      const warnings = response.result?.warnings ?? [];
      setToast({
        type: 'success',
        message: warnings.length > 0 ? `Tao xong voi canh bao: ${warnings[0]}` : 'Da tao batch cau hoi AI.',
      });
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Khong tao duoc cau hoi.',
      });
    }
  }

  function toggleQuestionSelection(questionId: string) {
    setSelectedQuestionIds((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    );
  }

  function toggleExpandedQuestion(questionId: string) {
    setExpandedQuestionIds((prev) => {
      if (prev.includes(questionId)) {
        return prev.filter((id) => id !== questionId);
      }
      return [...prev, questionId];
    });
  }

  async function approveSelectedQuestions() {
    if (selectedQuestionIds.length === 0) {
      setToast({ type: 'error', message: 'Chua chon cau hoi de phe duyet.' });
      return;
    }
    await bulkApproveMutation.mutateAsync(selectedQuestionIds);
    setSelectedQuestionIds([]);
    await reviewQuestionsQuery.refetch();
    setToast({ type: 'success', message: 'Da phe duyet cac cau hoi da chon.' });
  }

  async function deleteSelectedQuestions() {
    if (selectedQuestionIds.length === 0) {
      setToast({ type: 'error', message: 'Chua chon cau hoi de xoa.' });
      return;
    }
    const confirmed = globalThis.confirm('Ban co chac chan muon xoa cac cau hoi da chon?');
    if (!confirmed) return;

    await Promise.all(selectedQuestionIds.map((id) => deleteQuestionMutation.mutateAsync(id)));
    setSelectedQuestionIds([]);
    await reviewQuestionsQuery.refetch();
    setToast({ type: 'success', message: 'Da xoa cac cau hoi da chon.' });
  }

  async function updateQuestion(questionId: string, request: UpdateQuestionRequest) {
    await updateQuestionMutation.mutateAsync({ questionId, request });
    await reviewQuestionsQuery.refetch();
    setToast({ type: 'success', message: 'Da cap nhat cau hoi.' });
  }

  async function deleteQuestion(questionId: string) {
    const confirmed = globalThis.confirm('Ban co chac chan muon xoa cau hoi nay?');
    if (!confirmed) return;
    await deleteQuestionMutation.mutateAsync(questionId);
    await reviewQuestionsQuery.refetch();
    setToast({ type: 'success', message: 'Da xoa cau hoi.' });
  }

  async function saveQuestionBank(payload: QuestionBankRequest) {
    const response = await createBankMutation.mutateAsync(payload);
    const createdBankId = response.result?.id;
    if (createdBankId) {
      setSelectedBankId(createdBankId);
    }
    setToast({ type: 'success', message: 'Da tao question bank.' });
  }

  async function saveMatrix(payload: ExamMatrixRequest) {
    const response = await createMatrixMutation.mutateAsync(payload);
    const createdMatrixId = response.result?.id;
    if (createdMatrixId) {
      setSelectedMatrixId(createdMatrixId);
    }
    setToast({ type: 'success', message: 'Da tao exam matrix.' });
  }

  async function addBankMapping(request: AddBankMappingRequest) {
    if (!selectedMatrixId) return;
    await addBankMappingMutation.mutateAsync({ matrixId: selectedMatrixId, request });
    await bankMappingsQuery.refetch();
    await matrixValidationQuery.refetch();
    setToast({ type: 'success', message: 'Da them bank mapping.' });
  }

  async function removeBankMapping(mappingId: string) {
    if (!selectedMatrixId) return;
    await removeBankMappingMutation.mutateAsync({ matrixId: selectedMatrixId, mappingId });
    await bankMappingsQuery.refetch();
    await matrixValidationQuery.refetch();
    setToast({ type: 'success', message: 'Da xoa bank mapping.' });
  }

  async function generateAssessment() {
    if (!selectedMatrixId) {
      setToast({ type: 'error', message: 'Chua chon exam matrix.' });
      return;
    }
    if (bankMappings.length === 0) {
      setToast({ type: 'error', message: 'Matrix chua co bank mapping, khong the generate.' });
      return;
    }

    const response = await generateAssessmentMutation.mutateAsync({
      examMatrixId: selectedMatrixId,
      reuseApprovedQuestions,
      selectionStrategy,
    });

    const generatedId = response.result?.id;
    if (generatedId) {
      setGeneratedAssessmentId(generatedId);
    }

    const resultPayload = response.result as unknown as {
      totalQuestionsGenerated?: number;
      questionsFromBank?: number;
      questionsFromAi?: number;
      warnings?: string[];
    };

    setLastGeneration({
      totalQuestionsGenerated:
        resultPayload.totalQuestionsGenerated ?? response.result?.totalQuestions ?? 0,
      questionsFromBank: resultPayload.questionsFromBank,
      questionsFromAi: resultPayload.questionsFromAi,
      warnings: resultPayload.warnings ?? [],
    });

    setToast({ type: 'success', message: 'Da generate assessment tu matrix.' });
  }

  async function publishGeneratedAssessment() {
    if (!generatedAssessmentId || !generatedAssessment) return;
    if (generatedAssessment.status !== 'DRAFT') {
      setToast({ type: 'error', message: 'Assessment nay khong o trang thai DRAFT.' });
      return;
    }
    await publishAssessmentMutation.mutateAsync(generatedAssessmentId);
    await generatedAssessmentQuery.refetch();
    setToast({ type: 'success', message: 'Da publish assessment.' });
  }

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
    >
      <div className="module-layout-container">
        <section className="module-page assessment-builder-flow">
          <header className="page-header">
            <div>
              <h2>AI-Assisted Assessment Builder</h2>
              <p>
                Luong day du: Template - AI Generate - Review - Bank - Matrix - Assessment.
              </p>
            </div>
          </header>

          <article className="data-card assessment-builder-flow__step">
            <div className="assessment-builder-flow__step-title">
              <span className="badge draft">1</span>
              <h3>Template Authoring</h3>
            </div>

            <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <p className="muted">Tao/chinh sua template va quan ly trang thai DRAFT/PUBLISHED/ARCHIVED.</p>
              <button
                className="btn"
                onClick={() => {
                  setTemplateMode('create');
                  setTemplateEditing(null);
                  setTemplateFormOpen(true);
                }}
              >
                <Plus size={14} />
                Tao template
              </button>
            </div>

            {templates.length === 0 ? (
              <div className="empty">Chua co template nao.</div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Template</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((template) => (
                      <tr key={template.id}>
                        <td>
                          <div>
                            <strong>{template.name}</strong>
                            <p className="muted" style={{ marginTop: 4 }}>
                              {template.description || 'Khong co mo ta'}
                            </p>
                          </div>
                        </td>
                        <td>
                          <span className={templateStatusClass[template.status]}>{template.status}</span>
                        </td>
                        <td>
                          <div className="row" style={{ justifyContent: 'start', flexWrap: 'wrap' }}>
                            <button
                              className={`btn secondary ${selectedTemplateId === template.id ? 'assessment-builder-flow__selected-btn' : ''}`}
                              onClick={() => setSelectedTemplateId(template.id)}
                            >
                              <Check size={14} />
                              {selectedTemplateId === template.id ? 'Dang chon' : 'Chon'}
                            </button>
                            {template.status === TemplateStatus.DRAFT && (
                              <>
                                <button
                                  className="btn secondary"
                                  onClick={() => {
                                    setTemplateMode('edit');
                                    setTemplateEditing(template);
                                    setTemplateFormOpen(true);
                                  }}
                                >
                                  <Pencil size={14} />
                                  Chinh sua
                                </button>
                                <button
                                  className="btn"
                                  onClick={() => publishTemplateMutation.mutate(template.id)}
                                >
                                  Publish
                                </button>
                              </>
                            )}
                            {template.status === TemplateStatus.PUBLISHED && (
                              <button
                                className="btn warn"
                                onClick={() => archiveTemplateMutation.mutate(template.id)}
                              >
                                <Archive size={14} />
                                Archive
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <article className="data-card assessment-builder-flow__step">
            <div className="assessment-builder-flow__step-title">
              <span className="badge draft">2</span>
              <h3>AI Question Generation + Review</h3>
            </div>

            <div className="assessment-builder-flow__panel">
              <h4>Generate Panel</h4>
              <div className="form-grid">
                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>
                    Count
                  </p>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={generateCount}
                    onChange={(event) => setGenerateCount(Number(event.target.value))}
                  />
                </label>
                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>
                    EASY
                  </p>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    value={easyCount}
                    onChange={(event) => setEasyCount(Number(event.target.value))}
                  />
                </label>
                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>
                    MEDIUM
                  </p>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    value={mediumCount}
                    onChange={(event) => setMediumCount(Number(event.target.value))}
                  />
                </label>
                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>
                    HARD
                  </p>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    value={hardCount}
                    onChange={(event) => setHardCount(Number(event.target.value))}
                  />
                </label>
              </div>

              <button
                className="btn"
                disabled={!selectedTemplate || generateQuestionsMutation.isPending}
                onClick={() => void generateQuestions()}
              >
                <Sparkles size={14} />
                {generateQuestionsMutation.isPending ? 'Dang generate...' : 'Generate Questions'}
              </button>
            </div>

            <div className="assessment-builder-flow__panel">
              <h4>Review Table</h4>
              <div className="toolbar">
                <input
                  className="input"
                  placeholder="Tim cau hoi"
                  value={questionSearch}
                  onChange={(event) => setQuestionSearch(event.target.value)}
                />

                <select
                  className="select"
                  value={questionStatusFilter}
                  onChange={(event) =>
                    setQuestionStatusFilter(event.target.value as 'ALL' | 'AI_DRAFT' | 'APPROVED')
                  }
                >
                  <option value="ALL">Tat ca status</option>
                  <option value="AI_DRAFT">AI_DRAFT</option>
                  <option value="APPROVED">APPROVED</option>
                </select>

                <select
                  className="select"
                  value={questionDifficultyFilter}
                  onChange={(event) =>
                    setQuestionDifficultyFilter(event.target.value as 'ALL' | 'EASY' | 'MEDIUM' | 'HARD')
                  }
                >
                  <option value="ALL">Tat ca do kho</option>
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </select>

                <select
                  className="select"
                  value={questionCognitiveFilter}
                  onChange={(event) => setQuestionCognitiveFilter(event.target.value)}
                >
                  <option value="ALL">Tat ca cognitive</option>
                  <option value="NHAN_BIET">NHAN_BIET</option>
                  <option value="THONG_HIEU">THONG_HIEU</option>
                  <option value="VAN_DUNG">VAN_DUNG</option>
                  <option value="VAN_DUNG_CAO">VAN_DUNG_CAO</option>
                  <option value="REMEMBER">REMEMBER</option>
                  <option value="UNDERSTAND">UNDERSTAND</option>
                  <option value="APPLY">APPLY</option>
                  <option value="ANALYZE">ANALYZE</option>
                  <option value="EVALUATE">EVALUATE</option>
                  <option value="CREATE">CREATE</option>
                </select>
              </div>

              <div className="assessment-builder-flow__bulk-bar">
                <span className="muted">Da chon {selectedQuestionIds.length} cau hoi</span>
                <div className="row" style={{ flexWrap: 'wrap' }}>
                  <button
                    className="btn"
                    disabled={bulkApproveMutation.isPending || selectedQuestionIds.length === 0}
                    onClick={() => void approveSelectedQuestions()}
                  >
                    {bulkApproveMutation.isPending ? 'Dang approve...' : 'Approve selected'}
                  </button>
                  <button
                    className="btn danger"
                    disabled={deleteQuestionMutation.isPending || selectedQuestionIds.length === 0}
                    onClick={() => void deleteSelectedQuestions()}
                  >
                    Delete selected
                  </button>
                </div>
              </div>

              {reviewQuestionsQuery.isLoading && (
                <div className="empty">Dang tai cau hoi theo template...</div>
              )}
              {!reviewQuestionsQuery.isLoading && filteredReviewQuestions.length === 0 && (
                <div className="empty">Khong co cau hoi nao khop bo loc.</div>
              )}
              {!reviewQuestionsQuery.isLoading && filteredReviewQuestions.length > 0 && (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={
                              filteredReviewQuestions.length > 0 &&
                              selectedQuestionIds.length === filteredReviewQuestions.length
                            }
                            onChange={(event) => {
                              if (event.target.checked) {
                                setSelectedQuestionIds(filteredReviewQuestions.map((item) => item.id));
                                return;
                              }
                              setSelectedQuestionIds([]);
                            }}
                          />
                        </th>
                        <th>Question</th>
                        <th>Difficulty</th>
                        <th>Cognitive</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReviewQuestions.map((question) => {
                        const expanded = expandedQuestionIds.includes(question.id);
                        const shortText =
                          question.questionText.length > 140
                            ? `${question.questionText.slice(0, 140)}...`
                            : question.questionText;
                        const statusClass = getQuestionStatusBadgeClass(question.questionStatus);

                        return (
                          <tr key={question.id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedQuestionIds.includes(question.id)}
                                onChange={() => toggleQuestionSelection(question.id)}
                              />
                            </td>
                            <td>
                              <div>
                                <div>{expanded ? question.questionText : shortText}</div>
                                {question.questionText.length > 140 && (
                                  <button
                                    className="assessment-builder-flow__link-btn"
                                    onClick={() => toggleExpandedQuestion(question.id)}
                                  >
                                    {expanded ? (
                                      <>
                                        Thu gon <ChevronUp size={13} />
                                      </>
                                    ) : (
                                      <>
                                        Mo rong <ChevronDown size={13} />
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td>{difficultyLabel[question.difficulty || ''] || question.difficulty || '-'}</td>
                            <td>{question.cognitiveLevel || '-'}</td>
                            <td>
                              <span className={`badge ${statusClass}`}>
                                {question.questionStatus || '-'}
                              </span>
                            </td>
                            <td>
                              <div className="row" style={{ justifyContent: 'start', flexWrap: 'wrap' }}>
                                {question.questionStatus !== 'APPROVED' && (
                                  <button
                                    className="btn secondary"
                                    onClick={() => void bulkApproveMutation.mutateAsync([question.id])}
                                  >
                                    <CheckCircle2 size={14} />
                                    Approve
                                  </button>
                                )}
                                <button
                                  className="btn secondary"
                                  onClick={() => setQuestionEditTarget(question)}
                                >
                                  <Pencil size={14} />
                                  Edit
                                </button>
                                <button
                                  className="btn danger"
                                  onClick={() => void deleteQuestion(question.id)}
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </article>

          <article className="data-card assessment-builder-flow__step">
            <div className="assessment-builder-flow__step-title">
              <span className="badge draft">3</span>
              <h3>Question Bank Manager</h3>
            </div>

            <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div className="row" style={{ flexWrap: 'wrap' }}>
                <select
                  className="select"
                  value={selectedBankId}
                  onChange={(event) => setSelectedBankId(event.target.value)}
                  style={{ minWidth: 320 }}
                >
                  <option value="">Chon question bank</option>
                  {questionBanks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name} ({bank.questionCount} questions)
                    </option>
                  ))}
                </select>
                <button className="btn secondary" onClick={() => setBankFormOpen(true)}>
                  <Plus size={14} />
                  Tao bank
                </button>
              </div>
              {selectedBank && (
                <div className="assessment-builder-flow__distribution">
                  <span>Total: {bankQuestions.length}</span>
                  <span>EASY: {bankDifficultyDistribution.EASY}</span>
                  <span>MEDIUM: {bankDifficultyDistribution.MEDIUM}</span>
                  <span>HARD: {bankDifficultyDistribution.HARD}</span>
                </div>
              )}
            </div>

            {selectedBankId && bankQuestions.length === 0 && (
              <div className="empty">Bank hien tai chua co cau hoi.</div>
            )}
            {selectedBankId && bankQuestions.length > 0 && (
              <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Question</th>
                        <th>Difficulty</th>
                        <th>Cognitive</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bankQuestions.map((item) => (
                        <tr key={item.id}>
                          <td>{item.questionText}</td>
                          <td>{item.difficulty || '-'}</td>
                          <td>{item.cognitiveLevel || '-'}</td>
                          <td>{item.questionStatus || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
            )}
            {!selectedBankId && (
              <div className="empty">Chon mot bank de xem va quan ly cau hoi.</div>
            )}
          </article>

          <article className="data-card assessment-builder-flow__step">
            <div className="assessment-builder-flow__step-title">
              <span className="badge draft">4</span>
              <h3>Exam Matrix Builder</h3>
            </div>

            <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div className="row" style={{ flexWrap: 'wrap' }}>
                <select
                  className="select"
                  value={selectedMatrixId}
                  onChange={(event) => setSelectedMatrixId(event.target.value)}
                  style={{ minWidth: 320 }}
                >
                  <option value="">Chon exam matrix</option>
                  {matrices.map((matrix) => (
                    <option key={matrix.id} value={matrix.id}>
                      {matrix.name} ({matrix.status})
                    </option>
                  ))}
                </select>
                <button className="btn secondary" onClick={() => setMatrixFormOpen(true)}>
                  <Plus size={14} />
                  Tao matrix
                </button>
                <button
                  className="btn"
                  disabled={!selectedMatrix}
                  onClick={() => setMappingModalOpen(true)}
                >
                  <Plus size={14} />
                  Add bank mapping
                </button>
              </div>
            </div>

            {selectedMatrixId ? (
              <>
                {bankMappings.length === 0 ? (
                  <div className="empty">Matrix chua co bank mapping nao.</div>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Bank</th>
                          <th>Cognitive</th>
                          <th>Distribution</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bankMappings.map((mapping) => (
                          <tr key={mapping.id}>
                            <td>{mapping.questionBankName || mapping.questionBankId}</td>
                            <td>{mapping.cognitiveLevel || '-'}</td>
                            <td>
                              EASY {mapping.difficultyDistribution.EASY || 0} | MEDIUM {mapping.difficultyDistribution.MEDIUM || 0} | HARD {mapping.difficultyDistribution.HARD || 0}
                            </td>
                            <td>
                              <button
                                className="btn danger"
                                onClick={() => void removeBankMapping(mapping.id)}
                              >
                                <Trash2 size={14} />
                                Xoa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="assessment-builder-flow__panel">
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <h4>Validation Panel</h4>
                    <button className="btn secondary" onClick={() => void matrixValidationQuery.refetch()}>
                      Refresh validation
                    </button>
                  </div>

                  {validation ? (
                    <div className="assessment-builder-flow__validation-grid">
                      <div className="stat-card">
                        <p>canApprove</p>
                        <h3>{validation.canApprove ? 'true' : 'false'}</h3>
                      </div>
                      <div className="stat-card">
                        <p>errors</p>
                        <h3>{validation.errors.length}</h3>
                      </div>
                      <div className="stat-card">
                        <p>warnings</p>
                        <h3>{validation.warnings.length}</h3>
                      </div>
                      <div className="stat-card">
                        <p>aiFallbackLikely</p>
                        <h3>{validation.aiFallbackLikely ? 'true' : 'false'}</h3>
                      </div>
                    </div>
                  ) : (
                    <div className="empty">Chua co bao cao validation.</div>
                  )}

                  {validation?.aiFallbackLikely && (
                    <div className="assessment-builder-flow__warning-banner">
                      <AlertTriangle size={16} />
                      Question bank may not have enough questions. AI will generate additional questions.
                    </div>
                  )}

                  {validation && validation.errors.length > 0 && (
                    <ul className="assessment-builder-flow__issues assessment-builder-flow__issues--error">
                      {validation.errors.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {validation && validation.warnings.length > 0 && (
                    <ul className="assessment-builder-flow__issues assessment-builder-flow__issues--warn">
                      {validation.warnings.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <div className="empty">Chon matrix de them mapping va validate.</div>
            )}
          </article>

          <article className="data-card assessment-builder-flow__step">
            <div className="assessment-builder-flow__step-title">
              <span className="badge draft">5</span>
              <h3>Assessment Generation (BANK_FIRST)</h3>
            </div>

            <div className="form-grid">
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  selectionStrategy
                </p>
                <select
                  className="select"
                  value={selectionStrategy}
                  onChange={(event) =>
                    setSelectionStrategy(event.target.value as AssessmentSelectionStrategy)
                  }
                >
                  <option value="BANK_FIRST">BANK_FIRST</option>
                  <option value="AI_FIRST">AI_FIRST</option>
                  <option value="MIXED">MIXED</option>
                </select>
              </label>
              <label className="row" style={{ justifyContent: 'start', marginTop: 28 }}>
                <input
                  type="checkbox"
                  checked={reuseApprovedQuestions}
                  onChange={(event) => setReuseApprovedQuestions(event.target.checked)}
                />
                {' '}
                reuseApprovedQuestions
              </label>
            </div>

            {approvedCount === 0 && (
              <div className="assessment-builder-flow__warning-banner">
                <AlertTriangle size={16} />
                Chua co cau hoi APPROVED tu buoc review. Ban nen phe duyet truoc khi generate.
              </div>
            )}

            <button
              className="btn"
              disabled={!selectedMatrix || bankMappings.length === 0 || generateAssessmentMutation.isPending}
              onClick={() => void generateAssessment()}
            >
              {generateAssessmentMutation.isPending ? 'Dang generate...' : 'Generate from Matrix'}
            </button>

            {lastGeneration && (
              <div className="assessment-builder-flow__generation-summary">
                <h4>Result Summary</h4>
                <div className="stats-grid">
                  <article className="stat-card">
                    <p>totalQuestionsGenerated</p>
                    <h3>{lastGeneration.totalQuestionsGenerated ?? '-'}</h3>
                  </article>
                  <article className="stat-card">
                    <p>questionsFromBank</p>
                    <h3>{lastGeneration.questionsFromBank ?? '-'}</h3>
                  </article>
                  <article className="stat-card">
                    <p>questionsFromAi</p>
                    <h3>{lastGeneration.questionsFromAi ?? '-'}</h3>
                  </article>
                </div>

                {lastGeneration.warnings && lastGeneration.warnings.length > 0 && (
                  <ul className="assessment-builder-flow__issues assessment-builder-flow__issues--warn">
                    {lastGeneration.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </article>

          <article className="data-card assessment-builder-flow__step">
            <div className="assessment-builder-flow__step-title">
              <span className="badge draft">6</span>
              <h3>Final Assessment Preview</h3>
            </div>

            {generatedAssessmentId ? (
              <>
                <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div>
                    <p className="muted">Assessment ID: {generatedAssessmentId}</p>
                    <p className="muted">Status: {generatedAssessment?.status || '-'}</p>
                  </div>
                  <button
                    className="btn"
                    disabled={generatedAssessment?.status !== 'DRAFT' || publishAssessmentMutation.isPending}
                    onClick={() => void publishGeneratedAssessment()}
                  >
                    {publishAssessmentMutation.isPending ? 'Dang publish...' : 'Publish Assessment'}
                  </button>
                </div>

                {assessmentQuestions.length === 0 ? (
                  <div className="empty">Assessment nay chua co cau hoi de preview.</div>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Question</th>
                          <th>Source</th>
                          <th>Difficulty</th>
                          <th>Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assessmentQuestions.map((item: AssessmentQuestionItem) => {
                          const source =
                            item.source ||
                            (item.questionSourceType === 'AI_GENERATED' || item.questionSourceType === 'AI'
                              ? 'AI'
                              : 'BANK');
                          return (
                            <tr key={item.id}>
                              <td>{item.questionText}</td>
                              <td>
                                {source === 'AI' ? (
                                  <span className="badge assessment-builder-flow__badge-ai">AI</span>
                                ) : (
                                  <span className="badge draft">BANK</span>
                                )}
                              </td>
                              <td>{item.difficulty || '-'}</td>
                              <td>{item.points ?? '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div className="empty">Sau khi generate, preview cau hoi se hien thi tai day.</div>
            )}
          </article>

          <TemplateFormModal
            isOpen={templateFormOpen}
            mode={templateMode}
            initialData={templateEditing}
            onClose={() => setTemplateFormOpen(false)}
            onSubmit={handleSaveTemplate}
          />

          <QuestionEditModal
            isOpen={!!questionEditTarget}
            question={questionEditTarget}
            onClose={() => setQuestionEditTarget(null)}
            onSubmit={(request) =>
              questionEditTarget
                ? updateQuestion(questionEditTarget.id, request)
                : Promise.resolve()
            }
          />

          <QuestionBankFormModal
            isOpen={bankFormOpen}
            mode="create"
            initialData={null}
            onClose={() => setBankFormOpen(false)}
            onSubmit={saveQuestionBank}
          />

          <ExamMatrixFormModal
            isOpen={matrixFormOpen}
            mode="create"
            initialData={null}
            onClose={() => setMatrixFormOpen(false)}
            onSubmit={saveMatrix}
          />

          <BankMappingModal
            isOpen={mappingModalOpen}
            bankOptions={questionBanks.map((item) => ({ id: item.id, name: item.name }))}
            onClose={() => setMappingModalOpen(false)}
            onSubmit={addBankMapping}
          />

          {toast && (
            <div className={`assessment-builder-flow__toast assessment-builder-flow__toast--${toast.type}`}>
              {toast.message}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
