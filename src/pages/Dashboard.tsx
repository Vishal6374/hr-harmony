import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CalendarCheck, Clock, MessageSquareWarning, Wallet, UserCheck, TrendingUp, PieChart as PieChartIcon, Calendar, Video, ExternalLink, Briefcase, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService, holidayService, meetingService } from '@/services/apiService';
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
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { PageLoader } from '@/components/ui/page-loader';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isHR = user?.role === 'hr';
  const isEmployee = !isAdmin && !isHR;

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await dashboardService.getStats();
      return data;
    },
  });

  const { data: upcomingHolidays = [] } = useQuery({
    queryKey: ['upcoming-holidays'],
    queryFn: async () => {
      const { data } = await holidayService.getAll();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const holidaysList = Array.isArray(data) ? data : (data.holidays || []);
      return holidaysList
        .filter((holiday: any) => new Date(holiday.date) >= today)
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);
    },
  });

  const { data: upcomingMeetings = [] } = useQuery({
    queryKey: ['my-meetings', user?.id],
    queryFn: async () => {
      const { data } = await meetingService.getMyMeetings();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return (data || [])
        .filter((m: any) => new Date(m.date) >= today)
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);
    },
    enabled: !!user?.id,
  });

  if (statsLoading) return <PageLoader />;

  const kpis = statsData?.kpis || {};
  const charts = statsData?.charts || {};
  const recentActivity = statsData?.recentActivity || [];

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0">
        <PageHeader
          title={isAdmin ? 'Admin Dashboard' : isHR ? 'HR Dashboard' : `Welcome, ${user?.name?.split(' ')[0]}!`}
          description={isAdmin ? 'Strategic overview and system performance.' : isHR ? "Operational metrics and workforce health." : "Your daily snapshot and personal performance."}
        />

        {/* 1️⃣ KPI CARDS (TOP ROW) */}
        <div className={cn(
          "grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4",
          isAdmin || isEmployee ? "xl:grid-cols-6" : "xl:grid-cols-5"
        )}>
          {isAdmin && (
            <>
              <MetricCard title="Total Employees" value={kpis.totalEmployees} icon={Users} color="text-blue-600" bgColor="bg-blue-50" />
              <MetricCard title="New Hires (MTD)" value={kpis.newHiresMTD} icon={UserCheck} color="text-emerald-600" bgColor="bg-emerald-50" />
              <MetricCard title="Attrition Rate" value={`${kpis.attritionRate}%`} icon={TrendingUp} color="text-rose-600" bgColor="bg-rose-50" />
              <MetricCard title="Departments" value={kpis.departments} icon={Briefcase} color="text-sky-600" bgColor="bg-sky-50" />
              <MetricCard title="Active Today" value={kpis.activeUsersToday} icon={Activity} color="text-emerald-600" bgColor="bg-emerald-50" />
              <MetricCard title="Payroll Cost (MTD)" value={`₹${kpis.payrollCostMTD?.toLocaleString()}`} icon={Wallet} color="text-amber-600" bgColor="bg-amber-50" />
            </>
          )}

          {isHR && (
            <>
              <MetricCard title="Total Employees" value={kpis.totalEmployees} icon={Users} color="text-blue-600" bgColor="bg-blue-50" />
              <MetricCard
                title="Present Today"
                value={kpis.presentToday}
                icon={UserCheck}
                color="text-emerald-600"
                bgColor="bg-emerald-50"
              />
              <MetricCard title="Pending Leaves" value={kpis.pendingLeaves} icon={CalendarCheck} color="text-amber-600" bgColor="bg-amber-50" />
              <MetricCard title="Payroll Status" value={kpis.payrollStatus === 'Paid' ? 'Paid' : 'Pending'} icon={Wallet} color="text-sky-600" bgColor="bg-sky-50" isStatus />
              <MetricCard title="Upcoming Exits" value={kpis.upcomingExits} icon={MessageSquareWarning} color="text-rose-600" bgColor="bg-rose-50" />
            </>
          )}

          {isEmployee && (
            <>
              <MetricCard
                title="Today's Status"
                value={kpis.todayStatus === 'Checked In' ? 'Done' : 'Pending'}
                icon={Clock}
                color="text-emerald-600"
                bgColor="bg-emerald-50"
                isStatus
              />
              <MetricCard title="Worked Hours" value={kpis.workedHours} icon={Clock} color="text-blue-600" bgColor="bg-blue-50" />
              <MetricCard title="Casual Leave" value={kpis.leaveBalance?.casual_leave || 0} icon={CalendarCheck} color="text-sky-600" bgColor="bg-sky-50" />
              <MetricCard title="Sick Leave" value={kpis.leaveBalance?.sick_leave || 0} icon={CalendarCheck} color="text-rose-600" bgColor="bg-rose-50" />
              <MetricCard title="Last Salary" value={`₹${kpis.lastSalary?.toLocaleString()}`} icon={Wallet} color="text-emerald-600" bgColor="bg-emerald-50" />
            </>
          )}
        </div>

        {/* 2️⃣ DENSE CONTENT GRID (3 COLUMNS) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {isAdmin && (
            <>
              <Card className="lg:col-span-2 shadow-sm border overflow-hidden">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 font-bold"><TrendingUp className="w-4 h-4 text-blue-600" />Workforce Growth</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    {charts.workforceGrowth?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={charts.workforceGrowth}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" fontSize={11} />
                          <YAxis fontSize={11} />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState message="No growth data available" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-1 shadow-sm border overflow-hidden">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 font-bold"><Activity className="w-4 h-4 text-rose-600" />Attrition by Dept</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    {charts.attritionByDept?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={charts.attritionByDept}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" fontSize={10} />
                          <YAxis fontSize={10} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState message="No attrition data recorded" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3 shadow-sm border overflow-hidden">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 font-bold"><Users className="w-4 h-4 text-blue-600" />Recent System Activity</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-muted text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                          <th className="px-6 py-3">User</th>
                          <th className="px-6 py-3">Action</th>
                          <th className="px-6 py-3 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {recentActivity.slice(0, 8).map((log: any) => (
                          <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-3 font-semibold">{log.performer?.name}</td>
                            <td className="px-6 py-3 text-muted-foreground">{log.action}</td>
                            <td className="px-6 py-3 text-right text-[10px] text-muted-foreground font-medium">{format(new Date(log.created_at), 'MMM dd, HH:mm')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {isHR && (
            <>
              <Card className="lg:col-span-2 shadow-sm border overflow-hidden">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 font-bold"><Activity className="w-4 h-4 text-emerald-600" />Daily Attendance Trend</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full">
                    {charts.attendanceTrend?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={charts.attendanceTrend}>
                          <defs>
                            <linearGradient id="colorCountHR" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), 'dd')} fontSize={11} />
                          <YAxis fontSize={11} />
                          <Tooltip />
                          <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCountHR)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState message="No attendance trend available" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-1 shadow-sm border overflow-hidden">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 font-bold"><PieChartIcon className="w-4 h-4 text-blue-600" />Leave Map</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full">
                    {charts.leaveTypeDist?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={charts.leaveTypeDist}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="count"
                            nameKey="leave_type"
                          >
                            {charts.leaveTypeDist.map((entry: any, index: number) => {
                              const name = entry.leave_type.toLowerCase();
                              let color = '#94a3b8'; // Default slate
                              if (name.includes('casual')) color = '#10b981'; // Green for Casual
                              if (name.includes('cl') || name.includes('privilege')) color = '#3b82f6'; // Blue for CL/Privilege
                              if (name.includes('sick')) color = '#ef4444'; // Red for Sick
                              return <Cell key={`cell-${index}`} fill={color} />;
                            })}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState message="No leave requests yet" />
                    )}
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-[10px] font-bold uppercase text-muted-foreground">CL</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-[10px] font-bold uppercase text-muted-foreground">Casual</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-[10px] font-bold uppercase text-muted-foreground">Sick</span></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-1 shadow-sm border">
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2 font-bold "><Video className="w-4 h-4" />Meetings</CardTitle></CardHeader>
                <CardContent>
                  {upcomingMeetings.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingMeetings.slice(0, 4).map((meeting: any) => (
                        <div key={meeting.id} className="p-3 rounded-lg border bg-muted/20 border-border/50 group hover:border-blue-500/50 transition-colors">
                          <p className="text-sm font-bold truncate group-hover:text-blue-600 transition-colors">{meeting.title}</p>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                            <span>{format(new Date(meeting.date), 'MMM dd')} - {meeting.start_time}</span>
                            {meeting.meeting_url && <ExternalLink className="w-3 h-3 text-blue-600" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center opacity-40 text-xs font-semibold uppercase tracking-widest">No Meetings</div>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 shadow-sm border overflow-hidden">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 font-bold"><Wallet className="w-4 h-4 text-emerald-600" />Attendance Volume</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={charts.attendanceTrend}>
                        <XAxis dataKey="date" hide />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-1 shadow-sm border">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 font-bold"><Calendar className="w-4 h-4 text-amber-600" />Holidays</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {upcomingHolidays.slice(0, 4).map((holiday: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2.5 rounded-lg border bg-card/40 text-[11px] font-bold">
                        <span className="truncate pr-2">{holiday.name}</span>
                        <span className="text-muted-foreground whitespace-nowrap">{format(new Date(holiday.date), 'MMM dd')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 shadow-sm border overflow-hidden">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 font-bold"><CalendarCheck className="w-4 h-4 text-blue-600" />Leave Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[150px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={charts.leaveTypeDist}>
                        <XAxis dataKey="leave_type" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {isEmployee && (
            <>
              <Card className="lg:col-span-2 shadow-sm border overflow-hidden">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 font-bold"><Clock className="w-4 h-4 text-emerald-600" />My Work Hours</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full">
                    {charts.monthlyAttendance?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={charts.monthlyAttendance}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), 'dd')} fontSize={11} />
                          <YAxis fontSize={11} />
                          <Tooltip />
                          <Bar dataKey="hours" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState message="No work logs found for this month" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-1 shadow-sm border overflow-hidden">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 font-bold"><PieChartIcon className="w-4 h-4 text-blue-600" />Leave Usage</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full text-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Used', value: (kpis.leaveBalance?.casual_leave_used || 0) + (kpis.leaveBalance?.sick_leave_used || 0) },
                            { name: 'Remaining', value: (kpis.leaveBalance?.casual_leave || 0) + (kpis.leaveBalance?.sick_leave || 0) }
                          ]}
                          innerRadius={60} outerRadius={80} dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#f1f5f9" />
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-1 shadow-sm border">
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2 font-bold"><Video className="w-4 h-4" />Meetings</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingMeetings.slice(0, 3).map((m: any) => (
                      <div key={m.id} className="p-3 border rounded-lg bg-blue-50/50 border-blue-100">
                        <p className="text-xs font-bold truncate">{m.title}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-1">{m.start_time}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 shadow-sm border">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 font-bold"><Calendar className="w-4 h-4 text-amber-600" />Holidays</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {upcomingHolidays.slice(0, 4).map((h: any, i: number) => (
                      <div key={i} className="p-3 border rounded-lg bg-muted/20">
                        <p className="text-xs font-bold truncate">{h.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 font-semibold">{format(new Date(h.date), 'MMM dd, EEE')}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function MetricCard({ title, value, icon: Icon, color, bgColor, isStatus }: any) {
  return (
    <Card className="border shadow-none bg-muted/20">
      <CardContent className="p-3 flex flex-col justify-center min-h-[70px]">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", bgColor)}>
            <Icon className={cn("w-4 h-4", color)} />
          </div>
          <div className="min-w-0">
            <p className={cn(
              "font-bold leading-none truncate",
              isStatus ? "text-[11px] sm:text-[13px] font-bold uppercase tracking-wide" : "text-xl sm:text-2xl font-normal"
            )}>{value}</p>
            <p className="text-[9px] uppercase font-medium tracking-tight text-muted-foreground mt-0.5 truncate">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
      <TrendingUp className="w-8 h-8 opacity-20" />
      <p className="text-xs font-medium">{message}</p>
    </div>
  );
}
