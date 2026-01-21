import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable, Column } from '@/components/ui/data-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, Upload, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function InvestmentDeclaration() {
    const { user, isHR } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [declarationType, setDeclarationType] = useState<'start_of_year' | 'end_of_year'>('start_of_year');
    const queryClient = useQueryClient();

    // Temporarily disabled - requires database tables
    const declarations = [];
    const isLoading = false;

    /*
    const { data: declarations = [], isLoading } = useQuery({
        queryKey: ['investment-declarations', user?.id],
        queryFn: async () => {
            const { data } = await payrollService.getInvestmentDeclarations({
                employee_id: user?.id,
            });
            return data;
        },
    });
    */

    const [formData, setFormData] = useState({
        financial_year: '2024-25',
        section_80c_amount: 0,
        section_80c_details: '',
        section_80d_amount: 0,
        section_80d_details: '',
        hra_amount: 0,
        hra_rent_paid: 0,
        hra_address: '',
        home_loan_amount: 0,
        home_loan_details: '',
        nps_amount: 0,
        nps_details: '',
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => payrollService.createInvestmentDeclaration(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['investment-declarations'] });
            toast.success('Declaration created successfully');
            setIsDialogOpen(false);
            resetForm();
        },
    });

    const submitMutation = useMutation({
        mutationFn: (id: string) => payrollService.submitInvestmentDeclaration(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['investment-declarations'] });
            toast.success('Declaration submitted for review');
        },
    });

    const resetForm = () => {
        setFormData({
            financial_year: '2024-25',
            section_80c_amount: 0,
            section_80c_details: '',
            section_80d_amount: 0,
            section_80d_details: '',
            hra_amount: 0,
            hra_rent_paid: 0,
            hra_address: '',
            home_loan_amount: 0,
            home_loan_details: '',
            nps_amount: 0,
            nps_details: '',
        });
    };

    const handleSubmit = () => {
        const payload = {
            financial_year: formData.financial_year,
            declaration_type: declarationType,
            investments: {
                section_80c: formData.section_80c_amount > 0 ? {
                    amount: formData.section_80c_amount,
                    details: formData.section_80c_details,
                } : undefined,
                section_80d: formData.section_80d_amount > 0 ? {
                    amount: formData.section_80d_amount,
                    details: formData.section_80d_details,
                } : undefined,
                hra: formData.hra_amount > 0 ? {
                    amount: formData.hra_amount,
                    rent_paid: formData.hra_rent_paid,
                    address: formData.hra_address,
                } : undefined,
                home_loan: formData.home_loan_amount > 0 ? {
                    amount: formData.home_loan_amount,
                    details: formData.home_loan_details,
                } : undefined,
                nps: formData.nps_amount > 0 ? {
                    amount: formData.nps_amount,
                    details: formData.nps_details,
                } : undefined,
            },
        };

        createMutation.mutate(payload);
    };

    const columns: Column<any>[] = [
        {
            key: 'financial_year',
            header: 'Financial Year',
            cell: (dec) => <span className="font-medium">{dec.financial_year}</span>,
        },
        {
            key: 'declaration_type',
            header: 'Type',
            cell: (dec) => (
                <span className="capitalize">
                    {dec.declaration_type.replace('_', ' ')}
                </span>
            ),
        },
        {
            key: 'investments',
            header: 'Total Declared',
            cell: (dec) => {
                const total = Object.values(dec.investments).reduce((sum: number, inv: any) =>
                    sum + (inv?.amount || 0), 0
                );
                return <span className="font-semibold">₹{total.toLocaleString()}</span>;
            },
        },
        {
            key: 'status',
            header: 'Status',
            cell: (dec) => {
                const statusConfig = {
                    draft: { icon: FileText, color: 'bg-gray-100 text-gray-700', label: 'Draft' },
                    submitted: { icon: Clock, color: 'bg-blue-100 text-blue-700', label: 'Submitted' },
                    approved: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Approved' },
                    rejected: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Rejected' },
                };
                const config = statusConfig[dec.status as keyof typeof statusConfig];
                const Icon = config.icon;
                return (
                    <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${config.color}`}>
                        <Icon className="w-3 h-3" />
                        {config.label}
                    </span>
                );
            },
        },
        {
            key: 'submitted_at',
            header: 'Submitted On',
            cell: (dec) => dec.submitted_at ? format(new Date(dec.submitted_at), 'dd MMM yyyy') : '-',
        },
        {
            key: 'actions',
            header: '',
            cell: (dec) => (
                <div className="flex items-center gap-2">
                    {dec.status === 'draft' && (
                        <Button
                            size="sm"
                            onClick={() => submitMutation.mutate(dec.id)}
                        >
                            Submit
                        </Button>
                    )}
                    {dec.status === 'rejected' && dec.remarks && (
                        <span className="text-xs text-red-600">{dec.remarks}</span>
                    )}
                </div>
            ),
        },
    ];

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <PageHeader
                    title="Investment Declaration"
                    description="Declare your tax-saving investments"
                >
                    <Button onClick={() => setIsDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Declaration
                    </Button>
                </PageHeader>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-6">
                            <h3 className="font-semibold mb-2">Start of Year Declaration</h3>
                            <p className="text-sm text-muted-foreground">
                                Declare your planned investments at the beginning of the financial year to reduce monthly TDS.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="pt-6">
                            <h3 className="font-semibold mb-2">End of Year Proof</h3>
                            <p className="text-sm text-muted-foreground">
                                Submit actual investment proofs before year-end to avoid excess TDS recovery.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500">
                        <CardContent className="pt-6">
                            <h3 className="font-semibold mb-2">Section 80C Limit</h3>
                            <p className="text-sm text-muted-foreground">
                                Maximum deduction of ₹1,50,000 under Section 80C for investments like PPF, ELSS, LIC, etc.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>My Declarations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : (
                            <DataTable
                                columns={columns}
                                data={declarations}
                                keyExtractor={(d) => d.id}
                                emptyMessage="No declarations found. Create your first declaration!"
                            />
                        )}
                    </CardContent>
                </Card>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>New Investment Declaration</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Financial Year *</Label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg"
                                        value={formData.financial_year}
                                        onChange={(e) => setFormData({ ...formData, financial_year: e.target.value })}
                                    >
                                        <option value="2024-25">2024-25</option>
                                        <option value="2023-24">2023-24</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>Declaration Type *</Label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg"
                                        value={declarationType}
                                        onChange={(e) => setDeclarationType(e.target.value as any)}
                                    >
                                        <option value="start_of_year">Start of Year</option>
                                        <option value="end_of_year">End of Year (with Proof)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Section 80C */}
                            <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                                <h3 className="font-semibold text-blue-900">Section 80C (Max: ₹1,50,000)</h3>
                                <p className="text-xs text-blue-700">PPF, ELSS, LIC, NSC, Tax Saver FD, Home Loan Principal, etc.</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Amount (₹)</Label>
                                        <Input
                                            type="number"
                                            value={formData.section_80c_amount}
                                            onChange={(e) => setFormData({ ...formData, section_80c_amount: Number(e.target.value) })}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <Label>Details</Label>
                                        <Input
                                            value={formData.section_80c_details}
                                            onChange={(e) => setFormData({ ...formData, section_80c_details: e.target.value })}
                                            placeholder="e.g., PPF, ELSS"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 80D */}
                            <div className="space-y-3 p-4 bg-green-50 rounded-lg">
                                <h3 className="font-semibold text-green-900">Section 80D (Health Insurance)</h3>
                                <p className="text-xs text-green-700">Max: ₹25,000 (self) + ₹25,000 (parents)</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Amount (₹)</Label>
                                        <Input
                                            type="number"
                                            value={formData.section_80d_amount}
                                            onChange={(e) => setFormData({ ...formData, section_80d_amount: Number(e.target.value) })}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <Label>Details</Label>
                                        <Input
                                            value={formData.section_80d_details}
                                            onChange={(e) => setFormData({ ...formData, section_80d_details: e.target.value })}
                                            placeholder="Policy details"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* HRA */}
                            <div className="space-y-3 p-4 bg-purple-50 rounded-lg">
                                <h3 className="font-semibold text-purple-900">HRA (House Rent Allowance)</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Label>HRA Received (₹)</Label>
                                        <Input
                                            type="number"
                                            value={formData.hra_amount}
                                            onChange={(e) => setFormData({ ...formData, hra_amount: Number(e.target.value) })}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <Label>Rent Paid (₹)</Label>
                                        <Input
                                            type="number"
                                            value={formData.hra_rent_paid}
                                            onChange={(e) => setFormData({ ...formData, hra_rent_paid: Number(e.target.value) })}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <Label>Landlord Address</Label>
                                        <Input
                                            value={formData.hra_address}
                                            onChange={(e) => setFormData({ ...formData, hra_address: e.target.value })}
                                            placeholder="Address"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Home Loan */}
                            <div className="space-y-3 p-4 bg-orange-50 rounded-lg">
                                <h3 className="font-semibold text-orange-900">Home Loan Interest (Section 24)</h3>
                                <p className="text-xs text-orange-700">Max: ₹2,00,000 for self-occupied property</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Interest Amount (₹)</Label>
                                        <Input
                                            type="number"
                                            value={formData.home_loan_amount}
                                            onChange={(e) => setFormData({ ...formData, home_loan_amount: Number(e.target.value) })}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <Label>Loan Details</Label>
                                        <Input
                                            value={formData.home_loan_details}
                                            onChange={(e) => setFormData({ ...formData, home_loan_details: e.target.value })}
                                            placeholder="Bank name, loan account"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* NPS */}
                            <div className="space-y-3 p-4 bg-teal-50 rounded-lg">
                                <h3 className="font-semibold text-teal-900">NPS (Section 80CCD(1B))</h3>
                                <p className="text-xs text-teal-700">Additional ₹50,000 deduction over 80C</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Amount (₹)</Label>
                                        <Input
                                            type="number"
                                            value={formData.nps_amount}
                                            onChange={(e) => setFormData({ ...formData, nps_amount: Number(e.target.value) })}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <Label>PRAN Number</Label>
                                        <Input
                                            value={formData.nps_details}
                                            onChange={(e) => setFormData({ ...formData, nps_details: e.target.value })}
                                            placeholder="NPS PRAN"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSubmit}>
                                    Create Declaration
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
}
