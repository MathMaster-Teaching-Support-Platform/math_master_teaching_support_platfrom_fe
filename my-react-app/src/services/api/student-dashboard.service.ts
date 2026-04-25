import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import type { ApiResponse } from '../../types/auth.types';
import { AuthService } from './auth.service';

export interface StudentDashboardSummary {
  student: {
    id: string;
    name: string;
    avatar: string | null;
  };
  notificationCount: number;
  stats: {
    enrolledCourses: number;
    completedAssignments: number;
    averageScore: number;
    pendingAssignments: number;
  };
  motivation: {
    goalAssignments: number;
    completedAssignments: number;
    remainingAssignments: number;
    progressPercent: number;
  };
  todayTaskCount: number;
}

export interface StudentDashboardTask {
  id: string;
  title: string;
  subject: string;
  dueDate: string | null;
  type: 'homework' | 'quiz' | 'exam';
  progressPercent: number;
}

export interface StudentDashboardGrade {
  id: string;
  title: string;
  subject: string;
  score: number;
  gradedAt: string;
}

export interface StudentDashboardProgress {
  subject: string;
  doneLessons: number;
  totalLessons: number;
  percent: number;
}

export interface StudentDashboardWeeklyActivity {
  range: {
    from: string;
    to: string;
  };
  totalHours: number;
  deltaPercentVsPreviousWeek: number;
  days: Array<{
    dayLabel: string;
    hours: number;
  }>;
}

export interface StudentDashboardStreak {
  currentStreakDays: number;
  days: Array<{
    dayLabel: string;
    active: boolean;
  }>;
  message: string;
}

export interface StudentDashboardPayload {
  summary: StudentDashboardSummary;
  upcomingTasks: StudentDashboardTask[];
  recentGrades: StudentDashboardGrade[];
  learningProgress: StudentDashboardProgress[];
  weeklyActivity: StudentDashboardWeeklyActivity;
  streak: StudentDashboardStreak;
}

function authHeaders(): Record<string, string> {
  const token = AuthService.getToken();
  if (!token) throw new Error('Authentication required');
  return {
    Authorization: `Bearer ${token}`,
    accept: '*/*',
  };
}

export class StudentDashboardService {
  static async getDashboard(): Promise<ApiResponse<StudentDashboardPayload>> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.STUDENT_DASHBOARD}`, {
      method: 'GET',
      headers: authHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch student dashboard');
    }

    return response.json();
  }
}
