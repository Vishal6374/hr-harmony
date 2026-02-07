import { useState, useEffect, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService, employeeDocumentService, resignationService } from '@/services/apiService';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Briefcase,
  DollarSign,
  Upload,
  FileText,
  Save,
  Pencil,
  Download,
  Trash2,
  Eye,
  LogOut,
  Clock,
  CheckCircle2,
  X,
  Info,
  ExternalLink,
  CameraOff
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from 'date-fns';
import { PageLoader } from '@/components/ui/page-loader';
import Loader from '@/components/ui/Loader';

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    education: '',
    aadhaar_number: '',
    pan_number: '',
    custom_fields: {} as any,
  });
  const [uploadData, setUploadData] = useState({
    documentType: '',
    fileName: '',
    file: null as File | null,
  });
  const [resignationData, setResignationData] = useState({
    reason: '',
    preferredLastWorkingDay: '',
  });

  const { data: employee, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await employeeService.getById(user?.id as string);
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: myResignations = [] } = useQuery({
    queryKey: ['my-resignations'],
    queryFn: async () => (await resignationService.getRequests()).data,
    enabled: !!user?.id,
  });

  const latestResignation = myResignations[0];
  const hasActiveResignation = latestResignation && (latestResignation.status === 'pending' || latestResignation.status === 'approved');

  // Calculate lock status - Disable edit 48 hours after joining date for employees
  const joiningDate = employee?.date_of_joining ? new Date(employee.date_of_joining) : new Date();
  const hoursSinceJoining = (new Date().getTime() - joiningDate.getTime()) / (1000 * 60 * 60);
  const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr';
  const isAdmin=user?.role === 'admin';
  const isTimeLocked = (user?.role === 'employee') && (hoursSinceJoining > 48);
  const isLocked = !isAdminOrHR && (employee?.onboarding_status === 'locked' || isTimeLocked);

  useEffect(() => {
    if (employee) {
      setFormData({
        phone: employee.phone || '',
        address: employee.address || '',
        education: employee.education || '',
        aadhaar_number: employee.aadhaar_number || '',
        pan_number: employee.pan_number || '',
        custom_fields: typeof employee.custom_fields === 'string'
          ? JSON.parse(employee.custom_fields)
          : (employee.custom_fields || {}),
      });
    }
  }, [employee]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => employeeService.update(user?.id as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  });

  const uploadMutation = useMutation({
    mutationFn: (data: any) => {
      if (!uploadData.file) throw new Error('No file selected');
      return employeeDocumentService.uploadDocument(user?.id as string, uploadData.file, uploadData.documentType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', user?.id] });
      toast.success('Document uploaded successfully');
      setIsUploadDialogOpen(false);
      setUploadData({ documentType: '', fileName: '', file: null });
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload document');
    }
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', user?.id],
    queryFn: async () => {
      const { data } = await employeeDocumentService.getDocuments(user?.id as string);
      return data;
    },
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => employeeDocumentService.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', user?.id] });
      toast.success('Document deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedDocument(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete document');
    }
  });

  const resignMutation = useMutation({
    mutationFn: (data: any) => resignationService.apply(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-resignations'] });
      toast.success('Resignation request submitted');
      setResignationData({ reason: '', preferredLastWorkingDay: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit resignation');
    }
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const getBackendUrl = (fileUrl: string): string => {
    // If already a full URL, use it as-is
    if (fileUrl.startsWith('http')) {
      return fileUrl;
    }
    // Extract base URL from API URL (remove /api suffix)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const baseUrl = apiUrl.replace('/api', '');
    return `${baseUrl}${fileUrl}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadData({
        documentType: uploadData.documentType,
        fileName: file.name,
        file: file,
      });
    }
  };

  const handleUploadDocument = () => {
    if (!uploadData.documentType || !uploadData.file) {
      toast.error('Please select document type and file');
      return;
    }
    uploadMutation.mutate({});
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!employee) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <p>Employee not found</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <PageHeader title="My Profile" description="View and manage your personal information" />

        {/* Profile Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                  <AvatarImage src={employee.avatar_url} alt={employee.name} />
                  <AvatarFallback className="text-2xl">{employee.name?.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 sm:gap-0 w-full sm:w-auto">
                  <div>
                    <h2 className="text-2xl font-bold">{employee.name}</h2>
                    <p className="text-muted-foreground">{employee.designation?.name}</p>
                    <p className="text-sm text-muted-foreground">{employee.department?.name}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={employee.status} />
                    <StatusBadge status={employee.onboarding_status} />
                    <span className="text-sm text-muted-foreground px-2 py-1 bg-muted rounded-md">
                      {employee.employee_id}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 w-full">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {employee.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {employee.phone || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Joined {employee.date_of_joining ? format(new Date(employee.date_of_joining), 'MMMM yyyy') : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="exit">Resignations</TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Personal Information</CardTitle>
                {!isEditing ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="inline-block">
                          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} disabled={isLocked}>
                            {isLocked && <Clock className="w-4 h-4 mr-2" />}
                            {isLocked ? 'Profile Locked' : 'Edit'}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {isLocked && (
                        <TooltipContent>
                          <p>Contact HR for changes</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                      {updateMutation.isPending && <Loader size="small" variant="white" className="mr-1" />}
                      {!updateMutation.isPending && <Save className="w-4 h-4 mr-1" />}
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      Full Name
                    </Label>
                    <Input value={employee.name} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Contact HR to change your name</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      Email
                    </Label>
                    <Input value={employee.email} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Contact IT to change your email</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      Phone Number
                    </Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-muted' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      Date of Birth
                    </Label>
                    <Input
                      value={employee.date_of_birth ? format(new Date(employee.date_of_birth), 'yyyy-MM-dd') : ''}
                      type="date"
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      Education
                    </Label>
                    <Input
                      value={formData.education}
                      onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-muted' : ''}
                      placeholder="Highest Degree"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      Aadhaar Number
                    </Label>
                    <Input
                      value={formData.aadhaar_number}
                      onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-muted' : ''}
                      placeholder="12-digit number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      PAN Number
                    </Label>
                    <Input
                      value={formData.pan_number}
                      onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-muted' : ''}
                      placeholder="ABCDE1234F"
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Address
                  </Label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-muted' : ''}
                    rows={2}
                  />
                </div>

                {/* Custom Fields in Profile */}
                {Object.keys(formData.custom_fields || {}).length > 0 && (
                  <>
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        <Label className="text-sm font-bold">Additional Information</Label>
                      </div>

                      {/* Explicit Field for Experience Letter */}
                      <div className="space-y-2 group">
                        <Label className="text-sm font-semibold flex items-center gap-2 text-muted-foreground group-focus-within:text-primary transition-colors">
                          <FileText className="w-4 h-4" />
                          Experience Letter / Relieving Letter
                        </Label>
                        <div className="relative">
                          <Input
                            value={formData.custom_fields['experience_letter'] || ''}
                            onChange={(e) => {
                              const newFields = { ...formData.custom_fields, ['experience_letter']: e.target.value };
                              setFormData({ ...formData, custom_fields: newFields });
                            }}
                            disabled={!isEditing}
                            className={cn(
                              "transition-all duration-200 pl-4",
                              !isEditing ? 'bg-muted/50 border-transparent shadow-none' : 'focus:ring-2 focus:ring-primary/20 border-primary/20'
                            )}
                            placeholder="Enter URL or reference to experience letter"
                          />
                          {formData.custom_fields['experience_letter'] && !isEditing && (
                            <div className="mt-2">
                              <Button variant="link" size="sm" className="p-0 h-auto gap-1 text-primary" asChild>
                                <a href={formData.custom_fields['experience_letter']} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-3 h-3" /> View Letter
                                </a>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {Object.entries(formData.custom_fields || {})
                          .filter(([key, value]) => {
                            // Filter out the experience letter (handled separately)
                            if (key === 'experience_letter') return false;

                            // Filter out numeric keys which usually indicate a string/array being parsed as object
                            if (!isNaN(Number(key))) return false;

                            // When NOT editing, only show fields that HAVE a value
                            if (!isEditing && (!value || String(value).trim() === '')) return false;

                            return true;
                          })
                          .map(([key, value]: [string, any]) => (
                            <div key={key} className="space-y-2 group">
                              <Label className="capitalize text-muted-foreground group-focus-within:text-primary transition-colors">
                                {key.replace(/_/g, ' ')}
                              </Label>
                              <div className="relative">
                                <Input
                                  value={value}
                                  onChange={(e) => {
                                    const newFields = { ...formData.custom_fields, [key]: e.target.value };
                                    setFormData({ ...formData, custom_fields: newFields });
                                  }}
                                  disabled={!isEditing}
                                  className={cn(
                                    "transition-all duration-200",
                                    !isEditing ? 'bg-muted/50 border-transparent shadow-none' : 'focus:ring-2 focus:ring-primary/20'
                                  )}
                                  placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employment Information */}
          <TabsContent value="employment">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Employment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="w-4 h-4" />
                      <span className="text-sm">Department</span>
                    </div>
                    <p className="font-medium">{employee.department?.name || 'N/A'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-sm">Designation</span>
                    </div>
                    <p className="font-medium">{employee.designation?.name || 'N/A'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span className="text-sm">Role</span>
                    </div>
                    <p className="font-medium capitalize">{employee.role}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Date of Joining</span>
                    </div>
                    <p className="font-medium">
                      {employee.date_of_joining ? format(new Date(employee.date_of_joining), 'MMMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>

                {isAdmin ? null : <Separator />}


                <div className="p-6 rounded-lg gradient-primary text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-white/80">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm">Annual Salary</span>
                      </div>
                      <p className="text-3xl font-bold mt-1">
                        ${Number(employee.salary).toLocaleString()}
                      </p>
                      <p className="text-white/70 text-sm mt-1">
                        Contact HR for salary revision requests
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resignations */}
          <TabsContent value="exit">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resignation & Exit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!hasActiveResignation ? (
                  <div className="max-w-xl space-y-4">
                    <p className="text-sm text-muted-foreground">
                      If you wish to resign from your position, please fill out the form below.
                      Note that your request will be subject to HR approval based on notice period policies.
                    </p>
                    <div className="space-y-2">
                      <Label>Preferred Last Working Day</Label>
                      <Input
                        type="date"
                        value={resignationData.preferredLastWorkingDay}
                        onChange={e => setResignationData({ ...resignationData, preferredLastWorkingDay: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reason for Resignation</Label>
                      <Textarea
                        placeholder="Please share your reason for leaving..."
                        value={resignationData.reason}
                        onChange={e => setResignationData({ ...resignationData, reason: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => resignMutation.mutate({
                        reason: resignationData.reason,
                        preferred_last_working_day: resignationData.preferredLastWorkingDay
                      })}
                      disabled={resignMutation.isPending || !resignationData.reason || !resignationData.preferredLastWorkingDay}
                    >
                      {resignMutation.isPending && <Loader size="small" variant="white" className="mr-2" />}
                      <LogOut className="w-4 h-4 mr-2" /> Submit Resignation
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className={cn(
                      "p-6 rounded-xl border flex items-start gap-4",
                      latestResignation.status === 'pending' ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200"
                    )}>
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        latestResignation.status === 'pending' ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                      )}>
                        {latestResignation.status === 'pending' ? <Clock className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-lg">Resignation {latestResignation.status === 'pending' ? 'Pending' : 'Approved'}</h3>
                          <StatusBadge status={latestResignation.status} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {latestResignation.status === 'pending'
                            ? "Your resignation request is currently being reviewed by HR."
                            : (() => {
                              const lDate = new Date(latestResignation.approvedLastWorkingDay || latestResignation.preferredLastWorkingDay);
                              const lDateStr = !isNaN(lDate.getTime()) ? format(lDate, 'MMMM d, yyyy') : 'N/A';
                              return `Your resignation has been approved. Your final working day is ${lDateStr}.`;
                            })()
                          }
                        </p>
                        {latestResignation.hrRemarks && (
                          <div className="mt-3 p-3 bg-background rounded-lg border text-sm italic">
                            <strong>HR Remarks:</strong> {latestResignation.hrRemarks}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">History</h4>
                      <div className="space-y-3">
                        {myResignations.map((res: any) => (
                          <div key={res.id} className="p-4 rounded-lg border bg-card flex items-center justify-between text-sm">
                            <div className="flex-1">
                              <p className="font-medium">
                                {(() => {
                                  const cDate = new Date(res.createdAt);
                                  return `Applied on ${!isNaN(cDate.getTime()) ? format(cDate, 'MMM dd, yyyy') : 'N/A'}`;
                                })()}
                              </p>
                              <p className="text-xs text-muted-foreground">Reason: {res.reason.substring(0, 50)}...</p>
                            </div>
                            <StatusBadge status={res.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Documents & Certificates</CardTitle>
                <Button size="sm" onClick={() => setIsUploadDialogOpen(true)} disabled={isLocked}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc: any) => (
                      <div key={doc.id} className="p-4 rounded-xl border bg-card flex items-start gap-4 group">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate" title={doc.document_type}>{doc.document_type}</p>
                          <p className="text-xs text-muted-foreground truncate" title={doc.file_name}>{doc.file_name}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {(() => {
                              const uDate = new Date(doc.createdAt);
                              return `Uploaded ${!isNaN(uDate.getTime()) ? format(uDate, 'MMM dd, yyyy') : 'N/A'}`;
                            })()}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={getBackendUrl(doc.file_url)} target="_blank" rel="noopener noreferrer">
                              <Eye className="w-4 h-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setIsDeleteDialogOpen(true);
                            }}
                            disabled={isLocked}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 bg-muted/20 border-2 border-dashed rounded-2xl text-center">
                    <FileText className="w-10 h-10 text-muted-foreground mb-4 opacity-20" />
                    <h3 className="text-lg font-semibold">No documents uploaded</h3>
                    <p className="text-sm text-muted-foreground max-w-[250px]">Upload your ID proofs, certificates, and other documents here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Upload Document Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">Upload and organize your important documents</p>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type</Label>
                <Input
                  id="documentType"
                  placeholder="e.g., Passport, Driving License, Certification"
                  value={uploadData.documentType}
                  onChange={(e) => setUploadData({ ...uploadData, documentType: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Select File</Label>
                <div className="border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    ref={fileInputRef}
                    id="file"
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={handleFileSelect}
                  />
                  <div
                    className="text-center"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    {uploadData.fileName ? (
                      <>
                        <p className="text-sm font-medium">{uploadData.fileName}</p>
                        <p className="text-xs text-muted-foreground">Click to change file</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PDF, PNG, JPG, DOC up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsUploadDialogOpen(false);
                  setUploadData({ documentType: '', fileName: '', file: null });
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadDocument}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending && <Loader size="small" variant="white" className="mr-2" />}
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Document Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedDocument?.document_type}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-2 mt-6">
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (selectedDocument) {
                    deleteMutation.mutate(selectedDocument.id);
                  }
                }}
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader size="small" variant="white" className="mr-2" />}
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
