import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarCheck, Clock, UserCheck, UserX, TrendingUp, X, Edit, Settings, AlertCircle, Check, X as XIcon } from 'lucide-react';
import { format, isSameDay, eachDayOfInterval, startOfMonth, endOfMonth, isWeekend, isBefore, isAfter, startOfDay } from 'date-fns';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { attendanceService, employeeService, holidayService, regularizationService } from '@/services/apiService';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AttendanceEditModal } from '@/components/attendance/AttendanceEditModal';
import { AttendanceSettings } from '@/components/attendance/AttendanceSettings';
import { MarkAttendanceModal } from '@/components/attendance/MarkAttendanceModal';
import { PageLoader } from '@/components/ui/page-loader';
import Loader from '@/components/ui/Loader';
import { RegularizationModal } from '@/components/attendance/RegularizationModal';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Attendance() {
  const { isHR, isAdmin, user } = useAuth();
  const [activeTab, setActiveTab] = useState(isAdmin || isHR ? 'team' : 'personal');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [markingEmployee, setMarkingEmployee] = useState<any>(null);
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [isRegularizationModalOpen, setIsRegularizationModalOpen] = useState(false);
  const [showRegularizationRequests, setShowRegularizationRequests] = useState(false);

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
    enabled: !!user?.id,
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

  const requestRegularizationMutation = useMutation({
    mutationFn: regularizationService.request,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regularization-requests'] });
      setIsRegularizationModalOpen(false);
      toast.success('Regularization request submitted');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to submit request'),
  });

  const processRegularizationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => regularizationService.process(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regularization-requests'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Request processed');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to process request'),
  });

  const { data: regularizationRequests = [] } = useQuery({
    queryKey: ['regularization-requests', isHR],
    queryFn: async () => {
      const { data } = isHR ? await regularizationService.getAllRequests() : await regularizationService.getMyRequests();
      return data;
    },
  });

  // Calculate stats
  const todayLogs = logs.filter((log: any) => isSameDay(new Date(log.date), today));
  const presentToday = todayLogs.filter((log: any) => log.status === 'present').length;
  const absentToday = todayLogs.filter((log: any) => log.status === 'absent').length;

  // Local calculation to ensure 100% sync with calendar's visual logic
  const { myPresentDays, myAbsentDays } = useMemo(() => {
    let p = 0;
    let a = 0;
    daysInMonth.forEach(date => {
      if (isAfter(date, startOfDay(today))) return;
      const dateStr = format(date, 'yyyy-MM-dd');
      const userLog = logs.find((log: any) => log.employee_id === user?.id && log.date === dateStr);
      const holiday = holidays.find((h: any) => isSameDay(new Date(h.date), date));
      const isWeekendDay = isWeekend(date);

      if (userLog) {
        if (userLog.status === 'present') p++;
        else if (userLog.status === 'absent') a++;
        else if (userLog.status === 'half_day') { p += 0.5; a += 0.5; }
      } else if (isBefore(date, startOfDay(today))) {
        if (!isWeekendDay && !holiday) a++;
      }
    });
    return { myPresentDays: p, myAbsentDays: a };
  }, [daysInMonth, logs, user?.id, holidays, today]);

  const attendanceToday = logs.find((log: any) =>
    log.employee_id === user?.id && isSameDay(new Date(log.date), today)
  );

  const getAttendanceForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return logs.filter((log: any) => log.date === dateStr);
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
    if (activeTab === 'team') {
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
    return <PageLoader />;
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {(isHR || isAdmin) && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="team">Team Attendance</TabsTrigger>
              {!isAdmin && <TabsTrigger value="personal">My Attendance</TabsTrigger>}
            </TabsList>
          </Tabs>
        )}

        <div className="flex items-center justify-between">
          <PageHeader
            title="Attendance"
            description={activeTab === 'team' ? 'Track and manage employee attendance' : 'Clock in/out and view your attendance'}
          />
          <div className="flex items-center gap-2">
            {activeTab === 'personal' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRegularizationModalOpen(true)}
                className="gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Request Correction
              </Button>
            )}
            {activeTab === 'team' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRegularizationRequests(!showRegularizationRequests)}
                className="gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                {showRegularizationRequests ? 'Show Attendance' : 'View Requests'}
              </Button>
            )}
            {activeTab === 'team' && (
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
        </div>

        {/* Settings Panel - HR Only */}
        {activeTab === 'team' && showSettings && (
          <AttendanceSettings />
        )}

        {/* Regularization Requests - HR Only */}
        {activeTab === 'team' && showRegularizationRequests && (
          <Card className="animate-in slide-in-from-top duration-300">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Pending Regularization Requests</span>
                <span className="text-xs font-normal text-muted-foreground">{regularizationRequests.filter((r: any) => r.status === 'pending').length} Pending</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {regularizationRequests.filter((r: any) => r.status === 'pending').length > 0 ? (
                  regularizationRequests.filter((r: any) => r.status === 'pending').map((req: any) => (
                    <div key={req.id} className="p-4 border rounded-xl bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{req.employee?.name}</span>
                          <span className="text-xs text-muted-foreground">({req.employee?.employee_id})</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">{format(new Date(req.attendance_date), 'dd MMM yyyy')}</span>
                          <span className="mx-2 text-muted-foreground">|</span>
                          <span className="capitalize text-primary italic">{req.type.replace('_', ' ')}</span>
                        </div>
                        <p className="text-sm text-muted-foreground italic">"{req.reason}"</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => processRegularizationMutation.mutate({ id: req.id, data: { status: 'rejected', remarks: 'Rejected by HR' } })}
                        >
                          <XIcon className="w-4 h-4 mr-1" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => processRegularizationMutation.mutate({ id: req.id, data: { status: 'approved', remarks: 'Approved by HR' } })}
                        >
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-8">No pending requests.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {activeTab === 'team' ? (
            <>
              <Card><CardContent className="p-3 flex flex-col items-center justify-center min-h-[85px] text-center"><div className="flex flex-col items-center gap-1"><div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0"><UserCheck className="w-5 h-5 text-green-600" /></div><div><p className="text-2xl sm:text-3xl font-bold leading-none">{presentToday}</p><p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-1">Present Today</p></div></div></CardContent></Card>
              <Card><CardContent className="p-3 flex flex-col items-center justify-center min-h-[85px] text-center"><div className="flex flex-col items-center gap-1"><div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0"><UserX className="w-5 h-5 text-destructive" /></div><div><p className="text-2xl sm:text-3xl font-bold leading-none">{absentToday}</p><p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-1">Absent Today</p></div></div></CardContent></Card>
              <Card><CardContent className="p-3 flex flex-col items-center justify-center min-h-[85px] text-center"><div className="flex flex-col items-center gap-1"><div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0"><CalendarCheck className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl sm:text-3xl font-bold leading-none">{todayLogs.filter((log: any) => log.status === 'on_leave').length}</p><p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-1">On Leave</p></div></div></CardContent></Card>
              <Card><CardContent className="p-3 flex flex-col items-center justify-center min-h-[85px] text-center"><div className="flex flex-col items-center gap-1"><div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Clock className="w-5 h-5 text-slate-600" /></div><div><p className="text-2xl sm:text-3xl font-bold leading-none">{format(currentTime, 'hh:mm')}</p><p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-1">Current Time</p></div></div></CardContent></Card>
            </>
          ) : (
            <>
              <Card className={cn("col-span-full sm:col-span-2 lg:col-span-1 border-l-4 shadow-sm overflow-hidden", attendanceToday?.status === 'present' ? "border-l-green-500 bg-gradient-to-br from-green-50 via-white to-white" : "border-l-primary bg-gradient-to-br from-primary/5 via-white to-white")}>
                <CardContent className="p-3">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent leading-none">{format(currentTime, 'hh:mm:ss a')}</p>
                      <p className="text-[9px] text-muted-foreground mt-1 font-medium">{format(currentTime, 'EEEE, dd MMM yyyy')}</p>
                    </div>
                    {attendanceToday ? (
                      <div className="flex flex-col items-center gap-1.5 w-full">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <p className="text-[10px] font-semibold text-green-600 uppercase tracking-tight">Clocked In</p>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 w-full">
                          {attendanceToday.check_in && (
                            <div className="text-center p-1.5 bg-white/80 backdrop-blur-sm rounded-lg border border-green-100 shadow-sm">
                              <p className="text-[8px] text-muted-foreground leading-none">In</p>
                              <p className="text-xs font-bold text-green-600 mt-0.5">{format(new Date(attendanceToday.check_in), 'hh:mm a')}</p>
                            </div>
                          )}
                          {attendanceToday.check_out && (
                            <div className="text-center p-1.5 bg-white/80 backdrop-blur-sm rounded-lg border border-red-100 shadow-sm">
                              <p className="text-[8px] text-muted-foreground leading-none">Out</p>
                              <p className="text-xs font-bold text-red-600 mt-0.5">{format(new Date(attendanceToday.check_out), 'hh:mm a')}</p>
                            </div>
                          )}
                        </div>
                        {!attendanceToday.check_out && (
                          settings?.allow_self_clock_in ? (
                            <Button variant="destructive" size="sm" className="w-full h-8 text-[10px] font-bold shadow-sm hover:shadow-md transition-all uppercase" onClick={() => markAttendanceMutation.mutate({ date: format(new Date(), 'yyyy-MM-dd'), check_out: new Date().toISOString() })} disabled={markAttendanceMutation.isPending}>
                              <Clock className="w-3 h-3 mr-1" />
                              {markAttendanceMutation.isPending ? 'Processing' : 'Clock Out'}
                            </Button>
                          ) : (
                            <div className="p-1 px-2 bg-amber-50 border border-amber-100 rounded text-amber-700 text-[8px] text-center font-bold uppercase">
                              Clock-out disabled
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 w-full">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Not Clocked In</p>
                        </div>
                        {settings?.allow_self_clock_in ? (
                          <Button size="sm" className="w-full h-8 text-[10px] font-bold shadow-sm hover:shadow-md transition-all uppercase" onClick={() => markAttendanceMutation.mutate({ status: 'present', date: format(new Date(), 'yyyy-MM-dd'), check_in: new Date().toISOString() })} disabled={markAttendanceMutation.isPending}>
                            <UserCheck className="w-3.5 h-3.5 mr-1" />
                            {markAttendanceMutation.isPending ? 'Working...' : 'Clock In'}
                          </Button>
                        ) : (
                          <div className="p-1.5 bg-muted border rounded text-muted-foreground text-[8px] font-bold uppercase text-center w-full">
                            Clock-in disabled
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-sm transition-shadow"><CardContent className="p-3 flex flex-col items-center justify-center min-h-[85px] text-center"><div className="flex flex-col items-center gap-1"><div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0"><CalendarCheck className="w-5 h-5 text-green-600" /></div><div><p className="text-xl sm:text-2xl font-bold text-green-600 leading-none">{myPresentDays}</p><p className="text-[9px] uppercase font-bold tracking-tight text-muted-foreground mt-1">Present Days</p></div></div></CardContent></Card>
              <Card className="hover:shadow-sm transition-shadow"><CardContent className="p-3 flex flex-col items-center justify-center min-h-[85px] text-center"><div className="flex flex-col items-center gap-1"><div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0"><XIcon className="w-5 h-5 text-destructive" /></div><div><p className="text-xl sm:text-2xl font-bold text-destructive leading-none">{myAbsentDays}</p><p className="text-[9px] uppercase font-bold tracking-tight text-muted-foreground mt-1">Absent Days</p></div></div></CardContent></Card>
              <Card className="hover:shadow-sm transition-shadow"><CardContent className="p-3 flex flex-col items-center justify-center min-h-[85px] text-center"><div className="flex flex-col items-center gap-1"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><TrendingUp className="w-5 h-5 text-primary" /></div><div><p className="text-xl sm:text-2xl font-bold leading-none">{Math.round((myPresentDays / (myPresentDays + myAbsentDays || 1)) * 100)}%</p><p className="text-[9px] uppercase font-bold tracking-tight text-muted-foreground mt-1">Attendance Rate</p></div></div></CardContent></Card>
            </>
          )}
        </div>

        {/* Today's Attendance - HR Only - Fixed Height with Scroll */}
        {activeTab === 'team' && (
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
                            {empAttendance.check_in && <p className="text-muted-foreground">In: <span className="font-semibold text-green-600">{format(new Date(empAttendance.check_in), 'hh:mm a')}</span></p>}
                            {empAttendance.check_out && <p className="text-muted-foreground">Out: <span className="font-semibold text-red-600">{format(new Date(empAttendance.check_out), 'hh:mm a')}</span></p>}
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
            {activeTab === 'personal' && (
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
                      activeTab === 'team' && 'cursor-pointer hover:border-primary hover:shadow-md',
                      isWeekendDay && 'bg-blue-50/50 border-blue-200',
                      holiday && 'bg-pink-50 border-pink-200',
                      isTodayDate && 'ring-2 ring-primary ring-offset-1',
                      activeTab === 'personal' && statusInfo && statusInfo.color.includes('bg-') && statusInfo.color.split(' ')[1]
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
                    {activeTab === 'personal' && (
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
                                {format(new Date(userLog.check_in), 'hh:mm a')} - {userLog.check_out ? format(new Date(userLog.check_out), 'hh:mm a') : ''}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* HR View - Present Count */}
                    {activeTab === 'team' && (
                      <div className="flex-1 flex flex-col items-center justify-center gap-1">
                        {holiday ? (
                          <span className="text-[10px] font-semibold text-pink-600 truncate max-w-full px-1">{holiday.name}</span>
                        ) : (
                          <div className="flex items-center gap-0.5 text-[11px]">
                            <span className="text-green-600 font-bold" title="Present">{dayLogs.filter((l: any) => l.status === 'present' || l.status === 'half_day').length}</span>
                            <span className="text-muted-foreground/30 font-light">:</span>
                            <span className="text-blue-600 font-bold" title="Leave">{dayLogs.filter((l: any) => l.status === 'on_leave').length}</span>
                            <span className="text-muted-foreground/30 font-light">:</span>
                            <span className="text-red-600 font-bold" title="Absent">
                              {(() => {
                                const p = dayLogs.filter((l: any) => l.status === 'present' || l.status === 'half_day').length;
                                const l = dayLogs.filter((l: any) => l.status === 'on_leave').length;
                                const loggedAbsent = dayLogs.filter((l: any) => l.status === 'absent').length;
                                // If it's a workday in the past or today, calculate total absent
                                if (!isWeekendDay && !holiday && (isPastDate || isTodayDate)) {
                                  return Math.max(loggedAbsent, (employees?.length || 0) - p - l);
                                }
                                return loggedAbsent;
                              })()}
                            </span>
                          </div>
                        )}
                        {!holiday && isWeekendDay && (
                          <span className="text-[9px] font-medium text-slate-400">Weekend</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend for HR */}
            {activeTab === 'team' && (
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
                          {empLog.check_in && <p className="text-muted-foreground">In: <span className="font-semibold text-green-600">{format(new Date(empLog.check_in), 'hh:mm:ss a')}</span></p>}
                          {empLog.check_out && <p className="text-muted-foreground">Out: <span className="font-semibold text-red-600">{format(new Date(empLog.check_out), 'hh:mm:ss a')}</span></p>}
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
        {/* Regularization Modal */}
        <RegularizationModal
          open={isRegularizationModalOpen}
          onOpenChange={setIsRegularizationModalOpen}
          onSave={(data) => requestRegularizationMutation.mutate(data)}
          isSaving={requestRegularizationMutation.isPending}
        />
      </div>
    </MainLayout>
  );
}
