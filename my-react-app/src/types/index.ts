// Shared TypeScript types/interfaces

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student' | 'admin' | 'guest';
  avatar?: string;
  school?: string;
  grade?: string | number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  grade: number;
  chapter: number;
  lessons: number;
  students: number;
  status: 'active' | 'draft' | 'archived';
  thumbnail: string;
  createdAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  duration: number;
  materials: string[];
  completed: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded' | 'upcoming';
  score?: number;
  totalQuestions: number;
  timeLimit: number;
  type: 'homework' | 'quiz' | 'exam';
}

export interface Material {
  id: string;
  title: string;
  type: 'slide' | 'mindmap' | 'diagram' | 'exercise' | 'assessment' | 'lesson-plan';
  format: string;
  size: string;
  downloads: number;
  createdAt: string;
  tags: string[];
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  courseId: string;
  enrolledDate: string;
  completedLessons: number;
  totalLessons: number;
  averageScore: number;
  lastActive: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'assignment' | 'grade' | 'announcement' | 'system';
  read: boolean;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  users: number;
  status: 'active' | 'inactive';
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  planId: string;
  planName: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  createdAt: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface DashboardStats {
  totalUsers?: number;
  activeUsers?: number;
  totalCourses?: number;
  totalRevenue?: number;
  totalStudents?: number;
  totalMaterials?: number;
  completedAssignments?: number;
  averageScore?: number;
}
