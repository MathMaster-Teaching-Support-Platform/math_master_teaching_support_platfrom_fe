# Project Structure — Math Master Teaching Support Platform (Frontend)

> **Cập nhật lần cuối:** 2026-04-16
> **Tech stack:** React + TypeScript + Vite
> **Root:** `my-react-app/`

---

## Root Files

```
eslint.config.js        # ESLint configuration
index.html              # Entry HTML
package.json            # Dependencies & scripts
tsconfig.json           # TypeScript base config
tsconfig.app.json       # TS config for app source
tsconfig.node.json      # TS config for Node/Vite
vite.config.ts          # Vite build configuration
vercel.json             # Vercel deployment config
```

---

## `src/` — Main Source

```
src/
├── App.tsx                 # Root App component
├── App.css                 # App-level styles
├── main.tsx                # React entry point (ReactDOM.render)
├── index.css               # Global index styles
│
├── assets/                 # Static assets
│   ├── css/
│   │   ├── buttons.css
│   │   ├── card.css
│   │   └── forms.css
│   └── react.svg
│
├── config/                 # App configuration
│   └── api.config.ts       # API base URL, axios instance
│
├── context/                # React Context providers
│   └── NotificationContext.tsx
│
├── data/                   # Mock / static data
│   └── mockData.ts
│
├── routes/                 # Routing
│   ├── AppRouter.tsx        # Main router (React Router)
│   └── PrivateRoute.tsx     # Auth guard wrapper
│
├── styles/                 # Global CSS
│   ├── global.css
│   ├── module-refactor.css
│   └── variables.css
│
├── types/                  # TypeScript type definitions
├── hooks/                  # Custom React hooks
├── services/               # API service layer
├── components/             # Reusable UI components
└── pages/                  # Page-level components (routes)
```

---

## `src/types/` — Type Definitions

```
types/
├── index.ts                    # Re-exports
├── assessment.types.ts
├── auth.types.ts
├── bulkImport.ts
├── canonicalQuestion.ts
├── chapter.types.ts
├── chat.types.ts
├── course.types.ts
├── document.types.ts
├── examMatrix.ts
├── grading.types.ts
├── latexRender.ts
├── lesson.types.ts
├── lessonPlan.types.ts
├── lessonSlide.types.ts
├── mindmap.types.ts
├── notification.ts
├── question.ts
├── questionBank.ts
├── questionTemplate.ts
├── roadmap.types.ts
├── studentAssessment.types.ts
├── subject.types.ts
├── teacher.types.ts
└── wallet.types.ts
```

---

## `src/hooks/` — Custom Hooks

```
hooks/
├── useAssessment.ts
├── useCanonicalQuestion.ts
├── useChapters.ts
├── useChatSessions.ts
├── useCourses.ts
├── useCurricula.ts
├── useExamMatrix.ts
├── useGrading.ts
├── useLatexRender.ts
├── useLessonPlans.ts
├── useLessons.ts
├── useQuestion.ts
├── useQuestionBank.ts
├── useQuestionTemplate.ts
├── useRoadmaps.ts
├── useStudentAssessment.ts
└── useSubjects.ts
```

---

## `src/services/` — API Service Layer

```
services/
├── api/                            # Core API services (axios wrappers)
│   ├── admin-dashboard.service.ts
│   ├── assessment.service.ts
│   ├── auth.service.ts
│   ├── chapter.service.ts
│   ├── chat-session.service.ts
│   ├── course.service.ts
│   ├── curriculum.service.ts
│   ├── document.service.ts
│   ├── lesson-slide.service.ts
│   ├── lesson.service.ts
│   ├── lessonPlan.service.ts
│   ├── mindmap.service.ts
│   ├── roadmap.service.ts
│   ├── subject.service.ts
│   ├── subscription-plan.service.ts
│   ├── teacher-profile.service.ts
│   ├── user.service.ts
│   ├── videoUpload.service.ts
│   └── wallet.service.ts
│
├── canonicalQuestionService.ts      # Canonical question CRUD
├── examMatrixService.ts             # Exam matrix CRUD
├── grading.service.ts               # Grading operations
├── latexRenderService.ts            # LaTeX rendering
├── notification.service.ts          # Notification service
├── questionBankService.ts           # Question bank CRUD
├── questionService.ts               # Question CRUD
├── questionTemplateService.ts       # Question template CRUD
├── studentAssessment.service.ts     # Student assessment operations
├── templateImportService.ts         # Template bulk import
└── userManagement.service.ts        # User management (admin)
```

---

## `src/components/` — Reusable Components

```
components/
├── Footer.tsx
│
├── assessment/                     # Assessment-related components
│   ├── index.ts
│   ├── EditableField.tsx
│   ├── QuestionCard.tsx
│   ├── QuestionDisplay.tsx
│   ├── QuestionNavigator.tsx
│   ├── ScoreDisplay.tsx
│   ├── Timer.tsx
│   └── question-card.css
│
├── common/                         # Shared utility components
│   ├── LatexRenderer.tsx
│   ├── MathText.tsx
│   └── MathTextTest.tsx
│
├── exam-matrix/                    # Exam matrix components
│   ├── index.ts
│   ├── EditableCell.tsx
│   ├── MatrixTable.tsx
│   └── matrix-table.css
│
├── grading/                        # Grading components
│   ├── index.ts
│   └── AnswerGradingCard.tsx
│
├── layout/                         # Layout / shell components
│   ├── index.ts
│   ├── DashboardLayout/
│   │   ├── DashboardLayout.tsx
│   │   └── DashboardLayout.css
│   ├── Navbar/
│   │   ├── Navbar.tsx
│   │   └── Navbar.css
│   └── Sidebar/
│       ├── Sidebar.tsx
│       └── Sidebar.css
│
└── roadmap/                        # Roadmap components
    ├── index.ts
    ├── AdminRoadmapEditor.tsx
    ├── AdminRoadmapLessonEditor.tsx
    ├── AdminRoadmapModuleEditor.tsx
    ├── RoadmapCard.tsx
    ├── RoadmapDashboard.tsx
    ├── RoadmapLessonItem.tsx
    ├── RoadmapModule.tsx
    ├── RoadmapProgressBar.tsx
    ├── admin-roadmap-editor.css
    ├── roadmap-card.css
    ├── roadmap-dashboard.css
    ├── roadmap-lesson-item.css
    ├── roadmap-module.css
    └── roadmap-progress-bar.css
```

---

## `src/pages/` — Page Components (mapped to routes)

### Top-level pages

```
pages/
├── index.ts            # Re-exports
├── About.tsx
├── Contact.tsx          + Contact.css
├── Features.tsx
├── Homepage.tsx         + Homepage.css
├── Pricing.tsx          + Pricing.css
└── Pages.css            # Shared page styles
```

### Auth (`pages/auth/`)

```
auth/
├── index.ts
├── Login.tsx
├── Register.tsx
├── ForgotPassword.tsx
├── ConfirmEmail.tsx
├── SelectRole.tsx
├── OnboardingFlow.tsx       + onboarding-flow.css
├── StudentOnboarding.tsx
├── TeacherVerification.tsx  + TeacherVerification.css
└── Auth.css
```

### Dashboard (`pages/dashboard/`)

```
dashboard/
├── admin/
│   ├── AdminDashboard.tsx   + AdminDashboard.css
├── student/
│   ├── StudentDashboard.tsx + StudentDashboard.css
└── teacher/
    ├── TeacherDashboard.tsx + TeacherDashboard.css
```

### Admin (`pages/admin/`)

```
admin/
├── AdminAnalytics.tsx          + AdminAnalytics.css
├── AdminRoadmapCreatePage.tsx
├── AdminRoadmapEditPage.tsx
├── AdminRoadmapManagementPage.tsx
├── AdminRoadmapTopicsPage.tsx  + admin-roadmap-topics-page.css
├── AdminTransactions.tsx       + AdminTransactions.css
├── ReviewProfiles.tsx          + ReviewProfiles.css
├── SubscriptionManagement.tsx  + SubscriptionManagement.css
├── UserManagement.tsx          + UserManagement.css
└── admin-roadmap-page.css
```

### AI (`pages/ai/`)

```
ai/
├── AIAssistant.tsx       + AIAssistant.css
└── AISlideGenerator.tsx  + AISlideGenerator.css
```

### Analytics (`pages/analytics/`)

```
analytics/
├── TeacherAnalytics.tsx  + TeacherAnalytics.css
```

### Assessments (`pages/assessments/`)

```
assessments/
├── AssessmentBuilderFlow.tsx         + assessment-builder-flow.css
├── AssessmentDetail.tsx
├── AssessmentDetailRefactored.tsx
├── AssessmentModal.tsx
├── TeacherAssessments.tsx            + TeacherAssessments.css
```

### Student Assessments (`pages/student-assessments/`)

```
student-assessments/
├── index.ts
├── AssessmentDetail.tsx
├── AssessmentResult.tsx
├── StudentAssessmentList.tsx
└── TakeAssessment.tsx
```

### Assignments (`pages/assignments/`)

```
assignments/
├── StudentAssignments.tsx  + StudentAssignments.css
└── TeacherAssignments.tsx  + TeacherAssignments.css
```

### Courses (`pages/courses/`)

```
courses/
├── StudentCourses.tsx           + StudentCourses.css
├── TeacherCourses.tsx           + TeacherCourses.css
├── TeacherCourseAssessments.tsx
├── TeacherCourseLessons.tsx
└── TeacherCourseLessons.tsx.backup
```

### Exam Matrices (`pages/exam-matrices/`)

```
exam-matrices/
├── ExamMatrixDashboard.tsx
├── ExamMatrixDetailPage.tsx
├── ExamMatrixDetailPageRefactored.tsx
├── ExamMatrixFormModal.tsx
├── ExamMatrixRowModal.tsx
├── ExamMatrixRowModalRefactored.tsx
└── exam-matrix-row-modal.css
```

### Grading (`pages/grading/`)

```
grading/
├── index.ts
├── GradingAnalytics.tsx
├── GradingDetail.tsx
├── GradingQueue.tsx
└── RegradeRequestList.tsx
```

### Question Banks (`pages/question-banks/`)

```
question-banks/
├── QuestionBankDashboard.tsx
├── QuestionBankDetailPage.tsx
└── QuestionBankFormModal.tsx
```

### Question Templates (`pages/question-templates/`)

```
question-templates/
├── CanonicalGenerateModal.tsx
├── CanonicalQuestionModal.tsx
├── TemplateBulkImportModal.tsx   + template-bulk-import.css
├── TemplateDashboard.tsx
├── TemplateFormModal.tsx
├── TemplateGenerateModal.tsx
├── TemplateImportModal.tsx
├── TemplateTestModal.tsx
└── template-review.css
```

### Questions (`pages/questions/`)

```
questions/
└── TeacherQuestionManagementPage.tsx
```

### Lesson Plans (`pages/lesson-plans/`)

```
lesson-plans/
├── TeacherLessonPlans.tsx  + TeacherLessonPlans.css
```

### Materials (`pages/materials/`)

```
materials/
├── MaterialsGenerator.tsx  + MaterialsGenerator.css
```

### Roadmap (`pages/roadmap/`)

```
roadmap/
├── RoadmapCatalogPage.tsx       + roadmap-catalog-page.css
├── RoadmapDashboardPage.tsx     + roadmap-dashboard-page.css
├── RoadmapDetailPage.tsx        + roadmap-detail-page.css
├── StudentRoadmap.tsx           + StudentRoadmap.css
└── TakeRoadmapEntryTest.tsx
```

### Mindmaps (`pages/mindmaps/`)

```
mindmaps/
├── index.ts
├── MindmapEditor.tsx           + MindmapEditor.css
├── PublicMindmapViewer.tsx     + PublicMindmapViewer.css
├── StudentPublicMindmaps.tsx   + StudentPublicMindmaps.css
└── TeacherMindmaps.tsx         + TeacherMindmaps.css
```

### Chat (`pages/chat/`)

```
chat/
├── LiveChat.tsx  + LiveChat.css
```

### Other Pages

```
calendar/           → Calendar.tsx + Calendar.css
certificates/       → Certificates.tsx + Certificates.css
forum/              → Forum.tsx + Forum.css
grades/             → StudentGrades.tsx + StudentGrades.css
help/               → HelpCenter.tsx + HelpCenter.css
notifications/      → NotificationCenter.tsx + NotificationCenter.css
preview/            → CoursePreview.tsx + CoursePreview.css
profile/            → index.ts, Profile.tsx + Profile.css
search/             → SearchResults.tsx + SearchResults.css
settings/           → ProfileSettings.tsx + ProfileSettings.css
students/           → TeacherStudents.tsx + TeacherStudents.css
teacher-profile/    → index.ts, MyTeacherProfile.tsx, SubmitTeacherProfile.tsx,
                      TeacherProfilePage.tsx + TeacherProfile.css
wallet/             → StudentWallet.tsx + StudentWallet.css
```

---

## Key Architecture Patterns

| Pattern                      | Mô tả                                                                |
| ---------------------------- | -------------------------------------------------------------------- |
| **Services → Hooks → Pages** | Service gọi API → Hook wrap logic + state → Page render UI           |
| **Type-first**               | Mỗi domain có file `.types.ts` riêng trong `src/types/`              |
| **Layout wrapper**           | `DashboardLayout` wrap tất cả authenticated pages (Navbar + Sidebar) |
| **Route guard**              | `PrivateRoute` kiểm tra auth trước khi render                        |
| **CSS co-located**           | Mỗi component/page có CSS file riêng cùng thư mục                    |
| **Barrel exports**           | Các folder có `index.ts` để re-export                                |

---

## Naming Conventions

- **Pages:** `PascalCase.tsx` — ví dụ `TeacherDashboard.tsx`
- **Services:** `kebab-case.service.ts` hoặc `camelCase.service.ts`
- **Hooks:** `useCamelCase.ts`
- **Types:** `domain.types.ts` hoặc `domain.ts`
- **CSS:** `kebab-case.css` hoặc `PascalCase.css` (co-located với component)
