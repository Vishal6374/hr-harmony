import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteEmployeeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: any;
    onConfirm: () => void;
    isLoading: boolean;
    isPermanent?: boolean;
}

export function DeleteEmployeeModal({
    open,
    onOpenChange,
    employee,
    onConfirm,
    isLoading,
    isPermanent = true, // Default to permanent deletion
}: DeleteEmployeeModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="w-5 h-5" />
                        {isPermanent ? 'Permanently Delete Employee' : 'Delete Employee'}
                    </DialogTitle>
                    <DialogDescription>
                        {isPermanent
                            ? 'This will permanently remove the employee from the database. This action cannot be undone!'
                            : 'This will mark the employee as terminated.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Employee Info */}
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm font-medium">{employee?.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {employee?.employee_id} • {employee?.department?.name || 'N/A'}
                        </p>
                    </div>

                    {/* Warning */}
                    <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-red-900">
                            <p className="font-medium">
                                {isPermanent ? 'PERMANENT DELETION WARNING!' : 'Deletion Warning'}
                            </p>
                            {isPermanent ? (
                                <ul className="text-xs mt-1 space-y-1">
                                    <li>• Employee record will be permanently deleted</li>
                                    <li>• All associated data will be removed</li>
                                    <li>• This action CANNOT be undone</li>
                                    <li>• Consider termination instead if you want to preserve records</li>
                                </ul>
                            ) : (
                                <ul className="text-xs mt-1 space-y-1">
                                    <li>• Employee will be marked as "Terminated"</li>
                                    <li>• They will lose access to the system</li>
                                    <li>• All records will be preserved</li>
                                    <li>• This can be reversed later if needed</li>
                                </ul>
                            )}
                        </div>
                    </div>

                    <p className="text-sm text-center text-muted-foreground">
                        Are you sure you want to {isPermanent ? 'permanently delete' : 'delete'} this employee?
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
                        type="button"
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading
                            ? (isPermanent ? 'Deleting...' : 'Deleting...')
                            : (isPermanent ? 'Permanently Delete' : 'Delete Employee')
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
