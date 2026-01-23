# HR Harmony

A modern, comprehensive Human Resource Management System (HRMS) built for efficient workforce management.

**Tenancy: Single**

## 🚀 Features

### 👥 Employee Management
- Complete employee lifecycle management (Onboarding to Termination).
- Profile management with personal and professional details.
- Department and Designation organization.
- Active/Inactive/Terminated status tracking.

### 📅 Attendance & Leave
- **Smart Clock-In/Out:** Real-time tracking with auto-status calculation (Present/Half Day/Absent based on hours).
- **Overnight Shift Support:** Accurately calculates work hours even for shifts crossing midnight (e.g., 6 PM - 2 AM).
- **Auto-Absent Scheduler:** Automatically marks employees absent at 5 PM if they haven't clocked in (skips Sundays, Holidays, and Leaves).
- **Leave Management:**
  - Apply for Sick, Casual, or Earned leaves.
  - HR Approval Workflow (Approve/Reject).
  - **Dynamic Limits:** HR can set annual global limits (e.g., 12 Casual, 15 Earned).
  - **Live Sync:** Balances automatically sync with HR policies.

### 💰 Payroll
- **One-Click Processing:** Generate payroll for all employees based on attendance and salary.
- **Accuracy:** Auto-calculates deductions for unseen absences (`loss_of_pay`).
- **Payslips:** Generate and view detailed payslips with earnings and deductions breakdown.
- **Workflow:** Process -> Review -> Finalize -> Mark as Paid.

### 💸 Reimbursements
- Submit expense claims (Travel, Equipment, etc.).
- Categorized tracking (Pending, Approved, Rejected).
- Proof attachment support (URLs).

### 📊 Dashboard
- **Role-Based Views:** Tailored dashboards for HR and Employees.
- **Real-Time Insights:** Attendance trends, Payroll summaries, and Leave stats.
- **Charts:** Interactive visualizations for Work Hours (with minute-level precision) and Department distribution.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 (Vite)
- **Language:** TypeScript
- **Styling:** TailwindCSS, Shadcn UI
- **State/Data:** TanStack Query (React Query)
- **Routing:** React Router DOM

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL
- **ORM:** Sequelize
- **Authentication:** JWT (JSON Web Tokens)
- **Scheduling:** node-cron

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- MySQL Server

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd hr-harmony
   ```

2. **Frontend Setup**
   ```bash
   npm install
   npm run dev
   ```

3. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Configure .env with database credentials
   npm run db:sync  # Initialize database
   npm run db:seed  # Optional: Seed initial data
   npm run dev
   ```

## 🔒 Security & Architecture
- **Authentication:** Secure JWT-based auth with role-based access control (RBAC).
- **Architecture:** Monorepo structure separating Client and Server.
- **Tenancy:** Single Tenant Architecture.
