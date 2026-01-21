import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable, Column } from '@/components/ui/data-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService } from '@/services/apiService';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface SalaryStructure {
    id: string;
    name: string;
    description?: string;
    components: {
        basic: { percentage: number; formula?: string };
        hra: { percentage: number; formula?: string };
        da: { percentage: number; formula?: string };
        special_allowance?: { percentage: number; formula?: string };
    };
    deduction_rules: {
        pf: { percentage: number; max_limit?: number };
        esi: { percentage: number; salary_limit?: number };
        professional_tax: { amount: number };
    };
    is_active: boolean;
}

export default function SalaryStructureConfig() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingStructure, setEditingStructure] = useState<SalaryStructure | null>(null);
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        basic_percentage: 50,
        hra_percentage: 30,
        da_percentage: 20,
        special_allowance_percentage: 0,
        pf_percentage: 12,
        pf_max_limit: 15000,
        esi_percentage: 0.75,
        esi_salary_limit: 21000,
        professional_tax: 200,
    });

    const { data: structures = [], isLoading } = useQuery({
        queryKey: ['salary-structures'],
        queryFn: async () => {
            const { data } = await payrollService.getSalaryStructures();
            return data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => payrollService.createSalaryStructure(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
            toast.success('Salary structure created successfully');
            setIsDialogOpen(false);
            resetForm();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            payrollService.updateSalaryStructure(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
            toast.success('Salary structure updated successfully');
            setIsDialogOpen(false);
            resetForm();
        },
    });

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            basic_percentage: 50,
            hra_percentage: 30,
            da_percentage: 20,
            special_allowance_percentage: 0,
            pf_percentage: 12,
            pf_max_limit: 15000,
            esi_percentage: 0.75,
            esi_salary_limit: 21000,
            professional_tax: 200,
        });
        setEditingStructure(null);
    };

    const handleSubmit = () => {
        const payload = {
            name: formData.name,
            description: formData.description,
            components: {
                basic: { percentage: formData.basic_percentage },
                hra: { percentage: formData.hra_percentage },
                da: { percentage: formData.da_percentage },
                special_allowance: { percentage: formData.special_allowance_percentage },
            },
            deduction_rules: {
                pf: {
                    percentage: formData.pf_percentage,
                    max_limit: formData.pf_max_limit
                },
                esi: {
                    percentage: formData.esi_percentage,
                    salary_limit: formData.esi_salary_limit
                },
                professional_tax: { amount: formData.professional_tax },
            },
        };

        if (editingStructure) {
            updateMutation.mutate({ id: editingStructure.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleEdit = (structure: SalaryStructure) => {
        setEditingStructure(structure);
        setFormData({
            name: structure.name,
            description: structure.description || '',
            basic_percentage: structure.components.basic.percentage,
            hra_percentage: structure.components.hra.percentage,
            da_percentage: structure.components.da.percentage,
            special_allowance_percentage: structure.components.special_allowance?.percentage || 0,
            pf_percentage: structure.deduction_rules.pf.percentage,
            pf_max_limit: structure.deduction_rules.pf.max_limit || 15000,
            esi_percentage: structure.deduction_rules.esi.percentage,
            esi_salary_limit: structure.deduction_rules.esi.salary_limit || 21000,
            professional_tax: structure.deduction_rules.professional_tax.amount,
        });
        setIsDialogOpen(true);
    };

    const columns: Column<SalaryStructure>[] = [
        {
            key: 'name',
            header: 'Structure Name',
            cell: (structure) => <span className="font-medium">{structure.name}</span>
        },
        {
            key: 'description',
            header: 'Description',
            cell: (structure) => <span className="text-muted-foreground">{structure.description || 'N/A'}</span>
        },
        {
            key: 'components',
            header: 'Components',
            cell: (structure) => (
                <div className="text-sm">
                    <div>Basic: {structure.components.basic.percentage}%</div>
                    <div>HRA: {structure.components.hra.percentage}%</div>
                    <div>DA: {structure.components.da.percentage}%</div>
                </div>
            ),
        },
        {
            key: 'deductions',
            header: 'Deductions',
            cell: (structure) => (
                <div className="text-sm">
                    <div>PF: {structure.deduction_rules.pf.percentage}%</div>
                    <div>ESI: {structure.deduction_rules.esi.percentage}%</div>
                </div>
            ),
        },
        {
            key: 'is_active',
            header: 'Status',
            cell: (structure) => (
                <span className={`px-2 py-1 rounded-full text-xs ${structure.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {structure.is_active ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: '',
            cell: (structure) => (
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(structure)}>
                        <Edit className="w-4 h-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <PageHeader
                    title="Salary Structure Configuration"
                    description="Define salary components and deduction rules"
                >
                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Structure
                    </Button>
                </PageHeader>

                <Card>
                    <CardHeader>
                        <CardTitle>Salary Structures</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : (
                            <DataTable
                                columns={columns}
                                data={structures}
                                keyExtractor={(s) => s.id}
                                emptyMessage="No salary structures found"
                            />
                        )}
                    </CardContent>
                </Card>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingStructure ? 'Edit' : 'Create'} Salary Structure
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <div>
                                    <Label>Structure Name *</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Standard Full-Time"
                                    />
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <Input
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Optional description"
                                    />
                                </div>
                            </div>

                            {/* Salary Components */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Salary Components (% of CTC)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Basic Salary (%)</Label>
                                        <Input
                                            type="number"
                                            value={formData.basic_percentage}
                                            onChange={(e) => setFormData({ ...formData, basic_percentage: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <Label>HRA (%)</Label>
                                        <Input
                                            type="number"
                                            value={formData.hra_percentage}
                                            onChange={(e) => setFormData({ ...formData, hra_percentage: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <Label>DA (%)</Label>
                                        <Input
                                            type="number"
                                            value={formData.da_percentage}
                                            onChange={(e) => setFormData({ ...formData, da_percentage: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Special Allowance (%)</Label>
                                        <Input
                                            type="number"
                                            value={formData.special_allowance_percentage}
                                            onChange={(e) => setFormData({ ...formData, special_allowance_percentage: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Deduction Rules */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Deduction Rules</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>PF (%)</Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={formData.pf_percentage}
                                            onChange={(e) => setFormData({ ...formData, pf_percentage: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <Label>PF Max Limit (₹)</Label>
                                        <Input
                                            type="number"
                                            value={formData.pf_max_limit}
                                            onChange={(e) => setFormData({ ...formData, pf_max_limit: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <Label>ESI (%)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.esi_percentage}
                                            onChange={(e) => setFormData({ ...formData, esi_percentage: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <Label>ESI Salary Limit (₹)</Label>
                                        <Input
                                            type="number"
                                            value={formData.esi_salary_limit}
                                            onChange={(e) => setFormData({ ...formData, esi_salary_limit: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Professional Tax (₹)</Label>
                                        <Input
                                            type="number"
                                            value={formData.professional_tax}
                                            onChange={(e) => setFormData({ ...formData, professional_tax: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSubmit}>
                                    {editingStructure ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
}
