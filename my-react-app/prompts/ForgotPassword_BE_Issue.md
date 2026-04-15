# BE Issue — `POST /auth/forgot-password` trả về 401

**Ngày:** 2026-04-16  
**Người báo:** FE Team  
**Mức độ:** Blocker (tính năng không dùng được)

---

## Vấn đề

Khi FE gọi `POST /auth/forgot-password` với body `{ "email": "..." }`, server trả về **401 Unauthorized**.

```
POST http://localhost:3000/api/auth/forgot-password
→ 401 Unauthorized
```

### FE đã gửi đúng

Request từ FE **không** đính kèm `Authorization` header — đây là endpoint public, người dùng chưa đăng nhập:

```ts
// auth.service.ts
const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    accept: '*/*',
    // ← KHÔNG có Authorization header
  },
  body: JSON.stringify({ email }),
});
```

---

## Nguyên nhân có thể

Spring Security (hoặc middleware tương đương) đang **yêu cầu xác thực** cho route `/auth/forgot-password`.  
Endpoint này phải được thêm vào **whitelist / permitAll()** trong security config.

Ví dụ với Spring Security:

```java
.requestMatchers(
    "/auth/register",
    "/auth/login",
    "/auth/confirm-email",
    "/auth/forgot-password",   // ← cần thêm dòng này
    "/auth/reset-password"     // ← và cả đây nếu chưa có
).permitAll()
```

---

## Yêu cầu BE

1. **Whitelist** `POST /auth/forgot-password` — không yêu cầu JWT.
2. **Whitelist** `POST /auth/reset-password` — không yêu cầu JWT (FE sẽ dùng tiếp theo).
3. Xác nhận lại response shape khi thành công:
   ```json
   { "code": 1000, "result": null }
   ```
4. Như đã thống nhất trong `ForgotPassword.md`: trả về `200 OK` dù email có tồn tại hay không (tránh user enumeration).

---

## Liên quan

- Spec đầy đủ: [`prompts/ForgotPassword.md`](./ForgotPassword.md)
