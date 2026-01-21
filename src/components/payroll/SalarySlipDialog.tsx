import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { format } from "date-fns";
import { SalarySlip } from "@/types/hrms";
import { useAuth } from "@/contexts/AuthContext";

interface SalarySlipDialogProps {
    isOpen: boolean;
    onClose: () => void;
    slip: SalarySlip | null;
    employeeName?: string;
    employeeId?: string;
    department?: string;
    designation?: string;
    canEdit?: boolean;
}

export function SalarySlipDialog({
    isOpen,
    onClose,
    slip,
    employeeName,
    employeeId,
    department,
    designation,
    canEdit
}: SalarySlipDialogProps) {
    const { user } = useAuth();

    if (!slip) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Salary Slip Preview</DialogTitle>
                </DialogHeader>

                <div className="p-6 bg-white text-black border rounded-lg shadow-sm print:shadow-none print:border-none" id="salary-slip">
                    {/* Header */}
                    <div className="text-center mb-8 border-b pb-4">
                        <h1 className="text-2xl font-bold uppercase tracking-wider">HR Harmony Inc.</h1>
                        <p className="text-sm text-gray-500">123 Business Park, Tech City, TC 90210</p>
                        <p className="text-sm font-medium mt-2">Salary Slip for {format(new Date(slip.year, slip.month - 1), 'MMMM yyyy')}</p>
                    </div>

                    {/* Employee Details */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-8">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Employee Name:</span>
                            <span className="font-semibold">{employeeName || user?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Employee ID:</span>
                            <span className="font-semibold">{employeeId || user?.employeeId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Department:</span>
                            <span className="font-semibold">{department || 'Engineering'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Designation:</span>
                            <span className="font-semibold">{designation || 'Developer'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Days Paid:</span>
                            <span className="font-semibold">30</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Pay Date:</span>
                            <span className="font-semibold">{format(new Date(), 'dd MMM yyyy')}</span>
                        </div>
                    </div>

                    {/* Salary Details Table */}
                    <div className="border rounded-lg overflow-hidden mb-8">
                        <div className="grid grid-cols-2 bg-gray-50 border-b">
                            <div className="p-3 font-semibold text-center border-r">Earnings</div>
                            <div className="p-3 font-semibold text-center">Deductions</div>
                        </div>
                        <div className="grid grid-cols-2">
                            {/* Earnings Column */}
                            <div className="border-r">
                                <div className="flex justify-between p-2 border-b border-dashed">
                                    <span>Basic Salary</span>
                                    <span>{slip.basic_salary.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between p-2 border-b border-dashed">
                                    <span>HRA</span>
                                    <span>{slip.hra.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between p-2 border-b border-dashed">
                                    <span>Special Allowance</span>
                                    <span>{slip.da.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between p-2 border-b border-dashed">
                                    <span>Reimbursements</span>
                                    <span>{slip.reimbursements.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between p-2 bg-gray-50 font-bold mt-4">
                                    <span>Total Earnings</span>
                                    <span>{slip.gross_salary.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Deductions Column */}
                            <div>
                                <div className="flex justify-between p-2 border-b border-dashed">
                                    <span>Provident Fund</span>
                                    <span>{slip.deductions.pf.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between p-2 border-b border-dashed">
                                    <span>Professional Tax</span>
                                    <span>{slip.deductions.tax.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between p-2 border-b border-dashed">
                                    <span>Loss of Pay</span>
                                    <span>{slip.deductions.loss_of_pay.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between p-2 border-b border-dashed">
                                    <span>Other Deductions</span>
                                    <span>{slip.deductions.other.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between p-2 bg-gray-50 font-bold mt-4">
                                    <span>Total Deductions</span>
                                    <span>{(slip.deductions.pf + slip.deductions.tax + slip.deductions.loss_of_pay + slip.deductions.other).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Net Pay */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex justify-between items-center mb-8">
                        <div>
                            <p className="text-sm text-gray-600">Net Payable Amount</p>
                            <p className="text-xs text-gray-500 mt-1">
                                (Total Earnings - Total Deductions)
                            </p>
                        </div>
                        <div className="text-2xl font-bold text-primary">
                            ${slip.net_salary.toLocaleString()}
                        </div>
                    </div>

                    <p className="text-xs text-center text-gray-400">
                        This is a computer-generated document and does not require a signature.
                    </p>
                </div>

                <div className="flex justify-end gap-3 mt-4 print:hidden">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </Button>
                    <Button>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
