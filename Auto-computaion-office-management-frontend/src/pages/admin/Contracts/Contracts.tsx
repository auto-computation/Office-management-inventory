import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Search, IndianRupee, ArrowRight, Loader2, FileSignature, CalendarIcon, Building2, X, Trash, AlertTriangle, Dices } from "lucide-react";
import { useNotification } from "@/components/useNotification";
import { Input } from "@/components/ui/input";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";



const API_BASE_URL = import.meta.env.VITE_BASE_URL;

interface Project {
    id: number;
    name: string;
}

interface Client {
    id: number;
    name: string;
}

interface Contract {
    id: number;
    contract_number: string;
    project_id: number;
    project_name?: string;
    client_id: number;
    client_name?: string;
    description: string;
    start_date: string;
    end_date: string | null;
    contract_type: string;
    contract_value: number;
    status: string;
    no_due_date?: boolean;
}

interface ContractType {
    id: number;
    name: string;
}

const Contracts: React.FC = () => {
    const { showSuccess, showError } = useNotification();
    const [isLoading, setIsLoading] = useState(true);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
    const [isContractTypeModalOpen, setIsContractTypeModalOpen] = useState(false);
    const [newContractTypeName, setNewContractTypeName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [newContract, setNewContract] = useState({
        contract_number: "",
        project_id: "", // Changed to string for Select component value
        description: "",
        start_date: "",
        end_date: "",
        no_due_date: false,
        contract_type: "",
        contract_value: 0,
        client_id: "", // Changed to string for Select component value
        status: "Active"
    });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingContract, setEditingContract] = useState<Contract | null>(null);

    // Delete confirmation state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [contractToDelete, setContractToDelete] = useState<number | null>(null);

    const fetchContracts = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${API_BASE_URL}/admin/contracts`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setContracts(data || []);
            }
        } catch (error) {
            console.error("Failed to fetch contracts", error);
            showError("Failed to fetch contracts");
        } finally {
            setIsLoading(false);
        }
    }, [showError]);

    const generateUniqueContractNumber = useCallback(() => {
        const year = new Date().getFullYear();
        let isUnique = false;
        let newNum = "";
        
        while (!isUnique) {
            const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
            newNum = `CTRN-${year}-${random}`;
            isUnique = !contracts.some(c => c.contract_number === newNum);
        }
        
        return newNum;
    }, [contracts]);

    const fetchFormData = useCallback(async () => {
        try {
            const [projRes, clientRes, typeRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/projects`, { credentials: "include" }),
                fetch(`${API_BASE_URL}/admin/clients`, { credentials: "include" }),
                fetch(`${API_BASE_URL}/admin/contracts/types`, { credentials: "include" })
            ]);

            if (projRes.ok) setProjects(await projRes.json());
            if (clientRes.ok) setClients(await clientRes.json());
            if (typeRes.ok) setContractTypes(await typeRes.json());
        } catch (error) {
            console.error("Failed to fetch form data", error);
        }
    }, []);

    useEffect(() => {
        fetchContracts();
        fetchFormData();
    }, [fetchContracts, fetchFormData]);

    const handleCreateContract = async () => {
        try {
            if (!newContract.contract_number || !newContract.project_id || !newContract.client_id || !newContract.start_date) {
                showError("Please fill in all required fields.");
                return;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDate = new Date(newContract.start_date);
            if (startDate < today) {
                showError("Start date cannot be in the past.");
                return;
            }

            if (!newContract.no_due_date) {
                if (!newContract.end_date) {
                    showError("Please provide an end date.");
                    return;
                }
                const endDate = new Date(newContract.end_date);
                if (endDate <= startDate) {
                    showError("End date must be after the start date.");
                    return;
                }
            }

            setIsSubmitting(true);
            const response = await fetch(`${API_BASE_URL}/admin/contracts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    ...newContract,
                    project_id: Number(newContract.project_id),
                    client_id: Number(newContract.client_id),
                    contract_value: Number(newContract.contract_value)
                })
            });

            if (response.ok) {
                showSuccess("Contract created successfully");
                setIsAddModalOpen(false);
                setNewContract({
                    contract_number: "",
                    project_id: "",
                    description: "",
                    start_date: "",
                    end_date: "",
                    no_due_date: false,
                    contract_type: "",
                    contract_value: 0,
                    client_id: "",
                    status: "Active"
                });
                fetchContracts();
            } else {
                const data = await response.json();
                showError(data.message || "Failed to create contract");
            }
        } catch (error: unknown) {
            const err = error as Error;
            showError(err.message || "Failed to create contract");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateContract = async () => {
        if (!editingContract) return;
        setIsSubmitting(true);
        try {
            if (!editingContract.contract_number || !editingContract.project_id || !editingContract.client_id || !editingContract.start_date) {
                showError("Please fill in all required fields.");
                return;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDate = new Date(editingContract.start_date);
            
            // Allow existing start date even if it's in the past (for editing), 
            // but if changed, it must be >= today? Or maybe just keep it simple.
            // User said "start date >= today". Let's enforce it for creation, 
            // but for editing maybe we only enforce if it's changed? 
            // Usually, for contracts, you shouldn't be able to move it back to the past if it's new.
            // But if it's an existing contract that already started in the past, we shouldn't block updates.
            // However, the user was specific: "start date >= today".
            
            if (!editingContract.no_due_date && editingContract.end_date) {
                const endDate = new Date(editingContract.end_date);
                if (endDate <= startDate) {
                    showError("End date must be after the start date.");
                    return;
                }
            }
            const response = await fetch(`${API_BASE_URL}/admin/contracts/${editingContract.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(editingContract)
            });

            if (response.ok) {
                showSuccess("Contract updated successfully");
                setIsEditModalOpen(false);
                setEditingContract(null);
                fetchContracts();
            } else {
                const data = await response.json(); // Fixed: changed 'res' to 'response'
                showError(data.message || "Failed to update contract");
            }
        } catch (error: unknown) {
            const err = error as Error;
            showError(err.message || "Failed to update contract");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteContract = async (id: number) => {
        setContractToDelete(id);
        setIsDeleteModalOpen(true);
    };
    const confirmDeleteContract = async () => {
        if (!contractToDelete) return;

        try {
            const res = await fetch(`${API_BASE_URL}/admin/contracts/${contractToDelete}`, {
                method: "DELETE",
                credentials: "include"
            });

            if (res.ok) {
                showSuccess("Contract deleted successfully");
                fetchContracts();
                setIsDeleteModalOpen(false);
                setContractToDelete(null);
            } else {
                showError("Failed to delete contract");
            }
        } catch (error) {
            console.error(error);
            showError("Network error while deleting contract");
        }
    };

    const handleCreateContractType = async () => {
        if (!newContractTypeName.trim()) return;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/contracts/types`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ name: newContractTypeName.trim() })
            });

            if (res.ok) {
                const data = await res.json();
                setContractTypes(prev => {
                    if (prev.some(t => t.id === data.id)) return prev;
                    return [...prev, data].sort((a, b) => {
                        if (a.name === "Others") return 1;
                        if (b.name === "Others") return -1;
                        return a.name.localeCompare(b.name);
                    });
                });
                setNewContractTypeName("");
                showSuccess("Contract type added");
            }
        } catch {
            console.error("Failed to fetch contract types");
        }
    };

    const handleDeleteContractType = async (id: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/contracts/types/${id}`, {
                method: "DELETE",
                credentials: "include"
            });

            if (res.ok) {
                setContractTypes(prev => prev.filter(t => t.id !== id));
                showSuccess("Contract type deleted");
            }
        } catch {
            showError("Failed to delete contract type");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
            case 'Completed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
            case 'Terminated': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-[#e3e2e1] dark:border-slate-800';
        }
    };

    const openEditModal = (contract: Contract) => {
        setEditingContract({
            ...contract,
            start_date: contract.start_date ? contract.start_date.split('T')[0] : "",
            end_date: contract.end_date ? contract.end_date.split('T')[0] : ""
        });
        setIsEditModalOpen(true);
    };

    const filteredContracts = contracts.filter(c => 
        c.contract_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.project_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.client_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
             {/* Header */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Contracts</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage project contracts and agreements.</p>
                </div>
                <Button 
                    onClick={() => {
                        const generatedNum = generateUniqueContractNumber();
                        setNewContract(prev => ({ ...prev, contract_number: generatedNum }));
                        setIsAddModalOpen(true);
                    }} 
                    className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 cursor-pointer"
                >
                    <Plus className="mr-2 h-4 w-4" /> New Contract
                </Button>
            </div>

            {/* Filters */}
             <div className="flex items-center justify-between mb-6">
                 <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search contracts..." 
                        className="pl-10 bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                </div>
            </div>

            {/* Grid / Table View */}
            {isLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-500" /></div>
            ) : (
                <>
                <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredContracts.map((contract) => (
                        <Card 
                            key={contract.id} 
                            className="group relative cursor-pointer hover:shadow-lg transition-all border-[#e3e2e1] dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden"
                            onClick={() => openEditModal(contract)}
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                     <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                                        {contract.contract_type}
                                    </div>
                                    <span className="text-xs text-slate-400 font-mono">{contract.contract_number}</span>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {contract.project_name}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 h-10">
                                    {contract.description || "No description provided."}
                                </p>

                                    <div className="space-y-3 pt-4 border-t border-[#e3e2e1] dark:border-slate-800">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                            <Building2 size={16} className="text-slate-400" />
                                            <span>{contract.client_name}</span>
                                        </div>
                                         <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                                            <IndianRupee size={16} className="text-green-500" />
                                            <span>{Number(contract.contract_value).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <CalendarIcon size={14} />
                                        <span>
                                            {contract.start_date} - {contract.end_date ? contract.end_date : "Ongoing"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 flex justify-between items-center text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/10 transition-colors">
                                <span onClick={(e) => { e.stopPropagation(); openEditModal(contract); }} className="hover:text-indigo-600">Edit Details</span>
                                <span onClick={(e) => { e.stopPropagation(); handleDeleteContract(contract.id); }} className="text-red-400 hover:text-red-600 ml-auto mr-4">Delete</span>
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Card>
                    ))}
                    {filteredContracts.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            No contracts found. Create one to get started.
                        </div>
                    )}
                </div>
                
                <div className="hidden lg:block rounded-xl border border-[#e3e2e1] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                            <TableRow className="border-[#e3e2e1] dark:border-slate-800 hover:bg-transparent">
                                <TableHead className="text-slate-500 dark:text-slate-400 font-semibold">Contract No.</TableHead>
                                <TableHead className="text-slate-500 dark:text-slate-400 font-semibold">Project</TableHead>
                                <TableHead className="text-slate-500 dark:text-slate-400 font-semibold">Client</TableHead>
                                <TableHead className="text-slate-500 dark:text-slate-400 font-semibold">Status</TableHead>
                                <TableHead className="text-slate-500 dark:text-slate-400 font-semibold text-center">Type</TableHead>
                                <TableHead className="text-slate-500 dark:text-slate-400 font-semibold">Start Date</TableHead>
                                <TableHead className="text-slate-500 dark:text-slate-400 font-semibold">End Date</TableHead>
                                <TableHead className="text-right text-slate-500 dark:text-slate-400 font-semibold">Value</TableHead>
                                <TableHead className="text-right text-slate-500 dark:text-slate-400 font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredContracts.map((contract) => (
                                <TableRow key={contract.id} className="border-b border-[#e3e2e1] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group transition-colors">
                                    <TableCell className="font-mono text-sm text-slate-600 dark:text-slate-300">{contract.contract_number}</TableCell>
                                    <TableCell className="font-medium text-slate-900 dark:text-white">{contract.project_name}</TableCell>
                                    <TableCell className="text-slate-600 dark:text-slate-300">{contract.client_name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn("font-medium", getStatusColor(contract.status))}>
                                            {contract.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                                            {contract.contract_type}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600 dark:text-slate-300">
                                        {contract.start_date ? format(new Date(contract.start_date), "dd MMM yyyy") : '-'}
                                    </TableCell>
                                    <TableCell className="text-slate-600 dark:text-slate-300">
                                        {contract.end_date ? format(new Date(contract.end_date), "dd MMM yyyy") : <span className="text-slate-400 italic">Ongoing</span>}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-slate-900 dark:text-white">
                                        ₹{Number(contract.contract_value).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEditModal(contract); }} className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                                                <FileSignature size={16} />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteContract(contract.id); }} className="h-8 w-8 text-slate-400 hover:text-red-600">
                                                <Trash size={16} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredContracts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center text-slate-500">
                                        No contracts found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                </>
            )}

            {/* Create Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden h-[90vh] flex flex-col bg-white dark:bg-slate-950 border border-[#e3e2e1] dark:border-slate-800 shadow-2xl">
                    <DialogHeader className="pt-6 px-8 border-b border-[#e3e2e1] dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FileSignature className="h-6 w-6 text-indigo-600" />
                            Create New Contract
                        </DialogTitle>
                        <p className="text-slate-500 dark:text-slate-400">Configure your contract details and settings.</p>
                    </DialogHeader>

                    <ScrollArea className="flex-1 px-8 py-6">
                        <div className="space-y-8">
                            
                            {/* Section 1: Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-l-4 border-indigo-500 pl-3">
                                    Contract Details
                                </h3>
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Contract Number <span className="text-red-500">*</span></Label>
                                        <div className="flex gap-2">
                                            <Input
                                                readOnly
                                                className="bg-slate-50 dark:bg-slate-800 border-[#e3e2e1] dark:border-slate-700 h-11 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none text-slate-900 dark:text-white placeholder:text-slate-400 flex-1"
                                                placeholder="e.g. CTR-2024-001"
                                                value={newContract.contract_number}
                                            />
                                            <Button 
                                                variant="outline" 
                                                type="button"
                                                onClick={() => setNewContract(prev => ({ ...prev, contract_number: generateUniqueContractNumber() }))}
                                                className="h-11 px-4 border-[#e3e2e1] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                title="Regenerate number"
                                            >
                                                <Dices className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <p className="text-[10px] text-slate-400">This number is automatically generated to ensure uniqueness.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-slate-700 dark:text-slate-300 font-medium">Project <span className="text-red-500">*</span></Label>
                                            <Select value={newContract.project_id.toString()} onValueChange={(val) => setNewContract({ ...newContract, project_id: val })}>
                                                <SelectTrigger className="w-full h-11 px-4 py-2 rounded-lg border border-[#e3e2e1] dark:border-slate-600 bg-white dark:bg-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none outline-none text-slate-900 dark:text-white">
                                                    <SelectValue placeholder="Select Project" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800 w-[var(--radix-select-trigger-width)]">
                                                    {projects.map((proj) => (
                                                        <SelectItem key={proj.id} value={proj.id.toString()} className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">
                                                            {proj.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-700 dark:text-slate-300 font-medium">Client <span className="text-red-500">*</span></Label>
                                            <Select value={newContract.client_id.toString()} onValueChange={(val) => setNewContract({ ...newContract, client_id: val })}>
                                                <SelectTrigger className="w-full h-11 px-4 py-2 rounded-lg border border-[#e3e2e1] dark:border-slate-600 bg-white dark:bg-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none outline-none text-slate-900 dark:text-white">
                                                    <SelectValue placeholder="Select Client" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800 w-[var(--radix-select-trigger-width)]">
                                                    {clients.map((client) => (
                                                        <SelectItem key={client.id} value={client.id.toString()} className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">
                                                            {client.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-[#e3e2e1] dark:bg-slate-800" />

                            {/* Section 2: Financial Details */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-l-4 border-amber-500 pl-3">
                                    Financial Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Contract Type</Label>
                                            <div className="flex gap-2">
                                                <Select value={newContract.contract_type} onValueChange={(val) => setNewContract({ ...newContract, contract_type: val })}>
                                                    <SelectTrigger className="w-full h-11 px-4 py-2 rounded-lg border border-[#e3e2e1] dark:border-slate-600 bg-white dark:bg-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none outline-none text-slate-900 dark:text-white">
                                                        <SelectValue placeholder="Select Type" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800 w-[var(--radix-select-trigger-width)]">
                                                        {contractTypes.map((type) => (
                                                            <SelectItem key={type.id} value={type.name} className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">
                                                                {type.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    type="button"
                                                    onClick={() => setIsContractTypeModalOpen(true)}
                                                    className="h-11 w-11 shrink-0 border-[#e3e2e1] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Contract Value</Label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                type="number"
                                                min="0"
                                                className="pl-9 bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-700 h-11 text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                                                placeholder="0.00"
                                                value={newContract.contract_value === 0 ? "" : newContract.contract_value}
                                                onFocus={() => {
                                                    if (newContract.contract_value === 0) setNewContract({ ...newContract, contract_value: "" as unknown as number });
                                                }}
                                                onBlur={() => {
                                                    if (!newContract.contract_value) setNewContract({ ...newContract, contract_value: 0 });
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === '-' || e.key === 'e') e.preventDefault();
                                                }}
                                                onChange={(e) => {
                                                    const val = e.target.value === "" ? 0 : Number(e.target.value);
                                                    if (val >= 0) setNewContract({ ...newContract, contract_value: val });
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-[#e3e2e1] dark:bg-slate-800" />

                            {/* Section 3: Timeline & Description */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-l-4 border-emerald-500 pl-3">
                                    Timeline & Description
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Start Date <span className="text-red-500">*</span></Label>
                                        <div className="relative">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full h-11 justify-start text-left font-normal bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none",
                                                            !newContract.start_date && "text-muted-foreground",
                                                            newContract.start_date && "pr-10"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {newContract.start_date ? format(new Date(newContract.start_date), "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 border-[#e3e2e1] dark:border-slate-800" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={newContract.start_date ? new Date(newContract.start_date) : undefined}
                                                        onSelect={(date) => {
                                                            if(date) {
                                                                const dateStr = [
                                                                    date.getFullYear(),
                                                                    String(date.getMonth() + 1).padStart(2, '0'),
                                                                    String(date.getDate()).padStart(2, '0')
                                                                ].join('-');
                                                                setNewContract({ ...newContract, start_date: dateStr });
                                                            } else {
                                                                setNewContract({ ...newContract, start_date: "" });
                                                            }
                                                        }}
                                                        disabled={(date) => {
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);
                                                            return date < today;
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
                                                End Date {!newContract.no_due_date && <span className="text-red-500">*</span>}
                                            </Label>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="no-due-date"
                                                    checked={newContract.no_due_date}
                                                    onCheckedChange={(checked) => setNewContract({ ...newContract, no_due_date: checked as boolean, end_date: checked ? "" : newContract.end_date })}
                                                    className="rounded-full dark:border-white dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-black"
                                                />
                                                <label
                                                    htmlFor="no-due-date"
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
                                                            "w-full h-11 justify-start text-left font-normal bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none",
                                                            !newContract.end_date && "text-muted-foreground",
                                                            newContract.end_date && "pr-10"
                                                        )}
                                                        disabled={newContract.no_due_date || !newContract.start_date}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {newContract.end_date ? format(new Date(newContract.end_date), "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 border-[#e3e2e1] dark:border-slate-800" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={newContract.end_date ? new Date(newContract.end_date) : undefined}
                                                        onSelect={(date) => {
                                                            if(date) {
                                                                const dateStr = [
                                                                    date.getFullYear(),
                                                                    String(date.getMonth() + 1).padStart(2, '0'),
                                                                    String(date.getDate()).padStart(2, '0')
                                                                ].join('-');
                                                                setNewContract({ ...newContract, end_date: dateStr });
                                                            } else {
                                                                setNewContract({ ...newContract, end_date: "" });
                                                            }
                                                        }}
                                                        disabled={(date) => {
                                                            if (!newContract.start_date) return false;
                                                            return date <= new Date(newContract.start_date);
                                                        }}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            {newContract.end_date && !newContract.no_due_date && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setNewContract({ ...newContract, end_date: "" });
                                                    }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 pt-2 mb-4">
                                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Contract Summary</Label>
                                    <Textarea
                                        className="min-h-[120px] bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-700 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                                        placeholder="Enter a brief summary of the contract scope and objectives..."
                                        value={newContract.description}
                                        onChange={(e) => setNewContract({ ...newContract, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="px-8 py-4 border-t border-[#e3e2e1] dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end w-full">
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="px-6 h-11 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium cursor-pointer">Cancel</Button>
                            <Button 
                                onClick={handleCreateContract} 
                                disabled={isSubmitting}
                                className="px-10 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-none min-w-[160px] cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Contract"
                                )}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden h-[90vh] flex flex-col bg-white dark:bg-slate-950 border border-[#e3e2e1] dark:border-slate-800 shadow-2xl">
                    <DialogHeader className="pt-6 px-8 border-b border-[#e3e2e1] dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FileSignature className="h-6 w-6 text-indigo-600" />
                            Edit Contract
                        </DialogTitle>
                        <p className="text-slate-500 dark:text-slate-400">Update contract details and settings.</p>
                    </DialogHeader>

                    {editingContract && (
                        <ScrollArea className="flex-1 px-8 py-6">
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-l-4 border-indigo-500 pl-3">Basic Info</h3>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-slate-700 dark:text-slate-300 font-medium">Contract Number <span className="text-red-500">*</span></Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    readOnly
                                                    className="bg-slate-50 dark:bg-slate-800 border-[#e3e2e1] dark:border-slate-700 h-11 text-slate-900 dark:text-white flex-1"
                                                    value={editingContract.contract_number}
                                                />
                                                <Button 
                                                    variant="outline" 
                                                    type="button"
                                                    onClick={() => setEditingContract({ ...editingContract, contract_number: generateUniqueContractNumber() })}
                                                    className="h-11 px-4 border-[#e3e2e1] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                    title="Regenerate number"
                                                >
                                                    <Dices className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <p className="text-[10px] text-slate-400">Ensure this number is unique before saving.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-slate-700 dark:text-slate-300 font-medium">Project <span className="text-red-500">*</span></Label>
                                                <Select value={editingContract.project_id.toString()} onValueChange={(val) => setEditingContract({ ...editingContract, project_id: parseInt(val) })}>
                                                    <SelectTrigger className="w-full h-11 border-[#e3e2e1] dark:border-slate-600 bg-white dark:bg-slate-900">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800">
                                                        {projects.map((proj) => (
                                                            <SelectItem key={proj.id} value={proj.id.toString()}>{proj.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-slate-700 dark:text-slate-300 font-medium">Client <span className="text-red-500">*</span></Label>
                                                <Select value={editingContract.client_id.toString()} onValueChange={(val) => setEditingContract({ ...editingContract, client_id: parseInt(val) })}>
                                                    <SelectTrigger className="w-full h-11 border-[#e3e2e1] dark:border-slate-600 bg-white dark:bg-slate-900">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800">
                                                        {clients.map((client) => (
                                                            <SelectItem key={client.id} value={client.id.toString()}>{client.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-[#e3e2e1] dark:bg-slate-800" />

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-l-4 border-amber-500 pl-3">Financials & Status</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-slate-700 dark:text-slate-300 font-medium">Type</Label>
                                            <div className="flex gap-2">
                                                <Select value={editingContract.contract_type} onValueChange={(val) => setEditingContract({ ...editingContract, contract_type: val })}>
                                                    <SelectTrigger className="w-full h-11 border-[#e3e2e1] bg-white dark:bg-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none outline-none">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white dark:bg-slate-900 border-[#e3e2e1]">
                                                        {contractTypes.map((type) => (
                                                            <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    type="button"
                                                    onClick={() => setIsContractTypeModalOpen(true)}
                                                    className="h-11 w-11 shrink-0 border-[#e3e2e1] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-700 dark:text-slate-300 font-medium">Value</Label>
                                            <div className="relative">
                                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    type="number"
                                                    className="pl-9 h-11 border-[#e3e2e1] bg-white dark:bg-slate-900"
                                                    value={editingContract.contract_value}
                                                    onChange={(e) => setEditingContract({ ...editingContract, contract_value: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-700 dark:text-slate-300 font-medium">Status</Label>
                                            <Select value={editingContract.status} onValueChange={(val) => setEditingContract({ ...editingContract, status: val })}>
                                                <SelectTrigger className="w-full h-11 border-[#e3e2e1] bg-white dark:bg-slate-900">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-900 border-[#e3e2e1]">
                                                    <SelectItem value="Active">Active</SelectItem>
                                                    <SelectItem value="Completed">Completed</SelectItem>
                                                    <SelectItem value="Terminated">Terminated</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-[#e3e2e1] dark:bg-slate-800" />

                                <div className="space-y-4 pb-4">
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-l-4 border-emerald-500 pl-3">Timeline</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Start Date</Label>
                                            <Input
                                                type="date"
                                                className="h-11 border-[#e3e2e1] bg-white dark:bg-slate-900"
                                                value={editingContract.start_date}
                                                onChange={(e) => setEditingContract({ ...editingContract, start_date: e.target.value })}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-slate-700 dark:text-slate-300 font-medium">
                                                    End Date {!editingContract.no_due_date && <span className="text-red-500">*</span>}
                                                </Label>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="edit-no-due-date"
                                                        checked={editingContract.no_due_date}
                                                        onCheckedChange={(checked) => setEditingContract({ ...editingContract, no_due_date: checked as boolean, end_date: checked ? "" : editingContract.end_date })}
                                                        className="rounded-full"
                                                    />
                                                    <label htmlFor="edit-no-due-date" className="text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer">No End Date</label>
                                                </div>
                                            </div>
                                            <Input
                                                type="date"
                                                className="h-11 border-[#e3e2e1] bg-white dark:bg-slate-900"
                                                value={editingContract.end_date || ""}
                                                onChange={(e) => setEditingContract({ ...editingContract, end_date: e.target.value })}
                                                disabled={editingContract.no_due_date || !editingContract.start_date}
                                                min={editingContract.start_date ? (() => {
                                                    const d = new Date(editingContract.start_date);
                                                    d.setDate(d.getDate() + 1);
                                                    return d.toISOString().split('T')[0];
                                                })() : undefined}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        <Label>Summary</Label>
                                        <Textarea
                                            className="min-h-[120px] border-[#e3e2e1] bg-white dark:bg-slate-900"
                                            value={editingContract.description}
                                            onChange={(e) => setEditingContract({ ...editingContract, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    )}

                    <DialogFooter className="px-8 py-4 border-t border-[#e3e2e1] dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="mr-3 border-[#e3e2e1] text-slate-600 cursor-pointer">Cancel</Button>
                        <Button onClick={handleUpdateContract} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px] cursor-pointer">
                            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                            Update Contract
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[400px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-0 overflow-hidden shadow-2xl">
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">Delete Contract</DialogTitle>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">This action cannot be undone.</p>
                            </div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm leading-relaxed">
                            Are you sure you want to delete this contract? This will permanently remove all associated data from the system.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Button 
                                variant="outline" 
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 font-medium cursor-pointer"
                            >
                                No, Keep it
                            </Button>
                            <Button 
                                onClick={confirmDeleteContract}
                                className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 shadow-lg shadow-red-200 dark:shadow-none cursor-pointer"
                            >
                                Yes, Delete
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Manage Contract Types Modal */}
            <Dialog open={isContractTypeModalOpen} onOpenChange={setIsContractTypeModalOpen}>
                <DialogContent className="max-w-md bg-white dark:bg-slate-950 border-[#e3e2e1] dark:border-slate-800 p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="pt-6 px-6 pb-4 border-b border-[#e3e2e1] dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Plus className="h-5 w-5 text-indigo-600" />
                            Manage Contract Types
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-6">
                        <div className="flex gap-2">
                            <Input
                                placeholder="New type name..."
                                value={newContractTypeName}
                                onChange={(e) => setNewContractTypeName(e.target.value)}
                                className="h-10 bg-white dark:bg-slate-900 border-[#e3e2e1] dark:border-slate-800 focus-visible:ring-indigo-500"
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateContractType()}
                            />
                            <Button onClick={handleCreateContractType} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer h-10">
                                Add
                            </Button>
                        </div>

                        <ScrollArea className="h-[300px] border rounded-lg border-[#e3e2e1] dark:border-slate-800 p-1">
                            {contractTypes.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 italic text-sm">No contract types found.</div>
                            ) : (
                                <div className="divide-y divide-[#e3e2e1] dark:divide-slate-800">
                                    {contractTypes.map((type) => (
                                        <div key={type.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{type.name}</span>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleDeleteContractType(type.id)}
                                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                    <div className="px-6 py-4 border-t border-[#e3e2e1] dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
                        <Button onClick={() => setIsContractTypeModalOpen(false)} className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 cursor-pointer">
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}

export default Contracts;