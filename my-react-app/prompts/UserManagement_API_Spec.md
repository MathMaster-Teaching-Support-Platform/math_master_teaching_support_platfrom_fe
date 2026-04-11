# API Spec Request — Admin / Quản Lý Người Dùng

**Ngày tạo:** 2026-04-11  
**Người tạo:** FE Team  
**Trạng thái:** Chờ BE phản hồi  
**File nguồn:** `src/pages/admin/UserManagement.tsx`

---

## 1. Danh sách người dùng + Thống kê tổng quan

### Mô tả

Trang chính hiển thị bảng tất cả người dùng (teacher / student / admin) kèm 4 stat card: tổng người dùng, số giáo viên, số học sinh, số đang hoạt động. Hỗ trợ lọc theo vai trò và tìm kiếm theo tên / email. Có phân trang (UI đã có, chưa kết nối).

### Trạng thái hiện tại

- [x] Mock data nội tuyến (import `mockUsers`, `mockAdmin` từ `mockData.ts`)
- [ ] Có fetch nhưng URL/response chưa đúng
- [ ] Chưa có fetch nào ngoài mock

**Dữ liệu sinh giả từ mock:**

```ts
// mockUsers shape (mockData.ts)
{
  id: string;           // 'u1', 'u2', ...
  name: string;
  email: string;
  role: 'teacher' | 'student';
  avatar?: string;      // 2-char initials hoặc undefined
}

// status, joinDate, lastLogin được tính giả từ seed cố định FIXED_TIMESTAMP
// — không phản ánh dữ liệu thực
status: 'active' | 'inactive';   // seed % 5 !== 0 ? 'active' : 'inactive'
joinDate: string;                 // ISO timestamp tính ngược từ FIXED_TIMESTAMP
lastLogin: string;                // ISO timestamp tính ngược từ FIXED_TIMESTAMP
```

### Đề xuất API — Lấy danh sách người dùng

| Field    | Giá trị                    |
| -------- | -------------------------- |
| Method   | GET                        |
| Endpoint | `/api/admin/users`         |
| Auth     | Bearer Token (JWT) — Admin |

**Query params:**

```
page        integer   (default: 1)
pageSize    integer   (default: 20)
role        'teacher' | 'student' | 'admin' | 'all'   (default: 'all')
search      string    — tìm trên name hoặc email (optional)
status      'active' | 'inactive' | 'all'             (optional)
```

**Response mong muốn:**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "string (UUID)",
        "name": "string",
        "email": "string",
        "role": "teacher | student | admin",
        "status": "active | inactive",
        "avatar": "string | null",
        "joinDate": "ISO 8601 string",
        "lastLogin": "ISO 8601 string | null"
      }
    ],
    "stats": {
      "total": "number",
      "teachers": "number",
      "students": "number",
      "active": "number"
    },
    "pagination": {
      "page": "number",
      "pageSize": "number",
      "totalItems": "number",
      "totalPages": "number"
    }
  }
}
```

### Validation FE đang áp dụng (client-side)

- Filter role: `'all' | 'teacher' | 'student'`
- Search: case-insensitive, so sánh trên `name` và `email`
- Phân trang: UI có sẵn nhưng hiện static — BE cần trả `totalPages` để render đúng

### Ghi chú

- Stats card lấy từ cùng response để tránh gọi thêm endpoint thứ hai
- `avatar` FE hiện hiển thị dạng chuỗi ký tự (initials), nếu BE trả URL ảnh thì FE cần cập nhật render
- `lastLogin` có thể `null` nếu user chưa từng đăng nhập

---

## 2. Tạo người dùng mới

### Mô tả

Modal "Thêm người dùng" hiện có form đầy đủ nhưng **không có submit handler** — nút "Tạo người dùng" chưa gọi API nào.

### Trạng thái hiện tại

- [x] Chưa có fetch nào, toàn bộ là static form

### Dữ liệu form đang thu thập

```ts
{
  name: string; // required
  email: string; // required, type="email"
  role: 'teacher' | 'student' | 'admin'; // required, select
  status: 'active' | 'inactive'; // required, select
  password: string; // required, temporary password
  sendWelcomeEmail: boolean; // checkbox, default true
  requirePasswordChange: boolean; // checkbox, default false
}
```

### Đề xuất API — Tạo người dùng

| Field    | Giá trị                    |
| -------- | -------------------------- |
| Method   | POST                       |
| Endpoint | `/api/admin/users`         |
| Auth     | Bearer Token (JWT) — Admin |

**Request body:**

```json
{
  "name": "string",
  "email": "string (valid email)",
  "role": "teacher | student | admin",
  "status": "active | inactive",
  "password": "string",
  "sendWelcomeEmail": "boolean",
  "requirePasswordChange": "boolean"
}
```

**Response mong muốn:**

```json
{
  "success": true,
  "data": {
    "id": "string (UUID)",
    "name": "string",
    "email": "string",
    "role": "string",
    "status": "string",
    "joinDate": "ISO 8601 string"
  }
}
```

### Validation FE đang áp dụng

- `name`: required
- `email`: required, HTML type="email" (format cơ bản)
- `role`: required, một trong ba giá trị trên
- `status`: required
- `password`: required — [UNKNOWN - BE cần xác nhận độ dài / độ phức tạp tối thiểu]

### Ghi chú

- BE nên kiểm tra email trùng lặp và trả lỗi rõ ràng để FE hiển thị
- `password` nên hash phía BE trước khi lưu

---

## 3. Xem chi tiết người dùng

### Mô tả

Khi click icon 👁️ trong bảng, modal "Chi tiết người dùng" mở ra hiển thị thông tin từ local state (data mock). Không có fetch riêng.

### Trạng thái hiện tại

- [x] Dữ liệu lấy từ row đang hiển thị (mock) — không fetch thêm từ BE

### Đề xuất API — Lấy chi tiết người dùng

| Field    | Giá trị                    |
| -------- | -------------------------- |
| Method   | GET                        |
| Endpoint | `/api/admin/users/:userId` |
| Auth     | Bearer Token (JWT) — Admin |

**Response mong muốn:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "teacher | student | admin",
    "status": "active | inactive",
    "avatar": "string | null",
    "joinDate": "ISO 8601 string",
    "lastLogin": "ISO 8601 string | null"
  }
}
```

### Ghi chú

- Hiện tại FE không fetch riêng cho detail; có thể dùng data từ list. Nếu BE muốn detail có thêm trường mở rộng (ví dụ: `school`, `grade`, danh sách khóa học), cần endpoint riêng.
- [UNKNOWN - cần BE xác nhận] detail có cần trường mở rộng không?

---

## 4. Cập nhật trạng thái người dùng (Kích hoạt / Tạm ngưng)

### Mô tả

Trong modal detail, nút "⏸️ Tạm ngưng" / "▶️ Kích hoạt" toggle trạng thái user. Hiện **chưa có handler** — button render đúng nhãn nhưng không gọi API.

### Trạng thái hiện tại

- [x] Chưa có fetch nào, toàn bộ là static

### Đề xuất API

| Field    | Giá trị                           |
| -------- | --------------------------------- |
| Method   | PATCH                             |
| Endpoint | `/api/admin/users/:userId/status` |
| Auth     | Bearer Token (JWT) — Admin        |

**Request body:**

```json
{ "status": "active | inactive" }
```

**Response mong muốn:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "status": "active | inactive"
  }
}
```

---

## 5. Đặt lại mật khẩu

### Mô tả

Nút "🔄 Đặt lại mật khẩu" trong modal detail. Hiện **chưa có handler**.

### Trạng thái hiện tại

- [x] Chưa có fetch nào

### Đề xuất API

| Field    | Giá trị                                   |
| -------- | ----------------------------------------- |
| Method   | POST                                      |
| Endpoint | `/api/admin/users/:userId/reset-password` |
| Auth     | Bearer Token (JWT) — Admin                |

**Request body:** _(không bắt buộc — BE tự sinh mật khẩu tạm hoặc gửi link reset)_

```json
{}
```

**Response mong muốn:**

```json
{
  "success": true,
  "message": "string"
}
```

### Ghi chú

- [UNKNOWN - cần BE xác nhận] BE tự sinh mật khẩu tạm hay gửi link đặt lại qua email?

---

## 6. Gửi email cho người dùng

### Mô tả

Nút "📧 Gửi email" trong modal detail. Hiện **chưa có handler** — không rõ có mở form nhập nội dung hay gửi email mẫu cố định.

### Trạng thái hiện tại

- [x] Chưa có fetch nào

### Đề xuất API

| Field    | Giá trị                               |
| -------- | ------------------------------------- |
| Method   | POST                                  |
| Endpoint | `/api/admin/users/:userId/send-email` |
| Auth     | Bearer Token (JWT) — Admin            |

**Request body:**

```json
{
  "subject": "string",
  "body": "string"
}
```

**Response mong muốn:**

```json
{
  "success": true,
  "message": "string"
}
```

### Ghi chú

- [UNKNOWN - cần BE xác nhận] gửi email tùy ý hay chỉ gửi template cố định (ví dụ email chào mừng)?

---

## 7. Xóa tài khoản

### Mô tả

Nút "🗑️ Xóa tài khoản" trong modal detail và nút 🗑️ inline trong bảng. Hiện **chưa có handler**.

### Trạng thái hiện tại

- [x] Chưa có fetch nào

### Đề xuất API

| Field    | Giá trị                    |
| -------- | -------------------------- |
| Method   | DELETE                     |
| Endpoint | `/api/admin/users/:userId` |
| Auth     | Bearer Token (JWT) — Admin |

**Response mong muốn:**

```json
{
  "success": true,
  "message": "string"
}
```

### Validation / Ghi chú

- FE nên hiển thị confirm dialog trước khi gọi
- [UNKNOWN - cần BE xác nhận] hard delete hay soft delete (set `deletedAt`)?
- BE nên từ chối xóa tài khoản Admin cuối cùng

---

## 8. Xuất Excel danh sách người dùng

### Mô tả

Nút "📥 Xuất Excel" trong toolbar. Hiện **chưa có handler**.

### Trạng thái hiện tại

- [x] Chưa có fetch nào

### Đề xuất API

| Field    | Giá trị                    |
| -------- | -------------------------- |
| Method   | GET                        |
| Endpoint | `/api/admin/users/export`  |
| Auth     | Bearer Token (JWT) — Admin |

**Query params:** _(giống filter của danh sách)_

```
role    'teacher' | 'student' | 'admin' | 'all'
status  'active' | 'inactive' | 'all'
search  string (optional)
```

**Response:** file binary (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)  
FE sẽ trigger download bằng `URL.createObjectURL`.

---

## 9. Chỉnh sửa thông tin người dùng

### Mô tả

Nút ✏️ inline trong bảng. Hiện **chưa có handler và chưa có modal edit**.

### Trạng thái hiện tại

- [x] Chưa có fetch nào, button không có `onClick`

### Đề xuất API

| Field    | Giá trị                    |
| -------- | -------------------------- |
| Method   | PUT                        |
| Endpoint | `/api/admin/users/:userId` |
| Auth     | Bearer Token (JWT) — Admin |

**Request body:**

```json
{
  "name": "string",
  "email": "string",
  "role": "teacher | student | admin",
  "status": "active | inactive",
  "avatar": "string | null"
}
```

**Response mong muốn:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "status": "string",
    "avatar": "string | null",
    "joinDate": "ISO 8601 string",
    "lastLogin": "ISO 8601 string | null"
  }
}
```
