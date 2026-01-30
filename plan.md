# HR Harmony Implementation Plan - Remaining Gaps

This plan tracks the implementation of remaining requirements to align the project with the official HRMS Implementation Plan.

## 1. User Roles & Access Control
- [x] Implement 'admin' role in backend and frontend.
- [ ] Verify `admin` role has full access to all HR functionalities.
- [ ] Audit logs implementation check for all critical modules (Attendance, Leave, Payroll).

## 2. Employee Management & Onboarding
- [x] Multi-step onboarding form for HR (AddEmployee.tsx).
- [ ] Add `onboarding_status` to User model (`'pending'`, `'approved'`, `'locked'`).
- [ ] Implement onboarding document upload logic for employees in Profile.
- [ ] Implement HR approval workflow for employee onboarding data.
- [ ] Implement field locking in Profile after HR approval.

## 3. Attendance Management & Regularization
- [x] Biometric-like automatic logs (current system).
- [ ] Implement **Attendance Regularization Request** model and API.
- [ ] UI for Employees to submit regularization requests.
- [ ] UI for HR/Admin to approve/reject regularization requests.
- [ ] Restrict manual 'Clock In/Out' based on company policy (configurable).

## 4. Time Entry / Daily Task Management (Mandatory)
- [ ] Create **Daily Tasks** model (Task Name, Description, Duration, Status).
- [ ] API for logging multiple task entries per day.
- [ ] Dashboard view for employees to manage their tasks.
- [ ] HR view to monitor task entries across employees.

## 5. Meetings Module
- [ ] Create **Meetings** model (Title, Date, Time, URL, Attendees).
- [ ] API for scheduling meetings.
- [ ] HR UI for meeting room/schedule management.
- [ ] Employee UI for viewing and joining meetings.

## 6. Exit Management
- [x] Submit resignation (Employee).
- [x] Approve/Reject with Last Working Day (HR).
- [x] Status tracking in Profile.

## 7. Configuration & Compliance
- [ ] Verify salary structure automation logic.
- [ ] Ensure payslip download only for employees.
- [x] Add system info/branding configuration.

---

## checklist for immediate next steps:

### Phase 1: Onboarding and Audit
- [ ] Update `User` model with `onboarding_status`.
- [ ] Add `Resignations` route to `App.tsx`.
- [ ] Implement Document Approval in HR view.

### Phase 2: Attendance Regularization
- [ ] New model: `RegularizationRequest`.
- [ ] Frontend: "Request Correction" button on Attendance page.

### Phase 3: Daily Tasks (Priority)
- [ ] New model: `TaskLog`.
- [ ] New Page: `Tasks.tsx`.

### Phase 4: Meetings
- [ ] New model: `Meeting`.
- [ ] New Page: `Meetings.tsx`.
