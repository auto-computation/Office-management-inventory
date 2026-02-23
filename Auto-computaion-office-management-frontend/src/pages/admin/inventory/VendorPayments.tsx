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
import { Plus, Search, CreditCard, Wallet, TrendingUp, Pencil, Trash2, Upload, FileText, Calendar as CalendarIcon } from "lucide-react";
import { useNotification } from "@/components/useNotification";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const PAYMENT_METHODS = ["bank_transfer", "cash", "cheque", "upi", "credit_card", "debit_card", "neft", "rtgs", "imps", "other"];

const methodLabel: Record<string, string> = {
    bank_transfer: "Bank Transfer", cash: "Cash", cheque: "Cheque", upi: "UPI",
    credit_card: "Credit Card", debit_card: "Debit Card", neft: "NEFT", rtgs: "RTGS", imps: "IMPS", other: "Other",
};

const methodColor: Record<string, string> = {
    bank_transfer: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    cash: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    cheque: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    upi: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    credit_card: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    debit_card: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    neft: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    rtgs: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    imps: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    other: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const openProof = (base64Str: string) => {
    try {
        if (!base64Str) return;
        if (!base64Str.startsWith("data:")) {
            window.open(base64Str, "_blank");
            return;
        }
        const arr = base64Str.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch) return;
        const mime = mimeMatch[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], {type: mime});
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
        console.error("Error opening file", error);
        window.open(base64Str, "_blank");
    }
};

const emptyForm = () => ({
    bill_id: "",
    payment_date: new Date().toISOString().split("T")[0],
    amount: "",
    payment_method: "bank_transfer",
    reference_number: "",
    proof_of_payment: "",
});

const VendorPayments: React.FC = () => {
    const { showSuccess, showError } = useNotification();
    const [payments, setPayments] = useState<any[]>([]);
    const [bills, setBills] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDateOpen, setIsDateOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<any | null>(null);
    const [deletingPayment, setDeletingPayment] = useState<any | null>(null);
    const [form, setForm] = useState(emptyForm());

    const fetchAll = useCallback(async () => {
        try {
            const [paymentsRes, billsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/inventory/vendor-payments`, { credentials: "include" }),
                fetch(`${API_BASE_URL}/admin/inventory/bills`, { credentials: "include" }),
            ]);
            if (paymentsRes.ok) setPayments(await paymentsRes.json());
            if (billsRes.ok) setBills(await billsRes.json());
        } catch {
            showError("Failed to load data");
        }
    }, [showError]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const openCreate = () => { setEditingPayment(null); setForm(emptyForm()); setIsModalOpen(true); };

    const openEdit = (pmt: any) => {
        setEditingPayment(pmt);
        setForm({
            bill_id: pmt.bill_id ? String(pmt.bill_id) : "",
            payment_date: pmt.payment_date ? pmt.payment_date.split("T")[0] : new Date().toISOString().split("T")[0],
            amount: String(pmt.amount || ""),
            payment_method: pmt.payment_method || "bank_transfer",
            reference_number: pmt.reference_number || "",
            proof_of_payment: pmt.proof_of_payment || "",
        });
        setIsModalOpen(true);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setForm(prev => ({ ...prev, proof_of_payment: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const selectedBillId = form.bill_id;
    const selectedBill = bills.find(b => String(b.id) === String(selectedBillId));
    let maxAmount = Infinity;
    let remainingAmountText = "";

    if (selectedBill) {
        const paidForBill = payments
            .filter(p => String(p.bill_id) === String(selectedBillId) && p.id !== editingPayment?.id)
            .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const max = Number(selectedBill.total_amount) - paidForBill;
        maxAmount = max > 0 ? max : 0;
        remainingAmountText = `(Max: ₹${maxAmount.toLocaleString()})`;
    }

    const handleSave = async () => {
        if (!form.amount || Number(form.amount) <= 0) { showError("Amount must be greater than 0"); return; }
        if (maxAmount !== Infinity && Number(form.amount) > maxAmount) {
             showError(`Amount cannot exceed the remaining bill amount of ₹${maxAmount.toLocaleString()}`);
             return;
        }
        if (!form.payment_date) { showError("Payment date is required"); return; }
        if (!form.proof_of_payment) { showError("Proof of payment is required"); return; }
        try {
            const url = editingPayment
                ? `${API_BASE_URL}/admin/inventory/vendor-payments/${editingPayment.id}`
                : `${API_BASE_URL}/admin/inventory/vendor-payments`;
            const method = editingPayment ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    ...form,
                    bill_id: form.bill_id || null,
                    amount: Number(form.amount),
                    reference_number: form.reference_number || null,
                    proof_of_payment: form.proof_of_payment || null,
                }),
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.message || `Failed to ${editingPayment ? "update" : "record"} payment`); }
            showSuccess(`Payment ${editingPayment ? "updated" : "recorded"} successfully`);
            setIsModalOpen(false);
            fetchAll();
        } catch (err: any) { showError(err.message); }
    };

    const handleDelete = async () => {
        if (!deletingPayment) return;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/inventory/vendor-payments/${deletingPayment.id}`, {
                method: "DELETE", credentials: "include",
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
            showSuccess("Payment deleted successfully");
            setDeletingPayment(null);
            fetchAll();
        } catch (err: any) { showError(err.message); }
    };

    // Summary stats
    const totalPayments = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthPayments = payments.filter(p => p.payment_date && p.payment_date.slice(0, 7) === thisMonth).reduce((s, p) => s + Number(p.amount || 0), 0);
    const txnCount = payments.length;

    const filtered = payments.filter(p =>
        (p.bill_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.supplier_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.reference_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.payment_method || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Vendor Payments</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Track all payments made to suppliers and vendors.</p>
                </div>
                <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" /> Record Payment
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <Card className="bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 p-5 flex items-start gap-4">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg"><Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total Paid Out</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">₹{totalPayments.toLocaleString()}</p>
                    </div>
                </Card>
                <Card className="bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 p-5 flex items-start gap-4">
                    <div className="p-2.5 bg-green-50 dark:bg-green-900/20 rounded-lg"><TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" /></div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">This Month</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">₹{monthPayments.toLocaleString()}</p>
                    </div>
                </Card>
                <Card className="bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 p-5 flex items-start gap-4">
                    <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg"><CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" /></div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total Transactions</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{txnCount}</p>
                    </div>
                </Card>
            </div>

            {/* Search */}
            <div className="relative w-full max-w-sm mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search by bill, supplier, ref #..." className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {filtered.map((pmt) => (
                    <Card key={pmt.id} className="bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 p-5">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">₹{Number(pmt.amount || 0).toLocaleString()}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{pmt.supplier_name || "—"}</p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${methodColor[pmt.payment_method] || methodColor.other}`}>
                                {methodLabel[pmt.payment_method] || pmt.payment_method || "—"}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <span>Bill: <span className="font-mono">{pmt.bill_number || "—"}</span></span>
                            <span>Date: {pmt.payment_date ? new Date(pmt.payment_date).toLocaleDateString() : "—"}</span>
                            <span className="col-span-2">Ref: {pmt.reference_number || "—"}</span>
                            <span className="col-span-2">By: {pmt.recorded_by_name || "—"}</span>
                            <span className="col-span-2 flex items-center gap-1">
                                Proof: {pmt.proof_of_payment ? <button type="button" onClick={() => openProof(pmt.proof_of_payment)} className="text-blue-500 hover:underline">View</button> : "—"}
                            </span>
                        </div>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <Button size="sm" variant="outline" onClick={() => openEdit(pmt)} className="flex-1 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer gap-1 text-xs">
                                <Pencil className="h-3.5 w-3.5" /> Edit
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setDeletingPayment(pmt)} className="flex-1 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer gap-1 text-xs">
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                            </Button>
                        </div>
                    </Card>
                ))}
                {filtered.length === 0 && <p className="text-slate-500 text-center py-10">No payments found.</p>}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900">
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Payment Date</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Supplier</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Bill #</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Method</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Reference #</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Recorded By</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold text-center">Proof</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold text-right">Amount</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((pmt) => (
                            <TableRow key={pmt.id} className="bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border-slate-200 dark:border-slate-800">
                                <TableCell className="text-slate-600 dark:text-slate-300 text-sm">
                                    {pmt.payment_date ? new Date(pmt.payment_date).toLocaleDateString() : "—"}
                                </TableCell>
                                <TableCell className="text-slate-600 dark:text-slate-300 text-sm">{pmt.supplier_name || "—"}</TableCell>
                                <TableCell>
                                    <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{pmt.bill_number || "—"}</span>
                                </TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${methodColor[pmt.payment_method] || methodColor.other}`}>
                                        {methodLabel[pmt.payment_method] || pmt.payment_method || "—"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-slate-500 dark:text-slate-400 text-sm font-mono">{pmt.reference_number || "—"}</TableCell>
                                <TableCell className="text-slate-500 dark:text-slate-400 text-sm">{pmt.recorded_by_name || "—"}</TableCell>
                                <TableCell className="text-center">
                                    {pmt.proof_of_payment ? (
                                        <button type="button" onClick={() => openProof(pmt.proof_of_payment)} className="text-blue-500 hover:underline text-sm cursor-pointer">View</button>
                                    ) : (
                                        <span className="text-slate-400">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="font-bold text-slate-900 dark:text-white">₹{Number(pmt.amount || 0).toLocaleString()}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button size="icon" variant="ghost" onClick={() => openEdit(pmt)} className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => setDeletingPayment(pmt)} className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow><TableCell colSpan={9} className="text-center text-slate-500 py-12">No payments recorded yet.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create / Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[480px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">
                            {editingPayment ? "Edit Payment" : "Record Vendor Payment"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        {/* Bill Link */}
                        <div className="space-y-2">
                            <Label className="text-slate-700 dark:text-slate-300">Link to Bill (optional)</Label>
                            <Select value={form.bill_id || "none"} onValueChange={v => {
                                const resolvedId = v === "none" ? "" : v;
                                const selectedB = bills.find(b => String(b.id) === resolvedId);
                                let defaultAmount = form.amount;
                                if (selectedB) {
                                    const paid = payments
                                        .filter(p => String(p.bill_id) === resolvedId && p.id !== editingPayment?.id)
                                        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
                                    const rem = Number(selectedB.total_amount) - paid;
                                    defaultAmount = rem > 0 ? String(rem) : "0";
                                }
                                setForm(p => ({
                                    ...p,
                                    bill_id: resolvedId,
                                    amount: selectedB ? defaultAmount : p.amount,
                                }));
                            }}>
                                <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                    <SelectValue placeholder="Select Bill" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                    <SelectItem value="none" className="text-slate-500 dark:text-slate-400 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">None</SelectItem>
                                    {bills.filter(b => {
                                        if (String(b.id) === form.bill_id) return true;
                                        if (b.status && b.status.toLowerCase() === "paid") return false;
                                        const paidForBill = payments
                                            .filter(p => String(p.bill_id) === String(b.id) && p.id !== editingPayment?.id)
                                            .reduce((sum, p) => sum + Number(p.amount || 0), 0);
                                        return (Number(b.total_amount) - paidForBill) > 0;
                                    }).map(b => (
                                        <SelectItem key={b.id} value={String(b.id)} className="text-slate-900 dark:text-gray-100 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">
                                            {b.bill_number} — ₹{Number(b.total_amount || 0).toLocaleString()} ({b.status})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Amount & Date */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300">
                                    Amount (₹) <span className="text-red-500">*</span>
                                    {remainingAmountText && <span className="text-xs text-slate-500 ml-2 font-normal">{remainingAmountText}</span>}
                                </Label>
                                <Input
                                    type="number" min={0} max={maxAmount !== Infinity ? maxAmount : undefined} placeholder="0.00"
                                    value={form.amount}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (maxAmount !== Infinity && Number(val) > maxAmount) {
                                            showError(`Amount cannot exceed the remaining bill amount of ₹${maxAmount.toLocaleString()}`);
                                            setForm(p => ({ ...p, amount: String(maxAmount) }));
                                        } else {
                                            setForm(p => ({ ...p, amount: val }));
                                        }
                                    }}
                                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300">Payment Date <span className="text-red-500">*</span></Label>
                                <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white",
                                                !form.payment_date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {form.payment_date ? format(new Date(form.payment_date), "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                                        <Calendar
                                            mode="single"
                                            selected={form.payment_date ? new Date(form.payment_date) : undefined}
                                            onSelect={(date) => {
                                                setForm(p => ({ ...p, payment_date: date ? format(date, "yyyy-MM-dd") : "" }));
                                                setIsDateOpen(false);
                                            }}
                                            disabled={(date) => date > new Date()}
                                            initialFocus
                                            className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-2">
                            <Label className="text-slate-700 dark:text-slate-300">Payment Method <span className="text-red-500">*</span></Label>
                            <Select value={form.payment_method} onValueChange={v => setForm(p => ({ ...p, payment_method: v }))}>
                                <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                    {PAYMENT_METHODS.map(m => (
                                        <SelectItem key={m} value={m} className="text-slate-900 dark:text-gray-100 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">
                                            {methodLabel[m]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Reference Number */}
                        <div className="space-y-2">
                            <Label className="text-slate-700 dark:text-slate-300">Reference / Transaction Number</Label>
                            <Input
                                placeholder="UTR, cheque no., transaction ID..."
                                value={form.reference_number}
                                onChange={e => setForm(p => ({ ...p, reference_number: e.target.value }))}
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                            />
                        </div>

                        {/* Proof of Payment */}
                        <div className="space-y-2">
                            <Label className="text-slate-700 dark:text-slate-300">Proof of Payment <span className="text-red-500">*</span></Label>
                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById("proof-upload")?.click()}
                                    className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                    title="Upload image or PDF"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Choose File
                                </Button>
                                <span className="text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                                    {form.proof_of_payment ? "Proof attached" : "No file chosen"}
                                </span>
                                <input
                                    id="proof-upload"
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </div>
                            {form.proof_of_payment && (
                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-md">
                                    {form.proof_of_payment.startsWith("data:image/") ? (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 text-sm mb-1">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    <span className="font-medium">Image attached</span>
                                                </div>
                                                <button type="button" onClick={() => openProof(form.proof_of_payment)} className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-semibold cursor-pointer">
                                                    Open Full Size
                                                </button>
                                            </div>
                                            <div className="relative w-full h-32 rounded-md overflow-hidden border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 flex items-center justify-center">
                                                <img 
                                                    src={form.proof_of_payment} 
                                                    alt="Proof of Payment Preview" 
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-sm">
                                                <FileText className="h-4 w-4" />
                                                <span className="font-medium">PDF attached</span>
                                            </div>
                                            <button type="button" onClick={() => openProof(form.proof_of_payment)} className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-semibold cursor-pointer">
                                                View File
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                            {editingPayment ? "Update Payment" : "Record Payment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingPayment} onOpenChange={open => !open && setDeletingPayment(null)}>
                <AlertDialogContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-900 dark:text-white">Delete Payment?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                            This will permanently delete the payment of{" "}
                            <span className="font-semibold text-slate-700 dark:text-slate-300">₹{Number(deletingPayment?.amount || 0).toLocaleString()}</span>
                            {deletingPayment?.bill_number ? ` for bill ${deletingPayment.bill_number}` : ""}. This action cannot be undone.
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

export default VendorPayments;
