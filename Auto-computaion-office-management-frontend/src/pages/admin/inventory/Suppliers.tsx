/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Search, Pencil, Trash2, Mail, Phone, User, MapPin } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const Suppliers: React.FC = () => {
    const { showSuccess, showError } = useNotification();
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
    const [form, setForm] = useState({ name: "", contact_person: "", email: "", phone: "", address: "" });
    const [supplierToDelete, setSupplierToDelete] = useState<number | null>(null);

    const fetchSuppliers = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/inventory/suppliers`, { credentials: "include" });
            if (res.ok) setSuppliers(await res.json());
        } catch (error) {
            console.error("Failed to fetch suppliers", error);
            showError("Failed to load suppliers");
        }
    };

    useEffect(() => {
        fetchSuppliers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openAdd = () => {
        setEditingSupplier(null);
        setForm({ name: "", contact_person: "", email: "", phone: "", address: "" });
        setIsModalOpen(true);
    };

    const openEdit = (s: any) => {
        setEditingSupplier(s);
        setForm({
            name: s.name,
            contact_person: s.contact_person || "",
            email: s.email || "",
            phone: s.phone || "",
            address: s.address || "",
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            showError("Supplier name is required");
            return;
        }
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            showError("Please enter a valid email address");
            return;
        }
        try {
            const url = editingSupplier
                ? `${API_BASE_URL}/admin/inventory/suppliers/${editingSupplier.id}`
                : `${API_BASE_URL}/admin/inventory/suppliers`;
            const method = editingSupplier ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || `Failed to ${editingSupplier ? "update" : "add"} supplier`);
            }
            showSuccess(`Supplier ${editingSupplier ? "updated" : "added"} successfully`);
            setIsModalOpen(false);
            fetchSuppliers();
        } catch (err: any) {
            showError(err.message);
        }
    };

    const confirmDelete = async () => {
        if (!supplierToDelete) return;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/inventory/suppliers/${supplierToDelete}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to delete supplier");
            showSuccess("Supplier deleted successfully");
            setSupplierToDelete(null);
            fetchSuppliers();
        } catch (err: any) {
            showError(err.message);
        }
    };

    const filtered = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.contact_person || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.email || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Suppliers</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your vendors and suppliers.</p>
                </div>
                <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" /> Add Supplier
                </Button>
            </div>

            <div className="relative w-full max-w-sm mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search suppliers..."
                    className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Mobile card view */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {filtered.map((s) => (
                    <Card key={s.id} className="bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 p-5">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-lg shrink-0">
                                    {s.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{s.name}</h3>
                                    {s.contact_person && <p className="text-xs text-slate-500 dark:text-slate-400">{s.contact_person}</p>}
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => openEdit(s)} className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                    <Pencil className="h-4 w-4 text-slate-500" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setSupplierToDelete(s.id)} className="group h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20">
                                    <Trash2 className="h-4 w-4 text-slate-500 group-hover:text-red-400 transition-colors" />
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-1.5 text-sm">
                            {s.email && <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><Mail className="h-3.5 w-3.5" />{s.email}</p>}
                            {s.phone && <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><Phone className="h-3.5 w-3.5" />{s.phone}</p>}
                            {s.address && <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><MapPin className="h-3.5 w-3.5" />{s.address}</p>}
                        </div>
                    </Card>
                ))}
                {filtered.length === 0 && <p className="text-slate-500 text-center py-10">No suppliers found.</p>}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900">
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Name</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Contact Person</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Email</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Phone</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Address</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((s) => (
                            <TableRow key={s.id} className="bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border-slate-200 dark:border-slate-800">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-sm shrink-0">
                                            {s.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-slate-900 dark:text-white">{s.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-slate-500 dark:text-slate-400 text-sm">
                                    {s.contact_person
                                        ? <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 shrink-0" />{s.contact_person}</span>
                                        : "—"
                                    }
                                </TableCell>
                                <TableCell className="text-slate-500 dark:text-slate-400 text-sm">
                                    {s.email
                                        ? <a href={`mailto:${s.email}`} className="hover:text-blue-500 transition-colors">{s.email}</a>
                                        : "—"
                                    }
                                </TableCell>
                                <TableCell className="text-slate-500 dark:text-slate-400 text-sm">{s.phone || "—"}</TableCell>
                                <TableCell className="text-slate-500 dark:text-slate-400 text-sm max-w-[180px] truncate">{s.address || "—"}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => openEdit(s)} className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                            <Pencil className="h-4 w-4 text-slate-500 hover:text-blue-600" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => setSupplierToDelete(s.id)} className="group h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20">
                                            <Trash2 className="h-4 w-4 text-slate-500 group-hover:text-red-400 transition-colors" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-slate-500 py-12">No suppliers found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Add / Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">
                            {editingSupplier ? "Edit Supplier" : "Add Supplier"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-slate-700 dark:text-slate-300">Supplier Name <span className="text-red-500">*</span></Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Tech Supplies Inc"
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-700 dark:text-slate-300">Contact Person</Label>
                            <Input
                                value={form.contact_person}
                                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                                placeholder="e.g. Jane Doe"
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300">Email</Label>
                                <Input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="email@example.com"
                                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300">Phone</Label>
                                <Input
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9+-\s]/g, '') })}
                                    placeholder="+91 98765 43210"
                                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-700 dark:text-slate-300">Address</Label>
                            <Textarea
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                placeholder="Full address..."
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                            {editingSupplier ? "Save Changes" : "Add Supplier"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!supplierToDelete} onOpenChange={(open) => !open && setSupplierToDelete(null)}>
                <AlertDialogContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-900 dark:text-white">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                            This will permanently delete the supplier. Any purchase orders linked to them may be affected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Suppliers;
