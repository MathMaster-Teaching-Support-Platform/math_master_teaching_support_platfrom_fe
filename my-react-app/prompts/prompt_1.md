# PROMPT 1 — FE Analyst → Sinh file `X.md` (API Spec Request)

## Mục tiêu

Bạn là một **Frontend Developer** đang đọc các file `.tsx` của dự án. Nhiệm vụ của bạn là phân tích toàn bộ code FE, xác định những nơi đang **mock data / hardcode / chưa fetch thật**, rồi tổng hợp thành một file `X.md` gửi cho Backend.

---

## Đầu vào (Input)

- Các file `.tsx` liên quan (ví dụ: `StudentDashboard.tsx`, `StudentGrades.tsx`, `StudentRoadmap.tsx`, v.v.)
- Toàn bộ nội dung file sẽ được paste hoặc đọc từ thư mục dự án.

---

## Yêu cầu phân tích

Với **mỗi feature / màn hình**, hãy xác định và ghi rõ:

1. **Tên feature / component**: Tên màn hình hoặc block UI đang xét.
2. **Trạng thái hiện tại**: Đang mock data (`const data = [...]`), hardcode giá trị, hay đã có `fetch`/`axios` nhưng URL sai/chưa đúng.
3. **Dữ liệu đang mock**: Liệt kê các trường dữ liệu đang fake, kèm kiểu dữ liệu (TypeScript type nếu có).
4. **Hành vi mong muốn**: FE cần gọi API để làm gì? Trigger khi nào (load trang, click nút, submit form...)?
5. **Đề xuất API** _(FE không chắc BE đã có hay chưa)_:
   - Method: `GET` / `POST` / `PUT` / `DELETE`
   - Endpoint gợi ý: ví dụ `/api/students/:id/grades`
   - Request params / body (nếu có)
   - Response shape mong muốn (dạng JSON, các field cần thiết)
6. **Validation / ràng buộc quan trọng** mà FE đang áp dụng (ví dụ: trường bắt buộc, định dạng ngày, min/max...) — để BE biết mà validate khớp.
7. **Ghi chú thêm**: Phân trang? Lọc? Auth header? Role-based data?

---

## Format output — file `X.md`

````markdown
# API Spec Request — [Tên dự án / Module]

**Ngày tạo:** YYYY-MM-DD  
**Người tạo:** FE Team  
**Trạng thái:** Chờ BE phản hồi

---

## 1. [Tên Feature]

### Mô tả

[Giải thích ngắn gọn feature này làm gì trên UI]

### Trạng thái hiện tại

- [ ] Mock data nội tuyến (hardcode trong component)
- [ ] Có fetch nhưng URL/response chưa đúng
- [ ] Chưa có fetch nào, toàn bộ là static

### Dữ liệu đang mock

```ts
// Ví dụ mock hiện tại trong code
const mockGrades = [{ subjectId: 'math01', subjectName: 'Toán', score: 8.5, maxScore: 10 }];
```
````

### Đề xuất API

| Field    | Giá trị                         |
| -------- | ------------------------------- |
| Method   | GET                             |
| Endpoint | /api/students/:studentId/grades |
| Auth     | Bearer Token (JWT)              |

**Request params:**

```json
{ "studentId": "string (UUID)" }
```

**Response mong muốn:**

```json
{
  "success": true,
  "data": {
    "studentId": "uuid",
    "grades": [
      {
        "subjectId": "string",
        "subjectName": "string",
        "score": "number",
        "maxScore": "number",
        "semester": "string"
      }
    ]
  }
}
```

### Validation FE đang áp dụng

- `score` phải trong khoảng [0, maxScore]
- `subjectName` không được rỗng

### Ghi chú

- Cần phân trang nếu số môn > 20
- Data phụ thuộc vào semester đang active

---

## 2. [Feature tiếp theo]

...

```

---

## Lưu ý khi viết `X.md`
- **Không đoán mò** — nếu không rõ BE đã có API chưa, hãy đánh dấu `[UNKNOWN - cần BE xác nhận]`
- Ghi rõ **mọi trường** FE cần, kể cả trường phụ (createdAt, updatedAt, displayName...)
- Nếu một endpoint phục vụ nhiều feature, gom vào một mục, đừng lặp lại
- Ưu tiên **chính xác hơn đầy đủ** — thà thiếu feature còn hơn mô tả sai
```
