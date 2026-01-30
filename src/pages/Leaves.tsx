import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LeaveRequest } from '@/types/hrms';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, CalendarDays, Check, X, Clock, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService, employeeService, leaveLimitService } from '@/services/apiService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageLoader } from '@/components/ui/page-loader';

export default function Leaves() {
  const { isHR, user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');

  // New hooks moved from bottom
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [leaveLimits, setLeaveLimits] = useState({ casual_leave: 12, sick_leave: 12, earned_leave: 15 });

  const [formData, setFormData] = useState({
    leave_type: 'sick',
    start_date: '',
    end_date: '',
    reason: '',
  });

  // Fetch leave requests
  const { data: leaves = [], isLoading: leavesLoading } = useQuery({
    queryKey: ['leaves', statusFilter],
    queryFn: async () => {
      const { data } = await leaveService.getRequests({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      return data;
    },
  });

  // Fetch leave limits
  useQuery({
    queryKey: ['leave-limits'],
    queryFn: async () => {
      const { data } = await leaveLimitService.get();
      if (data) {
        setLeaveLimits({
          casual_leave: data.casual_leave,
          sick_leave: data.sick_leave,
          earned_leave: data.earned_leave // Map based on DB/API field names usually
        });
      }
      return data;
    },
    enabled: isHR && isSettingsOpen,
  });

  // Update Leave Limits Mutation
  const updateLimitsMutation = useMutation({
    mutationFn: (data: any) => leaveLimitService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-limits'] });
      setIsSettingsOpen(false);
      toast.success('Leave limits updated successfully');
    },
    onError: (error: any) => toast.error('Failed to update leave limits'),
  });

  // Fetch leave balances
  const { data: balances = [] } = useQuery({
    queryKey: ['leave-balances'],
    queryFn: async () => {
      const { data } = await leaveService.getBalances();
      return data;
    },
  });

  // Fetch employees for HR view
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await employeeService.getAll();
      return data.employees || [];
    },
    enabled: isHR,
  });

  const queryClient = useQueryClient();

  // Mutations for HR actions
  const approveMutation = useMutation({
    mutationFn: ({ id, remarks }: any) => leaveService.approve(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast.success('Leave approved');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, remarks }: any) => leaveService.reject(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast.success('Leave rejected');
    },
  });

  const applyMutation = useMutation({
    mutationFn: (data: any) => leaveService.apply(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      setIsDialogOpen(false);
      toast.success('Leave application submitted');
      setFormData({ leave_type: 'sick', start_date: '', end_date: '', reason: '' });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to apply for leave'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyMutation.mutate(formData);
  };

  const handleUpdateLimits = (e: React.FormEvent) => {
    e.preventDefault();
    updateLimitsMutation.mutate(leaveLimits);
  };

  const myLeaves = leaves.filter((l: any) => l.employee_id === user?.id);
  const myBalances = balances.filter((lb: any) => lb.employee_id === user?.id);
  const getEmployeeDetails = (employeeId: string) => employees.find((e: any) => e.id === employeeId);

  if (leavesLoading) {
    return <PageLoader />;
  }

  const hrColumns: Column<any>[] = [
    {
      key: 'employee',
      header: 'Employee',
      cell: (leave) => {
        const emp = getEmployeeDetails(leave.employee_id);
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={emp?.avatar} />
              <AvatarFallback>{emp?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{emp?.name}</p>
              <p className="text-xs text-muted-foreground">{emp?.employee_id}</p>
            </div>
          </div>
        );
      },
    },
    { key: 'type', header: 'Type', cell: (leave) => <span className="capitalize">{leave.leave_type}</span> },
    {
      key: 'dates',
      header: 'Dates',
      cell: (leave) => (
        <div>
          <p className="text-sm">{format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d')}</p>
          <p className="text-xs text-muted-foreground">{leave.days} days</p>
        </div>
      ),
    },
    { key: 'reason', header: 'Reason', cell: (leave) => <p className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">{leave.reason}</p> },
    { key: 'status', header: 'Status', cell: (leave) => <StatusBadge status={leave.status} /> },
    {
      key: 'actions',
      header: '',
      cell: (leave) => leave.status === 'pending' ? (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-success"
            onClick={() => approveMutation.mutate({ id: leave.id })}
          >
            <Check className="w-3 h-3 mr-1" />Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive"
            onClick={() => rejectMutation.mutate({ id: leave.id })}
          >
            <X className="w-3 h-3 mr-1" />Reject
          </Button>
        </div>
      ) : null,
    },
  ];

  const employeeColumns: Column<any>[] = [
    { key: 'type', header: 'Type', cell: (leave) => <span className="capitalize font-medium">{leave.leave_type}</span> },
    {
      key: 'dates',
      header: 'Dates',
      cell: (leave) => (
        <div>
          <p className="text-sm">{format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d')}</p>
          <p className="text-xs text-muted-foreground">{leave.days} days</p>
        </div>
      ),
    },
    { key: 'reason', header: 'Reason', cell: (leave) => <p className="text-sm text-muted-foreground">{leave.reason}</p> },
    { key: 'status', header: 'Status', cell: (leave) => <StatusBadge status={leave.status} /> },
  ];

  // ... columns ...

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <PageHeader title="Leaves" description={isHR ? 'Manage employee leave requests' : 'Apply and track your leaves'}>
          {!isHR && <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Apply Leave</Button>}
          {isHR && (
            <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          )}
        </PageHeader>

        {/* ... existing Cards ... */}
        {!isHR && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {myBalances.map((balance: any) => (
              <Card key={balance.leave_type}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground capitalize">{balance.leave_type}</p>
                      <p className="text-xl sm:text-2xl font-bold">{balance.remaining}</p>
                      <p className="text-xs text-muted-foreground">of {balance.total} days</p>
                    </div>
                    <CalendarDays className="w-8 h-8 text-primary/20" />
                  </div>
                  <div className="mt-3 w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${(balance.remaining / balance.total) * 100}%` }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {isHR && (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><Clock className="w-5 h-5 text-warning" /></div><div><p className="text-xl sm:text-2xl font-bold">{leaves.filter((l: any) => l.status === 'pending').length}</p><p className="text-xs text-muted-foreground">Pending</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><Check className="w-5 h-5 text-success" /></div><div><p className="text-xl sm:text-2xl font-bold">{leaves.filter((l: any) => l.status === 'approved').length}</p><p className="text-xs text-muted-foreground">Approved</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><X className="w-5 h-5 text-destructive" /></div><div><p className="text-xl sm:text-2xl font-bold">{leaves.filter((l: any) => l.status === 'rejected').length}</p><p className="text-xs text-muted-foreground">Rejected</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center"><Clock className="w-5 h-5 text-info" /></div><div><p className="text-xl sm:text-2xl font-bold">{leaves.filter((l: any) => l.status === 'approved' && new Date(l.start_date) <= new Date() && new Date(l.end_date) >= new Date()).length}</p><p className="text-xs text-muted-foreground">On Leave Now</p></div></div></CardContent></Card>
          </div>
        )}

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Card className="overflow-hidden">
          <CardHeader><CardTitle className="text-base">{isHR ? 'Leave Requests' : 'My Leave Requests'}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <DataTable
                columns={isHR ? hrColumns : employeeColumns}
                data={isHR ? leaves : myLeaves.filter((l: any) => statusFilter === 'all' || l.status === statusFilter)}
                keyExtractor={(leave: any) => leave.id}
                emptyMessage="No leave requests found"
              />
            </div>
          </CardContent>
        </Card>

        {/* Apply Leave Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
              <DialogDescription>Submit a new leave request.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Leave Type</Label>
                <Select value={formData.leave_type} onValueChange={(val) => setFormData({ ...formData, leave_type: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="earned">Privilege / Earned Leave</SelectItem>
                    <SelectItem value="casual">Casual Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} required />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={applyMutation.isPending}>{applyMutation.isPending ? 'Submitting...' : 'Submit Request'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Leave Limits Settings Dialog - HR Only */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Leave Policy Settings</DialogTitle>
              <DialogDescription>Set the annual leave limits for all employees.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateLimits} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="casual">Casual Leave (Days/Year)</Label>
                <Input
                  id="casual"
                  type="number"
                  min="0"
                  value={leaveLimits.casual_leave}
                  onChange={(e) => setLeaveLimits({ ...leaveLimits, casual_leave: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sick">Sick Leave (Days/Year)</Label>
                <Input
                  id="sick"
                  type="number"
                  min="0"
                  value={leaveLimits.sick_leave}
                  onChange={(e) => setLeaveLimits({ ...leaveLimits, sick_leave: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="earned">Earned/Privilege Leave (Days/Year)</Label>
                <Input
                  id="earned"
                  type="number"
                  min="0"
                  value={leaveLimits.earned_leave}
                  onChange={(e) => setLeaveLimits({ ...leaveLimits, earned_leave: Number(e.target.value) })}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={updateLimitsMutation.isPending}>
                  {updateLimitsMutation.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
