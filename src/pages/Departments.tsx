import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { departments, employees } from '@/data/mockData';
import { Department } from '@/types/hrms';
import { Plus, Search, Building2, Users, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Departments() {
  const { isHR } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isHR) {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: Column<Department>[] = [
    {
      key: 'name',
      header: 'Department',
      cell: (dept) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{dept.name}</p>
            <p className="text-xs text-muted-foreground">{dept.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'employees',
      header: 'Employees',
      cell: (dept) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span>{dept.employeeCount}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (dept) => <StatusBadge status={dept.isActive ? 'active' : 'inactive'} />,
    },
    {
      key: 'created',
      header: 'Created',
      cell: (dept) => (
        <span className="text-muted-foreground text-sm">
          {format(new Date(dept.createdAt), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: () => (
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="w-4 h-4" />
        </Button>
      ),
      className: 'w-[60px]',
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Departments" description="Manage company departments">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Department
          </Button>
        </PageHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-sm text-muted-foreground">Total Departments</p>
            <p className="text-2xl font-bold">{departments.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold">{departments.filter((d) => d.isActive).length}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-sm text-muted-foreground">Total Employees</p>
            <p className="text-2xl font-bold">{departments.reduce((sum, d) => sum + d.employeeCount, 0)}</p>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredDepartments}
          keyExtractor={(dept) => dept.id}
          emptyMessage="No departments found"
        />
      </div>
    </MainLayout>
  );
}
