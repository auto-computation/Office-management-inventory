import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNotification } from "@/components/useNotification";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Plus, Loader2, X, IndianRupee, Target } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface Project {
    id: number;
    name: string;
    status: string;
    client_id: number | null;
    department_id: number | null;
    category_id: number | null;
    start_date: string | null;
    deadline: string | null;
    budget: number;
    estimated_hours: number | null;
    summary: string | null;
    description: string | null;
    members?: { user_id: number }[];
}

interface Client { id: number; name: string; }
interface Department { id: number; name: string; }
interface Category { id: number; name: string; }
interface Employee { id: number; name: string; department_id: number; }

const EditProject = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showSuccess, showError } = useNotification();
    
    const [project, setProject] = useState<Project | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [initialMembers, setInitialMembers] = useState<string[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectRes, clientsRes, deptRes, catRes, empRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/admin/projects/${id}`, { credentials: "include" }),
                    fetch(`${API_BASE_URL}/admin/clients`, { credentials: "include" }),
                    fetch(`${API_BASE_URL}/admin/departments/getAll`, { credentials: "include" }),
                    fetch(`${API_BASE_URL}/admin/projects/categories`, { credentials: "include" }),
                    fetch(`${API_BASE_URL}/admin/emp/all`, { credentials: "include" })
                ]);

                if (!projectRes.ok) throw new Error("Failed to fetch project details");
                
                const [projectData, clientsData, deptData, catData, empData] = await Promise.all([
                    projectRes.json(),
                    clientsRes.ok ? clientsRes.json() : [],
                    deptRes.ok ? deptRes.json() : [],
                    catRes.ok ? catRes.json() : [],
                    empRes.ok ? empRes.json() : []
                ]);

                setProject(projectData);
                setClients(clientsData);
                setDepartments(deptData);
                setCategories(catData);
                setEmployees(empData.users || []);
                
                // Initialize members from project data
                const memberIds = projectData.members?.map((m: { user_id: number }) => m.user_id?.toString()) || [];
                setSelectedMembers(memberIds);
                setInitialMembers(memberIds);
                
            } catch (err: unknown) {
                if (err instanceof Error) showError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, showError]);

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        setIsCreatingCategory(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/projects/categories`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ name: newCategoryName })
            });
            if (!res.ok) throw new Error("Failed to create category");
            const data = await res.json();
            setCategories([...categories, data]);
            setProject(prev => prev ? { ...prev, category_id: (data as Category).id } : null);
            setIsCategoryModalOpen(false);
            setNewCategoryName("");
            showSuccess("Category created successfully");
        } catch (err: unknown) {
            if (err instanceof Error) showError(err.message);
        } finally {
            setIsCreatingCategory(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/projects/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(project)
            });
            
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to update project");
            }

            // Sync members
            const membersToAdd = selectedMembers.filter(m => !initialMembers.includes(m));
            const membersToRemove = initialMembers.filter(m => !selectedMembers.includes(m));

            await Promise.all([
                ...membersToAdd.map(userId => 
                    fetch(`${API_BASE_URL}/admin/projects/${id}/members`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ user_id: userId, role: "Member" })
                    })
                ),
                ...membersToRemove.map(userId => 
                    fetch(`${API_BASE_URL}/admin/projects/${id}/members/${userId}`, {
                        method: "DELETE",
                        credentials: "include"
                    })
                )
            ]);

            showSuccess("Project updated successfully");
            navigate(-1);
        } catch (err: unknown) {
            if (err instanceof Error) showError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading project details...</div>;
    if (!project) return <div className="p-10 text-center text-red-500">Project not found</div>;

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 md:p-10">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 pl-0 hover:bg-transparent">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Project
            </Button>
            
            <Card className="max-w-4xl mx-auto p-6 md:p-8 border-[#e3e2e1] dark:border-slate-800 shadow-lg">
                <h2 className="text-2xl font-bold mb-8 border-l-4 border-blue-600 pl-4">Edit Project</h2>
                
                <form onSubmit={handleUpdate} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Project Name</Label>
                            <Input 
                                value={project.name || ""} 
                                onChange={e => setProject(prev => prev ? { ...prev, name: e.target.value } : null)} 
                                className="h-11 dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800 focus-visible:ring-blue-600"
                                required 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Status</Label>
                            <Select 
                                value={project.status || "Not Started"} 
                                onValueChange={val => setProject(prev => prev ? { ...prev, status: val } : null)}
                            >
                                <SelectTrigger className="h-11 dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800 focus:ring-blue-600">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800 shadow-md">
                                    <SelectItem value="Not Started">Not Started</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="On Hold">On Hold</SelectItem>
                                    <SelectItem value="Canceled">Canceled</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Client</Label>
                            <Select 
                                value={project.client_id ? project.client_id.toString() : "none"} 
                                onValueChange={val => setProject(prev => prev ? { ...prev, client_id: val === "none" ? null : Number(val) } : null)}
                            >
                                <SelectTrigger className="h-11 dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800">
                                    <SelectValue placeholder="Select Client" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800 shadow-md">
                                    <SelectItem value="none">Internal / No Client</SelectItem>
                                    {clients.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Department</Label>
                            <Select 
                                value={project.department_id ? project.department_id.toString() : ""} 
                                onValueChange={val => setProject(prev => prev ? { ...prev, department_id: Number(val) } : null)}
                            >
                                <SelectTrigger className="h-11 dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800">
                                    <SelectValue placeholder="Select Department" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800 shadow-md">
                                    {departments.map(d => (
                                        <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Category</Label>
                            <div className="flex gap-2">
                                <Select 
                                    value={project.category_id ? project.category_id.toString() : ""} 
                                    onValueChange={val => setProject(prev => prev ? { ...prev, category_id: Number(val) } : null)}
                                >
                                    <SelectTrigger className="h-11 dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800 flex-1">
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800 shadow-md">
                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="h-11 w-11 p-0 border-[#e3e2e1] dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    onClick={() => setIsCategoryModalOpen(true)}
                                >
                                    <Plus className="h-5 w-5 text-blue-600" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Start Date</Label>
                            <Input 
                                type="date" 
                                value={project.start_date ? project.start_date.split('T')[0] : ""} 
                                onChange={e => setProject(prev => prev ? { ...prev, start_date: e.target.value } : null)} 
                                className="h-11 dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Deadline</Label>
                            <Input 
                                type="date" 
                                min={new Date().toISOString().split('T')[0]}
                                value={project.deadline ? project.deadline.split('T')[0] : ""} 
                                onChange={e => setProject(prev => prev ? { ...prev, deadline: e.target.value } : null)} 
                                className="h-11 dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800"
                                disabled={!project.start_date}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Budget (₹)</Label>
                            <div className="relative">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                    type="number" 
                                    value={project.budget || 0} 
                                    onChange={e => setProject(prev => prev ? { ...prev, budget: Number(e.target.value) } : null)} 
                                    className="h-11 pl-10 dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Hours Estimate</Label>
                            <div className="relative">
                                <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                    type="number" 
                                    value={project.estimated_hours || 0} 
                                    onChange={e => setProject(prev => prev ? { ...prev, estimated_hours: Number(e.target.value) } : null)} 
                                    className="h-11 pl-10 dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800"
                                    placeholder="Total estimated hours"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Add Project Members</Label>
                        <Select
                            value=""
                            onValueChange={(val) => {
                                if (!selectedMembers.includes(val)) {
                                    setSelectedMembers([...selectedMembers, val]);
                                }
                            }}
                            disabled={!project.department_id}
                        >
                            <SelectTrigger className="h-11 dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800">
                                <SelectValue placeholder={project.department_id ? "Select Members" : "Select a department first"} />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800 shadow-md">
                                {employees
                                    .filter(e => e.department_id?.toString() === project.department_id?.toString() && !selectedMembers.includes(e.id.toString()))
                                    .map(e => (
                                        <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                                    ))
                                }
                                {employees.filter(e => e.department_id?.toString() === project.department_id?.toString()).length === 0 && (
                                    <div className="p-2 text-sm text-slate-500 text-center">No employees found project Department</div>
                                )}
                            </SelectContent>
                        </Select>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                            {selectedMembers.map(memberId => {
                                const member = employees.find(e => e.id.toString() === memberId);
                                return member ? (
                                    <div key={memberId} className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border border-blue-200 dark:border-blue-800 shadow-sm">
                                        {member.name}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMembers(selectedMembers.filter(id => id !== memberId))}
                                            className="hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ) : null;
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Summary</Label>
                        <Textarea 
                            rows={3} 
                            value={project.summary || ""} 
                            onChange={e => {
                                const val = e.target.value;
                                setProject(prev => prev ? { ...prev, summary: val, description: val } : null);
                            }} 
                            className="dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800 focus:ring-blue-600"
                        />
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <Button type="button" variant="outline" className="px-8 h-11 border-[#e3e2e1] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900" onClick={() => navigate(-1)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="px-10 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-md active:scale-95">
                            {isSubmitting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                            ) : (
                                <><Save className="mr-2 h-4 w-4" /> Save Changes</>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Add Category Modal */}
            <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Add New Category</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="category-name" className="text-sm font-semibold">Category Name</Label>
                            <Input
                                id="category-name"
                                placeholder="Enter category name..."
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="h-11 dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800 focus-visible:ring-blue-600"
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter') {
                                        e.preventDefault();
                                        handleCreateCategory();
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)} className="h-11 border-[#e3e2e1] dark:border-slate-800">Cancel</Button>
                        <Button 
                            onClick={handleCreateCategory} 
                            disabled={isCreatingCategory || !newCategoryName.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white h-11 font-semibold"
                        >
                            {isCreatingCategory ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Category"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EditProject;
