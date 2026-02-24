import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Plus,
    Search,
    Calendar as CalendarIcon,
    Trash2,
    Pencil,
    Eye,
    // MoreHorizontal
} from 'lucide-react';
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useNotification } from "../../components/useNotification";

interface Assignee {
    id: number;
    name: string;
    avatar: string;
}

interface Task {
    id: number;
    title: string;
    project_id: number | null;
    project_name: string;
    details: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'Pending' | 'In Progress' | 'Completed';
    start_date: string;
    due_date: string;
    completion_percentage: number;
    assignees: Assignee[];
}

interface Project {
    id: number;
    name: string;
}

interface Employee {
    id: number;
    name: string;
    avatar_url: string;
    designation: string;
}

const AdminTasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'All' | 'Pending' | 'In Progress' | 'Completed'>('All');
    const [searchTerm, setSearchTerm] = useState('');

    // View Modal State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedViewTask, setSelectedViewTask] = useState<Task | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        project_id: '',
        details: '',
        priority: 'Medium',
        status: 'Pending',
        start_date: '',
        due_date: '',
        completion_percentage: 0,
        assigned_to: [] as number[]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isStartDateOpen, setIsStartDateOpen] = useState(false);
    const [isDueDateOpen, setIsDueDateOpen] = useState(false);
    const [projectMemberIds, setProjectMemberIds] = useState<number[] | null>(null);

    const { showSuccess, showError } = useNotification();
    const API_BASE_URL = import.meta.env.VITE_BASE_URL;

    const fetchTasks = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/tasks/all`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        } finally {
            setIsLoading(false);
        }
    }, [API_BASE_URL]);

    const fetchEmployees = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/emp/all`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setEmployees(data.users || []);
            }
        } catch (error) {
            console.error("Failed to fetch employees", error);
        }
    }, [API_BASE_URL]);

    const fetchProjects = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/projects`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (error) {
            console.error("Failed to fetch projects", error);
        }
    }, [API_BASE_URL]);

    useEffect(() => {
        fetchTasks();
        // fetchEmployees(); // Removed - fetch only when needed
        fetchProjects();
    }, [fetchTasks, fetchProjects]);

    useEffect(() => {
        const syncEmployees = async () => {
            if (!formData.project_id) {
                // Placeholder "Select Project" - Show no employees
                setEmployees([]);
                setProjectMemberIds([]);
                return;
            }

            if (formData.project_id === "0") {
                // Explicit "No Project" - Fetch and show all employees
                fetchEmployees();
                setProjectMemberIds(null);
                return;
            }

            // Specific Project - Fetch members
            try {
                const res = await fetch(`${API_BASE_URL}/admin/projects/${formData.project_id}`, { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    
                    // Map project members to Employee interface
                    const membersAsEmployees: Employee[] = (data.members || []).map((m: { user_id: number, name: string, avatar_url: string, role?: string }) => ({
                        id: m.user_id,
                        name: m.name,
                        avatar_url: m.avatar_url,
                        designation: m.role || 'Member'
                    }));
                    
                    setEmployees(membersAsEmployees);
                    setProjectMemberIds(membersAsEmployees.map(e => e.id));
                }
            } catch (error) {
                console.error("Failed to fetch project members", error);
                setEmployees([]);
                setProjectMemberIds([]);
            }
        };

        syncEmployees();
    }, [formData.project_id, API_BASE_URL, fetchEmployees]);

    const handleQuickUpdate = async (id: number, field: 'priority' | 'status', value: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/tasks/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ [field]: value })
            });

            if (res.ok) {
                fetchTasks();
                showSuccess(`Task ${field} updated!`);
            } else {
                showError("Failed to update task");
            }
        } catch (error) {
            console.error(error);
            showError("Failed to update task");
        }
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setFormData({
            title: '',
            project_id: '',
            details: '',
            priority: 'Medium',
            status: 'Pending',
            start_date: '',
            due_date: '',
            completion_percentage: 0,
            assigned_to: []
        });
        setIsModalOpen(true);
    };

    const openEditModal = (task: Task) => {
        setIsEditing(true);
        setCurrentTaskId(task.id);
        
        const startDateStr = task.start_date ? new Date(task.start_date).toISOString().split('T')[0] : '';
        const dueDateStr = task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '';
        
        setFormData({
            title: task.title,
            project_id: task.project_id?.toString() || '',
            details: task.details || '',
            priority: task.priority,
            status: task.status,
            start_date: startDateStr,
            due_date: dueDateStr,
            completion_percentage: task.completion_percentage || 0,
            assigned_to: task.assignees?.map(a => a.id) || []
        });
        setIsModalOpen(true);
    };

    const openViewModal = (task: Task) => {
        setSelectedViewTask(task);
        setIsViewModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.title || formData.assigned_to.length === 0 || !formData.due_date) {
            showError("Please fill in all required fields (Title, Assigned To, Due Date).");
            return;
        }

        setIsSubmitting(true);
        try {
            const url = isEditing
                ? `${API_BASE_URL}/admin/tasks/${currentTaskId}`
                : `${API_BASE_URL}/admin/tasks/create`;

            const method = isEditing ? 'PATCH' : 'POST';

            // Convert project_id to number or null if empty
            const payload = {
                ...formData,
                project_id: formData.project_id ? parseInt(formData.project_id) : null
            };

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Since the backend returns {message, taskId} or updated object structure might vary,
                // it's safer to re-fetch tasks to ensure all joins/relations are properly loaded.
                fetchTasks();
                setIsModalOpen(false);
                showSuccess(isEditing ? "Task updated successfully!" : "Task assigned successfully!");
            } else {
                const error = await res.json();
                showError(error.message || "Operation failed");
            }
        } catch (error) {
            console.error(error);
            showError("Failed to save task");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTask = async (id: number) => {
        if (!confirm("Are you sure you want to delete this task?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/tasks/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) {
                setTasks(tasks.filter(t => t.id !== id));
                showSuccess("Task deleted.");
            }
        } catch (error) {
            console.error(error);
            showError("Failed to delete task");
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesFilter = filter === 'All' || task.status === filter;
        
        const safeSearchTerm = (searchTerm || '').toLowerCase();
        const matchesSearch = (task.title || '').toLowerCase().includes(safeSearchTerm) ||
            task.assignees?.some(a => (a.name || '').toLowerCase().includes(safeSearchTerm)) ||
            (task.project_name || '').toLowerCase().includes(safeSearchTerm);
            
        return matchesFilter && matchesSearch;
    });

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800';
            case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800';
            case 'Low': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'Pending': return 'bg-slate-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            <div className="space-y-8">

                {/* Header */}
                <div className="lg:sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 border-b border-slate-200/50 dark:border-slate-800/50 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white max-sm:hidden flex items-center gap-3">
                            Task Management
                        </h1>
                        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">Assign, track, and manage employee tasks.</p>
                    </div>
                    <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-lg shadow-blue-600/20 transition-all hover:scale-105">
                        <Plus className="h-4 w-4 mr-2" /> Create Task
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="grid grid-cols-4 gap-2 w-full md:w-auto md:flex">
                        {['All', 'Pending', 'In Progress', 'Completed'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as 'All' | 'Pending' | 'In Progress' | 'Completed')}
                                className={`px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer flex justify-center items-center ${filter === f
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search tasks..."
                            className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-950 transition-all dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Task Table - Desktop View */}
                <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                            <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                                <TableHead className="w-[300px] text-slate-900 dark:text-white font-semibold">Employee & Task</TableHead>
                                <TableHead className="text-slate-900 dark:text-white font-semibold">Priority</TableHead>
                                <TableHead className="text-slate-900 dark:text-white font-semibold">Status</TableHead>
                                <TableHead className="text-slate-900 dark:text-white font-semibold w-[150px]">Due Date</TableHead>
                                <TableHead className="text-right text-slate-900 dark:text-white font-semibold w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
                                </TableRow>
                            ) : filteredTasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                                        No tasks found. Create one to get started!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTasks.map((task) => (
                                    <TableRow key={task.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <TableCell>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-semibold text-slate-900 dark:text-white line-clamp-1 text-sm mb-0.5" title={task.title}>{task.title}</span>
                                                {task.project_name && (
                                                    <div className="flex items-center">
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
                                                            {task.project_name}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                defaultValue={task.priority}
                                                onValueChange={(value) => handleQuickUpdate(task.id, 'priority', value)}
                                            >
                                                <SelectTrigger className={`h-8 w-[100px] text-xs font-medium border-0 ${getPriorityColor(task.priority)} focus:ring-0 focus:ring-offset-0`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                                                    <SelectItem value="High" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">High</SelectItem>
                                                    <SelectItem value="Medium" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Medium</SelectItem>
                                                    <SelectItem value="Low" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Low</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                defaultValue={task.status}
                                                onValueChange={(value) => handleQuickUpdate(task.id, 'status', value)}
                                            >
                                                <SelectTrigger className={`h-8 w-[120px] text-xs font-medium border-0 ${getStatusColor(task.status)} focus:ring-0 focus:ring-offset-0`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                                                    <SelectItem value="Pending" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Pending</SelectItem>
                                                    <SelectItem value="In Progress" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">In Progress</SelectItem>
                                                    <SelectItem value="Completed" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Completed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                    <CalendarIcon className="h-3.5 w-3.5" />
                                                    <span className="text-xs">{new Date(task.due_date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                    <div 
                                                        className="bg-blue-600 h-full transition-all duration-500" 
                                                        style={{ width: `${task.completion_percentage || 0}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{task.completion_percentage || 0}% Complete</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openViewModal(task)}
                                                    className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditModal(task)}
                                                    className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Task Cards - Mobile View */}
                <div className="md:hidden space-y-4">
                    {isLoading ? (
                        <div className="text-center py-12 text-slate-500">Loading tasks...</div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                            No tasks found. Create one to get started!
                        </div>
                    ) : (
                        filteredTasks.map((task) => (
                            <div key={task.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{task.title}</h3>
                                        {task.project_name && (
                                            <span className="inline-block self-start text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                                {task.project_name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openViewModal(task)}
                                            className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditModal(task)}
                                            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{task.title}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{task.details}</p>
                                </div>

                                {task.project_name && (
                                    <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                        {task.project_name}
                                    </span>
                                )}

                                <div className="space-y-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <div className={`px-2.5 py-1 rounded text-xs font-semibold border ${getPriorityColor(task.priority)} flex-shrink-0`}>
                                            {task.priority}
                                        </div>
                                        <div className={`px-2.5 py-1 rounded text-xs font-semibold ${getStatusColor(task.status)} flex-shrink-0`}>
                                            {task.status}
                                        </div>
                                        <div className="flex items-center text-xs text-slate-500 ml-auto whitespace-nowrap">
                                            <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                                            {new Date(task.due_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-slate-500 font-medium">Progress</span>
                                            <span className="text-slate-900 dark:text-white font-bold">{task.completion_percentage || 0}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                            <div 
                                                className="bg-blue-600 h-full transition-all duration-500" 
                                                style={{ width: `${task.completion_percentage || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Create/Edit Task Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-0 overflow-hidden shadow-2xl">
                        <DialogHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {isEditing ? <Pencil className="h-5 w-5 text-indigo-500" /> : <Plus className="h-5 w-5 text-blue-600" />}
                                {isEditing ? "Edit Task" : "Assign New Task"}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Task Title *</label>
                                    <Input
                                        className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
                                        placeholder="e.g. Update Landing Page Layout"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Project</label>
                                    <Select 
                                        value={formData.project_id} 
                                        onValueChange={(val) => setFormData({ ...formData, project_id: val })}
                                    >
                                        <SelectTrigger className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-indigo-500">
                                            <SelectValue placeholder="Select Project" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                            <SelectItem value="0" className="text-slate-400 italic">No Project</SelectItem>
                                            {projects.map(project => (
                                                <SelectItem key={project.id} value={project.id.toString()}>{project.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Detailed Description</label>
                                <textarea
                                    className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white min-h-[100px] transition-all"
                                    placeholder="Describe the task requirements, context, and expectations..."
                                    value={formData.details}
                                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                                ></textarea>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex justify-between items-center">
                                    <span>Assigned To *</span>
                                    <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{formData.assigned_to.length} selected</span>
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-3 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                                    {(projectMemberIds !== null && projectMemberIds.length === 0) ? (
                                        <div className="col-span-full py-8 text-center text-slate-500 text-sm italic">
                                            {!formData.project_id ? "Please select a project to see members" : "No members found for this project"}
                                        </div>
                                    ) : (
                                        employees
                                            .filter(emp => !projectMemberIds || projectMemberIds.includes(emp.id))
                                            .map(emp => (
                                            <div 
                                                key={emp.id} 
                                            className={`flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer ${
                                                formData.assigned_to.includes(emp.id) 
                                                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-sm' 
                                                    : 'border-transparent hover:bg-white dark:hover:bg-slate-800'
                                            }`}
                                            onClick={() => {
                                                setFormData(prev => {
                                                    const alreadyAssigned = prev.assigned_to.includes(emp.id);
                                                    if (alreadyAssigned) {
                                                        return { ...prev, assigned_to: prev.assigned_to.filter(id => id !== emp.id) };
                                                    } else {
                                                        return { ...prev, assigned_to: [...prev.assigned_to, emp.id] };
                                                    }
                                                });
                                            }}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                                formData.assigned_to.includes(emp.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'
                                            }`}>
                                                {formData.assigned_to.includes(emp.id) && <Plus className="h-3 w-3 text-white rotate-45" style={{ transform: 'none' }} />}
                                            </div>
                                            <Avatar className="h-7 w-7 border border-slate-200 dark:border-slate-700">
                                                <AvatarImage src={emp.avatar_url} />
                                                <AvatarFallback className="text-[10px]">{emp.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{emp.name}</span>
                                                <span className="text-[10px] text-slate-500 truncate">{emp.designation || 'Staff'}</span>
                                            </div>
                                        </div>
                                    )))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Timeline</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold ml-1">Start Date</span>
                                            <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className="w-full h-11 justify-start font-normal bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                                                        {formData.start_date ? format(new Date(formData.start_date), "dd MMM") : <span className="text-slate-400">Add start</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                                                    <Calendar
                                                        mode="single"
                                                        selected={formData.start_date ? new Date(formData.start_date) : undefined}
                                                        onSelect={(d) => { setFormData(p => ({ ...p, start_date: d ? format(d, "yyyy-MM-dd") : "" })); setIsStartDateOpen(false); }}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold ml-1">Due Date *</span>
                                            <Popover open={isDueDateOpen} onOpenChange={setIsDueDateOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className="w-full h-11 justify-start font-normal bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                                                        {formData.due_date ? format(new Date(formData.due_date), "dd MMM") : <span className="text-slate-400">Add due</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                                                    <Calendar
                                                        mode="single"
                                                        selected={formData.due_date ? new Date(formData.due_date) : undefined}
                                                        onSelect={(d) => { setFormData(p => ({ ...p, due_date: d ? format(d, "yyyy-MM-dd") : "" })); setIsDueDateOpen(false); }}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Priority & Progress</label>
                                    <div className="flex gap-4 items-end">
                                        <div className="flex-1 space-y-1">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold ml-1">Priority</span>
                                            <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                                                <SelectTrigger className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-900">
                                                    <SelectItem value="High">High</SelectItem>
                                                    <SelectItem value="Medium">Medium</SelectItem>
                                                    <SelectItem value="Low">Low</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-24 space-y-1">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold ml-1">Progress %</span>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-center"
                                                value={formData.completion_percentage}
                                                onChange={(e) => setFormData({ ...formData, completion_percentage: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-row justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="px-6 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting} className="px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 transition-all font-semibold">
                                {isSubmitting ? "Saving..." : isEditing ? "Update Task" : "Assign Task"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* View Task Details Modal */}
                <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                    <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-0 overflow-hidden rounded-2xl">
                        {selectedViewTask && (
                            <>
                                <DialogHeader className="p-6 pb-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                                                {selectedViewTask.title}
                                            </DialogTitle>
                                            {selectedViewTask.project_name && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">
                                                        {selectedViewTask.project_name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </DialogHeader>

                                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                                    {/* Status & Priority Row */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</span>
                                            <div className={`text-sm font-bold ${getStatusColor(selectedViewTask.status)} bg-transparent p-0 flex items-center gap-2`}>
                                                <div className={`w-2 h-2 rounded-full ${selectedViewTask.status === 'Completed' ? 'bg-green-500' : selectedViewTask.status === 'In Progress' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                                                {selectedViewTask.status}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Priority</span>
                                            <div className={`text-sm font-bold ${getPriorityColor(selectedViewTask.priority)} bg-transparent p-0 flex items-center gap-2`}>
                                                <div className={`w-2 h-2 rounded-full ${selectedViewTask.priority === 'High' ? 'bg-red-500' : selectedViewTask.priority === 'Medium' ? 'bg-amber-500' : 'bg-green-500'}`} />
                                                {selectedViewTask.priority}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description/Details */}
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                            <Search className="h-3 w-3 text-indigo-500" />
                                            Description
                                        </h4>
                                        <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">
                                            {selectedViewTask.details || "No detailed description provided."}
                                        </div>
                                    </div>

                                    {/* Dates & Progress Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                                <CalendarIcon className="h-3 w-3 text-indigo-500" />
                                                Timeline
                                            </h4>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500">Start Date:</span>
                                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedViewTask.start_date ? format(new Date(selectedViewTask.start_date), 'PPP') : 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500">Due Date:</span>
                                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{format(new Date(selectedViewTask.due_date), 'PPP')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                                <Plus className="h-3 w-3 text-indigo-500 rotate-45" style={{ transform: 'none' }} />
                                                Progress
                                            </h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-500">Completion</span>
                                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedViewTask.completion_percentage || 0}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                                    <div 
                                                        className="bg-indigo-600 h-full transition-all duration-500" 
                                                        style={{ width: `${selectedViewTask.completion_percentage || 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Assignees Section */}
                                    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                            <Avatar className="h-4 w-4">
                                                <AvatarFallback className="bg-indigo-100 text-indigo-600 pb-1 font-bold">@</AvatarFallback>
                                            </Avatar>
                                            Assigned Employees ({selectedViewTask.assignees?.length || 0})
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {selectedViewTask.assignees?.map((assignee) => (
                                                <div key={assignee.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                                                    <Avatar className="h-8 w-8 ring-1 ring-slate-100 dark:ring-slate-800">
                                                        <AvatarImage src={assignee.avatar} />
                                                        <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px]">{assignee.name?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{assignee.name}</span>
                                                </div>
                                            ))}
                                            {(!selectedViewTask.assignees || selectedViewTask.assignees.length === 0) && (
                                                <div className="col-span-full py-4 text-center text-slate-400 italic text-sm">
                                                    No employees assigned to this task.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                                    <Button 
                                        onClick={() => setIsViewModalOpen(false)}
                                        className="w-full sm:w-auto bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white rounded-xl px-8 h-10 font-bold tracking-wide transition-all shadow-md"
                                    >
                                        Close Details
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default AdminTasks;
