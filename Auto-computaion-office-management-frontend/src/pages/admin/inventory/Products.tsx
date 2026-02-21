import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Search, Pencil, Trash2, ImageIcon, Upload, X, ArrowRightLeft } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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

const Products: React.FC = () => {
    const { showSuccess, showError } = useNotification();
    const [searchQuery, setSearchQuery] = useState("");
    const [products, setProducts] = useState<any[]>([]);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [newProduct, setNewProduct] = useState<{
        name: string;
        description: string;
        sku: string;
        category: string;
        unit_price: number | string;
        reorder_level: number | string;
        stock_available: number | string;
        unit: string;
    }>({ name: "", description: "", sku: "", category: "", unit_price: 0, reorder_level: 10, stock_available: 0, unit: "" });

    // Image upload state
    const [productImage, setProductImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [productToDelete, setProductToDelete] = useState<number | null>(null);

    // Stock Adjustment Modal State
    const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false);
    const [adjustingProduct, setAdjustingProduct] = useState<any | null>(null);
    const [stockAdjustment, setStockAdjustment] = useState<{
        type: 'IN' | 'OUT';
        quantity: number | string;
        notes: string;
    }>({ type: 'OUT', quantity: '', notes: '' });

    const [categories, setCategories] = useState<any[]>([]);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategory, setNewCategory] = useState("");

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/inventory/products`, { credentials: "include" });
            if (res.ok) setProducts(await res.json());
        } catch (error) {
            console.error("Failed to fetch products", error);
            showError("Failed to load products");
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/inventory/categories`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAddCategory = async () => {
        if (!newCategory.trim()) {
            showError("Category name is required");
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/admin/inventory/categories`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ name: newCategory })
            });

            if (!res.ok) throw new Error("Failed to add category");
            
            const addedCategory = await res.json();
            setCategories(prev => {
                const exists = prev.find(c => c.name === addedCategory.name);
                return exists ? prev : [...prev, addedCategory].sort((a, b) => a.name.localeCompare(b.name));
            });
            
            // Auto-select the new category
            setNewProduct(prev => ({ ...prev, category: addedCategory.name }));
            
            showSuccess("Category added successfully");
            setIsCategoryModalOpen(false);
            setNewCategory("");
        } catch (err: any) {
            showError(err.message);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'number') {
            if (value === "") {
                setNewProduct(prev => ({ ...prev, [name]: "" }));
                return;
            }
            if (Number(value) < 0) return; // Prevent negative
        }

        setNewProduct(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (Number(value) === 0) {
            setNewProduct(prev => ({ ...prev, [name]: "" }));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setProductImage(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        setProductImage(null);
        setImagePreview(null);
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    const handleEditProduct = (product: any) => {
        setEditingProduct(product);
        setNewProduct({
            name: product.name,
            description: product.description || "",
            sku: product.sku,
            category: product.category,
            unit_price: product.unit_price,
            reorder_level: product.reorder_level,
            stock_available: product.total_stock || 0, // Using total_stock from GET response
            unit: product.unit || ""
        });
        // Pre-populate image preview if product has an image
        setProductImage(null);
        setImagePreview(product.image_url || null);
        setIsProductModalOpen(true);
    };

    const confirmDeleteProduct = async () => {
        if (!productToDelete) return;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/inventory/products/${productToDelete}`, {
                method: "DELETE",
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to delete product");
            showSuccess("Product deleted successfully");
            setProductToDelete(null);
            fetchProducts();
        } catch (error: any) {
            showError(error.message);
        }
    };

    const handleSaveProduct = async () => {
        if (!newProduct.name.trim()) {
            showError("Product name is required");
            return;
        }
        if (!newProduct.category) {
            showError("Category is required");
            return;
        }
        if (Number(newProduct.unit_price) <= 0) {
            showError("Unit Price must be greater than 0");
            return;
        }
        if (Number(newProduct.stock_available) <= 0) {
            // Allow 0 stock for edits if user intends it? requirement said checks for negative/zero.
            // Keeping consistent with add validation
            showError("Stock Available must be greater than 0");
            return;
        }

        try {
            // 1. Upload image first if a new file was selected
            let image_url: string | null = null;

            if (productImage) {
                const formData = new FormData();
                formData.append("image", productImage);
                const uploadRes = await fetch(`${API_BASE_URL}/admin/inventory/products/upload-image`, {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                });
                if (!uploadRes.ok) throw new Error("Failed to upload product image");
                const uploadData = await uploadRes.json();
                image_url = uploadData.image_url;
            } else if (imagePreview && imagePreview.startsWith("data:")) {
                // Editing: keep existing stored image (it's already a data URL)
                image_url = imagePreview;
            }

            // 2. Save product
            const url = editingProduct 
                ? `${API_BASE_URL}/admin/inventory/products/${editingProduct.id}`
                : `${API_BASE_URL}/admin/inventory/products`;
            
            const method = editingProduct ? "PUT" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    ...newProduct,
                    unit_price: Number(newProduct.unit_price),
                    stock_available: Number(newProduct.stock_available),
                    reorder_level: Number(newProduct.reorder_level),
                    image_url,
                })
            });
            if (!res.ok) throw new Error(`Failed to ${editingProduct ? "update" : "add"} product`);
            showSuccess(`Product ${editingProduct ? "updated" : "added"} successfully`);
            setIsProductModalOpen(false);
            setNewProduct({ name: "", description: "", sku: "", category: "", unit_price: 0, reorder_level: 10, stock_available: 0, unit: "" });
            setEditingProduct(null);
            setProductImage(null);
            setImagePreview(null);
            fetchProducts();
        } catch (err: any) {
            showError(err.message);
        }
    };

    const handleAdjustStock = async () => {
        if (!stockAdjustment.quantity || Number(stockAdjustment.quantity) <= 0) {
            showError("Please enter a valid quantity greater than 0");
            return;
        }
        if (!stockAdjustment.notes.trim()) {
            showError("Please provide a reason or notes for this adjustment");
            return;
        }

        try {
            // Get main warehouse (we'll fetch it or default to ID 1 for simplicity of this UI. 
            // In a real multi-warehouse setup, the user would select the warehouse)
            const warehouseRes = await fetch(`${API_BASE_URL}/admin/inventory/warehouses`, { credentials: "include" });
            const warehouses = await warehouseRes.json();
            const defaultWarehouseId = warehouses.length > 0 ? warehouses[0].id : 1;

            const res = await fetch(`${API_BASE_URL}/admin/inventory/stock-movements`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    product_id: adjustingProduct.id,
                    warehouse_id: defaultWarehouseId,
                    type: stockAdjustment.type,
                    quantity: Number(stockAdjustment.quantity),
                    notes: stockAdjustment.notes
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Failed to adjust stock");
            }
            
            showSuccess(`Stock adjusted successfully`);
            setIsAdjustStockModalOpen(false);
            setAdjustingProduct(null);
            setStockAdjustment({ type: 'OUT', quantity: '', notes: '' });
            fetchProducts();
        } catch (err: any) {
            showError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Products</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your inventory products.</p>
                </div>
                <Button onClick={() => {
                    setEditingProduct(null);
                    setNewProduct({ name: "", description: "", sku: "", category: "", unit_price: 0, reorder_level: 10, stock_available: 0, unit: "" });
                    setProductImage(null);
                    setImagePreview(null);
                    setIsProductModalOpen(true);
                }} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                </Button>
            </div>

            <div className="relative w-full max-w-sm mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search products..."
                    className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus-visible:ring-slate-950 dark:focus-visible:ring-slate-300"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Mobile card view */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product) => (
                    <Card key={product.id} className="bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 p-5">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg overflow-hidden shrink-0">
                                    {product.image_url
                                        ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                                        : product.name.charAt(0)
                                    }
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{product.name}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{product.sku}</p>
                                </div>
                            </div>
                            <Badge variant={Number(product.total_stock) <= product.reorder_level ? "destructive" : "outline"} className="dark:border-slate-700 dark:text-slate-300">
                                {Number(product.total_stock)} Instock
                            </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                            <div><span className="text-slate-500 dark:text-slate-400">Category: </span><span className="text-slate-700 dark:text-slate-300">{product.category || "—"}</span></div>
                            <div><span className="text-slate-500 dark:text-slate-400">Unit: </span><span className="text-slate-700 dark:text-slate-300">{product.unit || "—"}</span></div>
                            <div><span className="text-slate-500 dark:text-slate-400">Price: </span><span className="font-semibold text-slate-900 dark:text-white">₹{product.unit_price}</span></div>
                        </div>
                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <Button variant="ghost" size="sm" onClick={() => { setAdjustingProduct(product); setIsAdjustStockModalOpen(true); }} className="h-8 w-8 p-0 hover:bg-amber-50 dark:hover:bg-amber-900/20" title="Adjust Stock">
                                <ArrowRightLeft className="h-4 w-4 text-slate-500 hover:text-amber-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)} className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Edit Product">
                                <Pencil className="h-4 w-4 text-slate-500 hover:text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setProductToDelete(product.id)} className="group h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete Product">
                                <Trash2 className="h-4 w-4 text-slate-500 group-hover:text-red-400 transition-colors" />
                            </Button>
                        </div>
                    </Card>
                ))}
                {products.length === 0 && <p className="text-slate-500 text-center py-10">No products found.</p>}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900">
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Name</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">SKU</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Category</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Unit</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold text-right">Unit Price</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold text-center">Stock</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-400 font-semibold text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product) => (
                            <TableRow key={product.id} className="bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border-slate-200 dark:border-slate-800">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm shrink-0 overflow-hidden">
                                            {product.image_url
                                                ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                                                : product.name.charAt(0)
                                            }
                                        </div>
                                        <span className="font-medium text-slate-900 dark:text-white">{product.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-slate-500 dark:text-slate-400 text-sm font-mono">{product.sku}</TableCell>
                                <TableCell className="text-slate-700 dark:text-slate-300 text-sm">{product.category || "—"}</TableCell>
                                <TableCell className="text-slate-700 dark:text-slate-300 text-sm">{product.unit || "—"}</TableCell>
                                <TableCell className="text-right font-semibold text-slate-900 dark:text-white">₹{product.unit_price}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={Number(product.total_stock) <= product.reorder_level ? "destructive" : "outline"} className="dark:border-slate-700 dark:text-slate-300">
                                        {Number(product.total_stock)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => { setAdjustingProduct(product); setIsAdjustStockModalOpen(true); }} className="h-8 w-8 p-0 hover:bg-amber-50 dark:hover:bg-amber-900/20" title="Adjust Stock">
                                            <ArrowRightLeft className="h-4 w-4 text-slate-500 hover:text-amber-600" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)} className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Edit Product">
                                            <Pencil className="h-4 w-4 text-slate-500 hover:text-blue-600" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => setProductToDelete(product.id)} className="group h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete Product">
                                            <Trash2 className="h-4 w-4 text-slate-500 group-hover:text-red-400 transition-colors" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {products.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-slate-500 py-12">No products found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* Product Modal */}
            <Dialog open={isProductModalOpen} onOpenChange={(open) => {
                setIsProductModalOpen(open);
                if (!open) { setProductImage(null); setImagePreview(null); }
            }}>
                <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300">Name</Label>
                                <Input
                                    name="name"
                                    value={newProduct.name}
                                    onChange={handleChange}
                                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300">SKU</Label>
                                <Input
                                    name="sku"
                                    value={newProduct.sku}
                                    onChange={handleChange}
                                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-700 dark:text-slate-300">Description</Label>
                            <Textarea
                                name="description"
                                value={newProduct.description}
                                onChange={handleChange}
                                placeholder="Brief description..."
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300">Category</Label>
                                <div className="flex gap-2">
                                    <Select 
                                        value={newProduct.category} 
                                        onValueChange={(value) => setNewProduct(prev => ({ ...prev, category: value }))}
                                    >
                                        <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                            {categories.map((cat: any) => (
                                                <SelectItem key={cat.id} value={cat.name} className="text-slate-900 dark:text-gray-100 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button 
                                                    variant="outline" 
                                                    className="px-3 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                                    onClick={() => setIsCategoryModalOpen(true)}
                                                >
                                                    <Plus className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-none shadow-lg z-[300]">
                                                <p className="font-medium text-xs">Add new Category</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300">Unit Price (₹)</Label>
                                <Input
                                    type="number"
                                    name="unit_price"
                                    value={newProduct.unit_price}
                                    onChange={handleChange}
                                    placeholder="500"
                                    onFocus={handleFocus}
                                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300">Stock Available</Label>
                                <Input
                                    type="number"
                                    name="stock_available"
                                    value={newProduct.stock_available}
                                    onChange={handleChange}
                                    onFocus={handleFocus}
                                    placeholder="0"
                                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300">Unit</Label>
                                <Select 
                                    value={newProduct.unit} 
                                    onValueChange={(value) => setNewProduct(prev => ({ ...prev, unit: value }))}
                                >
                                    <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                        <SelectValue placeholder="Select Unit" />
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
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-700 dark:text-slate-300">Reorder Level (Alert when stock below)</Label>
                            <Input
                                type="number"
                                name="reorder_level"
                                value={newProduct.reorder_level}
                                onChange={handleChange}
                                onFocus={handleFocus}
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                        {/* Image Upload */}
                        <div className="space-y-2">
                            <Label className="text-slate-700 dark:text-slate-300">Product Image</Label>
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                            {imagePreview ? (
                                <div className="relative w-full h-36 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group">
                                    <img src={imagePreview} alt="Product preview" className="w-full h-full object-contain bg-slate-50 dark:bg-slate-900" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => imageInputRef.current?.click()}
                                            className="bg-white/90 hover:bg-white text-slate-800 text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
                                        >
                                            <Upload className="h-3.5 w-3.5" /> Change
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="bg-red-500/90 hover:bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
                                        >
                                            <X className="h-3.5 w-3.5" /> Remove
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => imageInputRef.current?.click()}
                                    className="w-full h-28 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-900/50"
                                >
                                    <ImageIcon className="h-7 w-7" />
                                    <span className="text-sm font-medium">Click to upload image</span>
                                    <span className="text-xs">PNG, JPG, WEBP up to 5MB</span>
                                </button>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsProductModalOpen(false)} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:cursor-pointer">
                            Cancel
                        </Button>
                        <Button onClick={handleSaveProduct} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                            {editingProduct ? "Save Changes" : "Add Product"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Category Modal */}
            <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                <DialogContent className="sm:max-w-[400px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">Add New Category</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label className="text-slate-700 dark:text-slate-300 mb-2 block">Category Name</Label>
                        <Input
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="e.g. Electronics"
                            className="mt-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:cursor-pointer">
                            Cancel
                        </Button>
                        <Button onClick={handleAddCategory} className="bg-blue-600 hover:bg-blue-700 text-white hover:cursor-pointer">
                            Add Category
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Adjust Stock Modal */}
            <Dialog open={isAdjustStockModalOpen} onOpenChange={(open) => {
                setIsAdjustStockModalOpen(open);
                if (!open) setStockAdjustment({ type: 'OUT', quantity: '', notes: '' });
            }}>
                <DialogContent className="sm:max-w-[450px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                            <ArrowRightLeft className="h-5 w-5 text-amber-500" />
                            Adjust Stock for {adjustingProduct?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Current Stock</span>
                            <Badge variant={Number(adjustingProduct?.total_stock) <= (adjustingProduct?.reorder_level || 0) ? "destructive" : "outline"} className="text-base font-medium">
                                {adjustingProduct ? Number(adjustingProduct.total_stock) : 0} {adjustingProduct?.unit || ''}
                            </Badge>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-700 dark:text-slate-300">Adjustment Type</Label>
                            <Select 
                                value={stockAdjustment.type} 
                                onValueChange={(value: 'IN' | 'OUT') => setStockAdjustment(prev => ({ ...prev, type: value }))}
                            >
                                <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                    <SelectItem value="OUT" className="text-slate-900 dark:text-gray-100 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">
                                        <div className="flex items-center text-rose-600 dark:text-rose-400 font-medium">
                                            Stock Out (Deduct/Issue)
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="IN" className="text-slate-900 dark:text-gray-100 focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">
                                        <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                                            Stock In (Add)
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-700 dark:text-slate-300">Quantity</Label>
                            <Input
                                type="number"
                                value={stockAdjustment.quantity}
                                onChange={(e) => setStockAdjustment(prev => ({ ...prev, quantity: e.target.value }))}
                                placeholder="Enter quantity..."
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-700 dark:text-slate-300">Reason / Notes</Label>
                            <Textarea
                                value={stockAdjustment.notes}
                                onChange={(e) => setStockAdjustment(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="e.g., Issued to Marketing Team, Damaged in transit..."
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white h-24"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAdjustStockModalOpen(false)} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:cursor-pointer">
                            Cancel
                        </Button>
                        <Button onClick={handleAdjustStock} className={`${stockAdjustment.type === 'OUT' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white hover:cursor-pointer`}>
                            {stockAdjustment.type === 'OUT' ? 'Deduct Stock' : 'Add Stock'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             {/* Delete Confirmation Alert */}
             <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
                <AlertDialogContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-900 dark:text-white">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                            This action cannot be undone. This will permanently delete the product and its stock levels.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 hover:cursor-pointer">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteProduct} className="bg-red-600 hover:bg-red-700 text-white hover:cursor-pointer">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Products;
