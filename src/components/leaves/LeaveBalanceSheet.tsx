import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, Info } from 'lucide-react';

interface LeaveBalanceSheetProps {
    balances: any[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function LeaveBalanceSheet({
    balances,
    open,
    onOpenChange
}: LeaveBalanceSheetProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetHeader className="mb-6">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-primary" />
                        <SheetTitle>My Leave Balance</SheetTitle>
                    </div>
                    <SheetDescription>
                        Detailed view of your leave entitlement and remaining balances.
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                    {balances.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            No leave balances found.
                        </div>
                    ) : (
                        balances.map((balance) => {
                            const usagePercent = (balance.used / balance.total) * 100;
                            const remainingPercent = (balance.remaining / balance.total) * 100;

                            return (
                                <div key={balance.leave_type} className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-sm capitalize">{balance.leave_type.replace('_', ' ')}</h4>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Leave Category</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-primary">{balance.remaining}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Days Left</p>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-bold uppercase">
                                            <span className="text-muted-foreground">Used: {balance.used}d</span>
                                            <span className="text-primary">Total: {balance.total}d</span>
                                        </div>
                                        <Progress value={remainingPercent} className="h-1.5" />
                                    </div>

                                    {balance.total > 0 && (
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 p-1.5 rounded-md">
                                            <Info className="w-3 h-3" />
                                            <span>You have consumed {usagePercent.toFixed(0)}% of your annual quota.</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
