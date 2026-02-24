import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Calendar as CalendarIcon, CheckCircle, IndianRupee, Plus, Edit, Trash2, Target, FileText } from "lucide-react";
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
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";



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
    budget: number;
    actual_cost: number;
    deadline: string;
    milestones: Milestone[];
    expenses: Expense[];
    invoices: Invoice[];
    category?: string;
    department?: string;
}

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

// Backend data is used exclusively

const ProjectDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showSuccess, showError } = useNotification();
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Modals
    const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

    // Forms
    const [newMilestone, setNewMilestone] = useState({ name: "", due_date: "", status: "Pending" });
    const [newExpense, setNewExpense] = useState({ title: "", amount: 0, category: "", incurred_date: "" });
    const [isMilestoneDateOpen, setIsMilestoneDateOpen] = useState(false);
    const [isExpenseDateOpen, setIsExpenseDateOpen] = useState(false);

    // State for deleting project
    const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
    const [adminPassword, setAdminPassword] = useState("");
    const [isDeletingProject, setIsDeletingProject] = useState(false);

    // State for deleting expense
    const [isDeleteExpenseOpen, setIsDeleteExpenseOpen] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);
    const [isDeletingExpense, setIsDeletingExpense] = useState(false);


    const fetchProjectDetails = React.useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/projects/${id}`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setProject(data);
            } else {
                showError("Failed to fetch project details");
                const basePath = window.location.pathname.startsWith('/super-admin') ? '/super-admin' : '/admin';
                navigate(`${basePath}/projects`);
            }
        } catch (error) {
            console.error("Failed to fetch project", error);
            showError("Failed to fetch project due to network error");
        } finally {
            setIsLoading(false);
        }
    }, [id, showError, navigate]);

    useEffect(() => {
        if (id) fetchProjectDetails();
    }, [id, fetchProjectDetails]);

    const handleAddMilestone = async () => {
        if (!newMilestone.name.trim() || !newMilestone.due_date) {
            showError("Please fill in all required fields (Name and Due Date)");
            return;
        }
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
        if (!newExpense.title.trim() || !newExpense.category.trim() || !newExpense.incurred_date || newExpense.amount <= 0) {
            showError("Please fill in all required fields (Title, Amount, Category, and Date)");
            return;
        }
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

    const handleDeleteExpense = async () => {
        if (!expenseToDelete) return;
        setIsDeletingExpense(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/projects/${id}/expenses/${expenseToDelete}`, {
                method: "DELETE",
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to delete expense");
            showSuccess("Expense deleted");
            setIsDeleteExpenseOpen(false);
            setExpenseToDelete(null);
            fetchProjectDetails();
        } catch (err) {
            if (err instanceof Error) showError(err.message);
        } finally {
            setIsDeletingExpense(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!project) return;
        setIsDeletingProject(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/projects/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ password: adminPassword })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to delete project");
            }
            showSuccess("Project deleted successfully");
            setIsDeleteProjectOpen(false);
            setAdminPassword("");
            const basePath = window.location.pathname.startsWith('/super-admin') ? '/super-admin' : '/admin';
            navigate(`${basePath}/projects`);
        } catch (err) {
             if (err instanceof Error) showError(err.message);
        } finally {
            setIsDeletingProject(false);
        }
    };

    const handleUpdateMilestoneStatus = async (milestoneId: number, status: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/projects/${id}/milestones/${milestoneId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error("Failed to update milestone status");
            showSuccess("Milestone status updated");
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
    const budgetUsage = project.budget > 0 ? (project.actual_cost / project.budget) * 100 : 0;

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
             {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <Button variant="ghost" onClick={() => {
                        const basePath = window.location.pathname.startsWith('/super-admin') ? '/super-admin' : '/admin';
                        navigate(`${basePath}/projects`);
                    }} className="pl-0 hover:bg-transparent hover:text-blue-600">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
                    </Button>
                    <div className="flex items-center gap-2">
                         <Button variant="outline" size="sm" onClick={() => {
                             const basePath = window.location.pathname.startsWith('/super-admin') ? '/super-admin' : '/admin';
                             navigate(`${basePath}/projects/${id}/edit`);
                         }}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Project
                        </Button>
                        <Button variant="destructive"  size="sm" onClick={() => setIsDeleteProjectOpen(true)} style={{backgroundColor : 'red' , color:'white'}}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Project
                        </Button>
                    </div>
                </div>
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
                        <div className="text-sm text-slate-500 mb-1">of ₹{Number(project.budget).toLocaleString()}</div>
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
                 <TabsList className="bg-[#e3e2e1] dark:bg-slate-800 border border-[#e3e2e1] dark:border-slate-800 p-1.5 h-auto">
                    <TabsTrigger value="milestones" className="px-6 py-2.5 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all font-medium">Milestones</TabsTrigger>
                    <TabsTrigger value="finance" className="px-6 py-2.5 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all font-medium">Finance (Expenses & Invoices)</TabsTrigger>
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
                                     <div className={`p-2 rounded-full ${milestone.status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-[#e3e2e1] text-slate-500'}`}>
                                        <CheckCircle size={20} />
                                    </div>
                                    <div>
                                        <h4 className={`font-semibold ${milestone.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>{milestone.name}</h4>
                                        <p className="text-xs text-slate-500">Due: {milestone.due_date ? new Date(milestone.due_date).toLocaleDateString() : 'No date'}</p>
                                    </div>
                                </div>
                                <Select 
                                    value={milestone.status} 
                                    onValueChange={(val) => handleUpdateMilestoneStatus(milestone.id, val)}
                                >
                                    <SelectTrigger className="w-[140px] h-8 text-xs font-medium bg-white dark:bg-slate-900">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800 shadow-md">
                                        <SelectItem value="Pending" className="cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-800">Pending</SelectItem>
                                        <SelectItem value="In Progress" className="cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-800">In Progress</SelectItem>
                                        <SelectItem value="Completed" className="cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-800">Completed</SelectItem>
                                        <SelectItem value="On Hold" className="cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-800">On Hold</SelectItem>
                                    </SelectContent>
                                </Select>
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
                        <div className="border border-[#e3e2e1] dark:border-slate-800 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#e3e2e1] dark:bg-slate-900 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Title</th>
                                        <th className="px-4 py-3">Category</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e3e2e1] dark:divide-slate-800 bg-white dark:bg-slate-950">
                                    {project.expenses && project.expenses.map((expense) => (
                                        <tr key={expense.id}>
                                            <td className="px-4 py-3 font-medium">{expense.title}</td>
                                            <td className="px-4 py-3 text-slate-500">{expense.category}</td>
                                            <td className="px-4 py-3 text-slate-500">{expense.incurred_date ? new Date(expense.incurred_date).toLocaleDateString() : '-'}</td>
                                            <td className="px-4 py-3 text-right font-medium">₹{Number(expense.amount).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => {
                                                        setExpenseToDelete(expense.id);
                                                        setIsDeleteExpenseOpen(true);
                                                    }}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                     {(!project.expenses || project.expenses.length === 0) && (
                                        <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No expenses recorded.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Invoices Section */}
                    <div className="pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2"><FileText className="h-5 w-5" /> Invoices</h3>
                        </div>
                        <Card className="p-8 border-dashed border-2 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-900/20">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mb-4">
                                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Invoices Coming Soon</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                                Invoices for this project will be managed and displayed via the integrated **Invoice Management System**.
                            </p>
                        </Card>
                    </div>

                </TabsContent>
            </Tabs>

             {/* --- MODALS --- */}
             
             {/* Add Milestone Modal */}
            <Dialog open={isMilestoneModalOpen} onOpenChange={setIsMilestoneModalOpen}>
                <DialogContent className="bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800">
                    <DialogHeader><DialogTitle>Add Milestone</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Milestone Name <span className="text-red-500">*</span></Label>
                            <Input value={newMilestone.name} onChange={(e) => setNewMilestone({...newMilestone, name: e.target.value})} placeholder="e.g. Design Phase Approval" />
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label>Due Date <span className="text-red-500">*</span></Label>
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
                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
                <DialogContent className="bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800">
                    <DialogHeader><DialogTitle>Log Expense</DialogTitle></DialogHeader>
                     <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Title <span className="text-red-500">*</span></Label>
                            <Input value={newExpense.title} onChange={(e) => setNewExpense({...newExpense, title: e.target.value})} placeholder="e.g. Server Costs" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Amount <span className="text-red-500">*</span></Label>
                                <Input type="number" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
                            </div>
                             <div className="space-y-2 flex flex-col">
                                <Label>Date <span className="text-red-500">*</span></Label>
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
                            <Label>Category <span className="text-red-500">*</span></Label>
                            <Input value={newExpense.category} onChange={(e) => setNewExpense({...newExpense, category: e.target.value})} placeholder="e.g. Software, Travel" />
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleAddExpense}>Log Expense</Button></DialogFooter>
                </DialogContent>
            </Dialog>



            {/* Delete Project Modal */}
            <Dialog open={isDeleteProjectOpen} onOpenChange={(open) => {
                setIsDeleteProjectOpen(open);
                if (!open) setAdminPassword("");
            }}>
                <DialogContent className="bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle>Delete Project</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this project? This action cannot be undone. All associated milestones, expenses, invoices, and files will also be deleted.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {project.status !== "Not Started" && (
                            <div className="space-y-2">
                                <Label htmlFor="adminPassword">Admin Password Required</Label>
                                <Input 
                                    id="adminPassword" 
                                    type="password" 
                                    placeholder="Enter your admin password to confirm"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                />
                                <p className="text-xs text-red-500 mt-1">
                                    Because this project is {project.status}, you must enter your password to delete it.
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteProjectOpen(false)} style={{cursor:'pointer'}}>Cancel</Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDeleteProject}
                            disabled={isDeletingProject || (project.status !== "Not Started" && !adminPassword)}
                            style={{backgroundColor:'red' , color:'white', cursor:'pointer'}}
                        >
                            {isDeletingProject ? "Deleting..." : "Delete Project"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Expense Modal */}
            <Dialog open={isDeleteExpenseOpen} onOpenChange={setIsDeleteExpenseOpen}>
                <DialogContent className="bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle>Delete Expense</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this expense? This will automatically decrease the project's actual cost. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteExpenseOpen(false)} style={{cursor:'pointer'}}>Cancel</Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDeleteExpense}
                            disabled={isDeletingExpense}
                            style={{backgroundColor:'red' , color:'white', cursor:'pointer'}}
                        >
                            {isDeletingExpense ? "Deleting..." : "Delete Expense"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default ProjectDetails;
