# PROMPT 3 — FE Developer → Đọc `Y.md`, confirm & integrate API vào `.tsx`

## Mục tiêu
Bạn là **Frontend Developer**. Bạn vừa nhận được file `Y.md` từ BE mô tả các API chính thức. Nhiệm vụ:

1. **Review `Y.md`** — kiểm tra xem response shape, validation, error code có khớp với những gì FE cần không.
2. **Confirm hoặc raise issue** — nếu có điểm nào không khớp / thiếu / cần thảo luận thêm.
3. **Integrate API** vào các file `.tsx` — xóa mock data, thay bằng fetch thật, xử lý loading/error state đầy đủ.
4. **Cập nhật lại `X.md`** — đánh dấu feature đã done, ghi nhận feature còn pending để lặp vòng tiếp theo.

---

## Đầu vào (Input)
- File `Y.md` từ BE
- Các file `.tsx` tương ứng cần tích hợp
- File `X.md` cũ (để update trạng thái)

---

## Bước 1 — Review & Confirm `Y.md`

Trước khi code, hãy kiểm tra từng API trong `Y.md` theo checklist sau:

### Checklist review mỗi endpoint

```
[ ] URL và method khớp với những gì FE dự kiến gọi
[ ] Auth header rõ ràng — biết lấy token từ đâu (localStorage, context, cookie...)
[ ] Response shape đủ các field FE cần hiển thị
[ ] Error codes dạng string đã đủ để FE handle từng case (STUDENT_NOT_FOUND, TOKEN_INVALID, ...)
[ ] Validation rules BE áp dụng khớp với validation FE đang làm (cùng format ngày, cùng enum values, ...)
[ ] Pagination structure rõ ràng (page/limit/totalCount hay cursor-based?)
[ ] Không có breaking change nào ảnh hưởng feature đang hoạt động
```

### Nếu phát hiện vấn đề — raise issue ngay

Ghi vào phần **"Issues cần BE giải quyết"** trong file `X.md` (version cập nhật):

```markdown
## Issues — Vòng lặp [N]

### Issue #1
- **Feature:** Student Grades
- **Vấn đề:** Response thiếu field `letterGrade` (A, B, C...) mà FE cần để hiển thị badge màu
- **Yêu cầu:** Thêm `letterGrade: string` vào mỗi item trong mảng `grades`
- **Mức độ:** 🔴 Blocker (không thể hiển thị UI đúng nếu thiếu)

### Issue #2
- **Feature:** Student Roadmap
- **Vấn đề:** Error message trả về tiếng Anh nhưng FE cần hiển thị tiếng Việt cho người dùng
- **Yêu cầu:** BE trả về error code (string), FE tự map sang tiếng Việt — hoặc BE hỗ trợ `Accept-Language` header
- **Mức độ:** 🟡 Minor (có thể workaround ở FE)
```

---

## Bước 2 — Integrate API vào `.tsx`

Sau khi confirm không có blocker, tiến hành tích hợp theo các nguyên tắc sau:

### Nguyên tắc bắt buộc

1. **Xóa hoàn toàn mock data** — không để sót `const mockXxx = [...]` nào trong code production.
2. **Dùng đúng URL từ `Y.md`** — không tự suy đoán endpoint, copy nguyên xi từ Y.md.
3. **Match chính xác request format** — path params, query params, body fields phải đúng tên, đúng kiểu.
4. **Handle đủ trạng thái**:
   - `loading` — hiển thị skeleton / spinner
   - `error` — hiển thị thông báo lỗi phù hợp theo error code
   - `empty` — hiển thị empty state khi data trả về rỗng
   - `success` — render UI chính
5. **Validate trước khi submit** — đảm bảo FE validate khớp với BE (cùng rule, cùng format).
6. **Không hardcode token** — lấy từ auth context / localStorage đúng cách đã quy ước trong dự án.

### Cấu trúc code gợi ý

```tsx
// ✅ Ví dụ tích hợp chuẩn — StudentGrades.tsx

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext"; // lấy token từ context

interface Grade {
  subjectId: string;
  subjectName: string;
  score: number;
  maxScore: number;
  semester: string;
  updatedAt: string;
}

interface GradesResponse {
  success: boolean;
  data: {
    studentId: string;
    grades: Grade[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
    };
  };
}

const StudentGrades = () => {
  const { token, user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchGrades = async () => {
      setLoading(true);
      setError(null);
      try {
        // ✅ URL lấy CHÍNH XÁC từ Y.md
        const res = await fetch(
          `/api/v1/students/${user.studentId}/grades?page=${page}&limit=20`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const json: GradesResponse = await res.json();

        if (!res.ok || !json.success) {
          // ✅ Handle theo error code từ Y.md
          switch (json.error) {
            case "TOKEN_INVALID":
              setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
              break;
            case "STUDENT_NOT_FOUND":
              setError("Không tìm thấy thông tin học sinh.");
              break;
            default:
              setError("Có lỗi xảy ra. Vui lòng thử lại sau.");
          }
          return;
        }

        setGrades(json.data.grades);
      } catch (err) {
        setError("Không thể kết nối đến server.");
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [page, token, user.studentId]);

  if (loading) return <GradesSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (grades.length === 0) return <EmptyState message="Chưa có điểm nào." />;

  return (
    <div>
      {grades.map((g) => (
        <GradeCard key={g.subjectId} grade={g} />
      ))}
    </div>
  );
};
```

---

## Bước 3 — Cập nhật `X.md`

Sau mỗi vòng integrate, cập nhật trạng thái trong `X.md`:

```markdown
## Tracking — Trạng thái tích hợp

| Feature               | Vòng | Trạng thái FE    | Ghi chú                          |
|-----------------------|------|-----------------|----------------------------------|
| Student Grades        | 1    | ✅ Done          | Đã integrate, test OK trên staging |
| Student Dashboard     | 1    | ⚠️ Partial       | Xong phần grades, còn attendance |
| Student Roadmap       | 1    | 🔴 Blocked       | Issue #2 chưa được BE giải quyết |
| Student Profile Edit  | -    | ⏳ Chưa bắt đầu | Chờ Y.md vòng 2                  |
```

---

## Lặp lại vòng tiếp theo

Nếu còn feature chưa done hoặc có issues:
1. **FE gom tất cả issues + feature pending** → cập nhật `X.md` → gửi lại BE.
2. **BE đọc, xử lý** → cập nhật `Y.md` → gửi lại FE.
3. **Lặp** cho đến khi bảng tracking không còn dòng nào là `⏳` hoặc `🔴`.

---

## Definition of Done (DoD) cho toàn bộ quá trình

Chỉ coi là "xong" khi:
- [ ] Tất cả mock data đã bị xóa khỏi code production
- [ ] Mỗi feature có đủ: loading state, error handling, empty state, success state
- [ ] Validation FE và BE đã được xác nhận là khớp nhau
- [ ] Test thủ công trên môi trường staging với data thật
- [ ] Không còn `console.log` debug hay `TODO: fetch real data` trong code
- [ ] PR/MR đã được review và merge
```