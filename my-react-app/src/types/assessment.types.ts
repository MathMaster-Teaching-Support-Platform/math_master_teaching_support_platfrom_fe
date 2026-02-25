export type AssessmentType = 'QUIZ' | 'TEST' | 'EXAM' | 'HOMEWORK';
export type AssessmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export interface AssessmentRequest {
    title: string;
    description?: string;
    assessmentType: AssessmentType;
    lessonId?: string;
    timeLimitMinutes?: number;
    passingScore?: number;
    startDate?: string;
    endDate?: string;
    randomizeQuestions?: boolean;
    showCorrectAnswers?: boolean;
    hasMatrix?: boolean;
}

export interface PointsOverrideRequest {
    questionId: string;
    pointsOverride: number;
}

export interface AssessmentResponse {
    id: string;
    teacherId: string;
    teacherName: string;
    lessonId: string;
    lessonTitle: string;
    title: string;
    description: string;
    assessmentType: AssessmentType;
    timeLimitMinutes: number;
    passingScore: number;
    startDate: string;
    endDate: string;
    randomizeQuestions: boolean;
    showCorrectAnswers: boolean;
    hasMatrix: boolean;
    status: AssessmentStatus;
    totalQuestions: number;
    totalPoints: number;
    submissionCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface AssessmentSummary {
    totalQuestions: number;
    totalPoints: number;
    timeLimitMinutes: number;
    startDate?: string;
    endDate?: string;
    hasSchedule: boolean;
    canPublish: boolean;
    validationMessage?: string;
}

export interface GetMyAssessmentsParams {
    status?: AssessmentStatus;
    lessonId?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
}
