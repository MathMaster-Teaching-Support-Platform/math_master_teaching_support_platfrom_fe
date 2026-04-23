# Course Billing Flow - Quick Reference Card

## 🚀 Quick Start

### Backend Status: ✅ 100% COMPLETE
### Frontend Status: 🚧 Ready to Implement

---

## 📋 Implementation Checklist

### Backend (All Done ✅)
- [x] Database migration script
- [x] Order entity & repository
- [x] RefundRequest entity & repository
- [x] OrderService & implementation
- [x] RefundService & implementation
- [x] OrderController (7 endpoints)
- [x] RefundController (7 endpoints)
- [x] OrderExpiryJob (scheduled)
- [x] Error codes (14 new)
- [x] Type definitions (frontend)
- [x] API services (frontend)

### Frontend (To Do 📝)
- [ ] CourseOrderSummary page
- [ ] PaymentSuccess page
- [ ] OrderHistory page
- [ ] OrderDetails page
- [ ] RefundRequest page
- [ ] RefundHistory page
- [ ] AdminRefundManagement page
- [ ] Update CoursePreview component
- [ ] Add routes

---

## 🔗 Key Files

### Backend
```
OrderServiceImpl.java          - Order business logic (500+ lines)
RefundServiceImpl.java          - Refund business logic (600+ lines)
OrderController.java            - Order REST API
RefundController.java           - Refund REST API
OrderExpiryJob.java             - Scheduled job (every 5 min)
V1__Create_Order_And_Refund_Tables.sql - Database migration
```

### Frontend
```
src/types/order.types.ts        - TypeScript types & utilities
src/services/order.service.ts   - Order API client
src/services/refund.service.ts  - Refund API client
```

### Documentation
```
COURSE_BILLING_FLOW_ANALYSIS.md              - Detailed analysis (500+ lines)
BILLING_BACKEND_IMPLEMENTATION_COMPLETE.md   - Backend summary
BILLING_FRONTEND_IMPLEMENTATION_GUIDE.md     - Frontend guide
BILLING_FLOW_COMPLETE_SUMMARY.md             - Complete summary
BILLING_QUICK_REFERENCE.md                   - This file
```

---

## 🎯 New Flow (High Level)

```
1. Student clicks "Enroll" on CoursePreview
   ↓
2. Create Order (PENDING, 15-min expiry)
   ↓
3. Navigate to Order Summary page
   ↓
4. Student reviews & clicks "Confirm Payment"
   ↓
5. Check wallet balance
   ↓
6. Process payment (PENDING → SUCCESS)
   ↓
7. Create enrollment
   ↓
8. Update order to COMPLETED
   ↓
9. Navigate to Success page
   ↓
10. Send notifications
```

---

## 📡 API Endpoints

### Order APIs
```
POST   /api/orders/courses/{courseId}           Create order
GET    /api/orders/{orderId}                    Get order
POST   /api/orders/{orderId}/confirm            Confirm order
POST   /api/orders/{orderId}/cancel             Cancel order
GET    /api/orders/my-orders                    List orders
```

### Refund APIs
```
POST   /api/refunds/orders/{orderId}            Create refund
GET    /api/refunds/my-requests                 List refunds
POST   /api/refunds/{id}/approve                Approve (admin)
POST   /api/refunds/{id}/reject                 Reject (admin)
```

---

## 🔑 Key Concepts

### Order Statuses
- **PENDING** - Awaiting confirmation (15-min expiry)
- **PROCESSING** - Payment in progress
- **COMPLETED** - Successfully completed
- **FAILED** - Payment failed
- **CANCELLED** - User cancelled or expired
- **REFUNDED** - Refund processed

### Refund Statuses
- **PENDING** - Awaiting approval
- **APPROVED** - Approved (auto or manual)
- **PROCESSING** - Refund in progress
- **COMPLETED** - Refund completed
- **REJECTED** - Rejected by admin

### Auto-Approval Rules
- ✅ Within 24 hours of enrollment
- ✅ Less than 10% course progress
- ❌ Otherwise → Manual approval

### Revenue Split
- 90% → Instructor
- 10% → Platform

---

## 💻 Code Snippets

### Create Order (Frontend)
```typescript
import orderService from '../../services/order.service';

const handleEnroll = async () => {
  try {
    const order = await orderService.createOrder(courseId);
    navigate(`/student/orders/${order.id}/summary`);
  } catch (error) {
    // Handle error
  }
};
```

### Confirm Order (Frontend)
```typescript
const handleConfirm = async () => {
  try {
    await orderService.confirmOrder(orderId);
    navigate(`/student/orders/${orderId}/success`);
  } catch (error) {
    // Handle insufficient balance, etc.
  }
};
```

### Request Refund (Frontend)
```typescript
import refundService from '../../services/refund.service';

const handleRefund = async () => {
  try {
    await refundService.createRefundRequest(orderId, { reason });
    navigate('/student/refunds');
  } catch (error) {
    // Handle error
  }
};
```

### Countdown Timer (Frontend)
```typescript
import { calculateTimeRemaining } from '../../types/order.types';

const [timeRemaining, setTimeRemaining] = useState({ minutes: 15, seconds: 0 });

useEffect(() => {
  const timer = setInterval(() => {
    const remaining = calculateTimeRemaining(order.expiresAt);
    setTimeRemaining(remaining);
    if (remaining.isExpired) {
      clearInterval(timer);
      // Handle expiry
    }
  }, 1000);
  return () => clearInterval(timer);
}, [order]);
```

---

## 🎨 UI Components Needed

### Status Badges
```typescript
<OrderStatusBadge status={order.status} />
<RefundStatusBadge status={refund.status} />
```

### Countdown Timer
```typescript
<CountdownTimer 
  expiresAt={order.expiresAt} 
  onExpire={() => handleExpiry()} 
/>
```

### Currency Formatter
```typescript
import { formatCurrency } from '../../types/order.types';

<span>{formatCurrency(order.finalPrice)}</span>
```

---

## 🧪 Testing Scenarios

### Happy Path
1. Create order → Success
2. Confirm order → Success
3. View order history → Shows order
4. Request refund (within 24h) → Auto-approved
5. View refund history → Shows refund

### Error Cases
1. Insufficient balance → Error message
2. Order expired → Cannot confirm
3. Duplicate order → Returns existing
4. Refund already requested → Error
5. Cancel non-pending order → Error

---

## 📊 Database Tables

### orders
```sql
id, student_id, course_id, enrollment_id, status,
order_number, original_price, discount_amount, final_price,
instructor_earnings, platform_commission,
expires_at, confirmed_at, cancelled_at, cancellation_reason,
created_at, updated_at, deleted_at
```

### refund_requests
```sql
id, order_id, enrollment_id, student_id, status,
reason, refund_amount, instructor_deduction, platform_deduction,
requested_at, processed_at, processed_by, admin_notes, is_auto_approved,
created_at, updated_at, deleted_at
```

---

## 🔧 Utility Functions

### TypeScript Utilities (Already Created)
```typescript
formatCurrency(amount: number): string
calculateTimeRemaining(expiresAt: string): { minutes, seconds, isExpired }
isOrderExpired(expiresAt?: string): boolean
canRequestRefund(order: Order): boolean
canCancelOrder(order: Order): boolean
getOrderStatusLabel(status: OrderStatus): string
getOrderStatusColor(status: OrderStatus): string
getRefundStatusLabel(status: RefundStatus): string
getRefundStatusColor(status: RefundStatus): string
```

---

## 🚨 Common Issues & Solutions

### Issue: Order expires too quickly
**Solution:** Countdown timer shows remaining time. User can cancel and recreate.

### Issue: Insufficient balance
**Solution:** Show balance before confirmation. Provide "Add Funds" link.

### Issue: Duplicate orders
**Solution:** Backend returns existing pending order. Frontend shows existing order.

### Issue: Refund not auto-approved
**Solution:** Show eligibility info. Explain manual approval process.

---

## 📞 Need Help?

### Backend Questions
- See: `BILLING_BACKEND_IMPLEMENTATION_COMPLETE.md`
- Check: Service implementations (OrderServiceImpl, RefundServiceImpl)

### Frontend Questions
- See: `BILLING_FRONTEND_IMPLEMENTATION_GUIDE.md`
- Check: Type definitions (`src/types/order.types.ts`)

### Business Logic Questions
- See: `COURSE_BILLING_FLOW_ANALYSIS.md`
- Check: Issues identified and recommended solutions

---

## ⏱️ Time Estimates

### Frontend Implementation
- CourseOrderSummary: 1 day
- PaymentSuccess: 0.5 day
- OrderHistory: 1 day
- OrderDetails: 0.5 day
- RefundRequest: 0.5 day
- RefundHistory: 1 day
- AdminRefundManagement: 1.5 days
- Component updates: 0.5 day
- Testing: 2 days

**Total: ~9 days (2 weeks)**

---

## 🎯 Priority Order

1. **Critical (Week 1)**
   - CourseOrderSummary
   - PaymentSuccess
   - Update CoursePreview

2. **Important (Week 2)**
   - OrderHistory
   - OrderDetails
   - RefundRequest
   - RefundHistory

3. **Admin (Week 3)**
   - AdminRefundManagement

---

## ✅ Definition of Done

- [ ] All 7 pages implemented
- [ ] CoursePreview updated
- [ ] Routes configured
- [ ] All flows tested
- [ ] Error handling complete
- [ ] Responsive design verified
- [ ] Accessibility checked
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] UAT completed
- [ ] Deployed to production

---

**Last Updated:** April 23, 2026
**Version:** 1.0
**Status:** Backend Complete ✅ | Frontend Ready 🚀
