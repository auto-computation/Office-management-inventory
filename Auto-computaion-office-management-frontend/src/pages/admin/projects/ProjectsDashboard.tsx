import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Search, DollarSign, Users, ArrowRight, Loader2 } from "lucide-react";
import { useNotification } from "@/components/NotificationProvider";
import { Input } from "@/components/ui/input";
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

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const ProjectsDashboard: React.FC = () => {
    const { showSuccess, showError } = useNotification();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [projects, setProjects] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [employees, setEmployees] = useState<any[]>([]); // For client selection (using users for now)
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form
    const [newProject, setNewProject] = useState({
        name: "",
        description: "",
        client_id: "", // User ID
        status: "Not Started",
        start_date: "",
        deadline: "",
        estimated_budget: 0
    });

    const fetchProjects = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/projects`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (error) {
            console.error("Failed to fetch projects", error);
            showError("Failed to load projects");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
             // Reusing emp/all to get potential clients. In real app might want specific client role.
            const res = await fetch(`${API_BASE_URL}/admin/emp/all`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setEmployees(data.users || []);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    useEffect(() => {
        fetchProjects();
        fetchUsers();
    }, []);

    const handleCreateProject = async () => {
        try {
            if (!newProject.name) {
                showError("Project name is required");
                return;
            }

            const payload = {
                ...newProject,
                client_id: newProject.client_id ? parseInt(newProject.client_id) : null
            };

            const res = await fetch(`${API_BASE_URL}/admin/projects`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to create project");
            
            showSuccess("Project created successfully");
            setIsAddModalOpen(false);
            setNewProject({ name: "", description: "", client_id: "", status: "Not Started", start_date: "", deadline: "", estimated_budget: 0 });
            fetchProjects();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            showError(err.message);
        }
    };

    const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const getStatusColor = (status: string) => {
        switch(status) {
            case "Completed": return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
            case "In Progress": return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
            case "On Hold": return "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
            case "Cancelled": return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
            default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
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
                 <Button onClick={() => setIsAddModalOpen(true)} className="bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                    <Plus className="mr-2 h-4 w-4" /> New Project
                </Button>
            </div>

            {/* Filters */}
             <div className="flex items-center gap-4 mb-6">
                 <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search projects..." className="pl-10 bg-white dark:bg-slate-900" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <Card 
                            key={project.id} 
                            onClick={() => navigate(`/admin/projects/${project.id}`)}
                            className="group relative cursor-pointer hover:shadow-lg transition-all border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden"
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

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <Users size={16} className="text-slate-400" />
                                        <span>{project.client_name || "Internal"}</span>
                                    </div>
                                     <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                                        <DollarSign size={16} className="text-green-500" />
                                        <span>{Number(project.estimated_budget).toLocaleString()}</span>
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
            )}

            {/* Create Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Project Name</Label>
                                <Input value={newProject.name} onChange={(e) => setNewProject({...newProject, name: e.target.value})} placeholder="e.g. Website Redesign" />
                            </div>
                            <div className="space-y-2">
                                <Label>Select Client</Label>
                                <Select value={newProject.client_id} onValueChange={(val) => setNewProject({...newProject, client_id: val})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map(user => (
                                            <SelectItem key={user.id} value={user.id.toString()}>{user.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={newProject.description} onChange={(e) => setNewProject({...newProject, description: e.target.value})} placeholder="Project scope and goals..." />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input type="date" value={newProject.start_date} onChange={(e) => setNewProject({...newProject, start_date: e.target.value})} />
                            </div>
                             <div className="space-y-2">
                                <Label>Deadline</Label>
                                <Input type="date" value={newProject.deadline} onChange={(e) => setNewProject({...newProject, deadline: e.target.value})} />
                            </div>
                        </div>

                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label>Estimated Budget</Label>
                                <Input type="number" value={newProject.estimated_budget} onChange={(e) => setNewProject({...newProject, estimated_budget: Number(e.target.value)})} />
                            </div>
                             <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={newProject.status} onValueChange={(val) => setNewProject({...newProject, status: val})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Not Started">Not Started</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="On Hold">On Hold</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateProject}>Create Project</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}

export default ProjectsDashboard;
