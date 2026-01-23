import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, Column } from '@/components/ui/data-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '@/services/apiService';
import { toast } from 'sonner';
import { DollarSign, Save, Loader2 } from 'lucide-react';

export default function BasicPayManager() {
    const queryClient = useQueryClient();
    const [salaries, setSalaries] = useState<Record<string, number>>({});

    // Fetch active employees
    const { data: employeesData, isLoading } = useQuery({
        queryKey: ['employees', 'active'],
        queryFn: async () => {
            const { data } = await employeeService.getAll({ status: 'active' });
            const employees = data.employees || [];

            // Initialize salaries from existing data
            const initialSalaries: Record<string, number> = {};
            employees.forEach((emp: any) => {
                initialSalaries[emp.id] = emp.salary || 0;
            });
            setSalaries(initialSalaries);

            return employees;
        },
    });

    const employees = employeesData || [];

    // Update salary mutation
    const updateSalaryMutation = useMutation({
        mutationFn: async ({ employeeId, salary }: { employeeId: string; salary: number }) => {
            return employeeService.update(employeeId, { salary });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            toast.success('Salary updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update salary');
        },
    });

    const handleSalaryChange = (employeeId: string, value: string) => {
        const amount = parseFloat(value) || 0;
        setSalaries({ ...salaries, [employeeId]: amount });
    };

    const handleSave = (employeeId: string) => {
        const salary = salaries[employeeId];
        if (salary < 0) {
            toast.error('Salary cannot be negative');
            return;
        }
        updateSalaryMutation.mutate({ employeeId, salary });
    };

    const handleSaveAll = () => {
        const updates = Object.entries(salaries).map(([employeeId, salary]) => ({
            employeeId,
            salary,
        }));

        Promise.all(
            updates.map(({ employeeId, salary }) =>
                employeeService.update(employeeId, { salary })
            )
        )
            .then(() => {
                queryClient.invalidateQueries({ queryKey: ['employees'] });
                toast.success('All salaries updated successfully');
            })
            .catch((error) => {
                toast.error('Failed to update some salaries');
                console.error(error);
            });
    };

    const columns: Column<any>[] = [
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
            key: 'designation',
            header: 'Designation',
            cell: (emp) => <span className="text-sm">{emp.designation?.name || '-'}</span>,
        },
        {
            key: 'current_salary',
            header: 'Current Salary',
            cell: (emp) => (
                <span className="font-semibold">
                    ₹{Number(emp.salary || 0).toLocaleString('en-IN')}
                </span>
            ),
        },
        {
            key: 'new_salary',
            header: 'Basic Pay',
            cell: (emp) => (
                <Input
                    type="number"
                    placeholder="Enter salary"
                    value={salaries[emp.id] || ''}
                    onChange={(e) => handleSalaryChange(emp.id, e.target.value)}
                    className="w-32"
                />
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            cell: (emp) => (
                <Button
                    size="sm"
                    onClick={() => handleSave(emp.id)}
                    disabled={updateSalaryMutation.isPending}
                >
                    <Save className="w-3 h-3 mr-1" />
                    Save
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Basic Pay Management
                        </CardTitle>
                        <Button onClick={handleSaveAll} disabled={updateSalaryMutation.isPending}>
                            {updateSalaryMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save All
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
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
        </div>
    );
}
