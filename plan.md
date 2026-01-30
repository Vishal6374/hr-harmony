# HR Harmony Modernization Plan

This document outlines the roadmap for enhancing the HR Harmony system based on client feedback and modern HR requirements.

## 1. Role & Access Control Overhaul
### Admin Role Implementation
- **Goal:** Introduce a top-level `admin` role to supervise HR activities.
- **Workflow:**
    - Update `User` model role enum: `['admin', 'hr', 'employee']`.
    - **Admin:** Full access to all modules + HR account management.
    - **HR:** Manage employees, payroll, and attendance (supervised by Admin).
    - **Employee:** Self-service portal for leaves, attendance, and tasks.
- **UI:** Conditional sidebar items based on `admin` vs `hr` permissions.

## 2. Enhanced Employee Onboarding (New Page)
- **Transition from Modal to Page:** Move employee creation to `/employees/new`.
- **Comprehensive Fields:**
    - **Personal:** Mandatory Phone & Address.
    - **Financial:** Required Bank Details (Bank Name, Account Number, IFSC, Branch).
    - **Document Upload:** Direct upload portal for ID proofs, Degrees, and Contracts during onboarding.
- **Logic:** Validate bank details before allowing payroll generation.

## 3. Exit Management (Resignations)
- **Workflow:**
    1. **Submission:** Employee submits resignation request with reason and preferred last working day.
    2. **Review:** HR/Admin receives notification.
    3. **Approval:** HR/Admin approves the date and initiates the F&F (Full & Final) sequence.
    4. **Status:** Real-time tracking for the employee (`Pending` -> `Approved` -> `On Notice`).

## 4. Attendance & Global Controls
- **Customizable Clock-in Toggle:**
    - **System Setting:** `allow_self_clock_in` (Global Switch).
    - **If ON:** Employees can manual clock-in/out via their dashboard.
    - **If OFF:** "Clock In" button disappears for employees. Only HR can mark or regularize.
- **Regularization Workflow:**
    - Employee requests "Late Entry" or "Missing Punch" approval instead of direct manual entry.
    - Approval flow prevents misuse of the attendance system.

## 5. Task & Productivity Tracking
- **Daily Task Module:**
    - Hourly/Daily activity logging for all roles (HR & Employees).
    - Report generation for managers to see time allocation.
- **Meetings Module:**
    - Schedule and track internal meetings and interviews.
    - Integrated calendar view for all staff.

## 6. Leave Policy Refinement
- **Self-Service HR:** HR users can now apply for their own leaves (treated as employees in the leave context).
- **Role-Based Balances:** Policies that differ by seniority or role type.

---

### Implementation Roadmap

| Phase | Module | Target Features |
|-------|--------|-----------------|
| **1** | **Base & Roles** | Role Migration (`admin`), Auth flow updates, Plan.md. |
| **2** | **Onboarding** | New Employee Page, Bank Details, Document Upload backend. |
| **3** | **Attendance** | Self-Clock-in Toggle, Regularization Request flow. |
| **4** | **Exit Mgmt** | Resignation Module (Request + Approval flow). |
| **5** | **Tasks/Meetings**| Activity Logger & Meeting Scheduler. |
| **6** | **Polish** | Final QA, UI Consistency updates. |
