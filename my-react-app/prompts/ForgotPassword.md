# API Spec Request — ForgotPassword

**Ngày tạo:** 2026-04-16  
**Người tạo:** FE Team  
**Trạng thái:** Chờ BE phản hồi

---

## 1. Forgot Password — Gửi link đặt lại mật khẩu

### Mô tả

Người dùng nhập email đã đăng ký, hệ thống gửi một link chứa token đặt lại mật khẩu về hộp thư. FE hiển thị thông báo thành công mà **không tiết lộ** email có tồn tại trong hệ thống hay không (bảo mật — tránh user enumeration).

### Trạng thái hiện tại

- [x] Chưa có fetch nào, toàn bộ là placeholder (trang mới tạo)
- [x] Service method `AuthService.forgotPassword({ email })` đã có skeleton, chờ BE xác nhận endpoint

### Dữ liệu FE gửi đi

```ts
// Request body
interface ForgotPasswordRequest {
  email: string; // required, format email, max 50 ký tự
}
```

### Đề xuất API

| Field    | Giá trị                 |
| -------- | ----------------------- |
| Method   | POST                    |
| Endpoint | `/auth/forgot-password` |
| Auth     | Không yêu cầu (public)  |

**Request body:**

```json
{
  "email": "user@example.com"
}
```

**Response mong muốn (thành công):**

```json
{
  "code": 1000,
  "result": null
}
```

**Response khi email không tồn tại:**  
Vẫn trả về `200 OK` với `code: 1000` (tránh user enumeration attack). BE không nên trả về lỗi 404 ở endpoint này.

### Validation FE đang áp dụng

| Field   | Rule                                                       |
| ------- | ---------------------------------------------------------- |
| `email` | Bắt buộc, regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`, max 50 ký tự |

### Ghi chú

- FE hiển thị thông báo thành công chung: _"Nếu email tồn tại, chúng tôi đã gửi link..."_ — không phân biệt email có hay không.
- Link trong email có hiệu lực **15 phút** (FE hardcode hiển thị, BE cần đảm bảo token TTL khớp).
- Người dùng có thể nhấn "Gửi lại email" để submit lại — cần BE hỗ trợ rate limiting (ví dụ: tối đa 3 lần / 10 phút / email).

---

## 2. Reset Password — Đặt lại mật khẩu bằng token

### Mô tả

Sau khi nhấn link trong email, người dùng được chuyển đến trang đặt mật khẩu mới. FE đọc `token` từ query string (`?token=...`), cho người dùng nhập mật khẩu mới và xác nhận, rồi gọi API reset.

> **Trang ResetPassword chưa được tạo** — cần BE xác nhận API trước khi FE xây dựng.

### Dữ liệu FE gửi đi

```ts
interface ResetPasswordRequest {
  token: string; // từ query string ?token=...
  newPassword: string; // mật khẩu mới
}
```

### Đề xuất API

| Field    | Giá trị                |
| -------- | ---------------------- |
| Method   | POST                   |
| Endpoint | `/auth/reset-password` |
| Auth     | Không yêu cầu (public) |

**Request body:**

```json
{
  "token": "string (JWT hoặc UUID reset token)",
  "newPassword": "NewPass@123"
}
```

**Response mong muốn (thành công):**

```json
{
  "code": 1000,
  "result": null
}
```

**Response khi token hết hạn hoặc không hợp lệ:**

```json
{
  "code": 1xxx,
  "message": "Token không hợp lệ hoặc đã hết hạn"
}
```

### Validation FE sẽ áp dụng

Giống như `Register.tsx`:

| Field             | Rule                                                        |
| ----------------- | ----------------------------------------------------------- |
| `newPassword`     | 8–128 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt     |
| `confirmPassword` | Phải khớp với `newPassword` (chỉ validate FE, không gửi BE) |

### Câu hỏi cần BE xác nhận

- [ ] Token reset password là JWT hay UUID ngẫu nhiên?
- [ ] Token được gửi qua query string (`?token=...`) hay path param (`/reset-password/{token}`)?
- [ ] Sau khi reset thành công, token có bị vô hiệu hóa ngay không?
- [ ] Error code cụ thể khi token hết hạn / đã dùng / không tồn tại là gì?
- [ ] Rate limit cho `/auth/forgot-password`: bao nhiêu lần / khoảng thời gian?
