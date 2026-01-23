import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalarySlip, PayrollBatch } from '@/types/hrms';
import { PayrollStats } from '@/components/payroll/PayrollStats';
import { SalarySlipDialog } from '@/components/payroll/SalarySlipDialog';
import { CreateSalarySlipDialog } from '@/components/payroll/CreateSalarySlipDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, Download, FileText, DollarSign, Play, CheckCircle2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService, employeeService } from '@/services/apiService';
import { toast } from 'sonner';

export default function Payroll() {
  const { isHR, user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);
  const queryClient = useQueryClient();

  // Fetch salary slips for employees
  const { data: slips = [], isLoading: slipsLoading } = useQuery({
    queryKey: ['salary-slips', user?.id],
    queryFn: async () => {
      const { data } = await payrollService.getSlips();
      return data;
    },
    enabled: !isHR,
  });

  // Fetch payroll batches for HR
  const { data: batches = [] } = useQuery({
    queryKey: ['payroll-batches'],
    queryFn: async () => {
      const { data } = await payrollService.getBatches();
      return data;
    },
    enabled: isHR,
  });

  // Fetch employees for HR view (only active)
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await employeeService.getAll({ status: 'active' });
      return data.employees || [];
    },
    enabled: isHR,
  });

  // Fetch payroll stats for HR
  const { data: stats } = useQuery({
    queryKey: ['payroll-stats'],
    queryFn: async () => {
      const { data } = await payrollService.getStats();
      return data;
    },
    enabled: isHR,
  });

  // Mutations for HR actions
  const generateMutation = useMutation({
    mutationFn: ({ month, year }: { month: number, year: number }) => payrollService.generate(month, year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-batches'] });
      toast.success('Payroll generated successfully');
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => payrollService.markPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-batches'] });
      toast.success('Payroll marked as paid');
    },
  });

  const mySalarySlips = slips.filter((s: any) => s.employee_id === user?.id);
  const getEmployeeDetails = (employeeId: string) => employees.find((e: any) => e.id === employeeId);

  // Define columns
  const batchColumns: Column<PayrollBatch>[] = [
    {
      key: 'period',
      header: 'Period',
      cell: (batch) => <span className="font-medium">{format(new Date(batch.year, batch.month - 1), 'MMMM yyyy')}</span>,
    },
    { key: 'total_employees', header: 'Employees', cell: (batch) => <span>{batch.total_employees}</span> },
    { key: 'total_amount', header: 'Total Amount', cell: (batch) => <span className="font-semibold">${Number(batch.total_amount).toLocaleString()}</span> },
    { key: 'status', header: 'Status', cell: (batch) => <StatusBadge status={batch.status} /> },
    {
      key: 'actions',
      header: '',
      cell: (batch) => (
        <div className="flex items-center gap-2">
          {batch.status === 'processed' && (
            <Button
              size="sm"
              onClick={() => markPaidMutation.mutate(batch.id)}
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />Mark Paid
            </Button>
          )}
          {batch.status === 'paid' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const element = document.createElement('a');
                element.href = `/payroll/export/${batch.id}`;
                element.download = `payroll-${batch.id}.csv`;
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}
            >
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          )}
        </div>
      ),
    },
  ];

  const slipColumns: Column<SalarySlip>[] = [
    {
      key: 'employee_id',
      header: 'Employee',
      cell: (slip) => {
        const emp = getEmployeeDetails(slip.employee_id);
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
    { key: 'period', header: 'Period', cell: (slip) => <span>{format(new Date(slip.year, slip.month - 1), 'MMM yyyy')}</span> },
    { key: 'gross_salary', header: 'Gross', cell: (slip) => <span>${Number(slip.gross_salary).toLocaleString()}</span> },
    { key: 'net_salary', header: 'Net Pay', cell: (slip) => <span className="font-semibold text-success">${Number(slip.net_salary).toLocaleString()}</span> },
    { key: 'status', header: 'Status', cell: (slip) => <StatusBadge status={slip.status} /> },
    {
      key: 'actions',
      header: '',
      cell: (slip) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setSelectedSlip(slip)}>
            <FileText className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const mySlipColumns: Column<SalarySlip>[] = [
    { key: 'period', header: 'Period', cell: (slip) => <span className="font-medium">{format(new Date(slip.year, slip.month - 1), 'MMMM yyyy')}</span> },
    { key: 'gross_salary', header: 'Gross Salary', cell: (slip) => <span>${Number(slip.gross_salary).toLocaleString()}</span> },
    { key: 'deductions', header: 'Deductions', cell: (slip) => <span className="text-destructive">-${(Number(slip.deductions?.pf || 0) + Number(slip.deductions?.tax || 0)).toLocaleString()}</span> },
    { key: 'net_salary', header: 'Net Pay', cell: (slip) => <span className="font-bold text-lg">${Number(slip.net_salary).toLocaleString()}</span> },
    { key: 'status', header: 'Status', cell: (slip) => <StatusBadge status={slip.status} /> },
    {
      key: 'actions',
      header: '',
      cell: (slip) => (
        <Button size="sm" variant="outline" onClick={() => setSelectedSlip(slip)}>
          <FileText className="w-4 h-4 mr-1" />View
        </Button>
      ),
    },
  ];

  if (slipsLoading && !isHR) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading payroll...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <PageHeader title="Payroll" description={isHR ? 'Process and manage payroll' : 'View your salary slips'}>
          {isHR && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Manual Slip
              </Button>
              <Button onClick={() => generateMutation.mutate({ month: new Date().getMonth() + 1, year: new Date().getFullYear() })}>
                <Play className="w-4 h-4 mr-2" />
                Run Payroll
              </Button>
            </div>
          )}
        </PageHeader>

        {isHR && stats && (
          <PayrollStats
            trendData={stats.trendData}
            departmentData={stats.departmentData}
          />
        )}

        {!isHR && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <Card className="sm:col-span-1 hover:shadow-md transition-shadow"><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg"><DollarSign className="w-6 h-6 text-white" /></div><div><p className="text-2xl sm:text-3xl font-bold">${mySalarySlips[0]?.net_salary ? Number(mySalarySlips[0].net_salary).toLocaleString() : '0'}</p><p className="text-xs sm:text-sm text-muted-foreground">Latest Net Pay</p></div></div></CardContent></Card>
            <Card className="hover:shadow-md transition-shadow"><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Wallet className="w-6 h-6 text-primary" /></div><div><p className="text-xl sm:text-2xl font-bold">{mySalarySlips.length}</p><p className="text-xs text-muted-foreground">Total Slips</p></div></div></CardContent></Card>
            <Card className="hover:shadow-md transition-shadow"><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center"><DollarSign className="w-6 h-6 text-success" /></div><div><p className="text-xl sm:text-2xl font-bold">${mySalarySlips.reduce((sum: number, s: any) => sum + Number(s.net_salary), 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">YTD Earnings</p></div></div></CardContent></Card>
          </div>
        )}

        {isHR ? (
          <Tabs defaultValue="batches">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="batches">Payroll Batches</TabsTrigger>
              <TabsTrigger value="slips">Salary Slips</TabsTrigger>
            </TabsList>
            <TabsContent value="batches" className="mt-6">
              <Card className="overflow-hidden"><CardContent className="p-0"><div className="overflow-x-auto"><DataTable columns={batchColumns} data={batches} keyExtractor={(b) => b.id} emptyMessage="No batches" /></div></CardContent></Card>
            </TabsContent>
            <TabsContent value="slips" className="mt-6">
              <Card className="overflow-hidden"><CardContent className="p-0"><div className="overflow-x-auto"><DataTable columns={slipColumns} data={slips} keyExtractor={(s) => s.id} emptyMessage="No slips" /></div></CardContent></Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="overflow-hidden">
            <CardHeader><CardTitle className="text-base">My Salary Slips</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <DataTable columns={mySlipColumns} data={mySalarySlips} keyExtractor={(s) => s.id} emptyMessage="No salary slips" />
              </div>
            </CardContent>
          </Card>
        )}

        <SalarySlipDialog
          isOpen={!!selectedSlip}
          onClose={() => setSelectedSlip(null)}
          slip={selectedSlip}
          employeeName={selectedSlip ? getEmployeeDetails(selectedSlip.employee_id)?.name : undefined}
          employeeId={selectedSlip ? getEmployeeDetails(selectedSlip.employee_id)?.employee_id : undefined}
          department={selectedSlip ? getEmployeeDetails(selectedSlip.employee_id)?.department?.name : undefined}
          designation={selectedSlip ? getEmployeeDetails(selectedSlip.employee_id)?.designation?.name : undefined}
          canEdit={isHR}
        />
        <CreateSalarySlipDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          employees={employees}
        />
      </div>
    </MainLayout>
  );
}
