import React, { useState, useEffect } from 'react';

import {
  Package,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import { useNotification } from "@/components/useNotification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface StockMovement {
  id: number;
  product_id: number;
  product_name: string;
  warehouse_id: number;
  warehouse_name: string;
  to_warehouse_id: number | null;
  to_warehouse_name: string | null;
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  reference_id: string | null;
  notes: string | null;
  created_by_name: string;
  created_at: string;
}

interface ProductOption {
  id: number;
  name: string;
}

interface WarehouseOption {
  id: number;
  name: string;
}

const StockMovements: React.FC = () => {
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const { showSuccess, showError } = useNotification();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [products, setProducts] = useState<ProductOption[]>([]);
    const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [selectedType, setSelectedType] = useState('IN');
    const [selectedTargetWarehouse, setSelectedTargetWarehouse] = useState('');
    const [quantity, setQuantity] = useState('');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');

    const fetchMovements = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/inventory/stock-movements`, {
                credentials: "include"
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setMovements(data);
        } catch (error) {
            console.error("Failed to fetch stock movements:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovements();
    }, []);

    useEffect(() => {
        if (isAddModalOpen) {
            const fetchFormData = async () => {
                try {
                    const [prodRes, wareRes] = await Promise.all([
                        fetch(`${import.meta.env.VITE_API_URL}/api/admin/inventory/products`, { credentials: "include" }),
                        fetch(`${import.meta.env.VITE_API_URL}/api/admin/inventory/warehouses`, { credentials: "include" })
                    ]);
                    if (prodRes.ok) {
                        const prodData = await prodRes.json();
                        setProducts(prodData);
                    }
                    if (wareRes.ok) {
                        const wareData = await wareRes.json();
                        setWarehouses(wareData);
                    }
                } catch (error) {
                    console.error("Failed to fetch form data:", error);
                }
            };
            fetchFormData();
        }
    }, [isAddModalOpen]);

    const handleAddAdjustment = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedProduct || !selectedWarehouse || !selectedType || !quantity) {
             showError('Please fill all required fields');
             return;
        }

        if (selectedType === 'TRANSFER' && !selectedTargetWarehouse) {
             showError('Please select a target warehouse for transfer');
             return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/inventory/stock-movements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    product_id: Number(selectedProduct),
                    warehouse_id: Number(selectedWarehouse),
                    to_warehouse_id: selectedType === 'TRANSFER' ? Number(selectedTargetWarehouse) : null,
                    type: selectedType,
                    quantity: Number(quantity),
                    reference_id: reference || null,
                    notes: notes || null
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to record movement');
            }

            // Reset form
            setSelectedProduct('');
            setSelectedWarehouse('');
            setSelectedType('IN');
            setSelectedTargetWarehouse('');
            setQuantity('');
            setReference('');
            setNotes('');
            
            setIsAddModalOpen(false);
            showSuccess('Stock movement recorded successfully');
            fetchMovements();
        } catch (error) {
            console.error("Failed to add movement:", error);
            showError(error instanceof Error ? error.message : 'Failed to record movement');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredMovements = movements.filter(m => {
        const matchesSearch = 
            (m.product_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (m.reference_id?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (m.notes?.toLowerCase().includes(searchTerm.toLowerCase()));
            
        const matchesType = typeFilter === 'All' || m.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
    const currentItems = filteredMovements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getMovementIcon = (type: string) => {
        switch (type) {
            case 'IN': return <ArrowDownRight className="w-5 h-5 text-emerald-500" />;
            case 'OUT': return <ArrowUpRight className="w-5 h-5 text-rose-500" />;
            case 'TRANSFER': return <RefreshCw className="w-5 h-5 text-blue-500" />;
            case 'ADJUSTMENT': return <Settings className="w-5 h-5 text-amber-500" />;
            default: return <Package className="w-5 h-5 text-slate-500" />;
        }
    };

    const getTypeColorClass = (type: string) => {
        switch (type) {
            case 'IN': return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
            case 'OUT': return "bg-rose-50 text-rose-700 ring-rose-600/20";
            case 'TRANSFER': return "bg-blue-50 text-blue-700 ring-blue-600/20";
            case 'ADJUSTMENT': return "bg-amber-50 text-amber-700 ring-amber-600/20";
            default: return "bg-slate-50 text-slate-700 ring-slate-600/20";
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header section similar to Bills / Products */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Stock Movements</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Audit log of all inventory additions, deductions, and adjustments.</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2 hover:cursor-pointer">
                    <Plus className="w-4 h-4" />
                    Record Movement
                </Button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex-1 w-full sm:w-auto relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by product, reference, or notes..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow dark:text-white dark:placeholder-slate-400"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                value={typeFilter}
                                onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                                className="pl-9 pr-8 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white"
                            >
                                <option value="All">All Types</option>
                                <option value="IN">Stock In</option>
                                <option value="OUT">Stock Out (Issued)</option>
                                <option value="ADJUSTMENT">Adjustment</option>
                                <option value="TRANSFER">Transfer</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                            <tr>
                                <th className="px-6 py-4">Product & Type</th>
                                <th className="px-6 py-4">Quantity</th>
                                <th className="px-6 py-4">Warehouse Details</th>
                                <th className="px-6 py-4">Reason / Notes</th>
                                <th className="px-6 py-4">Reference</th>
                                <th className="px-6 py-4">Recorded By / Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                                            <p>Loading movements history...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-lg font-medium text-slate-900 dark:text-white">No stock movements found</p>
                                        <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((movement) => (
                                    <tr key={movement.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${getTypeColorClass(movement.type).split(' ')[0]} bg-opacity-50`}>
                                                    {getMovementIcon(movement.type)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        {movement.product_name}
                                                    </div>
                                                    <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-semibold ring-1 ring-inset ${getTypeColorClass(movement.type)}`}>
                                                        {movement.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900 dark:text-white">
                                                {movement.type === 'OUT' ? '-' : movement.type === 'IN' ? '+' : ''}{movement.quantity}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-900 dark:text-white">{movement.warehouse_name || 'N/A'}</div>
                                            {movement.type === 'TRANSFER' && movement.to_warehouse_name && (
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    to {movement.to_warehouse_name}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs truncate text-slate-600 dark:text-slate-300" title={movement.notes || 'No reason provided'}>
                                                {movement.notes || <span className="text-slate-400 dark:text-slate-500 italic">No notes</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-600 dark:text-slate-300">
                                                {movement.reference_id || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-900 dark:text-white text-sm">{movement.created_by_name}</div>
                                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                <Calendar className="w-3.5 h-3.5 mr-1" />
                                                {new Date(movement.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Similar to other pages) */}
                {!loading && filteredMovements.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            Showing <span className="font-medium text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                            <span className="font-medium text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredMovements.length)}</span> of{' '}
                            <span className="font-medium text-slate-900 dark:text-white">{filteredMovements.length}</span> results
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Movement Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-md dark:bg-slate-900 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="dark:text-white">Record Stock Movement</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddAdjustment} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label className="dark:text-slate-300">Target Product</Label>
                            <select
                                required
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            >
                                <option value="" disabled>Select a product...</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="dark:text-slate-300">Movement Type</Label>
                                <select
                                    required
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                >
                                    <option value="IN">Stock In (+)</option>
                                    <option value="OUT">Stock Out (-)</option>
                                    <option value="ADJUSTMENT">Adjustment (+ or -)</option>
                                    <option value="TRANSFER">Transfer Between</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="dark:text-slate-300">Quantity</Label>
                                <Input
                                    required
                                    type="number"
                                    min={selectedType === "ADJUSTMENT" ? undefined : "1"}
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="Amount..."
                                    className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2 sm:col-span-1">
                                <Label className="dark:text-slate-300">Source Warehouse</Label>
                                <select
                                    required
                                    value={selectedWarehouse}
                                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                >
                                    <option value="" disabled>Select source...</option>
                                    {warehouses.map((w) => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                            {selectedType === 'TRANSFER' && (
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <Label className="dark:text-slate-300">Target Warehouse</Label>
                                    <select
                                        required
                                        value={selectedTargetWarehouse}
                                        onChange={(e) => setSelectedTargetWarehouse(e.target.value)}
                                        className="w-full px-3 py-2 bg-emerald-50 dark:bg-slate-900 border border-emerald-200 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-emerald-400"
                                    >
                                        <option value="" disabled>Select destination...</option>
                                        {warehouses.filter(w => w.id.toString() !== selectedWarehouse).map((w) => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="dark:text-slate-300">Reference ID (Optional)</Label>
                            <Input
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                placeholder="PO-123, Bill-456, etc."
                                className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="dark:text-slate-300">Notes (Optional)</Label>
                            <Input
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Reason for this movement..."
                                className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {submitting ? 'Recording...' : 'Record Movement'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default StockMovements;
