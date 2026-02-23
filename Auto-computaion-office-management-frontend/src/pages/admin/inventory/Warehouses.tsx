/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Search, Pencil, Trash2, Warehouse, MapPin } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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

const Warehouses: React.FC = () => {
    const { showSuccess, showError } = useNotification();
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<any | null>(null);
    const [form, setForm] = useState({ name: "", location: "" });
    const [warehouseToDelete, setWarehouseToDelete] = useState<number | null>(null);

    const fetchWarehouses = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/inventory/warehouses`, { credentials: "include" });
            if (res.ok) setWarehouses(await res.json());
        } catch (error) {
            console.error("Failed to fetch warehouses", error);
            showError("Failed to load warehouses");
        }
    };

    useEffect(() => {
        fetchWarehouses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openAdd = () => {
        setEditingWarehouse(null);
        setForm({ name: "", location: "" });
        setIsModalOpen(true);
    };

    const openEdit = (wh: any) => {
        setEditingWarehouse(wh);
        setForm({ name: wh.name, location: wh.location || "" });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            showError("Warehouse name is required");
            return;
        }
        try {
            const url = editingWarehouse
                ? `${API_BASE_URL}/admin/inventory/warehouses/${editingWarehouse.id}`
                : `${API_BASE_URL}/admin/inventory/warehouses`;
            const method = editingWarehouse ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || `Failed to ${editingWarehouse ? "update" : "add"} warehouse`);
            }
            showSuccess(`Warehouse ${editingWarehouse ? "updated" : "added"} successfully`);
            setIsModalOpen(false);
            fetchWarehouses();
        } catch (err: any) {
            showError(err.message);
        }
    };

    const confirmDelete = async () => {
        if (!warehouseToDelete) return;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/inventory/warehouses/${warehouseToDelete}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to delete warehouse");
            showSuccess("Warehouse deleted successfully");
            setWarehouseToDelete(null);
            fetchWarehouses();
        } catch (err: any) {
            showError(err.message);
        }
    };

    const filtered = warehouses.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.location || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Warehouses</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your storage locations.</p>
                </div>
                <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" /> Add Warehouse
                </Button>
            </div>

            <div className="relative w-full max-w-sm mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search warehouses..."
                    className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Mobile card view */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {filtered.map((wh) => (
                    <Card key={wh.id} className="bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 p-5">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                    <Warehouse className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{wh.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                        <MapPin className="h-3 w-3" />{wh.location || "No location"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => openEdit(wh)} className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                    <Pencil className="h-4 w-4 text-slate-500" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setWarehouseToDelete(wh.id)} className="group h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20">
                                    <Trash2 className="h-4 w-4 text-slate-500 group-hover:text-red-400 transition-colors" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
                {filtered.length === 0 && <p className="text-slate-500 text-center py-10">No warehouses found.</p>}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900">
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Name</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Location</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((wh) => (
                            <TableRow key={wh.id} className="bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border-slate-200 dark:border-slate-800">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg shrink-0">
                                            <Warehouse className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <span className="font-medium text-slate-900 dark:text-white">{wh.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-slate-500 dark:text-slate-400 text-sm">
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 shrink-0" />{wh.location || "—"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => openEdit(wh)} className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                            <Pencil className="h-4 w-4 text-slate-500 hover:text-blue-600" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => setWarehouseToDelete(wh.id)} className="group h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20">
                                            <Trash2 className="h-4 w-4 text-slate-500 group-hover:text-red-400 transition-colors" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-slate-500 py-12">No warehouses found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Add / Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">
                            {editingWarehouse ? "Edit Warehouse" : "Add Warehouse"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-slate-700 dark:text-slate-300">Warehouse Name <span className="text-red-500">*</span></Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Central Depot"
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-700 dark:text-slate-300">Location</Label>
                            <Input
                                value={form.location}
                                onChange={(e) => setForm({ ...form, location: e.target.value })}
                                placeholder="e.g. Mumbai, MH"
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                            {editingWarehouse ? "Save Changes" : "Add Warehouse"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!warehouseToDelete} onOpenChange={(open) => !open && setWarehouseToDelete(null)}>
                <AlertDialogContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-900 dark:text-white">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                            This will permanently delete the warehouse. Stock levels associated with it may be affected.
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

export default Warehouses;
