import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { payrollService } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { Calculator, TrendingDown, TrendingUp, FileText, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Loader from '@/components/ui/Loader';

export default function TaxWorksheet() {
    const { user } = useAuth();
    const [selectedYear, setSelectedYear] = useState('2024-25');

    // Temporarily disabled - requires database tables
    const taxCalculation = null;
    const declarations = [];
    const isLoading = false; // Mock isLoading since the query is commented out

    /*
    const { data: taxCalculation, isLoading } = useQuery({
        queryKey: ['tax-calculation', user?.id, selectedYear],
        queryFn: async () => {
            const { data } = await payrollService.calculateTax({
                employee_id: user?.id,
                financial_year: selectedYear
            });
            return data;
        },
    });

    const { data: declarations = [] } = useQuery({
        queryKey: ['investment-declarations', user?.id, selectedYear],
        queryFn: async () => {
            const { data } = await payrollService.getInvestmentDeclarations({
                employee_id: user?.id,
                financial_year: selectedYear,
            });
            return data;
        },
    });
    */

    const financialYears = ['2024-25', '2023-24', '2022-23'];

    const taxBreakdown = taxCalculation ? [
        { label: 'Total Income', amount: taxCalculation.total_income, type: 'income' },
        { label: 'Standard Deduction', amount: -taxCalculation.standard_deduction, type: 'deduction' },
        { label: 'Investment Deductions (80C, 80D, etc.)', amount: -taxCalculation.total_deductions, type: 'deduction' },
        { label: 'Taxable Income', amount: taxCalculation.taxable_income, type: 'taxable', highlight: true },
        { label: 'Calculated Tax', amount: taxCalculation.calculated_tax, type: 'tax', highlight: true },
    ] : [];

    return (

        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Tax Worksheet"
                description="View your tax calculation breakdown"
            >
                <div className="flex gap-2">
                    <select
                        className="px-4 py-2 border rounded-lg"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        {financialYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                    </Button>
                </div>
            </PageHeader>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader />
                    <p className="mt-4 text-muted-foreground">Calculating taxes...</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Income</p>
                                        <p className="text-2xl font-bold">₹{taxCalculation?.total_income.toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                                        <TrendingDown className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Deductions</p>
                                        <p className="text-2xl font-bold">₹{taxCalculation?.total_deductions.toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center">
                                        <Calculator className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Taxable Income</p>
                                        <p className="text-2xl font-bold">₹{taxCalculation?.taxable_income.toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tax Payable</p>
                                        <p className="text-2xl font-bold">₹{taxCalculation?.calculated_tax.toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="breakdown">
                        <TabsList>
                            <TabsTrigger value="breakdown">Tax Breakdown</TabsTrigger>
                            <TabsTrigger value="slabs">Tax Slabs</TabsTrigger>
                            <TabsTrigger value="declarations">My Declarations</TabsTrigger>
                        </TabsList>

                        <TabsContent value="breakdown" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detailed Tax Calculation</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {taxBreakdown.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex items-center justify-between p-4 rounded-lg ${item.highlight ? 'bg-primary/10 border-2 border-primary' : 'bg-secondary'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {item.type === 'income' && <TrendingUp className="w-5 h-5 text-blue-500" />}
                                                    {item.type === 'deduction' && <TrendingDown className="w-5 h-5 text-green-500" />}
                                                    {item.type === 'taxable' && <Calculator className="w-5 h-5 text-orange-500" />}
                                                    {item.type === 'tax' && <FileText className="w-5 h-5 text-red-500" />}
                                                    <span className={item.highlight ? 'font-bold text-lg' : 'font-medium'}>
                                                        {item.label}
                                                    </span>
                                                </div>
                                                <span className={`${item.highlight ? 'font-bold text-xl' : 'font-semibold'} ${item.amount < 0 ? 'text-green-600' : item.type === 'tax' ? 'text-red-600' : ''
                                                    }`}>
                                                    ₹{Math.abs(item.amount).toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <h4 className="font-semibold text-blue-900 mb-2">💡 Tax Saving Tip</h4>
                                        <p className="text-sm text-blue-700">
                                            You can save more tax by declaring additional investments under Section 80C (up to ₹1.5 lakhs),
                                            Section 80D (Health Insurance), and HRA if you're paying rent.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="slabs" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Applicable Tax Slabs</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {taxCalculation?.tax_slabs?.map((slab: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                                                <span>
                                                    ₹{slab.min.toLocaleString()} - {slab.max ? `₹${slab.max.toLocaleString()}` : 'Above'}
                                                </span>
                                                <span className="font-semibold">{slab.rate}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="declarations" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Investment Declarations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {declarations.length > 0 ? (
                                        <div className="space-y-3">
                                            {declarations.map((dec: any) => (
                                                <div key={dec.id} className="p-4 bg-secondary rounded-lg">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium">{dec.declaration_type === 'start_of_year' ? 'Start of Year' : 'End of Year'}</span>
                                                        <span className={`px-2 py-1 rounded-full text-xs ${dec.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                            dec.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                                                                dec.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {dec.status}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {dec.investments.section_80c && <div>80C: ₹{dec.investments.section_80c.amount.toLocaleString()}</div>}
                                                        {dec.investments.section_80d && <div>80D: ₹{dec.investments.section_80d.amount.toLocaleString()}</div>}
                                                        {dec.investments.hra && <div>HRA: ₹{dec.investments.hra.amount.toLocaleString()}</div>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-8">No declarations found</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>

    );
}
