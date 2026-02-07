# HRMS Implementation Plan

## 1. System / UI / Sidebar
- [x] **System Customization**: Improve UI/Layout, fields are too wide.
- [x] **System Logs**: Refresh button should refresh the right-side tab or data.
- [x] **Sidebar**: Add split line above the Logout button area.

## 2. Attendance / Meetings / Admin
- [x] **Attendance**: Team Attendance Calendar - Show Present (P), Absent (A), Leave (L) counts with color indicators (P: Green, L: Blue, A: Red).
- [x] **Meetings**: "Upcoming Meetings" and "Past History" should be on the same level (same row).
- [x] **Admin - Employees**: Add HR can edit toggle and custom confirmation popup.
- [x] **Admin - Attendance**: Remove "My Attendance" option for admin.
- [x] **Profile**: Remove the line below details in Employee Tab.

## 3. Profile / HR Dashboard / Designation
- [x] **Profile Page**:
    - [x] Active tag should be green.
    - [x] Profile locked text: Show only on hover of edit icon, change text to "Contact HR for changes".
- [x] **HR Dashboard**:
    - [x] KPI Cards: Remove bold from all values.
    - [x] Payroll status: Use ✔️ and ❌.
- [x] **Leave Map**: Add color indicators for CL, Sick, and Casual.
- [x] **Designations**:
    - [x] Align all department filters to the right end.
    - [x] Active tag should be green.

## 4. Employee / Session / Policy
- [x] **Session Handling**: Update session timeout to 12 days (Backend env).
- [x] **Session Handling**: Check if session logs out automatically. (Implemented proactive token validation)
- [x] **Employee Dashboard**:
    - [x] KPI Cards: Use text values for "Today Status" and "Performance".
    - [x] Today Status: Show ❗ if not checked in, ✔️ if done.
    - [x] Remove "Performance" KPI.
    - [x] Remove bold from KPI values.
    - [x] Change "Meetings" title color from blue to black.
- [x] **Payroll Page**:
    - [x] Remove one of the duplicate headings.
    - [x] Round all calculation values.
    - [x] Add specific checkmark (✔️) and cross (❌) for status.
- [x] **Policy Page**: Align all category buttons to the right end.
