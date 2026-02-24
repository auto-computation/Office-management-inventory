import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Plus, Search, Users, ArrowRight, Loader2, Folder, Target, FileText, IndianRupee, X, Calendar as CalendarIcon } from "lucide-react";
import { useNotification } from "@/components/useNotification";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";


const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const ProjectsDashboard: React.FC = () => {
    const { showSuccess, showError } = useNotification();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [projects, setProjects] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [employees, setEmployees] = useState<any[]>([]); 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [clients, setClients] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [departments, setDepartments] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [categories, setCategories] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    // Form
    const [newProject, setNewProject] = useState({
        name: "",
        start_date: "",
        deadline: "",
        category: "",
        department: "",
        client_id: "",
        summary: "",
        is_public_gantt: false,
        is_public_task_board: false,
        requires_admin_approval: false,
        members: [] as string[],
        budget: 0,
        hours_estimate: 0,
        send_to_client: false,
        status: "Not Started",
        description: "", // keeping for backward compatibility if needed
        files: [] as File[],
        no_end_date: false
    });



    const fetchProjects = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/projects`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setProjects(Array.isArray(data) ? data : []);
            } else {
                setProjects([]);
            }
        } catch (error) {
            console.error("Failed to fetch projects", error);
            setProjects([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchFormData = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/emp/all`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setEmployees(data.users || []);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        }

        try {
            const res = await fetch(`${API_BASE_URL}/admin/clients`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setClients(data || []);
            }
        } catch (error) {
            console.error("Failed to fetch clients", error);
        }

        try {
            const res = await fetch(`${API_BASE_URL}/admin/departments/getAll`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setDepartments(data || []);
            }
        } catch (error) {
            console.error("Failed to fetch departments", error);
        }

        try {
            const res = await fetch(`${API_BASE_URL}/admin/projects/categories`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setCategories(data || []);
            }
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
        fetchFormData();
    }, [fetchProjects, fetchFormData]);

    const handleCreateProject = async () => {
        try {
            if (!newProject.name) {
                showError("Project name is required");
                return;
            }

            if (!newProject.start_date) {
                showError("Start date is required");
                return;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDate = new Date(newProject.start_date);
            startDate.setHours(0, 0, 0, 0);

            if (startDate < today) {
                showError("Start date cannot be in the past");
                return;
            }

            setIsSubmitting(true);

            const res = await fetch(`${API_BASE_URL}/admin/projects`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    name: newProject.name,
                    client_id: newProject.client_id || null,
                    department_id: newProject.department || null,
                    category_id: newProject.category || null,
                    summary: newProject.summary,
                    status: newProject.status,
                    start_date: newProject.start_date,
                    deadline: newProject.deadline || null,
                    budget: newProject.budget,
                    estimated_hours: newProject.hours_estimate,
                    is_public_gantt: newProject.is_public_gantt,
                    is_public_task_board: newProject.is_public_task_board,
                    requires_admin_approval: newProject.requires_admin_approval,
                    send_to_client: newProject.send_to_client,
                    description: newProject.summary || "No description provided."
                })
            });

            if (!res.ok) throw new Error("Failed to create project");
            const projectData = await res.json();

            // Handle adding members iteratively after creation
            if (newProject.members.length > 0) {
                await Promise.all(newProject.members.map(memberId => 
                    fetch(`${API_BASE_URL}/admin/projects/${projectData.id}/members`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ user_id: memberId, role: "Member" })
                    })
                ));
            }

            showSuccess("Project created successfully");
            setIsAddModalOpen(false);
            setNewProject({
                name: "",
                start_date: "",
                deadline: "",
                category: "",
                department: "",
                client_id: "",
                summary: "",
                is_public_gantt: false,
                is_public_task_board: false,
                requires_admin_approval: false,
                members: [],
                budget: 0,
                hours_estimate: 0,
                send_to_client: false,
                status: "Not Started",
                description: "",
                files: [],
                no_end_date: false
            });
            fetchProjects();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            showError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName || newCategoryName.trim() === "") return;
        
        try {
            const res = await fetch(`${API_BASE_URL}/admin/projects/categories`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ name: newCategoryName.trim() })
            });
            
            if (res.ok) {
                const newCat = await res.json();
                setCategories(prev => [...prev, newCat]);
                setNewProject({ ...newProject, category: newCat.id.toString() });
                showSuccess("Category created successfully");
            } else {
                showError("Failed to create category");
            }
        } catch (error) {
            console.error("Failed to create category", error);
            showError("Network error while creating category");
        } finally {
            setIsCategoryModalOpen(false);
            setNewCategoryName("");
        }
    };

    const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const getStatusColor = (status: string) => {
        switch(status) {
            case "Completed": return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
            case "In Progress": return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
            case "On Hold": return "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
            case "Cancelled": return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
            default: return "bg-[#e3e2e1] text-slate-700 dark:bg-slate-800 dark:text-slate-400";
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
             {/* Header */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Projects</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Track projects, milestones, and financials.</p>
                </div>
                 <Button onClick={() => setIsAddModalOpen(true)} className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" /> New Project
                </Button>
            </div>

            {/* Filters */}
             <div className="flex items-center gap-4 mb-6">
                 <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search projects..." className="pl-10 bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
            </div>

            {/* Content List */}
            {isLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500 h-8 w-8" /></div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block bg-white dark:bg-slate-900 shadow-sm rounded-xl border border-[#e3e2e1] dark:border-slate-800 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                                <TableRow>
                                    <TableHead className="font-bold">Project Name</TableHead>
                                    <TableHead className="font-bold">Status</TableHead>
                                    <TableHead className="font-bold">Client</TableHead>
                                    <TableHead className="font-bold">Budget</TableHead>
                                    <TableHead className="font-bold">Deadline</TableHead>
                                    <TableHead className="text-right font-bold w-[120px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProjects.map((project) => (
                                    <TableRow 
                                        key={project.id} 
                                        className="border-[#e3e2e1] hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                                        onClick={() => {
                                            const basePath = window.location.pathname.startsWith('/super-admin') ? '/super-admin' : '/admin';
                                            navigate(`${basePath}/projects/${project.id}`);
                                        }}
                                    >
                                        <TableCell className="font-bold text-slate-900 dark:text-white">
                                            {project.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getStatusColor(project.status)}>
                                                {project.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-600 dark:text-slate-400">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Users size={14} className="text-slate-400" />
                                                {project.client_name || "Internal"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-900 dark:text-white font-semibold">
                                            <div className="flex items-center gap-1">
                                                <IndianRupee size={14} className="text-green-500" />
                                                {Number(project.budget).toLocaleString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600 dark:text-slate-400">
                                            <div className="flex items-center gap-2 text-sm">
                                                <CalendarIcon size={14} className="text-slate-400" />
                                                {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-1 text-blue-600 font-medium text-xs">
                                                View <ArrowRight size={14} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {filteredProjects.length === 0 && (
                            <div className="py-20 text-center flex flex-col items-center justify-center">
                                <Folder className="h-16 w-16 text-slate-200 dark:text-slate-800 mb-4" />
                                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No projects found</h3>
                                <p className="text-slate-500 max-w-sm mb-6">You haven't added any projects yet, or no projects match your search criteria.</p>
                                <Button onClick={() => setIsAddModalOpen(true)} variant="outline" className="border-[#e3e2e1] dark:border-slate-700">
                                    Create your first project
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Mobile/Tablet Card View */}
                    <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredProjects.map((project) => (
                            <Card 
                                key={project.id} 
                                onClick={() => {
                                    const basePath = window.location.pathname.startsWith('/super-admin') ? '/super-admin' : '/admin';
                                    navigate(`${basePath}/projects/${project.id}`);
                                }}
                                className="group relative cursor-pointer hover:shadow-lg transition-all border-[#e3e2e1] dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                         <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                            {project.status}
                                        </div>
                                        <span className="text-xs text-slate-400">Due: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}</span>
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {project.name}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 h-10">
                                        {project.description || "No description provided."}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-[#e3e2e1] dark:border-slate-800">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <Users size={16} className="text-slate-400" />
                                            <span>{project.client_name || "Internal"}</span>
                                        </div>
                                         <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                                            <IndianRupee size={16} className="text-green-500" />
                                            <span>{Number(project.budget).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 flex justify-between items-center text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10 transition-colors">
                                    <span>View Details</span>
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Card>
                        ))}
                        {filteredProjects.length === 0 && (
                            <div className="col-span-full text-center py-12 text-slate-500">
                                No projects found. Create one to get started.
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Create Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden h-[90vh] flex flex-col bg-white dark:bg-slate-950 border border-[#e3e2e1] dark:border-slate-800 shadow-2xl">
                    <DialogHeader className="pt-6 px-8 border-b border-[#e3e2e1] dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Folder className="h-6 w-6 text-blue-600" />
                            Create New Project
                        </DialogTitle>
                        <p className="text-slate-500 dark:text-slate-400">Configure your project details, settings, and team.</p>
                    </DialogHeader>

                    <ScrollArea className="flex-1 px-8 py-6">
                        <div className="space-y-8">

                            {/* Section 1: Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-l-4 border-blue-500 pl-3">
                                    Project Details
                                </h3>
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Project Name <span className="text-red-500">*</span></Label>
                                        <Input
                                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 h-11 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                                            placeholder="Enter project name"
                                            value={newProject.name}
                                            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-slate-700 dark:text-slate-300 font-medium">Start Date <span className="text-red-500">*</span></Label>
                                            <div className="relative">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full h-11 justify-start text-left font-normal bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none",
                                                                !newProject.start_date && "text-muted-foreground",
                                                                newProject.start_date && "pr-10"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {newProject.start_date ? format(new Date(newProject.start_date), "PPP") : <span>Pick a date</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 border-slate-200 dark:border-slate-800" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={newProject.start_date ? new Date(newProject.start_date) : undefined}
                                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                            onSelect={(date) => {
                                                                // Convert to local YYYY-MM-DD string to maintain date state compatibility
                                                                if(date) {
                                                                    const dateStr = [
                                                                        date.getFullYear(),
                                                                        String(date.getMonth() + 1).padStart(2, '0'),
                                                                        String(date.getDate()).padStart(2, '0')
                                                                    ].join('-');
                                                                    setNewProject({ ...newProject, start_date: dateStr });
                                                                } else {
                                                                    setNewProject({ ...newProject, start_date: "" });
                                                                }
                                                            }}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-slate-700 dark:text-slate-300 font-medium">
                                                    Deadline {!newProject.no_end_date && <span className="text-red-500">*</span>}
                                                </Label>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="no-end-date"
                                                        checked={newProject.no_end_date}
                                                        onCheckedChange={(checked) => setNewProject({ ...newProject, no_end_date: checked as boolean, deadline: checked ? "" : newProject.deadline })}
                                                        className="rounded-full dark:border-white dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-black"
                                                    />
                                                    <label
                                                        htmlFor="no-end-date"
                                                        className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600 dark:text-slate-400 cursor-pointer"
                                                    >
                                                        No End Date
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full h-11 justify-start text-left font-normal bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none",
                                                                !newProject.deadline && "text-muted-foreground",
                                                                newProject.deadline && "pr-10"
                                                            )}
                                                            disabled={newProject.no_end_date || !newProject.start_date}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {newProject.deadline ? format(new Date(newProject.deadline), "PPP") : <span>Pick a date</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 border-slate-200 dark:border-slate-800" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={newProject.deadline ? new Date(newProject.deadline) : undefined}
                                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                            onSelect={(date) => {
                                                                if(date) {
                                                                    const dateStr = [
                                                                        date.getFullYear(),
                                                                        String(date.getMonth() + 1).padStart(2, '0'),
                                                                        String(date.getDate()).padStart(2, '0')
                                                                    ].join('-');
                                                                    setNewProject({ ...newProject, deadline: dateStr });
                                                                } else {
                                                                    setNewProject({ ...newProject, deadline: "" });
                                                                }
                                                            }}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                {newProject.deadline && !newProject.no_end_date && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setNewProject({ ...newProject, deadline: "" });
                                                        }}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-[#e3e2e1] dark:bg-slate-800" />

                            {/* Section 2: Classification */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Project Category</Label>
                                    <div className="flex gap-2">
                                        <Select value={newProject.category} onValueChange={(val) => setNewProject({ ...newProject, category: val })}>
                                            <SelectTrigger className="w-full h-11 px-4 py-2 rounded-lg border border-[#e3e2e1] dark:border-slate-600 bg-white dark:bg-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none outline-none text-slate-900 dark:text-white">
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800 w-[var(--radix-select-trigger-width)]">
                                                {categories.map((cat: { id: string | number, name: string }) => (
                                                    <SelectItem key={cat.id || cat.name} value={cat.id?.toString() || cat.name} className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            className="h-11 w-11 px-0 shrink-0 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 hover:cursor-pointer"
                                            onClick={() => setIsCategoryModalOpen(true)}
                                        >
                                            <Plus className="h-5 w-5 text-slate-500" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Department</Label>
                                    <Select value={newProject.department} onValueChange={(val) => setNewProject({ ...newProject, department: val })}>
                                        <SelectTrigger className="w-full h-11 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none outline-none text-slate-900 dark:text-white">
                                            <SelectValue placeholder="Select Department" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 w-[var(--radix-select-trigger-width)]">
                                            {departments.map((dep: { id: string | number, name: string }) => (
                                                <SelectItem key={dep.id} value={dep.id.toString()} className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">
                                                    {dep.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Client</Label>
                                    <Select value={newProject.client_id} onValueChange={(val) => setNewProject({ ...newProject, client_id: val })}>
                                        <SelectTrigger className="w-full h-11 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none outline-none text-slate-900 dark:text-white">
                                            <SelectValue placeholder="Select Client" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 w-[var(--radix-select-trigger-width)]">
                                            {clients.length > 0 ? (
                                                clients.map(client => (
                                                    <SelectItem key={client.id} value={client.id.toString()} className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">
                                                        {client.name} {client.company_name ? `- ${client.company_name}` : ''}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="none" disabled className="text-slate-500">No clients found</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300 font-medium">Project Summary</Label>
                                <Textarea
                                    className="min-h-[120px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                                    placeholder="Enter a brief summary of the project scope and objectives..."
                                    value={newProject.summary}
                                    onChange={(e) => setNewProject({ ...newProject, summary: e.target.value })}
                                />
                            </div>

                            <Separator className="bg-[#e3e2e1] dark:bg-slate-800" />

                            {/* Section 3: Settings */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-l-4 border-amber-500 pl-3">
                                    Project Settings
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                                        <Switch
                                            checked={newProject.is_public_gantt}
                                            onCheckedChange={(checked) => setNewProject({ ...newProject, is_public_gantt: checked })}
                                        />
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Public Gantt Chart</Label>
                                            <p className="text-xs text-slate-500">Visible to all users</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                                        <Switch
                                            checked={newProject.is_public_task_board}
                                            onCheckedChange={(checked) => setNewProject({ ...newProject, is_public_task_board: checked })}
                                        />
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Public Task Board</Label>
                                            <p className="text-xs text-slate-500">Visible to all users</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                                        <Switch
                                            checked={newProject.requires_admin_approval}
                                            onCheckedChange={(checked) => setNewProject({ ...newProject, requires_admin_approval: checked })}
                                        />
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Admin Approval</Label>
                                            <p className="text-xs text-slate-500">Tasks require approval</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-slate-100 dark:bg-slate-800" />

                            {/* Section 4: Budget & Resources */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-l-4 border-emerald-500 pl-3">
                                    Resources & Budget
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Add Project Members <span className="text-red-500">*</span></Label>
                                        <Select
                                            value=""
                                            onValueChange={(val) => {
                                                if (!newProject.members.includes(val)) {
                                                    setNewProject({ ...newProject, members: [...newProject.members, val] });
                                                }
                                            }}
                                            disabled={!newProject.department}
                                        >
                                            <SelectTrigger className="w-full h-11 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none outline-none text-slate-900 dark:text-white">
                                                <SelectValue placeholder="Select Members" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                {!newProject.department ? (
                                                    <div className="p-2 text-sm text-slate-500 text-center">Please select a department first</div>
                                                ) : employees.filter(e => e.department_id?.toString() === newProject.department).length === 0 ? (
                                                    <div className="p-2 text-sm text-slate-500 text-center">No employees in this department</div>
                                                ) : (
                                                    employees
                                                        .filter(member => member.department_id?.toString() === newProject.department && !newProject.members.includes(member.id.toString()))
                                                        .map(member => (
                                                            <SelectItem key={member.id} value={member.id.toString()} className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">
                                                                {member.name}
                                                            </SelectItem>
                                                        ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {/* Selected Members Chips */}
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {newProject.members.map(memberId => {
                                                const member = employees.find(m => m.id.toString() === memberId);
                                                return member ? (
                                                    <div key={memberId} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                                                        {member.name}
                                                        <button
                                                            onClick={() => setNewProject({ ...newProject, members: newProject.members.filter(id => id !== memberId) })}
                                                            className="hover:text-blue-900 dark:hover:text-blue-100 ml-1"
                                                        >
                                                            &times;
                                                        </button>
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Upload Files</Label>
                                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                            <input
                                                type="file"
                                                multiple
                                                className="hidden"
                                                id="file-upload"
                                                onChange={(e) => {
                                                    const newFiles = Array.from(e.target.files || []);
                                                    setNewProject({ ...newProject, files: [...newProject.files, ...newFiles] });
                                                    // Reset input so the same file can be selected again if needed
                                                    e.target.value = '';
                                                }}
                                            />
                                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2 mb-2">
                                                <Folder className="h-8 w-8 text-slate-400" />
                                                <span className="text-sm text-slate-500">Click to upload project files</span>
                                            </label>

                                            {/* File List */}
                                            {newProject.files.length > 0 && (
                                                <div className="mt-4 flex flex-col gap-2 max-h-32 overflow-y-auto pr-2">
                                                    {newProject.files.map((file, idx) => (
                                                        <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                                                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate" title={file.name}>
                                                                    {file.name}
                                                                </span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const updatedFiles = newProject.files.filter((_, i) => i !== idx);
                                                                    setNewProject({ ...newProject, files: updatedFiles });
                                                                }}
                                                                className="text-slate-400 hover:text-red-500 transition-colors focus:outline-none"
                                                                title="Remove file"
                                                            >
                                                                &times;
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-2 gap-6 mb-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Project Budget</Label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                type="number"
                                                min="0"
                                                className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 h-11 text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                                                placeholder="0.00"
                                                value={newProject.budget === 0 ? "" : newProject.budget}
                                                onFocus={() => {
                                                    if (newProject.budget === 0) setNewProject({ ...newProject, budget: "" as unknown as number });
                                                }}
                                                onBlur={() => {
                                                    if (!newProject.budget) setNewProject({ ...newProject, budget: 0 });
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === '-' || e.key === 'e') e.preventDefault();
                                                }}
                                                onChange={(e) => {
                                                    const val = e.target.value === "" ? 0 : Number(e.target.value);
                                                    if (val >= 0) setNewProject({ ...newProject, budget: val });
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Hours Estimate (In Hours)</Label>
                                        <div className="relative">
                                            <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                type="number"
                                                min="0"
                                                className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 h-11 text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                                                placeholder="e.g. 120"
                                                value={newProject.hours_estimate === 0 ? "" : newProject.hours_estimate}
                                                onFocus={() => {
                                                    if (newProject.hours_estimate === 0) setNewProject({ ...newProject, hours_estimate: "" as unknown as number });
                                                }}
                                                onBlur={() => {
                                                    if (!newProject.hours_estimate) setNewProject({ ...newProject, hours_estimate: 0 });
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === '-' || e.key === 'e' || e.key === '.') e.preventDefault();
                                                }}
                                                onChange={(e) => {
                                                    const val = e.target.value === "" ? 0 : Number(e.target.value);
                                                    if (val >= 0) setNewProject({ ...newProject, hours_estimate: val });
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="px-8 py-4 border-t border-[#e3e2e1] dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center w-full">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="send-client"
                                checked={newProject.send_to_client}
                                onCheckedChange={(checked) => setNewProject({ ...newProject, send_to_client: checked as boolean })}
                                className="rounded-full dark:border-white dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-black"
                            />
                            <label
                                htmlFor="send-client"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600 dark:text-slate-400"
                            >
                                Send task to client
                            </label>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="px-6 h-11 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium hover:cursor-pointer">Cancel</Button>
                            <Button 
                                onClick={handleCreateProject} 
                                disabled={isSubmitting}
                                className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-8 h-11 font-medium shadow-lg shadow-blue-500/20 hover:cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Project"
                                )}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Category Modal */}
            <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-950 border border-[#e3e2e1] dark:border-slate-800 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">Add New Category</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="category-name" className="text-slate-700 dark:text-slate-300">Category Name</Label>
                            <Input
                                id="category-name"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Enter category name"
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleCreateCategory();
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setIsCategoryModalOpen(false);
                            setNewCategoryName("");
                        }} className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-gray-300">
                            Cancel
                        </Button>
                        <Button onClick={handleCreateCategory} className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                            Add Category
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}

export default ProjectsDashboard;
