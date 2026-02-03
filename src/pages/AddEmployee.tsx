import { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService, departmentService, designationService } from '@/services/apiService';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, User, Briefcase, CreditCard, FileText, Check, Upload, Trash2, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Loader from '@/components/ui/Loader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { employeeDocumentService } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const steps = [
    { id: 'personal', title: 'Personal Info', icon: User },
    { id: 'job', title: 'Job Details', icon: Briefcase },
    { id: 'bank', title: 'Bank Details', icon: CreditCard },
    { id: 'docs', title: 'Documents', icon: FileText },
];

export default function AddEmployee() {
    const { user, isAdmin } = useAuth();
    const { settings } = useSystemSettings();
    const { id } = useParams();
    const isEdit = !!id;
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    if (!user) return <Navigate to="/login" replace />;

    const canManageEmployees = isAdmin || (user.role === 'hr' && settings?.hr_can_manage_employees);

    if (!canManageEmployees) {
        return <Navigate to="/dashboard" replace />;
    }

    const [currentStep, setCurrentStep] = useState(0);

    // Custom Fields Modal State
    const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState(false);
    const [newCustomFieldName, setNewCustomFieldName] = useState('');

    // Custom Document Modal State
    const [isCustomDocModalOpen, setIsCustomDocModalOpen] = useState(false);
    const [newCustomDocName, setNewCustomDocName] = useState('');

    const [formData, setFormData] = useState({
        avatar_url: '',
        name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        address: '',
        date_of_joining: new Date().toISOString().split('T')[0],
        role: 'employee',
        status: 'active',
        salary: '',
        department_id: '',
        designation_id: '',
        reporting_manager_id: '',
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        branch_name: '',
        password: 'emp123',
        pf_percentage: '',
        esi_percentage: '',
        absent_deduction_type: 'percentage',
        absent_deduction_value: '100',
        education: '',
        aadhaar_number: '',
        pan_number: '',
        custom_fields: {} as any,
    });

    const [documents, setDocuments] = useState<{ type: string; file: File | null; url?: string }[]>([
        { type: 'ID Proof (Aadhaar/PAN)', file: null },
        { type: 'Education Certificate', file: null },
        { type: 'Relieving Letter', file: null },
    ]);

    // Fetch Departments and Designations
    const { data: departmentsData = [] } = useQuery({ queryKey: ['departments'], queryFn: async () => (await departmentService.getAll()).data });
    const departments = Array.isArray(departmentsData) ? departmentsData : (departmentsData as any).departments || [];

    const { data: designationsData = [] } = useQuery({ queryKey: ['designations'], queryFn: async () => (await designationService.getAll()).data });
    const designations = Array.isArray(designationsData) ? designationsData : (designationsData as any).designations || [];

    const { data: employeesData } = useQuery({ queryKey: ['employees-list'], queryFn: async () => (await employeeService.getAll()).data });
    const employees = employeesData?.employees || [];

    // Fetch Employee for Editing
    const { data: employeeToEdit, isLoading: isEmployeeLoading } = useQuery({
        queryKey: ['employee', id],
        queryFn: async () => (await employeeService.getById(id!)).data,
        enabled: isEdit,
    });

    useEffect(() => {
        if (employeeToEdit) {
            setFormData({
                avatar_url: employeeToEdit.avatar_url || '',
                name: employeeToEdit.name || '',
                email: employeeToEdit.email || '',
                phone: employeeToEdit.phone || '',
                date_of_birth: employeeToEdit.date_of_birth ? new Date(employeeToEdit.date_of_birth).toISOString().split('T')[0] : '',
                address: employeeToEdit.address || '',
                date_of_joining: employeeToEdit.date_of_joining ? new Date(employeeToEdit.date_of_joining).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                role: employeeToEdit.role || 'employee',
                status: employeeToEdit.status || 'active',
                salary: employeeToEdit.salary?.toString() || '',
                department_id: employeeToEdit.department_id || '',
                designation_id: employeeToEdit.designation_id || '',
                reporting_manager_id: employeeToEdit.reporting_manager_id || '',
                bank_name: employeeToEdit.bank_name || '',
                account_number: employeeToEdit.account_number || '',
                ifsc_code: employeeToEdit.ifsc_code || '',
                branch_name: employeeToEdit.branch_name || '',
                password: '', // Don't prepopulate password for security
                pf_percentage: employeeToEdit.pf_percentage || '',
                esi_percentage: employeeToEdit.esi_percentage || '',
                absent_deduction_type: employeeToEdit.absent_deduction_type || 'percentage',
                absent_deduction_value: employeeToEdit.absent_deduction_value || '',
                education: employeeToEdit.education || '',
                aadhaar_number: employeeToEdit.aadhaar_number || '',
                pan_number: employeeToEdit.pan_number || '',
                custom_fields: typeof employeeToEdit.custom_fields === 'string'
                    ? JSON.parse(employeeToEdit.custom_fields)
                    : (employeeToEdit.custom_fields || {}),
            });

            if (employeeToEdit.documents && Array.isArray(employeeToEdit.documents)) {
                // Initialize with placeholders but fill in those that exist
                const existingDocs = [...documents];
                employeeToEdit.documents.forEach((doc: any) => {
                    const idx = existingDocs.findIndex(d => d.type === doc.document_type);
                    if (idx !== -1) {
                        existingDocs[idx] = { ...existingDocs[idx], url: doc.file_url };
                    } else {
                        // Add as new custom type if not exists in default list
                        existingDocs.push({
                            type: doc.document_type,
                            file: null,
                            url: doc.file_url
                        });
                    }
                });
                setDocuments(existingDocs);
            }
        }
    }, [employeeToEdit]);

    const uploadAvatarMutation = useMutation({
        mutationFn: employeeService.uploadAvatar,
        onSuccess: (res) => {
            updateFormData('avatar_url', res.data.url);
            toast.success('Profile image uploaded');
        },
        onError: () => toast.error('Failed to upload image'),
    });

    const uploadDocuments = async (employeeId: string) => {
        const uploadPromises = documents
            .filter(doc => doc.file)
            .map(doc => {
                return (employeeDocumentService.uploadDocument(employeeId, doc.file!, doc.type)).catch(err => {
                    console.error('Failed to upload document:', doc.type, err);
                    toast.error(`Failed to upload ${doc.type}`);
                });
            });
        if (uploadPromises.length > 0) {
            await Promise.all(uploadPromises);
        }
    };

    const createMutation = useMutation({
        mutationFn: employeeService.create,
        onSuccess: async (res) => {
            const empId = res.data.employee.id;
            await uploadDocuments(empId);
            toast.success('Employee created successfully!');
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            navigate('/employees');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create employee');
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => employeeService.update(id!, data),
        onSuccess: async (res) => {
            const empId = res.data.employee.id || id;
            await uploadDocuments(empId);
            toast.success('Employee updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            queryClient.invalidateQueries({ queryKey: ['employee', id] });
            navigate('/employees');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update employee');
        },
    });

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            const payload = { ...formData };
            if (isEdit && !payload.password) delete payload.password;

            if (isEdit) {
                updateMutation.mutate(payload);
            } else {
                createMutation.mutate(payload);
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
        else navigate('/employees');
    };

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addCustomField = () => {
        if (newCustomFieldName) {
            const newFields = { ...formData.custom_fields, [newCustomFieldName]: '' };
            updateFormData('custom_fields', newFields);
            setNewCustomFieldName('');
            setIsCustomFieldModalOpen(false);
        }
    };

    const addCustomDocument = () => {
        if (newCustomDocName) {
            setDocuments([...documents, { type: newCustomDocName, file: null }]);
            setNewCustomDocName('');
            setIsCustomDocModalOpen(false);
        }
    };

    if (isEdit && isEmployeeLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
                <PageHeader
                    title={isEdit ? "Edit Employee" : "Add New Employee"}
                    description={isEdit ? "Update details for this team member." : "Complete the steps below to add a new member to your team."}
                >
                    <Button variant="outline" onClick={() => navigate('/employees')}>
                        <ChevronLeft className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                </PageHeader>

                {/* Stepper */}
                <div className="flex justify-between items-center px-4 sm:px-10 py-6 bg-card border rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = index === currentStep;
                        const isCompleted = index < currentStep;

                        return (
                            <div key={step.id} className="flex items-center group">
                                <div className="flex flex-col items-center gap-2">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                                        isActive ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110 shadow-lg" :
                                            isCompleted ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                                    )}>
                                        {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-semibold uppercase tracking-wider hidden sm:block transition-colors",
                                        isActive ? "text-primary" : isCompleted ? "text-success" : "text-muted-foreground"
                                    )}>
                                        {step.title}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={cn(
                                        "w-8 sm:w-16 h-[2px] mx-2 transition-colors",
                                        isCompleted ? "bg-success/50" : "bg-muted"
                                    )} />
                                )}
                            </div>
                        );
                    })}
                </div>

                <Card className="border-none shadow-xl bg-card/60 backdrop-blur-sm overflow-hidden min-h-[450px]">
                    <CardContent className="p-6 sm:p-10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                {currentStep === 0 && (
                                    <div className="space-y-6">
                                        <div className="flex flex-col items-center gap-4 mb-4">
                                            <div className="relative group">
                                                <Avatar className="h-24 w-24 border-4 border-primary/10 shadow-xl">
                                                    <AvatarImage src={formData.avatar_url} />
                                                    <AvatarFallback className="text-2xl bg-primary/5 text-primary">
                                                        {formData.name?.charAt(0) || <User className="w-10 h-10" />}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                                    <Upload className="w-6 h-6" />
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) uploadAvatarMutation.mutate(file);
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium">Profile Picture</p>
                                                <p className="text-xs text-muted-foreground">Click to upload (JPG, PNG)</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label>Full Name*</Label>
                                                <Input value={formData.name} onChange={e => updateFormData('name', e.target.value)} placeholder="John Doe" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Email Address*</Label>
                                                <Input type="email" value={formData.email} onChange={e => updateFormData('email', e.target.value)} placeholder="john@company.com" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Phone Number*</Label>
                                                <Input value={formData.phone} onChange={e => updateFormData('phone', e.target.value)} placeholder="+1 234 567 890" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Date of Birth</Label>
                                                <Input type="date" value={formData.date_of_birth} onChange={e => updateFormData('date_of_birth', e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Education</Label>
                                                <Input value={formData.education} onChange={e => updateFormData('education', e.target.value)} placeholder="Highest Degree" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Aadhaar Number</Label>
                                                <Input value={formData.aadhaar_number} onChange={e => updateFormData('aadhaar_number', e.target.value)} placeholder="12-digit number" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>PAN Number</Label>
                                                <Input value={formData.pan_number} onChange={e => updateFormData('pan_number', e.target.value)} placeholder="ABCDE1234F" />
                                            </div>
                                            <div className="space-y-2 sm:col-span-2">
                                                <Label>Residential Address*</Label>
                                                <Textarea value={formData.address} onChange={e => updateFormData('address', e.target.value)} placeholder="Enter full address" rows={3} required />
                                            </div>

                                            {/* Custom Fields */}
                                            <div className="sm:col-span-2 space-y-4 pt-4 border-t">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-bold">Custom Fields</Label>
                                                    <Dialog open={isCustomFieldModalOpen} onOpenChange={setIsCustomFieldModalOpen}>
                                                        <DialogTrigger asChild>
                                                            <Button type="button" variant="outline" size="sm">
                                                                <Plus className="w-3 h-3 mr-1" /> Add Field
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Add Custom Field</DialogTitle>
                                                                <DialogDescription>
                                                                    Enter the name of the new custom field you want to add.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="grid gap-4 py-4">
                                                                <div className="grid grid-cols-4 items-center gap-4">
                                                                    <Label htmlFor="fieldName" className="text-right">
                                                                        Name
                                                                    </Label>
                                                                    <Input
                                                                        id="fieldName"
                                                                        value={newCustomFieldName}
                                                                        onChange={(e) => setNewCustomFieldName(e.target.value)}
                                                                        className="col-span-3"
                                                                        placeholder="e.g. Employee Type"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <DialogFooter>
                                                                <Button type="button" variant="secondary" onClick={() => setIsCustomFieldModalOpen(false)}>Cancel</Button>
                                                                <Button type="button" onClick={addCustomField}>Add Field</Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {Object.entries(formData.custom_fields || {}).map(([key, value]: [string, any]) => (
                                                        <div key={key} className="space-y-2 group relative">
                                                            <div className="flex justify-between">
                                                                <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                                                                <button
                                                                    type="button"
                                                                    className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={() => {
                                                                        const newFields = { ...formData.custom_fields };
                                                                        delete newFields[key];
                                                                        updateFormData('custom_fields', newFields);
                                                                    }}
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                            <Input
                                                                value={value}
                                                                onChange={(e) => {
                                                                    const newFields = { ...formData.custom_fields, [key]: e.target.value };
                                                                    updateFormData('custom_fields', newFields);
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 1 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Department*</Label>
                                            <Select value={formData.department_id} onValueChange={val => updateFormData('department_id', val)}>
                                                <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                                                <SelectContent>{departments.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Designation*</Label>
                                            <Select value={formData.designation_id} onValueChange={val => updateFormData('designation_id', val)}>
                                                <SelectTrigger><SelectValue placeholder="Select Designation" /></SelectTrigger>
                                                <SelectContent>{designations.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Joining Date*</Label>
                                            <Input type="date" value={formData.date_of_joining} onChange={e => updateFormData('date_of_joining', e.target.value)} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Reporting Manager</Label>
                                            <Select value={formData.reporting_manager_id} onValueChange={val => updateFormData('reporting_manager_id', val)}>
                                                <SelectTrigger><SelectValue placeholder="Assign Manager" /></SelectTrigger>
                                                <SelectContent>{employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Annual CTC*</Label>
                                            <Input type="number" value={formData.salary} onChange={e => updateFormData('salary', e.target.value)} placeholder="0.00" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>System Role*</Label>
                                            <Select value={formData.role} onValueChange={val => updateFormData('role', val)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="employee">Employee</SelectItem>
                                                    {isAdmin && (
                                                        <>
                                                            <SelectItem value="hr">HR Administrator</SelectItem>
                                                            <SelectItem value="admin">System Admin</SelectItem>
                                                        </>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Status*</Label>
                                            <Select value={formData.status} onValueChange={val => updateFormData('status', val)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                    <SelectItem value="on_leave">On Leave</SelectItem>
                                                    <SelectItem value="terminated">Terminated</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>PF Percentage (%)</Label>
                                            <Input type="number" step="0.01" value={formData.pf_percentage} onChange={e => updateFormData('pf_percentage', e.target.value)} placeholder="Default 12%" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>ESI Percentage (%)</Label>
                                            <Input type="number" step="0.01" value={formData.esi_percentage} onChange={e => updateFormData('esi_percentage', e.target.value)} placeholder="Default 0.75%" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Absent Deduction Type</Label>
                                            <Select value={formData.absent_deduction_type} onValueChange={val => updateFormData('absent_deduction_type', val)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="percentage">Percentage (of monthly pay)</SelectItem>
                                                    <SelectItem value="amount">Fixed Amount</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Absent Deduction Value</Label>
                                            <Input type="number" value={formData.absent_deduction_value} onChange={e => updateFormData('absent_deduction_value', e.target.value)} placeholder="e.g. 100 or 500" />
                                        </div>
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Bank Name</Label>
                                            <Input value={formData.bank_name} onChange={e => updateFormData('bank_name', e.target.value)} placeholder="HDFC Bank" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Account Number</Label>
                                            <Input value={formData.account_number} onChange={e => updateFormData('account_number', e.target.value)} placeholder="XXXX XXXX XXXX" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>IFSC Code</Label>
                                            <Input value={formData.ifsc_code} onChange={e => updateFormData('ifsc_code', e.target.value)} placeholder="HDFC0001234" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Branch Name</Label>
                                            <Input value={formData.branch_name} onChange={e => updateFormData('branch_name', e.target.value)} placeholder="Main Branch" />
                                        </div>
                                    </div>
                                )}

                                {currentStep === 3 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-muted-foreground">Upload mandatory documents for verification. Max file size: 5MB per file.</p>
                                            <Dialog open={isCustomDocModalOpen} onOpenChange={setIsCustomDocModalOpen}>
                                                <DialogTrigger asChild>
                                                    <Button type="button" variant="outline" size="sm">
                                                        <Plus className="w-3 h-3 mr-1" /> Add Document
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Add Custom Document</DialogTitle>
                                                        <DialogDescription>
                                                            Enter the name of the new document type.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                            <Label htmlFor="docName" className="text-right">
                                                                Doc Name
                                                            </Label>
                                                            <Input
                                                                id="docName"
                                                                value={newCustomDocName}
                                                                onChange={(e) => setNewCustomDocName(e.target.value)}
                                                                className="col-span-3"
                                                                placeholder="e.g. Previous Experience Letter"
                                                            />
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button type="button" variant="secondary" onClick={() => setIsCustomDocModalOpen(false)}>Cancel</Button>
                                                        <Button type="button" onClick={addCustomDocument}>Add Document</Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>

                                        <div className="space-y-3">
                                            {documents.map((doc, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border-2 border-dashed border-muted transition-all hover:bg-muted/60 group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center shadow-sm">
                                                            <FileText className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">{doc.type}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {doc.file ? doc.file.name : doc.url ? 'File uploaded' : 'No file chosen'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {(doc.file || doc.url) ? (
                                                            <>
                                                                {doc.url && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-primary hover:text-primary/80"
                                                                        onClick={() => window.open(doc.url, '_blank')}
                                                                    >
                                                                        View
                                                                    </Button>
                                                                )}
                                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                                                                    const newDocs = [...documents];
                                                                    newDocs[idx].file = null;
                                                                    newDocs[idx].url = undefined;
                                                                    setDocuments(newDocs);
                                                                }}><Trash2 className="w-4 h-4" /></Button>
                                                            </>
                                                        ) : (
                                                            <Button variant="outline" size="sm" className="relative cursor-pointer group-hover:bg-primary group-hover:text-primary-foreground">
                                                                <Upload className="w-3 h-3 mr-2" /> Upload
                                                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        const newDocs = [...documents];
                                                                        newDocs[idx].file = file;
                                                                        setDocuments(newDocs);
                                                                    }
                                                                }} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        <div className="flex justify-between items-center mt-12 pt-6 border-t">
                            <Button variant="ghost" onClick={handleBack}>
                                {currentStep === 0 ? 'Exit' : <><ChevronLeft className="w-4 h-4 mr-2" /> Previous</>}
                            </Button>
                            <Button
                                onClick={handleNext}
                                disabled={createMutation.isPending || updateMutation.isPending || uploadAvatarMutation.isPending || (currentStep === 0 && (!formData.name || !formData.email || !formData.phone || !formData.address))}
                                className="min-w-[120px]"
                            >
                                {(createMutation.isPending || updateMutation.isPending) && <Loader size="small" variant="white" className="mr-2" />}
                                {currentStep === steps.length - 1 ? (isEdit ? 'Update Employee' : 'Create Employee') : <>Next <ChevronRight className="w-4 h-4 ml-2" /></>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
