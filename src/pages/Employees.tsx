import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Employee } from '@/types/hrms';
import { Search, UserPlus, Eye, Pencil, Loader2, UserX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService, departmentService, designationService } from '@/services/apiService';
import { toast } from 'sonner';
import { TerminateEmployeeModal } from '@/components/employees/TerminateEmployeeModal';

export default function Employees() {
  const { isHR } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active'); // Default to active only
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [employeeToTerminate, setEmployeeToTerminate] = useState<any>(null);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department_id: '',
    designation_id: '',
    role: 'employee',
    status: 'active',
    password: 'password123' // Default password for new users
  });

  const queryClient = useQueryClient();

  if (!isHR) return <Navigate to="/dashboard" replace />;

  // Fetch Employees
  const { data, isLoading } = useQuery({
    queryKey: ['employees', searchQuery, departmentFilter, statusFilter],
    queryFn: async () => {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (departmentFilter !== 'all') params.department_id = departmentFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const { data } = await employeeService.getAll(params);
      return data;
    },
  });

  const employees = data?.employees || [];

  // Fetch Depts & Desigs
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => { const { data } = await departmentService.getAll(); return data; }
  });
  const { data: designations = [] } = useQuery({
    queryKey: ['designations'],
    queryFn: async () => { const { data } = await designationService.getAll(); return data; }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: employeeService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsDialogOpen(false);
      toast.success('Employee created successfully');
      resetForm();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to create employee'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => employeeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsDialogOpen(false);
      toast.success('Employee updated successfully');
      resetForm();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update employee'),
  });

  const terminateMutation = useMutation({
    mutationFn: ({ id, data }: any) => employeeService.terminate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsTerminateModalOpen(false);
      setEmployeeToTerminate(null);
      toast.success('Employee terminated successfully');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to terminate employee'),
  });

  const resetForm = () => {
    setSelectedEmployee(null);
    setFormData({
      name: '',
      email: '',
      department_id: '',
      designation_id: '',
      role: 'employee',
      status: 'active',
      password: 'password123'
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (emp: any) => {
    setSelectedEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      department_id: emp.department_id || '',
      designation_id: emp.designation_id || '',
      role: emp.role,
      status: emp.status,
      password: '' // Don't fill password on edit
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.password) delete (payload as any).password; // Don't send empty password

    if (selectedEmployee) {
      updateMutation.mutate({ id: selectedEmployee.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleTerminate = (emp: any) => {
    setEmployeeToTerminate(emp);
    setIsTerminateModalOpen(true);
  };

  const handleConfirmTerminate = (data: any) => {
    if (employeeToTerminate) {
      terminateMutation.mutate({ id: employeeToTerminate.id, data });
    }
  };

  const columns: Column<Employee>[] = [
    {
      key: 'employee',
      header: 'Employee',
      cell: (emp) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={emp.avatar} alt={emp.name} />
            <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{emp.name}</p>
            <p className="text-xs text-muted-foreground">{emp.employeeId}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', cell: (emp) => <span className="text-muted-foreground text-sm">{emp.email}</span> },
    { key: 'department', header: 'Department', cell: (emp) => <span>{emp.department?.name || 'Unknown'}</span> },
    { key: 'designation', header: 'Designation', cell: (emp) => <span className="text-muted-foreground">{emp.designation?.name || 'Unknown'}</span> },
    { key: 'status', header: 'Status', cell: (emp) => <StatusBadge status={emp.status} /> },
    {
      key: 'actions',
      header: '',
      cell: (emp) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(emp)} title="Edit">
            <Pencil className="w-4 h-4" />
          </Button>
          {emp.status !== 'terminated' && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50" onClick={() => handleTerminate(emp)} title="Terminate">
              <UserX className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
      className: 'w-[100px]',
    },
  ];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <PageHeader title="Employees" description="Manage your organization's workforce">
          <Button onClick={openCreateDialog}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </PageHeader>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl sm:text-2xl font-bold">{employees.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-xl sm:text-2xl font-bold text-success">{employees.filter((e) => e.status === 'active').length}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-sm text-muted-foreground">On Leave</p>
            <p className="text-xl sm:text-2xl font-bold text-warning">{employees.filter((e) => e.status === 'on_leave').length}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-sm text-muted-foreground">HR Staff</p>
            <p className="text-xl sm:text-2xl font-bold">{employees.filter((e) => e.role === 'hr').length}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="relative w-full sm:flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={employees}
          keyExtractor={(emp) => emp.id}
          emptyMessage="No employees found"
        />

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedEmployee ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
              <DialogDescription>
                {selectedEmployee ? 'Update employee details.' : 'Onboard a new employee to the system.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department_id}
                    onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Dept" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept: any) => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Select
                    value={formData.designation_id}
                    onValueChange={(value) => setFormData({ ...formData, designation_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Job Title" />
                    </SelectTrigger>
                    <SelectContent>
                      {designations.map((des: any) => (
                        <SelectItem key={des.id} value={des.id}>{des.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">System Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="hr">HR Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!selectedEmployee && (
                <div className="space-y-2">
                  <Label htmlFor="password">Initial Password</Label>
                  <Input
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Default: password123</p>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {selectedEmployee ? 'Update Employee' : 'Create Employee'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Terminate Employee Modal */}
        {employeeToTerminate && (
          <TerminateEmployeeModal
            open={isTerminateModalOpen}
            onOpenChange={setIsTerminateModalOpen}
            employee={employeeToTerminate}
            onConfirm={handleConfirmTerminate}
            isLoading={terminateMutation.isPending}
          />
        )}
      </div>
    </MainLayout>
  );
}
