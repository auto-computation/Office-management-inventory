/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Package, Warehouse, Truck, AlertTriangle, IndianRupee } from "lucide-react";
import { useNotification } from "@/components/NotificationProvider";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const InventoryOverview: React.FC = () => {
    const { showError } = useNotification();
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalWarehouses: 0,
        totalSuppliers: 0,
        lowStockItems: 0,
        totalValue: 0,
        outOfStock: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, wareRes, suppRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/admin/inventory/products`, { credentials: "include" }),
                    fetch(`${API_BASE_URL}/admin/inventory/warehouses`, { credentials: "include" }),
                    fetch(`${API_BASE_URL}/admin/inventory/suppliers`, { credentials: "include" })
                ]);

                if (prodRes.ok && wareRes.ok && suppRes.ok) {
                    const products = await prodRes.json();
                    const warehouses = await wareRes.json();
                    const suppliers = await suppRes.json();

                    const lowStock = products.filter((p: any) => Number(p.total_stock) <= p.reorder_level).length;
                    const outOfStock = products.filter((p: any) => Number(p.total_stock) === 0).length;
                    const value = products.reduce((acc: number, p: any) => acc + (Number(p.unit_price) * Number(p.total_stock)), 0);

                    setStats({
                        totalProducts: products.length,
                        totalWarehouses: warehouses.length,
                        totalSuppliers: suppliers.length,
                        lowStockItems: lowStock,
                        totalValue: value,
                        outOfStock: outOfStock
                    });
                }
            } catch (error) {
                console.error("Failed to fetch inventory data", error);
                showError("Failed to load dashboard data");
            }
        };

        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Inventory Overview</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time metrics and performance indicators.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Products */}
                <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Products</span>
                        <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                            <Package className="h-5 w-5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalProducts}</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across all categories</p>
                    </div>
                </Card>

                {/* Total Value */}
                <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Value</span>
                        <div className="p-2 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                            <IndianRupee className="h-5 w-5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">₹{stats.totalValue.toLocaleString()}</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Estimated inventory value</p>
                    </div>
                </Card>

                {/* Low Stock */}
                <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Low Stock Alerts</span>
                        <div className="p-2 bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.lowStockItems}</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Items below reorder level</p>
                    </div>
                </Card>

                {/* Suppliers */}
                <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Suppliers</span>
                        <div className="p-2 bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg">
                            <Truck className="h-5 w-5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalSuppliers}</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Active vendor partners</p>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visual Representation */}
                <Card className="col-span-1 lg:col-span-2 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="p-6">
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-4">Stock Health</h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-slate-700 dark:text-slate-300">In Stock</span>
                                    <span className="text-slate-500">{stats.totalProducts - stats.lowStockItems - stats.outOfStock} items</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${stats.totalProducts ? ((stats.totalProducts - stats.lowStockItems - stats.outOfStock) / stats.totalProducts) * 100 : 0}%` }}></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-slate-700 dark:text-slate-300">Low Stock</span>
                                    <span className="text-slate-500">{stats.lowStockItems} items</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${stats.totalProducts ? (stats.lowStockItems / stats.totalProducts) * 100 : 0}%` }}></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-slate-700 dark:text-slate-300">Out of Stock</span>
                                    <span className="text-slate-500">{stats.outOfStock} items</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${stats.totalProducts ? (stats.outOfStock / stats.totalProducts) * 100 : 0}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Quick Info */}
                <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
                            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                            <Warehouse className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalWarehouses}</div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">Active Warehouses across all regions</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default InventoryOverview;
