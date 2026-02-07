import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingService, employeeService } from '@/services/apiService';
import { toast } from 'sonner';
import { Calendar, Clock, Video, MapPin, Users, Plus, ExternalLink, CalendarDays, MoreVertical, Trash2, History as HistoryIcon } from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';
import Loader from '@/components/ui/Loader';
import { Card, CardContent } from '@/components/ui/card';

export default function Meetings() {
    const { user, isHR } = useAuth();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [meetingData, setMeetingData] = useState({
        title: '',
        description: '',
        type: 'virtual',
        meeting_url: '',
        location: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '10:00',
        end_time: '11:00',
        attendees: [] as string[],
    });

    const queryClient = useQueryClient();

    const { data: meetings = [], isLoading } = useQuery({
        queryKey: ['meetings', isHR],
        queryFn: async () => {
            const { data } = isHR ? await meetingService.getAllMeetings() : await meetingService.getMyMeetings();
            return data;
        },
    });

    const { data: employeesData } = useQuery({
        queryKey: ['employees-for-meetings'],
        queryFn: async () => (await employeeService.getAll({ status: 'active' })).data,
        enabled: isHR,
    });
    const employees = employeesData?.employees || [];

    const createMeetingMutation = useMutation({
        mutationFn: meetingService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            setIsCreateDialogOpen(false);
            setMeetingData({
                title: '',
                description: '',
                type: 'virtual',
                meeting_url: '',
                location: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                start_time: '10:00',
                end_time: '11:00',
                attendees: [],
            });
            toast.success('Meeting scheduled successfully');
        },
        onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to schedule meeting'),
    });

    const deleteMeetingMutation = useMutation({
        mutationFn: meetingService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            toast.success('Meeting cancelled');
        },
    });

    const upcomingMeetings = meetings.filter((m: any) => isAfter(new Date(`${m.date} ${m.start_time}`), new Date()));
    const pastMeetings = meetings.filter((m: any) => isBefore(new Date(`${m.date} ${m.start_time}`), new Date()));

    const formatTime12h = (time: string) => {
        if (!time) return '';
        try {
            const [hours, minutes] = time.split(':');
            const h = parseInt(hours, 10);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${h12}:${minutes} ${ampm}`;
        } catch (e) {
            return time;
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <PageHeader
                    title="Meetings & Schedules"
                    description="Keep track of your upcoming virtual and physical meetings."
                >
                    {isHR && (
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="shadow-lg shadow-primary/20">
                                    <Plus className="w-4 h-4 mr-2" /> Schedule Meeting
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>Schedule New Meeting</DialogTitle>
                                    <DialogDescription>
                                        Fill in the details to schedule a meeting with team members.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                                    <div className="space-y-2">
                                        <Label>Meeting Title*</Label>
                                        <Input
                                            placeholder="e.g. Quarterly Business Review"
                                            value={meetingData.title}
                                            onChange={e => setMeetingData({ ...meetingData, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Type</Label>
                                            <Select value={meetingData.type} onValueChange={val => setMeetingData({ ...meetingData, type: val as any })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="virtual">Virtual</SelectItem>
                                                    <SelectItem value="physical">Physical</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Date</Label>
                                            <Input
                                                type="date"
                                                value={meetingData.date}
                                                onChange={e => setMeetingData({ ...meetingData, date: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Start Time</Label>
                                            <Input
                                                type="time"
                                                value={meetingData.start_time}
                                                onChange={e => setMeetingData({ ...meetingData, start_time: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End Time</Label>
                                            <Input
                                                type="time"
                                                value={meetingData.end_time}
                                                onChange={e => setMeetingData({ ...meetingData, end_time: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    {meetingData.type === 'virtual' ? (
                                        <div className="space-y-2">
                                            <Label>Meeting URL</Label>
                                            <Input
                                                placeholder="https://meet.google.com/..."
                                                value={meetingData.meeting_url}
                                                onChange={e => setMeetingData({ ...meetingData, meeting_url: e.target.value })}
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label>Location</Label>
                                            <Input
                                                placeholder="Conference Room A, 2nd Floor"
                                                value={meetingData.location}
                                                onChange={e => setMeetingData({ ...meetingData, location: e.target.value })}
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            placeholder="Meeting agenda and notes..."
                                            value={meetingData.description}
                                            onChange={e => setMeetingData({ ...meetingData, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Attendees</Label>
                                        <div className="p-3 bg-muted/40 rounded-xl border space-y-2 max-h-[150px] overflow-y-auto">
                                            {employees.map((emp: any) => (
                                                <div key={emp.id} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`emp-${emp.id}`}
                                                        checked={meetingData.attendees.includes(emp.id)}
                                                        onChange={(e) => {
                                                            const newAttendees = e.target.checked
                                                                ? [...meetingData.attendees, emp.id]
                                                                : meetingData.attendees.filter(id => id !== emp.id);
                                                            setMeetingData({ ...meetingData, attendees: newAttendees });
                                                        }}
                                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                    />
                                                    <label htmlFor={`emp-${emp.id}`} className="text-sm cursor-pointer">{emp.name}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                                    <Button
                                        onClick={() => createMeetingMutation.mutate(meetingData)}
                                        disabled={createMeetingMutation.isPending || !meetingData.title}
                                    >
                                        {createMeetingMutation.isPending && <Loader size="small" variant="white" className="mr-2" />}
                                        Schedule
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </PageHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Upcoming Meetings Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 border-b pb-2 px-1">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <CalendarDays className="w-5 h-5 text-primary" />
                                Upcoming Meetings
                            </h2>
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary">
                                {upcomingMeetings.length}
                            </span>
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center p-20"><Loader /></div>
                        ) : upcomingMeetings.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[600px] pr-2 no-scrollbar">
                                {upcomingMeetings.map((meeting: any) => (
                                    <Card key={meeting.id} className="overflow-hidden border shadow-sm hover:shadow-md transition-all group">
                                        <CardContent className="p-0">
                                            <div className="flex">
                                                <div className={cn(
                                                    "w-1.5",
                                                    meeting.type === 'virtual' ? "bg-blue-500" : "bg-orange-500"
                                                )} />
                                                <div className="flex-1 p-5 space-y-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={cn(
                                                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                                                    meeting.type === 'virtual' ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                                                                )}>
                                                                    {meeting.type}
                                                                </span>
                                                                <span className="text-sm font-medium text-muted-foreground">
                                                                    {format(new Date(meeting.date), 'MMM dd, yyyy')}
                                                                </span>
                                                            </div>
                                                            <h3 className="text-base font-bold group-hover:text-primary transition-colors">{meeting.title}</h3>
                                                        </div>
                                                        {(isHR || meeting.created_by === user?.id) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-muted-foreground hover:text-destructive h-8 w-8"
                                                                onClick={() => deleteMeetingMutation.mutate(meeting.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-2">{meeting.description}</p>
                                                    <div className="flex flex-wrap items-center gap-4 pt-1">
                                                        <div className="flex items-center gap-1.5 text-xs font-medium">
                                                            <Clock className="w-3.5 h-3.5 text-primary" />
                                                            {formatTime12h(meeting.start_time)}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs font-medium">
                                                            {meeting.type === 'virtual' ? (
                                                                <><Video className="w-3.5 h-3.5 text-blue-500" /> Virtual</>
                                                            ) : (
                                                                <><MapPin className="w-3.5 h-3.5 text-orange-500" /> {meeting.location}</>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {meeting.type === 'virtual' && meeting.meeting_url && (
                                                        <div className="pt-1">
                                                            <Button asChild className="w-full h-8 text-[11px]" size="sm">
                                                                <a href={meeting.meeting_url} target="_blank" rel="noopener noreferrer">
                                                                    <ExternalLink className="w-3.5 h-3.5 mr-2" /> Join Now
                                                                </a>
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 bg-muted/20 border-2 border-dashed rounded-2xl text-center">
                                <Video className="w-10 h-10 text-muted-foreground mb-4 opacity-20" />
                                <h3 className="text-lg font-semibold">No upcoming meetings</h3>
                                <p className="text-sm text-muted-foreground max-w-[250px]">Your schedule looks clear for now.</p>
                            </div>
                        )}
                    </div>

                    {/* Past History Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 border-b pb-2 px-1">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <HistoryIcon className="w-5 h-5 text-muted-foreground" />
                                Past History
                            </h2>
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-muted text-muted-foreground">
                                {pastMeetings.length}
                            </span>
                        </div>

                        <div className="bg-card rounded-2xl border shadow-sm h-full max-h-[600px] overflow-hidden flex flex-col">
                            <div className="p-4 space-y-4 overflow-y-auto no-scrollbar flex-1">
                                {pastMeetings.length > 0 ? (
                                    pastMeetings.map((meeting: any) => (
                                        <div key={meeting.id} className="flex gap-3 p-3 rounded-xl border border-transparent hover:border-border hover:bg-muted/30 transition-all opacity-70">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                                <Calendar className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <p className="text-sm font-bold truncate">{meeting.title}</p>
                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{format(new Date(meeting.date), 'MMM dd')}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3" /> {formatTime12h(meeting.start_time)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <HistoryIcon className="w-10 h-10 text-muted-foreground mb-4 opacity-10" />
                                        <p className="text-sm text-muted-foreground">No past meetings recorded.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
