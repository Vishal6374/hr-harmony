import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarCheck, Clock, UserCheck, UserX, TrendingUp, X, Edit, Settings } from 'lucide-react';
import { format, isSameDay, eachDayOfInterval, startOfMonth, endOfMonth, isWeekend, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { attendanceService, employeeService, holidayService } from '@/services/apiService';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AttendanceEditModal } from '@/components/attendance/AttendanceEditModal';
import { AttendanceSettings } from '@/components/attendance/AttendanceSettings';
import { MarkAttendanceModal } from '@/components/attendance/MarkAttendanceModal';

export default function Attendance() {
  const { isHR, user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [markingEmployee, setMarkingEmployee] = useState<any>(null);
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [year, month] = selectedMonth.split('-').map(Number);
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(new Date(year, month - 1));
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const today = new Date();

  // Fetch attendance logs
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['attendance', selectedMonth],
    queryFn: async () => {
      const startDate = monthStart.toISOString().split('T')[0];
      const endDate = monthEnd.toISOString().split('T')[0];
      const { data } = await attendanceService.getLogs({
        employee_id: isHR ? undefined : user?.id,
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

  // Fetch holidays
  const { data: holidays = [] } = useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      const { data } = await holidayService.getAll();
      return data;
    },
  });

  // Fetch employees for HR (only active employees)
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await employeeService.getAll({ status: 'active' });
      return data.employees || [];
    },
    enabled: isHR,
  });

  // Fetch attendance settings
  const { data: settings } = useQuery({
    queryKey: ['attendance-settings'],
    queryFn: async () => {
      const { data } = await attendanceService.getSettings();
      return data;
    },
  });

  const queryClient = useQueryClient();

  const markAttendanceMutation = useMutation({
    mutationFn: (data: any) => attendanceService.mark(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
      toast.success('Attendance updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update attendance');
    },
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => attendanceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
      setIsEditModalOpen(false);
      setEditingAttendance(null);
      toast.success('Attendance updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update attendance');
    },
  });

  // Calculate stats
  const todayLogs = logs.filter((log: any) => isSameDay(new Date(log.date), today));
  const presentToday = todayLogs.filter((log: any) => log.status === 'present').length;
  const absentToday = todayLogs.filter((log: any) => log.status === 'absent').length;
  const myPresentDays = summary?.present || 0;
  const myAbsentDays = summary?.absent || 0;

  const attendanceToday = logs.find((log: any) =>
    log.employee_id === user?.id && isSameDay(new Date(log.date), today)
  );

  const getAttendanceForDate = (date: Date) => {
    return logs.filter((log: any) => isSameDay(new Date(log.date), date));
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'present': return 'bg-green-500';
      case 'absent': return 'bg-destructive';
      case 'half_day': return 'bg-amber-500';
      case 'on_leave': return 'bg-blue-500';
      default: return 'bg-slate-200';
    }
  };

  const handleDateClick = (date: Date) => {
    if (isHR) {
      setSelectedDate(date);
      setIsModalOpen(true);
    }
  };

  const handleEditAttendance = (attendance: any, employee: any) => {
    setEditingAttendance({ ...attendance, employee });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (data: any) => {
    if (editingAttendance?.id) {
      updateAttendanceMutation.mutate({
        id: editingAttendance.id,
        data,
      });
    }
  };

  const handleMarkAttendance = (employee: any) => {
    setMarkingEmployee(employee);
    setIsMarkModalOpen(true);
  };

  const handleSaveMark = (data: any) => {
    markAttendanceMutation.mutate(data);
    setIsMarkModalOpen(false);
    setMarkingEmployee(null);
  };

  const selectedDateLogs = selectedDate ? getAttendanceForDate(selectedDate) : [];

  if (logsLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading attendance...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Attendance"
            description={isHR ? 'Track and manage employee attendance' : 'Clock in/out and view your attendance'}
          />
          {isHR && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              {showSettings ? 'Hide Settings' : 'Settings'}
            </Button>
          )}
        </div>

        {/* Settings Panel - HR Only */}
        {isHR && showSettings && (
          <AttendanceSettings />
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {isHR ? (
            <>
              <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><UserCheck className="w-5 h-5 text-green-600" /></div><div><p className="text-xl sm:text-2xl font-bold">{presentToday}</p><p className="text-xs text-muted-foreground">Present Today</p></div></div></CardContent></Card>
              <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><UserX className="w-5 h-5 text-destructive" /></div><div><p className="text-xl sm:text-2xl font-bold">{absentToday}</p><p className="text-xs text-muted-foreground">Absent Today</p></div></div></CardContent></Card>
              <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><CalendarCheck className="w-5 h-5 text-blue-600" /></div><div><p className="text-xl sm:text-2xl font-bold">{todayLogs.filter((log: any) => log.status === 'on_leave').length}</p><p className="text-xs text-muted-foreground">On Leave</p></div></div></CardContent></Card>
              <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><Clock className="w-5 h-5 text-slate-600" /></div><div><p className="text-xl sm:text-2xl font-bold">{format(currentTime, 'HH:mm')}</p><p className="text-xs text-muted-foreground">Current Time</p></div></div></CardContent></Card>
            </>
          ) : (
            <>
              <Card className={cn("col-span-full lg:col-span-2 border-l-4 shadow-lg overflow-hidden", attendanceToday?.status === 'present' ? "border-l-green-500 bg-gradient-to-br from-green-50 via-white to-white" : "border-l-primary bg-gradient-to-br from-primary/5 via-white to-white")}>
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-center">
                      <p className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{format(currentTime, 'HH:mm:ss')}</p>
                      <p className="text-sm sm:text-base text-muted-foreground mt-2">{format(currentTime, 'EEEE, MMMM d, yyyy')}</p>
                    </div>
                    {attendanceToday ? (
                      <div className="flex flex-col items-center gap-3 w-full">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                          <p className="text-lg font-semibold text-green-600">Clocked In</p>
                        </div>
                        {attendanceToday.check_in && (
                          <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-green-200 w-full shadow-sm">
                            <p className="text-xs text-muted-foreground">Clock In Time</p>
                            <p className="text-2xl sm:text-xl font-bold text-green-600">{format(new Date(attendanceToday.check_in), 'HH:mm:ss')}</p>
                          </div>
                        )}
                        {attendanceToday.check_out && (
                          <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-red-200 w-full shadow-sm">
                            <p className="text-xs text-muted-foreground">Clock Out Time</p>
                            <p className="text-2xl sm:text-xl font-bold text-red-600">{format(new Date(attendanceToday.check_out), 'HH:mm:ss')}</p>
                          </div>
                        )}
                        {!attendanceToday.check_out && (
                          <Button variant="destructive" className="w-full h-12 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all" onClick={() => markAttendanceMutation.mutate({ date: format(new Date(), 'yyyy-MM-dd'), check_out: new Date().toISOString() })} disabled={markAttendanceMutation.isPending}>
                            <Clock className="w-4 h-4 mr-2" />
                            {markAttendanceMutation.isPending ? 'Processing...' : 'Clock Out'}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 w-full">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-slate-400" />
                          <p className="text-lg font-semibold text-muted-foreground">Not Clocked In</p>
                        </div>
                        <Button className="w-full h-12 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all" onClick={() => markAttendanceMutation.mutate({ status: 'present', date: format(new Date(), 'yyyy-MM-dd'), check_in: new Date().toISOString() })} disabled={markAttendanceMutation.isPending}>
                          <UserCheck className="w-5 h-5 mr-2" />
                          {markAttendanceMutation.isPending ? 'Clocking In...' : 'Clock In'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow"><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center"><CalendarCheck className="w-6 h-6 text-success" /></div><div><p className="text-xl sm:text-2xl font-bold text-success">{myPresentDays}</p><p className="text-xs text-muted-foreground">Present Days</p></div></div></CardContent></Card>
              <Card className="hover:shadow-md transition-shadow"><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center"><X className="w-6 h-6 text-destructive" /></div><div><p className="text-xl sm:text-2xl font-bold text-destructive">{myAbsentDays}</p><p className="text-xs text-muted-foreground">Absent Days</p></div></div></CardContent></Card>
              <Card className="hover:shadow-md transition-shadow"><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-primary" /></div><div><p className="text-xl sm:text-2xl font-bold">{Math.round((myPresentDays / (myPresentDays + myAbsentDays || 1)) * 100)}%</p><p className="text-xs text-muted-foreground">Attendance Rate</p></div></div></CardContent></Card>
            </>
          )}
        </div>

        {/* Today's Attendance - HR Only - Fixed Height with Scroll */}
        {isHR && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Today's Attendance - {format(today, 'dd MMM yyyy')}</span>
                <span className="text-sm font-normal text-muted-foreground">{presentToday} Present / {employees.length} Total</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-y-auto space-y-2 pr-2">
                {employees.map((emp: any) => {
                  const empAttendance = todayLogs.find((log: any) => log.employee_id === emp.id);
                  const isPresent = empAttendance?.status === 'present';
                  const isAbsent = empAttendance?.status === 'absent';
                  const isOnLeave = empAttendance?.status === 'on_leave';

                  return (
                    <div key={emp.id} className={cn("flex items-center justify-between p-3 rounded-lg border", isPresent && "bg-green-50 border-green-200", isAbsent && "bg-red-50 border-red-200", isOnLeave && "bg-blue-50 border-blue-200", !empAttendance && "bg-slate-50 border-slate-200")}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={emp.avatar} />
                          <AvatarFallback>{emp.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.employee_id} • {emp.department?.name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {empAttendance && (
                          <div className="text-right text-xs">
                            {empAttendance.check_in && <p className="text-muted-foreground">In: <span className="font-semibold text-green-600">{format(new Date(empAttendance.check_in), 'HH:mm')}</span></p>}
                            {empAttendance.check_out && <p className="text-muted-foreground">Out: <span className="font-semibold text-red-600">{format(new Date(empAttendance.check_out), 'HH:mm')}</span></p>}
                          </div>
                        )}
                        {empAttendance ? (
                          <>
                            <StatusBadge status={empAttendance.status} className="capitalize" />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAttendance(empAttendance, emp)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAttendance(emp)}
                            className="h-8 text-xs"
                          >
                            <UserCheck className="w-3 h-3 mr-1" />
                            Mark
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calendar */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-base">{format(monthStart, 'MMMM yyyy')} Attendance</CardTitle>
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-3 py-1 border rounded-md text-sm" />
          </CardHeader>
          <CardContent>
            {/* Legend */}
            {!isHR && (
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex flex-wrap gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-pink-600">H</span>
                    <span className="text-muted-foreground">Holiday</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-600">WO</span>
                    <span className="text-muted-foreground">Week Off</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-blue-600">L</span>
                    <span className="text-muted-foreground">Leave</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-green-600">P</span>
                    <span className="text-muted-foreground">Present</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-amber-600">OD</span>
                    <span className="text-muted-foreground">On Duty</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-orange-600">CO</span>
                    <span className="text-muted-foreground">Comp Off</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-red-600">AB</span>
                    <span className="text-muted-foreground">Absent</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-purple-600">AEYP</span>
                    <span className="text-muted-foreground">Attendance entries yet to be processed</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-foreground p-2 bg-muted/30 rounded">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
              {/* Adjust for Monday start */}
              {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {daysInMonth.map((date) => {
                const dayLogs = getAttendanceForDate(date);
                const userLog = dayLogs.find((log: any) => log.employee_id === user?.id);
                const holiday = holidays.find((h: any) => isSameDay(new Date(h.date), date));
                const presentCount = dayLogs.filter((log: any) => log.status === 'present').length;
                const isWeekendDay = isWeekend(date);
                const isPastDate = isBefore(date, startOfDay(today));
                const isTodayDate = isSameDay(date, today);

                // Get status label for employee view
                const getStatusLabel = () => {
                  if (holiday) return { label: 'H', color: 'text-pink-600 bg-pink-50', fullLabel: 'H : H' };
                  if (isWeekendDay) return { label: 'WO', color: 'text-slate-600 bg-blue-100', fullLabel: 'WO : WO' };
                  if (!userLog && !isPastDate) return null;

                  switch (userLog?.status) {
                    case 'present':
                      return { label: 'P', color: 'text-green-600 bg-green-50', fullLabel: 'P : P' };
                    case 'absent':
                      return { label: 'AB', color: 'text-red-600 bg-red-50', fullLabel: 'AB : AB' };
                    case 'half_day':
                      // Determine if present in morning or afternoon based on check-in time
                      // If check-in is before 1 PM (13:00), assume Morning Present (P : AB)
                      // Otherwise assume Afternoon Present (AB : P)
                      const checkInHour = userLog.check_in ? new Date(userLog.check_in).getHours() : 9;
                      const isMorningPresent = checkInHour < 13;
                      return {
                        label: 'HD',
                        color: 'text-amber-600 bg-amber-50',
                        fullLabel: isMorningPresent ? 'P : AB' : 'AB : P'
                      };
                    case 'on_leave':
                      return { label: 'L', color: 'text-blue-600 bg-blue-50', fullLabel: 'L : L' };
                    default:
                      // If past date and no log, assumed absent
                      if (isPastDate && !userLog) return { label: 'AB', color: 'text-red-600 bg-red-50', fullLabel: 'AB : AB' };
                      return null;
                  }
                };

                const statusInfo = getStatusLabel();

                return (
                  <div
                    key={date.toISOString()}
                    onClick={() => handleDateClick(date)}
                    className={cn(
                      'aspect-square p-1.5 border rounded-lg flex flex-col relative group transition-all min-h-[80px]',
                      isHR && 'cursor-pointer hover:border-primary hover:shadow-md',
                      isWeekendDay && 'bg-blue-50/50 border-blue-200',
                      holiday && 'bg-pink-50 border-pink-200',
                      isTodayDate && 'ring-2 ring-primary ring-offset-1',
                      !isHR && statusInfo && statusInfo.color.includes('bg-') && statusInfo.color.split(' ')[1]
                    )}
                    title={holiday?.name || ''}
                  >
                    {/* Date number */}
                    <div className="flex justify-between items-start mb-1">
                      <span className={cn(
                        "text-xs font-semibold",
                        holiday && "text-pink-700",
                        isWeekendDay && !holiday && "text-slate-600",
                        isTodayDate && "text-primary"
                      )}>
                        {format(date, 'd')}
                      </span>
                      {isTodayDate && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>

                    {/* Employee View - Status Labels */}
                    {!isHR && (
                      <div className="flex-1 flex flex-col justify-center items-center gap-0.5">
                        {holiday && (
                          <div className="text-center">
                            <div className="text-xs font-bold text-pink-600">H : H</div>
                          </div>
                        )}
                        {!holiday && isWeekendDay && (
                          <div className="text-center">
                            <div className="text-xs font-bold text-slate-600">WO : WO</div>
                          </div>
                        )}
                        {!holiday && !isWeekendDay && statusInfo && (
                          <div className="text-center">
                            <div className={cn("text-xs font-bold", statusInfo.color.split(' ')[0])}>
                              {statusInfo.fullLabel}
                            </div>
                            {userLog?.check_in && (
                              <div className="text-[9px] text-muted-foreground mt-0.5">
                                {format(new Date(userLog.check_in), 'HH:mm')} - {userLog.check_out ? format(new Date(userLog.check_out), 'HH:mm') : ''}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* HR View - Present Count */}
                    {isHR && (
                      <div className="flex-1 flex items-center justify-center">
                        {holiday && (
                          <span className="text-[10px] font-semibold text-pink-600">{holiday.name}</span>
                        )}
                        {!holiday && presentCount > 0 && (
                          <span className="text-sm font-semibold text-green-600">{presentCount}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend for HR */}
            {isHR && (
              <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-xs">Present</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-destructive" /><span className="text-xs">Absent</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-xs">Half Day</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-xs">On Leave</span></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Date Details Modal - HR Only */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Attendance for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 mt-4">
              {employees.map((emp: any) => {
                const empLog = selectedDateLogs.find((log: any) => log.employee_id === emp.id);
                return (
                  <div key={emp.id} className={cn("flex items-center justify-between p-3 rounded-lg border", empLog?.status === 'present' && "bg-green-50 border-green-200", empLog?.status === 'absent' && "bg-red-50 border-red-200", empLog?.status === 'on_leave' && "bg-blue-50 border-blue-200", !empLog && "bg-slate-50 border-slate-200")}>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={emp.avatar} />
                        <AvatarFallback>{emp.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.employee_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {empLog && (
                        <div className="text-right text-xs">
                          {empLog.check_in && <p className="text-muted-foreground">In: <span className="font-semibold text-green-600">{format(new Date(empLog.check_in), 'HH:mm:ss')}</span></p>}
                          {empLog.check_out && <p className="text-muted-foreground">Out: <span className="font-semibold text-red-600">{format(new Date(empLog.check_out), 'HH:mm:ss')}</span></p>}
                        </div>
                      )}
                      {empLog ? (
                        <>
                          <StatusBadge status={empLog.status} className="capitalize" />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              handleEditAttendance(empLog, emp);
                              setIsModalOpen(false);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground px-3 py-1 bg-slate-100 rounded">Not Marked</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Attendance Modal - HR Only */}
        {editingAttendance && (
          <AttendanceEditModal
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            attendance={editingAttendance}
            employee={editingAttendance.employee}
            settings={settings}
            onSave={handleSaveEdit}
            isSaving={updateAttendanceMutation.isPending}
          />
        )}

        {/* Mark Attendance Modal - HR Only */}
        {markingEmployee && (
          <MarkAttendanceModal
            open={isMarkModalOpen}
            onOpenChange={setIsMarkModalOpen}
            employee={markingEmployee}
            date={today}
            onSave={handleSaveMark}
            isSaving={markAttendanceMutation.isPending}
          />
        )}
      </div>
    </MainLayout>
  );
}
