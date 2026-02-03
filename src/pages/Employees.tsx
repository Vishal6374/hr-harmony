import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Employee } from '@/types/hrms';
import { Search, UserPlus, Eye, Pencil, UserX, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService, departmentService } from '@/services/apiService';
import { toast } from 'sonner';
import { TerminateEmployeeModal } from '@/components/employees/TerminateEmployeeModal';
import { EmployeeDetailsSheet } from '@/components/employees/EmployeeDetailsSheet';
import { PageLoader } from '@/components/ui/page-loader';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings2 } from 'lucide-react';

export default function Employees() {
  const [currentDetailsEmployee, setCurrentDetailsEmployee] = useState<Employee | null>(null);
  const { settings, updateSettings } = useSystemSettings();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active'); // Default to active only
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [employeeToTerminate, setEmployeeToTerminate] = useState<any>(null);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);

  const queryClient = useQueryClient();

  if (!user || (!isAdmin && !user.role?.includes('hr') && user.role !== 'hr')) return <Navigate to="/dashboard" replace />;

  const canManageEmployees = isAdmin || (user.role === 'hr' && settings?.hr_can_manage_employees);

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

  // Fetch Depts
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => { const { data } = await departmentService.getAll(); return data; }
  });

  const terminateMutation = useMutation({
    mutationFn: ({ id, data }: any) => employeeService.update(id, { ...data, status: 'terminated' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsTerminateModalOpen(false);
      setEmployeeToTerminate(null);
      toast.success('Employee terminated successfully');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to terminate employee'),
  });

  const handleTerminate = (data: any) => {
    if (employeeToTerminate) {
      terminateMutation.mutate({ id: employeeToTerminate.id, data });
    }
  };

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      header: 'Employee',
      cell: (emp) => (
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setCurrentDetailsEmployee(emp); setIsDetailsSheetOpen(true); }}>
          <Avatar className="h-10 w-10 border border-primary/10 shadow-sm">
            <AvatarImage src={emp.avatar_url} />
            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">{emp.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-sm tracking-tight">{emp.name}</p>
            <p className="text-xs text-muted-foreground font-medium">{emp.employee_id} • {emp.designation?.name || 'N/A'}</p>
          </div>
        </div>
      ),
    },
    { key: 'department', header: 'Department', cell: (emp) => <span className="text-sm font-medium">{emp.department?.name || 'N/A'}</span> },
    { key: 'role', header: 'Role', cell: (emp) => <span className="capitalize text-xs font-semibold px-2 py-1 bg-muted rounded-md">{emp.role}</span> },
    { key: 'status', header: 'Status', cell: (emp) => <StatusBadge status={emp.status} /> },
    {
      key: 'actions',
      header: '',
      cell: (emp) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => { setCurrentDetailsEmployee(emp); setIsDetailsSheetOpen(true); }}>
            <Eye className="w-4 h-4" />
          </Button>
          {canManageEmployees && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50" onClick={() => navigate(`/employees/edit/${emp.id}`)}>
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {canManageEmployees && emp.status !== 'terminated' && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => { setEmployeeToTerminate(emp); setIsTerminateModalOpen(true); }}>
              <UserX className="w-4 h-4" />
            </Button>
          )}
          {canManageEmployees && emp.status === 'terminated' && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:bg-success/10" title="Reactivate (Not implemented)">
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) return <PageLoader />;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Employees" description="Manage your team members and their information.">
          <div className="flex items-center gap-4">
            {isAdmin && (
              <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-xl border border-primary/10 shadow-sm mr-2">
                <Settings2 className="w-4 h-4 text-primary/60" />
                <div className="flex items-center gap-2">
                  <Label htmlFor="hr-manage" className="text-xs font-bold whitespace-nowrap cursor-pointer">HR Can Edit</Label>
                  <Switch
                    id="hr-manage"
                    checked={settings?.hr_can_manage_employees}
                    onCheckedChange={(checked) => updateSettings({ hr_can_manage_employees: checked })}
                  />
                </div>
              </div>
            )}
            {canManageEmployees && (
              <Button onClick={() => navigate('/employees/new')} className="shadow-lg shadow-primary/20">
                <UserPlus className="w-4 h-4 mr-2" /> Add Employee
              </Button>
            )}
          </div>
        </PageHeader>

        <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between p-4 bg-card border rounded-2xl shadow-sm">
          <div className="flex flex-1 items-center gap-4 w-full">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-muted/50 border-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-10 bg-muted/50 border-none"><SelectValue placeholder="All Depts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px] h-10 bg-muted/50 border-none"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={employees}
          keyExtractor={(emp) => emp.id}
          emptyMessage="No employees found"
        />

        <TerminateEmployeeModal
          open={isTerminateModalOpen}
          onOpenChange={setIsTerminateModalOpen}
          employee={employeeToTerminate}
          onConfirm={handleTerminate}
          isLoading={terminateMutation.isPending}
        />

        {currentDetailsEmployee && (
          <EmployeeDetailsSheet
            open={isDetailsSheetOpen}
            onOpenChange={setIsDetailsSheetOpen}
            employee={currentDetailsEmployee}
          />
        )}
      </div>
    </MainLayout>
  );
}
