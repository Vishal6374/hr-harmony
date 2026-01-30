import api from './api';

// Auth Services
export const authService = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    getProfile: () =>
        api.get('/auth/profile'),
    updateProfile: (data: any) =>
        api.put('/auth/profile', data),
    changePassword: (currentPassword: string, newPassword: string) =>
        api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Dashboard Services
export const dashboardService = {
    getStats: () =>
        api.get('/dashboard/stats'),
};

// Employee Services
export const employeeService = {
    getAll: (params?: any) =>
        api.get('/employees', { params }),
    getById: (id: string) =>
        api.get(`/employees/${id}`),
    create: (data: any) =>
        api.post('/employees', data),
    update: (id: string, data: any) =>
        api.put(`/employees/${id}`, data),
    terminate: (id: string, data: any) =>
        api.post(`/employees/${id}/terminate`, data),
    delete: (id: string) =>
        api.delete(`/employees/${id}`),
    permanentDelete: (id: string) =>
        api.delete(`/employees/${id}/permanent`),
};

// Department Services
export const departmentService = {
    getAll: (params?: any) =>
        api.get('/departments', { params }),
    getById: (id: string) =>
        api.get(`/departments/${id}`),
    create: (data: any) =>
        api.post('/departments', data),
    update: (id: string, data: any) =>
        api.put(`/departments/${id}`, data),
    delete: (id: string) =>
        api.delete(`/departments/${id}`),
};

// Designation Services
export const designationService = {
    getAll: (params?: any) =>
        api.get('/designations', { params }),
    getById: (id: string) =>
        api.get(`/designations/${id}`),
    create: (data: any) =>
        api.post('/designations', data),
    update: (id: string, data: any) =>
        api.put(`/designations/${id}`, data),
    delete: (id: string) =>
        api.delete(`/designations/${id}`),
};

// Attendance Services
export const attendanceService = {
    getLogs: (params?: any) =>
        api.get('/attendance', { params }),
    getSummary: (params: any) =>
        api.get('/attendance/summary', { params }),
    mark: (data: any) =>
        api.post('/attendance/mark', data),
    update: (id: string, data: any) =>
        api.put(`/attendance/update/${id}`, data),
    lock: (month: number, year: number) =>
        api.post('/attendance/lock', { month, year }),
    getSettings: () =>
        api.get('/attendance/settings'),
    updateSettings: (data: any) =>
        api.put('/attendance/settings', data),
};

// Leave Services
export const leaveService = {
    getRequests: (params?: any) =>
        api.get('/leaves/requests', { params }),
    getBalances: (params?: any) =>
        api.get('/leaves/balances', { params }),
    apply: (data: any) =>
        api.post('/leaves/apply', data),
    approve: (id: string, remarks?: string) =>
        api.post(`/leaves/approve/${id}`, { remarks }),
    reject: (id: string, remarks: string) =>
        api.post(`/leaves/reject/${id}`, { remarks }),
    cancel: (id: string) =>
        api.post(`/leaves/cancel/${id}`),
};

// Leave Limits Services
export const leaveLimitService = {
    get: () =>
        api.get('/leave-limits'),
    update: (data: { casual_leave?: number; sick_leave?: number; earned_leave?: number }) =>
        api.put('/leave-limits', data),
};

// Payroll Services
export const payrollService = {
    // Get batches
    getBatches: () =>
        api.get('/payroll/batches'),

    // Get salary slips
    getSlips: (params?: any) =>
        api.get('/payroll/slips', { params }),

    // Preview payroll before processing
    preview: (data: { month: number; year: number; employee_ids: string[] }) =>
        api.post('/payroll/preview', data),

    // Process payroll
    process: (data: {
        month: number;
        year: number;
        employee_ids: string[];
        bonuses?: Record<string, number>;
        deductions?: Record<string, number>;
    }) =>
        api.post('/payroll/process', data),

    // Mark batch as paid
    markPaid: (id: string) =>
        api.post(`/payroll/batches/${id}/mark-paid`),

    // Salary Structure
    getSalaryStructures: () =>
        api.get('/payroll-config/salary-structures'),
    createSalaryStructure: (data: any) =>
        api.post('/payroll-config/salary-structures', data),
    updateSalaryStructure: (id: string, data: any) =>
        api.put(`/payroll-config/salary-structures/${id}`, data),

    // Pay Groups
    getPayGroups: () =>
        api.get('/payroll-config/pay-groups'),
    createPayGroup: (data: any) =>
        api.post('/payroll-config/pay-groups', data),
    updatePayGroup: (id: string, data: any) =>
        api.put(`/payroll-config/pay-groups/${id}`, data),

    // Tax Slabs
    getTaxSlabs: (params?: any) =>
        api.get('/payroll-config/tax-slabs', { params }),
    createTaxSlab: (data: any) =>
        api.post('/payroll-config/tax-slabs', data),
    updateTaxSlab: (id: string, data: any) =>
        api.put(`/payroll-config/tax-slabs/${id}`, data),

    // Investment Declarations
    getInvestmentDeclarations: (params?: any) =>
        api.get('/payroll-config/investment-declarations', { params }),
    createInvestmentDeclaration: (data: any) =>
        api.post('/payroll-config/investment-declarations', data),
    submitInvestmentDeclaration: (id: string) =>
        api.post(`/payroll-config/investment-declarations/${id}/submit`),
    reviewInvestmentDeclaration: (id: string, status: string, remarks?: string) =>
        api.post(`/payroll-config/investment-declarations/${id}/review`, { status, remarks }),

    // Loan/Advance
    getLoanAdvances: (params?: any) =>
        api.get('/payroll-config/loan-advances', { params }),
    createLoanAdvance: (data: any) =>
        api.post('/payroll-config/loan-advances', data),
    approveLoanAdvance: (id: string, remarks?: string) =>
        api.post(`/payroll-config/loan-advances/${id}/approve`, { remarks }),
    rejectLoanAdvance: (id: string, remarks: string) =>
        api.post(`/payroll-config/loan-advances/${id}/reject`, { remarks }),

    // F&F Settlement
    getFFSettlements: (params?: any) =>
        api.get('/payroll-config/ff-settlements', { params }),
    createFFSettlement: (data: any) =>
        api.post('/payroll-config/ff-settlements', data),
    approveFFSettlement: (id: string) =>
        api.post(`/payroll-config/ff-settlements/${id}/approve`),
    markFFSettlementPaid: (id: string) =>
        api.post(`/payroll-config/ff-settlements/${id}/mark-paid`),

    // Audit Trail
    getAuditTrail: (params?: any) =>
        api.get('/payroll-config/audit-trail', { params }),

    // Hold/Release Salary
    holdSalary: (id: string, remarks?: string) =>
        api.post(`/payroll-config/hold-salary/${id}`, { remarks }),
    releaseSalary: (id: string) =>
        api.post(`/payroll-config/release-salary/${id}`),

    // Bank Advice
    generateBankAdvice: (batch_id: string, format: string) =>
        api.post('/payroll-config/bank-advice', { batch_id, format }),

    // Tax Calculation
    calculateTax: (params: any) =>
        api.get('/payroll-config/calculate-tax', { params }),
};

// Reimbursement Services
export const reimbursementService = {
    getAll: (params?: any) =>
        api.get('/reimbursements', { params }),
    submit: (data: any) =>
        api.post('/reimbursements/submit', data),
    approve: (id: string, remarks?: string) =>
        api.post(`/reimbursements/approve/${id}`, { remarks }),
    reject: (id: string, remarks: string) =>
        api.post(`/reimbursements/reject/${id}`, { remarks }),
};

// Complaint Services
export const complaintService = {
    getAll: (params?: any) =>
        api.get('/complaints', { params }),
    submit: (data: any) =>
        api.post('/complaints/submit', data),
    respond: (id: string, response: string, status?: string) =>
        api.post(`/complaints/respond/${id}`, { response, status }),
    close: (id: string) =>
        api.post(`/complaints/close/${id}`),
};

// Policy Services
export const policyService = {
    getAll: (params?: any) =>
        api.get('/policies', { params }),
    getById: (id: string) =>
        api.get(`/policies/${id}`),
    create: (data: any) =>
        api.post('/policies', data),
    update: (id: string, data: any) =>
        api.put(`/policies/${id}`, data),
    delete: (id: string) =>
        api.delete(`/policies/${id}`),
};

// Holiday Services
export const holidayService = {
    getAll: (params?: any) =>
        api.get('/holidays', { params }),
    getById: (id: string) =>
        api.get(`/holidays/${id}`),
    create: (data: any) =>
        api.post('/holidays', data),
    update: (id: string, data: any) =>
        api.put(`/holidays/${id}`, data),
    delete: (id: string) =>
        api.delete(`/holidays/${id}`),
};

// Employee Document Services
export const employeeDocumentService = {
    getDocuments: (employeeId: string) =>
        api.get(`/employees/${employeeId}/documents`),
    uploadDocument: (employeeId: string, file: File, documentType: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);
        return api.post(`/employees/${employeeId}/documents`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    getDocument: (documentId: string) =>
        api.get(`/employees/documents/${documentId}`),
    deleteDocument: (documentId: string) =>
        api.delete(`/employees/documents/${documentId}`),
};

// Resignation Services
export const resignationService = {
    getRequests: (params?: any) =>
        api.get('/resignations', { params }),
    apply: (data: any) =>
        api.post('/resignations/apply', data),
    approve: (id: string, data: { approved_last_working_day: string; hr_remarks?: string }) =>
        api.post(`/resignations/${id}/approve`, data),
    reject: (id: string, hr_remarks: string) =>
        api.post(`/resignations/${id}/reject`, { hr_remarks }),
    withdraw: (id: string) =>
        api.post(`/resignations/${id}/withdraw`),
};
