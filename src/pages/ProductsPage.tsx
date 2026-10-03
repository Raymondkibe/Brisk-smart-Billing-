import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Sparkles,
  Edit2,
  Trash2,
  AlertTriangle,
  Check,
  X,
  Barcode,
  Layers,
  Tag,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Percent,
  Sliders,
  Eye,
  TrendingUp,
  FolderPlus,
  Store,
  RefreshCw,
  Box,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, axiosInstance } from '../services/api';
import { Product, Category, Brand, ProductVatType } from '../types';

export const ProductsPage: React.FC = () => {
  const { activeBusiness, member } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedStock, setSelectedStock] = useState('all');
  const [selectedVat, setSelectedVat] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Product Form State
  const [isService, setIsService] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [brandId, setBrandId] = useState('');
  const [brandName, setBrandName] = useState('');
  const [variant, setVariant] = useState('');
  const [size, setSize] = useState('');
  const [unit, setUnit] = useState('ml');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [vatType, setVatType] = useState<ProductVatType>('default');
  const [customTaxRate, setCustomTaxRate] = useState('16');
  const [initialStock, setInitialStock] = useState('50');
  const [lowStockAlert, setLowStockAlert] = useState('10');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [allowFractional, setAllowFractional] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Category & Brand Quick-Add Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');

  // Stock Adjustment Form State
  const [stockAdjustmentDelta, setStockAdjustmentDelta] = useState('10');
  const [stockAdjustmentType, setStockAdjustmentType] = useState<'purchase' | 'adjustment' | 'damage'>('purchase');
  const [stockAdjustmentReason, setStockAdjustmentReason] = useState('Restock / New delivery');
  const [adjustingStock, setAdjustingStock] = useState(false);

  // AI Product Assistant State
  const [aiPrompt, setAiPrompt] = useState(
    'Add Brookside fresh milk 500ml at 70 shillings, buying price 60, stock 50, KCC fresh milk 500ml at 65, buying price 55, stock 30.'
  );
  const [aiExtracting, setAiExtracting] = useState(false);
  const [aiDetectedProducts, setAiDetectedProducts] = useState<any[]>([]);
  const [aiStep, setAiStep] = useState<'input' | 'review'>('input');
  const [aiCommitting, setAiCommitting] = useState(false);

  const canManageProducts = member?.permissions.can_manage_products || member?.role === 'owner';

  useEffect(() => {
    loadData();
  }, [activeBusiness?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodData, catData, brdData] = await Promise.all([
        api.products.getProducts(),
        api.products.getCategories(),
        api.products.getBrands(),
      ]);
      if (prodData) setProducts(prodData);
      if (catData) setCategories(catData);
      if (brdData) setBrands(brdData);
    } catch (err) {
      console.error('Failed to load products data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open Add Product Modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsService(false);
    setName('');
    setCategoryId('');
    setCategoryName('');
    setBrandId('');
    setBrandName('');
    setVariant('');
    setSize('');
    setUnit('piece');
    setSku(`SKU-${Date.now().toString().slice(-6)}`);
    setBarcode('');
    setBuyingPrice('');
    setSellingPrice('');
    setVatType('default');
    setCustomTaxRate(String(activeBusiness?.tax_percentage || 16));
    setInitialStock('10');
    setLowStockAlert('5');
    setImageUrl('');
    setDescription('');
    setAllowFractional(false);
    setFormError(null);
    setProductModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setIsService(Boolean(p.is_service));
    setName(p.name);
    setCategoryId(p.category_id || '');
    setCategoryName(p.category_name || categories.find(c => c.id === p.category_id)?.name || '');
    setBrandId(p.brand_id || '');
    setBrandName(p.brand_name || brands.find(b => b.id === p.brand_id)?.name || '');
    setVariant(p.variant || '');
    setSize(p.size || '');
    setUnit(p.unit || 'piece');
    setSku(p.sku);
    setBarcode(p.barcode || '');
    setBuyingPrice(String(p.buying_price || 0));
    setSellingPrice(String(p.selling_price));
    setVatType(p.vat_type || 'default');
    setCustomTaxRate(String(p.custom_tax_rate ?? p.tax_rate ?? 16));
    setInitialStock(String(p.stock_quantity));
    setLowStockAlert(String(p.low_stock_threshold || 10));
    setImageUrl(p.image_url || '');
    setDescription(p.description || '');
    setAllowFractional(Boolean(p.fractional_quantity_allowed));
    setFormError(null);
    setProductModalOpen(true);
  };

  // Save Product (Create or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sellingPrice) {
      setFormError('Product Name and Selling Price are required.');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      // 1. Resolve or auto-register typed Brand
      let resolvedBrandId = brandId;
      let resolvedBrandName = brandName.trim();
      if (resolvedBrandName) {
        const matchBrand = brands.find(b => b.name.toLowerCase() === resolvedBrandName.toLowerCase());
        if (matchBrand) {
          resolvedBrandId = matchBrand.id;
          resolvedBrandName = matchBrand.name;
        } else {
          // Auto-create brand
          try {
            const newBrand = await api.products.createBrand(resolvedBrandName);
            if (newBrand) {
              resolvedBrandId = newBrand.id;
              resolvedBrandName = newBrand.name;
              setBrands(prev => [...prev, newBrand]);
            }
          } catch (bErr) {
            console.warn('Could not auto-register brand:', bErr);
          }
        }
      }

      // 2. Resolve or auto-register typed Category
      let resolvedCategoryId = categoryId;
      let resolvedCategoryName = categoryName.trim();
      if (resolvedCategoryName) {
        const matchCat = categories.find(c => c.name.toLowerCase() === resolvedCategoryName.toLowerCase());
        if (matchCat) {
          resolvedCategoryId = matchCat.id;
          resolvedCategoryName = matchCat.name;
        } else {
          // Auto-create category
          try {
            const newCat = await api.products.createCategory(resolvedCategoryName);
            if (newCat) {
              resolvedCategoryId = newCat.id;
              resolvedCategoryName = newCat.name;
              setCategories(prev => [...prev, newCat]);
            }
          } catch (cErr) {
            console.warn('Could not auto-register category:', cErr);
          }
        }
      }

      const payload = {
        name: name.trim(),
        isService,
        categoryId: resolvedCategoryId || undefined,
        categoryName: resolvedCategoryName || undefined,
        brandId: resolvedBrandId || undefined,
        brandName: resolvedBrandName || undefined,
        variant: variant.trim() || undefined,
        size: size.trim() || undefined,
        unit,
        unitSize: size ? `${size} ${unit}` : undefined,
        sku: sku.trim() || undefined,
        barcode: barcode.trim() || undefined,
        sellingPrice: Number(sellingPrice),
        buyingPrice: Number(buyingPrice || 0),
        vatType,
        customTaxRate: vatType === 'custom' ? Number(customTaxRate) : undefined,
        stockQuantity: Number(initialStock || 0),
        lowStockThreshold: Number(lowStockAlert || 10),
        imageUrl: imageUrl.trim() || undefined,
        description: description.trim() || undefined,
        fractionalQuantityAllowed: allowFractional,
        active: true,
      };

      if (editingProduct) {
        await api.products.updateProduct(editingProduct.id, payload as any);
        showToast(`Updated product "${name}" successfully.`);
      } else {
        await api.products.createProduct(payload as any);
        showToast(`Product "${name}" added to catalog.`);
      }

      setProductModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Toggle Active / Deactivate
  const handleToggleActive = async (p: Product) => {
    try {
      const newStatus = p.active === false ? true : false;
      await api.products.updateProduct(p.id, { active: newStatus });
      showToast(newStatus ? `Activated "${p.name}"` : `Deactivated "${p.name}"`);
      if (detailsProduct?.id === p.id) {
        setDetailsProduct({ ...detailsProduct, active: newStatus });
      }
      loadData();
    } catch (err: any) {
      console.error(err);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string, prodName: string) => {
    if (confirm(`Are you sure you want to permanently delete "${prodName}"?`)) {
      try {
        await api.products.deleteProduct(id);
        showToast(`Deleted "${prodName}".`);
        if (detailsProduct?.id === id) setDetailsProduct(null);
        loadData();
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  // Quick Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const newCat: Category = await api.products.createCategory(newCategoryName.trim());
      if (newCat) {
        setCategories(prev => [...prev, newCat]);
        setCategoryId(newCat.id);
        setCategoryName(newCat.name);
        setNewCategoryName('');
        setCategoryModalOpen(false);
        showToast(`Category "${newCat.name}" added.`);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Quick Add Brand (belongs privately to business)
  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    try {
      const newBrand: Brand = await api.products.createBrand(newBrandName.trim());
      if (newBrand) {
        setBrands(prev => [...prev, newBrand]);
        setBrandId(newBrand.id);
        setBrandName(newBrand.name);
        setNewBrandName('');
        setBrandModalOpen(false);
        showToast(`Brand "${newBrand.name}" registered for ${activeBusiness?.name}.`);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Stock Adjustment Submit
  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockModalProduct) return;
    const delta = Number(stockAdjustmentDelta);
    if (isNaN(delta) || delta === 0) return;

    try {
      setAdjustingStock(true);
      const effectiveDelta = stockAdjustmentType === 'damage' ? -Math.abs(delta) : Math.abs(delta);
      await api.inventory.adjustStock({
        product_id: stockModalProduct.id,
        quantity: effectiveDelta,
        type: stockAdjustmentType,
        reason: stockAdjustmentReason,
      });

      showToast(`Stock updated for "${stockModalProduct.name}".`);
      setStockModalProduct(null);
      await loadData();
    } catch (err: any) {
      alert(`Adjustment error: ${err.message}`);
    } finally {
      setAdjustingStock(false);
    }
  };

  // AI Assistant Extraction
  const handleRunAiAssistant = async () => {
    if (!aiPrompt.trim()) return;
    try {
      setAiExtracting(true);
      const data = await api.products.parseProductsWithAi(aiPrompt.trim());
      if (data?.products) {
        setAiDetectedProducts(data.products as any);
        setAiStep('review');
      } else {
        alert('Could not parse products. Please verify your prompt.');
      }
    } catch (err: any) {
      alert(`AI Extraction Error: ${err.message}`);
    } finally {
      setAiExtracting(false);
    }
  };

  // Confirm and commit AI products
  const handleCommitAiProducts = async () => {
    if (aiDetectedProducts.length === 0) return;
    try {
      setAiCommitting(true);
      for (const item of aiDetectedProducts) {
        await api.products.createProduct({
          name: item.name,
          brand_name: item.brand,
          category_name: item.category || 'General',
          variant: item.variant,
          size: item.size,
          unit: item.unit || 'piece',
          unit_size: item.unit_size,
          selling_price: Number(item.selling_price || 0),
          buying_price: Number(item.buying_price || 0),
          stock_quantity: Number(item.stock_quantity || 50),
          low_stock_threshold: 10,
          vat_type: 'default',
          fractional_quantity_allowed: Boolean(item.fractional_quantity_allowed),
          active: true,
        });
      }
      showToast(`Successfully added ${aiDetectedProducts.length} products to your catalog!`);
      setAiModalOpen(false);
      setAiStep('input');
      setAiPrompt('');
      await loadData();
    } catch (err: any) {
      alert(`Commit error: ${err.message}`);
    } finally {
      setAiCommitting(false);
    }
  };

  // Filter products locally & on backend
  const filteredProducts = products.filter(p => {
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchBrand = p.brand_name && p.brand_name.toLowerCase().includes(q);
      const matchVariant = p.variant && p.variant.toLowerCase().includes(q);
      const matchSize = p.size && p.size.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchBarcode = p.barcode && p.barcode.toLowerCase().includes(q);
      const matchCat = p.category_name && p.category_name.toLowerCase().includes(q);
      if (!matchName && !matchBrand && !matchVariant && !matchSize && !matchSku && !matchBarcode && !matchCat) {
        return false;
      }
    }

    // Category
    if (selectedCategory !== 'all' && p.category_id !== selectedCategory) {
      return false;
    }

    // Brand
    if (selectedBrand !== 'all' && p.brand_id !== selectedBrand) {
      return false;
    }

    // Stock
    if (selectedStock === 'in_stock' && p.stock_quantity <= 0) return false;
    if (selectedStock === 'low_stock' && (p.stock_quantity > p.low_stock_threshold || p.stock_quantity <= 0)) return false;
    if (selectedStock === 'out_of_stock' && p.stock_quantity > 0) return false;

    // VAT
    if (selectedVat === 'default' && p.vat_type && p.vat_type !== 'default') return false;
    if (selectedVat === 'exempt' && p.vat_type !== 'exempt') return false;
    if (selectedVat === 'custom' && p.vat_type !== 'custom') return false;

    // Status
    if (selectedStatus === 'active' && p.active === false) return false;
    if (selectedStatus === 'inactive' && p.active !== false) return false;

    return true;
  });

  // Calculate VAT display label for a product
  const getVatLabel = (p: Product) => {
    if (p.vat_type === 'exempt') return 'VAT Exempt';
    if (p.vat_type === 'custom') return `Custom (${p.custom_tax_rate ?? p.tax_rate}%)`;
    const defaultRate = activeBusiness?.tax_percentage ?? 16;
    const isVatEnabled = activeBusiness?.vat_enabled !== false;
    return isVatEnabled ? `Configured (${defaultRate}%)` : 'VAT Disabled';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HEADER (Section 1) */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Products</h1>
              <p className="text-xs text-slate-500">
                Manage your brands, sizes, VAT treatments, and live stock levels
              </p>
            </div>
          </div>
        </div>

        {canManageProducts && (
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => {
                setAiStep('input');
                setAiModalOpen(true);
              }}
              className="flex-1 sm:flex-none px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Add Products with AI</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Product</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. SEARCH & FILTER BAR (Section 1) */}
      {/* Search products... Category ▼ Brand ▼ Stock ▼ VAT ▼ Status ▼ */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name, brand, SKU, barcode, category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Category Dropdown */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-medium cursor-pointer"
            >
              <option value="all">Category: All</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Brand Dropdown */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Brand</label>
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-medium cursor-pointer"
            >
              <option value="all">Brand: All</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Stock Dropdown */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stock</label>
            <select
              value={selectedStock}
              onChange={e => setSelectedStock(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-medium cursor-pointer"
            >
              <option value="all">Stock: All</option>
              <option value="in_stock">In Stock (&gt; 0)</option>
              <option value="low_stock">Low Stock (≤ Alert)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>
          </div>

          {/* VAT Dropdown */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">VAT</label>
            <select
              value={selectedVat}
              onChange={e => setSelectedVat(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-medium cursor-pointer"
            >
              <option value="all">VAT: All</option>
              <option value="default">Business Default</option>
              <option value="exempt">VAT Exempt</option>
              <option value="custom">Custom Rate</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs font-medium cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Quick Tags / Counters & Add Category / Brand links */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="text-slate-500 text-[11px]">
            Showing <strong className="text-slate-900">{filteredProducts.length}</strong> of{' '}
            <strong className="text-slate-900">{products.length}</strong> products
          </div>

          {canManageProducts && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCategoryModalOpen(true)}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer text-xs"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ Add Category</span>
              </button>
              <span className="text-slate-300">·</span>
              <button
                onClick={() => setBrandModalOpen(true)}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer text-xs"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>+ Add Brand</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DUAL DISPLAY: Mobile Cards vs Desktop Table (Section 1 & 4) */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-medium">Loading catalog products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Box className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No products match your criteria</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, clear filters, or add new products to your inventory.
          </p>
          {canManageProducts && (
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              + Add Product
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ======================================================================= */}
          {/* MOBILE VIEW: Product Cards (Section 1 & 4) */}
          {/* ======================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 md:hidden">
            {filteredProducts.map(p => {
              const isLow = p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0;
              const isOut = p.stock_quantity <= 0;
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3 relative hover:border-slate-300 transition-all"
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-blue-600 uppercase tracking-wider text-[10px]">
                      {p.category_name || 'General'}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">{p.sku}</span>
                  </div>

                  {/* Main Product Info */}
                  <div
                    onClick={() => setDetailsProduct(p)}
                    className="cursor-pointer group"
                  >
                    <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                      {p.brand_name ? `${p.brand_name} ` : ''}{p.name}
                    </h3>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {p.size ? `${p.size} ${p.unit || ''}` : p.unit_size || ''}
                      {p.variant && <span className="text-slate-400"> · {p.variant}</span>}
                    </div>
                  </div>

                  {/* Price & Stock & VAT */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900 font-mono">
                        KES {p.selling_price.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Buying: KES {p.buying_price.toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold font-mono">
                        <span className={isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-900'}>
                          Stock: {p.stock_quantity}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {getVatLabel(p)}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: [Edit] [Stock] */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setDetailsProduct(p)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Details
                    </button>
                    {canManageProducts && (
                      <>
                        <button
                          onClick={() => setStockModalProduct(p)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Stock
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Edit
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ======================================================================= */}
          {/* DESKTOP VIEW: High Density Table (Section 1 & 4) */}
          {/* ======================================================================= */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Product &amp; Brand</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Size / Variant</th>
                    <th className="py-3.5 px-4">SKU / Barcode</th>
                    <th className="py-3.5 px-4 text-right">Buying Price</th>
                    <th className="py-3.5 px-4 text-right">Selling Price</th>
                    <th className="py-3.5 px-4">VAT</th>
                    <th className="py-3.5 px-4 text-right">Stock</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredProducts.map(p => {
                    const isLow = p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0;
                    const isOut = p.stock_quantity <= 0;
                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-50/60 transition-colors ${
                          p.active === false ? 'opacity-50 bg-slate-50/30' : ''
                        }`}
                      >
                        {/* Name & Brand */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setDetailsProduct(p)}
                            className="text-left font-bold text-slate-900 hover:text-blue-600 transition-colors block cursor-pointer"
                          >
                            {p.brand_name ? (
                              <span className="text-blue-700 font-extrabold mr-1">[{p.brand_name}]</span>
                            ) : null}
                            {p.name}
                          </button>
                          {p.active === false && (
                            <span className="text-[10px] text-red-600 font-bold block mt-0.5">Inactive</span>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium">
                            {p.category_name || 'General'}
                          </span>
                        </td>

                        {/* Size / Variant */}
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                          {p.size ? `${p.size} ${p.unit || ''}` : p.unit_size || '—'}
                          {p.variant && <span className="text-slate-400 block text-[10px] font-sans">{p.variant}</span>}
                        </td>

                        {/* SKU / Barcode */}
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          <div>{p.sku}</div>
                          {p.barcode && <div className="text-[10px] text-slate-400">bc: {p.barcode}</div>}
                        </td>

                        {/* Buying Price */}
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-400">
                          KES {p.buying_price.toLocaleString()}
                        </td>

                        {/* Selling Price */}
                        <td className="py-3 px-4 text-right font-mono font-extrabold tabular-nums text-slate-900">
                          KES {p.selling_price.toLocaleString()}
                        </td>

                        {/* VAT */}
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.vat_type === 'exempt'
                                ? 'bg-emerald-50 text-emerald-700'
                                : p.vat_type === 'custom'
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {p.vat_type === 'exempt' ? 'Exempt' : p.vat_type === 'custom' ? `${p.custom_tax_rate}% Custom` : `${p.tax_rate}% Default`}
                          </span>
                        </td>

                        {/* Stock */}
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          <span className={`font-bold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                            {p.stock_quantity}
                          </span>
                          {isLow && <span className="ml-1 text-[10px] text-amber-600 font-bold font-sans">low</span>}
                          {isOut && <span className="ml-1 text-[10px] text-red-600 font-bold font-sans">out</span>}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              onClick={() => setDetailsProduct(p)}
                              title="View Product Details"
                              className="px-2 py-1 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Details
                            </button>
                            {canManageProducts && (
                              <>
                                <button
                                  onClick={() => setStockModalProduct(p)}
                                  title="Adjust Stock"
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  Stock
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(p)}
                                  title="Edit Product"
                                  className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 4. PRODUCT DETAILS MODAL (Section 19) */}
      {/* Category, Brand, Variant, Size, SKU, Barcode, Buying Price, Selling Price, */}
      {/* VAT, Stock, Low Stock Level, Actions: Edit, Adjust Stock, Deactivate */}
      {/* ========================================================================= */}
      {detailsProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-xs animate-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  {detailsProduct.category_name || 'General Product'}
                </span>
                <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {detailsProduct.brand_name ? `${detailsProduct.brand_name} ` : ''}{detailsProduct.name}
                </h2>
              </div>
              <button
                onClick={() => setDetailsProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content Details Grid */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Category</div>
                  <div className="font-bold text-slate-800 mt-0.5">{detailsProduct.category_name || 'None'}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Brand</div>
                  <div className="font-bold text-slate-800 mt-0.5">{detailsProduct.brand_name || 'None'}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Variant</div>
                  <div className="font-bold text-slate-800 mt-0.5">{detailsProduct.variant || 'Standard'}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Size</div>
                  <div className="font-bold text-slate-800 mt-0.5 font-mono">
                    {detailsProduct.size ? `${detailsProduct.size} ${detailsProduct.unit || ''}` : detailsProduct.unit_size || '—'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">SKU</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{detailsProduct.sku}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Barcode</div>
                  <div className="font-mono text-slate-700 mt-0.5">{detailsProduct.barcode || 'Not set'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Buying Price</div>
                  <div className="text-sm font-extrabold text-slate-700 font-mono mt-0.5">
                    KES {detailsProduct.buying_price.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <div className="text-[10px] text-blue-600 font-semibold uppercase">Selling Price</div>
                  <div className="text-sm font-extrabold text-blue-900 font-mono mt-0.5">
                    KES {detailsProduct.selling_price.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">VAT Rate</div>
                  <div className="font-bold text-slate-800 mt-0.5">{getVatLabel(detailsProduct)}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Current Stock</div>
                  <div className="font-bold font-mono text-slate-900 mt-0.5">{detailsProduct.stock_quantity}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Low Stock Alert</div>
                  <div className="font-bold font-mono text-slate-700 mt-0.5">{detailsProduct.low_stock_threshold}</div>
                </div>
              </div>

              {detailsProduct.description && (
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Description</div>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {detailsProduct.description}
                  </p>
                </div>
              )}
            </div>

            {/* Actions Bar (Section 19): [Edit Product] [Adjust Stock] [Deactivate] */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => handleToggleActive(detailsProduct)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  detailsProduct.active === false
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                {detailsProduct.active === false ? 'Activate Product' : 'Deactivate Product'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const p = detailsProduct;
                    setDetailsProduct(null);
                    setStockModalProduct(p);
                  }}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold cursor-pointer"
                >
                  Adjust Stock
                </button>
                <button
                  onClick={() => {
                    const p = detailsProduct;
                    setDetailsProduct(null);
                    handleOpenEdit(p);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Edit Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ADD / EDIT PRODUCT MODAL (Section 5) */}
      {/* ========================================================================= */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 my-8 overflow-hidden text-xs">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                {editingProduct ? 'EDIT PRODUCT' : 'ADD PRODUCT'}
              </h2>
              <button
                onClick={() => setProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4">
              {/* Product Type (Radio: Product / Service) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Product Type
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="prodType"
                      checked={!isService}
                      onChange={() => setIsService(false)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-800">Physical Product</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="prodType"
                      checked={isService}
                      onChange={() => setIsService(true)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-800">Service</span>
                  </label>
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Fresh Milk, Bread, White Sugar"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              {/* Category & Brand Inputs (Write freely or pick from suggestions) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Category <span className="text-slate-400 font-normal">(Write or select)</span>
                    </label>
                    {categoryName.trim() && !categories.some(c => c.name.toLowerCase() === categoryName.trim().toLowerCase()) && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                        + New Category
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      list="categories-suggestions"
                      placeholder="e.g. Dairy, Beverages, Groceries..."
                      value={categoryName}
                      onChange={e => {
                        const val = e.target.value;
                        setCategoryName(val);
                        const match = categories.find(c => c.name.toLowerCase() === val.trim().toLowerCase());
                        setCategoryId(match ? match.id : '');
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                    <datalist id="categories-suggestions">
                      {categories.map(c => (
                        <option key={c.id} value={c.name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Brand */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Brand <span className="text-slate-400 font-normal">(Write or select)</span>
                    </label>
                    {brandName.trim() && !brands.some(b => b.name.toLowerCase() === brandName.trim().toLowerCase()) && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                        + New Brand
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      list="brands-suggestions"
                      placeholder="e.g. Brookside, Unga, Coca-Cola..."
                      value={brandName}
                      onChange={e => {
                        const val = e.target.value;
                        setBrandName(val);
                        const match = brands.find(b => b.name.toLowerCase() === val.trim().toLowerCase());
                        setBrandId(match ? match.id : '');
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                    <datalist id="brands-suggestions">
                      {brands.map(b => (
                        <option key={b.id} value={b.name} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Variant, Size & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Variant</label>
                  <input
                    type="text"
                    placeholder="e.g. Fresh Milk, Whole Milk"
                    value={variant}
                    onChange={e => setVariant(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Product Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 500, 250, 1, 2"
                    value={size}
                    onChange={e => setSize(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="ml">ml (Millilitres)</option>
                    <option value="cl">cl (Centilitres)</option>
                    <option value="L">L (Litres)</option>
                    <option value="g">g (Grams)</option>
                    <option value="kg">kg (Kilograms)</option>
                    <option value="piece">piece</option>
                    <option value="packet">packet</option>
                    <option value="bottle">bottle</option>
                    <option value="bag">bag</option>
                    <option value="carton">carton</option>
                    <option value="box">box</option>
                    <option value="can">can</option>
                    <option value="dozen">dozen</option>
                  </select>
                </div>
              </div>

              {/* SKU & Barcode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">SKU</label>
                  <input
                    type="text"
                    placeholder="e.g. MILK-BRK-500"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    placeholder="e.g. 600100100123"
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Buying Price & Selling Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Buying Price (KES)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={buyingPrice}
                    onChange={e => setBuyingPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Selling Price (KES) *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={sellingPrice}
                    onChange={e => setSellingPrice(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* VAT Treatment (Section 10 & 11) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  VAT Treatment
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="vatType"
                      checked={vatType === 'default'}
                      onChange={() => setVatType('default')}
                      className="text-blue-600"
                    />
                    <div className="leading-tight">
                      <div className="font-bold text-slate-800 text-[11px]">Business Default</div>
                      <div className="text-[10px] text-slate-400">({activeBusiness?.tax_percentage ?? 16}%)</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="vatType"
                      checked={vatType === 'exempt'}
                      onChange={() => setVatType('exempt')}
                      className="text-blue-600"
                    />
                    <div className="leading-tight">
                      <div className="font-bold text-slate-800 text-[11px]">VAT Exempt</div>
                      <div className="text-[10px] text-slate-400">(0% Tax)</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="vatType"
                      checked={vatType === 'custom'}
                      onChange={() => setVatType('custom')}
                      className="text-blue-600"
                    />
                    <div className="leading-tight">
                      <div className="font-bold text-slate-800 text-[11px]">Custom Rate</div>
                      <div className="text-[10px] text-slate-400">Specify %</div>
                    </div>
                  </label>
                </div>

                {vatType === 'custom' && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Custom Tax Rate (%)</label>
                    <input
                      type="number"
                      value={customTaxRate}
                      onChange={e => setCustomTaxRate(e.target.value)}
                      placeholder="e.g. 8"
                      className="w-32 px-3 py-1.5 border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Initial Stock & Low Stock Alert */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={initialStock}
                    onChange={e => setInitialStock(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Low Stock Alert</label>
                  <input
                    type="number"
                    value={lowStockAlert}
                    onChange={e => setLowStockAlert(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Product Image URL */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Product Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Product notes, batch specifics, or packaging details..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Fractional Quantities Checkbox */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowFractional}
                    onChange={e => setAllowFractional(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Allow fractional quantities (e.g. 0.5 kg or 250 ml in POS)
                  </span>
                </label>
              </div>

              {/* Footer Buttons: [CANCEL] [SAVE PRODUCT] */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'SAVING...' : 'SAVE PRODUCT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ADD CATEGORY MODAL (Section 6) */}
      {/* ========================================================================= */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl border border-slate-200 text-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Add Product Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Milk, Bread, Drinks, Cooking Oil"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. ADD BRAND MODAL (Section 7: Belongs to Business) */}
      {/* ========================================================================= */}
      {brandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl border border-slate-200 text-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Register New Brand</h3>
            <p className="text-[11px] text-slate-500 mb-3">
              This brand belongs exclusively to <strong className="text-slate-700">{activeBusiness?.name}</strong>.
            </p>
            <form onSubmit={handleAddBrand} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Brand Name</label>
                <input
                  type="text"
                  placeholder="e.g. Brookside, KCC, Fresha, Daima, Molo"
                  value={newBrandName}
                  onChange={e => setNewBrandName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBrandModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. QUICK STOCK ADJUSTMENT MODAL */}
      {/* ========================================================================= */}
      {stockModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl border border-slate-200 text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Adjust Inventory Stock</h3>
                <p className="text-[11px] text-slate-500">
                  {stockModalProduct.name} (Current: <strong>{stockModalProduct.stock_quantity}</strong>)
                </p>
              </div>
              <button
                onClick={() => setStockModalProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStockAdjustment} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Adjustment Type</label>
                <select
                  value={stockAdjustmentType}
                  onChange={e => setStockAdjustmentType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="purchase">Add Stock (Restock / Supplier Delivery)</option>
                  <option value="adjustment">Manual Count Adjustment</option>
                  <option value="damage">Deduct Stock (Damaged / Expired / Loss)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Quantity ({stockModalProduct.unit || 'units'})
                </label>
                <input
                  type="number"
                  value={stockAdjustmentDelta}
                  onChange={e => setStockAdjustmentDelta(e.target.value)}
                  min="1"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={stockAdjustmentReason}
                  onChange={e => setStockAdjustmentReason(e.target.value)}
                  placeholder="e.g. Weekly Brookside delivery"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStockModalProduct(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustingStock}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {adjustingStock ? 'Updating...' : 'Save Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. AI PRODUCT ENTRY ASSISTANT MODAL (Section 20) */}
      {/* Confirmation screen: 2 products detected. [CONFIRM & ADD PRODUCTS] */}
      {/* AI must never silently create financial records. */}
      {/* ========================================================================= */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 my-8 overflow-hidden text-xs">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-purple-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-purple-950">AI Product Assistant</h3>
                  <p className="text-[11px] text-purple-700">
                    Extracts brands, variants, sizes, prices and stock from everyday text
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {aiStep === 'input' ? (
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Describe products to add in natural language:
                  </label>
                  <textarea
                    rows={4}
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="e.g. Add Brookside fresh milk 500ml at 70 shillings, buying price 60, stock 50, KCC fresh milk 500ml at 65, buying price 55, stock 30."
                    className="w-full p-3 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 text-xs"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
                  <strong className="text-slate-900 block font-bold">Example format:</strong>
                  <p className="font-mono text-slate-500">
                    "Add Brookside fresh milk 500ml at 70 shillings, buying price 60, stock 50, KCC fresh milk 500ml at 65, buying price 55, stock 30."
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAiModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRunAiAssistant}
                    disabled={aiExtracting || !aiPrompt.trim()}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{aiExtracting ? 'Analyzing with AI...' : 'Extract Products with AI'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Review & Confirmation Screen (Section 20) */
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <strong className="text-sm font-bold text-slate-900">
                      {aiDetectedProducts.length} products detected
                    </strong>
                  </div>
                  <button
                    onClick={() => setAiStep('input')}
                    className="text-purple-600 hover:text-purple-700 font-bold text-xs cursor-pointer"
                  >
                    ← Edit Prompt
                  </button>
                </div>

                <p className="text-[11px] text-slate-500">
                  Review the extracted items below before confirming. AI will never silently create financial records.
                </p>

                {/* Detected Cards List */}
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {aiDetectedProducts.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px]">
                          PRODUCT {idx + 1}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">
                          {item.category || 'Milk'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase">Name</label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={e => {
                              const updated = [...aiDetectedProducts];
                              updated[idx].name = e.target.value;
                              setAiDetectedProducts(updated);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-bold text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase">Brand</label>
                          <input
                            type="text"
                            value={item.brand || ''}
                            onChange={e => {
                              const updated = [...aiDetectedProducts];
                              updated[idx].brand = e.target.value;
                              setAiDetectedProducts(updated);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase">Size</label>
                          <input
                            type="text"
                            value={item.size ? `${item.size} ${item.unit || ''}` : item.unit_size || ''}
                            onChange={e => {
                              const updated = [...aiDetectedProducts];
                              updated[idx].unit_size = e.target.value;
                              setAiDetectedProducts(updated);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-mono text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase">Category</label>
                          <input
                            type="text"
                            value={item.category || ''}
                            onChange={e => {
                              const updated = [...aiDetectedProducts];
                              updated[idx].category = e.target.value;
                              setAiDetectedProducts(updated);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase">Selling Price</label>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-mono text-[10px]">KES</span>
                            <input
                              type="number"
                              value={item.selling_price}
                              onChange={e => {
                                const updated = [...aiDetectedProducts];
                                updated[idx].selling_price = Number(e.target.value);
                                setAiDetectedProducts(updated);
                              }}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-bold font-mono text-xs text-blue-700"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase">Buying Price</label>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-mono text-[10px]">KES</span>
                            <input
                              type="number"
                              value={item.buying_price}
                              onChange={e => {
                                const updated = [...aiDetectedProducts];
                                updated[idx].buying_price = Number(e.target.value);
                                setAiDetectedProducts(updated);
                              }}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-mono text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase">Initial Stock</label>
                          <input
                            type="number"
                            value={item.stock_quantity}
                            onChange={e => {
                              const updated = [...aiDetectedProducts];
                              updated[idx].stock_quantity = Number(e.target.value);
                              setAiDetectedProducts(updated);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-mono text-xs font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAiModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCommitAiProducts}
                    disabled={aiCommitting || aiDetectedProducts.length === 0}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{aiCommitting ? 'Adding Products...' : 'CONFIRM & ADD PRODUCTS'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
