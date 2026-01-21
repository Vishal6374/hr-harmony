import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { payrollService } from '@/services/apiService';
import {
    DollarSign,
    Users,
    TrendingUp,
    AlertCircle,
    Settings,
    FileText,
    Calculator,
    Shield,
    Briefcase,
    Clock
} from 'lucide-react';
import { format } from 'date-fns';

export default function PayrollDashboard() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const handleTabClick = (tab: string) => {
        setSearchParams({ tab });
    };

    const { data: batches = [] } = useQuery({
        queryKey: ['payroll-batches'],
        queryFn: async () => {
            const { data } = await payrollService.getBatches();
            return data;
        },
    });

    const { data: stats } = useQuery({
        queryKey: ['payroll-stats'],
        queryFn: async () => {
            const { data } = await payrollService.getStats();
            return data;
        },
    });

    const currentMonth = new Date();
    const currentBatch = batches.find((b: any) =>
        b.month === currentMonth.getMonth() + 1 && b.year === currentMonth.getFullYear()
    );

    const completionPercentage = currentBatch
        ? currentBatch.status === 'paid' ? 100
            : currentBatch.status === 'processed' ? 80
                : 40
        : 0;

    const quickActions = [
        {
            title: 'Run Payroll',
            icon: Calculator,
            tab: 'run-payroll',
            color: 'gradient-primary',
            description: 'Process monthly payroll'
        },
        {
            title: 'Salary Structure',
            icon: Settings,
            tab: 'salary-structure',
            color: 'bg-blue-500',
            description: 'Configure salary components'
        },
        {
            title: 'Pay Groups',
            icon: Users,
            tab: 'pay-groups',
            color: 'bg-purple-500',
            description: 'Manage employee groups'
        },
        {
            title: 'Tax Settings',
            icon: Shield,
            tab: 'tax-settings',
            color: 'bg-green-500',
            description: 'Configure tax slabs'
        },
        {
            title: 'Salary Register',
            icon: FileText,
            tab: 'salary-register',
            color: 'bg-orange-500',
            description: 'View all salary slips'
        },
        {
            title: 'F&F Settlement',
            icon: Briefcase,
            tab: 'ff-settlement',
            color: 'bg-red-500',
            description: 'Final settlements'
        },
        {
            title: 'Audit Trail',
            icon: Clock,
            tab: 'audit-trail',
            color: 'bg-indigo-500',
            description: 'View change history'
        },
        {
            title: 'Compliance Reports',
            icon: FileText,
            tab: 'compliance',
            color: 'bg-teal-500',
            description: 'Download reports'
        },
    ];

    const upcomingPayouts = batches
        .filter((b: any) => b.status === 'processed')
        .slice(0, 3);

    const recentVariances = [
        { employee: 'John Doe', amount: 500, reason: 'Overtime', type: 'increase' },
        { employee: 'Jane Smith', amount: -200, reason: 'LOP', type: 'decrease' },
        { employee: 'Bob Johnson', amount: 1000, reason: 'Bonus', type: 'increase' },
    ];

    return (
        <div className="space-y-6">
            {/* Current Month Status */}
            <Card className="border-l-4 border-l-primary">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Current Month: {format(currentMonth, 'MMMM yyyy')}</span>
                        <span className="text-sm font-normal text-muted-foreground">
                            Status: {currentBatch?.status || 'Not Started'}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Payroll Processing</span>
                                <span className="text-sm text-muted-foreground">{completionPercentage}% Complete</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-3">
                                <div
                                    className="gradient-primary h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${completionPercentage}%` }}
                                />
                            </div>
                        </div>

                        {currentBatch && (
                            <div className="grid grid-cols-3 gap-4 pt-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Employees</p>
                                    <p className="text-2xl font-bold">{currentBatch.total_employees}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Amount</p>
                                    <p className="text-2xl font-bold">${Number(currentBatch.total_amount).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Next Payout</p>
                                    <p className="text-2xl font-bold">{currentBatch.status === 'processed' ? 'Pending' : 'N/A'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Payout (MTD)</p>
                                <p className="text-2xl font-bold">
                                    ${currentBatch ? Number(currentBatch.total_amount).toLocaleString() : '0'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Active Employees</p>
                                <p className="text-2xl font-bold">{currentBatch?.total_employees || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Avg Salary</p>
                                <p className="text-2xl font-bold">
                                    ${currentBatch && currentBatch.total_employees > 0
                                        ? Math.round(Number(currentBatch.total_amount) / currentBatch.total_employees).toLocaleString()
                                        : '0'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Pending Actions</p>
                                <p className="text-2xl font-bold">{upcomingPayouts.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {quickActions.map((action) => (
                            <Button
                                key={action.tab}
                                variant="outline"
                                className="h-auto flex-col items-start p-4 hover:border-primary transition-all"
                                onClick={() => handleTabClick(action.tab)}
                            >
                                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
                                    <action.icon className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-semibold text-sm">{action.title}</span>
                                <span className="text-xs text-muted-foreground mt-1">{action.description}</span>
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upcoming Payouts */}
                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Payouts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {upcomingPayouts.length > 0 ? (
                            <div className="space-y-3">
                                {upcomingPayouts.map((batch: any) => (
                                    <div key={batch.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                                        <div>
                                            <p className="font-medium">{format(new Date(batch.year, batch.month - 1), 'MMMM yyyy')}</p>
                                            <p className="text-sm text-muted-foreground">{batch.total_employees} employees</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">${Number(batch.total_amount).toLocaleString()}</p>
                                            <Button size="sm" onClick={() => navigate('/payroll')}>Process</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No pending payouts</p>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Variances */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Variances</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentVariances.map((variance, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                                    <div>
                                        <p className="font-medium">{variance.employee}</p>
                                        <p className="text-sm text-muted-foreground">{variance.reason}</p>
                                    </div>
                                    <div className={`font-bold ${variance.type === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                                        {variance.type === 'increase' ? '+' : ''}${variance.amount}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
