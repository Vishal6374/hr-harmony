import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { leaveRequests, leaveBalances, employees, getEmployeeLeaves } from '@/data/mockData';
import { LeaveRequest } from '@/types/hrms';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, CalendarDays, Check, X, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function Leaves() {
  const { isHR, user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');

  const myLeaves = getEmployeeLeaves(user?.id || '');
  const myBalances = leaveBalances.filter((lb) => lb.employeeId === (user?.id || ''));
  const getEmployeeDetails = (employeeId: string) => employees.find((e) => e.id === employeeId);

  const filteredRequests = leaveRequests.filter((req) => statusFilter === 'all' || req.status === statusFilter);

  const hrColumns: Column<LeaveRequest>[] = [
    {
      key: 'employee',
      header: 'Employee',
      cell: (leave) => {
        const emp = getEmployeeDetails(leave.employeeId);
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={emp?.avatar} />
              <AvatarFallback>{emp?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{emp?.name}</p>
              <p className="text-xs text-muted-foreground">{emp?.employeeId}</p>
            </div>
          </div>
        );
      },
    },
    { key: 'type', header: 'Type', cell: (leave) => <span className="capitalize">{leave.leaveType}</span> },
    {
      key: 'dates',
      header: 'Dates',
      cell: (leave) => (
        <div>
          <p className="text-sm">{format(new Date(leave.startDate), 'MMM d')} - {format(new Date(leave.endDate), 'MMM d')}</p>
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
          <Button size="sm" variant="outline" className="text-success"><Check className="w-3 h-3 mr-1" />Approve</Button>
          <Button size="sm" variant="outline" className="text-destructive"><X className="w-3 h-3 mr-1" />Reject</Button>
        </div>
      ) : null,
    },
  ];

  const employeeColumns: Column<LeaveRequest>[] = [
    { key: 'type', header: 'Type', cell: (leave) => <span className="capitalize font-medium">{leave.leaveType}</span> },
    {
      key: 'dates',
      header: 'Dates',
      cell: (leave) => (
        <div>
          <p className="text-sm">{format(new Date(leave.startDate), 'MMM d')} - {format(new Date(leave.endDate), 'MMM d')}</p>
          <p className="text-xs text-muted-foreground">{leave.days} days</p>
        </div>
      ),
    },
    { key: 'reason', header: 'Reason', cell: (leave) => <p className="text-sm text-muted-foreground">{leave.reason}</p> },
    { key: 'status', header: 'Status', cell: (leave) => <StatusBadge status={leave.status} /> },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Leaves" description={isHR ? 'Manage employee leave requests' : 'Apply and track your leaves'}>
          {!isHR && <Button><Plus className="w-4 h-4 mr-2" />Apply Leave</Button>}
        </PageHeader>

        {!isHR && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {myBalances.map((balance) => (
              <Card key={balance.leaveType}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground capitalize">{balance.leaveType}</p>
                      <p className="text-2xl font-bold">{balance.remaining}</p>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><Clock className="w-5 h-5 text-warning" /></div><div><p className="text-2xl font-bold">{leaveRequests.filter((l) => l.status === 'pending').length}</p><p className="text-xs text-muted-foreground">Pending</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><Check className="w-5 h-5 text-success" /></div><div><p className="text-2xl font-bold">{leaveRequests.filter((l) => l.status === 'approved').length}</p><p className="text-xs text-muted-foreground">Approved</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><X className="w-5 h-5 text-destructive" /></div><div><p className="text-2xl font-bold">{leaveRequests.filter((l) => l.status === 'rejected').length}</p><p className="text-xs text-muted-foreground">Rejected</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{employees.filter((e) => e.status === 'on_leave').length}</p><p className="text-xs text-muted-foreground">On Leave Now</p></CardContent></Card>
          </div>
        )}

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

        <Card>
          <CardHeader><CardTitle className="text-base">{isHR ? 'Leave Requests' : 'My Leave Requests'}</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={isHR ? hrColumns : employeeColumns}
              data={isHR ? filteredRequests : myLeaves.filter((l) => statusFilter === 'all' || l.status === statusFilter)}
              keyExtractor={(leave) => leave.id}
              emptyMessage="No leave requests found"
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
