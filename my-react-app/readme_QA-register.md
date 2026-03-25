# QA Report — Register Flow (Frontend → Backend)

## Current Issue

`POST /api/auth/register` returns **500 Internal Server Error**.

The frontend sends the correct request body but the backend crashes before returning a response.

---

## What the Frontend Sends

**Endpoint:** `POST /api/auth/register`  
**Content-Type:** `application/json`

**Request body:**
```json
{
  "userName": "john_doe",
  "email": "john@example.com",
  "password": "Abcd@1234"
}
```

> **Note:** The old fields (`fullName`, `phoneNumber`, `gender`, `dob`, `role`) are **no longer sent**. The new contract is 3 fields only.

---

## Expected Success Response — HTTP 200

```json
{
  "code": 1000,
  "result": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "userName": "john_doe",
    "email": "john@example.com",
    "status": "INACTIVE",
    "createdDate": "2026-03-25T10:00:00Z",
    "createdBy": "john_doe",
    "updatedDate": "2026-03-25T10:00:00Z",
    "updatedBy": "john_doe"
  }
}
```

User is saved with `status = INACTIVE`. A confirmation email is sent. The frontend does **not** log the user in.

---

## Expected Error Responses — HTTP 400

| `code` | Meaning                  | When to return                       |
|--------|--------------------------|--------------------------------------|
| `1002` | Username already taken   | `userName` already exists in DB      |
| `1013` | Email already registered | `email` already exists in DB         |

**Error response shape:**
```json
{
  "code": 1002,
  "message": "Username already taken"
}
```

The frontend reads `code` and maps it to a field-level error message, so the `code` value must be exactly `1002` or `1013`.

---

## Email Confirmation Flow

After a successful register, the backend must send an email containing:

```
http://localhost:3000/confirm-email?token=<JWT>
```

- The `FRONTEND_URL` env variable must be set to `http://localhost:3000` (dev) or the production domain.
- Token expiry: **24 hours**.

The frontend calls `GET /api/auth/confirm-email?token=<TOKEN>` when the user clicks the link.

**Success response:**
```json
{
  "code": 1000,
  "result": null
}
```

**Error response (expired / invalid token):**
```json
{
  "code": 1006,
  "message": "..."
}
```

---

## Suspected Root Causes of the 500

Please check the backend logs for any of the following:

1. **SMTP not configured** — The email send after user creation throws `MessagingException`. Required `application.properties` keys:
   ```properties
   spring.mail.host=...
   spring.mail.port=587
   spring.mail.username=...
   spring.mail.password=...
   spring.mail.properties.mail.smtp.auth=true
   spring.mail.properties.mail.smtp.starttls.enable=true
   ```

2. **`FRONTEND_URL` is null** — Building the confirmation link causes a `NullPointerException`. Must be set:
   ```properties
   app.frontend-url=http://localhost:3000
   ```

3. **`RegisterRequest` DTO still has `@NotNull` on removed fields** — If `fullName`, `phoneNumber`, `gender`, `dob`, or `role` are still `@NotNull`/`@NotBlank`, the validation will fail because the frontend no longer sends them. Please remove those constraints or make the fields optional.

4. **DB schema mismatch** — If the `status` column or any new column doesn't exist yet, the `INSERT` will fail.

---

## Summary Checklist for BE

- [ ] `RegisterRequest` DTO only requires `userName`, `email`, `password`
- [ ] User is saved with `status = INACTIVE`
- [ ] Confirmation email is sent with link `{FRONTEND_URL}/confirm-email?token=...`
- [ ] SMTP configured and working
- [ ] `app.frontend-url` env variable set
- [ ] `GET /api/auth/confirm-email?token=` endpoint is public (no auth required)
- [ ] Error codes `1002` and `1013` returned as JSON with `code` field on 400
- [ ] Login returns code `1140` (HTTP 401) when account is `INACTIVE`
