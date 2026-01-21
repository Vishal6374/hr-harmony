import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';

// Import all payroll sub-pages
import PayrollDashboard from './payroll/PayrollDashboard';
import SalaryStructureConfig from './payroll/SalaryStructureConfig';
import RunPayrollWizard from './payroll/RunPayrollWizard';
import TaxWorksheet from './payroll/TaxWorksheet';
import InvestmentDeclaration from './payroll/InvestmentDeclaration';
import LoanAdvanceRequest from './payroll/LoanAdvanceRequest';

// Import the original payroll slips view
import OriginalPayrollView from './PayrollOriginal';

export default function PayrollUnified() {
    const { isHR } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || (isHR ? 'dashboard' : 'my-payslips');

    const handleTabChange = (value: string) => {
        setSearchParams({ tab: value });
    };

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
                <PageHeader
                    title="Payroll Management"
                    description={isHR ? "Manage and process payroll" : "View your salary and tax information"}
                />

                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <div className="flex justify-center">
                        <TabsList className="grid" style={{ gridTemplateColumns: isHR ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)' }}>
                            {isHR ? (
                                <>
                                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                                    <TabsTrigger value="run-payroll">Run Payroll</TabsTrigger>
                                    <TabsTrigger value="salary-structure">Salary Structure</TabsTrigger>
                                    <TabsTrigger value="salary-register">Salary Register</TabsTrigger>
                                    <TabsTrigger value="loan-advance">Loan/Advance</TabsTrigger>
                                </>
                            ) : (
                                <>
                                    <TabsTrigger value="my-payslips">My Payslips</TabsTrigger>
                                    <TabsTrigger value="tax-worksheet">Tax Worksheet</TabsTrigger>
                                    <TabsTrigger value="investments">Investments</TabsTrigger>
                                    <TabsTrigger value="loan-advance">Loan/Advance</TabsTrigger>
                                </>
                            )}
                        </TabsList>
                    </div>

                    {isHR ? (
                        <>
                            <TabsContent value="dashboard" className="mt-6">
                                <PayrollDashboard />
                            </TabsContent>

                            <TabsContent value="run-payroll" className="mt-6">
                                <RunPayrollWizard />
                            </TabsContent>

                            <TabsContent value="salary-structure" className="mt-6">
                                <SalaryStructureConfig />
                            </TabsContent>

                            <TabsContent value="salary-register" className="mt-6">
                                <OriginalPayrollView />
                            </TabsContent>

                            <TabsContent value="loan-advance" className="mt-6">
                                <LoanAdvanceRequest />
                            </TabsContent>
                        </>
                    ) : (
                        <>
                            <TabsContent value="my-payslips" className="mt-6">
                                <OriginalPayrollView />
                            </TabsContent>

                            <TabsContent value="tax-worksheet" className="mt-6">
                                <TaxWorksheet />
                            </TabsContent>

                            <TabsContent value="investments" className="mt-6">
                                <InvestmentDeclaration />
                            </TabsContent>

                            <TabsContent value="loan-advance" className="mt-6">
                                <LoanAdvanceRequest />
                            </TabsContent>
                        </>
                    )}
                </Tabs>
            </div>
        </MainLayout>
    );
}
