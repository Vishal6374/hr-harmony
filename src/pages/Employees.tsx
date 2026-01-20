import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { employees, departments, designations } from '@/data/mockData';
import { Employee } from '@/types/hrms';
import { Search, UserPlus, Eye, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Employees() {
  const { isHR } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  if (!isHR) {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || emp.departmentId === departmentFilter;
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getDepartmentName = (departmentId: string) => {
    return departments.find((d) => d.id === departmentId)?.name || 'Unknown';
  };

  const getDesignationName = (designationId: string) => {
    return designations.find((d) => d.id === designationId)?.name || 'Unknown';
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
    {
      key: 'email',
      header: 'Email',
      cell: (emp) => <span className="text-muted-foreground text-sm">{emp.email}</span>,
    },
    {
      key: 'department',
      header: 'Department',
      cell: (emp) => <span>{getDepartmentName(emp.departmentId)}</span>,
    },
    {
      key: 'designation',
      header: 'Designation',
      cell: (emp) => <span className="text-muted-foreground">{getDesignationName(emp.designationId)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (emp) => <StatusBadge status={emp.status} />,
    },
    {
      key: 'actions',
      header: '',
      cell: () => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
      ),
      className: 'w-[100px]',
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Employees" description="Manage your organization's workforce">
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </PageHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{employees.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-success">{employees.filter((e) => e.status === 'active').length}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-sm text-muted-foreground">On Leave</p>
            <p className="text-2xl font-bold text-warning">{employees.filter((e) => e.status === 'on_leave').length}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-sm text-muted-foreground">HR Staff</p>
            <p className="text-2xl font-bold">{employees.filter((e) => e.role === 'hr').length}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={filteredEmployees}
          keyExtractor={(emp) => emp.id}
          emptyMessage="No employees found"
        />
      </div>
    </MainLayout>
  );
}
