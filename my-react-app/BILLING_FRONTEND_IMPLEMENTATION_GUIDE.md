# Course Billing Flow - Frontend Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the frontend components for the new course billing flow. The backend is **100% complete**, and this document will help you build the UI components.

---

## ✅ Already Created

### Type Definitions
- ✅ `src/types/order.types.ts` - Order and Refund types, enums, utility functions
- ✅ `src/types/common.types.ts` - Common types (Page, ApiResponse, ApiError)

### Services
- ✅ `src/services/order.service.ts` - Order API client
- ✅ `src/services/refund.service.ts` - Refund API client

---

## 📋 Pages to Implement

### 1. CourseOrderSummary Page

**Path:** `/student/orders/:orderId/summary`

**Purpose:** Display order details and allow user to confirm payment

**Key Features:**
- Display course information (title, thumbnail, description)
- Show pricing breakdown (original price, discount, final price)
- Display wallet balance
- Show expiry countdown timer (15 minutes)
- "Confirm Payment" button
- "Cancel Order" button
- Handle insufficient balance error
- Redirect to success page on confirmation

**Component Structure:**
```tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import orderService from '../../services/order.service';
import { Order, calculateTimeRemaining, formatCurrency } from '../../types/order.types';

export const CourseOrderSummary = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState({ minutes: 15, seconds: 0, isExpired: false });

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  useEffect(() => {
    if (!order?.expiresAt) return;

    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining(order.expiresAt!);
      setTimeRemaining(remaining);

      if (remaining.isExpired) {
        clearInterval(timer);
        // Show expired message and redirect
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [order]);

  const loadOrder = async () => {
    try {
      const data = await orderService.getOrder(orderId!);
      setOrder(data);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await orderService.confirmOrder(orderId!);
      navigate(`/student/orders/${orderId}/success`);
    } catch (error) {
      // Handle error (insufficient balance, etc.)
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = async () => {
    try {
      await orderService.cancelOrder(orderId!, 'Cancelled by user');
      navigate('/student/courses');
    } catch (error) {
      // Handle error
    }
  };

  // Render UI
};
```

**UI Elements:**
- Course card with thumbnail and title
- Pricing table:
  - Original Price: {formatCurrency(order.originalPrice)}
  - Discount: -{formatCurrency(order.discountAmount)}
  - **Final Price: {formatCurrency(order.finalPrice)}**
- Wallet balance display
- Expiry countdown: "Order expires in {minutes}:{seconds}"
- Confirm button (disabled if expired or insufficient balance)
- Cancel button

---

### 2. PaymentSuccess Page

**Path:** `/student/orders/:orderId/success`

**Purpose:** Display success message and order receipt

**Key Features:**
- Success icon/animation
- Order receipt (order number, course, amount, date)
- "Go to My Courses" button
- "View Order Details" button
- "Download Receipt" button (optional)

**Component Structure:**
```tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import orderService from '../../services/order.service';
import { Order, formatCurrency } from '../../types/order.types';

export const PaymentSuccess = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const data = await orderService.getOrder(orderId!);
      setOrder(data);
    } catch (error) {
      // Handle error
    }
  };

  // Render success UI
};
```

**UI Elements:**
- ✅ Success icon (checkmark)
- "Payment Successful!" heading
- Order receipt card:
  - Order Number: {order.orderNumber}
  - Course: {order.courseTitle}
  - Amount Paid: {formatCurrency(order.finalPrice)}
  - Date: {new Date(order.confirmedAt).toLocaleString()}
- Action buttons:
  - "Go to My Courses" → `/student/courses`
  - "View Order Details" → `/student/orders/${orderId}`

---

### 3. OrderHistory Page

**Path:** `/student/orders`

**Purpose:** List all orders with pagination and filtering

**Key Features:**
- List all orders with status badges
- Pagination
- Filter by status
- Search by order number or course name
- "View Details" button
- "Request Refund" button (for completed orders)

**Component Structure:**
```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import orderService from '../../services/order.service';
import { Order, OrderStatus, getOrderStatusLabel, getOrderStatusColor, formatCurrency } from '../../types/order.types';
import { Page } from '../../types/common.types';

export const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Page<Order> | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getMyOrders(page, 10);
      setOrders(data);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  // Render order list
};
```

**UI Elements:**
- Filter dropdown (All, Pending, Completed, Cancelled, Refunded)
- Search input
- Order cards/table:
  - Order Number
  - Course Title (with thumbnail)
  - Amount
  - Status Badge
  - Date
  - Actions (View Details, Request Refund)
- Pagination controls

---

### 4. OrderDetails Page

**Path:** `/student/orders/:orderId`

**Purpose:** Display full order details

**Key Features:**
- Complete order information
- Transaction history
- Refund status (if applicable)
- "Request Refund" button (if eligible)
- "Download Receipt" button

**Component Structure:**
```tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import orderService from '../../services/order.service';
import { Order, canRequestRefund, formatCurrency } from '../../types/order.types';

export const OrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const data = await orderService.getOrder(orderId!);
      setOrder(data);
    } catch (error) {
      // Handle error
    }
  };

  const handleRequestRefund = () => {
    navigate(`/student/orders/${orderId}/refund`);
  };

  // Render order details
};
```

**UI Elements:**
- Order information card:
  - Order Number
  - Status
  - Course Details
  - Pricing Breakdown
  - Dates (Created, Confirmed, Cancelled)
- Transaction details
- Refund button (if eligible)

---

### 5. RefundRequest Page

**Path:** `/student/orders/:orderId/refund`

**Purpose:** Submit refund request

**Key Features:**
- Display refund eligibility information
- Reason textarea (required)
- Auto-approval indicator
- "Submit Request" button

**Component Structure:**
```tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import orderService from '../../services/order.service';
import refundService from '../../services/refund.service';
import { Order, formatCurrency } from '../../types/order.types';

export const RefundRequest = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const data = await orderService.getOrder(orderId!);
      setOrder(data);
    } catch (error) {
      // Handle error
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      // Show error
      return;
    }

    setSubmitting(true);
    try {
      await refundService.createRefundRequest(orderId!, { reason });
      navigate('/student/refunds');
    } catch (error) {
      // Handle error
    } finally {
      setSubmitting(false);
    }
  };

  // Render refund request form
};
```

**UI Elements:**
- Order summary
- Refund amount: {formatCurrency(order.finalPrice)}
- Eligibility info:
  - "✅ Your refund will be auto-approved (within 24 hours)"
  - "⏳ Your refund requires manual approval"
- Reason textarea (required)
- Submit button

---

### 6. RefundHistory Page

**Path:** `/student/refunds`

**Purpose:** List all refund requests

**Key Features:**
- List all refund requests with status badges
- Pagination
- "View Details" button
- "Cancel Request" button (for pending)

**Component Structure:**
```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import refundService from '../../services/refund.service';
import { RefundRequest, RefundStatus, getRefundStatusLabel, getRefundStatusColor, formatCurrency } from '../../types/order.types';
import { Page } from '../../types/common.types';

export const RefundHistory = () => {
  const navigate = useNavigate();
  const [refunds, setRefunds] = useState<Page<RefundRequest> | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadRefunds();
  }, [page]);

  const loadRefunds = async () => {
    try {
      const data = await refundService.getMyRefundRequests(page, 10);
      setRefunds(data);
    } catch (error) {
      // Handle error
    }
  };

  const handleCancel = async (refundId: string) => {
    try {
      await refundService.cancelRefundRequest(refundId);
      loadRefunds();
    } catch (error) {
      // Handle error
    }
  };

  // Render refund list
};
```

**UI Elements:**
- Refund cards/table:
  - Order Number
  - Course Title
  - Refund Amount
  - Status Badge
  - Requested Date
  - Actions (View Details, Cancel)
- Pagination controls

---

### 7. AdminRefundManagement Page

**Path:** `/admin/refunds`

**Purpose:** Manage pending refund requests (admin only)

**Key Features:**
- List pending refund requests
- Display student info, course, amount, reason
- "Approve" button with optional notes
- "Reject" button with required reason
- Filter and search

**Component Structure:**
```tsx
import { useState, useEffect } from 'react';
import refundService from '../../services/refund.service';
import { RefundRequest, formatCurrency } from '../../types/order.types';
import { Page } from '../../types/common.types';

export const AdminRefundManagement = () => {
  const [refunds, setRefunds] = useState<Page<RefundRequest> | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadPendingRefunds();
  }, [page]);

  const loadPendingRefunds = async () => {
    try {
      const data = await refundService.getPendingRefundRequests(page, 10);
      setRefunds(data);
    } catch (error) {
      // Handle error
    }
  };

  const handleApprove = async (refundId: string, notes?: string) => {
    try {
      await refundService.approveRefundRequest(refundId, notes);
      loadPendingRefunds();
    } catch (error) {
      // Handle error
    }
  };

  const handleReject = async (refundId: string, notes: string) => {
    if (!notes.trim()) {
      // Show error
      return;
    }

    try {
      await refundService.rejectRefundRequest(refundId, notes);
      loadPendingRefunds();
    } catch (error) {
      // Handle error
    }
  };

  // Render admin refund management UI
};
```

**UI Elements:**
- Pending refunds table:
  - Student Name
  - Order Number
  - Course Title
  - Refund Amount
  - Reason
  - Requested Date
  - Actions (Approve, Reject)
- Approve modal (optional notes)
- Reject modal (required reason)
- Pagination controls

---

## 🔄 Component Updates

### Update CoursePreview.tsx

**Current Flow:**
```tsx
const handleEnroll = async () => {
  await enrollmentService.enroll(courseId);
  navigate('/student/courses');
};
```

**New Flow:**
```tsx
const handleEnroll = async () => {
  try {
    const order = await orderService.createOrder(courseId);
    navigate(`/student/orders/${order.id}/summary`);
  } catch (error) {
    // Handle error
  }
};
```

---

## 🛣️ Route Configuration

Add these routes to your router:

```tsx
// Student routes
<Route path="/student/orders/:orderId/summary" element={<CourseOrderSummary />} />
<Route path="/student/orders/:orderId/success" element={<PaymentSuccess />} />
<Route path="/student/orders" element={<OrderHistory />} />
<Route path="/student/orders/:orderId" element={<OrderDetails />} />
<Route path="/student/orders/:orderId/refund" element={<RefundRequest />} />
<Route path="/student/refunds" element={<RefundHistory />} />

// Admin routes
<Route path="/admin/refunds" element={<AdminRefundManagement />} />
```

---

## 🎨 UI Components to Create

### OrderStatusBadge Component

```tsx
import { OrderStatus, getOrderStatusLabel, getOrderStatusColor } from '../../types/order.types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const label = getOrderStatusLabel(status);
  const color = getOrderStatusColor(status);

  return (
    <span className={`badge badge-${color}`}>
      {label}
    </span>
  );
};
```

### RefundStatusBadge Component

```tsx
import { RefundStatus, getRefundStatusLabel, getRefundStatusColor } from '../../types/order.types';

interface RefundStatusBadgeProps {
  status: RefundStatus;
}

export const RefundStatusBadge: React.FC<RefundStatusBadgeProps> = ({ status }) => {
  const label = getRefundStatusLabel(status);
  const color = getRefundStatusColor(status);

  return (
    <span className={`badge badge-${color}`}>
      {label}
    </span>
  );
};
```

### CountdownTimer Component

```tsx
import { useState, useEffect } from 'react';
import { calculateTimeRemaining } from '../../types/order.types';

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ expiresAt, onExpire }) => {
  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining(expiresAt));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining(expiresAt);
      setTimeRemaining(remaining);

      if (remaining.isExpired && onExpire) {
        clearInterval(timer);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  if (timeRemaining.isExpired) {
    return <span className="text-danger">Expired</span>;
  }

  return (
    <span className="text-warning">
      {String(timeRemaining.minutes).padStart(2, '0')}:
      {String(timeRemaining.seconds).padStart(2, '0')}
    </span>
  );
};
```

---

## 🧪 Testing Checklist

### Order Flow
- [ ] Create order for paid course
- [ ] Create order for free course
- [ ] Create order with discount
- [ ] Confirm order with sufficient balance
- [ ] Confirm order with insufficient balance (error)
- [ ] Cancel pending order
- [ ] Order expiry countdown works
- [ ] Order expires after 15 minutes
- [ ] Duplicate order prevention (returns existing)

### Refund Flow
- [ ] Request refund within 24 hours (auto-approve)
- [ ] Request refund with <10% progress (auto-approve)
- [ ] Request refund beyond thresholds (manual approval)
- [ ] Admin approve refund
- [ ] Admin reject refund
- [ ] Student cancel refund request
- [ ] Duplicate refund prevention

### UI/UX
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Loading states
- [ ] Error handling
- [ ] Success messages
- [ ] Confirmation dialogs
- [ ] Accessibility (keyboard navigation, screen readers)

---

## 📱 Responsive Design Considerations

### Mobile
- Stack order summary vertically
- Full-width buttons
- Simplified table views (cards instead)
- Touch-friendly tap targets

### Tablet
- Two-column layout for order summary
- Responsive tables
- Optimized spacing

### Desktop
- Three-column layout where appropriate
- Full tables with all columns
- Hover states

---

## 🎯 Implementation Priority

### Phase 1 (Critical - Week 1)
1. ✅ Type definitions (DONE)
2. ✅ Services (DONE)
3. CourseOrderSummary page
4. PaymentSuccess page
5. Update CoursePreview component

### Phase 2 (Important - Week 2)
6. OrderHistory page
7. OrderDetails page
8. RefundRequest page
9. RefundHistory page

### Phase 3 (Admin - Week 3)
10. AdminRefundManagement page
11. Admin dashboard integration

---

## 🚀 Quick Start

1. **Install dependencies** (if any new ones needed)
2. **Create pages** in `src/pages/orders/` and `src/pages/refunds/`
3. **Create components** in `src/components/orders/` and `src/components/refunds/`
4. **Add routes** to your router configuration
5. **Update CoursePreview** component
6. **Test** each flow thoroughly

---

## 📞 Support

For questions or issues:
- Backend API: See `BILLING_BACKEND_IMPLEMENTATION_COMPLETE.md`
- Type definitions: See `src/types/order.types.ts`
- Services: See `src/services/order.service.ts` and `src/services/refund.service.ts`

---

## 🎉 Summary

You now have:
- ✅ Complete type definitions
- ✅ API service clients
- ✅ Utility functions
- ✅ Implementation guide for all pages
- ✅ Component examples
- ✅ Testing checklist

**Estimated Effort:** 2-3 weeks for complete frontend implementation

Good luck! 🚀
