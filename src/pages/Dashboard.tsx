import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CalendarCheck, Clock, MessageSquareWarning, Wallet, UserCheck, TrendingUp, PieChart as PieChartIcon, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService, attendanceService, leaveService, payrollService, reimbursementService, departmentService, employeeService, holidayService } from '@/services/apiService';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, isAfter } from 'date-fns';

export default function Dashboard() {
  const { isHR, user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await dashboardService.getStats();
      return data;
    },
  });

  // HR-specific data queries
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const { data } = await employeeService.getAll();
      return data.employees || [];
    },
    enabled: isHR,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const { data } = await departmentService.getAll();
      return data.departments || [];
    },
    enabled: isHR,
  });

  const { data: allLeaves = [] } = useQuery({
    queryKey: ['all-leaves'],
    queryFn: async () => {
      const { data } = await leaveService.getRequests();
      return data;
    },
    enabled: isHR,
  });

  const { data: payrollBatches = [] } = useQuery({
    queryKey: ['payroll-batches'],
    queryFn: async () => {
      const { data } = await payrollService.getBatches();
      return data;
    },
    enabled: isHR,
  });

  // Employee-specific data queries
  const { data: myAttendanceLogs = [] } = useQuery({
    queryKey: ['my-attendance-logs', user?.id],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, 30);
      const { data } = await attendanceService.getLogs({
        employee_id: user?.id,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });
      return data;
    },
    enabled: !isHR && !!user?.id,
  });

  const { data: myLeaveBalance } = useQuery({
    queryKey: ['my-leave-balance', user?.id],
    queryFn: async () => {
      const { data } = await leaveService.getBalances({ employee_id: user?.id });
      return data;
    },
    enabled: !isHR && !!user?.id,
  });

  const { data: myPayrollSlips = [] } = useQuery({
    queryKey: ['my-payroll-slips', user?.id],
    queryFn: async () => {
      const { data } = await payrollService.getSlips({ employee_id: user?.id });
      return data;
    },
    enabled: !isHR && !!user?.id,
  });

  const { data: myReimbursements = [] } = useQuery({
    queryKey: ['my-reimbursements', user?.id],
    queryFn: async () => {
      const { data } = await reimbursementService.getAll({ employee_id: user?.id });
      return data;
    },
    enabled: !isHR && !!user?.id,
  });

  // Upcoming Holidays Query
  const { data: upcomingHolidays = [] } = useQuery({
    queryKey: ['upcoming-holidays'],
    queryFn: async () => {
      const { data } = await holidayService.getAll();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Handle both array and object responses
      const holidaysList = Array.isArray(data) ? data : (data.holidays || []);

      return holidaysList
        .filter((holiday: any) => {
          const holidayDate = new Date(holiday.date);
          holidayDate.setHours(0, 0, 0, 0);
          return holidayDate >= today;
        })
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);
    },
  });

  // Fetch attendance logs for HR dashboard
  const { data: allAttendanceLogs = [] } = useQuery({
    queryKey: ['all-attendance-logs'],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, 6); // Last 7 days
      const { data } = await attendanceService.getLogs({
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });
      return data;
    },
    enabled: isHR,
  });

  // Process HR data for charts
  const hrAttendanceTrendData = isHR ? (() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
    return last7Days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayLogs = allAttendanceLogs.filter((log: any) =>
        format(new Date(log.date), 'yyyy-MM-dd') === dateStr
      );
      const presentCount = dayLogs.filter((log: any) => log.status === 'present').length;
      const absentCount = dayLogs.filter((log: any) => log.status === 'absent').length;

      return {
        date: format(date, 'EEE'),
        present: presentCount,
        absent: absentCount,
      };
    });
  })() : [];

  const departmentDistributionData = isHR ? departments.map(dept => ({
    name: dept.name,
    value: employees.filter((emp: any) => emp.department_id === dept.id).length,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`,
  })).filter(d => d.value > 0) : [];

  const hrLeaveStatsData = isHR ? [
    { type: 'Approved', count: allLeaves.filter((l: any) => l.status === 'approved').length, color: '#10b981' },
    { type: 'Pending', count: allLeaves.filter((l: any) => l.status === 'pending').length, color: '#f59e0b' },
    { type: 'Rejected', count: allLeaves.filter((l: any) => l.status === 'rejected').length, color: '#ef4444' },
  ] : [];

  const hrPayrollTrendData = isHR ? payrollBatches.slice(-6).map((batch: any) => ({
    month: format(new Date(batch.year, batch.month - 1), 'MMM'),
    amount: Number(batch.total_amount) || 0,
  })) : [];

  // Process Employee data for charts
  const employeeWorkHoursData = !isHR ? (() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), 29 - i));
    return last30Days.map(date => {
      const log = myAttendanceLogs.find((l: any) =>
        format(new Date(l.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );

      let hours = 0;
      let hoursDisplay = "0h 0m";

      if (log && log.check_in && log.check_out) {
        const checkIn = new Date(log.check_in);
        const checkOut = new Date(log.check_out);
        let diffMs = checkOut.getTime() - checkIn.getTime();

        // Handle overnight shifts (if checkout is before checkin, assume next day)
        if (diffMs < 0) {
          diffMs += 24 * 60 * 60 * 1000;
        }

        // Calculate decimal hours for bar height
        hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // 2 decimal places

        // Calculate exact hours and minutes for display
        const h = Math.floor(diffMs / (1000 * 60 * 60));
        const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        hoursDisplay = `${h}h ${m}m`;
      }

      return {
        date: format(date, 'dd'),
        hours: hours,
        hoursDisplay: hoursDisplay,
      };
    });
  })() : [];

  const employeeLeaveBalanceData = !isHR && myLeaveBalance ? [
    { type: 'Casual', balance: myLeaveBalance.casual_leave || 0, color: '#3b82f6' },
    { type: 'Sick', balance: myLeaveBalance.sick_leave || 0, color: '#10b981' },
    { type: 'Earned', balance: myLeaveBalance.earned_leave || 0, color: '#f59e0b' },
  ].filter(l => l.balance > 0) : [];

  const employeeSalaryTrendData = !isHR ? myPayrollSlips.slice(-6).map((slip: any) => ({
    month: format(new Date(slip.year, slip.month - 1), 'MMM'),
    amount: Number(slip.net_salary) || 0,
  })) : [];

  const employeeReimbursementData = !isHR ? [
    { status: 'Approved', count: myReimbursements.filter((r: any) => r.status === 'approved').length, color: '#10b981' },
    { status: 'Pending', count: myReimbursements.filter((r: any) => r.status === 'pending').length, color: '#f59e0b' },
    { status: 'Rejected', count: myReimbursements.filter((r: any) => r.status === 'rejected').length, color: '#ef4444' },
  ] : [];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <PageHeader title={isHR ? 'HR Dashboard' : `Welcome, ${user?.name?.split(' ')[0]}!`} description="Here's what's happening today." />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div><div><p className="text-xl sm:text-2xl font-bold">{stats?.activeEmployees || 0}</p><p className="text-xs text-muted-foreground">Active Employees</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><UserCheck className="w-5 h-5 text-success" /></div><div><p className="text-xl sm:text-2xl font-bold">{stats?.presentToday || stats?.presentDaysThisMonth || 0}</p><p className="text-xs text-muted-foreground">{isHR ? 'Present Today' : 'Present This Month'}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><Clock className="w-5 h-5 text-warning" /></div><div><p className="text-xl sm:text-2xl font-bold">{(stats?.pendingLeaves || 0) + (stats?.pendingReimbursements || 0)}</p><p className="text-xs text-muted-foreground">Pending Approvals</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center"><MessageSquareWarning className="w-5 h-5 text-info" /></div><div><p className="text-xl sm:text-2xl font-bold">{stats?.activeComplaints || 0}</p><p className="text-xs text-muted-foreground">Active Complaints</p></div></div></CardContent></Card>
        </div>

        {/* HR Charts */}
        {isHR && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Attendance Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Attendance Trend (Last 7 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                    <LineChart data={hrAttendanceTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} name="Present" />
                      <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} name="Absent" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Department Distribution */}
              {departmentDistributionData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <PieChartIcon className="w-4 h-4" />
                      Department Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={departmentDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {departmentDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Upcoming Holidays */}
              {upcomingHolidays.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Upcoming Holidays
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {upcomingHolidays.map((holiday: any, index: number) => (
                        <div key={index} className="flex items-start justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{holiday.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(holiday.date), 'EEE, MMM dd, yyyy')}
                            </p>
                          </div>
                          {holiday.type && (
                            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary ml-2 whitespace-nowrap">
                              {holiday.type}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Leave Statistics */}
              {hrLeaveStatsData.some(l => l.count > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4" />
                      Leave Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={hrLeaveStatsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="type" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                          {hrLeaveStatsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Payroll Trend */}
              {hrPayrollTrendData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Monthly Payroll Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={hrPayrollTrendData}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => `$${value.toLocaleString()}`}
                        />
                        <Area type="monotone" dataKey="amount" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAmount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Employee Charts */}
        {!isHR && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* My Work Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    My Work Hours (Last 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={employeeWorkHoursData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number, name: string, props: any) => [
                          props.payload.hoursDisplay,
                          'Work Hours'
                        ]}
                      />
                      <Bar dataKey="hours" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Leave Balance */}
              {employeeLeaveBalanceData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4" />
                      Leave Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={employeeLeaveBalanceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ type, balance }) => `${type}: ${balance}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="balance"
                        >
                          {employeeLeaveBalanceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Upcoming Holidays */}
              {upcomingHolidays.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Upcoming Holidays
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {upcomingHolidays.map((holiday: any, index: number) => (
                        <div key={index} className="flex items-start justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{holiday.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(holiday.date), 'EEE, MMM dd, yyyy')}
                            </p>
                          </div>
                          {holiday.type && (
                            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary ml-2 whitespace-nowrap">
                              {holiday.type}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Salary Trend */}
              {employeeSalaryTrendData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      My Salary Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={employeeSalaryTrendData}>
                        <defs>
                          <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => `$${value.toLocaleString()}`}
                        />
                        <Area type="monotone" dataKey="amount" stroke="#10b981" fillOpacity={1} fill="url(#colorSalary)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Reimbursement Status */}
              {employeeReimbursementData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Reimbursement Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={employeeReimbursementData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                          {employeeReimbursementData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Payroll Summary - HR Only */}
        {isHR && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Payroll Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-semibold capitalize">{stats?.payrollStatus || 'N/A'}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Employees</p>
                  <p className="font-semibold">{stats?.totalEmployees || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-semibold">${(stats?.totalPayroll || 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
