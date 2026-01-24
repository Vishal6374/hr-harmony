import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Clock, Calendar, User, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AttendanceEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    attendance: any;
    employee: any;
    settings: any;
    onSave: (data: any) => void;
    isSaving: boolean;
}

export function AttendanceEditModal({
    open,
    onOpenChange,
    attendance,
    employee,
    settings,
    onSave,
    isSaving,
}: AttendanceEditModalProps) {
    const [formData, setFormData] = useState({
        date: '',
        check_in: '',
        check_out: '',
        status: '',
        notes: '',
        edit_reason: '',
    });

    const [calculatedHours, setCalculatedHours] = useState<number | null>(null);
    const [calculatedStatus, setCalculatedStatus] = useState<string>('');
    const [manualStatusOverride, setManualStatusOverride] = useState(false);

    useEffect(() => {
        if (attendance) {
            setFormData({
                date: attendance.date ? format(new Date(attendance.date), 'yyyy-MM-dd') : '',
                check_in: attendance.check_in ? format(new Date(attendance.check_in), "yyyy-MM-dd'T'HH:mm") : '',
                check_out: attendance.check_out ? format(new Date(attendance.check_out), "yyyy-MM-dd'T'HH:mm") : '',
                status: '', // Don't pre-fill status - let it auto-calculate
                notes: attendance.notes || '',
                edit_reason: '',
            });
            setManualStatusOverride(false);
        }
    }, [attendance]);

    useEffect(() => {
        if (formData.check_in && formData.check_out) {
            const checkIn = new Date(formData.check_in);
            const checkOut = new Date(formData.check_out);

            if (checkOut > checkIn) {
                const diffMs = checkOut.getTime() - checkIn.getTime();
                const hours = diffMs / (1000 * 60 * 60);
                setCalculatedHours(Math.round(hours * 100) / 100);

                // Calculate status based on settings
                if (settings) {
                    if (hours < settings.half_day_threshold) {
                        setCalculatedStatus('absent');
                    } else if (hours >= settings.half_day_threshold && hours < settings.standard_work_hours) {
                        setCalculatedStatus('half_day');
                    } else {
                        setCalculatedStatus('present');
                    }
                }
            } else {
                setCalculatedHours(null);
                setCalculatedStatus('');
            }
        } else {
            setCalculatedHours(null);
            setCalculatedStatus('');
        }
    }, [formData.check_in, formData.check_out, settings]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.edit_reason.trim()) {
            toast.error('Please provide a reason for editing this attendance record');
            return;
        }

        // Only send status if manually overridden, otherwise let backend calculate
        const dataToSend: any = {
            check_in: formData.check_in ? new Date(formData.check_in).toISOString() : null,
            check_out: formData.check_out ? new Date(formData.check_out).toISOString() : null,
            notes: formData.notes,
            edit_reason: formData.edit_reason,
        };

        // Only include status if user manually selected one
        if (manualStatusOverride && formData.status) {
            dataToSend.status = formData.status;
        }

        onSave(dataToSend);
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'present': return 'bg-green-100 text-green-800 border-green-300';
            case 'absent': return 'bg-red-100 text-red-800 border-red-300';
            case 'half_day': return 'bg-amber-100 text-amber-800 border-amber-300';
            case 'on_leave': return 'bg-blue-100 text-blue-800 border-blue-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Edit Attendance - {employee?.name}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Employee Info */}
                    <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">{employee?.name}</p>
                        <p className="text-xs text-muted-foreground">{employee?.employee_id} • {employee?.department?.name || 'N/A'}</p>
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <Label htmlFor="date" className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Date
                        </Label>
                        <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>

                    {/* Check In and Check Out in one row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="check_in" className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-green-600" />
                                Check In Time
                            </Label>
                            <Input
                                id="check_in"
                                type="time"
                                value={formData.check_in ? format(new Date(formData.check_in), 'HH:mm') : ''}
                                onChange={(e) => {
                                    // Combine date with time
                                    const dateStr = formData.date || format(new Date(), 'yyyy-MM-dd');
                                    const timeStr = e.target.value;
                                    setFormData({ ...formData, check_in: timeStr ? `${dateStr}T${timeStr}` : '' });
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="check_out" className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-red-600" />
                                Check Out Time
                            </Label>
                            <Input
                                id="check_out"
                                type="time"
                                value={formData.check_out ? format(new Date(formData.check_out), 'HH:mm') : ''}
                                onChange={(e) => {
                                    // Combine date with time
                                    const dateStr = formData.date || format(new Date(), 'yyyy-MM-dd');
                                    const timeStr = e.target.value;
                                    setFormData({ ...formData, check_out: timeStr ? `${dateStr}T${timeStr}` : '' });
                                }}
                            />
                        </div>
                    </div>

                    {/* Calculated Work Hours */}
                    {calculatedHours !== null && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-900">Calculated Work Hours</p>
                                    <p className="text-2xl font-bold text-blue-600">{calculatedHours.toFixed(2)} hours</p>
                                </div>
                                {calculatedStatus && (
                                    <div>
                                        <p className="text-xs text-blue-700 mb-1">Auto Status</p>
                                        <span className={cn('px-3 py-1 rounded-full text-xs font-medium border', getStatusBadgeClass(calculatedStatus))}>
                                            {calculatedStatus.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-blue-700 mt-2">
                                Based on settings: {settings?.half_day_threshold}h (half day) / {settings?.standard_work_hours}h (full day)
                            </p>
                        </div>
                    )}

                    {/* Manual Status Override */}
                    <div className="space-y-2">
                        <Label htmlFor="status">Status (Optional Override)</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value) => {
                                setFormData({ ...formData, status: value });
                                setManualStatusOverride(true);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Auto-calculate from hours" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="present">Present</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                                <SelectItem value="half_day">Half Day</SelectItem>
                                <SelectItem value="on_leave">On Leave</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Leave empty to auto-calculate based on work hours</p>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Additional notes about this attendance..."
                            rows={2}
                        />
                    </div>

                    {/* Edit Reason (Required) */}
                    <div className="space-y-2">
                        <Label htmlFor="edit_reason" className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-600" />
                            Reason for Edit <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="edit_reason"
                            value={formData.edit_reason}
                            onChange={(e) => setFormData({ ...formData, edit_reason: e.target.value })}
                            placeholder="Explain why you're editing this attendance record..."
                            rows={2}
                            required
                            className="border-orange-200 focus:border-orange-400"
                        />
                        <p className="text-xs text-muted-foreground">This will be logged for audit purposes</p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
