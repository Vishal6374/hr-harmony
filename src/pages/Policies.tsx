import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, FileText, Eye, Download, Pencil, Trash2, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { policyService } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PageLoader } from '@/components/ui/page-loader';
import Loader from '@/components/ui/Loader';

export default function Policies() {
  const { isHR } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    version: '1.0',
    effective_date: new Date().toISOString().split('T')[0],
    document_url: '',
    is_active: true
  });

  const queryClient = useQueryClient();

  // Fetch Policies
  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['policies', categoryFilter],
    queryFn: async () => {
      const { data } = await policyService.getAll({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      });
      return data;
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: policyService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      setIsDialogOpen(false);
      toast.success('Policy created successfully');
      resetForm();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to create policy'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => policyService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      setIsDialogOpen(false);
      toast.success('Policy updated successfully');
      resetForm();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update policy'),
  });

  const deleteMutation = useMutation({
    mutationFn: policyService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast.success('Policy deleted successfully');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to delete policy'),
  });

  const resetForm = () => {
    setSelectedPolicy(null);
    setFormData({
      title: '',
      description: '',
      category: 'General',
      version: '1.0',
      effective_date: new Date().toISOString().split('T')[0],
      document_url: '',
      is_active: true
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (policy: any) => {
    setSelectedPolicy(policy);
    setFormData({
      title: policy.title,
      description: policy.description || '',
      category: policy.category,
      version: policy.version,
      effective_date: policy.effective_date.split('T')[0],
      document_url: policy.document_url || '',
      is_active: policy.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPolicy) {
      updateMutation.mutate({ id: selectedPolicy.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredPolicies = policies.filter((policy: any) =>
    policy.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: Column<any>[] = [
    {
      key: 'title',
      header: 'Policy',
      cell: (policy) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{policy.title}</p>
            <p className="text-xs text-muted-foreground">Version {policy.version}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (policy) => <span className="text-sm">{policy.category}</span>,
    },
    {
      key: 'effective_date',
      header: 'Effective Date',
      cell: (policy) => {
        if (!policy.effective_date) return <span className="text-sm text-muted-foreground">-</span>;
        try {
          return (
            <span className="text-sm text-muted-foreground">
              {format(new Date(policy.effective_date), 'MMM d, yyyy')}
            </span>
          );
        } catch {
          return <span className="text-sm text-muted-foreground">-</span>;
        }
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (policy) => <StatusBadge status={policy.is_active ? 'active' : 'inactive'} />,
    },
    {
      key: 'actions',
      header: '',
      cell: (policy) => (
        <div className="flex items-center gap-1">
          {policy.document_url && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(policy.document_url, '_blank')}>
              <Download className="w-4 h-4" />
            </Button>
          )}
          {isHR && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(policy)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDelete(policy.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      ),
      className: 'w-[120px]',
    },
  ];

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <PageHeader title="Company Policies" description="View and manage company policies">
          {isHR && (
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Policy
            </Button>
          )}
        </PageHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-sm text-muted-foreground">Total Policies</p>
            <p className="text-xl sm:text-2xl font-bold">{policies.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-xl sm:text-2xl font-bold">{policies.filter((p: any) => p.is_active).length}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-sm text-muted-foreground">Categories</p>
            <p className="text-xl sm:text-2xl font-bold">{new Set(policies.map((p: any) => p.category)).size}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="relative w-full sm:flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="General">General</SelectItem>
              <SelectItem value="IT">IT</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={filteredPolicies}
          keyExtractor={(policy) => policy.id}
          emptyMessage="No policies found"
        />

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedPolicy ? 'Edit Policy' : 'Add Policy'}</DialogTitle>
              <DialogDescription>
                {selectedPolicy ? 'Update policy details.' : 'Upload and publish a new policy.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Policy Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Employee Handbook"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="1.0"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="effective_date">Effective Date</Label>
                <Input
                  id="effective_date"
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document_url">Document URL</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="document_url"
                    value={formData.document_url}
                    onChange={(e) => setFormData({ ...formData, document_url: e.target.value })}
                    placeholder="https://..."
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the policy..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onValueChange={(value) => setFormData({ ...formData, is_active: value === 'active' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader size="small" variant="white" className="mr-2" />
                  ) : null}
                  {selectedPolicy ? 'Update' : 'Publish'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the policy and remove it from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
