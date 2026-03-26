# QA Report — Profile Settings (Cài đặt tài khoản) — Teacher Role

## Bug Summary

When a user logs in as **TEACHER** and opens the **Cài đặt tài khoản** page (`/settings/profile`), the page fails to load any account information. The browser console shows:

```
GET http://localhost:3000/api/users/my-info  404 (Not Found)
```

The error fires on every mount of `<ProfileSettings>` (including React Strict Mode double-invoke), so it appears twice in the logs.

---

## What the Frontend Does

**File:** `src/services/api/user.service.ts`

```ts
static async getMyInfo(): Promise<UserProfileResponse> {
  const res = await fetch(`${API_BASE_URL}/users/my-info`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer <JWT>`,   // token from localStorage key "authToken"
    },
  });
  return this.handleResponse<UserProfileResponse>(res); // expects code: 1000
}
```

**Effective request (dev):**

| Field   | Value                                                      |
| ------- | ---------------------------------------------------------- |
| Method  | `GET`                                                      |
| URL     | `http://localhost:8080/api/users/my-info` (via Vite proxy) |
| Headers | `Authorization: Bearer <valid JWT>`                        |
| Body    | _(none)_                                                   |

The token **is** valid — Centrifugo WebSocket connects successfully with the same token immediately after the 404 appears, confirming the JWT itself is not the problem.

---

## Expected Response — HTTP 200

The frontend expects the following JSON shape:

```json
{
  "code": 1000,
  "result": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "userName": "teacher_nguyen",
    "fullName": "Nguyễn Văn A",
    "email": "teacher@example.com",
    "phoneNumber": "+84901234567",
    "gender": "MALE",
    "avatar": "https://cdn.example.com/avatar.jpg",
    "dob": "1990-05-15",
    "code": "TCH-001",
    "status": "ACTIVE",
    "banReason": null,
    "banDate": null,
    "roles": ["TEACHER"],
    "createdDate": "2024-01-10T08:00:00Z",
    "createdBy": "admin",
    "updatedDate": null,
    "updatedBy": null
  }
}
```

> `gender` must be one of: `"MALE"`, `"FEMALE"`, `"OTHER"`, or `null`.
> `status` must be one of: `"ACTIVE"`, `"INACTIVE"`, `"BANNED"`, `"DELETED"`.

---

## Possible Root Causes (for BE team to check)

| #   | Hypothesis                                                                                                               | How to verify                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| 1   | **Endpoint not implemented** — `GET /api/users/my-info` does not exist yet in the controller                             | Check UserController for `@GetMapping("/my-info")`       |
| 2   | **Role-based restriction** — endpoint is implemented but Spring Security only permits `ROLE_STUDENT`, not `ROLE_TEACHER` | Check `SecurityConfig` / `@PreAuthorize` on the method   |
| 3   | **Wrong path** — endpoint exists under a different path (e.g., `/api/users/me`, `/api/users/profile`, `/api/profile`)    | Check all UserController mappings                        |
| 4   | **Context path mismatch** — backend has a base path configured (e.g., `/v1/api`) so the real URL is different            | Check `server.servlet.context-path` in `application.yml` |

---

## Also Used: `PUT /api/users/my-info` (Update Profile)

The same page also calls `PUT /api/users/my-info` when the user saves profile changes:

```json
{
  "fullName": "Nguyễn Văn A",
  "email": "teacher@example.com",
  "phoneNumber": "+84901234567",
  "gender": "MALE",
  "avatar": "https://cdn.example.com/avatar.jpg",
  "dob": "1990-05-15"
}
```

This endpoint must also work for the TEACHER role.

---

## Also Used: `PUT /api/users/change-password`

```json
{
  "currentPassword": "OldPass@123",
  "newPassword": "NewPass@456",
  "confirmPassword": "NewPass@456"
}
```

Expected success: `{ "code": 1000, "result": null }`

---

## Questions for BE Team

1. **Is `GET /api/users/my-info` implemented?** If yes, what is the exact URL path (including any context prefix)?
2. **Is the endpoint accessible for TEACHER role?** Or is it restricted to STUDENT only?
3. **Do we need a separate endpoint for teachers?** (e.g., `GET /api/teacher-profiles/my-profile` for teacher-specific data, separate from the generic user info endpoint)
4. **Same question for `PUT /api/users/my-info` and `PUT /api/users/change-password`** — are they accessible for TEACHER role?

---

## Checklist

- [ ] `GET /api/users/my-info` exists and returns HTTP 200 for authenticated TEACHER
- [ ] `PUT /api/users/my-info` exists and works for TEACHER
- [ ] `PUT /api/users/change-password` exists and works for TEACHER
- [ ] All three endpoints return `{ "code": 1000, "result": ... }` envelope
- [ ] `roles` field in the response contains `["TEACHER"]` (not just `STUDENT`)
- [ ] Spring Security config allows `TEACHER` role to access `/api/users/**` self-service endpoints
