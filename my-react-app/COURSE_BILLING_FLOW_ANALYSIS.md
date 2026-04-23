# Course Billing Flow - Comprehensive Analysis & Recommendations

**Date:** April 23, 2026  
**Status:** 🔍 ANALYSIS COMPLETE

---

## Current Implementation Analysis

### 📊 Current Flow Overview

```
Student → Course Preview → Click "Mua ngay" → Enrollment Service
                                                      ↓
                                            Check Wallet Balance
                                                      ↓
                                            Deduct Full Amount
                                                      ↓
                                            Split Payment (90/10)
                                                      ↓
                                            Create Enrollment (ACTIVE)
                                                      ↓
                                            Send Notifications
```

### 🔍 Current Implementation Details

#### Backend (`EnrollmentServiceImpl.java`)

**Enrollment Flow:**
1. **Idempotency Check:** Prevents duplicate enrollments
2. **PENDING Status:** Creates enrollment record immediately
3. **Payment Processing:**
   - Calculates active price (original or discounted)
   - Deducts from student wallet
   - Splits 90% to instructor, 10% platform commission
   - Records transactions for both parties
4. **ACTIVE Status:** Finalizes enrollment
5. **Notifications:** Sends to student and teacher

**Refund Logic:**
- **24-hour window:** Full refund if dropped within 24 hours
- **10% progress limit:** Full refund if less than 10% completed
- **Automatic:** Refunds student and deducts from instructor

#### Frontend (`CoursePreview.tsx`)

**User Experience:**
- Shows course price (original/discounted)
- "Mua ngay" button for paid courses
- "Đăng ký miễn phí" for free courses
- Error handling for insufficient balance
- Redirects to wallet page if balance insufficient

---

## 🚨 Issues Identified

### 1. **Critical: Direct Wallet Deduction Without Confirmation**

**Problem:**
- Money is deducted immediately without user confirmation
- No payment confirmation screen
- No order summary before purchase
- User doesn't see what they're paying for

**Impact:** 
- Poor user experience
- Potential disputes
- No audit trail for user consent

### 2. **Missing Payment Intent/Order System**

**Problem:**
- No order creation before payment
- No payment intent tracking
- Transactions are created after deduction
- No way to track failed payments properly

**Impact:**
- Difficult to debug payment issues
- No clear payment history
- Cannot implement payment retry logic

### 3. **Insufficient Balance Handling**

**Current:**
- Shows error after enrollment attempt
- User must navigate to wallet manually

**Better:**
- Show balance before purchase
- Offer to top up directly
- Calculate exact amount needed

### 4. **No Payment Confirmation Page**

**Problem:**
- User goes directly from preview to enrolled
- No intermediate confirmation step
- No receipt or order summary

**Impact:**
- Confusing user experience
- No clear record of purchase
- Difficult to track what was purchased

### 5. **Refund Logic Issues**

**Problems:**
- Refund deducts from instructor immediately
- No platform commission handling in refunds
- No refund approval workflow
- Automatic refunds may be abused

### 6. **Transaction Recording Issues**

**Problems:**
- Transactions created after payment
- No PENDING transaction state
- Order codes are timestamps (not unique enough)
- No transaction linking between student and instructor

---

## ✅ Recommended Billing Flow

### **Option A: E-commerce Style (Recommended)**

```
1. Course Preview
   ↓
2. Click "Mua ngay"
   ↓
3. Order Summary Page
   - Course details
   - Price breakdown
   - Wallet balance
   - Terms & conditions
   ↓
4. Confirm Purchase Button
   ↓
5. Create Order (PENDING)
   ↓
6. Process Payment
   - Check balance
   - Create PENDING transaction
   - Deduct from wallet
   - Update transaction to SUCCESS
   - Split payment
   ↓
7. Update Order (COMPLETED)
   ↓
8. Create Enrollment (ACTIVE)
   ↓
9. Payment Success Page
   - Order details
   - Receipt
   - Access course button
```

**Advantages:**
- Clear user consent
- Better audit trail
- Professional UX
- Easy to debug
- Supports future payment methods

### **Option B: Simplified Flow (Current + Improvements)**

```
1. Course Preview
   ↓
2. Click "Mua ngay"
   ↓
3. Confirmation Modal
   - Course name
   - Price
   - Current balance
   - New balance after purchase
   ↓
4. Confirm Button
   ↓
5. Process Payment (same as current)
   ↓
6. Success Modal
   - Receipt
   - Access course button
```

**Advantages:**
- Minimal code changes
- Quick to implement
- Still improves UX

---

## 🎯 Recommended Implementation: Option A

### Phase 1: Backend Changes

#### 1. Create Order Entity

```java
@Entity
@Table(name = "course_orders")
public class CourseOrder extends BaseEntity {
    private UUID studentId;
    private UUID courseId;
    private UUID enrollmentId; // Nullable until enrollment created
    
    @Enumerated(EnumType.STRING)
    private OrderStatus status; // PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
    
    private BigDecimal originalPrice;
    private BigDecimal discountAmount;
    private BigDecimal finalPrice;
    private BigDecimal instructorEarnings;
    private BigDecimal platformCommission;
    
    private String orderNumber; // Unique order number
    private Instant expiresAt; // 15 minutes expiry
    
    @OneToOne
    private Transaction studentTransaction;
    
    @OneToOne
    private Transaction instructorTransaction;
}
```

#### 2. Update Transaction Entity

```java
// Add to Transaction.java
@ManyToOne
@JoinColumn(name = "order_id")
private CourseOrder order;

@Column(name = "order_number")
private String orderNumber;
```

#### 3. Create OrderService

```java
public interface OrderService {
    CourseOrderResponse createOrder(UUID courseId);
    CourseOrderResponse getOrder(UUID orderId);
    CourseOrderResponse confirmOrder(UUID orderId);
    void cancelExpiredOrders();
}
```

#### 4. Update EnrollmentService

```java
// Change signature
EnrollmentResponse enrollWithOrder(UUID orderId);

// Remove direct payment logic
// Payment should be handled by OrderService
```

### Phase 2: Frontend Changes

#### 1. Create Order Summary Page

```typescript
// pages/courses/CourseOrderSummary.tsx
- Display course details
- Show price breakdown
- Display current wallet balance
- Show new balance after purchase
- Terms & conditions checkbox
- Confirm purchase button
```

#### 2. Create Payment Success Page

```typescript
// pages/courses/PaymentSuccess.tsx
- Order confirmation
- Receipt details
- Download receipt button
- Access course button
- Share on social media
```

#### 3. Update Course Preview

```typescript
// Modify handleEnroll()
const handleEnroll = async () => {
  if (isFreeCourse) {
    // Direct enrollment for free courses
    enrollMutation.mutate(id!);
  } else {
    // Navigate to order summary for paid courses
    navigate(`/course/${id}/order`);
  }
};
```

### Phase 3: Payment Flow Implementation

#### Backend Flow

```java
@Transactional
public CourseOrderResponse confirmOrder(UUID orderId) {
    // 1. Get order
    CourseOrder order = findOrder(orderId);
    
    // 2. Validate order
    validateOrder(order); // Check expiry, status, etc.
    
    // 3. Check wallet balance
    Wallet studentWallet = getWallet(order.getStudentId());
    if (studentWallet.getBalance().compareTo(order.getFinalPrice()) < 0) {
        throw new InsufficientBalanceException();
    }
    
    // 4. Update order status
    order.setStatus(OrderStatus.PROCESSING);
    orderRepository.save(order);
    
    try {
        // 5. Create PENDING transactions
        Transaction studentTx = createPendingTransaction(
            studentWallet, order.getFinalPrice(), order);
        Transaction instructorTx = createPendingTransaction(
            instructorWallet, order.getInstructorEarnings(), order);
        
        // 6. Process payment
        walletService.deductBalance(studentWallet.getId(), order.getFinalPrice());
        walletService.addBalance(instructorWallet.getId(), order.getInstructorEarnings());
        
        // 7. Update transactions to SUCCESS
        studentTx.setStatus(TransactionStatus.SUCCESS);
        instructorTx.setStatus(TransactionStatus.SUCCESS);
        transactionRepository.saveAll(List.of(studentTx, instructorTx));
        
        // 8. Create enrollment
        Enrollment enrollment = createEnrollment(order);
        order.setEnrollmentId(enrollment.getId());
        
        // 9. Update order status
        order.setStatus(OrderStatus.COMPLETED);
        order.setStudentTransaction(studentTx);
        order.setInstructorTransaction(instructorTx);
        orderRepository.save(order);
        
        // 10. Send notifications
        sendOrderConfirmationNotifications(order);
        
        return mapToResponse(order);
        
    } catch (Exception e) {
        // Rollback handled by @Transactional
        order.setStatus(OrderStatus.FAILED);
        orderRepository.save(order);
        throw e;
    }
}
```

### Phase 4: Refund Improvements

#### 1. Create Refund Request Entity

```java
@Entity
@Table(name = "refund_requests")
public class RefundRequest extends BaseEntity {
    private UUID orderId;
    private UUID enrollmentId;
    private UUID studentId;
    
    @Enumerated(EnumType.STRING)
    private RefundStatus status; // PENDING, APPROVED, REJECTED, PROCESSED
    
    private String reason;
    private BigDecimal refundAmount;
    private Instant requestedAt;
    private Instant processedAt;
    private UUID processedBy; // Admin who processed
}
```

#### 2. Implement Refund Workflow

```java
public interface RefundService {
    RefundRequestResponse requestRefund(UUID enrollmentId, String reason);
    RefundRequestResponse approveRefund(UUID refundId);
    RefundRequestResponse rejectRefund(UUID refundId, String reason);
    void processApprovedRefunds();
}
```

#### 3. Auto-Approval Rules

```java
private boolean isEligibleForAutoApproval(RefundRequest request) {
    Enrollment enrollment = getEnrollment(request.getEnrollmentId());
    
    // Within 24 hours
    if (Duration.between(enrollment.getEnrolledAt(), Instant.now()).toHours() < 24) {
        return true;
    }
    
    // Less than 10% progress
    double progress = calculateProgress(enrollment);
    if (progress < 10.0) {
        return true;
    }
    
    return false;
}
```

---

## 📋 Implementation Checklist

### Backend

- [ ] Create `CourseOrder` entity
- [ ] Create `RefundRequest` entity
- [ ] Update `Transaction` entity with order reference
- [ ] Create `OrderService` interface and implementation
- [ ] Create `RefundService` interface and implementation
- [ ] Update `EnrollmentService` to use orders
- [ ] Add order number generation utility
- [ ] Create order expiry scheduled job
- [ ] Add order-related API endpoints
- [ ] Add refund-related API endpoints
- [ ] Update transaction recording logic
- [ ] Add order validation logic
- [ ] Implement refund approval workflow
- [ ] Add admin refund management endpoints

### Frontend

- [ ] Create `CourseOrderSummary` page
- [ ] Create `PaymentSuccess` page
- [ ] Create `RefundRequest` page
- [ ] Update `CoursePreview` to navigate to order summary
- [ ] Add order service API client
- [ ] Add refund service API client
- [ ] Create order confirmation modal
- [ ] Create payment processing indicator
- [ ] Add receipt download functionality
- [ ] Update wallet page to show orders
- [ ] Add order history page
- [ ] Add refund request form
- [ ] Add refund status tracking
- [ ] Update error handling for payment failures

### Database Migrations

- [ ] Create `course_orders` table
- [ ] Create `refund_requests` table
- [ ] Add `order_id` column to `transactions`
- [ ] Add `order_number` column to `transactions`
- [ ] Add indexes for order queries
- [ ] Add indexes for refund queries

### Testing

- [ ] Test order creation
- [ ] Test order confirmation
- [ ] Test order expiry
- [ ] Test insufficient balance handling
- [ ] Test payment success flow
- [ ] Test payment failure flow
- [ ] Test refund request creation
- [ ] Test auto-approval logic
- [ ] Test manual refund approval
- [ ] Test refund processing
- [ ] Test concurrent order attempts
- [ ] Test order cancellation

---

## 🎨 UI/UX Improvements

### Order Summary Page

```
┌─────────────────────────────────────────┐
│  Xác nhận đơn hàng                      │
├─────────────────────────────────────────┤
│                                         │
│  📚 [Course Thumbnail]                  │
│                                         │
│  Khóa học: [Course Title]               │
│  Giảng viên: [Teacher Name]             │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Chi tiết thanh toán:                   │
│  Giá gốc:           [Original Price] ₫  │
│  Giảm giá:         -[Discount] ₫        │
│  ─────────────────────────────────────  │
│  Tổng cộng:         [Final Price] ₫     │
│                                         │
│  Số dư ví hiện tại: [Balance] ₫         │
│  Số dư sau mua:     [New Balance] ₫     │
│                                         │
│  ☐ Tôi đồng ý với điều khoản sử dụng   │
│                                         │
│  [Xác nhận thanh toán]  [Hủy]           │
│                                         │
└─────────────────────────────────────────┘
```

### Payment Success Page

```
┌─────────────────────────────────────────┐
│  ✅ Thanh toán thành công!              │
├─────────────────────────────────────────┤
│                                         │
│  Mã đơn hàng: #ORD-20260423-001234      │
│  Ngày: 23/04/2026 14:30                 │
│                                         │
│  Khóa học: [Course Title]               │
│  Số tiền: [Amount] ₫                    │
│                                         │
│  [Vào học ngay]  [Tải hóa đơn]          │
│                                         │
│  Hóa đơn đã được gửi đến email của bạn  │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔒 Security Considerations

### 1. **Order Expiry**
- Orders expire after 15 minutes
- Scheduled job cleans up expired orders
- Prevents order manipulation

### 2. **Idempotency**
- Order numbers are unique
- Prevent duplicate payments
- Handle concurrent requests

### 3. **Transaction Atomicity**
- Use `@Transactional` for all payment operations
- Rollback on any failure
- Maintain data consistency

### 4. **Balance Validation**
- Check balance before and during payment
- Lock wallet during transaction
- Prevent race conditions

### 5. **Audit Trail**
- Log all order state changes
- Record all payment attempts
- Track refund approvals

---

## 📊 Metrics to Track

### Business Metrics
- **Conversion Rate:** Preview → Order → Purchase
- **Cart Abandonment:** Orders created but not completed
- **Refund Rate:** Refunds / Total purchases
- **Average Order Value:** Total revenue / Orders
- **Payment Success Rate:** Successful / Total attempts

### Technical Metrics
- **Order Creation Time:** < 500ms
- **Payment Processing Time:** < 2s
- **Order Expiry Job Performance:** < 1s for 1000 orders
- **Refund Processing Time:** < 3s

---

## 🚀 Rollout Strategy

### Phase 1: Backend Foundation (Week 1)
- Create entities and repositories
- Implement OrderService
- Add API endpoints
- Write unit tests

### Phase 2: Frontend Integration (Week 2)
- Create order summary page
- Create success page
- Update course preview
- Add error handling

### Phase 3: Refund System (Week 3)
- Implement RefundService
- Create refund request flow
- Add admin approval interface
- Test refund scenarios

### Phase 4: Testing & Optimization (Week 4)
- End-to-end testing
- Performance optimization
- Security audit
- User acceptance testing

### Phase 5: Production Deployment
- Deploy to staging
- Monitor metrics
- Gradual rollout (10% → 50% → 100%)
- Monitor for issues

---

## 💡 Future Enhancements

### Payment Methods
- Credit/debit card integration
- Bank transfer
- E-wallet (Momo, ZaloPay)
- Installment payments

### Promotions
- Coupon codes
- Bundle discounts
- Referral rewards
- Seasonal sales

### Advanced Features
- Gift courses
- Corporate bulk purchases
- Subscription bundles
- Course bundles

---

**Recommendation:** Implement **Option A (E-commerce Style)** for a professional, scalable billing system that provides clear user consent, better audit trails, and supports future payment methods.

**Priority:** HIGH - Current implementation has UX and compliance issues that should be addressed soon.

**Estimated Effort:** 3-4 weeks for full implementation with testing.