import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation } from '@tanstack/react-query';
import { employeeService, departmentService, designationService } from '@/services/apiService';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, User, Briefcase, CreditCard, FileText, Check, Upload, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Loader from '@/components/ui/Loader';

const steps = [
    { id: 'personal', title: 'Personal Info', icon: User },
    { id: 'job', title: 'Job Details', icon: Briefcase },
    { id: 'bank', title: 'Bank Details', icon: CreditCard },
    { id: 'docs', title: 'Documents', icon: FileText },
];

export default function AddEmployee() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        address: '',
        date_of_joining: new Date().toISOString().split('T')[0],
        role: 'employee',
        salary: '',
        department_id: '',
        designation_id: '',
        reporting_manager_id: '',
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        branch_name: '',
        password: 'password123',
    });

    const [documents, setDocuments] = useState<{ type: string; file: File | null }[]>([
        { type: 'ID Proof (Aadhaar/PAN)', file: null },
        { type: 'Education Certificate', file: null },
        { type: 'Relieving Letter', file: null },
    ]);

    // Fetch Data
    const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: async () => (await departmentService.getAll()).data });
    const { data: designations = [] } = useQuery({ queryKey: ['designations'], queryFn: async () => (await designationService.getAll()).data });
    const { data: employeesData } = useQuery({ queryKey: ['employees-list'], queryFn: async () => (await employeeService.getAll()).data });
    const employees = employeesData?.employees || [];

    const createMutation = useMutation({
        mutationFn: employeeService.create,
        onSuccess: () => {
            toast.success('Employee onboarded successfully!');
            navigate('/employees');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create employee');
        },
    });

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
        else navigate('/employees');
    };

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
                <PageHeader
                    title="Onboard New Employee"
                    description="Complete the steps below to add a new member to your team."
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
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label>Residential Address*</Label>
                                            <Textarea value={formData.address} onChange={e => updateFormData('address', e.target.value)} placeholder="Enter full address" rows={3} required />
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
                                                    <SelectItem value="hr">HR Administrator</SelectItem>
                                                    <SelectItem value="admin">System Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
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
                                        <p className="text-sm text-muted-foreground">Upload mandatory documents for verification. Max file size: 5MB per file.</p>
                                        <div className="space-y-3">
                                            {documents.map((doc, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border-2 border-dashed border-muted transition-all hover:bg-muted/60 group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center shadow-sm">
                                                            <FileText className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">{doc.type}</p>
                                                            <p className="text-xs text-muted-foreground">{doc.file ? doc.file.name : 'No file chosen'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {doc.file ? (
                                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                                                                const newDocs = [...documents];
                                                                newDocs[idx].file = null;
                                                                setDocuments(newDocs);
                                                            }}><Trash2 className="w-4 h-4" /></Button>
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
                                disabled={createMutation.isPending || (currentStep === 0 && (!formData.name || !formData.email || !formData.phone || !formData.address))}
                                className="min-w-[120px]"
                            >
                                {createMutation.isPending && <Loader size="small" variant="white" className="mr-2" />}
                                {currentStep === steps.length - 1 ? 'Complete Onboarding' : <>Next <ChevronRight className="w-4 h-4 ml-2" /></>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
