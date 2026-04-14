# Agent Guide — Đọc & Cập nhật Project Structure

## Mục đích

File `prompts/PROJECT_STRUCTURE.md` chứa **toàn bộ cấu trúc source code** của project. Agent **BẮT BUỘC** phải đọc file này khi bắt đầu task mới để hiểu cấu trúc dự án, và **cập nhật** file mỗi khi thay đổi cấu trúc.

---

## Quy trình cho Agent

### 1. Bắt đầu mỗi task → ĐỌC PROJECT_STRUCTURE.md

```
Bước đầu tiên: Đọc file `prompts/PROJECT_STRUCTURE.md` để:
- Biết file nào đã tồn tại
- Biết cấu trúc folder hiện tại
- Tránh tạo file trùng hoặc đặt sai vị trí
```

### 2. Khi TẠO file/folder mới → CẬP NHẬT ngay

Sau khi tạo file hoặc folder mới, **cập nhật lại** `prompts/PROJECT_STRUCTURE.md`:

- Thêm file mới vào đúng section (types, hooks, services, components, pages)
- Nếu tạo folder mới → thêm section mới
- Giữ đúng format cây thư mục đã có

**Ví dụ:** Tạo `src/hooks/useWallet.ts` → thêm vào section `src/hooks/`:

```
hooks/
├── ...
├── useWallet.ts          ← MỚI
└── useSubjects.ts
```

### 3. Khi XÓA file/folder → CẬP NHẬT ngay

- Xóa dòng tương ứng khỏi `PROJECT_STRUCTURE.md`
- Nếu xóa cả folder → xóa section tương ứng

### 4. Khi ĐỔI TÊN file/folder → CẬP NHẬT ngay

- Sửa tên file trong `PROJECT_STRUCTURE.md` cho khớp

### 5. Luôn cập nhật ngày `Cập nhật lần cuối` ở đầu file

Sửa dòng:

```
> **Cập nhật lần cuối:** YYYY-MM-DD
```

---

## Checklist cho Agent

Trước khi kết thúc mỗi task có thay đổi cấu trúc file:

- [ ] Đã đọc `PROJECT_STRUCTURE.md` ở đầu task
- [ ] Đã cập nhật `PROJECT_STRUCTURE.md` nếu có thêm/xóa/đổi tên file
- [ ] Đã cập nhật ngày `Cập nhật lần cuối`
- [ ] Cấu trúc trong file khớp với thực tế

---

## Lưu ý

- **KHÔNG** cần cập nhật khi chỉ sửa nội dung bên trong file (không thay đổi cấu trúc)
- **CÓ** cần cập nhật khi thêm section mới trong bảng "Key Architecture Patterns" nếu áp dụng pattern mới
- File này là **source of truth** cho agent — nếu thấy bất đồng giữa file và thực tế, ưu tiên cập nhật file cho đúng thực tế
