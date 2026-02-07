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
import { Plus, CalendarDays, Check, X, Clock, Settings, Edit2, Trash2, Eye } from 'lucide-react';
import { format, isWithinInterval } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService, employeeService, leaveLimitService, leaveTypeService } from '@/services/apiService';
import PendingLeavesSheet from '@/components/leaves/PendingLeavesSheet';
import LeaveBalanceSheet from '@/components/leaves/LeaveBalanceSheet';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageLoader } from '@/components/ui/page-loader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface LeaveType {
  id: string;
  name: string;
  description: string;
  is_paid: boolean;
  default_days_per_year: number;
  status: 'active' | 'inactive';
}

export default function Leaves() {
  const { isHR, user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPendingSheetOpen, setIsPendingSheetOpen] = useState(false);
  const [isBalanceSheetOpen, setIsBalanceSheetOpen] = useState(false);
  const [leaveLimits, setLeaveLimits] = useState({ casual_leave: 12, sick_leave: 12, earned_leave: 15 });
  const [activeTab, setActiveTab] = useState(isHR ? 'team' : 'my-leaves');

  const [formData, setFormData] = useState({
    leave_type: 'sick',
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [isSingleDay, setIsSingleDay] = useState(false);
  const [editingLeave, setEditingLeave] = useState<any>(null);

  // Leave Type states
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<LeaveType | null>(null);
  const [typeFormData, setTypeFormData] = useState({
    name: '',
    description: '',
    is_paid: true,
    default_days_per_year: 12,
    status: 'active'
  });

  // Fetch leave requests
  const { data: leaves = [], isLoading: leavesLoading } = useQuery({
    queryKey: ['leaves', statusFilter, activeTab],
    queryFn: async () => {
      const isManagerView = activeTab === 'team-approvals';
      const { data } = await leaveService.getRequests({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        view: isManagerView ? 'manager' : undefined
      });
      return data;
    },
  });

  // Check if user is a reporting manager - dual check: subordinates OR assigned requests
  const { data: subordinates = [] } = useQuery({
    queryKey: ['subordinates', user?.id],
    queryFn: async () => {
      const { data } = await employeeService.getAll({ reporting_manager_id: user?.id });
      return data.employees || [];
    },
    enabled: !!user?.id,
  });

  const { data: managerRequests = [] } = useQuery({
    queryKey: ['manager-requests-check', user?.id],
    queryFn: async () => {
      const { data } = await leaveService.getRequests({ view: 'manager' });
      return data;
    },
    enabled: !!user?.id,
  });

  const isReportingManager = subordinates.length > 0 || managerRequests.length > 0 || isHR;

  // Fetch leave types
  const { data: leaveTypes = [] } = useQuery({
    queryKey: ['leave-types'],
    queryFn: async () => {
      const { data } = await leaveTypeService.getAll();
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
          earned_leave: data.earned_leave
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

  // Leave Type Mutations
  const createTypeMutation = useMutation({
    mutationFn: (data: any) => leaveTypeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
      setIsTypeDialogOpen(false);
      toast.success('Leave type created');
      resetTypeForm();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to create type'),
  });

  const updateTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => leaveTypeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
      setIsTypeDialogOpen(false);
      toast.success('Leave type updated');
      resetTypeForm();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update type'),
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (id: string) => leaveTypeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
      toast.success('Leave type deleted');
    },
  });

  // Mutations for HR and Manager actions
  const approveMutation = useMutation({
    mutationFn: ({ id, remarks }: any) => leaveService.approve(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast.success('Leave approved');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to approve leave'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, remarks }: any) => leaveService.reject(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast.success('Leave rejected');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to reject leave'),
  });

  const managerApproveMutation = useMutation({
    mutationFn: ({ id, remarks }: any) => leaveService.managerApprove(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast.success('Manager approval recorded');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to approve leave'),
  });

  const managerRejectMutation = useMutation({
    mutationFn: ({ id, remarks }: any) => leaveService.managerReject(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast.success('Leave rejected by manager');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to reject leave'),
  });

  const applyMutation = useMutation({
    mutationFn: (data: any) => leaveService.apply(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      setIsDialogOpen(false);
      toast.success('Leave application submitted');
      resetLeaveForm();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to apply for leave'),
  });

  const updateLeaveMutation = useMutation({
    mutationFn: ({ id, data }: any) => leaveService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      setIsDialogOpen(false);
      toast.success('Leave updated successfully');
      resetLeaveForm();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update leave'),
  });

  const deleteLeaveMutation = useMutation({
    mutationFn: leaveService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      toast.success('Leave request deleted');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to delete leave'),
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
      const { data } = await employeeService.getAll({ status: 'active' });
      return data.employees || [];
    },
    enabled: isHR,
  });


  const resetLeaveForm = () => {
    setFormData({ leave_type: 'sick', start_date: '', end_date: '', reason: '' });
    setEditingLeave(null);
    setIsSingleDay(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData };
    if (isSingleDay) {
      data.end_date = data.start_date;
    }

    if (editingLeave) {
      updateLeaveMutation.mutate({ id: editingLeave.id, data });
    } else {
      applyMutation.mutate(data);
    }
  };

  const handleEditLeave = (leave: any) => {
    setEditingLeave(leave);
    setFormData({
      leave_type: leave.leave_type,
      start_date: leave.start_date ? format(new Date(leave.start_date), 'yyyy-MM-dd') : '',
      end_date: leave.end_date ? format(new Date(leave.end_date), 'yyyy-MM-dd') : '',
      reason: leave.reason,
    });
    setIsSingleDay(leave.start_date === leave.end_date);
    setIsDialogOpen(true);
  };

  const handleDeleteLeave = (id: string) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      deleteLeaveMutation.mutate(id);
    }
  };

  const handleUpdateLimits = (e: React.FormEvent) => {
    e.preventDefault();
    updateLimitsMutation.mutate(leaveLimits);
  };

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedType && (selectedType as any).isStandard) {
      const typeKey = selectedType.id === 'casual' ? 'casual_leave' : selectedType.id === 'sick' ? 'sick_leave' : 'earned_leave';
      updateLimitsMutation.mutate({ ...leaveLimits, [typeKey]: typeFormData.default_days_per_year });
      setIsTypeDialogOpen(false);
      return;
    }

    if (selectedType) {
      updateTypeMutation.mutate({ id: selectedType.id, data: typeFormData });
    } else {
      createTypeMutation.mutate(typeFormData);
    }
  };

  const resetTypeForm = () => {
    setTypeFormData({
      name: '',
      description: '',
      is_paid: true,
      default_days_per_year: 12,
      status: 'active'
    });
    setSelectedType(null);
  };

  const handleEditType = (type: LeaveType) => {
    setSelectedType(type);
    setTypeFormData({
      name: type.name,
      description: type.description || '',
      is_paid: type.is_paid,
      default_days_per_year: type.default_days_per_year,
      status: type.status
    });
    setIsTypeDialogOpen(true);
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
          <p className="text-sm">{leave.start_date ? format(new Date(leave.start_date), 'MMM d') : ''} - {leave.end_date ? format(new Date(leave.end_date), 'MMM d') : ''}</p>
          <p className="text-xs text-muted-foreground">{leave.days} days</p>
        </div>
      ),
    },
    { key: 'reason', header: 'Reason', cell: (leave) => <p className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">{leave.reason}</p> },
    { key: 'status', header: 'Status', cell: (leave) => <StatusBadge status={leave.status} /> },
    {
      key: 'actions',
      header: '',
      cell: (leave) => {
        const isPendingHR = leave.status === 'pending_hr' || (leave.status === 'pending' && isHR);
        const isPendingManager = leave.status === 'pending_manager' && activeTab === 'team-approvals';

        if (isPendingHR && isHR) {
          return (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-success border-success/30 hover:bg-success/10"
                onClick={() => approveMutation.mutate({ id: leave.id })}
              >
                <Check className="w-3 h-3 mr-1" />Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => {
                  const remarks = prompt("Enter rejection remarks:");
                  if (remarks) rejectMutation.mutate({ id: leave.id, remarks });
                }}
              >
                <X className="w-3 h-3 mr-1" />Reject
              </Button>
            </div>
          );
        }

        if (isPendingManager) {
          return (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-success border-success/30 hover:bg-success/10"
                onClick={() => managerApproveMutation.mutate({ id: leave.id })}
              >
                <Check className="w-3 h-3 mr-1" />Manager Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => {
                  const remarks = prompt("Enter rejection remarks:");
                  if (remarks) managerRejectMutation.mutate({ id: leave.id, remarks });
                }}
              >
                <X className="w-3 h-3 mr-1" />Reject
              </Button>
            </div>
          );
        }

        return null;
      },
    },
  ];

  const employeeColumns: Column<any>[] = [
    { key: 'type', header: 'Type', cell: (leave) => <span className="capitalize font-medium">{leave.leave_type}</span> },
    {
      key: 'dates',
      header: 'Dates',
      cell: (leave) => (
        <div>
          <p className="text-sm">{leave.start_date ? format(new Date(leave.start_date), 'MMM d') : ''} - {leave.end_date ? format(new Date(leave.end_date), 'MMM d') : ''}</p>
          <p className="text-xs text-muted-foreground">{leave.days} days</p>
        </div>
      ),
    },
    { key: 'reason', header: 'Reason', cell: (leave) => <p className="text-sm text-muted-foreground">{leave.reason}</p> },
    {
      key: 'status',
      header: 'Status',
      cell: (leave: any) => (
        <div className="space-y-1">
          <StatusBadge status={leave.status} />
          {(leave.status === 'rejected_by_manager' || leave.status === 'rejected_by_hr' || leave.status === 'rejected') && (leave.manager_remarks || leave.hr_remarks || leave.remarks) && (
            <p className="text-[10px] text-destructive font-medium italic max-w-[150px] line-clamp-1">
              Note: {leave.manager_remarks || leave.hr_remarks || leave.remarks}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: '',
      cell: (leave) => leave.status === 'pending' ? (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleEditLeave(leave)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteLeave(leave.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ) : null,
    },
  ];

  const typeColumns: Column<any>[] = [
    { key: 'name', header: 'Name', cell: (type) => <span className="font-bold text-primary">{type.name}</span> },
    {
      key: 'is_paid',
      header: 'Paid',
      cell: (type) => type.is_paid ?
        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Yes</span> :
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">No</span>
    },
    { key: 'default_days_per_year', header: 'Limit', cell: (type) => <span>{type.default_days_per_year}d</span> },
    {
      key: 'actions',
      header: '',
      cell: (type) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditType(type)}>
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          {!type.isStandard && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
              if (confirm('Delete this leave type?')) deleteTypeMutation.mutate(type.id);
            }}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )
    }
  ];

  const allCategories = [
    { id: 'casual', name: 'Casual Leave', default_days_per_year: leaveLimits.casual_leave, is_paid: true, status: 'active', isStandard: true, description: 'Standard annual casual leave' },
    { id: 'sick', name: 'Sick Leave', default_days_per_year: leaveLimits.sick_leave, is_paid: true, status: 'active', isStandard: true, description: 'Standard annual sick leave' },
    { id: 'earned', name: 'Earned Leave', default_days_per_year: leaveLimits.earned_leave, is_paid: true, status: 'active', isStandard: true, description: 'Standard annual earned leave' },
    ...leaveTypes
  ];

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <PageHeader title="Leaves" description={isHR ? 'Manage employee leave requests' : 'Apply and track your leaves'} />
        {isHR ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList>
                <TabsTrigger value="team">Team Requests</TabsTrigger>
                {isReportingManager && <TabsTrigger value="team-approvals">Team Approvals</TabsTrigger>}
                <TabsTrigger value="my-leaves">My Leaves</TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                <TabsContent value="my-leaves" className="m-0">
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Apply Leave
                  </Button>
                </TabsContent>
                <TabsContent value="team" className="m-0">
                  <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </TabsContent>
              </div>
            </div>

            <TabsContent value="team" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                  className="cursor-pointer hover:shadow-md transition-all border-warning/30 bg-warning/5"
                  onClick={() => setIsPendingSheetOpen(true)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-warning/20 flex items-center justify-center">
                          <Clock className="w-6 h-6 text-warning" />
                        </div>
                        <div>
                          <p className="text-3xl font-black text-warning">
                            {leaves.filter((l: any) => l.status === 'pending' || l.status === 'pending_hr').length}
                          </p>
                          <p className="text-sm font-semibold text-warning/80">Pending Action</p>
                        </div>
                      </div>
                      <div className="bg-warning/20 px-3 py-1 rounded-full text-xs font-bold text-warning uppercase tracking-wider">
                        Quick View
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-success/30 bg-success/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center">
                        <Check className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <p className="text-3xl font-black text-success">
                          {leaves.filter((l: any) => l.status === 'approved').length}
                        </p>
                        <p className="text-sm font-semibold text-success/80">Approved Leaves</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-info/30 bg-info/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-info/20 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-info" />
                      </div>
                      <div>
                        <p className="text-3xl font-black text-info">
                          {leaves.filter((l: any) =>
                            l.status === 'approved' &&
                            isWithinInterval(new Date(), {
                              start: new Date(l.start_date),
                              end: new Date(l.end_date)
                            })
                          ).length}
                        </p>
                        <p className="text-sm font-semibold text-info/80">Current Active Leaves</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Leave Requests</h3>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending_hr">Pending HR</SelectItem>
                    <SelectItem value="pending_manager">Pending Manager</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <DataTable
                    columns={hrColumns}
                    data={
                      statusFilter === 'all'
                        ? leaves
                        : leaves.filter((l: any) => {
                          if (statusFilter === 'rejected') {
                            return l.status === 'rejected' || l.status === 'rejected_by_manager' || l.status === 'rejected_by_hr';
                          }
                          return l.status === statusFilter;
                        })
                    }
                    keyExtractor={(leave: any) => leave.id}
                    emptyMessage="No leave requests found"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {isReportingManager && (
              <TabsContent value="team-approvals" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Requests Pending My Approval</h3>
                </div>
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <DataTable
                      columns={hrColumns}
                      data={leaves}
                      keyExtractor={(leave: any) => leave.id}
                      emptyMessage="No team requests found"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="my-leaves" className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <CalendarDays className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-primary">Leave Entitlements</h3>
                    <p className="text-sm text-primary/70 font-medium">View your annual limits and remaining balances for all leave types.</p>
                  </div>
                </div>
                <Button onClick={() => setIsBalanceSheetOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
                  <Eye className="w-4 h-4" />
                  View My Balance
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">My Leave History</h3>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <DataTable
                    columns={employeeColumns}
                    data={myLeaves.filter((l: any) => statusFilter === 'all' || l.status === statusFilter)}
                    keyExtractor={(leave: any) => leave.id}
                    emptyMessage="No leave requests found"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList>
                <TabsTrigger value="my-leaves">My Leaves</TabsTrigger>
                {isReportingManager && <TabsTrigger value="team-approvals">Team Approvals</TabsTrigger>}
              </TabsList>
              <div className="flex gap-2">
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Apply Leave
                </Button>
              </div>
            </div>

            <TabsContent value="team-approvals" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Requests Pending My Approval</h3>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending_manager">Pending My Action</SelectItem>
                    <SelectItem value="pending_hr">Passed to HR</SelectItem>
                    <SelectItem value="approved">Final Approved</SelectItem>
                    <SelectItem value="rejected_by_manager">Rejected by Me</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <DataTable
                    columns={hrColumns}
                    data={leaves}
                    keyExtractor={(leave: any) => leave.id}
                    emptyMessage="No team requests found"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="my-leaves" className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <CalendarDays className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-primary">Leave Entitlements</h3>
                    <p className="text-sm text-primary/70 font-medium">Detailed view of your annual limits and remaining balances.</p>
                  </div>
                </div>
                <Button onClick={() => setIsBalanceSheetOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
                  <Eye className="w-4 h-4" />
                  Check Balance
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">My Leave History</h3>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending_manager">Pending Manager</SelectItem>
                    <SelectItem value="pending_hr">Pending HR</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <DataTable
                    columns={employeeColumns}
                    data={myLeaves.filter((l: any) => statusFilter === 'all' || l.status === statusFilter)}
                    keyExtractor={(leave: any) => leave.id}
                    emptyMessage="No leave requests found"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Apply Leave Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetLeaveForm();
        }}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLeave ? 'Edit Leave Request' : 'Apply for Leave'}</DialogTitle>
              <DialogDescription>{editingLeave ? 'Update your leave request details.' : 'Submit a new leave request.'}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="single-day">Single Day Leave</Label>
                  <p className="text-xs text-muted-foreground">Toggle for one day leave request</p>
                </div>
                <Switch
                  id="single-day"
                  checked={isSingleDay}
                  onCheckedChange={setIsSingleDay}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Leave Type</Label>
                <Select value={formData.leave_type} onValueChange={(val) => setFormData({ ...formData, leave_type: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allCategories.filter((t: any) => t.status === 'active').map((type: any) => (
                      <SelectItem key={type.id} value={type.isStandard ? type.id : type.name.toLowerCase()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={cn("grid gap-4", isSingleDay ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
                <div className="space-y-2">
                  <Label>{isSingleDay ? 'Date' : 'Start Date'}</Label>
                  <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
                </div>
                {!isSingleDay && (
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} required />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={applyMutation.isPending || updateLeaveMutation.isPending}>
                  {(applyMutation.isPending || updateLeaveMutation.isPending) ? 'Processing...' : (editingLeave ? 'Update Request' : 'Submit Request')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Leave Settings Dialog - HR Only */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Leave Module Settings</DialogTitle>
              <DialogDescription>Configure leave policies and categories.</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">Manage Leave Categories</h3>
                  <p className="text-sm text-muted-foreground">Configure limits and types for all leave formats.</p>
                </div>
                <Button onClick={() => { resetTypeForm(); setIsTypeDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Category
                </Button>
              </div>

              <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                <DataTable
                  columns={typeColumns}
                  data={allCategories}
                  keyExtractor={(t) => t.id}
                  emptyMessage="No leave categories found."
                />
              </div>

              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <div className="flex gap-3">
                  <div className="mt-1">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-primary">Configuration Tip</h4>
                    <p className="text-xs text-primary/70 leading-relaxed">
                      "Standard" categories (Casual, Sick, Earned) define the base annual leave policy. Custom categories can be added for special cases like Maternity, Bereavement, etc.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Leave Type Edit Dialog */}
        <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{selectedType ? 'Edit Type' : 'New Leave Type'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleTypeSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="typeName">Name</Label>
                <Input
                  id="typeName"
                  value={typeFormData.name}
                  onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="typeDesc">Description</Label>
                <Textarea
                  id="typeDesc"
                  value={typeFormData.description}
                  onChange={(e) => setTypeFormData({ ...typeFormData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="typeDays">Annual Limit</Label>
                  <Input
                    id="typeDays"
                    type="number"
                    value={typeFormData.default_days_per_year}
                    onChange={(e) => setTypeFormData({ ...typeFormData, default_days_per_year: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="typePaid"
                    checked={typeFormData.is_paid}
                    onCheckedChange={(checked) => setTypeFormData({ ...typeFormData, is_paid: checked })}
                  />
                  <Label htmlFor="typePaid">Paid Leave</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={typeFormData.status === 'active' ? 'default' : 'outline'}
                    className="flex-1 h-8 text-xs"
                    onClick={() => setTypeFormData({ ...typeFormData, status: 'active' })}
                  >
                    Active
                  </Button>
                  <Button
                    type="button"
                    variant={typeFormData.status === 'inactive' ? 'destructive' : 'outline'}
                    className="flex-1 h-8 text-xs"
                    onClick={() => setTypeFormData({ ...typeFormData, status: 'inactive' })}
                  >
                    Inactive
                  </Button>
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsTypeDialogOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={createTypeMutation.isPending || updateTypeMutation.isPending}>
                  {selectedType ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        {/* Pending Leaves Sidebar */}
        <PendingLeavesSheet
          leaves={leaves}
          employees={employees}
          open={isPendingSheetOpen}
          onOpenChange={setIsPendingSheetOpen}
          onApprove={(id) => approveMutation.mutate({ id })}
          onReject={(id) => rejectMutation.mutate({ id })}
        />
        {/* Leave Balance Sidebar */}
        <LeaveBalanceSheet
          balances={myBalances}
          open={isBalanceSheetOpen}
          onOpenChange={setIsBalanceSheetOpen}
        />
      </div>
    </MainLayout>
  );
}
