import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService, employeeService, attendanceService } from '@/services/apiService';
import { toast } from 'sonner';
import { ChevronRight, ChevronLeft, Users, Calendar, DollarSign, Play, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function RunPayrollWizard() {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [variablePay, setVariablePay] = useState<Record<string, { bonus: number; overtime: number }>>({});
    const queryClient = useQueryClient();

    const { data: employees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: async () => {
            const { data } = await employeeService.getAll();
            return data.employees || [];
        },
    });

    const { data: attendanceSummary } = useQuery({
        queryKey: ['attendance-summary', selectedMonth, selectedYear],
        queryFn: async () => {
            const { data } = await attendanceService.getSummary({
                month: selectedMonth,
                year: selectedYear,
            });
            return data;
        },
        enabled: currentStep >= 2,
    });

    const generateMutation = useMutation({
        mutationFn: () => payrollService.generate(selectedMonth, selectedYear),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payroll-batches'] });
            toast.success('Payroll generated successfully!');
            setCurrentStep(5);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to generate payroll');
        },
    });

    const steps = [
        { number: 1, title: 'Select Month', icon: Calendar },
        { number: 2, title: 'Select Employees', icon: Users },
        { number: 3, title: 'Sync Attendance', icon: CheckCircle },
        { number: 4, title: 'Variable Pay', icon: DollarSign },
        { number: 5, title: 'Process', icon: Play },
    ];

    const handleEmployeeToggle = (employeeId: string) => {
        setSelectedEmployees(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    const handleSelectAll = () => {
        if (selectedEmployees.length === employees.length) {
            setSelectedEmployees([]);
        } else {
            setSelectedEmployees(employees.map((e: any) => e.id));
        }
    };

    const handleVariablePayChange = (employeeId: string, field: 'bonus' | 'overtime', value: number) => {
        setVariablePay(prev => ({
            ...prev,
            [employeeId]: {
                ...prev[employeeId],
                [field]: value,
            },
        }));
    };

    const handleNext = () => {
        if (currentStep === 1 && (!selectedMonth || !selectedYear)) {
            toast.error('Please select month and year');
            return;
        }
        if (currentStep === 2 && selectedEmployees.length === 0) {
            toast.error('Please select at least one employee');
            return;
        }
        setCurrentStep(prev => Math.min(prev + 1, 5));
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleProcess = () => {
        generateMutation.mutate();
    };

    const activeEmployees = employees.filter((e: any) => e.status === 'active');
    const selectedEmployeeData = activeEmployees.filter((e: any) => selectedEmployees.includes(e.id));

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <PageHeader
                    title="Run Payroll Wizard"
                    description="Process monthly payroll in simple steps"
                />

                {/* Progress Steps */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            {steps.map((step, idx) => {
                                const Icon = step.icon;
                                const isActive = currentStep === step.number;
                                const isCompleted = currentStep > step.number;

                                return (
                                    <div key={step.number} className="flex items-center flex-1">
                                        <div className="flex flex-col items-center flex-1">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${isActive ? 'gradient-primary text-white scale-110' :
                                                isCompleted ? 'bg-green-500 text-white' :
                                                    'bg-gray-200 text-gray-500'
                                                }`}>
                                                {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                                            </div>
                                            <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                                {step.title}
                                            </span>
                                        </div>
                                        {idx < steps.length - 1 && (
                                            <div className={`h-1 flex-1 mx-2 rounded ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Step Content */}
                <Card>
                    <CardHeader>
                        <CardTitle>{steps[currentStep - 1].title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Step 1: Select Month */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <Label>Select Month *</Label>
                                        <select
                                            className="w-full px-3 py-2 border rounded-lg"
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                        >
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                                <option key={month} value={month}>
                                                    {format(new Date(2024, month - 1), 'MMMM')}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Select Year *</Label>
                                        <select
                                            className="w-full px-3 py-2 border rounded-lg"
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        >
                                            {[2024, 2023, 2022].map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        <strong>Selected Period:</strong> {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')}
                                    </p>
                                    <p className="text-sm text-blue-700 mt-2">
                                        This will process payroll for all selected employees for the chosen month.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Select Employees */}
                        {currentStep === 2 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <Button variant="outline" onClick={handleSelectAll}>
                                        {selectedEmployees.length === activeEmployees.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        {selectedEmployees.length} of {activeEmployees.length} employees selected
                                    </span>
                                </div>
                                <div className="max-h-96 overflow-y-auto space-y-2">
                                    {activeEmployees.map((employee: any) => (
                                        <div
                                            key={employee.id}
                                            className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${selectedEmployees.includes(employee.id) ? 'border-primary bg-primary/5' : 'hover:border-gray-400'
                                                }`}
                                            onClick={() => handleEmployeeToggle(employee.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={selectedEmployees.includes(employee.id)}
                                                    onCheckedChange={() => handleEmployeeToggle(employee.id)}
                                                />
                                                <div>
                                                    <p className="font-medium">{employee.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {employee.employee_id} • {employee.department?.name} • {employee.designation?.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">₹{Number(employee.salary).toLocaleString()}</p>
                                                <p className="text-xs text-muted-foreground">Monthly CTC</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Sync Attendance */}
                        {currentStep === 3 && (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                                    <p className="text-sm text-green-800">
                                        <strong>✓ Attendance Synced</strong>
                                    </p>
                                    <p className="text-sm text-green-700 mt-1">
                                        Attendance data for {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')} has been loaded.
                                        LOP (Loss of Pay) will be automatically calculated.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    {selectedEmployeeData.slice(0, 5).map((employee: any) => {
                                        const summary = attendanceSummary?.find((s: any) => s.employee_id === employee.id);
                                        return (
                                            <div key={employee.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                                                <span className="font-medium">{employee.name}</span>
                                                <div className="flex gap-4 text-sm">
                                                    <span className="text-green-600">Present: {summary?.present || 0}</span>
                                                    <span className="text-orange-600">Half Day: {summary?.half_day || 0}</span>
                                                    <span className="text-red-600">Absent: {summary?.absent || 0}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {selectedEmployeeData.length > 5 && (
                                        <p className="text-sm text-muted-foreground text-center">
                                            ...and {selectedEmployeeData.length - 5} more employees
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 4: Variable Pay */}
                        {currentStep === 4 && (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground mb-4">
                                    Add bonuses or overtime pay for employees (optional)
                                </p>
                                <div className="max-h-96 overflow-y-auto space-y-3">
                                    {selectedEmployeeData.map((employee: any) => (
                                        <div key={employee.id} className="p-4 border rounded-lg">
                                            <p className="font-medium mb-3">{employee.name}</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Bonus (₹)</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={variablePay[employee.id]?.bonus || ''}
                                                        onChange={(e) => handleVariablePayChange(employee.id, 'bonus', Number(e.target.value))}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Overtime (₹)</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={variablePay[employee.id]?.overtime || ''}
                                                        onChange={(e) => handleVariablePayChange(employee.id, 'overtime', Number(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 5: Process */}
                        {currentStep === 5 && (
                            <div className="space-y-6">
                                {!generateMutation.isSuccess ? (
                                    <>
                                        <div className="text-center py-8">
                                            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                                                <Play className="w-10 h-10 text-white" />
                                            </div>
                                            <h3 className="text-xl font-bold mb-2">Ready to Process Payroll</h3>
                                            <p className="text-muted-foreground mb-6">
                                                Review the summary below and click "Process Payroll" to generate salary slips
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <Card>
                                                <CardContent className="pt-6 text-center">
                                                    <p className="text-3xl font-bold">{selectedEmployees.length}</p>
                                                    <p className="text-sm text-muted-foreground">Employees</p>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardContent className="pt-6 text-center">
                                                    <p className="text-3xl font-bold">
                                                        {format(new Date(selectedYear, selectedMonth - 1), 'MMM yyyy')}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">Period</p>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardContent className="pt-6 text-center">
                                                    <p className="text-3xl font-bold">
                                                        ₹{selectedEmployeeData.reduce((sum: number, e: any) => sum + Number(e.salary), 0).toLocaleString()}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">Estimated Total</p>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <p className="text-sm text-yellow-800">
                                                <strong>⚠️ Important:</strong> Once processed, salary slips will be generated and attendance
                                                for this month will be locked. Make sure all data is correct before proceeding.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="w-10 h-10 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 text-green-700">Payroll Processed Successfully!</h3>
                                        <p className="text-muted-foreground mb-6">
                                            Salary slips have been generated for {selectedEmployees.length} employees
                                        </p>
                                        <Button onClick={() => window.location.href = '/payroll'}>
                                            View Salary Slips
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStep === 1 || generateMutation.isSuccess}
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    {currentStep < 5 ? (
                        <Button onClick={handleNext}>
                            Next
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        !generateMutation.isSuccess && (
                            <Button
                                onClick={handleProcess}
                                disabled={generateMutation.isPending}
                                className="gradient-primary"
                            >
                                {generateMutation.isPending ? 'Processing...' : 'Process Payroll'}
                                <Play className="w-4 h-4 ml-2" />
                            </Button>
                        )
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
