export type UserRole = 'admin' | 'hr' | 'employee';

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  departmentId: string;
  designationId: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  managerId?: string;
  employeeCount: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Designation {
  id: string;
  name: string;
  departmentId: string;
  level: number;
  salaryRangeMin?: number;
  salaryRangeMax?: number;
  isActive: boolean;
}

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  dateOfJoining: Date;
  departmentId: string;
  designationId: string;
  reportingManagerId?: string;
  salary: number;
  role: UserRole;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  address: string;
  avatar?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  department?: Department;
  designation?: Designation;
}

export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'on_leave' | 'holiday' | 'weekend';

export interface AttendanceLog {
  id: string;
  employeeId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  status: AttendanceStatus;
  workHours?: number;
  notes?: string;
  isLocked: boolean;
}

export type LeaveType = 'casual' | 'sick' | 'earned' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvedAt?: Date;
  remarks?: string;
  createdAt: Date;
}

export interface LeaveBalance {
  employeeId: string;
  leaveType: LeaveType;
  total: number;
  used: number;
  remaining: number;
  year: number;
}

export type PayrollStatus = 'draft' | 'processed' | 'paid' | 'cancelled';

export interface PayrollBatch {
  id: string;
  month: number;
  year: number;
  status: PayrollStatus;
  total_employees: number;
  total_amount: number;
  processed_by?: string;
  processed_at?: Date;
  paid_at?: Date;
}

export interface SalarySlip {
  id: string;
  employee_id: string;
  batch_id: string;
  month: number;
  year: number;
  basic_salary: number;
  hra: number;
  da: number;
  reimbursements: number;
  deductions: { pf: number; tax: number; loss_of_pay: number; other: number; };
  gross_salary: number;
  net_salary: number;
  status: PayrollStatus;
  generated_at: Date;
}

export type ReimbursementCategory = 'travel' | 'event' | 'medical' | 'equipment' | 'other';
export type ReimbursementStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface Reimbursement {
  id: string;
  employeeId: string;
  category: ReimbursementCategory;
  amount: number;
  description: string;
  receiptUrl?: string;
  status: ReimbursementStatus;
  approvedBy?: string;
  approvedAt?: Date;
  remarks?: string;
  payrollBatchId?: string;
  createdAt: Date;
}

export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Complaint {
  id: string;
  employeeId: string;
  subject: string;
  description: string;
  category: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  isAnonymous: boolean;
  response?: string;
  respondedBy?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Policy {
  id: string;
  title: string;
  category: string;
  version: string;
  documentUrl: string;
  isActive: boolean;
  effectiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Holiday {
  id: string;
  name: string;
  date: Date;
  type: 'national' | 'regional' | 'company';
  isOptional: boolean;
  year: number;
}

export type ResignationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

export interface Resignation {
  id: string;
  employeeId: string;
  reason: string;
  preferredLastWorkingDay: Date;
  approvedLastWorkingDay?: Date;
  status: ResignationStatus;
  hrRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface AttendanceSettings {
  id: string;
  standardWorkHours: number;
  halfDayThreshold: number;
  allowSelfClockIn: boolean;
}
