import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { designations, departments } from '@/data/mockData';
import { Designation } from '@/types/hrms';
import { Plus, Search, Briefcase, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Designations() {
  const { isHR } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  if (!isHR) {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredDesignations = designations.filter((des) => {
    const matchesSearch = des.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || des.departmentId === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const getDepartmentName = (departmentId: string) => {
    const dept = departments.find((d) => d.id === departmentId);
    return dept?.name || 'Unknown';
  };

  const columns: Column<Designation>[] = [
    {
      key: 'name',
      header: 'Designation',
      cell: (des) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="font-medium">{des.name}</p>
            <p className="text-xs text-muted-foreground">Level {des.level}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      cell: (des) => <span>{getDepartmentName(des.departmentId)}</span>,
    },
    {
      key: 'salaryRange',
      header: 'Salary Range',
      cell: (des) => (
        <span className="text-muted-foreground">
          {des.salaryRangeMin && des.salaryRangeMax
            ? `$${des.salaryRangeMin.toLocaleString()} - $${des.salaryRangeMax.toLocaleString()}`
            : 'Not Set'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (des) => <StatusBadge status={des.isActive ? 'active' : 'inactive'} />,
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
        <PageHeader title="Designations" description="Manage job titles and hierarchy">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Designation
          </Button>
        </PageHeader>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search designations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={filteredDesignations}
          keyExtractor={(des) => des.id}
          emptyMessage="No designations found"
        />
      </div>
    </MainLayout>
  );
}
