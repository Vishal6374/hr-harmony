import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { reimbursements, employees, getEmployeeReimbursements } from '@/data/mockData';
import { Reimbursement } from '@/types/hrms';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Check, X, Clock, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function Reimbursements() {
  const { isHR, user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const myReimbursements = getEmployeeReimbursements(user?.id || '');
  const getEmployeeDetails = (employeeId: string) => employees.find((e) => e.id === employeeId);

  const filteredReimbursements = reimbursements.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    return matchesStatus && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'travel': return '✈️';
      case 'event': return '🎉';
      case 'medical': return '🏥';
      case 'equipment': return '💻';
      default: return '📦';
    }
  };

  const hrColumns: Column<Reimbursement>[] = [
    {
      key: 'employee',
      header: 'Employee',
      cell: (r) => {
        const emp = getEmployeeDetails(r.employeeId);
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
    { key: 'category', header: 'Category', cell: (r) => <div className="flex items-center gap-2"><span>{getCategoryIcon(r.category)}</span><span className="capitalize">{r.category}</span></div> },
    { key: 'amount', header: 'Amount', cell: (r) => <span className="font-semibold">${r.amount.toLocaleString()}</span> },
    { key: 'description', header: 'Description', cell: (r) => <p className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">{r.description}</p> },
    { key: 'date', header: 'Submitted', cell: (r) => <span className="text-sm text-muted-foreground">{format(new Date(r.createdAt), 'MMM d, yyyy')}</span> },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: '',
      cell: (r) => r.status === 'pending' ? (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="text-success"><Check className="w-3 h-3 mr-1" />Approve</Button>
          <Button size="sm" variant="outline" className="text-destructive"><X className="w-3 h-3 mr-1" />Reject</Button>
        </div>
      ) : null,
    },
  ];

  const employeeColumns: Column<Reimbursement>[] = [
    { key: 'category', header: 'Category', cell: (r) => <div className="flex items-center gap-2"><span className="text-lg">{getCategoryIcon(r.category)}</span><span className="capitalize font-medium">{r.category}</span></div> },
    { key: 'amount', header: 'Amount', cell: (r) => <span className="font-semibold">${r.amount.toLocaleString()}</span> },
    { key: 'description', header: 'Description', cell: (r) => <p className="text-sm text-muted-foreground">{r.description}</p> },
    { key: 'date', header: 'Submitted', cell: (r) => <span className="text-sm text-muted-foreground">{format(new Date(r.createdAt), 'MMM d, yyyy')}</span> },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
  ];

  const totalPending = reimbursements.filter((r) => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);
  const totalApproved = reimbursements.filter((r) => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0);
  const myPendingTotal = myReimbursements.filter((r) => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);
  const myApprovedTotal = myReimbursements.filter((r) => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0);

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Reimbursements" description={isHR ? 'Review and process expense claims' : 'Submit and track expense claims'}>
          {!isHR && <Button><Plus className="w-4 h-4 mr-2" />Submit Claim</Button>}
        </PageHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {isHR ? (
            <>
              <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><Clock className="w-5 h-5 text-warning" /></div><div><p className="text-2xl font-bold">{reimbursements.filter((r) => r.status === 'pending').length}</p><p className="text-xs text-muted-foreground">Pending</p></div></div></CardContent></Card>
              <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">${totalPending.toLocaleString()}</p><p className="text-xs text-muted-foreground">Pending Amount</p></div></div></CardContent></Card>
              <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><Check className="w-5 h-5 text-success" /></div><div><p className="text-2xl font-bold">{reimbursements.filter((r) => r.status === 'approved').length}</p><p className="text-xs text-muted-foreground">Approved</p></div></div></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-2xl font-bold">${totalApproved.toLocaleString()}</p><p className="text-xs text-muted-foreground">Approved Amount</p></CardContent></Card>
            </>
          ) : (
            <>
              <Card><CardContent className="pt-4"><p className="text-2xl font-bold">${myPendingTotal.toLocaleString()}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-2xl font-bold">${myApprovedTotal.toLocaleString()}</p><p className="text-xs text-muted-foreground">Approved</p></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{myReimbursements.length}</p><p className="text-xs text-muted-foreground">Total Claims</p></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{myReimbursements.filter((r) => r.status === 'rejected').length}</p><p className="text-xs text-muted-foreground">Rejected</p></CardContent></Card>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="travel">Travel</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="medical">Medical</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">{isHR ? 'All Reimbursements' : 'My Reimbursements'}</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={isHR ? hrColumns : employeeColumns}
              data={isHR ? filteredReimbursements : myReimbursements.filter((r) => (statusFilter === 'all' || r.status === statusFilter) && (categoryFilter === 'all' || r.category === categoryFilter))}
              keyExtractor={(r) => r.id}
              emptyMessage="No reimbursements found"
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
