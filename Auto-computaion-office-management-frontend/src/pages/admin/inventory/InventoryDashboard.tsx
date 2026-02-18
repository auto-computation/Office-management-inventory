/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Search, Package, Warehouse, Truck } from "lucide-react";
import { useNotification } from "@/components/NotificationProvider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const InventoryDashboard: React.FC = () => {
    const { showSuccess, showError } = useNotification();
    // const [theme, setTheme] = useState("light"); // Placeholder if theme hook isn't available directly
    const [searchQuery, setSearchQuery] = useState("");

    // Data States
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [products, setProducts] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    
    // Modals
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

    // Form States
    const [newProduct, setNewProduct] = useState({ name: "", description: "", sku: "", category: "", unit_price: 0, reorder_level: 10 });
    const [newWarehouse, setNewWarehouse] = useState({ name: "", location: "" });
    const [newSupplier, setNewSupplier] = useState({ name: "", contact_person: "", email: "", phone: "", address: "" });

    // Fetch Data
    const fetchData = async () => {
        try {
            const [prodRes, wareRes, suppRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/inventory/products`, { credentials: "include" }),
                fetch(`${API_BASE_URL}/admin/inventory/warehouses`, { credentials: "include" }),
                fetch(`${API_BASE_URL}/admin/inventory/suppliers`, { credentials: "include" })
            ]);

            if (prodRes.ok) setProducts(await prodRes.json());
            if (wareRes.ok) setWarehouses(await wareRes.json());
            if (suppRes.ok) setSuppliers(await suppRes.json());
        } catch (error) {
            console.error("Failed to fetch inventory data", error);
            showError("Failed to load inventory data");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handlers (Simplified for brevity, full validation should be added)
    const handleAddProduct = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/inventory/products`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(newProduct)
            });
            if (!res.ok) throw new Error("Failed to add product");
            showSuccess("Product added successfully");
            setIsProductModalOpen(false);
            setNewProduct({ name: "", description: "", sku: "", category: "", unit_price: 0, reorder_level: 10 });
            fetchData();
        } catch (err: any) {
            showError(err.message);
        }
    };

    const handleAddWarehouse = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/inventory/warehouses`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(newWarehouse)
            });
            if (!res.ok) throw new Error("Failed to add warehouse");
            showSuccess("Warehouse added successfully");
            setIsWarehouseModalOpen(false);
            setNewWarehouse({ name: "", location: "" });
            fetchData();
        } catch (err: any) {
            showError(err.message);
        }
    };

    const handleAddSupplier = async () => {
        try {
             const res = await fetch(`${API_BASE_URL}/admin/inventory/suppliers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(newSupplier)
            });
            if (!res.ok) throw new Error("Failed to add supplier");
            showSuccess("Supplier added successfully");
            setIsSupplierModalOpen(false);
            setNewSupplier({ name: "", contact_person: "", email: "", phone: "", address: "" });
            fetchData();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            showError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Inventory</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage products, stock, warehouses, and suppliers.</p>
                </div>
            </div>

            {/* Stats Overview (Mock Data for now) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Products</p>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{products.length}</h2>
                    </div>
                </Card>
                <Card className="p-6 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-full text-amber-600 dark:text-amber-400">
                        <Warehouse size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Warehouses</p>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{warehouses.length}</h2>
                    </div>
                </Card>
                <Card className="p-6 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full text-green-600 dark:text-green-400">
                        <Truck size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Suppliers</p>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{suppliers.length}</h2>
                    </div>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="products" className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1">
                        <TabsTrigger value="products" className="px-4 py-2">Products</TabsTrigger>
                        <TabsTrigger value="warehouses" className="px-4 py-2">Warehouses</TabsTrigger>
                        <TabsTrigger value="suppliers" className="px-4 py-2">Suppliers</TabsTrigger>
                    </TabsList>
                    
                     <div className="flex gap-2">
                        {/* Dynamic Add Button based on active tab? For simplicity, we can render specific buttons in tab content or use state to switch */}
                     </div>
                </div>

                {/* PRODUCTS TAB */}
                <TabsContent value="products" className="space-y-4">
                    <div className="flex justify-between">
                         <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="Search products..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        <Button onClick={() => setIsProductModalOpen(true)} className="bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                            <Plus className="mr-2 h-4 w-4" /> Add Product
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product) => (
                            <Card key={product.id} className="group relative overflow-hidden bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:shadow-md transition-all p-5">
                                <div className="flex justify-between items-start mb-4">
                                     <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                                        {product.name.charAt(0)}
                                    </div>
                                    <Badge variant={Number(product.total_stock) <= product.reorder_level ? "destructive" : "outline"}>
                                        {Number(product.total_stock)} Instock
                                    </Badge>
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">{product.name}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">{product.sku}</p>
                                
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Price:</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">₹{product.unit_price}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm mt-1">
                                    <span className="text-slate-500 dark:text-slate-400">Category:</span>
                                    <span className="text-slate-700 dark:text-slate-300">{product.category || "N/A"}</span>
                                </div>
                            </Card>
                        ))}
                        {products.length === 0 && <p className="text-slate-500 col-span-full text-center py-10">No products found.</p>}
                    </div>
                </TabsContent>

                {/* WAREHOUSES TAB */}
                <TabsContent value="warehouses" className="space-y-4">
                    <div className="flex justify-end">
                         <Button onClick={() => setIsWarehouseModalOpen(true)} className="bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                            <Plus className="mr-2 h-4 w-4" /> Add Warehouse
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {warehouses.map((wh) => (
                            <Card key={wh.id} className="p-6 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:shadow-md transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-full text-amber-600 dark:text-amber-400">
                                        <Warehouse size={20} />
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{wh.name}</h3>
                                </div>
                                <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                                    <p className="flex items-center gap-2"><Truck size={14} /> {wh.location || "No location specified"}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* SUPPLIERS TAB */}
                <TabsContent value="suppliers" className="space-y-4">
                    <div className="flex justify-end">
                         <Button onClick={() => setIsSupplierModalOpen(true)} className="bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                            <Plus className="mr-2 h-4 w-4" /> Add Supplier
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         {suppliers.map((supp) => (
                            <Card key={supp.id} className="p-6 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:shadow-md transition-all">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{supp.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{supp.contact_person}</p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                        <span className="text-slate-500">Email</span>
                                        <span className="text-slate-900 dark:text-white">{supp.email}</span>
                                    </div>
                                    <div className="flex justify-between pt-2">
                                        <span className="text-slate-500">Phone</span>
                                        <span className="text-slate-900 dark:text-white">{supp.phone}</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* --- MODALS --- */}

            {/* Add Product Modal */}
            <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Product Name</Label>
                                <Input value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} placeholder="e.g. Office Chair" />
                            </div>
                            <div className="space-y-2">
                                <Label>SKU</Label>
                                <Input value={newProduct.sku} onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})} placeholder="e.g. FURN-001" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} placeholder="Brief description..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Input value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} placeholder="e.g. Furniture" />
                            </div>
                             <div className="space-y-2">
                                <Label>Unit Price (₹)</Label>
                                <Input type="number" value={newProduct.unit_price} onChange={(e) => setNewProduct({...newProduct, unit_price: Number(e.target.value)})} />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label>Reorder Level (Alert when stock below)</Label>
                            <Input type="number" value={newProduct.reorder_level} onChange={(e) => setNewProduct({...newProduct, reorder_level: Number(e.target.value)})} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddProduct}>Save Product</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Warehouse Modal */}
            <Dialog open={isWarehouseModalOpen} onOpenChange={setIsWarehouseModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Warehouse</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Wraehouse Name</Label>
                            <Input value={newWarehouse.name} onChange={(e) => setNewWarehouse({...newWarehouse, name: e.target.value})} placeholder="e.g. Central Depot" />
                        </div>
                        <div className="space-y-2">
                            <Label>Location</Label>
                            <Input value={newWarehouse.location} onChange={(e) => setNewWarehouse({...newWarehouse, location: e.target.value})} placeholder="e.g. New York, NY" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddWarehouse}>Save Warehouse</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             {/* Add Supplier Modal */}
            <Dialog open={isSupplierModalOpen} onOpenChange={setIsSupplierModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add Supplier</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Supplier Name</Label>
                            <Input value={newSupplier.name} onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})} placeholder="e.g. Tech Supplies Inc" />
                        </div>
                        <div className="space-y-2">
                            <Label>Contact Person</Label>
                            <Input value={newSupplier.contact_person} onChange={(e) => setNewSupplier({...newSupplier, contact_person: e.target.value})} placeholder="e.g. Jane Doe" />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input value={newSupplier.email} onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})} placeholder="email@example.com" />
                            </div>
                             <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input value={newSupplier.phone} onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})} placeholder="+1 234 567 890" />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label>Address</Label>
                            <Textarea value={newSupplier.address} onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})} placeholder="Full address..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddSupplier}>Save Supplier</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default InventoryDashboard;
