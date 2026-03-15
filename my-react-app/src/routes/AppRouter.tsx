import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Homepage from '../pages/Homepage';
import Features from '../pages/Features';
import About from '../pages/About';
import Pricing from '../pages/Pricing';
import Contact from '../pages/Contact';
import { Login, Register } from '../pages/auth';
import SelectRole from '../pages/auth/SelectRole';
import TeacherVerification from '../pages/auth/TeacherVerification';
import StudentOnboarding from '../pages/auth/StudentOnboarding';
import TeacherDashboard from '../pages/dashboard/teacher/TeacherDashboard';
import StudentDashboard from '../pages/dashboard/student/StudentDashboard';
import AdminDashboard from '../pages/dashboard/admin/AdminDashboard';
import AIAssistant from '../pages/ai/AIAssistant';
import TeacherCourses from '../pages/courses/TeacherCourses';
import StudentCourses from '../pages/courses/StudentCourses';
import ProfileSettings from '../pages/settings/ProfileSettings';
import MaterialsGenerator from '../pages/materials/MaterialsGenerator';
import TeacherAssignments from '../pages/assignments/TeacherAssignments';
import StudentAssignments from '../pages/assignments/StudentAssignments';
import StudentGrades from '../pages/grades/StudentGrades';
import TeacherAnalytics from '../pages/analytics/TeacherAnalytics';
import UserManagement from '../pages/admin/UserManagement';
import SubscriptionManagement from '../pages/admin/SubscriptionManagement';
import StudentRoadmap from '../pages/roadmap/StudentRoadmap';
import StudentWallet from '../pages/wallet/StudentWallet';
import NotificationCenter from '../pages/notifications/NotificationCenter';
import SearchResults from '../pages/search/SearchResults';
import TeacherStudents from '../pages/students/TeacherStudents';
import Forum from '../pages/forum/Forum';
import HelpCenter from '../pages/help/HelpCenter';
import Certificates from '../pages/certificates/Certificates';
import Calendar from '../pages/calendar/Calendar';
import CoursePreview from '../pages/preview/CoursePreview';
import LiveChat from '../pages/chat/LiveChat';
// Teacher Profile Routes
// Profile Page
import Profile from '../pages/profile/Profile';
// Admin Teacher Profile Routes
import ReviewProfiles from '../pages/admin/ReviewProfiles';
// import SchoolManagement from '../pages/admin/SchoolManagement';
import TeacherAssessments from '../pages/assessments/TeacherAssessments';
import AssessmentDetail from '../pages/assessments/AssessmentDetail';
import { TeacherMindmaps, MindmapEditor } from '../pages/mindmaps';
import { TemplateDashboard } from '../pages/question-templates/TemplateDashboard';
import { ExamMatrixDashboard } from '../pages/exam-matrices/ExamMatrixDashboard';
import ExamMatrixDetailPage from '../pages/exam-matrices/ExamMatrixDetailPage';
import { QuestionBankDashboard } from '../pages/question-banks/QuestionBankDashboard';
import { QuestionBankDetailPage } from '../pages/question-banks/QuestionBankDetailPage';

const router = createBrowserRouter([
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
    path: '/select-role',
    element: <SelectRole />,
  },
  {
    path: '/onboarding/teacher',
    element: <TeacherVerification />,
  },
  {
    path: '/onboarding/student',
    element: <StudentOnboarding />,
  },
  {
    path: '/course/:id',
    element: <CoursePreview />,
  },
  // Shared Routes
  {
    path: '/notifications',
    element: <NotificationCenter />,
  },
  {
    path: '/search',
    element: <SearchResults />,
  },
  {
    path: '/forum',
    element: <Forum />,
  },
  {
    path: '/help',
    element: <HelpCenter />,
  },
  {
    path: '/chat',
    element: <LiveChat />,
  },
  // Profile (includes Teacher Profile management)
  {
    path: '/profile',
    element: <Profile />,
  },
  // Backward compatibility routes
  {
    path: '/submit-teacher-profile',
    element: <Profile />,
  },
  {
    path: '/my-teacher-profile',
    element: <Profile />,
  },
  // Teacher Routes
  {
    path: '/teacher/dashboard',
    element: <TeacherDashboard />,
  },
  {
    path: '/teacher/courses',
    element: <TeacherCourses />,
  },
  {
    path: '/teacher/materials',
    element: <MaterialsGenerator />,
  },
  {
    path: '/teacher/assignments',
    element: <TeacherAssignments />,
  },
  {
    path: '/teacher/assessments',
    element: <TeacherAssessments />,
  },
  {
    path: '/teacher/assessments/:id',
    element: <AssessmentDetail />,
  },
  {
    path: '/teacher/mindmaps',
    element: <TeacherMindmaps />,
  },
  {
    path: '/teacher/mindmaps/:id',
    element: <MindmapEditor />,
  },
  {
    path: '/teacher/question-templates',
    element: <TemplateDashboard />,
  },
  {
    path: '/teacher/question-banks',
    element: <QuestionBankDashboard />,
  },
  {
    path: '/teacher/question-banks/:bankId',
    element: <QuestionBankDetailPage />,
  },
  {
    path: '/teacher/exam-matrices',
    element: <ExamMatrixDashboard />,
  },
  {
    path: '/teacher/exam-matrices/:matrixId',
    element: <ExamMatrixDetailPage />,
  },
  {
    path: '/teacher/analytics',
    element: <TeacherAnalytics />,
  },
  { path: '/teacher/students', element: <TeacherStudents /> },
  { path: '/teacher/ai-assistant', element: <AIAssistant /> },
  {
    path: '/teacher/settings',
    element: <ProfileSettings />,
  },
  {
    path: '/teacher/*',
    element: <TeacherDashboard />,
  },
  // Student Routes
  {
    path: '/student/dashboard',
    element: <StudentDashboard />,
  },
  {
    path: '/student/courses',
    element: <StudentCourses />,
  },
  {
    path: '/student/assignments',
    element: <StudentAssignments />,
  },
  {
    path: '/student/grades',
    element: <StudentGrades />,
  },
  {
    path: '/student/roadmap',
    element: <StudentRoadmap />,
  },
  {
    path: '/student/wallet',
    element: <StudentWallet />,
  },
  {
    path: '/student/certificates',
    element: <Certificates />,
  },
  {
    path: '/student/calendar',
    element: <Calendar />,
  },
  {
    path: '/student/settings',
    element: <ProfileSettings />,
  },
  {
    path: '/student/*',
    element: <StudentDashboard />,
  },
  // Admin Routes
  {
    path: '/admin/dashboard',
    element: <AdminDashboard />,
  },
  { path: '/admin/users', element: <UserManagement /> },
  {
    path: '/admin/subscriptions',
    element: <SubscriptionManagement />,
  },
  // Teacher Profile Management (Admin)
  {
    path: '/admin/review-profiles',
    element: <ReviewProfiles />,
  },
  /* {
    path: '/admin/schools',
    element: <SchoolManagement />,
  }, */
  { path: '/admin/settings', element: <ProfileSettings /> },
  {
    path: '/admin/*',
    element: <AdminDashboard />,
  },
  // Add more routes as needed
  {
    path: '*',
    element: (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 'bold' }}>
          Go back to homepage
        </a>
      </div>
    ),
  },
]);

import { GoogleOAuthProvider } from '@react-oauth/google';

export default function AppRouter() {
  return (
    <GoogleOAuthProvider clientId="299660266172-38kfomfcv0pcvrhrg0pas04rhfskqn8u.apps.googleusercontent.com">
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  );
}
