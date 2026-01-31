// Mock data for development (will be replaced with real API calls)

export const mockTeacher = {
  id: '1',
  name: 'Nguyễn Văn An',
  email: 'nguyenvanan@email.com',
  role: 'teacher',
  avatar: 'NT',
  school: 'THPT Lý Thái Tổ',
  grade: 'high',
  subjects: ['Toán 10', 'Toán 11', 'Toán 12'],
  totalStudents: 156,
  totalCourses: 8,
  totalMaterials: 234,
};

export const mockStudent = {
  id: '2',
  name: 'Trần Thị Bình',
  email: 'tranthibinh@email.com',
  role: 'student',
  avatar: 'TB',
  school: 'THPT Lý Thái Tổ',
  grade: 11,
  enrolledCourses: 5,
  completedAssignments: 45,
  averageScore: 8.5,
};

export const mockAdmin = {
  id: '3',
  name: 'Admin System',
  email: 'admin@mathmaster.vn',
  role: 'admin',
  avatar: 'AD',
};

export const mockCourses = [
  {
    id: '1',
    title: 'Đại số 10 - Chương 1: Mệnh đề và tập hợp',
    description: 'Học về mệnh đề, tập hợp và các phép toán',
    grade: 10,
    chapter: 1,
    lessons: 12,
    students: 45,
    status: 'active',
    thumbnail: '📚',
    createdAt: '2026-01-15',
    name: 'Đại số 10 - Chương 1: Mệnh đề và tập hợp',
    isPublished: true,
    studentsEnrolled: 45,
    rating: 4.5,
    lessonsCount: 12,
    completionRate: 75,
    teacher: 'Nguyễn Văn An',
  },
  {
    id: '2',
    title: 'Hình học 11 - Quan hệ vuông góc',
    description: 'Đường thẳng và mặt phẳng vuông góc',
    grade: 11,
    chapter: 2,
    lessons: 15,
    students: 38,
    status: 'active',
    thumbnail: '📐',
    createdAt: '2026-01-10',
    name: 'Hình học 11 - Quan hệ vuông góc',
    isPublished: true,
    studentsEnrolled: 38,
    rating: 4.8,
    lessonsCount: 15,
    completionRate: 65,
    teacher: 'Nguyễn Văn An',
  },
  {
    id: '3',
    title: 'Giải tích 12 - Hàm số và đạo hàm',
    description: 'Khảo sát hàm số, đạo hàm và ứng dụng',
    grade: 12,
    chapter: 1,
    lessons: 20,
    students: 52,
    status: 'active',
    thumbnail: '📈',
    createdAt: '2026-01-05',
    name: 'Giải tích 12 - Hàm số và đạo hàm',
    isPublished: true,
    studentsEnrolled: 52,
    rating: 4.7,
    lessonsCount: 20,
    completionRate: 80,
    teacher: 'Nguyễn Văn An',
  },
];

export const mockLessons = [
  {
    id: '1',
    courseId: '1',
    title: 'Bài 1: Mệnh đề và mệnh đề chứa biến',
    description: 'Tìm hiểu về mệnh đề, mệnh đề phủ định',
    duration: 45,
    materials: ['slide', 'mindmap', 'exercises'],
    completed: false,
  },
  {
    id: '2',
    courseId: '1',
    title: 'Bài 2: Tập hợp và các phép toán',
    description: 'Các phép hợp, giao, hiệu của tập hợp',
    duration: 45,
    materials: ['slide', 'diagram', 'quiz'],
    completed: false,
  },
];

export const mockAssignments = [
  {
    id: '1',
    title: 'Bài tập về Mệnh đề',
    courseId: '1',
    courseName: 'Đại số 10',
    dueDate: '2026-02-05',
    status: 'pending',
    totalQuestions: 15,
    timeLimit: 30,
    type: 'homework',
    deadline: '2026-02-05',
    duration: 30,
    maxScore: 100,
    totalSubmissions: 25,
    gradedSubmissions: 18,
  },
  {
    id: '2',
    title: 'Kiểm tra 15 phút - Tập hợp',
    courseId: '1',
    courseName: 'Đại số 10',
    dueDate: '2026-02-03',
    status: 'graded',
    score: 8.5,
    totalQuestions: 10,
    timeLimit: 15,
    type: 'quiz',
    deadline: '2026-02-03',
    duration: 15,
    maxScore: 100,
    totalSubmissions: 30,
    gradedSubmissions: 30,
  },
  {
    id: '3',
    title: 'Đề thi giữa kỳ - Hình học',
    courseId: '2',
    courseName: 'Hình học 11',
    dueDate: '2026-02-10',
    status: 'upcoming',
    totalQuestions: 25,
    timeLimit: 60,
    type: 'exam',
    deadline: '2026-02-10',
    duration: 60,
    maxScore: 100,
    totalSubmissions: 15,
    gradedSubmissions: 0,
  },
];

export const mockMaterials = [
  {
    id: '1',
    title: 'Slide: Mệnh đề và logic',
    type: 'slide',
    format: 'pptx',
    size: '2.5 MB',
    downloads: 45,
    createdAt: '2026-01-20',
    tags: ['đại số', 'mệnh đề', 'logic'],
  },
  {
    id: '2',
    title: 'Mindmap: Tập hợp số',
    type: 'mindmap',
    format: 'pdf',
    size: '1.2 MB',
    downloads: 32,
    createdAt: '2026-01-18',
    tags: ['đại số', 'tập hợp'],
  },
  {
    id: '3',
    title: 'Đề thi thử: Đại số và giải tích',
    type: 'assessment',
    format: 'docx',
    size: '0.8 MB',
    downloads: 67,
    createdAt: '2026-01-15',
    tags: ['đề thi', 'giải tích'],
  },
];

export const mockStudents = [
  {
    id: 's1',
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@email.com',
    avatar: 'NA',
    courseId: '1',
    enrolledDate: '2026-01-15',
    completedLessons: 5,
    totalLessons: 12,
    averageScore: 8.5,
    lastActive: '2026-01-30',
  },
  {
    id: 's2',
    name: 'Trần Thị B',
    email: 'tranthib@email.com',
    avatar: 'TB',
    courseId: '1',
    enrolledDate: '2026-01-15',
    completedLessons: 8,
    totalLessons: 12,
    averageScore: 9.0,
    lastActive: '2026-01-31',
  },
  {
    id: 's3',
    name: 'Lê Văn C',
    email: 'levanc@email.com',
    avatar: 'LC',
    courseId: '1',
    enrolledDate: '2026-01-16',
    completedLessons: 3,
    totalLessons: 12,
    averageScore: 7.5,
    lastActive: '2026-01-29',
  },
];

export const mockNotifications = [
  {
    id: '1',
    title: 'Bài tập mới được giao',
    message: 'Bài tập về Mệnh đề đã được thêm vào khóa học Đại số 10',
    type: 'assignment',
    read: false,
    createdAt: '2026-01-31T08:00:00',
  },
  {
    id: '2',
    title: 'Điểm số mới',
    message: 'Bài kiểm tra 15 phút của bạn đã được chấm điểm: 8.5/10',
    type: 'grade',
    read: false,
    createdAt: '2026-01-30T15:30:00',
  },
  {
    id: '3',
    title: 'Thông báo từ giáo viên',
    message: 'Lớp học tuần sau sẽ chuyển sang phòng B203',
    type: 'announcement',
    read: true,
    createdAt: '2026-01-29T10:00:00',
  },
];

export const mockUsers = [
  {
    id: 'u1',
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@email.com',
    role: 'teacher',
    status: 'active',
    school: 'THPT Lý Thái Tổ',
    joinedDate: '2025-09-01',
    lastLogin: '2026-01-31',
  },
  {
    id: 'u2',
    name: 'Trần Thị B',
    email: 'tranthib@email.com',
    role: 'student',
    status: 'active',
    school: 'THPT Lý Thái Tổ',
    joinedDate: '2025-09-01',
    lastLogin: '2026-01-31',
  },
  {
    id: 'u3',
    name: 'Lê Văn C',
    email: 'levanc@email.com',
    role: 'teacher',
    status: 'inactive',
    school: 'THPT Trần Phú',
    joinedDate: '2025-10-15',
    lastLogin: '2026-01-20',
  },
];

export const mockSubscriptionPlans = [
  {
    id: 'free',
    name: 'Miễn phí',
    price: 0,
    duration: 'forever',
    features: ['5 bài giảng/tháng', '10 bài tập/tháng', 'Chat AI cơ bản', 'Lưu trữ 100MB'],
    users: 1250,
    status: 'active',
  },
  {
    id: 'basic',
    name: 'Cơ bản',
    price: 99000,
    duration: 'month',
    features: [
      '50 bài giảng/tháng',
      '100 bài tập/tháng',
      'Chat AI nâng cao',
      'Lưu trữ 1GB',
      'Vẽ đồ thị không giới hạn',
    ],
    users: 450,
    status: 'active',
  },
  {
    id: 'pro',
    name: 'Chuyên nghiệp',
    price: 199000,
    duration: 'month',
    features: [
      'Không giới hạn bài giảng',
      'Không giới hạn bài tập',
      'Chat AI premium',
      'Lưu trữ 10GB',
      'Tất cả tính năng',
      'Hỗ trợ ưu tiên',
    ],
    users: 230,
    status: 'active',
  },
];

export const mockTransactions = [
  {
    id: 't1',
    userId: 'u1',
    userName: 'Nguyễn Văn A',
    planId: 'pro',
    planName: 'Chuyên nghiệp',
    amount: 199000,
    status: 'completed',
    paymentMethod: 'wallet',
    createdAt: '2026-01-25T10:30:00',
  },
  {
    id: 't2',
    userId: 'u2',
    userName: 'Trần Thị B',
    planId: 'basic',
    planName: 'Cơ bản',
    amount: 99000,
    status: 'completed',
    paymentMethod: 'momo',
    createdAt: '2026-01-20T14:15:00',
  },
  {
    id: 't3',
    userId: 'u3',
    userName: 'Lê Văn C',
    planId: 'pro',
    planName: 'Chuyên nghiệp',
    amount: 199000,
    status: 'pending',
    paymentMethod: 'bank_transfer',
    createdAt: '2026-01-31T09:00:00',
  },
];

export const mockAIMessages = [
  {
    id: 'm1',
    role: 'user',
    content: 'Giải phương trình: 2x + 5 = 13',
    timestamp: '2026-01-31T08:20:00',
  },
  {
    id: 'm2',
    role: 'assistant',
    content: `Để giải phương trình 2x + 5 = 13, ta làm như sau:

Bước 1: Chuyển 5 sang vế phải
2x = 13 - 5
2x = 8

Bước 2: Chia cả hai vế cho 2
x = 8 ÷ 2
x = 4

Vậy nghiệm của phương trình là x = 4.

Kiểm tra: 2(4) + 5 = 8 + 5 = 13 ✓`,
    timestamp: '2026-01-31T08:20:05',
  },
];
