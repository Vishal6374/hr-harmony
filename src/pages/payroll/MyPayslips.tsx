import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { useQuery } from '@tanstack/react-query';
import { payrollService } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Download, Printer, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import Loader from '@/components/ui/Loader';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { SalarySlipDialog } from '@/components/payroll/SalarySlipDialog';

export default function MyPayslips() {
    const { user } = useAuth();
    const [selectedSlip, setSelectedSlip] = useState<any>(null);

    // Fetch user's salary slips
    const { data: slips = [], isLoading } = useQuery({
        queryKey: ['my-payslips', user?.id],
        queryFn: async () => {
            const { data } = await payrollService.getSlips();
            return data;
        },
    });

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = async () => {
        if (!selectedSlip) return;
        const element = document.getElementById('payslip-content');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#ffffff',
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`payslip-${String(selectedSlip.month).padStart(2, '0')}-${selectedSlip.year}.pdf`);
            toast.success('Payslip downloaded successfully');
        } catch (error) {
            console.error('PDF generation failed:', error);
            toast.error('Failed to generate PDF');
        }
    };

    const columns: Column<any>[] = [
        {
            key: 'period',
            header: 'Period',
            cell: (slip) => (
                <span className="font-medium">
                    {format(new Date(slip.year, slip.month - 1), 'MMMM yyyy')}
                </span>
            ),
        },
        {
            key: 'basic',
            header: 'Basic Salary',
            cell: (slip) => <span>₹{Number(slip.basic_salary).toLocaleString('en-IN')}</span>,
        },
        {
            key: 'bonus',
            header: 'Bonus',
            cell: (slip) => (
                <span className="text-success">
                    {slip.bonus > 0 ? `+₹${Number(slip.bonus).toLocaleString('en-IN')}` : '-'}
                </span>
            ),
        },
        {
            key: 'deductions',
            header: 'Deductions',
            cell: (slip) => {
                const totalDeductions = Number(slip.lop) + Number(slip.other_deductions);
                return (
                    <span className="text-destructive">
                        -₹{totalDeductions.toLocaleString('en-IN')}
                    </span>
                );
            },
        },
        {
            key: 'net',
            header: 'Net Salary',
            cell: (slip) => (
                <span className="font-bold text-lg text-primary">
                    ₹{Number(slip.net_salary).toLocaleString('en-IN')}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (slip) => <StatusBadge status={slip.status} />,
        },
        {
            key: 'actions',
            header: '',
            cell: (slip) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSlip(slip)}
                >
                    <FileText className="w-4 h-4 mr-2" />
                    View
                </Button>
            ),
        },
    ];

    const latestSlip = slips[0];

    return (

        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="My Payslips"
                description="View and download your salary slips"
            />

            {/* Summary Cards */}
            {latestSlip && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        ₹{Number(latestSlip.net_salary).toLocaleString('en-IN')}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Latest Net Pay</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{slips.length}</p>
                                    <p className="text-sm text-muted-foreground">Total Payslips</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-success" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        ₹{slips.reduce((sum: number, s: any) => sum + Number(s.net_salary), 0).toLocaleString('en-IN')}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Payslips Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Salary Slips</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Loader />
                            <p className="text-muted-foreground mt-2">Loading payslips...</p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={slips}
                            keyExtractor={(slip) => slip.id}
                            emptyMessage="No payslips found"
                        />
                    )}
                </CardContent>
            </Card>

            {/* Payslip Detail Dialog */}
            <SalarySlipDialog
                isOpen={!!selectedSlip}
                onClose={() => setSelectedSlip(null)}
                slip={selectedSlip}
                employeeName={user?.name}
                employeeId={user?.employeeId}
            />
        </div>

    );
}
