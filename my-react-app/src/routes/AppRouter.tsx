import { GoogleOAuthProvider } from '@react-oauth/google';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import ServiceWorkerNavigationHandler from '../components/common/ServiceWorkerNavigationHandler';
import { ToastProvider } from '../context/ToastProvider';
import About from '../pages/About';
import Contact from '../pages/Contact';
import Features from '../pages/Features';
import Homepage from '../pages/Homepage';
import Pricing from '../pages/Pricing';
import SubscriptionManagement from '../pages/admin/SubscriptionManagement';
import UserManagement from '../pages/admin/UserManagement';
import AIAssistant from '../pages/ai/AIAssistant';
import AISlideGenerator from '../pages/ai/AISlideGenerator';
import TeacherAnalytics from '../pages/analytics/TeacherAnalytics';
import TeacherAssignments from '../pages/assignments/TeacherAssignments';
import { ConfirmEmail, ForgotPassword, Login, Register, ResetPassword } from '../pages/auth';
import OnboardingFlow from '../pages/auth/OnboardingFlow';
import Calendar from '../pages/calendar/Calendar';
import Certificates from '../pages/certificates/Certificates';
import LiveChat from '../pages/chat/LiveChat';
import EnrolledCourseWrapper from '../pages/courses/EnrolledCourseWrapper';
import StudentCourses from '../pages/courses/StudentCourses';
import TeacherCourseDetail from '../pages/courses/TeacherCourseDetail';
import TeacherCourses from '../pages/courses/TeacherCourses';
import UnifiedCourseView from '../pages/courses/UnifiedCourseView';
import AdminDashboard from '../pages/dashboard/admin/AdminDashboard';
import TeacherDashboard from '../pages/dashboard/teacher/TeacherDashboard';
import TeacherEarningsDashboard from '../pages/dashboard/teacher/TeacherEarningsDashboard';
import Forum from '../pages/forum/Forum';
import HelpCenter from '../pages/help/HelpCenter';
import MaterialsGenerator from '../pages/materials/MaterialsGenerator';
import NotificationCenter from '../pages/notifications/NotificationCenter';
import NotificationPreferences from '../pages/notifications/NotificationPreferences';
import RoadmapCatalogPage from '../pages/roadmap/RoadmapCatalogPage';
import RoadmapDashboardPage from '../pages/roadmap/RoadmapDashboardPage';
import RoadmapDetailPage from '../pages/roadmap/RoadmapDetailPage';
import StudentRoadmap from '../pages/roadmap/StudentRoadmap';
import TakeRoadmapEntryTest from '../pages/roadmap/TakeRoadmapEntryTest';
import SearchResults from '../pages/search/SearchResults';
import ProfileSettings from '../pages/settings/ProfileSettings';
import TeacherStudents from '../pages/students/TeacherStudents';
import StudentWallet from '../pages/wallet/StudentWallet';
// Teacher Profile Routes
// Profile Page
import Profile from '../pages/profile/Profile';
import TeacherProfilePage from '../pages/teacher-profile/TeacherProfilePage';
// Admin Teacher Profile Routes

import AdminAcademicStructurePage from '../pages/admin/AdminAcademicStructurePage';
import AdminCourseReviewDetail from '../pages/admin/AdminCourseReviewDetail';
import AdminCourseReviewsPage from '../pages/admin/AdminCourseReviewsPage';

import AdminOCRBooks from '../pages/admin/AdminOCRBooks';
import AdminOCRContent from '../pages/admin/AdminOCRContent';
import AdminRoadmapCreatePage from '../pages/admin/AdminRoadmapCreatePage';
import AdminRoadmapEditPage from '../pages/admin/AdminRoadmapEditPage';
import AdminRoadmapManagementPage from '../pages/admin/AdminRoadmapManagementPage';
import AdminRoadmapTopicsPage from '../pages/admin/AdminRoadmapTopicsPage';
import AdminSlideTemplates from '../pages/admin/AdminSlideTemplates';

import AdminCommissionProposals from '../pages/admin/AdminCommissionProposals';
import AdminSystemConfigPage from '../pages/admin/AdminSystemConfigPage';
import AdminWithdrawals from '../pages/admin/AdminWithdrawals';
import CashFlowDashboard from '../pages/admin/CashFlowDashboard';
import TokenCostConfigPage from '../pages/admin/TokenCostConfigPage';

import RevenueBreakdown from '../pages/admin/RevenueBreakdown';
import ReviewProfiles from '../pages/admin/ReviewProfiles';
import AssessmentDetail from '../pages/assessments/AssessmentDetailRefactored';
import TeacherAssessments from '../pages/assessments/TeacherAssessments';
import TeacherCommissionPage from '../pages/commission/TeacherCommissionPage';
import { ExamMatrixDashboard } from '../pages/exam-matrices/ExamMatrixDashboard';
import ExamMatrixDetailPage from '../pages/exam-matrices/ExamMatrixDetailPageRefactored';
import InstructorPublicProfile from '../pages/instructor/InstructorPublicProfile';
import { MindmapEditor, TeacherMindmaps } from '../pages/mindmaps';
import PublicMindmapViewer from '../pages/mindmaps/PublicMindmapViewer';
import StudentPublicMindmaps from '../pages/mindmaps/StudentPublicMindmaps';
import StudentPublicSlides from '../pages/mindmaps/StudentPublicSlides';
import { QuestionBankDashboard } from '../pages/question-banks/QuestionBankDashboard';
import { QuestionBankDetailPage } from '../pages/question-banks/QuestionBankDetailPage';
import { QuestionReviewQueue } from '../pages/question-templates/QuestionReviewQueue';
import { TemplateDashboard } from '../pages/question-templates/TemplateDashboard';
import TeacherQuestionManagementPage from '../pages/questions/TeacherQuestionManagementPage';
// Student Assessment Routes
import {
  AssessmentResult,
  AssessmentDetail as StudentAssessmentDetail,
  StudentAssessmentList,
  TakeAssessment,
} from '../pages/student-assessments';
// Grading Routes
// Test Components
import MathTextTest from '../components/common/MathTextTest';
import NotFound from '../pages/NotFound';
import PrivateRoute from './PrivateRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Homepage />,
  },
  {
    path: '/features',
    element: <Features />,
  },
  {
    path: '/about',
    element: <About />,
  },
  {
    path: '/pricing',
    element: <Pricing />,
  },
  {
    path: '/contact',
    element: <Contact />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/confirm-email',
    element: <ConfirmEmail />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  {
    path: '/select-role',
    element: <OnboardingFlow />,
  },
  {
    path: '/onboarding/teacher',
    element: <OnboardingFlow />,
  },
  {
    path: '/onboarding/student',
    element: <OnboardingFlow />,
  },
  {
    path: '/course/:courseId',
    element: <UnifiedCourseView />,
  },
  {
    path: '/dashboard',
    element: (
      <PrivateRoute allowedRoles={['teacher', 'admin']}>
        <RoadmapDashboardPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/roadmaps',
    element: (
      <PrivateRoute>
        <RoadmapCatalogPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/roadmaps/:roadmapId',
    element: (
      <PrivateRoute>
        <RoadmapDetailPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/roadmaps/:roadmapId/entry-test/take',
    element: (
      <PrivateRoute>
        <TakeRoadmapEntryTest />
      </PrivateRoute>
    ),
  },
  // Shared Routes (require login)
  {
    path: '/notifications',
    element: (
      <PrivateRoute>
        <NotificationCenter />
      </PrivateRoute>
    ),
  },
  {
    path: '/notifications/preferences',
    element: (
      <PrivateRoute>
        <NotificationPreferences />
      </PrivateRoute>
    ),
  },
  {
    path: '/search',
    element: (
      <PrivateRoute>
        <SearchResults />
      </PrivateRoute>
    ),
  },
  {
    path: '/forum',
    element: (
      <PrivateRoute>
        <Forum />
      </PrivateRoute>
    ),
  },
  {
    path: '/help',
    element: (
      <PrivateRoute>
        <HelpCenter />
      </PrivateRoute>
    ),
  },
  {
    path: '/chat',
    element: (
      <PrivateRoute>
        <LiveChat />
      </PrivateRoute>
    ),
  },
  {
    path: '/mindmaps/public/:id',
    element: (
      <PrivateRoute>
        <PublicMindmapViewer />
      </PrivateRoute>
    ),
  },
  // Profile (includes Teacher Profile management)
  {
    path: '/profile',
    element: (
      <PrivateRoute>
        <Profile />
      </PrivateRoute>
    ),
  },
  // Backward compatibility routes
  {
    path: '/submit-teacher-profile',
    element: (
      <PrivateRoute>
        <TeacherProfilePage />
      </PrivateRoute>
    ),
  },
  {
    path: '/my-teacher-profile',
    element: (
      <PrivateRoute>
        <TeacherProfilePage />
      </PrivateRoute>
    ),
  },
  // Teacher Routes
  {
    path: '/teacher/dashboard',
    element: (
      <PrivateRoute>
        <TeacherDashboard />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/earnings',
    element: (
      <PrivateRoute>
        <TeacherEarningsDashboard />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/courses',
    element: (
      <PrivateRoute>
        <TeacherCourses />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/courses/:courseId',
    element: (
      <PrivateRoute>
        <TeacherCourseDetail />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/materials',
    element: (
      <PrivateRoute>
        <MaterialsGenerator />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/assignments',
    element: (
      <PrivateRoute>
        <TeacherAssignments />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/assessments',
    element: (
      <PrivateRoute>
        <TeacherAssessments />
      </PrivateRoute>
    ),
  },
  {
    // Legacy URL — the standalone "Trình tạo đề" screen has been merged into
    // the unified Create Exam page at /teacher/assessments.
    path: '/teacher/assessment-builder',
    element: <Navigate to="/teacher/assessments" replace />,
  },
  {
    path: '/teacher/assessments/:id',
    element: (
      <PrivateRoute>
        <AssessmentDetail />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/mindmaps',
    element: (
      <PrivateRoute>
        <TeacherMindmaps />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/mindmaps/:id',
    element: (
      <PrivateRoute>
        <MindmapEditor />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/question-templates',
    element: (
      <PrivateRoute>
        <TemplateDashboard />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/question-review',
    element: (
      <PrivateRoute>
        <QuestionReviewQueue />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/question-banks',
    element: (
      <PrivateRoute>
        <QuestionBankDashboard />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/question-banks/:bankId',
    element: (
      <PrivateRoute>
        <QuestionBankDetailPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/questions',
    element: (
      <PrivateRoute>
        <TeacherQuestionManagementPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/exam-matrices',
    element: (
      <PrivateRoute>
        <ExamMatrixDashboard />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/exam-matrices/:matrixId',
    element: (
      <PrivateRoute>
        <ExamMatrixDetailPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/analytics',
    element: (
      <PrivateRoute>
        <TeacherAnalytics />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/students',
    element: (
      <PrivateRoute>
        <TeacherStudents />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/ai-assistant',
    element: (
      <PrivateRoute>
        <AIAssistant />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/ai-slide-generator',
    element: (
      <PrivateRoute>
        <AISlideGenerator />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/settings',
    element: (
      <PrivateRoute>
        <ProfileSettings />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/wallet',
    element: (
      <PrivateRoute>
        <StudentWallet />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/commission',
    element: (
      <PrivateRoute>
        <TeacherCommissionPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/teacher/*',
    element: (
      <PrivateRoute>
        <TeacherDashboard />
      </PrivateRoute>
    ),
  },
  // Student Routes
  {
    path: '/student/courses',
    element: (
      <PrivateRoute>
        <StudentCourses />
      </PrivateRoute>
    ),
  },
  {
    path: '/student/instructors/:id',
    element: (
      <PrivateRoute>
        <InstructorPublicProfile />
      </PrivateRoute>
    ),
  },
  {
    path: '/student/courses/:enrollmentId',
    element: (
      <PrivateRoute>
        <EnrolledCourseWrapper />
      </PrivateRoute>
    ),
  },
  {
    path: '/student/roadmap',
    element: (
      <PrivateRoute>
        <StudentRoadmap />
      </PrivateRoute>
    ),
  },
  {
    path: '/student/public-resources',
    element: (
      <PrivateRoute>
        <Navigate to="/student/public-slides" replace />
      </PrivateRoute>
    ),
  },
  {
    path: '/student/public-slides',
    element: (
      <PrivateRoute>
        <StudentPublicSlides />
      </PrivateRoute>
    ),
  },
  {
    path: '/student/public-mindmaps',
    element: (
      <PrivateRoute>
        <StudentPublicMindmaps />
      </PrivateRoute>
    ),
  },

  {
    path: '/student/certificates',
    element: (
      <PrivateRoute>
        <Certificates />
      </PrivateRoute>
    ),
  },
  {
    path: '/student/calendar',
    element: (
      <PrivateRoute>
        <Calendar />
      </PrivateRoute>
    ),
  },
  // Student Assessment Routes
  {
    path: '/student/assessments',
    element: (
      <PrivateRoute>
        <StudentAssessmentList />
      </PrivateRoute>
    ),
  },
  {
    path: '/student/assessments/:assessmentId',
    element: (
      <PrivateRoute>
        <StudentAssessmentDetail />
      </PrivateRoute>
    ),
  },
  {
    path: '/student/assessments/:assessmentId/take',
    element: (
      <PrivateRoute>
        <TakeAssessment />
      </PrivateRoute>
    ),
  },
  {
    path: '/student/assessments/result/:submissionId',
    element: (
      <PrivateRoute>
        <AssessmentResult />
      </PrivateRoute>
    ),
  },
  {
    path: '/student/ai-assistant',
    element: (
      <PrivateRoute>
        <AIAssistant />
      </PrivateRoute>
    ),
  },
  {
    path: '/student/wallet',
    element: (
      <PrivateRoute>
        <StudentWallet />
      </PrivateRoute>
    ),
  },
  {
    path: '/student/settings',
    element: (
      <PrivateRoute>
        <ProfileSettings />
      </PrivateRoute>
    ),
  },
  // Admin Routes
  {
    path: '/admin/dashboard',
    element: (
      <PrivateRoute>
        <AdminDashboard />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <PrivateRoute>
        <UserManagement />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/subscriptions',
    element: (
      <PrivateRoute>
        <SubscriptionManagement />
      </PrivateRoute>
    ),
  },
  // Teacher Profile Management (Admin)
  {
    path: '/admin/review-profiles',
    element: (
      <PrivateRoute>
        <ReviewProfiles />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/courses/review',
    element: (
      <PrivateRoute>
        <AdminCourseReviewsPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/academic-structure',
    element: (
      <PrivateRoute>
        <AdminAcademicStructurePage />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/courses/:courseId/review',
    element: (
      <PrivateRoute>
        <AdminCourseReviewDetail />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/roadmaps',
    element: (
      <PrivateRoute>
        <AdminRoadmapManagementPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/roadmaps/create',
    element: (
      <PrivateRoute>
        <AdminRoadmapCreatePage />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/roadmaps/edit/:roadmapId',
    element: (
      <PrivateRoute>
        <AdminRoadmapEditPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/roadmaps/:roadmapId/topics',
    element: (
      <PrivateRoute>
        <AdminRoadmapTopicsPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/slide-templates',
    element: (
      <PrivateRoute>
        <AdminSlideTemplates />
      </PrivateRoute>
    ),
  },

  {
    path: '/admin/withdrawals',
    element: (
      <PrivateRoute>
        <AdminWithdrawals />
      </PrivateRoute>
    ),
  },

  {
    path: '/admin/commission-proposals',
    element: (
      <PrivateRoute>
        <AdminCommissionProposals />
      </PrivateRoute>
    ),
  },

  {
    path: '/admin/revenue-breakdown',
    element: (
      <PrivateRoute>
        <RevenueBreakdown />
      </PrivateRoute>
    ),
  },

  {
    path: '/admin/cash-flow',
    element: (
      <PrivateRoute>
        <CashFlowDashboard />
      </PrivateRoute>
    ),
  },

  {
    path: '/admin/settings',
    element: (
      <PrivateRoute>
        <ProfileSettings />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/system-config',
    element: (
      <PrivateRoute>
        <AdminSystemConfigPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/token-config',
    element: (
      <PrivateRoute>
        <TokenCostConfigPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/ocr/books',
    element: (
      <PrivateRoute>
        <AdminOCRBooks />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/ocr/books/:bookId',
    element: (
      <PrivateRoute>
        <AdminOCRContent />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/ocr/content',
    element: (
      <PrivateRoute>
        <AdminOCRContent />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/*',
    element: <NotFound />,
  },
  // Test Routes (remove in production)
  {
    path: '/test/math-text',
    element: <MathTextTest />,
  },
  // Add more routes as needed
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default function AppRouter() {
  return (
    <GoogleOAuthProvider clientId="299660266172-38kfomfcv0pcvrhrg0pas04rhfskqn8u.apps.googleusercontent.com">
      <ToastProvider>
        <RouterProvider router={router} />
        <ServiceWorkerNavigationHandler />
      </ToastProvider>
    </GoogleOAuthProvider>
  );
}
