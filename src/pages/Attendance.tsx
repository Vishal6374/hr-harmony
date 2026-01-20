import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { attendanceLogs, employees, getEmployeeAttendance } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Search, CalendarCheck, Clock, UserCheck, UserX } from 'lucide-react';
import { format, isSameDay, eachDayOfInterval, startOfMonth, endOfMonth, isWeekend } from 'date-fns';
import { cn } from '@/lib/utils';

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
  const todayAttendance = attendanceLogs.filter((log) => isSameDay(new Date(log.date), today));
  const presentToday = todayAttendance.filter((log) => log.status === 'present').length;
  const absentToday = todayAttendance.filter((log) => log.status === 'absent').length;

  const myAttendance = getEmployeeAttendance(user?.id || '');
  const myMonthlyAttendance = myAttendance.filter((a) => {
    const date = new Date(a.date);
    return date.getMonth() === month - 1 && date.getFullYear() === year;
  });
  const myPresentDays = myMonthlyAttendance.filter((a) => a.status === 'present').length;
  const myAbsentDays = myMonthlyAttendance.filter((a) => a.status === 'absent').length;

  const getAttendanceForDate = (employeeId: string, date: Date) => {
    return attendanceLogs.find(
      (log) => log.employeeId === employeeId && isSameDay(new Date(log.date), date)
    );
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'present': return 'bg-success text-success-foreground';
      case 'absent': return 'bg-destructive text-destructive-foreground';
      case 'half_day': return 'bg-warning text-warning-foreground';
      case 'on_leave': return 'bg-info text-info-foreground';
      default: return 'bg-muted text-muted-foreground';
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
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-success" />
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
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
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
                    <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                      <CalendarCheck className="w-5 h-5 text-info" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{employees.filter(e => e.status === 'on_leave').length}</p>
                      <p className="text-xs text-muted-foreground">On Leave</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
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
              <Card>
                <CardContent className="pt-4">
                  <p className="text-2xl font-bold">{format(new Date(), 'HH:mm')}</p>
                  <p className="text-xs text-muted-foreground">Current Time</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

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
                return (
                  <div
                    key={date.toISOString()}
                    className={cn(
                      'aspect-square p-1 border rounded-lg flex flex-col items-center justify-center',
                      isWeekend(date) && 'bg-muted/50',
                      isSameDay(date, today) && 'ring-2 ring-primary'
                    )}
                  >
                    <span className="text-xs font-medium">{format(date, 'd')}</span>
                    {attendance && (
                      <div className={cn('w-2 h-2 rounded-full mt-1', getStatusColor(attendance.status))} />
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
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
