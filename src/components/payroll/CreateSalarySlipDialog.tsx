import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { payrollService } from "@/services/apiService";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";

interface CreateSalarySlipDialogProps {
    isOpen: boolean;
    onClose: () => void;
    employees: any[];
}

export function CreateSalarySlipDialog({ isOpen, onClose, employees }: CreateSalarySlipDialogProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        employeeId: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        basicSalary: 0,
        hra: 0,
        da: 0,
        reimbursements: 0,
        deductions: {
            pf: 0,
            tax: 0,
            loss_of_pay: 0,
            other: 0
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            await payrollService.createSlip(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['salary-slips'] });
            queryClient.invalidateQueries({ queryKey: ['payroll-batches'] });
            toast.success('Salary slip created successfully');
            onClose();
            // Reset form (optional)
            setFormData({
                employeeId: "",
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                basicSalary: 0,
                hra: 0,
                da: 0,
                reimbursements: 0,
                deductions: { pf: 0, tax: 0, loss_of_pay: 0, other: 0 }
            });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create salary slip');
        }
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleDeductionChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            deductions: { ...prev.deductions, [field]: Number(value) }
        }));
    };

    const handleSubmit = () => {
        if (!formData.employeeId) {
            toast.error("Please select an employee");
            return;
        }
        createMutation.mutate(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Manual Salary Slip</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Employee</Label>
                            <Select onValueChange={(v) => handleChange('employeeId', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.isArray(employees) && employees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>
                                            {emp.name} ({emp.employee_id})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <Label>Month</Label>
                                <Select
                                    value={formData.month.toString()}
                                    onValueChange={(v) => handleChange('month', Number(v))}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                            <SelectItem key={m} value={m.toString()}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Year</Label>
                                <Input
                                    type="number"
                                    value={formData.year}
                                    onChange={(e) => handleChange('year', Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="font-semibold mb-3">Earnings</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Basic Salary</Label>
                                <Input type="number" value={formData.basicSalary} onChange={(e) => handleChange('basicSalary', Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>HRA</Label>
                                <Input type="number" value={formData.hra} onChange={(e) => handleChange('hra', Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>DA (Special)</Label>
                                <Input type="number" value={formData.da} onChange={(e) => handleChange('da', Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Reimbursements</Label>
                                <Input type="number" value={formData.reimbursements} onChange={(e) => handleChange('reimbursements', Number(e.target.value))} />
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="font-semibold mb-3">Deductions</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Provident Fund</Label>
                                <Input type="number" value={formData.deductions.pf} onChange={(e) => handleDeductionChange('pf', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Professional Tax</Label>
                                <Input type="number" value={formData.deductions.tax} onChange={(e) => handleDeductionChange('tax', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Loss of Pay</Label>
                                <Input type="number" value={formData.deductions.loss_of_pay} onChange={(e) => handleDeductionChange('loss_of_pay', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Other</Label>
                                <Input type="number" value={formData.deductions.other} onChange={(e) => handleDeductionChange('other', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                        {createMutation.isPending && <Loader size="small" variant="white" className="mr-2" />}
                        Create Slip
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
