/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Search, Receipt, FileText, AlertTriangle, CheckCircle, Pencil, Trash2, Calendar as CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotification } from "@/components/useNotification";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const STATUS_OPTIONS: string[] = ["Unpaid", "Partially Paid", "Paid", "Overdue", "Cancelled"];

const statusColor: Record<string, string> = {
    "Unpaid": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    "Partially Paid": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "Paid": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    "Overdue": "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    "Cancelled": "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const emptyForm = () => ({
    bill_number: `BILL-${Date.now().toString().slice(-6)}`,
    purchase_order_id: "",
    supplier_id: "",
    bill_date: new Date().toISOString().split("T")[0],
    due_date: "",
    total_amount: "",
    status: "Unpaid",
});

const Bills: React.FC = () => {
    const { showSuccess, showError } = useNotification();
    const [bills, setBills] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBill, setEditingBill] = useState<any | null>(null);
    const [deletingBill, setDeletingBill] = useState<any | null>(null);
    const [isBillDateOpen, setIsBillDateOpen] = useState(false);
    const [isDueDateOpen, setIsDueDateOpen] = useState(false);
    const [form, setForm] = useState(emptyForm());

    const fetchAll = useCallback(async () => {
        try {
            const [billsRes, suppliersRes, posRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/inventory/bills`, { credentials: "include" }),
                fetch(`${API_BASE_URL}/admin/inventory/suppliers`, { credentials: "include" }),
                fetch(`${API_BASE_URL}/admin/inventory/purchase-orders`, { credentials: "include" }),
            ]);
            if (billsRes.ok) setBills(await billsRes.json());
            if (suppliersRes.ok) setSuppliers(await suppliersRes.json());
            if (posRes.ok) setPurchaseOrders(await posRes.json());
        } catch { showError("Failed to load data"); }
    }, [showError]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const openCreate = () => { setEditingBill(null); setForm(emptyForm()); setIsModalOpen(true); };

    const openEdit = (bill: any) => {
        setEditingBill(bill);
        setForm({
            bill_number: bill.bill_number || "",
            purchase_order_id: bill.purchase_order_id ? String(bill.purchase_order_id) : "",
            supplier_id: bill.supplier_id ? String(bill.supplier_id) : "",
            bill_date: bill.bill_date ? bill.bill_date.split("T")[0] : "",
            due_date: bill.due_date ? bill.due_date.split("T")[0] : "",
            total_amount: String(bill.total_amount || ""),
            status: bill.status || "Unpaid",
        });
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingBill) return;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/inventory/bills/${deletingBill.id}`, {
                method: "DELETE", credentials: "include",
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
            showSuccess("Bill deleted successfully");
            setDeletingBill(null);
            fetchAll();
        } catch (err: any) { showError(err.message); }
    };

    const handleSave = async () => {
        if (!form.bill_number.trim()) { showError("Bill number is required"); return; }
        if (!form.supplier_id) { showError("Please select a supplier"); return; }
        if (!form.bill_date) { showError("Bill date is required"); return; }
        if (!form.total_amount || Number(form.total_amount) <= 0) { showError("Total amount must be greater than 0"); return; }
        if (form.due_date && form.due_date < form.bill_date) { showError("Due date cannot be before bill date"); return; }
        try {
            const url = editingBill
                ? `${API_BASE_URL}/admin/inventory/bills/${editingBill.id}`
                : `${API_BASE_URL}/admin/inventory/bills`;
            const method = editingBill ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    ...form,
                    purchase_order_id: form.purchase_order_id || null,
                    total_amount: Number(form.total_amount),
                }),
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.message || `Failed to ${editingBill ? "update" : "create"} bill`); }
            showSuccess(`Bill ${editingBill ? "updated" : "created"} successfully`);
            setIsModalOpen(false);
            fetchAll();
        } catch (err: any) { showError(err.message); }
    };

    // Auto-fill from PO
    const handlePOSelect = (poId: string) => {
        const resolvedId = poId === "none" ? "" : poId;
        setForm(p => ({ ...p, purchase_order_id: resolvedId }));
        if (resolvedId) {
            const po = purchaseOrders.find(o => String(o.id) === resolvedId);
            if (po) setForm(p => ({
                ...p, purchase_order_id: resolvedId,
                supplier_id: po.supplier_id ? String(po.supplier_id) : p.supplier_id,
                total_amount: po.total_amount ? String(po.total_amount) : p.total_amount,
            }));
        }
    };

    const generateBillPDF = async (bill: any) => {
        const doc = new jsPDF();

        // Constants for layout
        const leftMargin = 14;
        let startY = 15;

        // Colors
        const primaryColor: [number, number, number] = [31, 41, 55]; // Slate 800
        const accentColor: [number, number, number] = [37, 99, 235]; // Blue 600

        // Fetch and embed Company Logo
        try {
            const response = await fetch('/logo.png');
            const blob = await response.blob();
            const reader = new FileReader();
            await new Promise((resolve) => {
                reader.onloadend = resolve;
                reader.readAsDataURL(blob);
            });
            const base64data = reader.result as string;

            // Load an Image element to get intrinsic dimensions
            const img = new Image();
            img.src = base64data;
            await new Promise((resolve) => {
                img.onload = resolve;
            });

            // Calculate width based on a fixed height of 28 to preserve aspect ratio
            const targetHeight = 15;
            const aspectRatio = img.width / img.height;
            const targetWidth = targetHeight * aspectRatio;

            // Add Logo (x, y, width, height)
            doc.addImage(base64data, 'PNG', leftMargin, startY, targetWidth, targetHeight);
        } catch (e) {
            console.error("Could not load logo", e);
        }

        // Right align company details
        const rightAlignX = 196; // Right margin edge (210 - 14)

        doc.setFontSize(18);
        doc.setTextColor(...accentColor);
        doc.text("AUTO COMPUTATION", rightAlignX, startY + 8, { align: "right" });

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        
        let textY = startY + 14;
        const addressText = "Chinar park, near loknath temple, rajarhat main road, kolkata - 700157";
        doc.text(addressText, rightAlignX, textY, { align: "right" });
        
        textY += 5;
        doc.text("Phone: 1234567890 | Email: autocomputation123@gmail.com", rightAlignX, textY, { align: "right" });

        startY = textY + 15;

        // Bill Summary Info (Header)
        doc.setFontSize(11);
        doc.setTextColor(...primaryColor);
        doc.setFont("helvetica", "bold");
        doc.text("BILL TO:", leftMargin, startY);
        
        doc.text("BILL DETAILS:", 140, startY);
        
        doc.setFont("helvetica", "normal");
        startY += 7;
        doc.text(bill.supplier_name || "Unknown Supplier", leftMargin, startY);

        doc.text(`Bill Number:`, 140, startY);
        doc.text(bill.bill_number || "N/A", 170, startY);
        
        startY += 6;
        doc.text(`Date Issued:`, 140, startY);
        doc.text(bill.bill_date ? new Date(bill.bill_date).toLocaleDateString() : "N/A", 170, startY);

        startY += 6;
        doc.text(`Due Date:`, 140, startY);
        doc.text(bill.due_date ? new Date(bill.due_date).toLocaleDateString() : "N/A", 170, startY);

        startY += 6;
        doc.text(`Status:`, 140, startY);
        doc.setTextColor(22, 163, 74); // Green color for Paid status
        doc.setFont("helvetica", "bold");
        doc.text(bill.status || "Paid", 170, startY);

        startY += 15;

        // Get formatted PO Number
        let poNumberText = `#${bill.purchase_order_id}`;
        if (bill.purchase_order_id) {
            const po = purchaseOrders.find(o => String(o.id) === String(bill.purchase_order_id));
            if (po && po.order_number) poNumberText = po.order_number;
        }

        // Table Data
        autoTable(doc, {
            startY,
            head: [["Description", "Amount"]],
            body: [
                [`Payment for Bill ${bill.bill_number}`, `Rs. ${Number(bill.total_amount || 0).toLocaleString()}`],
                ...(bill.purchase_order_id ? [[`Linked to Purchase Order ${poNumberText}`, ""]] : []),
            ],
            theme: 'grid',
            headStyles: { fillColor: accentColor, textColor: 255 },
            styles: { fontSize: 10, cellPadding: 5 },
            columnStyles: {
                0: { cellWidth: 130 },
                1: { cellWidth: 50, halign: 'right' }
            }
        });

        // Totals Section
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.setFont("helvetica", "bold");
        doc.text("Total Paid:", 120, finalY);
        doc.text(`Rs. ${Number(bill.total_amount || 0).toLocaleString()}`, 160, finalY, { align: "left" });

        // Footer Note
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text("Thank you for your business!", leftMargin, finalY + 40);

        // Download Action
        doc.save(`${bill.bill_number}_Invoice.pdf`);
    };

    const today = new Date().toISOString().split("T")[0];
    const totalBills = bills.length;
    const unpaidAmount = bills.filter(b => b.status === "Unpaid" || b.status === "Overdue" || b.status === "Partially Paid" || (b.status === "Unpaid" && b.due_date && b.due_date < today)).reduce((s, b) => s + Number(b.total_amount || 0), 0);
    const paidAmount = bills.filter(b => b.status === "Paid" || b.status === "Partially Paid").reduce((s, b) => s + Number(b.total_amount || 0), 0);

    const filtered = bills.filter(b =>
        (b.bill_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.supplier_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Bills</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Track vendor invoices and payables.</p>
                </div>
                <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" /> Add Bill
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <Card className="bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 p-5 flex items-start gap-4">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg"><FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
                    <div><p className="text-sm text-slate-500 dark:text-slate-400">Total Bills</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{totalBills}</p></div>
                </Card>
                <Card className="bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 p-5 flex items-start gap-4">
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg"><AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" /></div>
                    <div><p className="text-sm text-slate-500 dark:text-slate-400">Unpaid / Overdue</p><p className="text-2xl font-bold text-amber-600 dark:text-amber-400">₹{unpaidAmount.toLocaleString()}</p></div>
                </Card>
                <Card className="bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 p-5 flex items-start gap-4">
                    <div className="p-2.5 bg-green-50 dark:bg-green-900/20 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" /></div>
                    <div><p className="text-sm text-slate-500 dark:text-slate-400">Total Paid</p><p className="text-2xl font-bold text-green-600 dark:text-green-400">₹{paidAmount.toLocaleString()}</p></div>
                </Card>
            </div>

            <div className="relative w-full max-w-sm mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search by bill # or supplier..." className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {filtered.map((b) => {
                    const statusStr = b.status || "Unpaid";
                    const isOverdue = b.due_date && b.due_date < today && statusStr !== "Paid";
                    return (
                        <Card key={b.id} className="bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 p-5">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white font-mono">{b.bill_number}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{b.supplier_name || "—"}</p>
                                </div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isOverdue ? statusColor["Overdue"] : statusColor[statusStr] || statusColor["Unpaid"]}`}>
                                    {isOverdue ? "Overdue" : statusStr}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-xs text-slate-500 dark:text-slate-400 mt-2">
                                <span>Bill: {b.bill_date ? new Date(b.bill_date).toLocaleDateString() : "—"}</span>
                                <span className={isOverdue ? "text-red-500 font-medium" : ""}>Due: {b.due_date ? new Date(b.due_date).toLocaleDateString() : "—"}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="font-semibold text-slate-900 dark:text-white">₹{Number(b.total_amount || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                {statusStr === "Paid" && (
                                    <Button size="sm" variant="outline" onClick={() => generateBillPDF(b)} className="flex-1 border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer gap-1 text-xs">
                                        <Download className="h-3.5 w-3.5" /> PDF
                                    </Button>
                                )}
                                <Button size="sm" variant="outline" onClick={() => openEdit(b)} className="flex-1 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer gap-1 text-xs">
                                    <Pencil className="h-3.5 w-3.5" /> Edit
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setDeletingBill(b)} className="flex-1 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer gap-1 text-xs">
                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                </Button>
                            </div>
                        </Card>
                    );
                })}
                {filtered.length === 0 && <p className="text-slate-500 text-center py-10">No bills found.</p>}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900">
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Bill #</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Supplier</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Bill Date</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Due Date</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Status</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold text-right">Amount</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((b) => {
                            const statusStr = b.status || "Unpaid";
                            const isOverdue = b.due_date && b.due_date.split("T")[0] < today && statusStr !== "Paid";
                            return (
                                <TableRow key={b.id} className="bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border-slate-200 dark:border-slate-800">
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                                                <Receipt className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <span className="font-mono font-medium text-slate-900 dark:text-white text-sm">{b.bill_number}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600 dark:text-slate-300 text-sm">{b.supplier_name || "—"}</TableCell>
                                    <TableCell className="text-slate-500 dark:text-slate-400 text-sm">{b.bill_date ? new Date(b.bill_date).toLocaleDateString() : "—"}</TableCell>
                                    <TableCell className={`text-sm font-medium ${isOverdue ? "text-red-500 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
                                        {b.due_date ? new Date(b.due_date).toLocaleDateString() : "—"}
                                        {isOverdue && <span className="ml-1 text-xs">(Overdue)</span>}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isOverdue ? statusColor["Overdue"] : statusColor[statusStr] || statusColor["Unpaid"]}`}>
                                            {isOverdue ? "Overdue" : statusStr}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-slate-900 dark:text-white">₹{Number(b.total_amount || 0).toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {statusStr === "Paid" && (
                                                <Button size="icon" variant="ghost" onClick={() => generateBillPDF(b)} title="Download PDF" className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button size="icon" variant="ghost" onClick={() => openEdit(b)} className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => setDeletingBill(b)} className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {filtered.length === 0 && (
                            <TableRow><TableCell colSpan={7} className="text-center text-slate-500 py-12">No bills found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create / Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">{editingBill ? "Edit Bill" : "Add New Bill"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="space-y-2">
                            <Label className="text-slate-700 dark:text-slate-300">Link to Purchase Order (optional)</Label>
                            <Select value={form.purchase_order_id || "none"} onValueChange={handlePOSelect}>
                                <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"><SelectValue placeholder="Select Purchase Order" /></SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                    <SelectItem value="none" className="text-slate-500 dark:text-slate-400 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">None</SelectItem>
                                    {purchaseOrders.map(po => <SelectItem key={po.id} value={String(po.id)} className="text-slate-900 dark:text-gray-100 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">{po.order_number} — {po.supplier_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300">Bill Number <span className="text-red-500">*</span></Label>
                                <Input value={form.bill_number} onChange={e => setForm(p => ({ ...p, bill_number: e.target.value }))} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono" />
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
                                <Label className="text-slate-700 dark:text-slate-300">Bill Date <span className="text-red-500">*</span></Label>
                                <Popover open={isBillDateOpen} onOpenChange={setIsBillDateOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={`w-full justify-start text-left font-normal bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white ${!form.bill_date && "text-muted-foreground"}`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {form.bill_date ? format(new Date(form.bill_date), "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={form.bill_date ? new Date(form.bill_date) : undefined}
                                            onSelect={(date) => {
                                                const dateStr = date ? format(date, "yyyy-MM-dd") : "";
                                                setForm(p => ({ ...p, bill_date: dateStr }));
                                                setIsBillDateOpen(false);
                                            }}
                                            disabled={(date) => date > new Date()}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2 flex flex-col">
                                <Label className="text-slate-700 dark:text-slate-300">Due Date</Label>
                                <Popover open={isDueDateOpen} onOpenChange={setIsDueDateOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={`w-full justify-start text-left font-normal bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white ${!form.due_date && "text-muted-foreground"}`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {form.due_date ? format(new Date(form.due_date), "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={form.due_date ? new Date(form.due_date) : undefined}
                                            onSelect={(date) => {
                                                const dateStr = date ? format(date, "yyyy-MM-dd") : "";
                                                setForm(p => ({ ...p, due_date: dateStr }));
                                                setIsDueDateOpen(false);
                                            }}
                                            disabled={(date) => form.bill_date ? date < new Date(form.bill_date + 'T00:00:00') : false}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300">Total Amount (₹) <span className="text-red-500">*</span></Label>
                                <Input type="number" min={0} value={form.total_amount} onChange={e => setForm(p => ({ ...p, total_amount: e.target.value }))} placeholder="0.00" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300">Status</Label>
                                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                                    <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                        {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s} className="text-slate-900 dark:text-gray-100 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">Cancel</Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                            {editingBill ? "Update Bill" : "Add Bill"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingBill} onOpenChange={open => !open && setDeletingBill(null)}>
                <AlertDialogContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-900 dark:text-white">Delete Bill?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                            This will permanently delete bill <span className="font-semibold text-slate-700 dark:text-slate-300">{deletingBill?.bill_number}</span>. This action cannot be undone.
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

export default Bills;
