import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Search, CalendarCheck, Clock, UserCheck, UserX } from 'lucide-react';
import { format, isSameDay, eachDayOfInterval, startOfMonth, endOfMonth, isWeekend, isBefore, startOfDay, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { attendanceService, employeeService, leaveService, holidayService } from '@/services/apiService';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function Attendance() {
  const { isHR, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedEmployee, setSelectedEmployee] = useState<string>(isHR ? 'all' : user?.id || '');

  const [year, month] = selectedMonth.split('-').map(Number);
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(new Date(year, month - 1));
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const today = new Date();

  // Fetch attendance logs for the selected month
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['attendance', selectedMonth, selectedEmployee],
    queryFn: async () => {
      const startDate = monthStart.toISOString().split('T')[0];
      const endDate = monthEnd.toISOString().split('T')[0];

      const { data } = await attendanceService.getLogs({
        employee_id: selectedEmployee !== 'all' ? selectedEmployee : undefined,
        start_date: startDate,
        end_date: endDate,
      });
      return data;
    },
  });

  // Fetch summary for employee view
  const { data: summary } = useQuery({
    queryKey: ['attendance-summary', selectedMonth, user?.id],
    queryFn: async () => {
      const { data } = await attendanceService.getSummary({
        employee_id: user?.id,
        month,
        year,
      });
      return data;
    },
    enabled: !isHR,
  });

  // Fetch leave requests for pending status
  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['leave-requests', user?.id],
    queryFn: async () => {
      const { data } = await leaveService.getRequests({ employee_id: user?.id });
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch holidays
  const { data: holidays = [] } = useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      const { data } = await holidayService.getAll();
      return data;
    },
  });

  // Fetch employees for HR dropdown
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await employeeService.getAll();
      return data.employees || [];
    },
    enabled: isHR,
  });

  // Calculate today's stats for HR
  const todayLogs = logs.filter((log: any) => isSameDay(new Date(log.date), today));
  const presentToday = todayLogs.filter((log: any) => log.status === 'present').length;
  const absentToday = todayLogs.filter((log: any) => log.status === 'absent').length;

  // Use summary data for employee view
  const myPresentDays = summary?.present || 0;
  const myAbsentDays = summary?.absent || 0;

  // ... inside component ...
  const queryClient = useQueryClient();

  const markAttendanceMutation = useMutation({
    mutationFn: (data: any) => attendanceService.mark(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
      toast.success('Attendance marked successfully');
    },
    onError: (error: any) => {
      console.error("Mark attendance error:", error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to mark attendance');
    },
  });

  const attendanceToday = logs.find((log: any) =>
    log.employee_id === user?.id && isSameDay(new Date(log.date), today)
  );

  const getAttendanceForDate = (employeeId: string, date: Date) => {
    return logs.find(
      (log: any) => log.employee_id === employeeId && isSameDay(new Date(log.date), date)
    );
  };

  if (logsLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading attendance...</div>
        </div>
      </MainLayout>
    );
  }

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'present': return 'bg-green-500 shadow-sm';
      case 'absent': return 'bg-destructive shadow-sm';
      case 'half_day': return 'bg-amber-500 shadow-sm';
      case 'on_leave': return 'bg-blue-500 shadow-sm';
      case 'weekend': return 'bg-slate-400';
      default: return 'bg-slate-200';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Attendance"
          description={isHR ? 'Track and manage employee attendance' : 'View your attendance records'}
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {isHR ? (
            <>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{presentToday}</p>
                      <p className="text-xs text-muted-foreground">Present Today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <UserX className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{absentToday}</p>
                      <p className="text-xs text-muted-foreground">Absent Today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <CalendarCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{todayLogs.filter((log: any) => log.status === 'on_leave').length}</p>
                      <p className="text-xs text-muted-foreground">On Leave</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{format(new Date(), 'HH:mm')}</p>
                      <p className="text-xs text-muted-foreground">Current Time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className={cn("col-span-2 sm:col-span-1 border-l-4",
                attendanceToday?.status === 'present' ? "border-l-green-500" : "border-l-primary"
              )}>
                <CardContent className="pt-4 flex flex-col justify-center h-full">
                  {!attendanceToday ? (
                    <Button
                      className="w-full h-full min-h-[60px]"
                      onClick={() => markAttendanceMutation.mutate({ status: 'present', date: format(new Date(), 'yyyy-MM-dd') })}
                      disabled={markAttendanceMutation.isPending}
                    >
                      {markAttendanceMutation.isPending ? 'Marking...' : 'Mark Present'}
                    </Button>
                  ) : (
                    <div className="text-center">
                      <p className="text-lg font-bold capitalize text-success">
                        {attendanceToday.status.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">Marked for Today</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <p className="text-2xl font-bold text-success">{myPresentDays}</p>
                  <p className="text-xs text-muted-foreground">Present Days</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-2xl font-bold text-destructive">{myAbsentDays}</p>
                  <p className="text-xs text-muted-foreground">Absent Days</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-2xl font-bold">{Math.round((myPresentDays / (myPresentDays + myAbsentDays || 1)) * 100)}%</p>
                  <p className="text-xs text-muted-foreground">Attendance Rate</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Today's Attendance - HR Only */}
        {isHR && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Today's Attendance - {format(today, 'dd MMM yyyy')}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {presentToday} Present / {employees.length} Total
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {employees.map((emp: any) => {
                  const empAttendance = todayLogs.find((log: any) => log.employee_id === emp.id);
                  const isPresent = empAttendance?.status === 'present';
                  const isAbsent = empAttendance?.status === 'absent';
                  const isOnLeave = empAttendance?.status === 'on_leave';
                  const isHalfDay = empAttendance?.status === 'half_day';

                  return (
                    <div
                      key={emp.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-colors",
                        isPresent && "bg-green-50 border-green-200",
                        isAbsent && "bg-red-50 border-red-200",
                        isOnLeave && "bg-blue-50 border-blue-200",
                        isHalfDay && "bg-amber-50 border-amber-200",
                        !empAttendance && "bg-slate-50 border-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={emp.avatar} />
                          <AvatarFallback>{emp.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {emp.employee_id} • {emp.department?.name || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {empAttendance ? (
                          <>
                            <StatusBadge
                              status={empAttendance.status}
                              className="capitalize"
                            />
                            {empAttendance.check_in && (
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(empAttendance.check_in), 'HH:mm')}
                              </span>
                            )}
                            <Select
                              value={empAttendance.status}
                              onValueChange={(newStatus) => {
                                markAttendanceMutation.mutate({
                                  employee_id: emp.id,
                                  status: newStatus,
                                  date: format(today, 'yyyy-MM-dd'),
                                });
                              }}
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="present">Present</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                                <SelectItem value="half_day">Half Day</SelectItem>
                                <SelectItem value="on_leave">On Leave</SelectItem>
                              </SelectContent>
                            </Select>
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-muted-foreground">Not marked</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                markAttendanceMutation.mutate({
                                  employee_id: emp.id,
                                  status: 'present',
                                  date: format(today, 'yyyy-MM-dd'),
                                });
                              }}
                              disabled={markAttendanceMutation.isPending}
                            >
                              Mark Present
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                markAttendanceMutation.mutate({
                                  employee_id: emp.id,
                                  status: 'absent',
                                  date: format(today, 'yyyy-MM-dd'),
                                });
                              }}
                              disabled={markAttendanceMutation.isPending}
                            >
                              Mark Absent
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-[180px]" />
          {isHR && (
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{format(monthStart, 'MMMM yyyy')} Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {daysInMonth.map((date) => {
                const employeeId = isHR && selectedEmployee !== 'all' ? selectedEmployee : user?.id || '';
                const attendance = getAttendanceForDate(employeeId, date);
                const holiday = holidays.find((h: any) => isSameDay(new Date(h.date), date));
                const isHoliday = !!holiday;

                // Check for pending leaves
                const pendingLeave = leaveRequests.find((req: any) =>
                  req.status === 'pending' &&
                  isWithinInterval(date, { start: new Date(req.start_date), end: new Date(req.end_date) })
                );

                const isPast = isBefore(date, startOfDay(new Date()));
                // Implicit absent: Past date, no log, not weekend, not holiday, not currently applied for leave
                const isImplicitAbsent = !attendance && isPast && !isHoliday && !isWeekend(date) && !pendingLeave;

                return (
                  <div
                    key={date.toISOString()}
                    className={cn(
                      'aspect-square p-1 border rounded-lg flex flex-col items-center justify-center relative group',
                      isWeekend(date) && 'bg-muted/50',
                      isHoliday && 'bg-amber-50 border-amber-200',
                      isImplicitAbsent && 'bg-destructive/5 border-destructive/20',
                      pendingLeave && 'bg-blue-50 border-blue-200',
                      isSameDay(date, today) && 'ring-2 ring-primary'
                    )}
                    title={holiday?.name || (pendingLeave ? 'Leave Pending' : '')}
                  >
                    <span className={cn(
                      "text-xs font-medium",
                      isHoliday && "text-amber-700",
                      isImplicitAbsent && "text-destructive",
                      pendingLeave && "text-blue-700"
                    )}>{format(date, 'd')}</span>

                    {attendance && (
                      <div className={cn('w-2 h-2 rounded-full mt-1', getStatusColor(attendance.status))} />
                    )}

                    {isHoliday && !attendance && (
                      <div className="w-2 h-2 rounded-full mt-1 bg-amber-500" />
                    )}

                    {isImplicitAbsent && (
                      <div className="w-2 h-2 rounded-full mt-1 bg-destructive" title="Absent" />
                    )}

                    {pendingLeave && !attendance && (
                      <div className="w-2 h-2 rounded-full mt-1 bg-blue-500" title="Pending Leave" />
                    )}

                    {/* Tooltips */}
                    {(isHoliday || pendingLeave || isImplicitAbsent) && (
                      <div className="absolute hidden group-hover:block bottom-full mb-1 z-10 px-2 py-1 text-xs text-white bg-black rounded whitespace-nowrap">
                        {holiday?.name || (pendingLeave ? 'Leave Pending' : 'Absent')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
              {['present', 'absent', 'half_day', 'on_leave', 'weekend'].map((status) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={cn('w-3 h-3 rounded-full', getStatusColor(status))} />
                  <span className="text-xs capitalize">{status.replace('_', ' ')}</span>
                </div>
              ))}
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-xs">Holiday</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-xs">Pending Leave</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-destructive" /><span className="text-xs">Absent</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
