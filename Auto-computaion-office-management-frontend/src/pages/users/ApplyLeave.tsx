import React, { useState, useEffect } from "react";
import { useNotification } from "../../components/NotificationProvider";
import { format, differenceInDays } from "date-fns";
import {
    Clock,
    FileText,
    CheckCircle2,
    XCircle,
    Briefcase,
    Plane,
    Stethoscope,
    Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// --- Types ---
type LeaveType = "sick" | "casual" | "privilege";
type LeaveStatus = "pending" | "approved" | "rejected";

interface LeaveBalance {
    type: LeaveType;
    label: string;
    total: number;
    used: number;
    color: string;
    icon: React.ReactNode;
}

interface LeaveRequest {
    id: string;
    type: LeaveType;
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
    status: LeaveStatus;
    appliedOn: string;
}

interface FormData {
    leaveType: LeaveType;
    startDate: Date | undefined;
    endDate: Date | undefined;
    reason: string;
}

// --- Mock Data Removed ---

const ApplyLeave: React.FC = () => {
    // --- State ---
    const [isStartDateOpen, setIsStartDateOpen] = useState(false);
    const [isEndDateOpen, setIsEndDateOpen] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        leaveType: "casual",
        startDate: undefined,
        endDate: undefined,
        reason: "",
    });
    const [totalDays, setTotalDays] = useState(0);
    const [history, setHistory] = useState<LeaveRequest[]>([]);
    const [balances, setBalances] = useState<LeaveBalance[]>([]); // Dynamic Balances
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { showSuccess, showError } = useNotification();
    const API_BASE_URL = import.meta.env.VITE_BASE_URL;

    // --- Fetch Data ---
    const fetchLeaves = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/employee/leaves/all`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                // Map backend data to frontend interface
                const mappedHistory: LeaveRequest[] = data.map((item: { id: number | string; type: LeaveType; start_date: string; end_date?: string; days?: number | string; reason: string; status: string; created_at?: string }) => ({
                    id: item.id.toString(),
                    type: item.type,
                    startDate: item.start_date,
                    endDate: item.end_date || item.start_date, // Fallback if end_date missing
                    days: parseInt(String(item.days)) || 1,
                    reason: item.reason,
                    status: item.status.toLowerCase(), // Ensure lowercase for badge logic
                    appliedOn: item.created_at || "" // Not used in UI but required by type
                }));
                setHistory(mappedHistory);
            }
        } catch (error) {
            console.error("Failed to fetch leaves:", error);
        }
    };

    const fetchBalances = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/employee/leaves/summary`, { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                // Map icons based on type
                const mappedBalances = data.map((b: { type: LeaveType; label: string; total: number; used: number; color: string; }) => ({
                    ...b,
                    icon: b.type === 'sick' ? <Stethoscope size={20} /> : b.type === 'casual' ? <Plane size={20} /> : <Briefcase size={20} />
                }));
                setBalances(mappedBalances);
            }
        } catch (error) {
            console.error("Failed to fetch balances:", error);
        }
    };

    // --- Effects ---
    useEffect(() => {
        fetchLeaves();
        fetchBalances();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (formData.startDate && formData.endDate) {
            calculateDays(formData.startDate, formData.endDate);
        } else {
            setTotalDays(0);
        }
    }, [formData.startDate, formData.endDate]);

    // --- Helpers ---
    const calculateDays = (start: Date, end: Date) => {
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

        const days = differenceInDays(end, start) + 1;
        setTotalDays(days > 0 ? days : 0);
    };

    const getStatusBadge = (status: LeaveStatus) => {
        switch (status) {
            case "approved":
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"><CheckCircle2 size={12} className="mr-1" /> Approved</Badge>;
            case "rejected":
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"><XCircle size={12} className="mr-1" /> Rejected</Badge>;
            default:
                return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"><Clock size={12} className="mr-1" /> Pending</Badge>;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!formData.startDate || !formData.endDate || !formData.reason) {
            showError("Please fill in all required fields.");
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/employee/leaves/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: formData.leaveType,
                    start_date: format(formData.startDate, 'yyyy-MM-dd'),
                    end_date: format(formData.endDate, 'yyyy-MM-dd'),
                    reason: formData.reason
                }),
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit leave request");
            }

            showSuccess(data.message || "Leave applied successfully!");

            // Refresh history
            fetchLeaves();

            // Reset form
            setFormData({
                leaveType: "casual",
                startDate: undefined,
                endDate: undefined,
                reason: "",
            });
            setTotalDays(0);

        } catch (error) {
            console.error("Leave application error:", error);
            showError((error as Error).message || "Something went wrong.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            <div className="space-y-8">
                {/* Header (Sticky & Optimized) */}
                <div className="lg:sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 border-b border-slate-200/50 dark:border-slate-800/50 mb-6 transition-all duration-200 shadow-sm shadow-slate-200/50 dark:shadow-slate-900/50">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 max-sm:hidden">Apply for Leave</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your time off and view leave history.</p>
                </div>

                {/* Leave Balances */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {balances.map((balance) => (
                        <Card key={balance.type} className="p-6 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-900">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${balance.color}`}>
                                    {balance.icon}
                                </div>
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {balance.total - balance.used}
                                </span>
                            </div>
                            <h3 className="font-semibold text-slate-700 dark:text-slate-200">{balance.label}</h3>
                            <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${balance.type === 'sick' ? 'bg-red-500' : balance.type === 'casual' ? 'bg-amber-500' : 'bg-blue-500'}`}
                                    style={{ width: `${(balance.used / balance.total) * 100}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                {balance.used} used of {balance.total} days
                            </p>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Application Form */}
                    <Card className="lg:col-span-2 p-6 md:p-8 border-slate-200 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">New Application</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Fill out the form below to request leave.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Leave Type Select */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Leave Type</label>
                                    <Select value={formData.leaveType} onValueChange={(val) => setFormData(prev => ({ ...prev, leaveType: val as LeaveType }))}>
                                        <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                                            <SelectItem value="Casual" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 dark:text-white">Casual Leave</SelectItem>
                                            <SelectItem value="Sick" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 dark:text-white">Sick Leave</SelectItem>
                                            <SelectItem value="Privilege" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 dark:text-white">Privilege Leave</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Total Duration Display */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">Total Duration</label>
                                    <div className="h-10 px-3 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-md text-sm text-slate-600 dark:text-slate-400 flex items-center font-semibold">
                                        {totalDays > 0 ? `${totalDays} Day${totalDays > 1 ? 's' : ''}` : 'Select dates below'}
                                    </div>
                                </div>

                                <div className="space-y-2 flex flex-col">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">From Date</label>
                                    <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={`w-full justify-start text-left font-normal bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white ${!formData.startDate && "text-muted-foreground"}`}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {formData.startDate ? format(formData.startDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={formData.startDate}
                                                onSelect={(date) => {
                                                    setFormData(prev => ({ ...prev, startDate: date }));
                                                    setIsStartDateOpen(false);
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2 flex flex-col">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">To Date</label>
                                    <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={`w-full justify-start text-left font-normal bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white ${!formData.endDate && "text-muted-foreground"}`}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {formData.endDate ? format(formData.endDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={formData.endDate}
                                                onSelect={(date) => {
                                                    setFormData(prev => ({ ...prev, endDate: date }));
                                                    setIsEndDateOpen(false);
                                                }}
                                                disabled={(date) => formData.startDate ? date < formData.startDate : false}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            {/* Reason Textarea */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Reason for Leave</label>
                                <textarea
                                    required
                                    value={formData.reason}
                                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                    className="flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus-visible:ring-indigo-500"
                                    placeholder="Please describe the reason for your leave request..."
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4 flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || totalDays <= 0}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[150px] transition-colors"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                                </Button>
                            </div>
                        </form>
                    </Card>

                    {/* Recent History Sidebar */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Clock size={20} className="text-slate-400" /> Recent History
                        </h3>
                        <div className="space-y-4">
                            {/* Scrollable list if too many */}
                            <div className="max-h-[500px] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                                {history.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">No leave history found.</div>
                                ) : (
                                    history.map((req) => (
                                        <Card key={req.id} className="p-4 border-slate-200 dark:border-slate-800 flex flex-col gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors bg-white dark:bg-slate-900">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{req.type}</span>
                                                    <h4 className="font-bold text-slate-900 dark:text-white mt-1 text-sm">
                                                        {new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </h4>
                                                </div>
                                                {getStatusBadge(req.status)}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="font-medium text-slate-700 dark:text-slate-300">{req.days} Day{req.days > 1 ? 's' : ''}</span>
                                                <span>•</span>
                                                <span className="truncate max-w-[120px]" title={req.reason}>{req.reason}</span>
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ApplyLeave;
