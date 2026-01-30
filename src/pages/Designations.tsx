import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Briefcase, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { designationService, departmentService } from '@/services/apiService';
import { toast } from 'sonner';
import { PageLoader } from '@/components/ui/page-loader';
import Loader from '@/components/ui/Loader';

export default function Designations() {
  const { isHR } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    department_id: '',
    level: '1',
    salary_range_min: '',
    salary_range_max: '',
    is_active: true
  });

  const queryClient = useQueryClient();

  if (!isHR) return <Navigate to="/dashboard" replace />;

  // Fetch Designations
  const { data: designations = [], isLoading } = useQuery({
    queryKey: ['designations', searchQuery],
    queryFn: async () => {
      const { data } = await designationService.getAll({ search: searchQuery });
      return data;
    },
  });

  // Fetch Departments
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data } = await departmentService.getAll();
      return data;
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => designationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] });
      setIsDialogOpen(false);
      toast.success('Designation created successfully');
      resetForm();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to create designation'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => designationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] });
      setIsDialogOpen(false);
      toast.success('Designation updated successfully');
      resetForm();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update designation'),
  });

  const deleteMutation = useMutation({
    mutationFn: designationService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] });
      toast.success('Designation deleted successfully');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to delete designation'),
  });

  const resetForm = () => {
    setSelectedDesignation(null);
    setFormData({
      name: '',
      department_id: '',
      level: '1',
      salary_range_min: '',
      salary_range_max: '',
      is_active: true
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (desig: any) => {
    setSelectedDesignation(desig);
    setFormData({
      name: desig.name,
      department_id: desig.department_id,
      level: String(desig.level),
      salary_range_min: desig.salary_range_min || '',
      salary_range_max: desig.salary_range_max || '',
      is_active: desig.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      level: Number(formData.level),
      salary_range_min: formData.salary_range_min ? Number(formData.salary_range_min) : undefined,
      salary_range_max: formData.salary_range_max ? Number(formData.salary_range_max) : undefined,
    };

    if (selectedDesignation) {
      updateMutation.mutate({ id: selectedDesignation.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Filter Logic
  const filteredDesignations = designations.filter((des: any) => {
    const matchesSearch = des.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || des.department_id === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Designation',
      cell: (des) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-primary" />
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
      cell: (des) => <span>{des.department?.name || 'Unknown'}</span>,
    },
    {
      key: 'salaryRange',
      header: 'Salary Range',
      cell: (des) => (
        <span className="text-muted-foreground text-sm">
          {des.salary_range_min ? `₹${des.salary_range_min.toLocaleString()}` : '0'}
          {' - '}
          {des.salary_range_max ? `₹${des.salary_range_max.toLocaleString()}` : '0'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (des) => <StatusBadge status={des.is_active ? 'active' : 'inactive'} />,
    },
    {
      key: 'actions',
      header: '',
      cell: (des) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(des)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => handleDelete(des.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
      className: 'w-[100px]',
    },
  ];

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <PageHeader title="Designations" description="Manage job titles and hierarchy">
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Designation
          </Button>
        </PageHeader>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="relative w-full sm:flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search designations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept: any) => (
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

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedDesignation ? 'Edit Designation' : 'Add Designation'}</DialogTitle>
              <DialogDescription>Define job roles and hierarchy levels.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Designation Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Senior Engineer"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department_id}
                  onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Level (1-10)</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => setFormData({ ...formData, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(l => (
                        <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="active">Status</Label>
                  <Select
                    value={formData.is_active ? 'active' : 'inactive'}
                    onValueChange={(value) => setFormData({ ...formData, is_active: value === 'active' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min">Min Salary</Label>
                  <Input
                    id="min"
                    type="number"
                    value={formData.salary_range_min}
                    onChange={(e) => setFormData({ ...formData, salary_range_min: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max">Max Salary</Label>
                  <Input
                    id="max"
                    type="number"
                    value={formData.salary_range_max}
                    onChange={(e) => setFormData({ ...formData, salary_range_max: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader size="small" variant="white" className="mr-2" />}
                  {selectedDesignation ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the designation and remove it from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
