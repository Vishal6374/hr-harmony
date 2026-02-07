import { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
    User, Mail, Phone, MapPin, Calendar,
    Building2, Briefcase, DollarSign, University,
    CreditCard, Code, FileText, GraduationCap,
    History, ShieldCheck
} from "lucide-react";
import { format } from "date-fns";
import { Employee } from "@/types/hrms";

interface EmployeeDetailsSheetProps {
    employee: Employee | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EmployeeDetailsSheet({ employee, open, onOpenChange }: EmployeeDetailsSheetProps) {
    if (!employee) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl overflow-y-auto no-scrollbar">
                <SheetHeader className="space-y-4">
                    <div className="flex items-start justify-between mt-4">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-sm">
                                <AvatarImage src={employee.avatar_url} alt={employee.name} />
                                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                                    {employee.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <SheetTitle className="text-xl font-bold">{employee.name}</SheetTitle>
                                <SheetDescription className="flex items-center gap-1.5 mt-0.5">
                                    <span className="font-medium text-foreground">{employee.employee_id}</span>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-muted-foreground capitalize">{employee.role} Role</span>
                                </SheetDescription>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <StatusBadge status={employee.status} />
                        </div>
                    </div>
                </SheetHeader>

                <Separator className="my-6" />

                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="employment">Job</TabsTrigger>
                        <TabsTrigger value="financial">Payroll</TabsTrigger>
                        <TabsTrigger value="documents">Docs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <section className="space-y-4">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <User className="w-4 h-4" /> Personal Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Email Address</p>
                                    <p className="text-sm font-medium flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5 text-primary" /> {employee.email}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Phone Number</p>
                                    <p className="text-sm font-medium flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5 text-primary" /> {employee.phone || 'N/A'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Date of Birth</p>
                                    <p className="text-sm font-medium flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-primary" />
                                        {(() => {
                                            if (!employee.date_of_birth) return 'N/A';
                                            const d = new Date(employee.date_of_birth);
                                            return isNaN(d.getTime()) ? 'N/A' : format(d, 'MMM dd, yyyy');
                                        })()}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Gender</p>
                                    <p className="text-sm font-medium flex items-center gap-2 capitalize">
                                        {(employee as any).gender || 'Not Specified'}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Residential Address</p>
                                <p className="text-sm font-medium flex items-start gap-2 leading-relaxed">
                                    <MapPin className="w-3.5 h-3.5 text-primary mt-0.5" />
                                    {employee.address || 'No address provided'}
                                </p>
                            </div>
                        </section>

                        <Separator />

                        <section className="space-y-4">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> System Access
                            </h3>
                            <div className="p-3 bg-muted/30 rounded-lg border flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Authentication Role</p>
                                    <p className="text-xs text-muted-foreground">Primary permissions group for the system</p>
                                </div>
                                <Badge variant="secondary" className="capitalize">{employee.role}</Badge>
                            </div>
                        </section>
                    </TabsContent>

                    <TabsContent value="employment" className="space-y-4 pt-4">
                        <section className="space-y-4">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> Position Details
                            </h3>
                            <div className="grid grid-cols-2 gap-6 p-4 rounded-xl border bg-card/50">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Building2 className="w-4 h-4" />
                                        <span className="text-xs font-semibold">Department</span>
                                    </div>
                                    <p className="text-lg font-bold">{employee.department?.name || 'Unassigned'}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Briefcase className="w-4 h-4" />
                                        <span className="text-xs font-semibold">Designation</span>
                                    </div>
                                    <p className="text-lg font-bold">{employee.designation?.name || 'Unassigned'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="p-3 rounded-lg bg-muted/50">
                                    <p className="text-xs text-muted-foreground mb-1">Date of Joining</p>
                                    <p className="text-sm font-bold">
                                        {(() => {
                                            if (!employee.date_of_joining) return 'N/A';
                                            const d = new Date(employee.date_of_joining);
                                            return isNaN(d.getTime()) ? 'N/A' : format(d, 'MMM dd, yyyy');
                                        })()}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/50">
                                    <p className="text-xs text-muted-foreground mb-1">Experience at Catalyr</p>
                                    <p className="text-sm font-bold">
                                        {(() => {
                                            if (!employee.date_of_joining) return 'N/A';
                                            const d = new Date(employee.date_of_joining);
                                            if (isNaN(d.getTime())) return 'N/A';
                                            const diff = new Date().getTime() - d.getTime();
                                            return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365))} Years`;
                                        })()}
                                    </p>
                                </div>
                            </div>
                        </section>
                    </TabsContent>

                    <TabsContent value="financial" className="space-y-6">
                        <section className="space-y-4">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> Salary Information
                            </h3>
                            <div className="p-4 rounded-xl gradient-primary  shadow-lg overflow-hidden relative">
                                <div className="relative z-10">
                                    <p className="text-xs font-medium">Monthly Basic Fixed</p>
                                    <p className="text-3xl font-black mt-1">₹{Number(employee.salary).toLocaleString()}</p>
                                    <div className="flex flex-wrap gap-4 mt-4">
                                        <div className="px-2 py-1 rounded bg-white/20 text-[10px] font-bold">ANNUAL: ₹{(employee.salary * 12).toLocaleString()}</div>
                                        <div className="px-2 py-1 rounded bg-white/20 text-[10px] font-bold">PF: {employee.pf_percentage || '0'}%</div>
                                        <div className="px-2 py-1 rounded bg-white/20 text-[10px] font-bold">ESI: {employee.esi_percentage || '0'}%</div>
                                        <div className="px-2 py-1 rounded bg-white/20 text-[10px] font-bold uppercase">ABSENT: {employee.absent_deduction_type === 'percentage' ? `${employee.absent_deduction_value}% Monthly` : `₹${employee.absent_deduction_value}`}</div>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 scale-150">
                                    {/* <DollarSign className="w-24 h-24" /> */}
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4 pt-2">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <University className="w-4 h-4" /> Bank Details
                            </h3>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-lg border bg-muted/10">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Bank Name</p>
                                        <p className="text-sm font-bold truncate mt-1">{employee.bank_name || 'NOT PROVIDED'}</p>
                                    </div>
                                    <div className="p-3 rounded-lg border bg-muted/10">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">IFSC Code</p>
                                        <p className="text-sm font-bold mt-1 uppercase tracking-widest">{employee.ifsc_code || '---'}</p>
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg border bg-muted/10 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Account Number</p>
                                        <p className="text-sm font-bold mt-1 tracking-widest">{employee.account_number || '************'}</p>
                                    </div>
                                    <CreditCard className="w-5 h-5 text-muted-foreground/30" />
                                </div>
                                <div className="p-3 rounded-lg border bg-muted/10">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Branch Name</p>
                                    <p className="text-sm font-bold mt-1">{employee.branch_name || 'Not Assigned'}</p>
                                </div>
                            </div>
                        </section>
                    </TabsContent>

                    <TabsContent value="documents" className="space-y-6">
                        {employee.documents && employee.documents.length > 0 ? (
                            <div className="space-y-3">
                                {employee.documents.map((doc, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border transition-all hover:bg-muted/60">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center shadow-sm">
                                                <FileText className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{doc.document_type || 'Document'}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Uploaded on {doc.created_at ? format(new Date(doc.created_at), 'MMM dd, yyyy') : 'Recently'}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8"
                                            onClick={() => window.open(doc.file_url, '_blank')}
                                        >
                                            View
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 bg-muted/20 border-2 border-dashed rounded-2xl text-center">
                                <FileText className="w-10 h-10 text-muted-foreground mb-4 opacity-20" />
                                <h3 className="text-lg font-semibold">No Documents Found</h3>
                                <p className="text-sm text-muted-foreground max-w-[280px]">No documents have been uploaded for this employee yet.</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <div className="flex items-center justify-between mt-8">
                    <p className="text-[10px] text-muted-foreground">Employee record last updated: {format(new Date(), 'MMM dd, hh:mm a')}</p>
                    <p className="text-[10px] text-primary font-bold uppercase">HR Verified Secure</p>
                </div>
            </SheetContent>
        </Sheet>
    );
}
