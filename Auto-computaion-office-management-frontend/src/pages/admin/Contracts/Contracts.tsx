import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Search, DollarSign, ArrowRight, Loader2, FileSignature, CalendarIcon, Building2, X } from "lucide-react";
import { useNotification } from "@/components/NotificationProvider";
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
import { LayoutGrid, List } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";



// Dummy Data
const contractTypes = ["Fixed Price", "Time & Material", "Retainer", "Dedicated Team"];

const dummyProjects = [
    { id: "1", name: "Website Redesign" },
    { id: "2", name: "Mobile App Development" },
    { id: "3", name: "Marketing Campaign Q4" },
    { id: "4", name: "Internal HR Portal" },
    { id: "5", name: "SEO Optimization" }
];

const dummyClients = [
    { id: "101", name: "Acme Corp" },
    { id: "102", name: "RetailPlus" },
    { id: "103", name: "TechStart" },
    { id: "104", name: "Hudson Inc" },
    { id: "105", name: "Internal" }
];

const dummyContracts = [
    {
        id: 1,
        contract_number: "CTR-2024-001",
        project_name: "Website Redesign",
        client_name: "Acme Corp",
        start_date: "2024-01-15",
        end_date: "2024-06-15",
        contract_type: "Fixed Price",
        contract_value: 15000,
        description: "Complete redesign of corporate website including CMS integration.",
        status: "Active"
    },
    {
        id: 2,
        contract_number: "CTR-2024-002",
        project_name: "Mobile App Development",
        client_name: "RetailPlus",
        start_date: "2024-02-01",
        end_date: "2024-12-31",
        contract_type: "Time & Material",
        contract_value: 25000, // Estimated
        description: "Development of iOS and Android mobile applications.",
        status: "Active"
    },
    {
        id: 3,
        contract_number: "CTR-2024-003",
        project_name: "SEO Optimization",
        client_name: "TechStart",
        start_date: "2024-03-01",
        end_date: null, // Ongoing
        contract_type: "Retainer",
        contract_value: 3000, // Monthly
        description: "Monthly SEO services and reporting.",
        status: "Active"
    }
];

const Contracts: React.FC = () => {
    const { showSuccess, showError } = useNotification();
    const [isLoading, setIsLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [contracts, setContracts] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    // Form State
    const [newContract, setNewContract] = useState({
        contract_number: "",
        project_id: "",
        description: "",
        start_date: "",
        end_date: "",
        no_due_date: false,
        contract_type: "",
        contract_value: 0,
        client_id: ""
    });

    const fetchContracts = useCallback(async () => {
        // Simulate API delay
        setTimeout(() => {
            setContracts(dummyContracts);
            setProjects(dummyProjects); // Ideally fetch from API
            setClients(dummyClients);   // Ideally fetch from API
            setIsLoading(false);
        }, 1000);
    }, []);

    useEffect(() => {
        fetchContracts();
    }, [fetchContracts]);

    const handleCreateContract = async () => {
        try {
            if (!newContract.contract_number || !newContract.project_id || !newContract.client_id || !newContract.start_date) {
                showError("Please fill in all required fields.");
                return;
            }

            setIsSubmitting(true);
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay

            const project = projects.find(p => p.id === newContract.project_id);
            const client = clients.find(c => c.id === newContract.client_id);

            const newContractData = {
                id: Date.now(),
                ...newContract,
                project_name: project?.name || "Unknown Project",
                client_name: client?.name || "Unknown Client",
                status: "Active"
            };

            setContracts([newContractData, ...contracts]);
            showSuccess("Contract created successfully (Demo Mode)");
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
                client_id: ""
            });

        } catch (error: any) {
            showError(error.message || "Failed to create contract");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredContracts = contracts.filter(c => 
        c.contract_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.client_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
             {/* Header */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Contracts</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage project contracts and agreements.</p>
                </div>
                 <Button onClick={() => setIsAddModalOpen(true)} className="bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                    <Plus className="mr-2 h-4 w-4" /> New Contract
                </Button>
            </div>

            {/* Filters & View Toggle */}
             <div className="flex items-center justify-between mb-6">
                 <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search contracts..." 
                        className="pl-10 bg-white dark:bg-slate-900" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                </div>
                
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button 
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <List size={18} />
                    </button>
                </div>
            </div>

            {/* Grid / Table View */}
            {isLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredContracts.map((contract) => (
                        <Card 
                            key={contract.id} 
                            // onClick={() => navigate(`/admin/contracts/${contract.id}`)} 
                            className="group relative cursor-pointer hover:shadow-lg transition-all border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden"
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

                                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                            <Building2 size={16} className="text-slate-400" />
                                            <span>{contract.client_name}</span>
                                        </div>
                                         <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                                            <DollarSign size={16} className="text-green-500" />
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
                                <span>View Details</span>
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
            ) : (
                <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                            <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                <TableHead className="text-slate-500 dark:text-slate-400 font-semibold">Contract No.</TableHead>
                                <TableHead className="text-slate-500 dark:text-slate-400 font-semibold">Project</TableHead>
                                <TableHead className="text-slate-500 dark:text-slate-400 font-semibold">Client</TableHead>
                                <TableHead className="text-slate-500 dark:text-slate-400 font-semibold">Type</TableHead>
                                <TableHead className="text-slate-500 dark:text-slate-400 font-semibold">Start Date</TableHead>
                                <TableHead className="text-slate-500 dark:text-slate-400 font-semibold">End Date</TableHead>
                                <TableHead className="text-right text-slate-500 dark:text-slate-400 font-semibold">Value</TableHead>
                                <TableHead className="text-right text-slate-500 dark:text-slate-400 font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredContracts.map((contract) => (
                                <TableRow key={contract.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group transition-colors">
                                    <TableCell className="font-mono text-sm text-slate-600 dark:text-slate-300">{contract.contract_number}</TableCell>
                                    <TableCell className="font-medium text-slate-900 dark:text-white">{contract.project_name}</TableCell>
                                    <TableCell className="text-slate-600 dark:text-slate-300">{contract.client_name}</TableCell>
                                    <TableCell>
                                        <div className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                            {contract.contract_type}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600 dark:text-slate-300">{contract.start_date}</TableCell>
                                    <TableCell className="text-slate-600 dark:text-slate-300">{contract.end_date || <span className="text-slate-400 italic">Ongoing</span>}</TableCell>
                                    <TableCell className="text-right font-medium text-slate-900 dark:text-white">
                                        {Number(contract.contract_value).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            View
                                        </Button>
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
            )}

            {/* Create Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden h-[90vh] flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl">
                    <DialogHeader className="pt-6 px-8 border-b border-slate-100 dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
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
                                        <Input
                                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 h-11 focus-visible:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                                            placeholder="e.g. CTR-2024-001"
                                            value={newContract.contract_number}
                                            onChange={(e) => setNewContract({ ...newContract, contract_number: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-slate-700 dark:text-slate-300 font-medium">Project <span className="text-red-500">*</span></Label>
                                            <Select value={newContract.project_id} onValueChange={(val) => setNewContract({ ...newContract, project_id: val })}>
                                                <SelectTrigger className="w-full h-11 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white">
                                                    <SelectValue placeholder="Select Project" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 w-[var(--radix-select-trigger-width)]">
                                                    {projects.map((proj) => (
                                                        <SelectItem key={proj.id} value={proj.id} className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">
                                                            {proj.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-700 dark:text-slate-300 font-medium">Client <span className="text-red-500">*</span></Label>
                                            <Select value={newContract.client_id} onValueChange={(val) => setNewContract({ ...newContract, client_id: val })}>
                                                <SelectTrigger className="w-full h-11 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white">
                                                    <SelectValue placeholder="Select Client" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 w-[var(--radix-select-trigger-width)]">
                                                    {clients.map((client) => (
                                                        <SelectItem key={client.id} value={client.id} className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">
                                                            {client.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-slate-100 dark:bg-slate-800" />

                            {/* Section 2: Financial Details */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-l-4 border-amber-500 pl-3">
                                    Financial Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Contract Type</Label>
                                        <Select value={newContract.contract_type} onValueChange={(val) => setNewContract({ ...newContract, contract_type: val })}>
                                            <SelectTrigger className="w-full h-11 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white">
                                                <SelectValue placeholder="Select Type" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 w-[var(--radix-select-trigger-width)]">
                                                {contractTypes.map((type) => (
                                                    <SelectItem key={type} value={type} className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 dark:text-slate-300 font-medium">Contract Value</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                type="number"
                                                className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 h-11 text-slate-900 dark:text-white placeholder:text-slate-400"
                                                placeholder="0.00"
                                                value={newContract.contract_value}
                                                onChange={(e) => setNewContract({ ...newContract, contract_value: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-slate-100 dark:bg-slate-800" />

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
                                                            "w-full h-11 justify-start text-left font-normal bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white",
                                                            !newContract.start_date && "text-muted-foreground",
                                                            newContract.start_date && "pr-10"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {newContract.start_date ? format(new Date(newContract.start_date), "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 border-slate-200 dark:border-slate-800" align="start">
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
                                                            "w-full h-11 justify-start text-left font-normal bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed",
                                                            !newContract.end_date && "text-muted-foreground",
                                                            newContract.end_date && "pr-10"
                                                        )}
                                                        disabled={newContract.no_due_date}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {newContract.end_date ? format(new Date(newContract.end_date), "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 border-slate-200 dark:border-slate-800" align="start">
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
                                <div className="space-y-2 pt-2">
                                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Contract Summary</Label>
                                    <Textarea
                                        className="min-h-[120px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 resize-none focus-visible:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                                        placeholder="Enter a brief summary of the contract scope and objectives..."
                                        value={newContract.description}
                                        onChange={(e) => setNewContract({ ...newContract, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end w-full">
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="px-6 h-11 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium">Cancel</Button>
                            <Button 
                                onClick={handleCreateContract} 
                                disabled={isSubmitting}
                                className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-8 h-11 font-medium shadow-lg shadow-blue-500/20"
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

        </div>
    );
}

export default Contracts;