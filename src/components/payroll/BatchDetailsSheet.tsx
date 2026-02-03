import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { payrollService } from '@/services/apiService';
import { format } from 'date-fns';
import Loader from '@/components/ui/Loader';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';

interface BatchDetailsSheetProps {
    batch: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function BatchDetailsSheet({ batch, open, onOpenChange }: BatchDetailsSheetProps) {
    const { data: slips = [], isLoading } = useQuery({
        queryKey: ['payroll-slips', 'batch', batch?.id],
        queryFn: async () => {
            if (!batch?.id) return [];
            const { data } = await payrollService.getSlips({ batch_id: batch.id });
            return data;
        },
        enabled: !!batch?.id && open,
    });

    // Group slips by date to show multiple "runs" within a batch
    const groupedSlips = slips.reduce((acc: any, slip: any) => {
        const date = format(new Date(slip.generated_at), 'yyyy-MM-dd HH:mm');
        if (!acc[date]) acc[date] = [];
        acc[date].push(slip);
        return acc;
    }, {});

    const sortedDates = Object.keys(groupedSlips).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-2xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-5 h-5 text-primary" />
                        <SheetTitle className="text-xl">Payroll Segregation Details</SheetTitle>
                    </div>
                    <SheetDescription className="text-sm">
                        Detailed breakdown of processing runs for <strong>{batch && format(new Date(batch.year, batch.month - 1), 'MMMM yyyy')}</strong>.
                    </SheetDescription>
                </SheetHeader>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader />
                        <p className="text-sm text-muted-foreground mt-4 font-medium">Fetching detailed breakdown...</p>
                    </div>
                ) : slips.length === 0 ? (
                    <div className="text-center py-20 bg-muted/30 rounded-xl border-2 border-dashed border-muted">
                        <p className="text-muted-foreground font-medium">No transactions found in this batch.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-4 p-5 bg-primary/5 rounded-2xl border border-primary/10">
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-primary/60 mb-1">Status</p>
                                <StatusBadge status={batch?.status} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-primary/60 mb-1">Total Payout</p>
                                <p className="text-lg font-black text-primary">₹{Number(batch?.total_amount).toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-primary/60 mb-1">Paid Date</p>
                                <p className="text-sm font-semibold">
                                    {batch?.paid_at ? format(new Date(batch.paid_at), 'dd MMM yyyy') : 'Pending'}
                                </p>
                            </div>
                        </div>

                        {/* Grouped Runs */}
                        <div className="space-y-8">
                            {sortedDates.map((date, index) => (
                                <div key={date} className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-muted">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="absolute left-[-4px] top-2 w-2.5 h-2.5 rounded-full bg-primary border-4 border-background ring-2 ring-primary/20" />
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold tracking-tight">Processing Run #{sortedDates.length - index}</h3>
                                                <Badge variant="outline" className="text-[10px] py-0 h-4 bg-muted/50">
                                                    {groupedSlips[date].length} Employees
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Clock className="w-3 h-3" />
                                                    <span>Processed: {format(new Date(date), 'dd MMM, hh:mm a')}</span>
                                                </div>
                                                {batch?.paid_at && (
                                                    <div className="flex items-center gap-1.5 text-xs text-success font-medium">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        <span>Paid: {format(new Date(batch.paid_at), 'dd MMM')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-muted/50 overflow-hidden bg-card shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-muted/30">
                                                <TableRow className="hover:bg-transparent border-0">
                                                    <TableHead className="h-9 text-[10px] uppercase font-bold text-muted-foreground px-4">Employee Details</TableHead>
                                                    <TableHead className="h-9 text-[10px] uppercase font-bold text-muted-foreground text-right px-4">Net Payout</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {groupedSlips[date].map((slip: any) => (
                                                    <TableRow key={slip.id} className="hover:bg-muted/20 border-muted/30 last:border-0">
                                                        <TableCell className="py-2.5 px-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-semibold">{slip.employee?.name}</span>
                                                                <code className="text-[10px] text-muted-foreground bg-muted/50 px-1 w-fit rounded">{slip.employee?.employee_id}</code>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-2.5 px-4 text-right">
                                                            <span className="text-sm font-black text-primary">₹{Number(slip.net_salary).toLocaleString('en-IN')}</span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
