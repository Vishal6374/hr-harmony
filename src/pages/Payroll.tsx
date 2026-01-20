import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { payrollBatches, salarySlips, employees, getEmployeeSalarySlips } from '@/data/mockData';
import { SalarySlip, PayrollBatch } from '@/types/hrms';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, Download, FileText, DollarSign, Play, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function Payroll() {
  const { isHR, user } = useAuth();
  const mySalarySlips = getEmployeeSalarySlips(user?.id || '');

  const getEmployeeDetails = (employeeId: string) => employees.find((e) => e.id === employeeId);

  const batchColumns: Column<PayrollBatch>[] = [
    {
      key: 'period',
      header: 'Period',
      cell: (batch) => <span className="font-medium">{format(new Date(batch.year, batch.month - 1), 'MMMM yyyy')}</span>,
    },
    { key: 'employees', header: 'Employees', cell: (batch) => <span>{batch.totalEmployees}</span> },
    { key: 'totalAmount', header: 'Total Amount', cell: (batch) => <span className="font-semibold">${batch.totalAmount.toLocaleString()}</span> },
    { key: 'status', header: 'Status', cell: (batch) => <StatusBadge status={batch.status} /> },
    {
      key: 'actions',
      header: '',
      cell: (batch) => (
        <div className="flex items-center gap-2">
          {batch.status === 'processed' && <Button size="sm"><CheckCircle2 className="w-3 h-3 mr-1" />Mark Paid</Button>}
          {batch.status === 'paid' && <Button size="sm" variant="outline"><Download className="w-3 h-3 mr-1" />Export</Button>}
        </div>
      ),
    },
  ];

  const slipColumns: Column<SalarySlip>[] = [
    {
      key: 'employee',
      header: 'Employee',
      cell: (slip) => {
        const emp = getEmployeeDetails(slip.employeeId);
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
    { key: 'period', header: 'Period', cell: (slip) => <span>{format(new Date(slip.year, slip.month - 1), 'MMM yyyy')}</span> },
    { key: 'gross', header: 'Gross', cell: (slip) => <span>${slip.grossSalary.toLocaleString()}</span> },
    { key: 'net', header: 'Net Pay', cell: (slip) => <span className="font-semibold text-success">${slip.netSalary.toLocaleString()}</span> },
    { key: 'status', header: 'Status', cell: (slip) => <StatusBadge status={slip.status} /> },
    {
      key: 'actions',
      header: '',
      cell: () => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost"><FileText className="w-4 h-4" /></Button>
          <Button size="sm" variant="ghost"><Download className="w-4 h-4" /></Button>
        </div>
      ),
    },
  ];

  const mySlipColumns: Column<SalarySlip>[] = [
    { key: 'period', header: 'Period', cell: (slip) => <span className="font-medium">{format(new Date(slip.year, slip.month - 1), 'MMMM yyyy')}</span> },
    { key: 'gross', header: 'Gross Salary', cell: (slip) => <span>${slip.grossSalary.toLocaleString()}</span> },
    { key: 'deductions', header: 'Deductions', cell: (slip) => <span className="text-destructive">-${(slip.deductions.pf + slip.deductions.tax).toLocaleString()}</span> },
    { key: 'net', header: 'Net Pay', cell: (slip) => <span className="font-bold text-lg">${slip.netSalary.toLocaleString()}</span> },
    { key: 'status', header: 'Status', cell: (slip) => <StatusBadge status={slip.status} /> },
    {
      key: 'actions',
      header: '',
      cell: () => (
        <Button size="sm" variant="outline"><Download className="w-4 h-4 mr-1" />Download</Button>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Payroll" description={isHR ? 'Process and manage payroll' : 'View your salary slips'}>
          {isHR && <Button><Play className="w-4 h-4 mr-2" />Run Payroll</Button>}
        </PageHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {isHR ? (
            <>
              <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Wallet className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">$751K</p><p className="text-xs text-muted-foreground">Total (Jan)</p></div></div></CardContent></Card>
              <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-success" /></div><div><p className="text-2xl font-bold">1</p><p className="text-xs text-muted-foreground">Paid</p></div></div></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-2xl font-bold">1</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-2xl font-bold">$93.8K</p><p className="text-xs text-muted-foreground">Avg. Salary</p></CardContent></Card>
            </>
          ) : (
            <>
              <Card className="sm:col-span-2"><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center"><DollarSign className="w-6 h-6 text-white" /></div><div><p className="text-3xl font-bold">${mySalarySlips[0]?.netSalary.toLocaleString() || '0'}</p><p className="text-sm text-muted-foreground">Latest Net Pay</p></div></div></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{mySalarySlips.length}</p><p className="text-xs text-muted-foreground">Total Slips</p></CardContent></Card>
              <Card><CardContent className="pt-4"><p className="text-2xl font-bold">${mySalarySlips.reduce((sum, s) => sum + s.netSalary, 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">YTD Earnings</p></CardContent></Card>
            </>
          )}
        </div>

        {isHR ? (
          <Tabs defaultValue="batches">
            <TabsList>
              <TabsTrigger value="batches">Payroll Batches</TabsTrigger>
              <TabsTrigger value="slips">Salary Slips</TabsTrigger>
            </TabsList>
            <TabsContent value="batches" className="mt-6">
              <DataTable columns={batchColumns} data={payrollBatches} keyExtractor={(b) => b.id} emptyMessage="No batches" />
            </TabsContent>
            <TabsContent value="slips" className="mt-6">
              <DataTable columns={slipColumns} data={salarySlips} keyExtractor={(s) => s.id} emptyMessage="No slips" />
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardHeader><CardTitle className="text-base">My Salary Slips</CardTitle></CardHeader>
            <CardContent>
              <DataTable columns={mySlipColumns} data={mySalarySlips} keyExtractor={(s) => s.id} emptyMessage="No salary slips" />
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
