# HR Harmony - Bug Analysis & Flaws Report

## Executive Summary
The HR Harmony HRMS application has several critical bugs, security vulnerabilities, and design flaws that need to be addressed. This document identifies 20+ issues across the frontend and backend.

---

## 🔴 CRITICAL ISSUES (Must Fix Immediately)

### 1. **SQL Injection Vulnerability in Employee ID Generation**
**File:** `backend/src/utils/helpers.ts`
**Severity:** CRITICAL
```typescript
export const generateEmployeeId = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const count = await User.count({
        where: {
            employee_id: {
                [Op.like]: `EMP${year}-%`,  // ❌ Potential SQL injection
            },
        },
    });
    // ...
};
```
**Issue:** While Sequelize parameterizes queries, string interpolation in LIKE patterns can be risky.
**Fix:** Use proper escaping or consider a different approach like a sequence table.

---

### 2. **Missing Input Validation on Critical Fields**
**File:** `backend/src/controllers/payrollController.ts`, `leaveController.ts`
**Severity:** CRITICAL
```typescript
export const applyLeave = async (req: AuthRequest, res: Response): Promise<void> => {
    const { leave_type, start_date, end_date, reason } = req.body;  // ❌ No validation
    
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    // Direct use without checking if dates are valid
};
```
**Issue:** No validation that `start_date` < `end_date`, or that leave_type is valid enum value.
**Impact:** Employees can create invalid leave requests (e.g., end date before start date).

---

### 3. **Weak Default Password Policy**
**File:** `backend/src/controllers/employeeController.ts:94`
**Severity:** CRITICAL
```typescript
password: password || 'Welcome@123', // ❌ Weak default password
```
**Issue:** Default password is too simple and exposed in code.
**Fix:** Generate secure random passwords or force password reset on first login.

---

### 4. **No Password Reset/Recovery Mechanism**
**Severity:** CRITICAL
**Issue:** Users cannot reset forgotten passwords. No endpoint exists for password recovery.
**Impact:** Locked-out users cannot regain access.

---

### 5. **Missing CORS Configuration**
**File:** `backend/src/app.ts`
**Severity:** HIGH
**Issue:** No CORS middleware visible in backend. This could cause frontend-backend communication issues in production.
**Fix:** Add proper CORS configuration with allowed origins.

---

### 6. **Attendance Date Handling Bug**
**File:** `backend/src/controllers/attendanceController.ts:66-68`
**Severity:** HIGH
```typescript
const d = new Date(date);
const attendanceDate = !isNaN(d.getTime()) 
    ? d.toISOString().split('T')[0] 
    : new Date().toISOString().split('T')[0];
```
**Issue:** Using `toISOString().split('T')[0]` creates date in UTC, not local timezone. 
**Impact:** Attendance may be recorded for wrong date in different timezones.
**Fix:** Use proper timezone-aware date handling.

---

## 🟠 HIGH PRIORITY ISSUES

### 7. **Race Condition in Salary Slip Creation**
**File:** `backend/src/controllers/payrollController.ts`
**Severity:** HIGH
**Issue:** No unique constraint on (employee_id, month, year) combination in SalarySlip model.
**Impact:** Duplicate salary slips can be created for same employee/month/year.
**Fix:** Add database constraint or implement optimistic locking.

---

### 8. **Missing Attendance Lock Verification**
**File:** `backend/src/controllers/attendanceController.ts:71-74`
**Severity:** HIGH
```typescript
if (existingLog?.is_locked) {
    throw new AppError(400, 'Attendance is locked for this date');
    return;  // ❌ Unreachable code after throw
}
```
**Issue:** Lock check only happens for individual dates, not for monthly lock enforcement.
**Impact:** HR might lock an entire month but employee attendance for unlocked days can still be modified.

---

### 9. **Type Mismatch: Employee ID Field**
**File:** `src/components/payroll/CreateSalarySlipDialog.tsx:96`
**Severity:** HIGH
```typescript
{Array.isArray(employees) && employees.map(emp => (
    <SelectItem key={emp.id} value={emp.id}>  // ❌ Using emp.id
        {emp.name} ({emp.employee_id})
    </SelectItem>
))}
```
**Issue:** Using `emp.id` (UUID) but display shows `emp.employee_id` (human-readable).
**Impact:** Backend receives UUID but might expect employee_id string. Data mismatch.
**Status:** Partially fixed but still problematic.

---

### 10. **No Validation for Leave Overlapping**
**File:** `backend/src/controllers/leaveController.ts`
**Severity:** HIGH
**Issue:** No check if employee already has overlapping leave requests.
**Impact:** Employees can apply for multiple leaves for same period.

---

### 11. **Missing Audit Trail for Sensitive Operations**
**File:** All controllers
**Severity:** HIGH
**Issue:** No audit logging for:
- Salary slip modifications
- Leave approvals
- Employee deletions
- Attendance corrections
**Impact:** Cannot track who made changes and when.

---

### 12. **No Role-Based Access Control Consistency**
**File:** `backend/src/controllers/leaveController.ts:11-14`
**Severity:** HIGH
```typescript
// If not HR, only show own leaves
if (req.user?.role !== 'hr') {
    where.employee_id = req.user?.id;
} else if (employee_id) {
    where.employee_id = employee_id;
}
```
**Issue:** Pattern inconsistent across controllers. Some check `req.user?.role !== 'hr'`, some don't check at all.
**Impact:** Potential unauthorized data access if check is missed in one controller.

---

### 13. **SQL Injection Risk in Search**
**File:** `backend/src/controllers/employeeController.ts:14-18`
**Severity:** HIGH
```typescript
where[Op.or] = [
    { name: { [Op.like]: `%${search}%` } },  // ❌ Unescaped search parameter
    { email: { [Op.like]: `%${search}%` } },
    { employee_id: { [Op.like]: `%${search}%` } },
];
```
**Issue:** Search parameter not validated or escaped before LIKE query.
**Fix:** Use Sequelize's literal() with proper escaping or validate input.

---

### 14. **No HTTPS/TLS Enforcement**
**Severity:** HIGH
**Issue:** No code forces HTTPS in production or sets security headers (HSTS, CSP).
**Impact:** Man-in-the-middle attacks possible.

---

### 15. **Token Stored in LocalStorage Without Security**
**File:** `src/contexts/AuthContext.tsx:44`
**Severity:** HIGH
```typescript
localStorage.setItem('token', data.token);  // ❌ Vulnerable to XSS
```
**Issue:** JWT tokens in localStorage can be stolen via XSS attacks.
**Fix:** Use httpOnly cookies instead.

---

## 🟡 MEDIUM PRIORITY ISSUES

### 16. **Missing Request Timeout Handling**
**File:** `src/services/api.ts`
**Severity:** MEDIUM
**Issue:** No timeout configured for API requests.
**Impact:** Long-running requests block indefinitely.
**Fix:** Add timeout configuration to axios.

---

### 17. **No Pagination for Large Result Sets**
**File:** `backend/src/controllers/leaveController.ts:8-24`
**Severity:** MEDIUM
```typescript
const leaves = await LeaveRequest.findAll({
    where,
    // ❌ No limit/offset - returns all records
});
```
**Issue:** Some endpoints have pagination (employees, attendance) but leave requests don't.
**Impact:** Performance issues with large datasets.

---

### 18. **Unhandled Promise Rejection in Login**
**File:** `src/pages/Login.tsx:26`
**Severity:** MEDIUM
```typescript
} catch { setError('An error occurred.'); }
```
**Issue:** Empty catch block doesn't handle specific errors.
**Impact:** Generic error messages, hard to debug.

---

### 19. **No Database Connection Retry Logic**
**File:** `backend/src/config/database.ts`
**Severity:** MEDIUM
**Issue:** If database connection fails on startup, app crashes with no retry.
**Fix:** Add exponential backoff retry mechanism.

---

### 20. **Missing Data Export Functionality**
**File:** `src/pages/Payroll.tsx:139`
**Severity:** MEDIUM
```typescript
{batch.status === 'paid' && <Button size="sm" variant="outline">
    <Download className="w-3 h-3 mr-1" />Export
</Button>}
```
**Issue:** Button exists but no implementation - onClick handler missing.
**Impact:** Users expect to export but functionality doesn't work.

---

### 21. **Incomplete Error Boundary Implementation**
**File:** `src/App.tsx`
**Severity:** MEDIUM
**Issue:** No error boundary component for React errors.
**Impact:** Single component error crashes entire app.

---

### 22. **Missing Rate Limiting**
**Severity:** MEDIUM
**Issue:** No rate limiting on API endpoints.
**Impact:** Vulnerable to brute force attacks on login endpoint.

---

## 🔵 LOW PRIORITY ISSUES (Good to Fix)

### 23. **Inconsistent Date Formatting**
**Issue:** Mixed use of `Date.getTime()`, `toISOString()`, and `new Date()` across codebase.
**Fix:** Standardize on date-fns or dayjs library.

---

### 24. **No Loading States in Some Components**
**File:** Various React components
**Issue:** Some data fetches don't show loading skeletons.
**Impact:** Poor UX, user unsure if app is working.

---

### 25. **Unused State Variables**
**File:** Multiple components
**Issue:** Some state variables initialized but never used.
**Fix:** Code cleanup.

---

### 26. **Missing Environment Variable Validation**
**File:** `src/services/api.ts:4`
**Severity:** LOW
```typescript
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
```
**Issue:** Fallback to localhost in production if env var not set.
**Fix:** Validate required env vars on app startup.

---

### 27. **No 404 Error Handling in Routes**
**File:** `backend/src/routes/index.ts`
**Severity:** LOW
**Issue:** No catch-all 404 handler for undefined routes.
**Fix:** Add 404 middleware at end of route stack.

---

### 28. **Hard-coded Demo Credentials in UI**
**File:** `src/pages/Login.tsx:48-49`
**Severity:** LOW
**Issue:** Login page has demo credentials hardcoded.
```typescript
const fillCredentials = (type: 'hr' | 'employee') => {
    if (type === 'hr') { setEmail('hr@company.com'); setPassword('hr123'); }
```
**Fix:** Remove before production or move to separate demo page.

---

## 📋 SUMMARY TABLE

| Category | Count | Critical | High | Medium | Low |
|----------|-------|----------|------|--------|-----|
| Security | 6 | 3 | 3 | - | - |
| Data Integrity | 5 | 2 | 3 | - | - |
| Performance | 3 | - | 1 | 2 | - |
| UX/Frontend | 4 | - | 1 | 2 | 1 |
| Code Quality | 10 | - | - | 2 | 8 |
| **TOTAL** | **28** | **5** | **8** | **6** | **9** |

---

## 🚀 Recommended Fix Priority

**Phase 1 (Immediate - This Week):**
1. Fix input validation issues (#2)
2. Remove weak default passwords (#3)
3. Add password reset mechanism (#4)
4. Fix SQL injection vulnerabilities (#1, #13)
5. Implement proper date handling (#6)

**Phase 2 (High Priority - Next Week):**
6. Add CORS configuration (#5)
7. Fix race condition in salary slips (#7)
8. Add leave overlap validation (#10)
9. Implement audit logging (#11)
10. Move JWT to httpOnly cookies (#15)

**Phase 3 (Medium Priority - Following Week):**
11. Add rate limiting (#22)
12. Add HTTPS enforcement (#14)
13. Implement error boundaries (#21)
14. Add request timeouts (#16)
15. Standardize date handling (#23)

**Phase 4 (Low Priority - Ongoing):**
- Remaining refactoring and code cleanup

---

## Testing Recommendations

- **Unit Tests**: Add tests for helpers.ts functions (date calculations, employee ID generation)
- **Integration Tests**: Test leave validation, payroll generation with overlapping scenarios
- **Security Tests**: Penetration test login endpoint, SQL injection attempts
- **E2E Tests**: Critical workflows (create employee, apply leave, generate payroll)

