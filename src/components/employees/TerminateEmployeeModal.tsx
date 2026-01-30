import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { UserX, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface TerminateEmployeeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: any;
    onConfirm: (data: { termination_date: string; termination_reason: string }) => void;
    isLoading: boolean;
}

export function TerminateEmployeeModal({
    open,
    onOpenChange,
    employee,
    onConfirm,
    isLoading,
}: TerminateEmployeeModalProps) {
    const [formData, setFormData] = useState({
        termination_date: format(new Date(), 'yyyy-MM-dd'),
        termination_reason: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.termination_reason.trim()) {
            toast.error('Please provide a reason for termination');
            return;
        }

        onConfirm(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <UserX className="w-5 h-5" />
                        Terminate Employee
                    </DialogTitle>
                    <DialogDescription>
                        This will mark the employee as terminated. This action can be reversed if needed.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Employee Info */}
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm font-medium">{employee?.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {employee?.employee_id} • {employee?.department?.name || 'N/A'}
                        </p>
                    </div>

                    {/* Warning */}
                    <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-900">
                            <p className="font-medium">Important:</p>
                            <ul className="text-xs mt-1 space-y-1">
                                <li>• Employee will be marked as "Terminated"</li>
                                <li>• They will lose access to the system</li>
                                <li>• All records will be preserved</li>
                                <li>• This can be reversed by changing status back to "Active"</li>
                            </ul>
                        </div>
                    </div>

                    {/* Termination Date */}
                    <div className="space-y-2">
                        <Label htmlFor="termination_date">
                            Termination Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="termination_date"
                            type="date"
                            value={formData.termination_date}
                            onChange={(e) => setFormData({ ...formData, termination_date: e.target.value })}
                            required
                        />
                    </div>

                    {/* Termination Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="termination_reason">
                            Reason for Termination <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="termination_reason"
                            value={formData.termination_reason}
                            onChange={(e) => setFormData({ ...formData, termination_reason: e.target.value })}
                            placeholder="Provide detailed reason for termination..."
                            rows={4}
                            required
                            className="border-destructive/30 focus:border-destructive"
                        />
                        <p className="text-xs text-muted-foreground">
                            This will be recorded in the employee's profile
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Terminating...' : 'Terminate Employee'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
