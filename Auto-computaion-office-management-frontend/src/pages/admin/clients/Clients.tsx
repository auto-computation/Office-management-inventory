import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Mail, Phone, Building2, MapPin, Loader2, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNotification } from "@/components/useNotification";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

interface Client {
    id: number;
    name: string;
    email: string;
    phone: string;
    company_name: string;
    address: string;
    created_at?: string;
}

const ClientsPage: React.FC = () => {
    const { showSuccess, showError } = useNotification();
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        company_name: "",
        address: ""
    });

    const fetchClients = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/clients`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setClients(data);
            } else {
                showError("Failed to fetch clients");
            }
        } catch (error) {
            console.error(error);
            showError("Network error while fetching clients");
        } finally {
            setIsLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const openCreateModal = () => {
        setEditingClient(null);
        setFormData({ name: "", email: "", phone: "", company_name: "", address: "" });
        setIsModalOpen(true);
    };

    const openEditModal = (client: Client) => {
        setEditingClient(client);
        setFormData({
            name: client.name || "",
            email: client.email || "",
            phone: client.phone || "",
            company_name: client.company_name || "",
            address: client.address || ""
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            showError("Client Name is required");
            return;
        }

        setIsSubmitting(true);
        try {
            const endpoint = editingClient 
                ? `${API_BASE_URL}/admin/clients/${editingClient.id}`
                : `${API_BASE_URL}/admin/clients`;
                
            const method = editingClient ? "PUT" : "POST";

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const data = await res.json();
                if (!editingClient && data.emailSent === false) {
                   showSuccess("Client added, but welcome email failed to send.");
                } else {
                   showSuccess(editingClient ? "Client updated successfully!" : "Client added and email sent successfully!");
                }
                setIsModalOpen(false);
                fetchClients();
            } else {
                const errorData = await res.json();
                showError(errorData.message || "Failed to save client");
            }
        } catch (error) {
            console.error(error);
            showError("Network error while saving client");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this client?")) return;
        
        try {
            const res = await fetch(`${API_BASE_URL}/admin/clients/${id}`, {
                method: "DELETE",
                credentials: "include"
            });

            if (res.ok) {
                showSuccess("Client deleted successfully");
                fetchClients();
            } else {
                showError("Failed to delete client");
            }
        } catch (error) {
            console.error(error);
            showError("Network error while deleting client");
        }
    };

    const filteredClients = clients.filter(c => 
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
             {/* Header */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Clients</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage external clients and organizations.</p>
                </div>
                 <Button onClick={openCreateModal} className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 hover:cursor-pointer shadow-md">
                    <Plus className="mr-2 h-4 w-4" /> Add Client
                </Button>
            </div>

            {/* Filters */}
             <div className="flex items-center gap-4 mb-6">
                 <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search clients..." 
                        className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                    />
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
                                    <TableHead className="font-bold">Client Name</TableHead>
                                    <TableHead className="font-bold">Company</TableHead>
                                    <TableHead className="font-bold">Email</TableHead>
                                    <TableHead className="font-bold">Phone</TableHead>
                                    <TableHead className="font-bold">Address</TableHead>
                                    <TableHead className="text-right font-bold w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredClients.map((client) => (
                                    <TableRow key={client.id} className="border-[#e3e2e1] hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <TableCell className="font-medium text-slate-900 dark:text-white">
                                            {client.name}
                                        </TableCell>
                                        <TableCell className="text-slate-600 dark:text-slate-400">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Building2 size={14} className="text-slate-400" />
                                                {client.company_name || "N/A"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600 dark:text-slate-400">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail size={14} className="text-slate-400" />
                                                {client.email || "N/A"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600 dark:text-slate-400">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone size={14} className="text-slate-400" />
                                                {client.phone || "N/A"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600 dark:text-slate-400 max-w-[200px]">
                                            <div className="flex items-center gap-2 text-sm">
                                                <MapPin size={14} className="text-slate-400 shrink-0" />
                                                <span className="truncate">{client.address || "N/A"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => openEditModal(client)}>
                                                    <Edit size={16} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete(client.id)}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {filteredClients.length === 0 && (
                            <div className="py-20 text-center flex flex-col items-center justify-center">
                                <Building2 className="h-16 w-16 text-slate-200 dark:text-slate-800 mb-4" />
                                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No clients found</h3>
                                <p className="text-slate-500 max-w-sm mb-6">You haven't added any clients yet, or no clients match your search criteria.</p>
                                <Button onClick={openCreateModal} variant="outline" className="border-[#e3e2e1] dark:border-slate-700">
                                    Add your first client
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Mobile/Tablet Card View */}
                    <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredClients.map((client) => (
                            <Card key={client.id} className="p-6 overflow-hidden border-[#e3e2e1] dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:shadow-lg transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {client.name}
                                        </h3>
                                        {client.company_name && (
                                            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-slate-500 font-medium">
                                                <Building2 size={14} className="text-slate-400" />
                                                {client.company_name}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-1 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => openEditModal(client)}>
                                            <Edit size={16} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete(client.id)}>
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                                
                                <div className="space-y-2.5 mt-6 border-t border-[#e3e2e1] dark:border-slate-800/60 pt-4">
                                    <div className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                                        <Mail size={16} className="text-slate-400 mt-0.5 shrink-0" />
                                        <span className="truncate" title={client.email || 'N/A'}>{client.email || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                                        <Phone size={16} className="text-slate-400 mt-0.5 shrink-0" />
                                        <span>{client.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                                        <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                                        <span className="line-clamp-2">{client.address || 'N/A'}</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        {filteredClients.length === 0 && (
                            <div className="col-span-full py-20 text-center flex flex-col items-center justify-center">
                                <Building2 className="h-16 w-16 text-slate-200 dark:text-slate-800 mb-4" />
                                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No clients found</h3>
                                <p className="text-slate-500 max-w-sm mb-6">You haven't added any clients yet, or no clients match your search criteria.</p>
                                <Button onClick={openCreateModal} variant="outline" className="border-[#e3e2e1] dark:border-slate-700">
                                    Add your first client
                                </Button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Client Add/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white text-xl">
                            {editingClient ? "Edit Client" : "Add New Client"}
                        </DialogTitle>
                        <p className="text-sm text-slate-500">
                            {editingClient ? "Update the client's contact and company information." : "Enter details for the new client. An email will be sent automatically to notify them."}
                        </p>
                    </DialogHeader>
                    <div className="grid gap-5 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Full Name <span className="text-red-500">*</span></Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="John Doe"
                                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company" className="text-slate-700 dark:text-slate-300">Company Name</Label>
                                <Input
                                    id="company"
                                    value={formData.company_name}
                                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                    placeholder="Acme Corp"
                                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email Address {!editingClient && <span className="text-amber-500 text-xs ml-1">(Used for welcome notification)</span>}</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="john@example.com"
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">Phone Number</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+1 (555) 000-0000"
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-slate-700 dark:text-slate-300">Address</Label>
                            <Textarea
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="123 Business Rd, Suite 100..."
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsModalOpen(false)}
                            className="border-slate-200 dark:border-slate-700"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            disabled={isSubmitting}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingClient ? "Save Changes" : "Create & Send Email"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ClientsPage;
