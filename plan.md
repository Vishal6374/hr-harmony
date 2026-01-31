# HR Harmony Implementation Plan - Remaining Gaps

This plan tracks the implementation of remaining requirements to align the project with the official HRMS Implementation Plan.

## 1. User Roles & Access Control (RBAC)
- [x] Implement 'admin' role in backend and frontend.
- [x] Verify `admin` role has full access to all HR functionalities.
- [x] Audit application routes and ensure appropriate middleware (`requireHR`, `requireAdmin`, `requireSelfOrHR`) is applied.
- [x] Implement RBAC for Task management (HR can view all, Employee only self).
- [x] Ensure sensitive payroll/employee data is protected by `requireHR` or `requireAdmin`.

## 2. Employee Management & Onboarding
- [x] Multi-step onboarding form for HR (AddEmployee.tsx).
- [x] Add `onboarding_status` to User model (`'pending'`, `'approved'`, `'locked'`).
- [x] Implement onboarding document upload logic for employees in Profile.
- [x] Implement HR approval workflow for employee onboarding data.
- [x] Implement field locking in Profile after HR approval.
- [x] **Employee Details Sidebar**: Implement a sliding sheet to view complete employee details from the Employee List.

## 3. Attendance Management & Regularization
- [x] Biometric-like automatic logs (current system).
- [x] Implement **Attendance Regularization Request** model and API.
- [x] UI for Employees to submit regularization requests.
- [x] UI for HR/Admin to approve/reject regularization requests.
- [x] Restrict manual 'Clock In/Out' based on company policy (configurable).

## 4. Time Entry / Daily Task Management
- [x] Create **Daily Tasks** model (Task Name, Description, Duration, Status).
- [x] API for logging multiple task entries per day.
- [x] Dashboard view for employees to manage their tasks.
- [x] HR view to monitor task entries across employees.
- [x] Implement task reporting for HR (filter by employee and date range).

## 5. Meetings Module
- [x] Create **Meetings** model (Title, Date, Time, URL, Attendees).
- [x] API for scheduling meetings.
- [x] HR UI for meeting room/schedule management.
- [x] Employee UI for viewing and joining meetings.

## 6. Exit Management
- [x] Submit resignation (Employee).
- [x] Approve/Reject with Last Working Day (HR).
- [x] Status tracking in Profile.

## 7. Payroll - Statutory Compliance (PF & ESI)
- [x] **PF Integration**: Automate PF calculation (12% of basic salary) in payroll processing.
- [x] **ESI Integration**: Automate ESI calculation (0.75% for employee) for eligible employees.
- [x] Update Salary Slip generation to include PF and ESI breakdowns.
- [x] Verify salary structure automation logic.
- [x] Ensure payslip download only for authorized users (Employee themselves or HR/Admin).

---

### Implementation Roadmap

| Phase | Module | Target Features | Status |
|-------|--------|-----------------|--------|
| **1** | **Base & Roles** | Role Migration (`admin`), Auth flow updates. | Done |
| **2** | **Onboarding** | New Employee Page, Bank Details, Document Upload. | Done |
| **3** | **Attendance** | Self-Clock-in Toggle, Regularization Request flow. | Done |
| **4** | **Exit Mgmt** | Resignation Module (Request + Approval flow). | Done |
| **5** | **Tasks/Meetings**| Activity Logger & Meeting Scheduler. | Done |
| **6** | **Payroll & RBAC**| PF/ESI Integration, RBAC refinement, Employee Sidebar. | **Done** |
| **7** | **Polish** | Final QA, UI Consistency updates. | Pending |
