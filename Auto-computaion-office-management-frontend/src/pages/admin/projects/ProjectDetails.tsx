import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Calendar, CheckCircle, DollarSign, FileText, Plus, Target } from "lucide-react";
import { useNotification } from "@/components/NotificationProvider";
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


const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const ProjectDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showSuccess, showError } = useNotification();
    const [project, setProject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Modals
    const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

    // Forms
    const [newMilestone, setNewMilestone] = useState({ name: "", due_date: "", status: "Pending" });
    const [newExpense, setNewExpense] = useState({ title: "", amount: 0, category: "", incurred_date: "" });
    const [newInvoice, setNewInvoice] = useState({ invoice_number: "", amount: 0, due_date: "", status: "Unpaid" });

    const fetchProjectDetails = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/projects/${id}`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setProject(data);
            } else {
                showError("Failed to fetch project details");
                navigate("/admin/projects");
            }
        } catch (error) {
            console.error("Failed to fetch project", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchProjectDetails();
    }, [id]);

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
        } catch (err: any) {
            showError(err.message);
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
        } catch (err: any) {
             showError(err.message);
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
        } catch (err: any) {
             showError(err.message);
        }
    };

    if (isLoading) return <div className="p-10 text-center">Loading...</div>;
    if (!project) return <div className="p-10 text-center">Project not found</div>;

    // Calculations
    const totalMilestones = project.milestones?.length || 0;
    const completedMilestones = project.milestones?.filter((m: any) => m.status === 'Completed').length || 0;
    const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
    
    const budgetUsage = project.estimated_budget > 0 ? (project.actual_cost / project.estimated_budget) * 100 : 0;

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
             {/* Header */}
            <div className="mb-6">
                <Button variant="ghost" onClick={() => navigate("/admin/projects")} className="pl-0 mb-4 hover:bg-transparent hover:text-blue-600">
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
                        <DollarSign className="h-4 w-4 text-green-500" />
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
                        <Calendar className="h-4 w-4 text-amber-500" />
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
                        {project.milestones && project.milestones.map((milestone: any) => (
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
                            <h3 className="text-lg font-semibold flex items-center gap-2"><DollarSign className="h-5 w-5" /> Expenses</h3>
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
                                    {project.expenses && project.expenses.map((expense: any) => (
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
                                    {project.invoices && project.invoices.map((inv: any) => (
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
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Milestone</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Milestone Name</Label>
                            <Input value={newMilestone.name} onChange={(e) => setNewMilestone({...newMilestone, name: e.target.value})} placeholder="e.g. Design Phase Approval" />
                        </div>
                        <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Input type="date" value={newMilestone.due_date} onChange={(e) => setNewMilestone({...newMilestone, due_date: e.target.value})} />
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleAddMilestone}>Add Milestone</Button></DialogFooter>
                </DialogContent>
            </Dialog>

             {/* Add Expense Modal */}
            <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
                <DialogContent>
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
                             <div className="space-y-2">
                                <Label>Date</Label>
                                <Input type="date" value={newExpense.incurred_date} onChange={(e) => setNewExpense({...newExpense, incurred_date: e.target.value})} />
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
                <DialogContent>
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
                             <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input type="date" value={newInvoice.due_date} onChange={(e) => setNewInvoice({...newInvoice, due_date: e.target.value})} />
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
