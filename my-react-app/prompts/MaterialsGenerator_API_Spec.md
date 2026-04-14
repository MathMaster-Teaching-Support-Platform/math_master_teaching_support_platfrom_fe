# API Spec — MaterialsGenerator (Tạo Tài Liệu với AI)

**Ngày tạo:** 2026-04-14  
**Cập nhật:** 2026-04-15 (Vòng 1 — sau khi nhận Y.md từ BE)  
**Người tạo:** FE Team  
**File FE:** `src/pages/materials/MaterialsGenerator.tsx`

---

## Tracking — Trạng thái tích hợp Vòng 1

| Feature                                      | Trạng thái FE | Ghi chú                                                                                               |
| -------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| Danh sách tài liệu gần đây (Slide + Mindmap) | ✅ Done       | Fetch thật từ `GET /lesson-slides/generated` + `GET /mindmaps/my-mindmaps`, merge và sort client-side |
| Slide Bài Giảng — nút "Bắt đầu tạo"          | ✅ Done       | Navigate sang `/teacher/ai-slide-generator`                                                           |
| Sơ Đồ Tư Duy — nút "Bắt đầu tạo"             | ✅ Done       | Navigate sang `/teacher/mindmaps`                                                                     |
| Hình Vẽ Toán Học — nút "Bắt đầu tạo"         | 🔴 Blocked    | BE chưa implement — nút disabled, tooltip "Tính năng đang phát triển"                                 |
| Phiếu Bài Tập — nút "Bắt đầu tạo"            | 🔴 Blocked    | BE chưa implement — nút disabled, tooltip "Tính năng đang phát triển"                                 |
| Thông tin giáo viên (layout)                 | ✅ Done       | Fetch `GET /users/my-info`, fallback initials nếu avatar null                                         |
| Notification count                           | ✅ Done       | Fetch `GET /v1/notifications/unread-count`                                                            |
| Loading / Error / Empty state                | ✅ Done       | Đầy đủ 3 state                                                                                        |

---

## Issues — Vòng 1

### Issue #1

- **Feature:** Notification unread count
- **Vấn đề:** BE response là `{ "unreadCount": N }` nhưng service FE hiện tại (`notificationService.getUnreadCount`) type là `{ count: number }` — **mismatch field name**. FE đã workaround trong `MaterialsGenerator.tsx` bằng cách đọc cả `unreadCount` lẫn `count`, nhưng `notification.service.ts` cần được fix để dùng đúng field.
- **Yêu cầu:** BE xác nhận field name chính thức là `unreadCount` hay `count`?
- **Mức độ:** 🟡 Minor (FE đã workaround)

### Issue #2

- **Feature:** Hình Vẽ Toán Học
- **Vấn đề:** Chưa có entity/service/controller — cần xác nhận tech stack (GeoGebra/matplotlib?), output format (PNG/SVG?), sync/async?
- **Mức độ:** 🔴 Blocker (FE chưa thể implement)

### Issue #3

- **Feature:** Phiếu Bài Tập
- **Vấn đề:** Chưa implement — cần xác nhận: AI generate hay lấy từ question bank? PDF library? Sync/async?
- **Mức độ:** 🔴 Blocker (FE chưa thể implement)

### Issue #4

- **Feature:** Slide list — phân trang và tìm kiếm server-side
- **Vấn đề:** `GET /lesson-slides/generated` trả về toàn bộ list, không hỗ trợ `search`/`page`/`limit`. Nếu giáo viên có nhiều slide, performance sẽ kém.
- **Yêu cầu:** BE có kế hoạch thêm pagination + search filter cho endpoint này không?
- **Mức độ:** 🟡 Minor (client-side filter đủ dùng tạm)

---

## Issues cần họp để quyết định (từ BE)

1. **Math Drawing:** Dùng thư viện render nào? Output PNG hay SVG? Sync hay async?
2. **Worksheet:** AI generate hay lấy từ question bank? PDF library nào? Sync hay async?
3. **Slide list:** FE có cần search và pagination server-side không?
4. **Unified history:** Sau khi 4 loại đều implement xong, có tạo `GET /teacher/materials/history` hợp nhất không?

---

## 1. Danh sách tài liệu AI đã tạo gần đây

### Mô tả

Hiển thị bảng các tài liệu mà giáo viên đã tạo bằng AI (slide, mindmap, phiếu bài tập…). Hỗ trợ tìm kiếm theo tên tệp phía client. Hiển thị tối đa 12 dòng trong footer.

### Trạng thái hiện tại

- [x] Mock data nội tuyến (hardcode trong `mockData.ts`)
- [ ] Có fetch nhưng URL/response chưa đúng
- [ ] Chưa có fetch nào, toàn bộ là static

### Dữ liệu đang mock

```ts
// src/data/mockData.ts — mockMaterials
const mockMaterials = [
  {
    id: '1',
    title: 'Slide: Mệnh đề và logic',
    type: 'slide', // 'slide' | 'mindmap' | 'assessment'
    format: 'pptx', // 'pptx' | 'pdf' | 'docx'
    size: '2.5 MB',
    downloads: 45,
    createdAt: '2026-01-20', // ISO date string
    tags: ['đại số', 'mệnh đề', 'logic'],
  },
  // ...
];
```

**Trường bị hardcode trong component (cần BE trả về):**

```ts
// Trạng thái hiện đang fake theo index:
status: idx % 2 === 0 ? 'done' : 'processing'; // cần field thật từ BE
// Hành động cũng fake theo index:
action: idx % 2 === 0 ? 'Tải về' : 'Xem thử'; // cần download URL hoặc preview URL từ BE
```

### Đề xuất API

| Field    | Giá trị                                     |
| -------- | ------------------------------------------- |
| Method   | GET                                         |
| Endpoint | `/api/materials`                            |
| Auth     | Bearer Token (JWT) — lấy teacherId từ token |

**Query params (tùy chọn):**

```json
{
  "search": "string (tìm theo title, optional)",
  "page": "number (default: 1)",
  "limit": "number (default: 12)",
  "type": "slide | mindmap | assessment | worksheet (optional filter)"
}
```

**Response mong muốn:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "string (UUID)",
        "title": "string",
        "type": "slide | mindmap | assessment | worksheet",
        "format": "pptx | pdf | docx | png",
        "size": "string (vd: '2.5 MB')",
        "downloads": "number",
        "createdAt": "string (ISO 8601)",
        "tags": ["string"],
        "status": "done | processing | failed",
        "downloadUrl": "string (url tải tệp, null nếu chưa xong)",
        "previewUrl": "string (url xem thử, null nếu chưa xong)"
      }
    ],
    "total": "number",
    "page": "number",
    "limit": "number"
  }
}
```

### Validation FE đang áp dụng

- Tìm kiếm theo `title` (case-insensitive, client-side hiện tại) — nếu BE hỗ trợ `search` param thì FE sẽ chuyển sang server-side search
- Hiển thị tối đa 12 items trong một trang (footer: `Hiển thị 1 - {min(rows.length, 12)} của {total}`)

### Ghi chú

- FE cần `status` thật (`done` / `processing` / `failed`) để render đúng badge màu
- FE cần `downloadUrl` và `previewUrl` để xử lý nút hành động (hiện đang hardcode)
- Phân trang server-side được ưu tiên nếu số lượng tài liệu lớn

---

## 2. Slide Bài Giảng — ĐÃ CÓ TRANG VÀ API THẬT

> **Không cần BE làm thêm.** Trang và service đã tồn tại.

| Item      | Giá trị                                                           |
| --------- | ----------------------------------------------------------------- |
| Route FE  | `/teacher/ai-slide-generator`                                     |
| Component | `src/pages/ai/AISlideGenerator.tsx`                               |
| Service   | `src/services/api/lesson-slide.service.ts` (`LessonSlideService`) |

**Các endpoint đã có trong `api.config.ts`:**

| Endpoint                                      | Mục đích                          |
| --------------------------------------------- | --------------------------------- |
| `GET /lesson-slides/templates`                | Lấy danh sách template slide      |
| `POST /lesson-slides/generate-content`        | AI sinh nội dung slide từ bài học |
| `POST /lesson-slides/generate-pptx`           | Xuất PPTX từ JSON nội dung        |
| `POST /lesson-slides/generate-pptx-from-json` | Xuất PPTX trực tiếp               |
| `GET /lesson-slides/generated`                | Lấy danh sách file đã tạo         |
| `GET /lesson-slides/generated/:id/download`   | Tải file PPTX                     |

**Việc cần làm phía FE (MaterialsGenerator):** Nút "Bắt đầu tạo" của card Slide nên navigate đến `/teacher/ai-slide-generator`.

---

## 3. Sơ Đồ Tư Duy (Mindmap) — ĐÃ CÓ TRANG VÀ API THẬT

> **Không cần BE làm thêm.** Trang và service đã tồn tại.

| Item      | Giá trị                                                  |
| --------- | -------------------------------------------------------- |
| Route FE  | `/teacher/mindmaps`                                      |
| Component | `src/pages/mindmaps/TeacherMindmaps.tsx`                 |
| Service   | `src/services/api/mindmap.service.ts` (`MindmapService`) |

**Các endpoint đã có trong `api.config.ts`:**

| Endpoint                       | Mục đích                            |
| ------------------------------ | ----------------------------------- |
| `POST /mindmaps/generate`      | AI sinh mindmap từ bài học          |
| `GET /mindmaps/my-mindmaps`    | Lấy danh sách mindmap của giáo viên |
| `GET /mindmaps/:id`            | Chi tiết 1 mindmap                  |
| `POST /mindmaps/:id/publish`   | Xuất bản                            |
| `POST /mindmaps/:id/unpublish` | Gỡ xuất bản                         |

**Việc cần làm phía FE (MaterialsGenerator):** Nút "Bắt đầu tạo" của card Mindmap nên navigate đến `/teacher/mindmaps`.

---

## 4. Hình Vẽ Toán Học — CHƯA CÓ TRANG, CẦN API MỚI

### Mô tả

Vẽ đồ thị hàm số và hình học không gian từ mô tả văn bản (hoặc công thức toán). Hiện hoàn toàn chưa có route, trang hay service nào trong dự án.

### Trạng thái hiện tại

- [x] Chưa có fetch nào, nút "Bắt đầu tạo" không trigger gì
- Không có route `/teacher/math-drawing` hay tương đương

### Đề xuất API

| Field    | Giá trị                   |
| -------- | ------------------------- |
| Method   | POST                      |
| Endpoint | `/math-drawings/generate` |
| Auth     | Bearer Token (JWT)        |

**Request body:**

```json
{
  "lessonId": "string (UUID, optional — nếu gắn với bài học cụ thể)",
  "prompt": "string (mô tả hình vẽ / công thức cần vẽ, bắt buộc)",
  "type": "function-graph | geometry | number-line | other",
  "title": "string (tên tệp kết quả, bắt buộc)"
}
```

**Response mong muốn:**

```json
{
  "success": true,
  "data": {
    "id": "string (UUID)",
    "title": "string",
    "imageUrl": "string (URL ảnh kết quả PNG/SVG)",
    "type": "function-graph | geometry | number-line | other",
    "createdAt": "string (ISO 8601)",
    "status": "done | processing | failed"
  }
}
```

**Lấy danh sách hình vẽ đã tạo:**

| Field    | Giá trị            |
| -------- | ------------------ |
| Method   | GET                |
| Endpoint | `/math-drawings`   |
| Auth     | Bearer Token (JWT) |

```json
Query: { "page": 0, "size": 10, "sortBy": "createdAt", "direction": "DESC" }
```

### Validation FE sẽ áp dụng

- `prompt` bắt buộc, không rỗng
- `title` bắt buộc, không rỗng

### Ghi chú

- `[UNKNOWN - cần BE xác nhận]` BE dùng GeoGebra API, Python matplotlib, hay service khác để render hình?
- `[UNKNOWN - cần BE xác nhận]` Output là PNG hay SVG? FE cần biết để render đúng.

---

## 5. Phiếu Bài Tập — CHƯA CÓ TRANG, CẦN API MỚI

### Mô tả

Tạo đề bài tập in sẵn với các dạng toán đa dạng và lời giải chi tiết. Hiện hoàn toàn chưa có route, trang hay service nào. Dự án có `TeacherQuestionManagementPage` (`/teacher/questions`) nhưng đó là quản lý câu hỏi đơn lẻ, **không phải** tính năng sinh phiếu PDF.

### Trạng thái hiện tại

- [x] Chưa có fetch nào, nút "Bắt đầu tạo" không trigger gì
- Không có route `/teacher/worksheets` hay tương đương

### Đề xuất API

| Field    | Giá trị                |
| -------- | ---------------------- |
| Method   | POST                   |
| Endpoint | `/worksheets/generate` |
| Auth     | Bearer Token (JWT)     |

**Request body:**

```json
{
  "lessonId": "string (UUID, optional)",
  "title": "string (bắt buộc)",
  "prompt": "string (yêu cầu dạng toán, độ khó, số lượng bài, bắt buộc)",
  "numberOfQuestions": "number (optional, default: 10)",
  "difficulty": "easy | medium | hard | mixed (optional, default: mixed)",
  "includeAnswerKey": "boolean (có in kèm đáp án không, default: true)"
}
```

**Response mong muốn:**

```json
{
  "success": true,
  "data": {
    "id": "string (UUID)",
    "title": "string",
    "status": "done | processing | failed",
    "pdfUrl": "string (URL tải PDF khi status = done)",
    "previewUrl": "string (URL xem thử)",
    "createdAt": "string (ISO 8601)",
    "numberOfQuestions": "number"
  }
}
```

**Lấy danh sách phiếu đã tạo:**

| Field    | Giá trị            |
| -------- | ------------------ |
| Method   | GET                |
| Endpoint | `/worksheets`      |
| Auth     | Bearer Token (JWT) |

### Validation FE sẽ áp dụng

- `title` bắt buộc, không rỗng
- `prompt` bắt buộc, không rỗng
- `numberOfQuestions` trong khoảng [1, 50]

### Ghi chú

- `[UNKNOWN - cần BE xác nhận]` BE generate câu hỏi bằng AI rồi render PDF, hay lấy câu hỏi từ question bank?
- Nếu async (job queue): FE cần polling endpoint `GET /worksheets/:id` để kiểm tra trạng thái.

---

## 6. Lịch sử tạo tài liệu (nút "Lịch sử tạo")

### Mô tả

> Lưu ý: Slide và Mindmap đã có trang lịch sử riêng (`/lesson-slides/generated` và `/mindmaps/my-mindmaps`). Mục này chỉ áp dụng cho **Hình Vẽ Toán Học** và **Phiếu Bài Tập** mới.

Nút "Lịch sử tạo" ở góc trên phải của trang. Hiện tại không có handler — có thể mở modal hoặc điều hướng sang trang riêng.

### Trạng thái hiện tại

- [x] Chưa có fetch nào, nút không trigger gì

### Đề xuất API

Dùng lại endpoint **mục 1** (`GET /api/materials`) nhưng không lọc, trả toàn bộ lịch sử với phân trang.

`[UNKNOWN - cần BE xác nhận]` BE có endpoint lịch sử riêng hay dùng chung `/api/materials`?

---

## 7. Thông tin giáo viên (User Context cho Layout)

### Mô tả

`DashboardLayout` nhận `user.name`, `user.avatar`, `user.role`. Hiện đang lấy từ `mockTeacher`.

### Trạng thái hiện tại

- [x] Mock data nội tuyến (`mockTeacher` từ `mockData.ts`)
- `notificationCount={5}` — hardcode

### Dữ liệu đang mock

```ts
const mockTeacher = {
  id: '1',
  name: 'Phạm Đăng Khôi',
  avatar: 'NT', // chữ viết tắt, không phải URL ảnh
  role: 'teacher',
  // ...
};
```

### Ghi chú

- Thông tin user nên lấy từ Auth context / token decode — không cần API riêng
- `notificationCount` cần endpoint riêng: `[UNKNOWN - cần BE xác nhận]` đã có chưa? Xem spec notification nếu có.
