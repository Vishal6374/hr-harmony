import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, MessageSquare, Lock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complaintService } from '@/services/apiService';
import { toast } from 'sonner';
import { PageLoader } from '@/components/ui/page-loader';
import Loader from '@/components/ui/Loader';

export default function Complaints() {
  const { isHR, user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRespondDialogOpen, setIsRespondDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);

  // Form Data
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    is_anonymous: false
  });
  const [response, setResponse] = useState('');
  const [newStatus, setNewStatus] = useState('in_progress');

  const queryClient = useQueryClient();

  // Fetch Complaints
  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['complaints', statusFilter],
    queryFn: async () => {
      const { data } = await complaintService.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      return data;
    },
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: complaintService.submit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      setIsDialogOpen(false);
      toast.success('Complaint submitted successfully');
      resetForm();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to submit complaint'),
  });

  // Respond Mutation
  const respondMutation = useMutation({
    mutationFn: ({ id, response, status }: any) => complaintService.respond(id, response, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      setIsRespondDialogOpen(false);
      toast.success('Response submitted successfully');
      setResponse('');
      setSelectedComplaint(null);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to submit response'),
  });

  // Close Mutation
  const closeMutation = useMutation({
    mutationFn: (id: string) => complaintService.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      toast.success('Complaint closed');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to close complaint'),
  });

  const resetForm = () => {
    setFormData({ subject: '', description: '', priority: 'medium', is_anonymous: false });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openRespondDialog = (complaint: any) => {
    setSelectedComplaint(complaint);
    setResponse('');
    setNewStatus(complaint.status === 'pending' ? 'in_progress' : complaint.status);
    setIsRespondDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const hrColumns: Column<any>[] = [
    {
      key: 'subject',
      header: 'Subject',
      cell: (comp) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${comp.priority === 'high' ? 'bg-destructive/10 text-destructive' :
            comp.priority === 'medium' ? 'bg-warning/10 text-warning' : 'bg-info/10 text-info'
            }`}>
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium">{comp.subject}</p>
            {comp.is_anonymous ? (
              <div className="flex items-center text-xs text-muted-foreground">
                <Lock className="w-3 h-3 mr-1" /> Anonymous
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">by {comp.employee?.name}</p>
            )}
          </div>
        </div>
      ),
    },
    { key: 'priority', header: 'Priority', cell: (comp) => <span className="capitalize">{comp.priority}</span> },
    { key: 'date', header: 'Date', cell: (comp) => <span className="text-sm text-muted-foreground">{format(new Date(comp.created_at), 'MMM d, yyyy')}</span> },
    { key: 'status', header: 'Status', cell: (comp) => <StatusBadge status={comp.status} /> },
    {
      key: 'actions',
      header: '',
      cell: (comp) => (
        <div className="flex items-center gap-1">
          {comp.status !== 'closed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openRespondDialog(comp)}
            >
              Respond
            </Button>
          )}
        </div>
      ),
    },
  ];

  const employeeColumns: Column<any>[] = [
    {
      key: 'subject',
      header: 'Subject',
      cell: (comp) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{comp.subject}</p>
            {comp.is_anonymous && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Lock className="w-3 h-3 mr-1" /> Anonymous
              </div>
            )}
          </div>
        </div>
      ),
    },
    { key: 'priority', header: 'Priority', cell: (comp) => <span className="capitalize">{comp.priority}</span> },
    { key: 'date', header: 'Date', cell: (comp) => <span className="text-sm text-muted-foreground">{format(new Date(comp.created_at), 'MMM d, yyyy')}</span> },
    { key: 'status', header: 'Status', cell: (comp) => <StatusBadge status={comp.status} /> },
    {
      key: 'response',
      header: 'Response',
      cell: (comp) => comp.response ? (
        <p className="text-sm text-muted-foreground truncate max-w-[200px]">{comp.response}</p>
      ) : (
        <span className="text-xs text-muted-foreground italic">No response yet</span>
      )
    },
  ];

  if (isLoading) {
    return <PageLoader />;
  }

  const myComplaints = complaints.filter((c: any) => c.is_anonymous || c.employee_id === user?.id);

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <PageHeader title="Complaints" description={isHR ? 'Manage employee complaints and grievances' : 'Submit anonymous or identified complaints'}>
          {!isHR && (
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              New Complaint
            </Button>
          )}
        </PageHeader>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-sm text-muted-foreground">Total Complaints</p>
            <p className="text-xl sm:text-2xl font-bold">{isHR ? complaints.length : myComplaints.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-xl sm:text-2xl font-bold">
              {isHR
                ? complaints.filter((c: any) => c.status === 'pending').length
                : myComplaints.filter((c: any) => c.status === 'pending').length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-sm text-muted-foreground">High Priority</p>
            <p className="text-xl sm:text-2xl font-bold">
              {isHR
                ? complaints.filter((c: any) => c.priority === 'high').length
                : myComplaints.filter((c: any) => c.priority === 'high').length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={isHR ? hrColumns : employeeColumns}
          data={isHR ? complaints : myComplaints}
          keyExtractor={(comp) => comp.id}
          emptyMessage="No complaints found"
        />

        {/* Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Complaint</DialogTitle>
              <DialogDescription>Submit your grievance securely.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Summarize the issue"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the complaint..."
                  required
                  rows={4}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymous"
                  checked={formData.is_anonymous}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_anonymous: !!checked })}
                />
                <Label htmlFor="anonymous" className="text-sm font-normal">
                  Submit anonymously (Your name will be hidden from HR)
                </Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader size="small" variant="white" className="mr-2" />}
                  Submit Complaint
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Respond Dialog */}
        <Dialog open={isRespondDialogOpen} onOpenChange={setIsRespondDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Respond to Complaint</DialogTitle>
              <DialogDescription>Provide a response or update status.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Update Status</Label>
                <Select
                  value={newStatus}
                  onValueChange={setNewStatus}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="response">Response</Label>
                <Textarea
                  id="response"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Write your response..."
                  required
                  rows={4}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsRespondDialogOpen(false)}>Cancel</Button>
                <Button
                  type="button"
                  onClick={() => selectedComplaint && respondMutation.mutate({ id: selectedComplaint.id, response, status: newStatus })}
                  disabled={!response || respondMutation.isPending}
                >
                  {respondMutation.isPending && <Loader size="small" variant="white" className="mr-2" />}
                  Submit Response
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
