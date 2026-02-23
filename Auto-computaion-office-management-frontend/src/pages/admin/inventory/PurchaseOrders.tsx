/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ShoppingCart, PackagePlus, X, Pencil, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotification } from "@/components/useNotification";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const STATUS_OPTIONS = ["draft", "pending", "approved", "delivered", "cancelled"];
const DELIVERY_STATUS_OPTIONS = ["pending", "in_transit", "delivered", "returned"];

const statusColor: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const emptyItem = () => ({
    product_id: "",
    item_name: "",
    quantity: 1,
    unit: "",
    unit_price: 0,
    tax_rate: 0,
    tax_amount: 0,
    total_price: 0,
    description: "",
});

const emptyForm = () => ({
    order_number: `PO-${Date.now().toString().slice(-6)}`,
    supplier_id: "",
    order_date: new Date().toISOString().split("T")[0],
    expected_delivery_date: "",
    delivery_address: "",
    delivery_status: "pending",
    status: "draft",
    notes: "",
    items: [emptyItem()],
});

const PurchaseOrders: React.FC = () => {
    const { showSuccess, showError } = useNotification();
    const [orders, setOrders] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<any | null>(null);
    const [deletingOrder, setDeletingOrder] = useState<any | null>(null);
    const [isOrderDateOpen, setIsOrderDateOpen] = useState(false);
    const [isExpectedDateOpen, setIsExpectedDateOpen] = useState(false);
    const [form, setForm] = useState(emptyForm());

    const fetchAll = useCallback(async () => {
        try {
            const [ordersRes, suppliersRes, productsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/inventory/purchase-orders`, { credentials: "include" }),
                fetch(`${API_BASE_URL}/admin/inventory/suppliers`, { credentials: "include" }),
                fetch(`${API_BASE_URL}/admin/inventory/products`, { credentials: "include" }),
            ]);
            if (ordersRes.ok) setOrders(await ordersRes.json());
            if (suppliersRes.ok) setSuppliers(await suppliersRes.json());
            if (productsRes.ok) setProducts(await productsRes.json());
        } catch {
            showError("Failed to load data");
        }
    }, [showError]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const openCreate = () => { setEditingOrder(null); setForm(emptyForm()); setIsModalOpen(true); };

    const openEdit = async (order: any) => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/inventory/purchase-orders/${order.id}`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch order details");
            const data = await res.json();
            setEditingOrder(data);
            setForm({
                order_number: data.order_number || "",
                supplier_id: data.supplier_id ? String(data.supplier_id) : "",
                order_date: data.order_date ? data.order_date.split("T")[0] : "",
                expected_delivery_date: data.expected_delivery_date ? data.expected_delivery_date.split("T")[0] : "",
                delivery_address: data.delivery_address || "",
                delivery_status: data.delivery_status || "pending",
                status: data.status || "draft",
                notes: data.notes || "",
                items: data.items && data.items.length > 0
                    ? data.items.map((it: any) => ({
                        product_id: it.product_id ? String(it.product_id) : "",
                        item_name: it.item_name || "",
                        quantity: it.quantity || 1,
                        unit: it.unit || "",
                        unit_price: Number(it.unit_price) || 0,
                        tax_rate: Number(it.tax_rate) || 0,
                        tax_amount: Number(it.tax_amount) || 0,
                        total_price: Number(it.total_price) || 0,
                        description: it.description || "",
                    }))
                    : [emptyItem()],
            });
            setIsModalOpen(true);
        } catch (err: any) {
            showError(err.message);
        }
    };

    const handleDelete = async () => {
        if (!deletingOrder) return;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/inventory/purchase-orders/${deletingOrder.id}`, {
                method: "DELETE", credentials: "include",
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
            showSuccess("Purchase order deleted successfully");
            setDeletingOrder(null);
            fetchAll();
        } catch (err: any) { showError(err.message); }
    };

    const updateItem = (idx: number, field: string, value: any) => {
        setForm(prev => {
            const items = [...prev.items];
            items[idx] = { ...items[idx], [field]: value };
            const qty = Number(field === "quantity" ? value : items[idx].quantity);
            const price = Number(field === "unit_price" ? value : items[idx].unit_price);
            const taxRate = Number(field === "tax_rate" ? value : items[idx].tax_rate);
            const subtotal = qty * price;
            const taxAmt = subtotal * (taxRate / 100);
            items[idx].tax_amount = parseFloat(taxAmt.toFixed(2));
            items[idx].total_price = parseFloat((subtotal + taxAmt).toFixed(2));
            return { ...prev, items };
        });
    };

    const addItem = () => setForm(prev => ({ ...prev, items: [...prev.items, emptyItem()] }));
    const removeItem = (idx: number) => setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
    const totalAmount = form.items.reduce((sum, it) => sum + Number(it.total_price), 0);

    const handleSave = async () => {
        if (!form.order_number.trim()) { showError("Order number is required"); return; }
        if (!form.supplier_id) { showError("Please select a supplier"); return; }
        if (!form.order_date) { showError("Order date is required"); return; }
        if (form.items.length === 0) { showError("Add at least one item"); return; }
        for (const it of form.items) {
            if (!it.item_name.trim()) { showError("All items must have a name"); return; }
            if (Number(it.quantity) <= 0) { showError("Quantity must be greater than 0"); return; }
        }
        try {
            const url = editingOrder
                ? `${API_BASE_URL}/admin/inventory/purchase-orders/${editingOrder.id}`
                : `${API_BASE_URL}/admin/inventory/purchase-orders`;
            const method = editingOrder ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ ...form, total_amount: totalAmount }),
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.message || `Failed to ${editingOrder ? "update" : "create"} purchase order`); }
            showSuccess(`Purchase order ${editingOrder ? "updated" : "created"} successfully`);
            setIsModalOpen(false);
            fetchAll();
        } catch (err: any) { showError(err.message); }
    };

    const filtered = orders.filter(o =>
        (o.order_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.supplier_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Purchase Orders</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Create and track orders from suppliers.</p>
                </div>
                <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" /> New Purchase Order
                </Button>
            </div>

            <div className="relative w-full max-w-sm mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search by order # or supplier..." className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {filtered.map((o) => (
                    <Card key={o.id} className="bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 p-5">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white font-mono">{o.order_number}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{o.supplier_name || "—"}</p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[o.status] || statusColor.draft}`}>{o.status}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 mt-2">
                            <span>{o.order_date ? new Date(o.order_date).toLocaleDateString() : "—"}</span>
                            <span className="font-semibold text-slate-900 dark:text-white">₹{Number(o.total_amount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <Button size="sm" variant="outline" onClick={() => openEdit(o)} className="flex-1 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer gap-1 text-xs">
                                <Pencil className="h-3.5 w-3.5" /> Edit
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setDeletingOrder(o)} className="flex-1 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer gap-1 text-xs">
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                            </Button>
                        </div>
                    </Card>
                ))}
                {filtered.length === 0 && <p className="text-slate-500 text-center py-10">No purchase orders found.</p>}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900">
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Order #</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Supplier</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Order Date</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Exp. Delivery</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold text-center">Items</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Status</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold text-right">Total</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((o) => (
                            <TableRow key={o.id} className="bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border-slate-200 dark:border-slate-800">
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                            <ShoppingCart className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="font-mono font-medium text-slate-900 dark:text-white text-sm">{o.order_number}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-slate-600 dark:text-slate-300 text-sm">{o.supplier_name || "—"}</TableCell>
                                <TableCell className="text-slate-500 dark:text-slate-400 text-sm">{o.order_date ? new Date(o.order_date).toLocaleDateString() : "—"}</TableCell>
                                <TableCell className="text-slate-500 dark:text-slate-400 text-sm">{o.expected_delivery_date ? new Date(o.expected_delivery_date).toLocaleDateString() : "—"}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className="dark:border-slate-700 dark:text-slate-300">{o.item_count || 0}</Badge>
                                </TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[o.status] || statusColor.draft}`}>{o.status}</span>
                                </TableCell>
                                <TableCell className="text-right font-semibold text-slate-900 dark:text-white">₹{Number(o.total_amount || 0).toLocaleString()}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button size="icon" variant="ghost" onClick={() => openEdit(o)} className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => setDeletingOrder(o)} className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow><TableCell colSpan={8} className="text-center text-slate-500 py-12">No purchase orders found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create / Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[750px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">{editingOrder ? "Edit Purchase Order" : "New Purchase Order"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300">Order Number <span className="text-red-500">*</span></Label>
                                <Input value={form.order_number} onChange={e => setForm(p => ({ ...p, order_number: e.target.value }))} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300">Supplier <span className="text-red-500">*</span></Label>
                                <Select value={form.supplier_id} onValueChange={v => setForm(p => ({ ...p, supplier_id: v }))}>
                                    <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"><SelectValue placeholder="Select Supplier" /></SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                        {suppliers.map(s => <SelectItem key={s.id} value={String(s.id)} className="text-slate-900 dark:text-gray-100 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 flex flex-col">
                                <Label className="text-slate-700 dark:text-slate-300">Order Date <span className="text-red-500">*</span></Label>
                                <Popover open={isOrderDateOpen} onOpenChange={setIsOrderDateOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={`w-full justify-start text-left font-normal bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white ${!form.order_date && "text-muted-foreground"}`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {form.order_date ? format(new Date(form.order_date), "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={form.order_date ? new Date(form.order_date) : undefined}
                                            onSelect={(date) => {
                                                const dateStr = date ? format(date, "yyyy-MM-dd") : "";
                                                setForm(p => ({ ...p, order_date: dateStr }));
                                                setIsOrderDateOpen(false);
                                            }}
                                            disabled={(date) => date > new Date()}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2 flex flex-col">
                                <Label className="text-slate-700 dark:text-slate-300">Expected Delivery</Label>
                                <Popover open={isExpectedDateOpen} onOpenChange={setIsExpectedDateOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={`w-full justify-start text-left font-normal bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white ${!form.expected_delivery_date && "text-muted-foreground"}`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {form.expected_delivery_date ? format(new Date(form.expected_delivery_date), "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={form.expected_delivery_date ? new Date(form.expected_delivery_date) : undefined}
                                            onSelect={(date) => {
                                                const dateStr = date ? format(date, "yyyy-MM-dd") : "";
                                                setForm(p => ({ ...p, expected_delivery_date: dateStr }));
                                                setIsExpectedDateOpen(false);
                                            }}
                                            disabled={(date) => form.order_date ? date < new Date(form.order_date + 'T00:00:00') : false}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300">Status</Label>
                                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                                    <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                        {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s} className="text-slate-900 dark:text-gray-100 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer capitalize">{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300">Delivery Status</Label>
                                <Select value={form.delivery_status} onValueChange={v => setForm(p => ({ ...p, delivery_status: v }))}>
                                    <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                        {DELIVERY_STATUS_OPTIONS.map(s => <SelectItem key={s} value={s} className="text-slate-900 dark:text-gray-100 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer capitalize">{s.replace("_", " ")}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-700 dark:text-slate-300">Delivery Address</Label>
                            <Input value={form.delivery_address} onChange={e => setForm(p => ({ ...p, delivery_address: e.target.value }))} placeholder="Delivery address..." className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
                        </div>

                        {/* Items */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <Label className="text-slate-700 dark:text-slate-300 font-semibold">Order Items</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addItem} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs gap-1">
                                    <PackagePlus className="h-3.5 w-3.5" /> Add Item
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {form.items.map((item, idx) => (
                                    <div key={idx} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-900/50 relative">
                                        {form.items.length > 1 && (
                                            <button type="button" onClick={() => removeItem(idx)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors">
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <div className="space-y-1">
                                                <Label className="text-xs text-slate-600 dark:text-slate-400">Product (optional)</Label>
                                                <Select value={item.product_id} onValueChange={v => {
                                                    const prod = products.find(p => String(p.id) === v);
                                                    updateItem(idx, "product_id", v);
                                                    if (prod) { updateItem(idx, "item_name", prod.name); updateItem(idx, "unit", prod.unit || ""); updateItem(idx, "unit_price", prod.unit_price || 0); }
                                                }}>
                                                    <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm h-8"><SelectValue placeholder="Select product" /></SelectTrigger>
                                                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                                        {products.map(p => <SelectItem key={p.id} value={String(p.id)} className="text-slate-900 dark:text-gray-100 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer text-sm">{p.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs text-slate-600 dark:text-slate-400">Item Name <span className="text-red-500">*</span></Label>
                                                <Input value={item.item_name} onChange={e => updateItem(idx, "item_name", e.target.value)} placeholder="Item name" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm h-8" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            <div className="space-y-1">
                                                <Label className="text-xs text-slate-600 dark:text-slate-400">Qty <span className="text-red-500">*</span></Label>
                                                <Input 
                                                    type="number" 
                                                    min={1} 
                                                    value={item.quantity === 0 ? "" : item.quantity} 
                                                    onFocus={() => { if (item.quantity === 0) updateItem(idx, "quantity", "") }}
                                                    onChange={e => {
                                                        let val = e.target.value;
                                                        if (Number(val) < 0) val = "0";
                                                        updateItem(idx, "quantity", val);
                                                    }} 
                                                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm h-8" 
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs text-slate-600 dark:text-slate-400">Unit</Label>
                                                <Select value={item.unit || "pcs"} onValueChange={v => updateItem(idx, "unit", v)}>
                                                    <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm h-8">
                                                        <SelectValue placeholder="Unit" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                                        <SelectItem value="pcs" className="text-slate-900 dark:text-gray-100 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Pieces (pcs)</SelectItem>
                                                        <SelectItem value="kg" className="text-slate-900 dark:text-gray-100 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Kilograms (kg)</SelectItem>
                                                        <SelectItem value="g" className="text-slate-900 dark:text-gray-100 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Grams (g)</SelectItem>
                                                        <SelectItem value="ltr" className="text-slate-900 dark:text-gray-100 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Liters (ltr)</SelectItem>
                                                        <SelectItem value="ml" className="text-slate-900 dark:text-gray-100 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Milliliters (ml)</SelectItem>
                                                        <SelectItem value="box" className="text-slate-900 dark:text-gray-100 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Boxes (box)</SelectItem>
                                                        <SelectItem value="pack" className="text-slate-900 dark:text-gray-100 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Packs (pack)</SelectItem>
                                                        <SelectItem value="dozen" className="text-slate-900 dark:text-gray-100 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Dozen (dozen)</SelectItem>
                                                        <SelectItem value="m" className="text-slate-900 dark:text-gray-100 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Meters (m)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs text-slate-600 dark:text-slate-400">Unit Price (₹)</Label>
                                                <Input 
                                                    type="number" 
                                                    min={0} 
                                                    value={item.unit_price === 0 ? "" : item.unit_price} 
                                                    onFocus={() => { if (item.unit_price === 0) updateItem(idx, "unit_price", "") }}
                                                    onChange={e => {
                                                        let val = e.target.value;
                                                        if (Number(val) < 0) val = "0";
                                                        updateItem(idx, "unit_price", val);
                                                    }} 
                                                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm h-8" 
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs text-slate-600 dark:text-slate-400">Tax %</Label>
                                                <Input 
                                                    type="number" 
                                                    min={0} 
                                                    max={100} 
                                                    value={item.tax_rate === 0 ? "" : item.tax_rate} 
                                                    onFocus={() => { if (item.tax_rate === 0) updateItem(idx, "tax_rate", "") }}
                                                    onChange={e => {
                                                        let val = e.target.value;
                                                        if (Number(val) < 0) val = "0";
                                                        if (Number(val) > 100) val = "100";
                                                        updateItem(idx, "tax_rate", val);
                                                    }} 
                                                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm h-8" 
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end mt-2">
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total: ₹{Number(item.total_price).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end mt-3 px-1">
                                <span className="text-base font-bold text-slate-900 dark:text-white">Grand Total: ₹{totalAmount.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-700 dark:text-slate-300">Notes</Label>
                            <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Additional notes..." className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">Cancel</Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                            {editingOrder ? "Update Purchase Order" : "Create Purchase Order"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingOrder} onOpenChange={open => !open && setDeletingOrder(null)}>
                <AlertDialogContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-900 dark:text-white">Delete Purchase Order?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                            This will permanently delete <span className="font-semibold text-slate-700 dark:text-slate-300">{deletingOrder?.order_number}</span> and all its line items. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PurchaseOrders;
