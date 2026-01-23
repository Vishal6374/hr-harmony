import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DataTable, Column } from '@/components/ui/data-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '@/services/apiService';
import { toast } from 'sonner';
import { Edit, Search, IndianRupee } from 'lucide-react';

export default function EmployeeSalaryManager() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [salaryInput, setSalaryInput] = useState('');

    const queryClient = useQueryClient();

    // Fetch Employees (only active)
    const { data: employees = [], isLoading } = useQuery({
        queryKey: ['employees'],
        queryFn: async () => {
            const { data } = await employeeService.getAll({ status: 'active' });
            return data.employees || [];
        },
    });

    // Update Salary Mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, salary }: { id: string; salary: number }) =>
            employeeService.update(id, { salary }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            toast.success('Employee salary updated successfully');
            setIsDialogOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update salary');
        }
    });

    const handleEditClick = (employee: any) => {
        setSelectedEmployee(employee);
        setSalaryInput(employee.salary || '0');
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        if (!selectedEmployee) return;
        updateMutation.mutate({
            id: selectedEmployee.id,
            salary: Number(salaryInput)
        });
    };

    const filteredEmployees = employees.filter((emp: any) =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const columns: Column<any>[] = [
        {
            key: 'name',
            header: 'Employee',
            cell: (emp) => (
                <div>
                    <p className="font-medium">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.employee_id}</p>
                </div>
            )
        },
        {
            key: 'department',
            header: 'Department',
            cell: (emp) => <span className="text-sm">{emp.department?.name || '-'}</span>
        },
        {
            key: 'designation',
            header: 'Designation',
            cell: (emp) => <span className="text-sm">{emp.designation?.name || '-'}</span>
        },
        {
            key: 'salary',
            header: 'Fixed Monthly Salary',
            cell: (emp) => (
                <div className="flex items-center gap-1 font-semibold text-primary">
                    <IndianRupee className="w-3 h-3" />
                    {Number(emp.salary).toLocaleString('en-IN')}
                </div>
            )
        },
        {
            key: 'actions',
            header: 'Action',
            cell: (emp) => (
                <Button variant="outline" size="sm" onClick={() => handleEditClick(emp)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Salary
                </Button>
            ),
            className: "w-[150px]"
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Employee Fixed Salary"
                description="Manage fixed monthly salary for each employee. This value is used for payroll calculations."
            />

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Employee List</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search employees..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">Loading employees...</div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredEmployees}
                            keyExtractor={(emp) => emp.id}
                            emptyMessage="No employees found"
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Salary</DialogTitle>
                    </DialogHeader>

                    {selectedEmployee && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Employee:</span>
                                    <p className="font-medium">{selectedEmployee.name}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">ID:</span>
                                    <p className="font-medium">{selectedEmployee.employee_id}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="salary">Fixed Monthly Salary (₹)</Label>
                                <Input
                                    id="salary"
                                    type="number"
                                    value={salaryInput}
                                    onChange={(e) => setSalaryInput(e.target.value)}
                                    placeholder="Enter monthly salary"
                                />
                                <p className="text-xs text-muted-foreground">
                                    This amount will be used as the base for all payroll calculations.
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
