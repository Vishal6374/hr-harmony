import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '@/services/apiService';
import { toast } from 'sonner';
import { Clock, Save, Info } from 'lucide-react';

export function AttendanceSettings() {
    const queryClient = useQueryClient();

    const { data: settings, isLoading } = useQuery({
        queryKey: ['attendance-settings'],
        queryFn: async () => {
            const { data } = await attendanceService.getSettings();
            return data;
        },
    });

    const [formData, setFormData] = useState({
        standard_work_hours: settings?.standard_work_hours || 8,
        half_day_threshold: settings?.half_day_threshold || 4,
        allow_self_clock_in: settings?.allow_self_clock_in ?? true,
    });

    // Update form when settings load
    useEffect(() => {
        if (settings) {
            setFormData({
                standard_work_hours: settings.standard_work_hours,
                half_day_threshold: settings.half_day_threshold,
                allow_self_clock_in: settings.allow_self_clock_in ?? true,
            });
        }
    }, [settings]);

    const updateMutation = useMutation({
        mutationFn: (data: any) => attendanceService.updateSettings(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance-settings'] });
            toast.success('Attendance settings updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update settings');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (formData.standard_work_hours <= 0 || formData.standard_work_hours > 24) {
            toast.error('Standard work hours must be between 0 and 24');
            return;
        }

        if (formData.half_day_threshold <= 0 || formData.half_day_threshold > 24) {
            toast.error('Half day threshold must be between 0 and 24');
            return;
        }

        if (formData.half_day_threshold > formData.standard_work_hours) {
            toast.error('Half day threshold cannot be greater than standard work hours');
            return;
        }

        updateMutation.mutate(formData);
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">Loading settings...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Attendance Settings
                </CardTitle>
                <CardDescription>
                    Configure work hours and attendance calculation rules
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Work Hours Settings in one row */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Standard Work Hours */}
                        <div className="space-y-2">
                            <Label htmlFor="standard_work_hours">
                                Standard Work Hours (per day)
                            </Label>
                            <Input
                                id="standard_work_hours"
                                type="number"
                                step="0.5"
                                min="0"
                                max="24"
                                value={formData.standard_work_hours}
                                onChange={(e) => setFormData({ ...formData, standard_work_hours: parseFloat(e.target.value) })}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Hours for "Present" status
                            </p>
                        </div>

                        {/* Half Day Threshold */}
                        <div className="space-y-2">
                            <Label htmlFor="half_day_threshold">
                                Half Day Threshold (hours)
                            </Label>
                            <Input
                                id="half_day_threshold"
                                type="number"
                                step="0.5"
                                min="0"
                                max="24"
                                value={formData.half_day_threshold}
                                onChange={(e) => setFormData({ ...formData, half_day_threshold: parseFloat(e.target.value) })}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Minimum for "Half Day" status
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50/50">
                        <div className="space-y-0.5">
                            <Label className="text-base">Allow Self Clock-In</Label>
                            <p className="text-xs text-muted-foreground">
                                Enable employees to clock in/out themselves. If disabled, only HR can mark attendance.
                            </p>
                        </div>
                        <Switch
                            checked={formData.allow_self_clock_in}
                            onCheckedChange={(checked) => setFormData({ ...formData, allow_self_clock_in: checked })}
                        />
                    </div>

                    {/* Info Box */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex gap-2">
                            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-900">
                                <p className="font-medium mb-2">Attendance Calculation Rules:</p>
                                <ul className="space-y-1 text-xs">
                                    <li>• <strong>Absent:</strong> Work hours &lt; {formData.half_day_threshold} hours</li>
                                    <li>• <strong>Half Day:</strong> Work hours ≥ {formData.half_day_threshold} hours and &lt; {formData.standard_work_hours} hours</li>
                                    <li>• <strong>Present:</strong> Work hours ≥ {formData.standard_work_hours} hours</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button type="submit" disabled={updateMutation.isPending} className="w-full">
                        <Save className="w-4 h-4 mr-2" />
                        {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
