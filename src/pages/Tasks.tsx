import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskLogService } from '@/services/apiService';
import { toast } from 'sonner';
import { Plus, ClipboardList, Clock, Calendar, Search, Filter, MoreVertical, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import Loader from '@/components/ui/Loader';

export default function Tasks() {
    const { user, isHR } = useAuth();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [taskData, setTaskData] = useState({
        task_name: '',
        description: '',
        hours_spent: '',
        status: 'completed',
        date: format(new Date(), 'yyyy-MM-dd'),
    });

    const queryClient = useQueryClient();

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['tasks', selectedDate, isHR],
        queryFn: async () => {
            if (isHR) {
                const { data } = await taskLogService.getAllTasks({ date: selectedDate });
                return data;
            } else {
                const { data } = await taskLogService.getMyTasks({ date: selectedDate });
                return data;
            }
        },
    });

    const addTaskMutation = useMutation({
        mutationFn: taskLogService.logTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setIsAddDialogOpen(false);
            setTaskData({
                task_name: '',
                description: '',
                hours_spent: '',
                status: 'completed',
                date: format(new Date(), 'yyyy-MM-dd'),
            });
            toast.success('Task logged successfully');
        },
        onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to log task'),
    });

    const deleteTaskMutation = useMutation({
        mutationFn: taskLogService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success('Task deleted');
        },
    });

    const columns: Column<any>[] = [
        {
            key: 'task_name',
            header: 'Task Name',
            cell: (task) => (
                <div className="flex flex-col">
                    <span className="font-medium">{task.task_name}</span>
                    {isHR && task.employee && (
                        <span className="text-xs text-muted-foreground">{task.employee.name}</span>
                    )}
                </div>
            ),
        },
        {
            key: 'description',
            header: 'Description',
            cell: (task) => <span className="text-sm text-muted-foreground line-clamp-1">{task.description}</span>,
        },
        {
            key: 'hours_spent',
            header: 'Hours',
            cell: (task) => (
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{task.hours_spent}h</span>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (task) => <StatusBadge status={task.status} />,
        },
        {
            key: 'actions',
            header: '',
            cell: (task) => !isHR && (
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => deleteTaskMutation.mutate(task.id)}>
                    <Trash2 className="w-4 h-4" />
                </Button>
            ),
        },
    ];

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <PageHeader
                    title="Daily Task Management"
                    description={isHR ? "Monitor daily activities and productivity across the organization." : "Log and track your daily work activities."}
                >
                    {!isHR && (
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="shadow-lg shadow-primary/20">
                                    <Plus className="w-4 h-4 mr-2" /> Log Task
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Log Daily Task</DialogTitle>
                                    <DialogDescription>
                                        Record your work activity for better tracking and productivity.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Task Title*</Label>
                                        <Input
                                            placeholder="e.g. Bug Fixing on Login Page"
                                            value={taskData.task_name}
                                            onChange={e => setTaskData({ ...taskData, task_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Date</Label>
                                            <Input
                                                type="date"
                                                value={taskData.date}
                                                onChange={e => setTaskData({ ...taskData, date: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Hours Spent</Label>
                                            <Input
                                                type="number"
                                                step="0.5"
                                                placeholder="e.g. 2.5"
                                                value={taskData.hours_spent}
                                                onChange={e => setTaskData({ ...taskData, hours_spent: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Task Description*</Label>
                                        <Textarea
                                            placeholder="Details of the work performed..."
                                            rows={4}
                                            value={taskData.description}
                                            onChange={e => setTaskData({ ...taskData, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                    <Button
                                        onClick={() => addTaskMutation.mutate(taskData)}
                                        disabled={addTaskMutation.isPending || !taskData.task_name || !taskData.description}
                                    >
                                        {addTaskMutation.isPending && <Loader size="small" variant="white" className="mr-2" />}
                                        Save Task
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </PageHeader>

                <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between bg-card p-4 rounded-2xl border shadow-sm">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative group">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <Input
                                type="date"
                                className="pl-9 w-[200px] border-none bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                            />
                        </div>
                        <div className="hidden sm:block h-6 w-px bg-border" />
                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            {format(new Date(selectedDate), 'EEEE, MMMM dd')}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Total Hours: {tasks.reduce((acc: number, t: any) => acc + Number(t.hours_spent), 0)}h
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={tasks}
                    keyExtractor={(t) => t.id}
                    emptyMessage={`No tasks logged for ${format(new Date(selectedDate), 'MMM dd')}.`}
                />
            </div>
        </MainLayout>
    );
}
