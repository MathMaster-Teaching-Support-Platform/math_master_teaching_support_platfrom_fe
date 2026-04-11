# API Contract — SubscriptionManagement (Quản Lý Gói Đăng Ký)

**Ngày tạo:** 2026-04-11  
**Cập nhật:** 2026-04-11 (BE phản hồi — đã merge)  
**Người tạo:** FE Team → BE Team confirm  
**Trạng thái:** ✅ Đã confirm — sẵn sàng integrate

> **Base URL:** `http://<host>`  
> ⚠️ Không có prefix `/api/` — tất cả admin endpoint bắt đầu từ `/admin/...`  
> **Response wrapper:** Tất cả response wrap bởi `ApiResponse<T>`:
>
> ```json
> { "code": 1000, "message": null, "result": <data> }
> ```
>
> - `code: 1000` = thành công; không có field `success` hay `data` — FE đọc từ `result`
>
> **3 gói** căn chỉnh với `Pricing.tsx` (trang public):
>
> - **Miễn phí** — 0đ / forever
> - **Giáo viên** — 199,000đ/tháng
> - **Trường học** — `price: null` → hiển thị "Liên hệ"

---

## 1. Danh sách gói đăng ký (Subscription Plans List)

### Mô tả

Hiển thị 3 plan card trong mục "Các gói đăng ký" — mỗi card có: tên gói, giá, mô tả, số người dùng đang active, doanh thu tháng, % tăng trưởng, danh sách tính năng.

### Endpoint

```
GET /admin/subscription-plans
```

**Auth:** `Authorization: Bearer <JWT>` — role `ADMIN`  
**Request params:** không — trả toàn bộ, sắp xếp `createdAt ASC`, không phân trang

### Response — 200 OK

```json
{
  "code": 1000,
  "result": [
    {
      "id": "018f1a2b-0000-7000-8000-000000000001",
      "name": "Miễn phí",
      "slug": "mien-phi",
      "price": 0,
      "currency": "VND",
      "billingCycle": "FOREVER",
      "description": "Phù hợp để trải nghiệm",
      "featured": false,
      "isPublic": true,
      "status": "ACTIVE",
      "features": [
        "Tạo tối đa 10 bài giảng/tháng",
        "Lưu trữ 100MB",
        "Quản lý 1 lớp học",
        "AI trợ lý cơ bản",
        "Hỗ trợ email"
      ],
      "stats": { "activeUsers": 1250, "revenueThisMonth": 0, "growthPercent": 0.0 },
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2026-04-01T00:00:00Z"
    },
    {
      "id": "018f1a2b-0000-7000-8000-000000000002",
      "name": "Giáo viên",
      "slug": "giao-vien",
      "price": 199000,
      "currency": "VND",
      "billingCycle": "MONTH",
      "description": "Dành cho giáo viên cá nhân",
      "featured": true,
      "isPublic": true,
      "status": "ACTIVE",
      "features": [
        "Tạo không giới hạn bài giảng",
        "Lưu trữ 10GB",
        "Quản lý không giới hạn lớp học",
        "AI trợ lý nâng cao",
        "Hỗ trợ ưu tiên"
      ],
      "stats": { "activeUsers": 450, "revenueThisMonth": 89550000, "growthPercent": 12.3 },
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2026-04-01T00:00:00Z"
    },
    {
      "id": "018f1a2b-0000-7000-8000-000000000003",
      "name": "Trường học",
      "slug": "truong-hoc",
      "price": null,
      "currency": "VND",
      "billingCycle": "CUSTOM",
      "description": "Giải pháp cho tổ chức",
      "featured": false,
      "isPublic": true,
      "status": "ACTIVE",
      "features": [
        "Tất cả tính năng gói Giáo viên",
        "Không giới hạn tài khoản",
        "Lưu trữ không giới hạn"
      ],
      "stats": { "activeUsers": 30, "revenueThisMonth": 150000000, "growthPercent": 8.0 },
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2026-04-01T00:00:00Z"
    }
  ]
}
```

### Response — Lỗi

```json
{ "code": 1006, "message": "Unauthenticated" }      // 401
{ "code": 1007, "message": "You do not have permission" } // 403
```

### Ghi chú FE integrate

- `price === null` → hiển thị "Liên hệ" ✅ (confirmed — không có field `contactSales`)
- `featured: true` (**không phải** `isFeatured`) → render badge "⭐ Phổ biến nhất" + border highlight
- `billingCycle` là **ENUM uppercase**: `FOREVER` | `MONTH` | `THREE_MONTHS` | `SIX_MONTHS` | `YEAR` | `CUSTOM`
- `stats` tính real-time từ bảng `user_subscriptions` (không phải `transactions`)
- `features.length > 5` → chỉ hiển thị 5 đầu, còn lại "+N tính năng khác"
- `stats.growthPercent` so với tháng trước, có thể âm

---

## 2. Tạo gói đăng ký mới (Create Plan)

### Mô tả

Modal "Tạo gói đăng ký mới" — admin nhập tên, mô tả, giá, thời hạn, danh sách tính năng, đánh dấu nổi bật / hiển thị public.

### Endpoint

```
POST /admin/subscription-plans
```

**Auth:** `Authorization: Bearer <JWT>` — role `ADMIN`

### Request Body

```json
{
  "name": "Giáo viên Pro",
  "description": "Dành cho giáo viên nâng cao",
  "price": 299000,
  "billingCycle": "MONTH",
  "features": ["Tạo không giới hạn bài giảng", "Lưu trữ 50GB"],
  "featured": false,
  "isPublic": true
}
```

| Field          | Type                      | Bắt buộc | Mô tả                                                                        |
| -------------- | ------------------------- | -------- | ---------------------------------------------------------------------------- |
| `name`         | string                    | ✅       | Không rỗng; slug tự động sinh từ đây (FE không cần gửi slug)                 |
| `description`  | string                    | ❌       |                                                                              |
| `price`        | number (>= 0) hoặc `null` | ❌       | `null` = enterprise/liên hệ; `0` = miễn phí                                  |
| `billingCycle` | enum string               | ✅       | `FOREVER` \| `MONTH` \| `THREE_MONTHS` \| `SIX_MONTHS` \| `YEAR` \| `CUSTOM` |
| `features`     | string[]                  | ✅       | Ít nhất 1 phần tử không rỗng                                                 |
| `featured`     | boolean                   | ❌       | Default `false`                                                              |
| `isPublic`     | boolean                   | ❌       | Default `true`                                                               |

### Response — 201 Created

```json
{
  "code": 1000,
  "result": {
    "id": "018f1a2b-xxxx-7000-8000-xxxxxxxxxxxx",
    "name": "Giáo viên Pro",
    "slug": "giao-vien-pro",
    "price": 299000,
    "currency": "VND",
    "billingCycle": "MONTH",
    "description": "Dành cho giáo viên nâng cao",
    "featured": false,
    "isPublic": true,
    "status": "ACTIVE",
    "features": ["Tạo không giới hạn bài giảng", "Lưu trữ 50GB"],
    "stats": { "activeUsers": 0, "revenueThisMonth": 0, "growthPercent": 0.0 },
    "createdAt": "2026-04-11T10:00:00Z",
    "updatedAt": "2026-04-11T10:00:00Z"
  }
}
```

### Response — Lỗi

```json
{ "code": 1155, "message": "A plan with this slug already exists" } // 400 - tên trùng slug
{ "code": 1001, "message": "features: At least one feature is required" } // 400 - validation
```

### Ghi chú FE integrate

- ✅ **BE tự sinh `slug`** từ `name` (chuẩn hóa Unicode → bỏ dấu → lowercase → spaces→`-`)
- FE validate trước khi submit: `name` không rỗng, `billingCycle` là enum hợp lệ, `features` ≥ 1 dòng
- Form textarea features: split theo `\n`, filter dòng rỗng trước khi gửi
- Sau khi 201 → đóng modal, refetch `GET /admin/subscription-plans`
- Lỗi `code: 1155` → báo user "Tên gói đã tồn tại, vui lòng chọn tên khác"

---

## 3. Cập nhật gói đăng ký (Update Plan)

### Mô tả

Nút "✏️ Chỉnh sửa" trong plan card / modal chi tiết, và "💰 Thay đổi giá". Hiện chưa có form edit và fetch.

### Endpoint

```
PUT /admin/subscription-plans/:planId
```

**Auth:** `Authorization: Bearer <JWT>` — role `ADMIN`  
**Path param:** `planId` — UUID v7

### Request Body (partial — chỉ gửi field thay đổi)

```json
{
  "name": "Giáo viên",
  "description": "Mô tả mới",
  "price": 249000,
  "billingCycle": "MONTH",
  "features": ["Feature A", "Feature B"],
  "featured": true,
  "isPublic": true,
  "status": "ACTIVE"
}
```

| Field          | Type                       | Bắt buộc | Mô tả                                |
| -------------- | -------------------------- | -------- | ------------------------------------ |
| `name`         | string (not blank)         | ✅       | Nếu gửi → slug được tái sinh tự động |
| `description`  | string                     | ❌       |                                      |
| `price`        | number (>= 0) hoặc `null`  | ❌       |                                      |
| `billingCycle` | enum string                | ❌       |                                      |
| `features`     | string[]                   | ❌       | Nếu gửi phải có ít nhất 1 phần tử    |
| `featured`     | boolean                    | ❌       |                                      |
| `isPublic`     | boolean                    | ❌       |                                      |
| `status`       | `"ACTIVE"` \| `"INACTIVE"` | ❌       | Dùng để deactivate plan              |

### Response — 200 OK

Trả về plan object đã cập nhật, shape giống item trong `GET /admin/subscription-plans`.

### Response — Lỗi

```json
{ "code": 1154, "message": "Subscription plan not found" }       // 404
{ "code": 1155, "message": "A plan with this slug already exists" } // 400
```

### Ghi chú FE integrate

- ✅ **Thay đổi giá khi có user active được phép** — giá mới chỉ áp cho subscription mới; user cũ giữ `amount` đã ghi
- Để vô hiệu hoá plan không xoá: gửi `{ "name": <tên hiện tại>, "status": "INACTIVE" }`

---

## 4. Xóa gói đăng ký (Delete Plan)

### Mô tả

Nút "🗑️ Xóa gói" trong modal chi tiết.

### Endpoint

```
DELETE /admin/subscription-plans/:planId
```

**Auth:** `Authorization: Bearer <JWT>` — role `ADMIN`  
**Path param:** `planId` — UUID v7

### Response — 200 OK

```json
{ "code": 1000, "message": "Plan deleted successfully" }
```

### Response — Lỗi

```json
{ "code": 1154, "message": "Subscription plan not found" }  // 404
{ "code": 1156, "message": "Cannot delete a plan that has active subscribers. Deactivate the plan instead." } // 400
```

### Ghi chú FE integrate

- ✅ **Không cho xóa khi còn active subscribers** → 400 `code: 1156`
- Flow khi user muốn xoá: `PUT { status: "INACTIVE" }` trước → sau khi hết hạn toàn bộ → mới DELETE được
- Xóa là **soft-delete** (`deletedAt` được set) — dữ liệu vẫn tồn tại trong DB
- FE cần hiển thị confirm dialog trước khi gọi DELETE; nếu 400 → hiển thị hướng dẫn deactivate thay thế

---

## 5. Thống kê doanh thu tổng (Revenue Stats)

### Mô tả

4 stat card ở đầu trang: tổng doanh thu, người dùng trả phí, doanh thu TB/người, tỷ lệ chuyển đổi.

### Endpoint

```
GET /admin/subscription-plans/stats
```

**Auth:** `Authorization: Bearer <JWT>` — role `ADMIN`

### Query Params

| Param   | Type   | Bắt buộc | Mô tả                                                                                                             |
| ------- | ------ | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `month` | string | ❌       | Format `YYYY-MM`, mặc định tháng hiện tại (UTC). ⚠️ Không có `compareWith` — BE luôn so sánh với tháng liền trước |

### Response — 200 OK

```json
{
  "code": 1000,
  "result": {
    "totalRevenue": 239550000,
    "totalRevenueTrend": 12.5,
    "totalPaidUsers": 480,
    "totalPaidUsersTrend": 8.3,
    "avgRevenuePerUser": 498854,
    "avgRevenuePerUserTrend": 4.2,
    "conversionRate": 23.5,
    "conversionRateTrend": 1.2,
    "period": "2026-04"
  }
}
```

### Ghi chú FE integrate

- ✅ **Period mặc định** = tháng hiện tại UTC (calendar month, không phải rolling 30 ngày)
- `trend > 0` → class `positive` (màu xanh); `trend < 0` → class `negative` (màu đỏ)
- ⚠️ `month` sai format → BE trả 500 (parse exception) — FE phải validate `YYYY-MM` trước khi gửi
- `conversionRate` = (tổng active paid users mọi thời gian) / (tổng users) × 100
- `totalRevenue` = tổng amount UserSubscription `status=ACTIVE` tạo trong tháng

---

## 6. Danh sách đăng ký gần đây (Recent Subscriptions Table)

### Mô tả

Bảng gần đây: user info, gói, ngày đăng ký / hết hạn, số tiền, trạng thái, action gia hạn / chi tiết.

### Endpoint

```
GET /admin/subscription-plans/subscriptions
```

> ⚠️ **Thay đổi so với FE đề xuất**: FE đề xuất `/api/admin/subscriptions` → BE dùng `/admin/subscription-plans/subscriptions`

**Auth:** `Authorization: Bearer <JWT>` — role `ADMIN`

### Query Params

| Param    | Type   | Bắt buộc | Mô tả                                                                                              |
| -------- | ------ | -------- | -------------------------------------------------------------------------------------------------- |
| `page`   | number | ❌       | **0-indexed** (mặc định `0`) ⚠️ khác FE đề xuất 1-indexed                                          |
| `size`   | number | ❌       | Mặc định `10` ⚠️ tên là `size` không phải `limit`                                                  |
| `status` | string | ❌       | `"ACTIVE"` \| `"EXPIRED"` \| `"CANCELLED"` \| `"all"` — case-insensitive; không truyền = không lọc |
| `planId` | UUID   | ❌       | Lọc theo plan                                                                                      |
| `sortBy` | string | ❌       | Mặc định `"createdAt"`                                                                             |
| `order`  | string | ❌       | `"ASC"` \| `"DESC"`, mặc định `"DESC"`                                                             |

### Response — 200 OK

```json
{
  "code": 1000,
  "result": {
    "content": [
      {
        "id": "018f1a2b-xxxx-7000-8000-xxxxxxxxxxxx",
        "user": {
          "id": "018f0001-xxxx-7000-8000-xxxxxxxxxxxx",
          "name": "Nguyễn Văn A",
          "email": "nguyenvana@example.com",
          "avatarInitial": "N"
        },
        "plan": {
          "id": "018f1a2b-0000-7000-8000-000000000002",
          "name": "Giáo viên",
          "slug": "giao-vien"
        },
        "startDate": "2026-03-05T00:00:00Z",
        "endDate": "2026-04-05T00:00:00Z",
        "amount": 199000,
        "currency": "VND",
        "status": "ACTIVE",
        "paymentMethod": "payos",
        "createdAt": "2026-03-05T10:00:00Z"
      }
    ],
    "pageable": { "pageNumber": 0, "pageSize": 10 },
    "totalElements": 150,
    "totalPages": 15,
    "first": true,
    "last": false
  }
}
```

> ⚠️ **Pagination shape khác FE đề xuất** (Spring Data `Page<T>`):
>
> - `content` thay vì `items`
> - `totalElements` thay vì `total`
> - `pageable.pageNumber` (0-indexed) thay vì `pagination.page` (1-indexed)
> - FE cần map: `currentPage = result.pageable.pageNumber + 1`

### Response — Lỗi

```json
// 400 — status không hợp lệ (case-insensitive nhưng phải đúng enum name)
{ "code": 9999, "message": "No enum constant ...UserSubscriptionStatus.INVALID" }
```

### Ghi chú FE integrate

- `status` trong response là **ENUM uppercase**: `ACTIVE` | `EXPIRED` | `CANCELLED`
- CSS class mapping: `plan.slug === "mien-phi"` → `plan-badge.free`; `"giao-vien"` → xem lại vì CSS hiện dùng `.pro`; `"truong-hoc"` → `.enterprise` — cần điều chỉnh class map theo `slug`
- ✅ **Action "👁️ Chi tiết"**: Không cần API riêng — dữ liệu đã đủ trong row, FE hiển thị modal từ data có sẵn
- ⏳ **Action "🔄 Gia hạn"**: Endpoint `POST /admin/subscription-plans/subscriptions/:id/renew` **chưa có trong sprint này** — ghi vào backlog, tạm thời disable nút

---

## Bảng thay đổi so với FE spec ban đầu

| Feature                        | FE đề xuất                                    | BE thực tế                                                         |
| ------------------------------ | --------------------------------------------- | ------------------------------------------------------------------ |
| Base path                      | `/api/admin/...`                              | `/admin/...` (không có `/api/`)                                    |
| Response wrapper               | `{ success, data }`                           | `{ code: 1000, result }` — đọc từ `result`                         |
| Recent subs endpoint           | `/api/admin/subscriptions`                    | `/admin/subscription-plans/subscriptions`                          |
| Pagination param               | `page` (1-indexed), `limit`                   | `page` (0-indexed), `size`                                         |
| Pagination response            | `items`, `total`, `pagination.page`           | `content`, `totalElements`, `pageable.pageNumber`                  |
| `billingCycle` values          | `"month"`, `"3months"`, `"6months"`, `"year"` | `MONTH`, `THREE_MONTHS`, `SIX_MONTHS`, `YEAR`, `FOREVER`, `CUSTOM` |
| `isFeatured` field             | `isFeatured`                                  | `featured` (tên khác)                                              |
| `price: null` cho enterprise   | [UNKNOWN]                                     | ✅ Dùng `price: null` — không có `contactSales`                    |
| Slug generation                | [UNKNOWN]                                     | ✅ BE tự sinh từ `name`                                            |
| Thay đổi giá khi có subscriber | [UNKNOWN]                                     | ✅ Cho phép — áp dụng cho subscription mới                         |
| Xóa plan có active subscribers | [UNKNOWN]                                     | ❌ 400 `code: 1156` — phải deactivate trước                        |
| `compareWith` param (stats)    | Có                                            | Không có — luôn so với tháng liền trước                            |
| Period stats mặc định          | [UNKNOWN]                                     | ✅ Tháng hiện tại UTC                                              |
| Endpoint gia hạn               | [UNKNOWN]                                     | ⏳ Chưa có — backlog                                               |
| API chi tiết subscription      | [UNKNOWN]                                     | ✅ Không cần — dùng data trong row                                 |

---

## Tracking — Trạng thái tích hợp (Vòng 1)

**Cập nhật:** 2026-04-11 — FE Dev hoàn tất vòng 1

| Feature                    | Vòng | Trạng thái FE | Ghi chú                                                                                    |
| -------------------------- | ---- | ------------- | ------------------------------------------------------------------------------------------ |
| Danh sách gói              | 1    | ✅ Done       | `getPlans()` — loading / error / empty states đủ                                           |
| Tạo gói mới                | 1    | ✅ Done       | Form đầy đủ (tên, mô tả, giá/liên hệ, billingCycle, features, flags), error `1155` handled |
| Cập nhật gói               | 1    | ⚠️ Partial    | Service method `updatePlan()` sẵn sàng, modal UI chỉnh sửa chưa implement                  |
| Xóa gói                    | 1    | ✅ Done       | `confirm()` dialog + error `1156` hiển thị thông báo rõ ràng                               |
| Thống kê doanh thu         | 1    | ✅ Done       | `getStats()` — 4 metric cards với trend; lỗi non-blocking (stats null)                     |
| Recent Subscriptions table | 1    | ✅ Done       | `getSubscriptions()` — real data, pagination 0-indexed mapped, empty state                 |
| Plan badge CSS mapping     | 1    | ✅ Done       | `planSlugToBadgeClass()` map `mien-phi→free`, `giao-vien→pro`, `truong-hoc→enterprise`     |
| Gia hạn subscription       | —    | ⏳ Backlog    | Endpoint chưa có từ BE — nút 🔄 disabled với `title="Tính năng đang phát triển"`           |
| `price: null` → "Liên hệ"  | 1    | ✅ Done       | `formatPrice()` util xử lý `null`                                                          |
| `featured` badge           | 1    | ✅ Done       | Dùng `plan.featured` thay vì `plan.name === 'Pro'`                                         |

### Files thay đổi (Vòng 1)

- `src/config/api.config.ts` — thêm 4 endpoints mới
- `src/services/api/subscription-plan.service.ts` — tạo mới: types + service methods + utils
- `src/pages/admin/SubscriptionManagement.tsx` — rewrite hoàn toàn: bỏ mọi mock data, tích hợp API thật
