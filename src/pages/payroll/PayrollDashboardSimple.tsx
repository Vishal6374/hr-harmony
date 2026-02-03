import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService } from '@/services/apiService';
import { AlertCircle, CheckCircle2, DollarSign, Users, Calendar, Check, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useState } from 'react';
import BatchDetailsSheet from '@/components/payroll/BatchDetailsSheet';

export default function PayrollDashboardSimple() {
    const queryClient = useQueryClient();
    const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Fetch recent payroll batches
    const { data: batches = [], isLoading } = useQuery({
        queryKey: ['payroll-batches'],
        queryFn: async () => {
            const { data } = await payrollService.getBatches();
            return data;
        },
    });

    // Mark as paid mutation
    const markPaidMutation = useMutation({
        mutationFn: (batchId: string) => payrollService.markPaid(batchId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payroll-batches'] });
            toast.success('Payroll marked as paid successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to mark payroll as paid');
        },
    });

    const recentBatches = [...batches].sort((a, b) => {
        // Prioritize 'processed' or 'draft' status
        const isAPending = a.status === 'processed' || a.status === 'draft';
        const isBPending = b.status === 'processed' || b.status === 'draft';

        if (isAPending && !isBPending) return -1;
        if (!isAPending && isBPending) return 1;

        // Then sort by year/month descending
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
    });

    const pendingBatches = batches.filter((b: any) => b.status === 'processed' || b.status === 'draft');
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const currentMonthProcessed = batches.find((b: any) => b.month === currentMonth && b.year === currentYear);

    const columns: Column<any>[] = [
        {
            key: 'period',
            header: 'Period',
            cell: (batch) => (
                <span className="font-medium">
                    {format(new Date(batch.year, batch.month - 1), 'MMMM yyyy')}
                </span>
            ),
        },
        {
            key: 'employees',
            header: 'Employees',
            cell: (batch) => <span>{batch.total_employees}</span>,
        },
        {
            key: 'amount',
            header: 'Total Amount',
            cell: (batch) => (
                <span className="font-semibold">
                    ₹{Number(batch.total_amount).toLocaleString('en-IN')}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (batch) => <StatusBadge status={batch.status} />,
        },
        {
            key: 'date',
            header: 'Processed Date',
            cell: (batch) => (
                <span className="text-sm text-muted-foreground">
                    {batch.processed_at ? format(new Date(batch.processed_at), 'dd MMM yyyy') : '-'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            cell: (batch) => (
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setSelectedBatch(batch);
                            setIsDetailsOpen(true);
                        }}
                        className="gap-1 h-8"
                    >
                        <Eye className="w-3 h-3" />
                        Details
                    </Button>
                    {batch.status === 'processed' ? (
                        <Button
                            size="sm"
                            onClick={() => markPaidMutation.mutate(batch.id)}
                            disabled={markPaidMutation.isPending}
                            className="gap-1 h-8"
                        >
                            <Check className="w-3 h-3" />
                            Mark Paid
                        </Button>
                    ) : batch.status === 'paid' ? (
                        <span className="text-xs text-success font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Paid
                        </span>
                    ) : null}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Alert for current month */}
            {!currentMonthProcessed && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-orange-900">
                                    Payroll Not Processed for {format(new Date(), 'MMMM yyyy')}
                                </h3>
                                <p className="text-sm text-orange-700 mt-1">
                                    Please process the payroll for the current month.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pending batches alert */}
            {pendingBatches.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-yellow-900">
                                    {pendingBatches.length} Pending Payroll Batch{pendingBatches.length > 1 ? 'es' : ''}
                                </h3>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Mark as paid to complete the payroll process.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {batches.length}
                                </p>
                                <p className="text-sm text-muted-foreground">Total Batches</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-success" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {batches.filter((b: any) => b.status === 'paid').length}
                                </p>
                                <p className="text-sm text-muted-foreground">Paid Batches</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {recentBatches[0]?.total_employees || 0}
                                </p>
                                <p className="text-sm text-muted-foreground">Last Batch Employees</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Payrolls */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Payroll Batches History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Loading payroll history...
                        </div>
                    ) : recentBatches.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No payroll batches found. Process your first payroll to get started.
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={recentBatches}
                            keyExtractor={(batch) => batch.id}
                            emptyMessage="No payroll batches"
                        />
                    )}
                </CardContent>
            </Card>

            <BatchDetailsSheet
                batch={selectedBatch}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
            />
        </div>
    );
}
