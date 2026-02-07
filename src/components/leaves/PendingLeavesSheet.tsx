import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface PendingLeavesSheetProps {
    leaves: any[];
    employees: any[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

export default function PendingLeavesSheet({
    leaves,
    employees,
    open,
    onOpenChange,
    onApprove,
    onReject
}: PendingLeavesSheetProps) {
    const { isHR } = useAuth();
    const pendingLeaves = leaves.filter(l => l.status === 'pending' || l.status === 'pending_hr');

    const getEmployeeDetails = (employeeId: string) => employees.find((e: any) => e.id === employeeId);

    const columns: Column<any>[] = [
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
                            <p className="text-[10px] text-muted-foreground">{emp?.employee_id}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'type',
            header: 'Type',
            cell: (leave) => <span className="capitalize text-xs font-medium">{leave.leave_type}</span>
        },
        {
            key: 'dates',
            header: 'Dates',
            cell: (leave) => (
                <div className="text-[10px]">
                    <p>{format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d')}</p>
                    <p className="text-muted-foreground">{leave.days} days</p>
                </div>
            ),
        },
        {
            key: 'actions',
            header: '',
            cell: (leave) => (
                <div className="flex items-center gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-success hover:text-success hover:bg-success/10"
                        onClick={() => onApprove(leave.id)}
                    >
                        <Check className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onReject(leave.id)}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-warning" />
                        <SheetTitle>Pending Leave Requests</SheetTitle>
                    </div>
                    <SheetDescription>
                        You have {pendingLeaves.length} pending leave requests that require action.
                    </SheetDescription>
                </SheetHeader>

                {pendingLeaves.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Check className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground font-medium">All caught up!</p>
                        <p className="text-xs text-muted-foreground">No pending leave requests found.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <DataTable
                            columns={columns}
                            data={pendingLeaves}
                            keyExtractor={(l) => l.id}
                            emptyMessage="No pending requests"
                        />
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
