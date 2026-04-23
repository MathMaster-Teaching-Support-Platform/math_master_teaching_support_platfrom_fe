# Course Billing Flow - Deployment Checklist

## 📋 Pre-Deployment Checklist

---

## 🗄️ Database Migration

### Step 1: Backup Database
- [ ] Create full database backup
- [ ] Verify backup integrity
- [ ] Store backup in secure location
- [ ] Document backup location and timestamp

### Step 2: Run Migration Script
- [ ] Review migration script: `V1__Create_Order_And_Refund_Tables.sql`
- [ ] Test migration on development database
- [ ] Test migration on staging database
- [ ] Run migration on production database
- [ ] Verify tables created:
  - [ ] `orders` table exists
  - [ ] `refund_requests` table exists
  - [ ] `transactions.order_id` column exists
- [ ] Verify indexes created
- [ ] Verify foreign keys created
- [ ] Verify constraints created

### Step 3: Verify Migration
```sql
-- Check orders table
SELECT COUNT(*) FROM orders;

-- Check refund_requests table
SELECT COUNT(*) FROM refund_requests;

-- Check transactions.order_id column
SELECT order_id FROM transactions LIMIT 1;

-- Verify indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'orders';
SELECT indexname FROM pg_indexes WHERE tablename = 'refund_requests';
```

---

## 🔧 Backend Deployment

### Step 1: Code Review
- [ ] Review all new Java files
- [ ] Check for security vulnerabilities
- [ ] Verify error handling
- [ ] Check logging statements
- [ ] Review transaction boundaries (@Transactional)
- [ ] Verify authorization checks

### Step 2: Build & Test
- [ ] Run unit tests
- [ ] Run integration tests
- [ ] Build application: `mvn clean package`
- [ ] Verify build success
- [ ] Check for compilation warnings

### Step 3: Configuration
- [ ] Verify scheduled job is enabled (@EnableScheduling)
- [ ] Check application.properties/yml:
  - [ ] Database connection settings
  - [ ] Notification settings
  - [ ] Wallet service settings
- [ ] Verify environment variables

### Step 4: Deploy to Staging
- [ ] Deploy backend to staging environment
- [ ] Verify application starts successfully
- [ ] Check logs for errors
- [ ] Verify scheduled job runs (OrderExpiryJob)

### Step 5: Test Endpoints (Staging)
```bash
# Test order creation
curl -X POST http://staging-api/api/orders/courses/{courseId} \
  -H "Authorization: Bearer {token}"

# Test order confirmation
curl -X POST http://staging-api/api/orders/{orderId}/confirm \
  -H "Authorization: Bearer {token}"

# Test refund request
curl -X POST http://staging-api/api/refunds/orders/{orderId} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Test refund"}'
```

### Step 6: Monitor Logs
- [ ] Check application logs
- [ ] Check database logs
- [ ] Check notification logs
- [ ] Verify no errors or warnings

---

## 🎨 Frontend Deployment

### Step 1: Code Review
- [ ] Review all new TypeScript/React files
- [ ] Check for security vulnerabilities
- [ ] Verify error handling
- [ ] Check accessibility (a11y)
- [ ] Review responsive design

### Step 2: Build & Test
- [ ] Run linter: `npm run lint`
- [ ] Run type checker: `npm run type-check`
- [ ] Run tests: `npm run test`
- [ ] Build application: `npm run build`
- [ ] Verify build success

### Step 3: Deploy to Staging
- [ ] Deploy frontend to staging environment
- [ ] Verify application loads
- [ ] Check browser console for errors
- [ ] Test on multiple browsers:
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge

### Step 4: Test User Flows (Staging)
- [ ] Test order creation flow
- [ ] Test order confirmation flow
- [ ] Test order cancellation flow
- [ ] Test order expiry countdown
- [ ] Test refund request flow
- [ ] Test refund history
- [ ] Test admin refund management

### Step 5: Responsive Testing
- [ ] Test on mobile (iOS)
- [ ] Test on mobile (Android)
- [ ] Test on tablet
- [ ] Test on desktop

---

## 🧪 End-to-End Testing

### Scenario 1: Successful Order Flow
1. [ ] Student navigates to course preview
2. [ ] Student clicks "Enroll"
3. [ ] Order created successfully
4. [ ] Order summary page displays correctly
5. [ ] Countdown timer works
6. [ ] Student clicks "Confirm Payment"
7. [ ] Payment processed successfully
8. [ ] Enrollment created
9. [ ] Success page displays
10. [ ] Notifications sent
11. [ ] Order appears in order history

### Scenario 2: Insufficient Balance
1. [ ] Student with low balance clicks "Enroll"
2. [ ] Order created successfully
3. [ ] Student clicks "Confirm Payment"
4. [ ] Error message displays: "Insufficient balance"
5. [ ] Order remains PENDING
6. [ ] Student can cancel order

### Scenario 3: Order Expiry
1. [ ] Student creates order
2. [ ] Wait 15 minutes (or adjust expiry for testing)
3. [ ] Scheduled job runs
4. [ ] Order status updated to CANCELLED
5. [ ] Student cannot confirm expired order

### Scenario 4: Order Cancellation
1. [ ] Student creates order
2. [ ] Student clicks "Cancel Order"
3. [ ] Order status updated to CANCELLED
4. [ ] Student can create new order

### Scenario 5: Auto-Approved Refund
1. [ ] Student completes order
2. [ ] Student requests refund within 24 hours
3. [ ] Refund auto-approved
4. [ ] Money refunded to student wallet
5. [ ] Money deducted from instructor wallet
6. [ ] Order status updated to REFUNDED
7. [ ] Enrollment status updated to DROPPED
8. [ ] Notifications sent

### Scenario 6: Manual Refund Approval
1. [ ] Student completes order
2. [ ] Wait 25 hours
3. [ ] Student requests refund
4. [ ] Refund status: PENDING
5. [ ] Admin reviews refund
6. [ ] Admin approves refund
7. [ ] Refund processed
8. [ ] Notifications sent

### Scenario 7: Refund Rejection
1. [ ] Student requests refund
2. [ ] Admin reviews refund
3. [ ] Admin rejects with reason
4. [ ] Refund status: REJECTED
5. [ ] Student notified with reason

---

## 📊 Monitoring Setup

### Application Metrics
- [ ] Set up order creation rate monitoring
- [ ] Set up order confirmation rate monitoring
- [ ] Set up order cancellation rate monitoring
- [ ] Set up order expiry rate monitoring
- [ ] Set up refund request rate monitoring
- [ ] Set up auto-approval rate monitoring

### Error Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure alerts for critical errors
- [ ] Set up log aggregation (ELK, etc.)

### Performance Monitoring
- [ ] Monitor API response times
- [ ] Monitor database query performance
- [ ] Monitor scheduled job execution time

### Business Metrics
- [ ] Track total revenue
- [ ] Track instructor earnings
- [ ] Track platform commission
- [ ] Track refund amounts
- [ ] Track net revenue

---

## 🔒 Security Checklist

### Authentication & Authorization
- [ ] Verify JWT token validation
- [ ] Check role-based access control
- [ ] Test unauthorized access attempts
- [ ] Verify student can only access own orders
- [ ] Verify admin can access all refunds

### Data Validation
- [ ] Test SQL injection prevention
- [ ] Test XSS prevention
- [ ] Verify input validation
- [ ] Check output encoding

### Transaction Security
- [ ] Verify transaction atomicity
- [ ] Check for race conditions
- [ ] Test concurrent order creation
- [ ] Verify wallet balance consistency

---

## 📝 Documentation

### User Documentation
- [ ] Create user guide for order flow
- [ ] Create user guide for refund flow
- [ ] Create FAQ document
- [ ] Update help center

### Admin Documentation
- [ ] Create admin guide for refund management
- [ ] Document refund approval process
- [ ] Create troubleshooting guide

### Developer Documentation
- [ ] Update API documentation
- [ ] Document database schema
- [ ] Update architecture diagrams
- [ ] Document deployment process

---

## 🚀 Production Deployment

### Pre-Deployment
- [ ] All staging tests passed
- [ ] Code review completed
- [ ] Security review completed
- [ ] Performance testing completed
- [ ] Stakeholder approval obtained

### Deployment Window
- [ ] Schedule maintenance window
- [ ] Notify users of maintenance
- [ ] Prepare rollback plan

### Deployment Steps
1. [ ] Create production database backup
2. [ ] Run database migration on production
3. [ ] Deploy backend to production
4. [ ] Verify backend health check
5. [ ] Deploy frontend to production
6. [ ] Verify frontend loads
7. [ ] Run smoke tests
8. [ ] Monitor logs for errors

### Post-Deployment
- [ ] Verify scheduled job is running
- [ ] Test critical user flows
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Check notification delivery
- [ ] Verify wallet transactions

### Rollback Plan (If Needed)
1. [ ] Stop application
2. [ ] Restore database backup
3. [ ] Deploy previous version
4. [ ] Verify rollback success
5. [ ] Notify stakeholders

---

## 📞 Support Preparation

### Support Team Training
- [ ] Train support team on new flow
- [ ] Provide troubleshooting guide
- [ ] Create support scripts
- [ ] Set up escalation process

### Common Issues & Solutions
- [ ] Document common errors
- [ ] Provide resolution steps
- [ ] Create FAQ for support team

---

## ✅ Go-Live Checklist

### Day Before
- [ ] Final code review
- [ ] Final testing on staging
- [ ] Backup all databases
- [ ] Notify stakeholders
- [ ] Prepare rollback plan

### Go-Live Day
- [ ] Deploy to production
- [ ] Run smoke tests
- [ ] Monitor logs (first hour)
- [ ] Monitor metrics (first hour)
- [ ] Test critical flows
- [ ] Notify stakeholders of success

### Day After
- [ ] Review error logs
- [ ] Review performance metrics
- [ ] Review user feedback
- [ ] Address any issues
- [ ] Document lessons learned

---

## 📊 Success Criteria

### Technical Success
- [ ] All endpoints responding correctly
- [ ] No critical errors in logs
- [ ] Response times within SLA
- [ ] Scheduled job running successfully
- [ ] Database performance acceptable

### Business Success
- [ ] Order creation rate > 0
- [ ] Order confirmation rate > 80%
- [ ] Order expiry rate < 10%
- [ ] Refund request rate < 5%
- [ ] User satisfaction > 4/5

---

## 🎉 Post-Launch

### Week 1
- [ ] Daily monitoring of metrics
- [ ] Daily review of error logs
- [ ] Collect user feedback
- [ ] Address critical issues

### Week 2-4
- [ ] Weekly monitoring of metrics
- [ ] Weekly review of error logs
- [ ] Analyze user behavior
- [ ] Plan improvements

### Month 2+
- [ ] Monthly metric review
- [ ] Quarterly feature planning
- [ ] Continuous improvement

---

## 📋 Sign-Off

### Development Team
- [ ] Backend Lead: _________________ Date: _______
- [ ] Frontend Lead: ________________ Date: _______
- [ ] QA Lead: _____________________ Date: _______

### Operations Team
- [ ] DevOps Lead: _________________ Date: _______
- [ ] Database Admin: ______________ Date: _______

### Business Team
- [ ] Product Manager: _____________ Date: _______
- [ ] Business Owner: ______________ Date: _______

---

**Deployment Date:** __________________
**Deployed By:** __________________
**Version:** 1.0
**Status:** ☐ Pending | ☐ In Progress | ☐ Complete
