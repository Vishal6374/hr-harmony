import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Clock, Calendar, AlertCircle } from 'lucide-react';

interface RegularizationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: any) => void;
    isSaving: boolean;
}

export function RegularizationModal({
    open,
    onOpenChange,
    onSave,
    isSaving,
}: RegularizationModalProps) {
    const [formData, setFormData] = useState({
        attendance_date: format(new Date(), 'yyyy-MM-dd'),
        type: 'both',
        new_check_in: '',
        new_check_out: '',
        new_status: 'present',
        reason: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const data: any = {
            attendance_date: formData.attendance_date,
            type: formData.type,
            reason: formData.reason,
        };

        if (formData.type === 'check_in' || formData.type === 'both') {
            data.new_check_in = `${formData.attendance_date}T${formData.new_check_in || '09:00'}:00`;
        }
        if (formData.type === 'check_out' || formData.type === 'both') {
            data.new_check_out = `${formData.attendance_date}T${formData.new_check_out || '18:00'}:00`;
        }
        if (formData.type === 'status_change') {
            data.new_status = formData.new_status;
        }

        onSave(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-primary" />
                        Attendance Regularization
                    </DialogTitle>
                    <DialogDescription>
                        Request correction for a missing or incorrect attendance entry.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Attendance Date*</Label>
                        <Input
                            type="date"
                            value={formData.attendance_date}
                            onChange={(e) => setFormData({ ...formData, attendance_date: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Correction Type*</Label>
                        <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val as any })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="both">Check-in & Check-out</SelectItem>
                                <SelectItem value="check_in">Check-in Only</SelectItem>
                                <SelectItem value="check_out">Check-out Only</SelectItem>
                                <SelectItem value="status_change">Status Change</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {(formData.type === 'check_in' || formData.type === 'both') && (
                        <div className="space-y-2">
                            <Label>New Check-in Time</Label>
                            <Input
                                type="time"
                                value={formData.new_check_in}
                                onChange={(e) => setFormData({ ...formData, new_check_in: e.target.value })}
                            />
                        </div>
                    )}

                    {(formData.type === 'check_out' || formData.type === 'both') && (
                        <div className="space-y-2">
                            <Label>New Check-out Time</Label>
                            <Input
                                type="time"
                                value={formData.new_check_out}
                                onChange={(e) => setFormData({ ...formData, new_check_out: e.target.value })}
                            />
                        </div>
                    )}

                    {formData.type === 'status_change' && (
                        <div className="space-y-2">
                            <Label>New Status</Label>
                            <Select value={formData.new_status} onValueChange={(val) => setFormData({ ...formData, new_status: val as any })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="present">Present</SelectItem>
                                    <SelectItem value="half_day">Half Day</SelectItem>
                                    <SelectItem value="absent">Absent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Reason for Regularization*</Label>
                        <Textarea
                            placeholder="e.g. Forgot to clock in, System issue, On duty, etc."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSaving || !formData.reason}>
                            {isSaving ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
