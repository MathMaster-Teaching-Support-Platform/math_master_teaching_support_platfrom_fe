# API Spec Request — Wallet Module (StudentWallet)

**Ngày tạo:** 2026-04-17  
**Người tạo:** FE Team  
**Trạng thái:** ✅ Đã integrate (vòng 1)

---

## Tracking — Trạng thái tích hợp

| Feature                                       | Vòng | Trạng thái FE | Ghi chú                                                      |
| --------------------------------------------- | ---- | ------------- | ------------------------------------------------------------ |
| `totalDeposited` từ `GET /wallet/my-wallet`   | 1    | ✅ Done       | Xóa client-side sum, dùng `wallet.totalDeposited`            |
| `transactionCount` từ `GET /wallet/my-wallet` | 1    | ✅ Done       | Dùng `wallet.transactionCount` trong stat strip              |
| `TransactionStatus` enum                      | 1    | ✅ Done       | `SUCCESS` (không phải `COMPLETED`), `PROCESSING` mới         |
| `TransactionType` enum                        | 1    | ✅ Done       | `DEPOSIT\|WITHDRAWAL\|PAYMENT\|REFUND`                       |
| `normalizeStatus` → enum map                  | 1    | ✅ Done       | Xóa string-match, dùng `TX_STATUS_MAP`                       |
| `normalizeType` → enum check                  | 1    | ✅ Done       | So sánh `tx.type === 'DEPOSIT'` trực tiếp                    |
| Transaction list → always Page object         | 1    | ✅ Done       | Xóa double-case handler, chỉ dùng `result.content`           |
| `expiresAt` field trong `WalletTransaction`   | 1    | ✅ Done       | Thêm vào type                                                |
| `GET /payment/order/{orderCode}/status`       | 1    | ✅ Done       | Thêm `WalletService.getOrderStatus()` + polling 5s           |
| Polling sau deposit                           | 1    | ✅ Done       | Max 36 lần × 5s = 3 phút, stop khi SUCCESS/FAIL/CANCEL       |
| `paymentMethod` field                         | 1    | ✅ N/A        | BE xác nhận PayOS không expose field này — đã xóa khỏi type  |
| `cancelledAt` field                           | 1    | ✅ N/A        | BE không implement — dùng `updatedAt` khi `status=CANCELLED` |

---

## Issues còn lại — Vòng 1

Không có blocker. Các điểm cần test thủ công trên staging:

| #   | Điểm test                                                           | Mức độ              |
| --- | ------------------------------------------------------------------- | ------------------- |
| 1   | `wallet.totalDeposited` có luôn `>= wallet.balance` không?          | 🔴 Verify           |
| 2   | Polling dừng đúng khi user đóng tab thanh toán (CANCELLED sau 15p)  | 🟡 Verify           |
| 3   | `expiresAt` có trả về null đúng cho giao dịch SUCCESS/FAILED không? | 🟡 Verify           |
| 4   | Seed ≥5 giao dịch SUCCESS để verify stat strip hiển thị đúng        | 🟡 Cần BE seed data |

---

## 1. Tổng số tiền đã nạp (Lifetime total deposit)

### Mô tả

Stat strip hiển thị **"Tổng đã nạp"** — tổng tích lũy toàn bộ giao dịch nạp tiền thành công từ trước đến nay của user.

### Trạng thái hiện tại

- [x] FE tự tính bằng cách sum `amount` từ danh sách giao dịch đã tải về — **sai**, vì bị giới hạn bởi `size` của API phân trang.

### Vấn đề hiện tại

```ts
// FE đang tính sai: chỉ sum trên 10 tx vừa fetch
const totalDeposit = transactions
  .filter((tx) => normalizeType(tx) === 'deposit' && normalizeStatus(tx.status) === 'completed')
  .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
```

- `API_FETCH_SIZE = 10` → nếu user có 20 giao dịch, chỉ tính 10 gần nhất → số sai
- `totalDeposit` phải luôn `>= wallet.balance` nhưng thực tế đang nhỏ hơn

### Đề xuất API

| Field    | Giá trị            |
| -------- | ------------------ |
| Method   | GET                |
| Endpoint | `/wallet/summary`  |
| Auth     | Bearer Token (JWT) |

**Response mong muốn:**

```json
{
  "code": 1000,
  "result": {
    "balance": 31000,
    "totalDeposited": 50000,
    "totalSpent": 19000,
    "transactionCount": 5
  }
}
```

**Hoặc**, nếu không muốn tạo endpoint mới, bổ sung các field vào response của `GET /wallet/my-wallet`:

```json
{
  "code": 1000,
  "result": {
    "walletId": "...",
    "balance": 31000,
    "totalDeposited": 50000,
    "totalSpent": 19000,
    "transactionCount": 5,
    "status": "ACTIVE",
    "currency": "VND",
    "updatedAt": "..."
  }
}
```

### Validation FE đang áp dụng

- Hiển thị `—` khi đang loading
- Format số theo `vi-VN` (dấu chấm ngàn)

### Ghi chú

- `totalDeposited` chỉ tính giao dịch `type=DEPOSIT` và `status=COMPLETED`
- **Không phụ thuộc phân trang**, phải là con số tổng tất cả thời gian

---

## 2. Transaction Status — Enum & Auto-cancel sau 15 phút

### Mô tả

FE đang tự `normalize` status bằng string-matching (`includes('pending')`, `includes('fail')`) vì không biết chính xác các giá trị BE trả về.

### Trạng thái hiện tại

- [x] FE dùng string-matching thay vì so sánh enum chính xác — dễ bị sai nếu BE thêm giá trị mới
- [ ] FE chưa xử lý trạng thái "tự động cancel sau 15 phút"

### Code hiện tại

```ts
const normalizeStatus = (status?: string): 'completed' | 'pending' | 'failed' => {
  const normalized = (status || '').toLowerCase();
  if (normalized.includes('pending') || normalized.includes('wait')) return 'pending';
  if (normalized.includes('fail') || normalized.includes('cancel')) return 'failed';
  return 'completed';
};
```

### Câu hỏi cho BE

1. **Enum chính xác của `WalletTransaction.status` là gì?**  
   Hiện FE đang giả sử: `PENDING`, `COMPLETED`, `FAILED`, `CANCELLED` — cần xác nhận.

2. **Giao dịch tự động bị cancel sau 15 phút** — BE xử lý ở đâu?
   - BE có job/scheduler tự đổi status `PENDING → CANCELLED` sau 15 phút không?
   - Hay FE cần tự poll/check thời gian tạo và hiển thị "Đã hết hạn"?

3. **`CANCELLED` vs `FAILED` có phân biệt không?**
   - `CANCELLED` = user/timeout chủ động hủy
   - `FAILED` = lỗi thanh toán từ cổng

### Đề xuất

BE cung cấp enum rõ ràng để FE update type:

```ts
// Mong muốn FE được dùng:
type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
```

Và FE sẽ map:

```ts
const STATUS_MAP: Record<TransactionStatus, 'pending' | 'completed' | 'failed'> = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'failed', // hoặc tách riêng nếu cần
};
```

### Ghi chú

- Nếu có status `EXPIRED` (hết hạn 15 phút) riêng → FE cần biết để hiển thị label "Hết hạn" thay vì "Thất bại"
- FE muốn hiển thị **countdown** trong tab giao dịch pending nếu BE trả `expiresAt` trong response

---

## 3. Transaction List — Phân trang và tổng số

### Mô tả

FE gọi `GET /wallet/transactions?page=0&size=10` nhưng response không rõ có trả `totalElements` hay không. Dẫn đến:

- Không biết tổng số giao dịch thật
- Không render được đúng số trang

### Trạng thái hiện tại

- [x] `API_FETCH_SIZE = 10` — hardcode, chỉ lấy 1 page
- [ ] FE chưa implement load-more / infinite scroll do không chắc response shape

### Response hiện tại (FE đang handle)

```ts
// FE đang xử lý cả 2 trường hợp vì không chắc BE trả dạng nào:
const list = Array.isArray(result)
  ? result
  : 'content' in result && Array.isArray(result.content)
    ? result.content
    : [];
```

### Câu hỏi cho BE

- `GET /wallet/transactions` trả về **array** hay **Page object** (`{ content, page: { totalElements, totalPages } }`)?
- Có thể **luôn** trả Page object để FE không phải handle 2 case không?

### Đề xuất Response chuẩn

```json
{
  "code": 1000,
  "result": {
    "content": [
      /* array of WalletTransaction */
    ],
    "page": {
      "size": 10,
      "number": 0,
      "totalElements": 23,
      "totalPages": 3
    }
  }
}
```

### Ghi chú

- Cần `totalElements` để hiển thị đúng "Hiển thị X–Y / Z giao dịch"
- `GET /wallet/transactions/status/{status}` cũng cần cùng format

---

## 4. WalletTransaction — Fields còn thiếu

### Câu hỏi cho BE

Các field FE cần nhưng không chắc BE có trả không:

| Field           | Mục đích FE                      | Hiện tại                                      |
| --------------- | -------------------------------- | --------------------------------------------- |
| `type`          | Phân biệt `DEPOSIT` vs `PAYMENT` | FE dùng string-match + fallback `amount >= 0` |
| `orderCode`     | Mã hiển thị cho user             | Có trong type nhưng chưa chắc luôn có         |
| `expiresAt`     | Countdown 15 phút cho PENDING    | **Chưa có trong type**                        |
| `cancelledAt`   | Thời điểm bị cancel/hết hạn      | **Chưa có trong type**                        |
| `paymentMethod` | Hiển thị trong chi tiết          | Có trong type                                 |

### Đề xuất WalletTransaction shape đầy đủ

```ts
interface WalletTransaction {
  id: string;
  orderCode: number;
  walletId: string;
  type: 'DEPOSIT' | 'PAYMENT' | 'REFUND'; // enum rõ ràng
  amount: number; // luôn dương
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  description?: string;
  paymentMethod?: string;
  createdAt: string; // ISO 8601
  expiresAt?: string; // ISO 8601, cho PENDING 15 phút
  updatedAt?: string;
}
```

---

## 5. Deposit — Response sau khi tạo link thanh toán

### Trạng thái hiện tại

`POST /payment/deposit` → FE nhận `checkoutUrl` và mở tab mới, không biết khi nào user hoàn thành thanh toán.

### Câu hỏi cho BE

- Có **webhook** hay **polling endpoint** nào để FE check trạng thái sau khi user quay lại không?
- Sau khi PayOS callback, BE có push notification / websocket về FE không?

### Ghi chú

- Hiện FE chỉ `setTimeout(3s)` rồi reload transactions — có thể miss nếu user thanh toán chậm
- Lý tưởng: `GET /payment/order/{orderCode}/status` để FE poll mỗi 5s

---

## Tóm tắt các điểm cần BE xác nhận

| #   | Câu hỏi                                                           | Ưu tiên       |
| --- | ----------------------------------------------------------------- | ------------- |
| 1   | `GET /wallet/my-wallet` hoặc endpoint mới trả `totalDeposited`    | 🔴 Cao        |
| 2   | Enum đầy đủ của `TransactionStatus`                               | 🔴 Cao        |
| 3   | BE có tự cancel PENDING sau 15 phút không, trả `expiresAt` không? | 🔴 Cao        |
| 4   | Response của `/wallet/transactions` là array hay Page object?     | 🟡 Trung bình |
| 5   | `WalletTransaction.type` là enum gì?                              | 🟡 Trung bình |
| 6   | Có endpoint poll trạng thái đơn thanh toán không?                 | 🟢 Thấp       |
