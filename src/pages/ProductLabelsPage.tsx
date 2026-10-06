import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Printer,
  Download,
  Copy,
  Check,
  Search,
  CheckSquare,
  Square,
  Sliders,
  Store,
  Tag,
  Eye,
  RefreshCw,
  FileText,
  Smartphone,
  ShoppingCart,
  Layers,
  ArrowRight,
  ExternalLink,
  Plus,
  Minus,
  Sparkles,
  Info,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Product, Business, Category, Brand } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export type LabelPreset =
  | 'shelf_standard'
  | 'compact_tag'
  | 'large_promo'
  | 'sheet_a4_21'
  | 'sheet_a4_24'
  | 'thermal_roll';

export type QrTargetMode = 'add_to_cart' | 'product_details' | 'raw_barcode';

interface ProductLabelsPageProps {
  onNavigate?: (path: string) => void;
}

export const ProductLabelsPage: React.FC<ProductLabelsPageProps> = ({ onNavigate }) => {
  const { activeBusiness } = useAuth();

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state: map productId -> copies count
  const [selectedMap, setSelectedMap] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState<'all' | 'in_stock' | 'low_stock'>('all');

  // Design & Preset Settings
  const [preset, setPreset] = useState<LabelPreset>('shelf_standard');
  const [targetMode, setTargetMode] = useState<QrTargetMode>('add_to_cart');
  const [promoText, setPromoText] = useState('');
  const [customFooter, setCustomFooter] = useState('');

  // Toggles
  const [showBusinessName, setShowBusinessName] = useState(true);
  const [showCategory, setShowCategory] = useState(true);
  const [showBarcodeText, setShowBarcodeText] = useState(true);
  const [showUnit, setShowUnit] = useState(true);
  const [showCutGuides, setShowCutGuides] = useState(true);
  const [showVatNote, setShowVatNote] = useState(true);

  // View state
  const [previewTab, setPreviewTab] = useState<'sheet' | 'single'>('sheet');
  const [activeSingleIndex, setActiveSingleIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Load products & categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prods, cats, brnds] = await Promise.all([
          api.products.getProducts().catch(() => []),
          api.products.getCategories().catch(() => []),
          api.products.getBrands().catch(() => []),
        ]);

        if (prods && prods.length > 0) {
          setProducts(prods);
          // Default select first 6 products with 1 copy each
          const initialSelection: Record<string, number> = {};
          prods.slice(0, 6).forEach(p => {
            initialSelection[p.id] = 1;
          });
          setSelectedMap(initialSelection);
        }
        if (cats) setCategories(cats);
        if (brnds) setBrands(brnds);
      } catch (err) {
        console.error('Failed to load products for labels:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter products for the picker list
  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.includes(q)) ||
      (p.category_name && p.category_name.toLowerCase().includes(q)) ||
      (p.brand_name && p.brand_name.toLowerCase().includes(q));

    const matchCategory =
      selectedCategory === 'all' ||
      p.category_id === selectedCategory ||
      p.category_name === selectedCategory;

    const matchStock =
      selectedStockStatus === 'all' ||
      (selectedStockStatus === 'in_stock' && p.stock_quantity > 0) ||
      (selectedStockStatus === 'low_stock' && p.stock_quantity <= p.low_stock_threshold);

    return matchSearch && matchCategory && matchStock;
  });

  // Toggle selection
  const handleToggleProduct = (productId: string) => {
    setSelectedMap(prev => {
      const next = { ...prev };
      if (next[productId]) {
        delete next[productId];
      } else {
        next[productId] = 1;
      }
      return next;
    });
  };

  const handleUpdateCopies = (productId: string, delta: number) => {
    setSelectedMap(prev => {
      const current = prev[productId] || 1;
      const updated = Math.max(1, Math.min(50, current + delta));
      return { ...prev, [productId]: updated };
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedMap(prev => {
      const next = { ...prev };
      filteredProducts.forEach(p => {
        if (!next[p.id]) next[p.id] = 1;
      });
      return next;
    });
  };

  const handleDeselectAll = () => {
    setSelectedMap({});
  };

  const handleSelectLowStock = () => {
    const next: Record<string, number> = {};
    products
      .filter(p => p.stock_quantity <= p.low_stock_threshold)
      .forEach(p => {
        next[p.id] = 1;
      });
    setSelectedMap(next);
    showToast(`Selected ${Object.keys(next).length} low stock items for relabeling`);
  };

  // Flatten selected products based on copy quantities
  const selectedProductList = Object.entries(selectedMap)
    .map(([id, copies]) => {
      const prod = products.find(p => p.id === id);
      return prod ? { product: prod, copies } : null;
    })
    .filter((item): item is { product: Product; copies: number } => item !== null);

  const flatLabelsToPrint: Product[] = [];
  selectedProductList.forEach(item => {
    for (let i = 0; i < item.copies; i++) {
      flatLabelsToPrint.push(item.product);
    }
  });

  const totalSelectedUnique = selectedProductList.length;
  const totalLabelsCount = flatLabelsToPrint.length;

  // Compute target URL for QR Code
  const getQrValue = (product: Product): string => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://brisksmartbilling.vercel.app';
    if (targetMode === 'add_to_cart') {
      return `${origin}/pos?add_product=${encodeURIComponent(product.id)}`;
    } else if (targetMode === 'product_details') {
      return `${origin}/product/${encodeURIComponent(product.id)}`;
    } else {
      return product.barcode || product.sku || product.id;
    }
  };

  // Copy link
  const handleCopyLink = (product: Product) => {
    const val = getQrValue(product);
    navigator.clipboard.writeText(val);
    setCopiedId(product.id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Copied QR code target URL to clipboard');
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Download single label as high-res PNG
  const handleDownloadLabelPng = (product: Product) => {
    const svgElement = document.getElementById(`qr-svg-canvas-${product.id}`);
    if (!svgElement) {
      showToast('Preparing QR canvas image...');
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 720;
        canvas.height = 440;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Border
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 4;
        ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

        // Promo Banner if present
        if (promoText.trim()) {
          ctx.fillStyle = '#DC2626';
          ctx.fillRect(12, 12, canvas.width - 24, 38);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(promoText.toUpperCase(), canvas.width / 2, 36);
          ctx.textAlign = 'left';
        }

        const topOffset = promoText.trim() ? 50 : 20;

        // Business Header
        if (showBusinessName) {
          ctx.fillStyle = '#475569';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText((activeBusiness?.name || 'BRISK STORE').toUpperCase(), 32, topOffset + 24);
        }

        // Category / Brand
        if (showCategory) {
          ctx.fillStyle = '#64748B';
          ctx.font = '14px sans-serif';
          const cat = [product.brand_name, product.category_name].filter(Boolean).join(' · ');
          if (cat) ctx.fillText(cat, 32, topOffset + 48);
        }

        // Product Title
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 28px sans-serif';
        const nameLines = product.name.length > 22 ? product.name.substring(0, 20) + '...' : product.name;
        ctx.fillText(nameLines, 32, topOffset + 96);

        // Price Section
        ctx.fillStyle = '#0284C7';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(activeBusiness?.currency || 'KES', 32, topOffset + 160);

        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 54px monospace';
        ctx.fillText(Number(product.selling_price).toLocaleString(), 105, topOffset + 165);

        // Unit
        if (showUnit && product.unit) {
          ctx.fillStyle = '#64748B';
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText(`/ ${product.unit}`, 32, topOffset + 205);
        }

        // Barcode / SKU
        if (showBarcodeText && (product.barcode || product.sku)) {
          ctx.fillStyle = '#64748B';
          ctx.font = '14px monospace';
          const codeStr = product.barcode ? `BARCODE: ${product.barcode}` : `SKU: ${product.sku}`;
          ctx.fillText(codeStr, 32, topOffset + 265);
        }

        // VAT Note
        if (showVatNote) {
          ctx.fillStyle = '#94A3B8';
          ctx.font = '12px sans-serif';
          ctx.fillText('Tax Inclusive (16% VAT)', 32, topOffset + 295);
        }

        // Draw QR Code Image on right side
        ctx.drawImage(image, 460, topOffset + 40, 220, 220);

        // Scan call to action
        ctx.fillStyle = '#0284C7';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        const ctaText =
          targetMode === 'add_to_cart'
            ? 'SCAN TO ADD TO CART'
            : targetMode === 'product_details'
            ? 'SCAN FOR DETAILS & SPECS'
            : 'BARCODE SCANNER';
        ctx.fillText(ctaText, 570, topOffset + 285);

        // Download link
        const a = document.createElement('a');
        a.download = `label-${product.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${product.id.slice(-4)}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
        URL.revokeObjectURL(blobURL);
        showToast(`Downloaded PNG label for ${product.name}`);
      };
      image.src = blobURL;
    } catch (err) {
      console.error('Download PNG failed:', err);
      showToast('Could not download label. Try printing directly.');
    }
  };

  // Dimensions & Grid styling based on chosen preset
  const getPresetGridClass = () => {
    switch (preset) {
      case 'shelf_standard':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
      case 'compact_tag':
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3';
      case 'large_promo':
        return 'grid grid-cols-1 md:grid-cols-2 gap-5';
      case 'sheet_a4_21':
        return 'grid grid-cols-3 gap-3 print:grid-cols-3 print:gap-2';
      case 'sheet_a4_24':
        return 'grid grid-cols-3 gap-2.5 print:grid-cols-3 print:gap-1.5';
      case 'thermal_roll':
        return 'flex flex-col items-center gap-4';
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden SVG render canvas for dynamic PNG exports */}
      <div className="sr-only">
        {products.map(p => (
          <div key={`hidden-qr-${p.id}`} id={`qr-svg-canvas-${p.id}`}>
            <QRCodeSVG value={getQrValue(p)} size={240} level="M" />
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 1. HEADER & SUMMARY TOOLBAR */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Product Shelf Labels & QR Studio</span>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                Utility Tool
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Generate scannable shelf tags and price labels linking directly to active POS cart or product detail pages
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={handlePrint}
            disabled={totalLabelsCount === 0}
            className="flex-1 md:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Labels ({totalLabelsCount})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE: CONTROLS & PRODUCT PICKER (LEFT) + LIVE PREVIEW (RIGHT) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls & Product Selection (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card A: Label Template & QR Action Settings */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>1. Label Format & Action</span>
              </h2>
            </div>

            {/* Target QR Action Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">QR Code Action on Scan</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetMode('add_to_cart')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    targetMode === 'add_to_cart'
                      ? 'border-blue-600 bg-blue-50/60 text-blue-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
                    <span>Add to Active Sale</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Adds item straight to cashier or mobile POS cart
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetMode('product_details')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    targetMode === 'product_details'
                      ? 'border-blue-600 bg-blue-50/60 text-blue-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Product Detail & Specs</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Customer self-checkout & info view
                  </p>
                </button>
              </div>
            </div>

            {/* Preset Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Size & Sheet Layout</label>
              <select
                value={preset}
                onChange={e => setPreset(e.target.value as LabelPreset)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="shelf_standard">Standard Shelf Tag (70mm × 40mm)</option>
                <option value="compact_tag">Compact Price Tag (50mm × 30mm)</option>
                <option value="large_promo">Promotional / Deli Card (90mm × 60mm)</option>
                <option value="sheet_a4_21">A4 Sheet Grid (21 Labels / Page - 3×7)</option>
                <option value="sheet_a4_24">A4 Sheet Grid (24 Labels / Page - 3×8)</option>
                <option value="thermal_roll">Continuous Thermal Roll (58mm / 80mm)</option>
              </select>
            </div>

            {/* Promo Banner & Footer Text */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] font-medium text-slate-600">Promo Badge (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. SPECIAL OFFER"
                  value={promoText}
                  onChange={e => setPromoText(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600">Custom Note</label>
                <input
                  type="text"
                  placeholder="e.g. Aisle 3 / Shelf B"
                  value={customFooter}
                  onChange={e => setCustomFooter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Display Toggles */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Visible Elements
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showBusinessName}
                    onChange={e => setShowBusinessName(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300"
                  />
                  <span>Store Name</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showCategory}
                    onChange={e => setShowCategory(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300"
                  />
                  <span>Category / Brand</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showBarcodeText}
                    onChange={e => setShowBarcodeText(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300"
                  />
                  <span>Barcode / SKU</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showUnit}
                    onChange={e => setShowUnit(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300"
                  />
                  <span>Unit of Measure</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showCutGuides}
                    onChange={e => setShowCutGuides(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300"
                  />
                  <span>Cut Guides (Dashed)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showVatNote}
                    onChange={e => setShowVatNote(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300"
                  />
                  <span>VAT 16% Note</span>
                </label>
              </div>
            </div>
          </div>

          {/* Card B: Product Selection & Quantities */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <span>2. Select Products to Print</span>
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Search & Category Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products by name, SKU, barcode..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleSelectLowStock}
                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold transition-colors text-center cursor-pointer"
                >
                  ⚡ Select Low Stock Only
                </button>
              </div>
            </div>

            {/* Product List */}
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading catalog...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No products found</div>
              ) : (
                filteredProducts.map(p => {
                  const isSelected = Boolean(selectedMap[p.id]);
                  const copies = selectedMap[p.id] || 1;

                  return (
                    <div
                      key={p.id}
                      className={`py-2.5 px-2 rounded-xl flex items-center justify-between gap-2 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div
                        onClick={() => handleToggleProduct(p.id)}
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                      >
                        <button
                          type="button"
                          className={`w-4 h-4 rounded-sm flex items-center justify-center text-white transition-colors ${
                            isSelected ? 'bg-blue-600' : 'border border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {activeBusiness?.currency || 'KES'} {Number(p.selling_price).toLocaleString()}
                            {p.unit ? ` / ${p.unit}` : ''} · Stock: {p.stock_quantity}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateCopies(p.id, -1)}
                            className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-[11px] font-bold text-slate-800">
                            {copies}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCopies(p.id, 1)}
                            className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Selection summary */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>
                Selected: <strong className="text-slate-900">{totalSelectedUnique}</strong> products
              </span>
              <span>
                Total labels: <strong className="text-blue-600 font-bold">{totalLabelsCount}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Interactive Label Preview & Sheet (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Preview Navigation Tabs */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPreviewTab('sheet')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  previewTab === 'sheet'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Sheet Layout View ({totalLabelsCount})
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('single')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  previewTab === 'single'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Single Tag Inspector
              </button>
            </div>

            <div className="text-xs text-slate-500 hidden sm:block">
              Preset: <span className="font-semibold text-slate-800 capitalize">{preset.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Printable Area Wrapper */}
          <div
            ref={printAreaRef}
            className="bg-slate-100/80 p-5 rounded-2xl border border-slate-200/80 min-h-[500px] overflow-x-auto print:bg-white print:p-0 print:border-none print:m-0"
          >
            {totalLabelsCount === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-2xs">
                  <Tag className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No Labels Selected</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Pick one or more products from the catalog on the left to preview and generate printable shelf tags.
                </p>
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Select Filtered Products</span>
                </button>
              </div>
            ) : previewTab === 'sheet' ? (
              /* SHEET MULTI-LABEL GRID VIEW */
              <div className={getPresetGridClass()}>
                {flatLabelsToPrint.map((prod, idx) => {
                  const qrVal = getQrValue(prod);
                  return (
                    <div
                      key={`label-item-${prod.id}-${idx}`}
                      className={`bg-white rounded-xl p-3.5 border transition-all relative group flex flex-col justify-between ${
                        showCutGuides ? 'border-dashed border-slate-300' : 'border-slate-200 shadow-2xs'
                      }`}
                    >
                      {/* Promo Ribbon */}
                      {promoText.trim() && (
                        <div className="bg-red-600 text-white text-[9px] font-black uppercase tracking-wider text-center py-0.5 -mt-3.5 -mx-3.5 mb-2 rounded-t-lg">
                          {promoText}
                        </div>
                      )}

                      <div>
                        {/* Top: Business Name & Category */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          {showBusinessName && (
                            <span className="font-bold text-slate-700 uppercase truncate">
                              {activeBusiness?.name || 'BRISK STORE'}
                            </span>
                          )}
                          {showCategory && (
                            <span className="text-slate-400 truncate max-w-[120px]">
                              {[prod.brand_name, prod.category_name].filter(Boolean).join(' · ')}
                            </span>
                          )}
                        </div>

                        {/* Product Title */}
                        <h4 className="text-xs font-bold text-slate-900 leading-tight mb-2 line-clamp-2">
                          {prod.name}
                        </h4>
                      </div>

                      {/* Middle: Price & QR Code */}
                      <div className="flex items-center justify-between gap-2 my-1">
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs font-bold text-blue-600">
                              {activeBusiness?.currency || 'KES'}
                            </span>
                            <span className="text-xl font-black font-mono tracking-tight text-slate-900">
                              {Number(prod.selling_price).toLocaleString()}
                            </span>
                          </div>
                          {showUnit && prod.unit && (
                            <span className="text-[10px] text-slate-500 font-medium block -mt-0.5">
                              per {prod.unit}
                            </span>
                          )}
                          {showVatNote && (
                            <span className="text-[8px] text-slate-400 uppercase tracking-wider block mt-1">
                              Tax Inclusive
                            </span>
                          )}
                        </div>

                        <div className="shrink-0 bg-white p-1 rounded-lg border border-slate-100 shadow-2xs text-center">
                          <QRCodeSVG value={qrVal} size={64} level="M" />
                          <span className="text-[7px] font-bold text-blue-600 uppercase tracking-tighter block mt-0.5">
                            {targetMode === 'add_to_cart' ? 'Scan to Cart' : 'Scan Details'}
                          </span>
                        </div>
                      </div>

                      {/* Footer: Barcode / SKU / Custom Notes */}
                      <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
                        {showBarcodeText && (
                          <span className="font-mono">
                            {prod.barcode || prod.sku ? `ID: ${prod.barcode || prod.sku}` : ''}
                          </span>
                        )}
                        {customFooter && (
                          <span className="font-medium text-slate-500">{customFooter}</span>
                        )}
                      </div>

                      {/* Hover Overlay Action (Screen only) */}
                      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-2xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 print:hidden">
                        <button
                          type="button"
                          onClick={() => handleDownloadLabelPng(prod)}
                          className="p-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer"
                          title="Download PNG label"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PNG</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(prod)}
                          className="p-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer"
                          title="Copy QR target URL"
                        >
                          {copiedId === prod.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Link</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* SINGLE LABEL INSPECTOR VIEW */
              <div className="space-y-4">
                {selectedProductList.length > 0 && (
                  (() => {
                    const activeProduct = selectedProductList[activeSingleIndex]?.product || selectedProductList[0]?.product;
                    if (!activeProduct) return null;
                    const qrVal = getQrValue(activeProduct);

                    return (
                      <div className="space-y-4">
                        {/* Selector pills for single mode */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                          {selectedProductList.map((item, i) => (
                            <button
                              key={`single-nav-${item.product.id}`}
                              type="button"
                              onClick={() => setActiveSingleIndex(i)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                                i === activeSingleIndex
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {item.product.name.slice(0, 18)}
                            </button>
                          ))}
                        </div>

                        {/* High-res Hero Single Tag Display */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-md max-w-md mx-auto space-y-4">
                          {promoText.trim() && (
                            <div className="bg-red-600 text-white text-xs font-bold uppercase tracking-wider text-center py-1 rounded-lg">
                              {promoText}
                            </div>
                          )}

                          <div className="flex justify-between items-start">
                            <div>
                              {showBusinessName && (
                                <p className="text-xs font-bold text-slate-500 uppercase">
                                  {activeBusiness?.name || 'BRISK STORE'}
                                </p>
                              )}
                              {showCategory && (
                                <p className="text-[11px] text-slate-400">
                                  {[activeProduct.brand_name, activeProduct.category_name].filter(Boolean).join(' · ')}
                                </p>
                              )}
                              <h3 className="text-lg font-black text-slate-900 mt-1">
                                {activeProduct.name}
                              </h3>
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div>
                              <span className="text-xs font-bold text-blue-600 block">
                                PRICE ({activeBusiness?.currency || 'KES'})
                              </span>
                              <span className="text-3xl font-black font-mono text-slate-900">
                                {Number(activeProduct.selling_price).toLocaleString()}
                              </span>
                              {showUnit && activeProduct.unit && (
                                <span className="text-xs text-slate-500 font-medium block">
                                  / {activeProduct.unit}
                                </span>
                              )}
                            </div>

                            <div className="text-center">
                              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs inline-block">
                                <QRCodeSVG value={qrVal} size={110} level="M" />
                              </div>
                              <span className="text-[10px] font-bold text-blue-600 block mt-1">
                                {targetMode === 'add_to_cart' ? 'SCAN TO ADD TO CART' : 'SCAN FOR SPECS'}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span className="font-mono">
                              {activeProduct.barcode ? `BARCODE: ${activeProduct.barcode}` : activeProduct.sku ? `SKU: ${activeProduct.sku}` : ''}
                            </span>
                            {showVatNote && <span>16% VAT Inclusive</span>}
                          </div>

                          {/* Quick test scan button */}
                          <div className="pt-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDownloadLabelPng(activeProduct)}
                              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download High-Res PNG</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyLink(activeProduct)}
                              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                              title="Copy URL"
                            >
                              {copiedId === activeProduct.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
