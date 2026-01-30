import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Resignation } from '@/types/hrms';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resignationService } from '@/services/apiService';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import Loader from '@/components/ui/Loader';

export default function Resignations() {
    const { isHR, user } = useAuth();
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [selectedResignation, setSelectedResignation] = useState<Resignation | null>(null);
    const [hrRemarks, setHrRemarks] = useState('');
    const [approvedLWD, setApprovedLWD] = useState('');

    const queryClient = useQueryClient();

    const { data: resignations = [], isLoading } = useQuery({
        queryKey: ['resignations'],
        queryFn: async () => {
            const { data } = await resignationService.getRequests();
            return data;
        },
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, data }: any) => resignationService.approve(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resignations'] });
            setIsApproveDialogOpen(false);
            setSelectedResignation(null);
            setHrRemarks('');
            toast.success('Resignation approved successfully');
        },
        onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to approve'),
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, remarks }: any) => resignationService.reject(id, remarks),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resignations'] });
            setIsRejectDialogOpen(false);
            setSelectedResignation(null);
            setHrRemarks('');
            toast.success('Resignation rejected');
        },
        onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to reject'),
    });

    const columns: Column<Resignation>[] = [
        {
            key: 'employee',
            header: 'Employee',
            cell: (res: any) => (
                <div>
                    <p className="font-medium">{res.employee?.name}</p>
                    <p className="text-xs text-muted-foreground">{res.employee?.employee_id}</p>
                </div>
            ),
        },
        {
            key: 'preferredLWD',
            header: 'Preferred LWD',
            cell: (res) => (
                <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm">{format(new Date(res.preferredLastWorkingDay), 'MMM dd, yyyy')}</span>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (res) => <StatusBadge status={res.status} />,
        },
        {
            key: 'appliedAt',
            header: 'Applied On',
            cell: (res) => <span className="text-muted-foreground text-sm">{format(new Date(res.createdAt), 'MMM dd, yyyy')}</span>,
        },
        {
            key: 'approvedLWD',
            header: 'Approved LWD',
            cell: (res) => res.approvedLastWorkingDay ? <span>{format(new Date(res.approvedLastWorkingDay), 'MMM dd, yyyy')}</span> : <span className="text-muted-foreground">-</span>,
        },
        {
            key: 'actions',
            header: '',
            cell: (res) => (
                isHR && res.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-success hover:text-success hover:bg-success/10"
                            onClick={() => {
                                setSelectedResignation(res);
                                setApprovedLWD(format(new Date(res.preferredLastWorkingDay), 'yyyy-MM-dd'));
                                setIsApproveDialogOpen(true);
                            }}
                        >
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                                setSelectedResignation(res);
                                setIsRejectDialogOpen(true);
                            }}
                        >
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                    </div>
                ) : null
            ),
        },
    ];

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <PageHeader
                    title="Exit Management"
                    description={isHR ? "Manage employee resignations and offboarding." : "Track your resignation request status."}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-card border shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Pending Requests</p>
                            <p className="text-2xl font-bold">{resignations.filter((r: any) => r.status === 'pending').length}</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-card border shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Approved</p>
                            <p className="text-2xl font-bold">{resignations.filter((r: any) => r.status === 'approved').length}</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-card border shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                            <XCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Rejected</p>
                            <p className="text-2xl font-bold">{resignations.filter((r: any) => r.status === 'rejected').length}</p>
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={resignations}
                    keyExtractor={(res) => res.id}
                    emptyMessage="No resignation requests found"
                />

                {/* Approve Dialog */}
                <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Approve Resignation</DialogTitle>
                            <DialogDescription>
                                Set the final working day for {(selectedResignation as any)?.employee?.name || 'employee'}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Approved Last Working Day</Label>
                                <Input type="date" value={approvedLWD} onChange={e => setApprovedLWD(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Remarks (Optional)</Label>
                                <Textarea value={hrRemarks} onChange={e => setHrRemarks(e.target.value)} placeholder="Enter any handover notes or remarks..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>Cancel</Button>
                            <Button onClick={() => approveMutation.mutate({
                                id: selectedResignation?.id,
                                data: { approved_last_working_day: approvedLWD, hr_remarks: hrRemarks }
                            })} disabled={approveMutation.isPending}>
                                {approveMutation.isPending && <Loader size="small" variant="white" className="mr-2" />}
                                Confirm Approval
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Reject Dialog */}
                <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reject Resignation</DialogTitle>
                            <DialogDescription>
                                Please provide a reason for rejecting this resignation.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Rejection Reason*</Label>
                                <Textarea value={hrRemarks} onChange={e => setHrRemarks(e.target.value)} placeholder="Reason for rejection..." required />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
                            <Button
                                variant="destructive"
                                onClick={() => rejectMutation.mutate({ id: selectedResignation?.id, remarks: hrRemarks })}
                                disabled={rejectMutation.isPending || !hrRemarks}
                            >
                                {rejectMutation.isPending && <Loader size="small" variant="white" className="mr-2" />}
                                Reject Request
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
}
