import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Calendar as CalendarIcon, CheckCircle, IndianRupee, FileText, Plus, Target } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotification } from "@/components/useNotification";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";



interface Milestone {
    id: number;
    name: string;
    due_date: string;
    status: string;
}

interface Expense {
    id: number;
    title: string;
    category: string;
    incurred_date: string;
    amount: number;
}

interface Invoice {
    id: number;
    invoice_number: string;
    due_date: string;
    status: 'Paid' | 'Unpaid' | 'Overdue';
    amount: number;
}

interface Project {
    id: number;
    name: string;
    status: string;
    description: string;
    client_name: string;
    estimated_budget: number;
    actual_cost: number;
    deadline: string;
    milestones: Milestone[];
    expenses: Expense[];
    invoices: Invoice[];
    category?: string;
    department?: string;
}

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

// Dummy Data for fallback
const dummyProjects: Project[] = [
    {
        id: 1,
        name: "Website Redesign",
        status: "In Progress",
        deadline: "2024-12-31",
        description: "Revamp the corporate website with new branding and improved UX.",
        client_name: "Acme Corp",
        estimated_budget: 15000,
        actual_cost: 4500,
        category: "Web Development",
        department: "Design",
        milestones: [
            { id: 1, name: "Design Mockups", due_date: "2024-06-15", status: "Completed" },
            { id: 2, name: "Frontend Development", due_date: "2024-08-01", status: "Pending" },
            { id: 3, name: "Backend Integration", due_date: "2024-09-15", status: "Pending" },
            { id: 4, name: "UAT Testing", due_date: "2024-11-01", status: "Pending" }
        ],
        expenses: [
            { id: 1, title: "Stock Photos", amount: 500, category: "Assets", incurred_date: "2024-05-20" },
            { id: 2, title: "Figma License", amount: 4000, category: "Software", incurred_date: "2024-01-10" }
        ],
        invoices: [
            { id: 1, invoice_number: "INV-001", amount: 5000, due_date: "2024-05-01", status: "Paid" }
        ]
    },
    {
        id: 2,
        name: "Mobile App Development",
        status: "On Hold",
        deadline: "2024-10-15",
        description: "iOS and Android app for customer loyalty program.",
        client_name: "RetailPlus",
        estimated_budget: 25000,
        actual_cost: 12000,
        category: "Mobile App",
        department: "Engineering",
        milestones: [],
        expenses: [],
        invoices: []
    },
    {
        id: 3,
        name: "Marketing Campaign Q4",
        status: "Not Started",
        deadline: "2024-11-01",
        description: "Social media and email marketing strategy for holiday season.",
        client_name: "Internal",
        estimated_budget: 5000,
        actual_cost: 0,
        category: "Marketing",
        department: "Marketing",
        milestones: [],
        expenses: [],
        invoices: []
    },
    {
        id: 4,
        name: "Internal HR Portal",
        status: "Completed",
        deadline: "2024-08-30",
        description: "Employee self-service portal for leave and benefits.",
        client_name: "Internal",
        estimated_budget: 8000,
        actual_cost: 7800,
        category: "Web Development",
        department: "HR",
         milestones: [
            { id: 1, name: "Requirements Gathering", due_date: "2024-02-01", status: "Completed" },
            { id: 2, name: "Development", due_date: "2024-05-01", status: "Completed" },
            { id: 3, name: "Testing", due_date: "2024-07-01", status: "Completed" },
            { id: 4, name: "Deployment", due_date: "2024-08-15", status: "Completed" }
        ],
        expenses: [],
        invoices: []
    },
    {
        id: 5,
        name: "SEO Optimization",
        status: "In Progress",
        deadline: "2024-09-30",
        description: "Improve search engine ranking for main product pages.",
        client_name: "TechStart",
        estimated_budget: 3000,
        actual_cost: 1500,
        category: "SEO",
        department: "Marketing",
        milestones: [],
        expenses: [],
        invoices: []
    }
];

const ProjectDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showSuccess, showError } = useNotification();
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Modals
    const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

    // Forms
    const [newMilestone, setNewMilestone] = useState({ name: "", due_date: "", status: "Pending" });
    const [newExpense, setNewExpense] = useState({ title: "", amount: 0, category: "", incurred_date: "" });
    const [newInvoice, setNewInvoice] = useState({ invoice_number: "", amount: 0, due_date: "", status: "Unpaid" });
    const [isMilestoneDateOpen, setIsMilestoneDateOpen] = useState(false);
    const [isExpenseDateOpen, setIsExpenseDateOpen] = useState(false);
    const [isInvoiceDateOpen, setIsInvoiceDateOpen] = useState(false);


    const fetchProjectDetails = React.useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/projects/${id}`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setProject(data);
            } else {
                // Try to find in dummy data
                const dummy = dummyProjects.find(p => p.id === Number(id));
                if (dummy) {
                    setProject(dummy);
                    // Don't show error for dummy data fallback, maybe just a console log
                    console.log("Serving dummy project data");
                } else {
                    showError("Failed to fetch project details");
                    const basePath = window.location.pathname.startsWith('/super-admin') ? '/super-admin' : '/admin';
                    navigate(`${basePath}/projects`);
                }
            }
        } catch (error) {
            console.error("Failed to fetch project", error);
            // Fallback for network error
             const dummy = dummyProjects.find(p => p.id === Number(id));
             if (dummy) {
                 setProject(dummy);
             }
        } finally {
            setIsLoading(false);
        }
    }, [id, showError, navigate]);

    useEffect(() => {
        if (id) fetchProjectDetails();
    }, [id, fetchProjectDetails]);

    const handleAddMilestone = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/projects/${id}/milestones`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(newMilestone)
            });
            if (!res.ok) throw new Error("Failed to add milestone");
            showSuccess("Milestone added");
            setIsMilestoneModalOpen(false);
            setNewMilestone({ name: "", due_date: "", status: "Pending" });
            fetchProjectDetails();
        } catch (err) {
            if (err instanceof Error) showError(err.message);
        }
    };

    const handleAddExpense = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/projects/${id}/expenses`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(newExpense)
            });
            if (!res.ok) throw new Error("Failed to add expense");
            showSuccess("Expense added");
            setIsExpenseModalOpen(false);
            setNewExpense({ title: "", amount: 0, category: "", incurred_date: "" });
            fetchProjectDetails();
        } catch (err) {
             if (err instanceof Error) showError(err.message);
        }
    };

    const handleCreateInvoice = async () => {
         try {
            const res = await fetch(`${API_BASE_URL}/admin/projects/${id}/invoices`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(newInvoice)
            });
            if (!res.ok) throw new Error("Failed to create invoice");
            showSuccess("Invoice created");
            setIsInvoiceModalOpen(false);
            setNewInvoice({ invoice_number: "", amount: 0, due_date: "", status: "Unpaid" });
            fetchProjectDetails();
        } catch (err) {
             if (err instanceof Error) showError(err.message);
        }
    };

    if (isLoading) return <div className="p-10 text-center">Loading...</div>;
    if (!project) return <div className="p-10 text-center">Project not found</div>;

    // Calculations
    const totalMilestones = project.milestones?.length || 0;
    const completedMilestones = project.milestones?.filter((m) => m.status === 'Completed').length || 0;
    const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
    
    const budgetUsage = project.estimated_budget > 0 ? (project.actual_cost / project.estimated_budget) * 100 : 0;

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
             {/* Header */}
            <div className="mb-6">
                <Button variant="ghost" onClick={() => {
                    const basePath = window.location.pathname.startsWith('/super-admin') ? '/super-admin' : '/admin';
                    navigate(`${basePath}/projects`);
                }} className="pl-0 mb-4 hover:bg-transparent hover:text-blue-600">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
                </Button>
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{project.name}</h1>
                            <Badge variant="outline">{project.status}</Badge>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 max-w-2xl">{project.description}</p>
                    </div>
                     <div className="text-right hidden md:block">
                        <p className="text-sm text-slate-500">Client</p>
                        <p className="font-medium">{project.client_name || "Internal"}</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                 <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-slate-500 font-medium">Project Progress</span>
                        <Target className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold mb-2">{Math.round(progress)}%</div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-slate-500 mt-2">{completedMilestones} of {totalMilestones} milestones completed</p>
                </Card>

                 <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-slate-500 font-medium">Budget Usage</span>
                        <IndianRupee className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex justify-between items-end mb-2">
                        <div className="text-2xl font-bold">₹{Number(project.actual_cost).toLocaleString()}</div>
                        <div className="text-sm text-slate-500 mb-1">of ₹{Number(project.estimated_budget).toLocaleString()}</div>
                    </div>
                    <Progress value={budgetUsage} className={`h-2 ${budgetUsage > 100 ? "bg-red-200" : ""}`} indicatorClassName={budgetUsage > 100 ? "bg-red-500" : ""} />
                    <p className="text-xs text-slate-500 mt-2">{budgetUsage > 100 ? "Over Budget" : "Within Budget"}</p>
                </Card>

                 <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-slate-500 font-medium">Time Remaining</span>
                        <CalendarIcon className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold mb-2">
                        {project.deadline ? 
                            Math.ceil((new Date(project.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) 
                        : "N/A"} Days
                    </div>
                    <p className="text-xs text-slate-500">Deadline: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}</p>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="milestones" className="space-y-6">
                 <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1">
                    <TabsTrigger value="milestones" className="px-4 py-2">Milestones</TabsTrigger>
                    <TabsTrigger value="finance" className="px-4 py-2">Finance (Expenses & Invoices)</TabsTrigger>
                </TabsList>

                {/* MILESTONES TAB */}
                <TabsContent value="milestones" className="space-y-4">
                     <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Project Milestones</h3>
                        <Button size="sm" onClick={() => setIsMilestoneModalOpen(true)} className="bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                            <Plus className="mr-2 h-4 w-4" /> Add Milestone
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {project.milestones && project.milestones.map((milestone) => (
                            <Card key={milestone.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                <div className="flex items-center gap-4">
                                     <div className={`p-2 rounded-full ${milestone.status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                        <CheckCircle size={20} />
                                    </div>
                                    <div>
                                        <h4 className={`font-semibold ${milestone.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>{milestone.name}</h4>
                                        <p className="text-xs text-slate-500">Due: {milestone.due_date ? new Date(milestone.due_date).toLocaleDateString() : 'No date'}</p>
                                    </div>
                                </div>
                                <Badge variant={milestone.status === 'Completed' ? 'default' : 'outline'}>{milestone.status}</Badge>
                            </Card>
                        ))}
                         {(!project.milestones || project.milestones.length === 0) && <p className="text-center text-slate-500 py-8">No milestones created yet.</p>}
                    </div>
                </TabsContent>

                {/* FINANCE TAB */}
                <TabsContent value="finance" className="space-y-8">
                    
                    {/* Expenses Section */}
                    <div>
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2"><IndianRupee className="h-5 w-5" /> Expenses</h3>
                            <Button size="sm" variant="outline" onClick={() => setIsExpenseModalOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Log Expense
                            </Button>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Title</th>
                                        <th className="px-4 py-3">Category</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
                                    {project.expenses && project.expenses.map((expense) => (
                                        <tr key={expense.id}>
                                            <td className="px-4 py-3 font-medium">{expense.title}</td>
                                            <td className="px-4 py-3 text-slate-500">{expense.category}</td>
                                            <td className="px-4 py-3 text-slate-500">{expense.incurred_date ? new Date(expense.incurred_date).toLocaleDateString() : '-'}</td>
                                            <td className="px-4 py-3 text-right font-medium">₹{Number(expense.amount).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                     {(!project.expenses || project.expenses.length === 0) && (
                                        <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No expenses recorded.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Invoices Section */}
                    <div>
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2"><FileText className="h-5 w-5" /> Invoices</h3>
                            <Button size="sm" variant="outline" onClick={() => setIsInvoiceModalOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Create Invoice
                            </Button>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Invoice #</th>
                                        <th className="px-4 py-3">Due Date</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
                                    {project.invoices && project.invoices.map((inv) => (
                                        <tr key={inv.id}>
                                            <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                                            <td className="px-4 py-3 text-slate-500">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}</td>
                                            <td className="px-4 py-3">
                                                 <Badge variant={inv.status === 'Paid' ? 'default' : inv.status === 'Overdue' ? 'destructive' : 'outline'}>{inv.status}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">₹{Number(inv.amount).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {(!project.invoices || project.invoices.length === 0) && (
                                        <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No invoices generated.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </TabsContent>
            </Tabs>

             {/* --- MODALS --- */}
             
             {/* Add Milestone Modal */}
            <Dialog open={isMilestoneModalOpen} onOpenChange={setIsMilestoneModalOpen}>
                <DialogContent className="bg-white dark:bg-slate-900">
                    <DialogHeader><DialogTitle>Add Milestone</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Milestone Name</Label>
                            <Input value={newMilestone.name} onChange={(e) => setNewMilestone({...newMilestone, name: e.target.value})} placeholder="e.g. Design Phase Approval" />
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label>Due Date</Label>
                            <Popover open={isMilestoneDateOpen} onOpenChange={setIsMilestoneDateOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={`w-full justify-start text-left font-normal ${!newMilestone.due_date && "text-muted-foreground"}`}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {newMilestone.due_date ? format(new Date(newMilestone.due_date), "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={newMilestone.due_date ? new Date(newMilestone.due_date) : undefined}
                                        onSelect={(date) => {
                                            setNewMilestone({...newMilestone, due_date: date ? format(date, "yyyy-MM-dd") : ""});
                                            setIsMilestoneDateOpen(false);
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleAddMilestone}>Add Milestone</Button></DialogFooter>
                </DialogContent>
            </Dialog>

             {/* Add Expense Modal */}
            <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
                <DialogContent className="bg-white dark:bg-slate-900">
                    <DialogHeader><DialogTitle>Log Expense</DialogTitle></DialogHeader>
                     <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input value={newExpense.title} onChange={(e) => setNewExpense({...newExpense, title: e.target.value})} placeholder="e.g. Server Costs" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Amount</Label>
                                <Input type="number" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
                            </div>
                             <div className="space-y-2 flex flex-col">
                                <Label>Date</Label>
                                <Popover open={isExpenseDateOpen} onOpenChange={setIsExpenseDateOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={`w-full justify-start text-left font-normal ${!newExpense.incurred_date && "text-muted-foreground"}`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {newExpense.incurred_date ? format(new Date(newExpense.incurred_date), "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={newExpense.incurred_date ? new Date(newExpense.incurred_date) : undefined}
                                            onSelect={(date) => {
                                                setNewExpense({...newExpense, incurred_date: date ? format(date, "yyyy-MM-dd") : ""});
                                                setIsExpenseDateOpen(false);
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label>Category</Label>
                            <Input value={newExpense.category} onChange={(e) => setNewExpense({...newExpense, category: e.target.value})} placeholder="e.g. Software, Travel" />
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleAddExpense}>Log Expense</Button></DialogFooter>
                </DialogContent>
            </Dialog>

             {/* Create Invoice Modal */}
            <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
                <DialogContent className="bg-white dark:bg-slate-900">
                    <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
                     <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Invoice Number</Label>
                            <Input value={newInvoice.invoice_number} onChange={(e) => setNewInvoice({...newInvoice, invoice_number: e.target.value})} placeholder="e.g. INV-2023-001" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Amount</Label>
                                <Input type="number" value={newInvoice.amount} onChange={(e) => setNewInvoice({...newInvoice, amount: Number(e.target.value)})} />
                            </div>
                             <div className="space-y-2 flex flex-col">
                                <Label>Due Date</Label>
                                <Popover open={isInvoiceDateOpen} onOpenChange={setIsInvoiceDateOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={`w-full justify-start text-left font-normal ${!newInvoice.due_date && "text-muted-foreground"}`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {newInvoice.due_date ? format(new Date(newInvoice.due_date), "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={newInvoice.due_date ? new Date(newInvoice.due_date) : undefined}
                                            onSelect={(date) => {
                                                setNewInvoice({...newInvoice, due_date: date ? format(date, "yyyy-MM-dd") : ""});
                                                setIsInvoiceDateOpen(false);
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleCreateInvoice}>Generate Invoice</Button></DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default ProjectDetails;
