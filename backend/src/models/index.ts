import User from './User';
import Department from './Department';
import Designation from './Designation';
import AttendanceLog from './AttendanceLog';
import AttendanceSettings from './AttendanceSettings';
import LeaveRequest from './LeaveRequest';
import LeaveBalance from './LeaveBalance';
import LeaveLimit from './LeaveLimit';
import PayrollBatch from './PayrollBatch';
import SalarySlip from './SalarySlip';
import Reimbursement from './Reimbursement';
import Complaint from './Complaint';
import Policy from './Policy';
import Holiday from './Holiday';
import AuditLog from './AuditLog';
import EmployeeDocument from './EmployeeDocument';
// Temporarily disabled to debug server crash
// import SalaryStructure from './SalaryStructure';
// import PayGroup from './PayGroup';
// import TaxSlab from './TaxSlab';
// import InvestmentDeclaration from './InvestmentDeclaration';
// import LoanAdvance from './LoanAdvance';
// import FFSettlement from './FFSettlement';
// import PayrollAudit from './PayrollAudit';

// Define all model relationships

// User - Department relationship
User.belongsTo(Department, { foreignKey: 'department_id', as: 'department', constraints: false });
Department.hasMany(User, { foreignKey: 'department_id', as: 'employees', constraints: false });

// User - Designation relationship
User.belongsTo(Designation, { foreignKey: 'designation_id', as: 'designation', constraints: false });
Designation.hasMany(User, { foreignKey: 'designation_id', as: 'employees', constraints: false });

// User - User (Reporting Manager) relationship
User.belongsTo(User, { foreignKey: 'reporting_manager_id', as: 'reportingManager', constraints: false });
User.hasMany(User, { foreignKey: 'reporting_manager_id', as: 'reportees', constraints: false });

// Department - User (Manager) relationship
Department.belongsTo(User, { foreignKey: 'manager_id', as: 'manager', constraints: false });

// Designation - Department relationship
Designation.belongsTo(Department, { foreignKey: 'department_id', as: 'department', constraints: false });
Department.hasMany(Designation, { foreignKey: 'department_id', as: 'designations', constraints: false });

// AttendanceLog - User relationship
AttendanceLog.belongsTo(User, { foreignKey: 'employee_id', as: 'employee', constraints: false });
User.hasMany(AttendanceLog, { foreignKey: 'employee_id', as: 'attendanceLogs', constraints: false });

// LeaveRequest - User relationship
LeaveRequest.belongsTo(User, { foreignKey: 'employee_id', as: 'employee', constraints: false });
User.hasMany(LeaveRequest, { foreignKey: 'employee_id', as: 'leaveRequests', constraints: false });

LeaveRequest.belongsTo(User, { foreignKey: 'approved_by', as: 'approver', constraints: false });

// LeaveBalance - User relationship
LeaveBalance.belongsTo(User, { foreignKey: 'employee_id', as: 'employee', constraints: false });
User.hasMany(LeaveBalance, { foreignKey: 'employee_id', as: 'leaveBalances', constraints: false });

// PayrollBatch - User relationship
PayrollBatch.belongsTo(User, { foreignKey: 'processed_by', as: 'processor', constraints: false });

// SalarySlip - User relationship
SalarySlip.belongsTo(User, { foreignKey: 'employee_id', as: 'employee', constraints: false });
User.hasMany(SalarySlip, { foreignKey: 'employee_id', as: 'salarySlips', constraints: false });

// SalarySlip - PayrollBatch relationship
SalarySlip.belongsTo(PayrollBatch, { foreignKey: 'batch_id', as: 'batch', constraints: false });
PayrollBatch.hasMany(SalarySlip, { foreignKey: 'batch_id', as: 'salarySlips', constraints: false });

// Reimbursement - User relationship
Reimbursement.belongsTo(User, { foreignKey: 'employee_id', as: 'employee', constraints: false });
User.hasMany(Reimbursement, { foreignKey: 'employee_id', as: 'reimbursements', constraints: false });

Reimbursement.belongsTo(User, { foreignKey: 'approved_by', as: 'approver', constraints: false });

// Reimbursement - PayrollBatch relationship
Reimbursement.belongsTo(PayrollBatch, { foreignKey: 'payroll_batch_id', as: 'payrollBatch', constraints: false });
PayrollBatch.hasMany(Reimbursement, { foreignKey: 'payroll_batch_id', as: 'reimbursements', constraints: false });

// Complaint - User relationship
Complaint.belongsTo(User, { foreignKey: 'employee_id', as: 'employee', constraints: false });
User.hasMany(Complaint, { foreignKey: 'employee_id', as: 'complaints', constraints: false });

Complaint.belongsTo(User, { foreignKey: 'responded_by', as: 'responder', constraints: false });

// AuditLog - User relationship
AuditLog.belongsTo(User, { foreignKey: 'performed_by', as: 'performer', constraints: false });

// Temporarily disabled to debug server crash
/*
// PayGroup - SalaryStructure relationship
PayGroup.belongsTo(SalaryStructure, { foreignKey: 'salary_structure_id', as: 'salaryStructure', constraints: false });

// InvestmentDeclaration - User relationship
InvestmentDeclaration.belongsTo(User, { foreignKey: 'employee_id', as: 'employee', constraints: false });
InvestmentDeclaration.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer', constraints: false });

// LoanAdvance - User relationship
LoanAdvance.belongsTo(User, { foreignKey: 'employee_id', as: 'employee', constraints: false });
LoanAdvance.belongsTo(User, { foreignKey: 'approved_by', as: 'approver', constraints: false });

// FFSettlement - User relationship
FFSettlement.belongsTo(User, { foreignKey: 'employee_id', as: 'employee', constraints: false });
FFSettlement.belongsTo(User, { foreignKey: 'processed_by', as: 'processor', constraints: false });

// PayrollAudit - User relationship
PayrollAudit.belongsTo(User, { foreignKey: 'changed_by', as: 'changedBy', constraints: false });
*/

// EmployeeDocument - User relationships
EmployeeDocument.belongsTo(User, { foreignKey: 'employee_id', as: 'employee', constraints: false });
User.hasMany(EmployeeDocument, { foreignKey: 'employee_id', as: 'documents', constraints: false });
EmployeeDocument.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader', constraints: false });

export {
    User,
    Department,
    Designation,
    AttendanceLog,
    AttendanceSettings,
    LeaveRequest,
    LeaveBalance,
    LeaveLimit,
    PayrollBatch,
    SalarySlip,
    Reimbursement,
    Complaint,
    Policy,
    Holiday,
    AuditLog,
    EmployeeDocument,
    // Temporarily disabled
    // SalaryStructure,
    // PayGroup,
    // TaxSlab,
    // InvestmentDeclaration,
    // LoanAdvance,
    // FFSettlement,
    // PayrollAudit,
};

export default {
    User,
    Department,
    Designation,
    AttendanceLog,
    AttendanceSettings,
    LeaveRequest,
    LeaveBalance,
    LeaveLimit,
    PayrollBatch,
    SalarySlip,
    Reimbursement,
    Complaint,
    Policy,
    Holiday,
    AuditLog,
    EmployeeDocument,
    // Temporarily disabled
    // SalaryStructure,
    // PayGroup,
    // TaxSlab,
    // InvestmentDeclaration,
    // LoanAdvance,
    // FFSettlement,
    // PayrollAudit,
};
