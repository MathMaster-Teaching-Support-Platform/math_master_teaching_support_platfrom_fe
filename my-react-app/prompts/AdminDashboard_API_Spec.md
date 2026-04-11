# API Spec Request — AdminDashboard

**Ngày tạo:** 2026-04-11  
**Người tạo:** FE Team  
**Trạng thái:** Chờ BE phản hồi  
**File nguồn:** `src/pages/dashboard/admin/AdminDashboard.tsx`

---

## 1. Admin Identity (Header / Layout)

### Mô tả

`DashboardLayout` nhận prop `user` với `name`, `avatar`, `role` để hiển thị thông tin admin đang đăng nhập ở sidebar/header.

### Trạng thái hiện tại

- [x] Mock data nội tuyến (hardcode trong component)

```ts
// mockAdmin trong mockData.ts
export const mockAdmin = {
  id: '3',
  name: 'Admin System',
  email: 'admin@mathmaster.vn',
  role: 'admin',
  avatar: 'AD',
};
```

### Đề xuất API

| Field    | Giá trị                    |
| -------- | -------------------------- |
| Method   | GET                        |
| Endpoint | /api/auth/me               |
| Auth     | Bearer Token (JWT)         |

**Response mong muốn:**

```json
{
  "success": true,
  "result": {
    "id": "string (UUID)",
    "name": "string",
    "email": "string",
    "role": "admin",
    "avatar": "string (URL hoặc initials)"
  }
}
```

### Ghi chú

- Endpoint này có thể đã tồn tại cho auth flow — [cần BE xác nhận]
- `role` phải là `"admin"` để FE render đúng layout

---

## 2. Notification Count (Header Badge)

### Mô tả

`DashboardLayout` nhận prop `notificationCount` để hiển thị badge số thông báo chưa đọc.

### Trạng thái hiện tại

- [x] Mock data nội tuyến (hardcode trong component)

```tsx
<DashboardLayout notificationCount={8} />
```

### Đề xuất API

| Field    | Giá trị                              |
| -------- | ------------------------------------ |
| Method   | GET                                  |
| Endpoint | /api/notifications/unread-count      |
| Auth     | Bearer Token (JWT)                   |

**Response mong muốn:**

```json
{
  "success": true,
  "result": {
    "unreadCount": 8
  }
}
```

### Ghi chú

- Có thể kết hợp vào `/api/auth/me` nếu BE muốn gộp — [cần BE xác nhận]

---

## 3. Stats Grid — Tổng quan hệ thống

### Mô tả

Hiển thị 4 thẻ thống kê tổng quan: tổng người dùng, doanh thu tháng, số gói đăng ký, số giao dịch — kèm trend % so với tháng trước.

### Trạng thái hiện tại

- [x] Mock data nội tuyến (hardcode trong component)

```ts
const stats = [
  { label: 'Tổng người dùng', value: '1,930', trend: '+12%' },
  { label: 'Doanh thu tháng',  value: '₫45.2M', trend: '+8%' },
  { label: 'Gói đăng ký',      value: '680',    trend: '+15%' },
  { label: 'Giao dịch',        value: '1,245',  trend: '+5%' },
];
```

### Đề xuất API

| Field    | Giá trị                          |
| -------- | -------------------------------- |
| Method   | GET                              |
| Endpoint | /api/admin/dashboard/stats       |
| Auth     | Bearer Token (JWT), role = admin |

**Response mong muốn:**

```json
{
  "success": true,
  "result": {
    "totalUsers": 1930,
    "totalUsersGrowthPercent": 12.0,
    "monthlyRevenue": 45200000,
    "monthlyRevenueGrowthPercent": 8.0,
    "activeSubscriptions": 680,
    "activeSubscriptionsGrowthPercent": 15.0,
    "totalTransactions": 1245,
    "totalTransactionsGrowthPercent": 5.0,
    "month": "2026-04"
  }
}
```

### Validation FE đang áp dụng

- `monthlyRevenue` được format theo `vi-VN` locale (VNĐ)
- Trend hiển thị dưới dạng `+X%` (luôn có dấu)

### Ghi chú

- `month` mặc định là tháng hiện tại; tương lai FE có thể cần filter theo tháng → [cần BE thiết kế query param `?month=YYYY-MM`]

---

## 4. Recent Users — Người dùng mới

### Mô tả

Bảng hiển thị danh sách người dùng mới đăng ký gần đây, gồm: tên, email, vai trò, ngày tham gia, trạng thái.

### Trạng thái hiện tại

- [x] Mock data nội tuyến (hardcode trong component)

```ts
// mockUsers trong mockData.ts
[
  { id, name, email, role: 'teacher'|'student', status: 'active'|'inactive',
    school, joinedDate, lastLogin }
]
// Toàn bộ array được render — chưa có fetch, phân trang, hay sort
```

### Đề xuất API

| Field    | Giá trị                          |
| -------- | -------------------------------- |
| Method   | GET                              |
| Endpoint | /api/admin/users/recent          |
| Auth     | Bearer Token (JWT), role = admin |

**Request query params:**

```
?limit=10&page=1
```

**Response mong muốn:**

```json
{
  "success": true,
  "result": {
    "users": [
      {
        "id": "string (UUID)",
        "name": "string",
        "email": "string",
        "role": "teacher | student",
        "status": "active | inactive",
        "joinedDate": "ISO 8601 string",
        "lastLogin": "ISO 8601 string"
      }
    ],
    "total": 1930,
    "page": 1,
    "limit": 10
  }
}
```

### Validation FE đang áp dụng

- `role` chỉ nhận `"teacher"` hoặc `"student"` (dùng để render badge màu)
- `status` chỉ nhận `"active"` hoặc `"inactive"`
- `joinedDate` được format bằng `toLocaleDateString('vi-VN')`

### Ghi chú

- Dashboard chỉ hiển thị ~5–10 user mới nhất; link "Xem tất cả" dẫn đến `/admin/users`
- Sort mặc định: `joinedDate DESC`

---

## 5. Teacher Profile Review — Đếm hồ sơ chờ duyệt

### Mô tả

Thẻ nổi bật hiển thị số lượng hồ sơ giáo viên đang chờ admin xét duyệt.

### Trạng thái hiện tại

- [x] Đã có fetch thực — `TeacherProfileService.countPendingProfiles()`

```ts
const response = await TeacherProfileService.countPendingProfiles();
setPendingProfiles(response.result); // number
```

### Ghi chú

- Feature này **đã được tích hợp API thực**; không cần thêm endpoint mới.
- Cần BE xác nhận response shape: `{ result: number }` — đã khớp với code FE hiện tại.

---

## 6. Recent Transactions — Giao dịch gần đây

### Mô tả

Bảng hiển thị 5 giao dịch gần nhất: ID, tên người dùng, tên gói, số tiền, phương thức thanh toán, trạng thái, thời gian, nút xem chi tiết.

### Trạng thái hiện tại

- [x] Mock data nội tuyến (hardcode trong component)

```ts
// mockTransactions.slice(0, 5)
[
  {
    id: 't1',
    userId: 'u1',
    userName: 'Nguyễn Văn A',
    planId: 'pro',
    planName: 'Chuyên nghiệp',
    amount: 199000,
    status: 'completed' | 'pending' | 'failed',
    paymentMethod: 'wallet' | 'momo' | 'bank_transfer',
    createdAt: 'ISO 8601 string',
  }
]
```

### Đề xuất API

| Field    | Giá trị                              |
| -------- | ------------------------------------ |
| Method   | GET                                  |
| Endpoint | /api/admin/transactions              |
| Auth     | Bearer Token (JWT), role = admin     |

**Request query params:**

```
?limit=5&page=1&sortBy=createdAt&order=desc
```

**Response mong muốn:**

```json
{
  "success": true,
  "result": {
    "transactions": [
      {
        "id": "string",
        "userId": "string (UUID)",
        "userName": "string",
        "planId": "string",
        "planName": "string",
        "amount": "number (VNĐ)",
        "status": "completed | pending | failed",
        "paymentMethod": "wallet | momo | bank_transfer",
        "createdAt": "ISO 8601 string"
      }
    ],
    "total": 1245,
    "page": 1,
    "limit": 5
  }
}
```

### Validation FE đang áp dụng

- `status` chỉ nhận `"completed"`, `"pending"`, `"failed"`
- `paymentMethod` chỉ nhận `"wallet"`, `"momo"`, `"bank_transfer"`
- `amount` được format bằng `toLocaleString('vi-VN')` + `đ`
- `createdAt` được format bằng `toLocaleString('vi-VN')`

### Ghi chú

- Nút 👁️ "Chi tiết" chưa có action — cần endpoint `GET /api/admin/transactions/:id` — [UNKNOWN - cần BE xác nhận]
- Link "Xem tất cả" dẫn đến `/admin/transactions`

---

## 7. Revenue Chart — Doanh thu theo tháng

### Mô tả

Biểu đồ bar hiển thị doanh thu theo từng tháng trong năm (T1–T12), dạng cột tỷ lệ phần trăm so với max.

### Trạng thái hiện tại

- [x] Mock data nội tuyến (hardcode trong component)

```ts
// Giá trị tỷ lệ % tĩnh, không có đơn vị tiền
[32, 45, 38, 52, 48, 65, 58, 72, 68, 85, 78, 92]
```

### Đề xuất API

| Field    | Giá trị                                      |
| -------- | -------------------------------------------- |
| Method   | GET                                          |
| Endpoint | /api/admin/dashboard/revenue-by-month        |
| Auth     | Bearer Token (JWT), role = admin             |

**Request query params:**

```
?year=2026
```

**Response mong muốn:**

```json
{
  "success": true,
  "result": {
    "year": 2026,
    "monthly": [
      { "month": 1, "revenue": 32000000 },
      { "month": 2, "revenue": 45000000 },
      { "month": 3, "revenue": 38000000 },
      ...
      { "month": 12, "revenue": 92000000 }
    ]
  }
}
```

### Validation FE đang áp dụng

- Mảng phải có đúng 12 phần tử (T1–T12)
- FE sẽ tự tính tỷ lệ `height%` theo giá trị max trong mảng

### Ghi chú

- Năm mặc định = năm hiện tại
- [UNKNOWN - cần BE xác nhận] đơn vị trả về: VNĐ tuyệt đối hay tỷ lệ phần trăm

---

## 8. Quick Stats — Thống kê nhanh

### Mô tả

4 chỉ số phụ: tỷ lệ chuyển đổi, người dùng hoạt động, tài liệu được tạo, tỷ lệ hài lòng — hiển thị kèm thanh progress.

### Trạng thái hiện tại

- [x] Mock data nội tuyến (hardcode trong component)

```ts
// Tất cả hardcode static, không có state hay fetch
{ conversionRate: 68, activeUsers: 1456, documentsCreated: 8234, satisfactionRate: 96 }
```

### Đề xuất API

Có thể gộp vào `/api/admin/dashboard/stats` (mục 3) hoặc tách riêng:

| Field    | Giá trị                               |
| -------- | ------------------------------------- |
| Method   | GET                                   |
| Endpoint | /api/admin/dashboard/quick-stats      |
| Auth     | Bearer Token (JWT), role = admin      |

**Response mong muốn:**

```json
{
  "success": true,
  "result": {
    "conversionRate": 68.0,
    "activeUsers": 1456,
    "documentsCreated": 8234,
    "satisfactionRate": 96.0
  }
}
```

### Validation FE đang áp dụng

- `conversionRate` và `satisfactionRate`: số trong khoảng [0, 100], dùng làm `width%` của thanh progress
- `activeUsers` và `documentsCreated`: số nguyên dương

### Ghi chú

- [UNKNOWN - cần BE xác nhận] định nghĩa "tài liệu được tạo" (lesson plans, materials, hay tổng hợp?)
- [UNKNOWN - cần BE xác nhận] định nghĩa "tỷ lệ hài lòng" (từ đánh giá khóa học?)

---

## 9. System Status — Trạng thái hệ thống

### Mô tả

Danh sách 4 service (Web Server, Database, AI Service, Storage) với trạng thái `active`/`warning` và mô tả ngắn.

### Trạng thái hiện tại

- [x] Toàn bộ là static (không có state hay fetch)

```tsx
// 4 hardcode status items, không fetch
<div className="status-indicator active"></div>  // Web Server
<div className="status-indicator active"></div>  // Database
<div className="status-indicator active"></div>  // AI Service
<div className="status-indicator warning"></div> // Storage: 85% đã sử dụng
```

### Đề xuất API

| Field    | Giá trị                               |
| -------- | ------------------------------------- |
| Method   | GET                                   |
| Endpoint | /api/admin/system/status              |
| Auth     | Bearer Token (JWT), role = admin      |

**Response mong muốn:**

```json
{
  "success": true,
  "result": {
    "services": [
      {
        "name": "Web Server",
        "status": "active | warning | error",
        "description": "string"
      },
      {
        "name": "Database",
        "status": "active | warning | error",
        "description": "string"
      },
      {
        "name": "AI Service",
        "status": "active | warning | error",
        "description": "string"
      },
      {
        "name": "Storage",
        "status": "active | warning | error",
        "description": "85% đã sử dụng",
        "usagePercent": 85
      }
    ]
  }
}
```

### Validation FE đang áp dụng

- `status` chỉ nhận `"active"`, `"warning"`, `"error"` (dùng làm CSS class)
- `description` là string hiển thị trực tiếp

### Ghi chú

- Đây là health-check endpoint, nên có cache ngắn (30s–1min) phía BE
- [UNKNOWN - cần BE xác nhận] BE có sẵn hệ thống monitoring chưa hay cần tự build?
