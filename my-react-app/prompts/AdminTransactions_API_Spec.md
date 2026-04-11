# API Spec Request — Admin Transactions (Quản lý Giao dịch)

**Ngày tạo:** 2026-04-11  
**Người tạo:** FE Team  
**File nguồn:** `src/pages/admin/AdminTransactions.tsx`  
**Trạng thái:** FE đã review BE contract và tích hợp API vòng 1

---

## 1. Danh sách giao dịch (Transaction List)

### Mô tả

Màn hình admin hiển thị toàn bộ lịch sử giao dịch thanh toán trên hệ thống. Gồm bảng phân trang (10 dòng/trang), thanh tìm kiếm, và bộ lọc theo trạng thái. Admin không thể chỉnh sửa giao dịch — chỉ xem.

### Trạng thái hiện tại

- [x] Mock data nội tuyến (hardcode `MOCK_TRANSACTIONS` ngay trong component)
- [ ] Có fetch nhưng URL/response chưa đúng
- [ ] Chưa có fetch nào, toàn bộ là static

### Dữ liệu đang mock

```ts
interface MockTransaction {
  id: string; // UUID / custom ID, ví dụ: 'txn-001a2b3c'
  userId: string; // ID user, ví dụ: 'u-101'
  userName: string; // Tên hiển thị
  userEmail: string; // Email
  planName: string; // Tên gói, ví dụ: 'Gói Pro - 1 tháng'
  amount: number; // Số tiền VND, ví dụ: 99000
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string; // Hiện tại luôn là 'payos'
  orderCode: string; // Mã đơn hàng, ví dụ: 'ORD-2026-0001'
  createdAt: string; // ISO 8601, ví dụ: '2026-04-11T08:23:11Z'
}
```

### Đề xuất API — Lấy danh sách giao dịch (có phân trang + lọc)

| Field    | Giá trị                          |
| -------- | -------------------------------- |
| Method   | GET                              |
| Endpoint | `/api/admin/transactions`        |
| Auth     | Bearer Token (JWT) — role: admin |

**Query params:**

```
page        integer   0-based, default 0
size        integer   default 10
status      string    'completed' | 'pending' | 'failed' | bỏ qua = tất cả
search      string    tìm theo userName, userEmail, orderCode, planName (optional)
```

**Response mong muốn:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "string",
        "userId": "string",
        "userName": "string",
        "userEmail": "string",
        "planName": "string",
        "amount": 99000,
        "status": "completed",
        "paymentMethod": "payos",
        "orderCode": "string",
        "createdAt": "2026-04-11T08:23:11Z"
      }
    ],
    "totalItems": 150,
    "totalPages": 15,
    "currentPage": 0
  }
}
```

### Validation FE đang áp dụng

- `status` chỉ chấp nhận `'completed'`, `'pending'`, hoặc `'failed'`
- `amount` phải là số nguyên dương (VND, không có phần thập phân)
- `createdAt` phải là chuỗi ISO 8601 hợp lệ

### Ghi chú

- FE hiện filter/search/phân trang **client-side** trên toàn bộ mock array. Khi chuyển sang API thật, logic này sẽ chuyển toàn bộ sang **server-side**.
- `paymentMethod` trong mock luôn là `'payos'` — [UNKNOWN - cần BE xác nhận có thêm phương thức khác không]
- Tab badge hiển thị **tổng count theo từng status** — cần BE trả về `totalByStatus` hoặc FE gọi thêm endpoint thống kê riêng (xem mục 2).

---

## 2. Thống kê tổng quan (Transaction Stats)

### Mô tả

Phần đầu trang hiển thị 5 thẻ thống kê: Tổng giao dịch, Thành công, Đang xử lý, Thất bại, Tổng doanh thu (chỉ tính `completed`).

### Trạng thái hiện tại

- [x] Tính toán client-side từ toàn bộ `MOCK_TRANSACTIONS` — không fetch riêng.

### Đề xuất API — Thống kê giao dịch

| Field    | Giá trị                          |
| -------- | -------------------------------- |
| Method   | GET                              |
| Endpoint | `/api/admin/transactions/stats`  |
| Auth     | Bearer Token (JWT) — role: admin |

**Response mong muốn:**

```json
{
  "success": true,
  "data": {
    "total": 150,
    "completed": 110,
    "pending": 25,
    "failed": 15,
    "totalRevenue": 45670000
  }
}
```

### Ghi chú

- `totalRevenue` chỉ tính các giao dịch có `status === 'completed'`
- [UNKNOWN - cần BE xác nhận] Có thể gộp thống kê vào response của `/api/admin/transactions` thay vì endpoint riêng không?

---

## 3. Chi tiết giao dịch (Transaction Detail)

### Mô tả

Khi admin nhấn nút "Chi tiết", một modal hiển thị toàn bộ thông tin của giao dịch đó. Dữ liệu lấy từ item đã có trong danh sách (không fetch thêm).

### Trạng thái hiện tại

- [x] Lấy từ object đã có trong client state — không có API call riêng.

### Đề xuất API — Lấy chi tiết một giao dịch (optional, nếu cần dữ liệu đầy đủ hơn)

| Field    | Giá trị                                  |
| -------- | ---------------------------------------- |
| Method   | GET                                      |
| Endpoint | `/api/admin/transactions/:transactionId` |
| Auth     | Bearer Token (JWT) — role: admin         |

**Path param:**

```
transactionId   string   ID của giao dịch
```

**Response mong muốn:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "userId": "string",
    "userName": "string",
    "userEmail": "string",
    "planName": "string",
    "amount": 99000,
    "status": "completed",
    "paymentMethod": "payos",
    "orderCode": "string",
    "createdAt": "2026-04-11T08:23:11Z"
  }
}
```

### Ghi chú

- FE hiện tại **không** gọi API riêng cho detail — dùng lại data từ list. Endpoint này chỉ cần thiết nếu modal cần hiển thị thêm thông tin không có trong list (ví dụ: lịch sử retry, log PayOS...).
- [UNKNOWN - cần BE xác nhận] Giao dịch có thêm trường nào ngoài những gì FE đang hiển thị không?

---

## 4. Xuất CSV (Export CSV)

### Mô tả

Button "📥 Xuất CSV" trên header — hiện tại là button tĩnh, chưa có xử lý.

### Trạng thái hiện tại

- [x] Chưa có logic — button render nhưng `onClick` chưa được implement.

### Đề xuất API — Export giao dịch ra CSV

| Field    | Giá trị                          |
| -------- | -------------------------------- |
| Method   | GET                              |
| Endpoint | `/api/admin/transactions/export` |
| Auth     | Bearer Token (JWT) — role: admin |

**Query params:** (tương tự list — để export theo filter hiện tại)

```
status      string    optional
search      string    optional
```

**Response:**

- Content-Type: `text/csv`
- FE sẽ trigger download bằng Blob URL

### Ghi chú

- [UNKNOWN - cần BE xác nhận] BE export server-side hay FE tự convert JSON → CSV client-side?

---

## 5. "Làm mới" Button

### Mô tả

Button "🔄 Làm mới" trên header — hiện tại là button tĩnh, chưa có xử lý.

### Trạng thái hiện tại

- [x] Chưa có logic — sẽ re-fetch `/api/admin/transactions` và `/api/admin/transactions/stats`.

### Ghi chú

- Không cần endpoint riêng — chỉ cần trigger lại các call đã có ở mục 1 và 2.

---

## FE Review — BE Contract (Vòng 1)

### Kết quả checklist

- [x] URL và method khớp nhu cầu FE
- [x] Auth header rõ ràng (`Authorization: Bearer <JWT>`)
- [x] Response shape đủ field FE cần hiển thị
- [x] Pagination structure rõ ràng (`items`, `totalItems`, `totalPages`, `currentPage`)
- [x] Không có breaking change blocker cho UI hiện tại
- [ ] Error code dạng string theo spec FE ban đầu

### Issues cần BE giải quyết

#### Issue #1

- **Feature:** Admin Transactions (all endpoints)
- **Vấn đề:** BE trả lỗi theo `code: number` thay vì error code string semantic (`TOKEN_INVALID`, `TRANSACTION_NOT_FOUND`...)
- **Yêu cầu:** Cân nhắc bổ sung thêm field string (ví dụ `error`) để FE map message ổn định theo business case
- **Mức độ:** 🟡 Minor (FE hiện đã fallback theo `message` + HTTP status)

#### Issue #2

- **Feature:** Transaction List / Detail
- **Vấn đề:** `orderCode` từ BE đang trả numeric, trong spec FE ban đầu mô tả dạng string
- **Yêu cầu:** Xác nhận contract chính thức cho `orderCode` (string hoặc number) để cố định kiểu dữ liệu
- **Mức độ:** 🟡 Minor (FE đã xử lý an toàn kiểu `string | number`)

---

## Tracking — Trạng thái tích hợp

| Feature            | Vòng | Trạng thái FE | Ghi chú                                                                     |
| ------------------ | ---- | ------------- | --------------------------------------------------------------------------- |
| Transaction List   | 1    | ✅ Done       | Đã tích hợp `GET /admin/transactions`, filter/search/pagination server-side |
| Transaction Stats  | 1    | ✅ Done       | Đã tích hợp `GET /admin/transactions/stats`                                 |
| Transaction Detail | 1    | ✅ Done       | Đã tích hợp `GET /admin/transactions/{transactionId}` khi bấm "Chi tiết"    |
| Export CSV         | 1    | ✅ Done       | Đã tích hợp `GET /admin/transactions/export`, tải file bằng Blob            |
| Refresh Action     | 1    | ✅ Done       | Re-fetch list + stats                                                       |

---

## FE Integration Notes (Vòng 1)

- Đã xóa toàn bộ mock data khỏi [src/pages/admin/AdminTransactions.tsx](src/pages/admin/AdminTransactions.tsx)
- Đã chuyển sang endpoint thật theo BE contract: `/admin/...` (không dùng prefix `/api` ở endpoint path)
- Đã mapping response wrapper từ `success/data` sang `code/result`
- Đã thêm đầy đủ state: `loading`, `error`, `empty`, `success`
- Đã dùng token từ `AuthService.getToken()` (không hardcode token)
