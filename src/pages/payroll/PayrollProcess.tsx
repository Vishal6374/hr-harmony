import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable, Column } from '@/components/ui/data-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService, payrollService } from '@/services/apiService';
import { toast } from 'sonner';
import { Calendar, Users, DollarSign, Play, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import Loader from '@/components/ui/Loader';

export default function PayrollProcess() {
    const queryClient = useQueryClient();
    const currentDate = new Date();

    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
    const [bonuses, setBonuses] = useState<Record<string, number>>({});
    const [deductions, setDeductions] = useState<Record<string, number>>({});
    const [showPreview, setShowPreview] = useState(false);

    // Fetch active employees
    const { data: employeesData, isLoading: loadingEmployees } = useQuery({
        queryKey: ['employees', 'active'],
        queryFn: async () => {
            const { data } = await employeeService.getAll({ status: 'active' });
            return data.employees || [];
        },
    });

    const employees = employeesData || [];

    // Preview mutation
    const previewMutation = useMutation({
        mutationFn: (data: { month: number; year: number; employee_ids: string[] }) =>
            payrollService.preview(data),
        onSuccess: () => {
            setShowPreview(true);
            toast.success('Preview generated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to generate preview');
        },
    });

    // Process mutation
    const processMutation = useMutation({
        mutationFn: (data: any) => payrollService.process(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payroll-batches'] });
            toast.success('Payroll processed successfully!');
            // Reset form
            setSelectedEmployees(new Set());
            setBonuses({});
            setDeductions({});
            setShowPreview(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to process payroll');
        },
    });

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedEmployees(new Set(employees.map((e: any) => e.id)));
        } else {
            setSelectedEmployees(new Set());
        }
    };

    const handleSelectEmployee = (employeeId: string, checked: boolean) => {
        const newSelected = new Set(selectedEmployees);
        if (checked) {
            newSelected.add(employeeId);
        } else {
            newSelected.delete(employeeId);
        }
        setSelectedEmployees(newSelected);
    };

    const handleBonusChange = (employeeId: string, value: string) => {
        const amount = parseFloat(value) || 0;
        setBonuses({ ...bonuses, [employeeId]: amount });
    };

    const handleDeductionChange = (employeeId: string, value: string) => {
        const amount = parseFloat(value) || 0;
        setDeductions({ ...deductions, [employeeId]: amount });
    };

    const handlePreview = () => {
        if (selectedEmployees.size === 0) {
            toast.error('Please select at least one employee');
            return;
        }

        previewMutation.mutate({
            month: selectedMonth,
            year: selectedYear,
            employee_ids: Array.from(selectedEmployees),
        });
    };

    const handleProcess = () => {
        if (selectedEmployees.size === 0) {
            toast.error('Please select at least one employee');
            return;
        }

        processMutation.mutate({
            month: selectedMonth,
            year: selectedYear,
            employee_ids: Array.from(selectedEmployees),
            bonuses,
            deductions,
        });
    };

    const previewData = previewMutation.data?.data || [];

    const columns: Column<any>[] = [
        {
            key: 'select',
            header: 'Select All',
            cell: (emp) => (
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={selectedEmployees.has(emp.id)}
                        onCheckedChange={(checked) => handleSelectEmployee(emp.id, checked as boolean)}
                    />
                </div>
            ),
            className: 'w-[100px]',
        },
        {
            key: 'employee',
            header: 'Employee',
            cell: (emp) => (
                <div>
                    <p className="font-medium">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.employee_id}</p>
                </div>
            ),
        },
        {
            key: 'department',
            header: 'Department',
            cell: (emp) => <span className="text-sm">{emp.department?.name || '-'}</span>,
        },
        {
            key: 'basic_salary',
            header: 'Basic Salary',
            cell: (emp) => <span className="font-semibold">₹{Number(emp.salary).toLocaleString('en-IN')}</span>,
        },
        {
            key: 'bonus',
            header: 'Bonus',
            cell: (emp) => (
                <Input
                    type="number"
                    placeholder="0"
                    value={bonuses[emp.id] || ''}
                    onChange={(e) => handleBonusChange(emp.id, e.target.value)}
                    className="w-24"
                    disabled={!selectedEmployees.has(emp.id)}
                />
            ),
        },
        {
            key: 'deductions',
            header: 'Other Deductions',
            cell: (emp) => (
                <Input
                    type="number"
                    placeholder="0"
                    value={deductions[emp.id] || ''}
                    onChange={(e) => handleDeductionChange(emp.id, e.target.value)}
                    className="w-24"
                    disabled={!selectedEmployees.has(emp.id)}
                />
            ),
        },
    ];

    const previewColumns: Column<any>[] = [
        {
            key: 'employee',
            header: 'Employee',
            cell: (item) => (
                <div>
                    <p className="font-medium">{item.employee_name}</p>
                    <p className="text-xs text-muted-foreground">{item.employee_code}</p>
                </div>
            ),
        },
        {
            key: 'attendance',
            header: 'Attendance',
            cell: (item) => (
                <div className="text-sm">
                    <p>Present: {item.present_days}/{item.total_days}</p>
                    <p className="text-destructive">Absent: {item.absent_days}</p>
                </div>
            ),
        },
        {
            key: 'basic',
            header: 'Basic',
            cell: (item) => <span>₹{Number(item.basic_salary).toLocaleString('en-IN')}</span>,
        },
        {
            key: 'bonus',
            header: 'Bonus',
            cell: (item) => <span className="text-success">+₹{Number(bonuses[item.employee_id] || 0).toLocaleString('en-IN')}</span>,
        },
        {
            key: 'lop',
            header: 'LOP',
            cell: (item) => <span className="text-destructive">-₹{Number(item.lop).toLocaleString('en-IN')}</span>,
        },
        {
            key: 'other_deductions',
            header: 'Deductions',
            cell: (item) => <span className="text-destructive">-₹{Number(deductions[item.employee_id] || 0).toLocaleString('en-IN')}</span>,
        },
        {
            key: 'net',
            header: 'Net Salary',
            cell: (item) => {
                const bonus = bonuses[item.employee_id] || 0;
                const deduction = deductions[item.employee_id] || 0;
                const net = item.net_salary + bonus - deduction;
                return <span className="font-bold text-lg">₹{Number(net).toLocaleString('en-IN')}</span>;
            },
        },
    ];

    return (

        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Process Payroll"
                description="Select month, employees, and process payroll"
            />

            {/* Month Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Select Month
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Month</Label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="w-full mt-1 p-2 border rounded-md"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                    <option key={month} value={month}>
                                        {format(new Date(2024, month - 1), 'MMMM')}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label>Year</Label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="w-full mt-1 p-2 border rounded-md"
                            >
                                {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        Selected: {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')}
                    </p>
                </CardContent>
            </Card>

            {/* Employee Selection */}
            {!showPreview && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Select Employees ({selectedEmployees.size} selected)
                            </CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectAll(selectedEmployees.size !== employees.length)}
                            >
                                {selectedEmployees.size === employees.length ? 'Deselect All' : 'Select All'}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loadingEmployees ? (
                            <div className="flex flex-col items-center justify-center py-8">
                                <Loader />
                                <p className="text-muted-foreground mt-2">Loading employees...</p>
                            </div>
                        ) : (
                            <DataTable
                                columns={columns}
                                data={employees}
                                keyExtractor={(emp) => emp.id}
                                emptyMessage="No active employees found"
                            />
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Preview */}
            {showPreview && previewData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Payroll Preview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={previewColumns}
                            data={previewData}
                            keyExtractor={(item) => item.employee_id}
                            emptyMessage="No preview data"
                        />
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold">Total Payroll Amount:</span>
                                <span className="text-2xl font-bold text-primary">
                                    ₹{previewData.reduce((sum: number, item: any) => {
                                        const bonus = bonuses[item.employee_id] || 0;
                                        const deduction = deductions[item.employee_id] || 0;
                                        return sum + (item.net_salary + bonus - deduction);
                                    }, 0).toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <div className="flex gap-4 justify-end">
                {showPreview ? (
                    <>
                        <Button variant="outline" onClick={() => setShowPreview(false)}>
                            Back to Edit
                        </Button>
                        <Button
                            onClick={handleProcess}
                            disabled={processMutation.isPending}
                            className="gap-2"
                        >
                            {processMutation.isPending ? (
                                <>
                                    <Loader size="small" variant="white" className="mr-2" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Process Payroll
                                </>
                            )}
                        </Button>
                    </>
                ) : (
                    <Button
                        onClick={handlePreview}
                        disabled={selectedEmployees.size === 0 || previewMutation.isPending}
                        className="gap-2"
                    >
                        {previewMutation.isPending ? (
                            <>
                                <Loader size="small" variant="white" className="mr-2" />
                                Generating Preview...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                Preview Payroll
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>

    );
}
