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
import { FileText, Download, Printer, DollarSign, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

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
                            <div className="text-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
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
                <Dialog open={!!selectedSlip} onOpenChange={() => setSelectedSlip(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Salary Slip</DialogTitle>
                        </DialogHeader>

                        {selectedSlip && (
                            <div className="space-y-6">
                                <div id="payslip-content" className="space-y-6 bg-white p-6 rounded-lg">
                                    {/* Header */}
                                    <div className="text-center border-b pb-4">
                                        <h2 className="text-2xl font-bold">Salary Slip</h2>
                                        <p className="text-muted-foreground">
                                            {format(new Date(selectedSlip.year, selectedSlip.month - 1), 'MMMM yyyy')}
                                        </p>
                                    </div>

                                    {/* Employee Info */}
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Employee Name</p>
                                            <p className="font-medium">{user?.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Employee ID</p>
                                            <p className="font-medium">{user?.employeeId}</p>
                                        </div>
                                    </div>

                                    {/* Attendance */}
                                    <div className="bg-muted p-4 rounded-lg">
                                        <h3 className="font-semibold mb-2">Attendance Summary</h3>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Total Days</p>
                                                <p className="font-medium">{selectedSlip.total_days}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Present Days</p>
                                                <p className="font-medium text-success">{selectedSlip.present_days}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Absent Days</p>
                                                <p className="font-medium text-destructive">{selectedSlip.absent_days}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Earnings */}
                                    <div>
                                        <h3 className="font-semibold mb-3">Earnings</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span>Basic Salary</span>
                                                <span className="font-medium">₹{Number(selectedSlip.basic_salary).toLocaleString('en-IN')}</span>
                                            </div>
                                            {selectedSlip.bonus > 0 && (
                                                <div className="flex justify-between text-success">
                                                    <span>Bonus</span>
                                                    <span className="font-medium">+₹{Number(selectedSlip.bonus).toLocaleString('en-IN')}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between border-t pt-2">
                                                <span className="font-semibold">Gross Salary</span>
                                                <span className="font-semibold">₹{Number(selectedSlip.gross_salary).toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Deductions */}
                                    <div>
                                        <h3 className="font-semibold mb-3">Deductions</h3>
                                        <div className="space-y-2">
                                            {selectedSlip.lop > 0 && (
                                                <div className="flex justify-between text-destructive">
                                                    <span>Loss of Pay (LOP)</span>
                                                    <span className="font-medium">-₹{Number(selectedSlip.lop).toLocaleString('en-IN')}</span>
                                                </div>
                                            )}
                                            {selectedSlip.other_deductions > 0 && (
                                                <div className="flex justify-between text-destructive">
                                                    <span>Other Deductions</span>
                                                    <span className="font-medium">-₹{Number(selectedSlip.other_deductions).toLocaleString('en-IN')}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between border-t pt-2">
                                                <span className="font-semibold">Total Deductions</span>
                                                <span className="font-semibold text-destructive">
                                                    -₹{(Number(selectedSlip.lop) + Number(selectedSlip.other_deductions)).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Net Salary */}
                                    <div className="bg-primary/10 p-4 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-semibold">Net Salary</span>
                                            <span className="text-2xl font-bold text-primary">
                                                ₹{Number(selectedSlip.net_salary).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {selectedSlip.notes && (
                                        <div className="text-sm">
                                            <p className="text-muted-foreground">Notes:</p>
                                            <p>{selectedSlip.notes}</p>
                                        </div>
                                    )}

                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 justify-end" data-html2canvas-ignore>
                                    <Button variant="outline" onClick={handlePrint}>
                                        <Printer className="w-4 h-4 mr-2" />
                                        Print
                                    </Button>
                                    <Button onClick={handleDownload}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Download PDF
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
     
    );
}
