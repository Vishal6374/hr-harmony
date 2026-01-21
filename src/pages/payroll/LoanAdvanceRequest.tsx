import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable, Column } from '@/components/ui/data-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, DollarSign, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function LoanAdvanceRequest() {
    const { user, isHR } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        type: 'advance' as 'loan' | 'advance',
        amount: 0,
        reason: '',
        repayment_months: 1,
    });

    // Temporarily disabled - requires database tables
    const requests = [];
    const isLoading = false;

    /*
    const { data: requests = [], isLoading } = useQuery({
      queryKey: ['loan-advances', user?.id],
      queryFn: async () => {
        const { data } = await payrollService.getLoanAdvances({
          employee_id: !isHR ? user?.id : undefined,
        });
        return data;
      },
    });
    */

    const createMutation = useMutation({
        mutationFn: (data: any) => payrollService.createLoanAdvance(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loan-advances'] });
            toast.success('Request submitted successfully');
            setIsDialogOpen(false);
            resetForm();
        },
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
            payrollService.approveLoanAdvance(id, remarks),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loan-advances'] });
            toast.success('Request approved');
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, remarks }: { id: string; remarks: string }) =>
            payrollService.rejectLoanAdvance(id, remarks),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loan-advances'] });
            toast.success('Request rejected');
        },
    });

    const resetForm = () => {
        setFormData({
            type: 'advance',
            amount: 0,
            reason: '',
            repayment_months: 1,
        });
    };

    const handleSubmit = () => {
        if (!formData.amount || !formData.reason) {
            toast.error('Please fill all required fields');
            return;
        }

        createMutation.mutate({
            type: formData.type,
            amount: formData.amount,
            reason: formData.reason,
            repayment_months: formData.type === 'loan' ? formData.repayment_months : undefined,
        });
    };

    const pendingRequests = requests.filter((r: any) => r.status === 'pending');
    const approvedRequests = requests.filter((r: any) => r.status === 'approved' || r.status === 'disbursed');
    const totalBorrowed = approvedRequests.reduce((sum: number, r: any) => sum + Number(r.amount), 0);

    const columns: Column<any>[] = [
        {
            key: 'type',
            header: 'Type',
            cell: (req) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${req.type === 'loan' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                    {req.type.toUpperCase()}
                </span>
            ),
        },
        {
            key: 'amount',
            header: 'Amount',
            cell: (req) => <span className="font-semibold">₹{Number(req.amount).toLocaleString()}</span>,
        },
        {
            key: 'reason',
            header: 'Reason',
            cell: (req) => <span className="text-sm">{req.reason}</span>,
        },
        {
            key: 'repayment_months',
            header: 'Repayment',
            cell: (req) => req.repayment_months ? `${req.repayment_months} months` : 'One-time',
        },
        {
            key: 'monthly_deduction',
            header: 'Monthly Deduction',
            cell: (req) => req.monthly_deduction ? `₹${Number(req.monthly_deduction).toLocaleString()}` : '-',
        },
        {
            key: 'status',
            header: 'Status',
            cell: (req) => {
                const statusConfig = {
                    pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
                    approved: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Approved' },
                    rejected: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Rejected' },
                    disbursed: { icon: DollarSign, color: 'bg-blue-100 text-blue-700', label: 'Disbursed' },
                    repaid: { icon: CheckCircle, color: 'bg-gray-100 text-gray-700', label: 'Repaid' },
                };
                const config = statusConfig[req.status as keyof typeof statusConfig];
                const Icon = config.icon;
                return (
                    <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${config.color}`}>
                        <Icon className="w-3 h-3" />
                        {config.label}
                    </span>
                );
            },
        },
        {
            key: 'created_at',
            header: 'Requested On',
            cell: (req) => format(new Date(req.created_at), 'dd MMM yyyy'),
        },
        {
            key: 'actions',
            header: '',
            cell: (req) => (
                <div className="flex items-center gap-2">
                    {isHR && req.status === 'pending' && (
                        <>
                            <Button
                                size="sm"
                                onClick={() => approveMutation.mutate({ id: req.id })}
                            >
                                Approve
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                    const remarks = prompt('Rejection reason:');
                                    if (remarks) rejectMutation.mutate({ id: req.id, remarks });
                                }}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                    {req.status === 'rejected' && req.remarks && (
                        <span className="text-xs text-red-600">{req.remarks}</span>
                    )}
                </div>
            ),
        },
    ];

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <PageHeader
                    title="Loan & Advance Requests"
                    description={isHR ? "Manage employee loan and advance requests" : "Request salary advance or loan"}
                >
                    {!isHR && (
                        <Button onClick={() => setIsDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            New Request
                        </Button>
                    )}
                </PageHeader>

                {/* Summary Cards */}
                {!isHR && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                                        <DollarSign className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Borrowed</p>
                                        <p className="text-2xl font-bold">₹{totalBorrowed.toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-yellow-500 flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Pending Requests</p>
                                        <p className="text-2xl font-bold">{pendingRequests.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Approved Requests</p>
                                        <p className="text-2xl font-bold">{approvedRequests.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-6">
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-blue-500" />
                                Salary Advance
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Request an advance on your upcoming salary. This will be deducted from your next paycheck.
                                Typically approved for emergencies or urgent needs.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="pt-6">
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-500" />
                                Salary Loan
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Request a loan to be repaid over multiple months. Monthly deductions will be automatically
                                calculated and deducted from your salary.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{isHR ? 'All Requests' : 'My Requests'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : (
                            <DataTable
                                columns={columns}
                                data={requests}
                                keyExtractor={(r) => r.id}
                                emptyMessage="No requests found"
                            />
                        )}
                    </CardContent>
                </Card>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>New Loan/Advance Request</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <Label>Request Type *</Label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                >
                                    <option value="advance">Salary Advance (One-time)</option>
                                    <option value="loan">Salary Loan (Multiple months)</option>
                                </select>
                            </div>

                            <div>
                                <Label>Amount (₹) *</Label>
                                <Input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                    placeholder="Enter amount"
                                />
                            </div>

                            {formData.type === 'loan' && (
                                <div>
                                    <Label>Repayment Period (Months) *</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="12"
                                        value={formData.repayment_months}
                                        onChange={(e) => setFormData({ ...formData, repayment_months: Number(e.target.value) })}
                                        placeholder="Number of months"
                                    />
                                    {formData.amount > 0 && formData.repayment_months > 0 && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Monthly deduction: ₹{Math.round(formData.amount / formData.repayment_months).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div>
                                <Label>Reason *</Label>
                                <Textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    placeholder="Please provide a reason for this request"
                                    rows={4}
                                />
                            </div>

                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    <strong>Note:</strong> Your request will be reviewed by HR. Approval is subject to company policy
                                    and your employment terms. Please ensure you have read the loan/advance policy before submitting.
                                </p>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSubmit}>
                                    Submit Request
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
}
