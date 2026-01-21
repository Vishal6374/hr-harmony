import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Calendar, Pencil, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { holidayService } from '@/services/apiService';
import { StatusBadge } from '@/components/ui/status-badge';
import { toast } from 'sonner';

export default function Holidays() {
  const { isHR } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', date: '', type: 'national', is_optional: false });

  const queryClient = useQueryClient();

  if (!isHR) return <Navigate to="/dashboard" replace />;

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['holidays', selectedYear],
    queryFn: async () => {
      const { data } = await holidayService.getAll({ year: selectedYear });
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: holidayService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      setIsDialogOpen(false);
      toast.success('Holiday created successfully');
      resetForm();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to create holiday'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => holidayService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      setIsDialogOpen(false);
      toast.success('Holiday updated successfully');
      resetForm();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update holiday'),
  });

  const deleteMutation = useMutation({
    mutationFn: holidayService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success('Holiday deleted successfully');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to delete holiday'),
  });

  const resetForm = () => {
    setSelectedHoliday(null);
    setFormData({ name: '', date: '', type: 'national', is_optional: false });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (holiday: any) => {
    setSelectedHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: holiday.date.split('T')[0],
      type: holiday.type,
      is_optional: holiday.is_optional,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this holiday?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedHoliday) {
      updateMutation.mutate({ id: selectedHoliday.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Holiday',
      cell: (holiday) => {
        const dateStr = holiday.date ? format(new Date(holiday.date), 'EEEE, MMMM d, yyyy') : '-';
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{holiday.name}</p>
              <p className="text-xs text-muted-foreground">{dateStr}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'type',
      header: 'Type',
      cell: (holiday) => (
        <StatusBadge status={holiday.type === 'national' ? 'active' : 'inactive'} label={holiday.type} />
      ),
    },
    {
      key: 'optional',
      header: 'Optional',
      cell: (holiday) => (
        <span className="text-sm">{holiday.is_optional ? 'Yes' : 'No'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (holiday) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(holiday)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => handleDelete(holiday.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
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
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Holidays" description="Manage company holidays">
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Holiday
          </Button>
        </PageHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-sm text-muted-foreground">Total Holidays</p>
            <p className="text-2xl font-bold">{holidays.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-sm text-muted-foreground">National</p>
            <p className="text-2xl font-bold">{holidays.filter((h: any) => h.type === 'national').length}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-sm text-muted-foreground">Optional</p>
            <p className="text-2xl font-bold">{holidays.filter((h: any) => h.is_optional).length}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Select
            value={selectedYear.toString()}
            onValueChange={(val) => setSelectedYear(Number(val))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={holidays}
          keyExtractor={(holiday) => holiday.id}
          emptyMessage="No holidays found"
        />

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedHoliday ? 'Edit Holiday' : 'Add Holiday'}</DialogTitle>
              <DialogDescription>
                {selectedHoliday ? 'Update holiday details.' : 'Add a new holiday to the calendar.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Holiday Name</Label>
                <Input
                  id="title"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. New Year's Day"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="national">National</SelectItem>
                    <SelectItem value="regional">Regional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="optional"
                  checked={formData.is_optional}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_optional: !!checked })}
                />
                <Label htmlFor="optional" className="text-sm font-normal">
                  Mark as Optional Holiday
                </Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {selectedHoliday ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
