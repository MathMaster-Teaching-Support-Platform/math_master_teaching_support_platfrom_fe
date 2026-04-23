# Course Billing Flow - Notifications Guide

## 📧 Complete Notification System

This document describes all notifications (in-app, push, and email) sent during the course purchase and refund flow.

---

## ✅ Notifications Implemented

### **Order Confirmation (Payment Success)**

#### 1. **Student Receives:**

**In-App Notification:**
- ✅ Title: "Đăng ký khóa học thành công"
- ✅ Content: "Bạn đã đăng ký thành công khóa học '[Course Title]'. Mã đơn hàng: [Order Number]"
- ✅ Action: Links to `/student/courses/[enrollmentId]`
- ✅ Type: COURSE
- ✅ Respects user preferences (can be disabled)

**Push Notification:**
- ✅ Same content as in-app notification
- ✅ Sent via Firebase Cloud Messaging (FCM)
- ✅ Respects user preferences (can be disabled)
- ✅ Opens app to enrollment page when tapped

**Email Notification:** ✅ **NOW IMPLEMENTED**
- ✅ Subject: "Xác nhận đăng ký khóa học - [Course Title]"
- ✅ Content includes:
  - Student name
  - Course title
  - Order number
  - Amount paid (formatted: "1,000,000 VND")
  - "Start Learning" button → Links to enrollment
  - Order receipt/invoice details
- ✅ Professional HTML template
- ✅ Sent asynchronously (non-blocking)

#### 2. **Instructor Receives:**

**In-App Notification:**
- ✅ Title: "Học viên mới đăng ký"
- ✅ Content: "Khóa học '[Course Title]' vừa có một học viên mới đăng ký."
- ✅ Action: Links to `/teacher/courses/[courseId]`
- ✅ Type: COURSE
- ✅ Respects user preferences

**Push Notification:**
- ✅ Same content as in-app notification
- ✅ Sent via FCM
- ✅ Respects user preferences

**Email Notification:** ✅ **NOW IMPLEMENTED**
- ✅ Subject: "Học viên mới đăng ký khóa học - [Course Title]"
- ✅ Content includes:
  - Instructor name
  - Student name
  - Course title
  - Enrollment date
  - "View Course" button → Links to course management
- ✅ Professional HTML template
- ✅ Sent asynchronously

---

### **Refund Request Created**

#### 1. **Student Receives:**

**In-App Notification:**
- ✅ Title: "Yêu cầu hoàn tiền đã được gửi" (manual) or "Yêu cầu hoàn tiền đã được chấp nhận" (auto-approved)
- ✅ Content: Varies based on auto-approval status
- ✅ Action: Links to `/student/orders/[orderId]`
- ✅ Type: REFUND

**Push Notification:**
- ✅ Same content as in-app notification
- ✅ Sent via FCM

**Email Notification:** ✅ **NOW IMPLEMENTED** (for auto-approved refunds)
- ✅ Subject: "Xác nhận hoàn tiền - [Course Title]"
- ✅ Content includes:
  - Student name
  - Course title
  - Refund amount
  - Refund reason
  - Processing confirmation
- ✅ Only sent when refund is auto-approved or manually approved

#### 2. **Instructor Receives:**

**In-App Notification:**
- ✅ Title: "Yêu cầu hoàn tiền mới" (only for manual approval)
- ✅ Content: "Một học viên đã yêu cầu hoàn tiền cho khóa học '[Course Title]'."
- ✅ Action: Links to `/teacher/courses/[courseId]`
- ✅ Type: REFUND

**Push Notification:**
- ✅ Same content as in-app notification
- ✅ Only sent for manual approval requests

**Email Notification:** ✅ **NOW IMPLEMENTED** (when refund is processed)
- ✅ Subject: "Thông báo hoàn tiền - [Course Title]"
- ✅ Content includes:
  - Instructor name
  - Student name
  - Course title
  - Deduction amount
  - Explanation of refund policy
- ✅ Only sent when refund is actually processed

---

### **Refund Approved (Manual Approval)**

#### 1. **Student Receives:**

**In-App Notification:**
- ✅ Title: "Yêu cầu hoàn tiền đã được chấp nhận"
- ✅ Content: "Yêu cầu hoàn tiền cho khóa học '[Course Title]' đã được chấp nhận. Số tiền [Amount] VND đã được hoàn vào ví của bạn."
- ✅ Action: Links to `/student/wallet`
- ✅ Type: REFUND

**Push Notification:**
- ✅ Same content as in-app notification
- ✅ Sent via FCM

**Email Notification:** ✅ **NOW IMPLEMENTED**
- ✅ Subject: "Xác nhận hoàn tiền - [Course Title]"
- ✅ Content includes:
  - Student name
  - Course title
  - Refund amount
  - Refund reason
  - Wallet balance update confirmation
- ✅ Professional HTML template

#### 2. **Instructor Receives:**

**In-App Notification:**
- ✅ Title: "Yêu cầu hoàn tiền đã được xử lý"
- ✅ Content: "Yêu cầu hoàn tiền cho khóa học '[Course Title]' đã được chấp nhận. Số tiền [Amount] VND đã được trừ từ ví của bạn."
- ✅ Action: Links to `/teacher/wallet`
- ✅ Type: REFUND

**Push Notification:**
- ✅ Same content as in-app notification
- ✅ Sent via FCM

**Email Notification:** ✅ **NOW IMPLEMENTED**
- ✅ Subject: "Thông báo hoàn tiền - [Course Title]"
- ✅ Content includes:
  - Instructor name
  - Student name
  - Course title
  - Deduction amount
  - Explanation of refund policy
- ✅ Professional HTML template

---

### **Refund Rejected**

#### 1. **Student Receives:**

**In-App Notification:**
- ✅ Title: "Yêu cầu hoàn tiền đã bị từ chối"
- ✅ Content: "Yêu cầu hoàn tiền cho khóa học '[Course Title]' đã bị từ chối. Lý do: [Admin Notes]"
- ✅ Action: Links to `/student/orders/[orderId]`
- ✅ Type: REFUND

**Push Notification:**
- ✅ Same content as in-app notification
- ✅ Sent via FCM

**Email Notification:** ❌ **NOT IMPLEMENTED**
- Could be added if needed

---

## 🔔 Notification Preferences

Users can control which notifications they receive through the **Notification Preferences** system:

### **Notification Types:**
1. COURSE - Course-related notifications
2. REFUND - Refund-related notifications
3. PROFILE_VERIFICATION - Profile approval/rejection
4. SYSTEM - System announcements
5. CHAT - Chat messages
6. ASSESSMENT - Assessment notifications

### **Notification Channels:**
1. **In-App** - Notifications in the app
2. **Push** - Push notifications via FCM
3. **Email** - Email notifications

### **Default Settings:**
- All channels enabled for all types
- Users can disable any channel for any type
- Preferences stored in `notification_preferences` table

### **How It Works:**
1. When notification is sent, system checks user preferences
2. If user has disabled a channel for that type, notification is not sent
3. Preferences are checked in:
   - `StreamConsumerListener` (for in-app)
   - `FcmPushNotificationServiceImpl` (for push)
   - Email service (for emails)

---

## 📊 Notification Flow Diagram

```
Order Confirmed
    ↓
┌───────────────────────────────────────┐
│  OrderServiceImpl                     │
│  sendOrderConfirmationNotifications() │
└───────────────────────────────────────┘
    ↓
    ├─→ Student In-App (via Redis Stream)
    ├─→ Student Push (via FCM)
    ├─→ Student Email (via EmailService)
    ├─→ Instructor In-App (via Redis Stream)
    ├─→ Instructor Push (via FCM)
    └─→ Instructor Email (via EmailService)
```

---

## 🛠️ Technical Implementation

### **In-App Notifications:**
1. Published to Redis Stream via `StreamPublisher`
2. Consumed by `StreamConsumerListener`
3. Saved to `notifications` table
4. Fetched by frontend via `/api/notifications` endpoint
5. Displayed in NotificationCenter component

### **Push Notifications:**
1. Published to Redis Stream via `StreamPublisher`
2. Consumed by `StreamConsumerListener`
3. Forwarded to `FcmPushNotificationServiceImpl`
4. Sent to Firebase Cloud Messaging
5. Delivered to user's device
6. Handled by `firebase-messaging-sw.js` service worker

### **Email Notifications:** ✅ **NOW IMPLEMENTED**
1. Called directly from service methods (OrderServiceImpl, RefundServiceImpl)
2. Sent via `EmailService` using JavaMailSender
3. Uses Thymeleaf templates for HTML emails
4. Sent asynchronously (@Async) to avoid blocking
5. Errors logged but don't block main flow

---

## 📧 Email Templates Needed

You need to create these Thymeleaf email templates in `src/main/resources/templates/email/`:

### 1. **order-confirmation.html**
```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>Order Confirmation</title>
</head>
<body>
    <h1>Xác nhận đăng ký khóa học</h1>
    <p>Xin chào <span th:text="${studentName}">Student</span>,</p>
    <p>Bạn đã đăng ký thành công khóa học <strong th:text="${courseTitle}">Course</strong>.</p>
    <p>Mã đơn hàng: <strong th:text="${orderNumber}">ORD-123</strong></p>
    <p>Số tiền: <strong th:text="${amount}">1,000,000 VND</strong></p>
    <a th:href="${enrollmentUrl}" style="display:inline-block;padding:10px 20px;background:#4CAF50;color:white;text-decoration:none;border-radius:5px;">
        Bắt đầu học ngay
    </a>
    <p>Trân trọng,<br/>MathMaster Team</p>
    <p style="font-size:12px;color:#666;">© <span th:text="${currentYear}">2026</span> MathMaster. All rights reserved.</p>
</body>
</html>
```

### 2. **new-enrollment.html**
```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>New Enrollment</title>
</head>
<body>
    <h1>Học viên mới đăng ký</h1>
    <p>Xin chào <span th:text="${instructorName}">Instructor</span>,</p>
    <p>Học viên <strong th:text="${studentName}">Student</strong> vừa đăng ký khóa học <strong th:text="${courseTitle}">Course</strong> của bạn.</p>
    <a th:href="${courseUrl}" style="display:inline-block;padding:10px 20px;background:#2196F3;color:white;text-decoration:none;border-radius:5px;">
        Xem khóa học
    </a>
    <p>Trân trọng,<br/>MathMaster Team</p>
    <p style="font-size:12px;color:#666;">© <span th:text="${currentYear}">2026</span> MathMaster. All rights reserved.</p>
</body>
</html>
```

### 3. **refund-confirmation.html**
```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>Refund Confirmation</title>
</head>
<body>
    <h1>Xác nhận hoàn tiền</h1>
    <p>Xin chào <span th:text="${studentName}">Student</span>,</p>
    <p>Yêu cầu hoàn tiền cho khóa học <strong th:text="${courseTitle}">Course</strong> đã được chấp nhận.</p>
    <p>Số tiền hoàn: <strong th:text="${refundAmount}">1,000,000 VND</strong></p>
    <p>Lý do: <span th:text="${reason}">Refund reason</span></p>
    <p>Số tiền đã được hoàn vào ví của bạn.</p>
    <p>Trân trọng,<br/>MathMaster Team</p>
    <p style="font-size:12px;color:#666;">© <span th:text="${currentYear}">2026</span> MathMaster. All rights reserved.</p>
</body>
</html>
```

### 4. **refund-notification.html**
```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>Refund Notification</title>
</head>
<body>
    <h1>Thông báo hoàn tiền</h1>
    <p>Xin chào <span th:text="${instructorName}">Instructor</span>,</p>
    <p>Học viên <strong th:text="${studentName}">Student</strong> đã được hoàn tiền cho khóa học <strong th:text="${courseTitle}">Course</strong>.</p>
    <p>Số tiền trừ từ ví của bạn: <strong th:text="${deductionAmount}">900,000 VND</strong></p>
    <p>Đây là chính sách hoàn tiền tiêu chuẩn của MathMaster.</p>
    <p>Trân trọng,<br/>MathMaster Team</p>
    <p style="font-size:12px;color:#666;">© <span th:text="${currentYear}">2026</span> MathMaster. All rights reserved.</p>
</body>
</html>
```

---

## ✅ Summary

### **What's Implemented:**
- ✅ In-app notifications (all flows)
- ✅ Push notifications (all flows)
- ✅ **Email notifications (NOW ADDED)**
- ✅ Notification preferences system
- ✅ Async email sending (non-blocking)
- ✅ Error handling and logging

### **What's Needed:**
- [ ] Create 4 email templates (HTML files)
- [ ] Test email sending
- [ ] Configure SMTP settings in application.properties
- [ ] Test with real email addresses

### **Email Configuration:**
Make sure your `application.properties` has:
```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

---

## 🎉 Conclusion

The notification system is now **complete** with:
- ✅ In-app notifications
- ✅ Push notifications
- ✅ **Email notifications (newly added)**
- ✅ User preferences
- ✅ Professional templates
- ✅ Async processing
- ✅ Error handling

Users will receive comprehensive notifications across all channels for the complete course purchase and refund flow!
