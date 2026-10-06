import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Printer,
  Download,
  Copy,
  Check,
  X,
  Layers,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  Sliders,
  Store,
  Tag,
  Eye,
  RefreshCw,
  Maximize2,
  Minimize2,
  FileText,
  Smartphone,
  ShoppingCart
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Product, Business } from '../types';

export type LabelSizePreset = 'shelf_standard' | 'compact_tag' | 'large_card' | 'sheet_a4_21' | 'sheet_a4_24' | 'thermal_roll';
export type QrActionMode = 'product_details' | 'pos_add_to_cart' | 'raw_barcode';

interface ShelfLabelStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  activeBusiness: Business | null;
  initialSelectedProductId?: string;
  onNavigate?: (path: string) => void;
}

interface SelectedLabelItem {
  product: Product;
  copies: number;
}

export const ShelfLabelStudioModal: React.FC<ShelfLabelStudioModalProps> = ({
  isOpen,
  onClose,
  products,
  activeBusiness,
  initialSelectedProductId,
  onNavigate,
}) => {
  // Label Selection State
  const [selectedMap, setSelectedMap] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Design & Preset Settings
  const [preset, setPreset] = useState<LabelSizePreset>('shelf_standard');
  const [actionMode, setActionMode] = useState<QrActionMode>('product_details');
  const [promoText, setPromoText] = useState('');
  const [customFooter, setCustomFooter] = useState('');

  // Toggles
  const [showBusinessName, setShowBusinessName] = useState(true);
  const [showCategory, setShowCategory] = useState(true);
  const [showBarcodeText, setShowBarcodeText] = useState(true);
  const [showUnit, setShowUnit] = useState(true);
  const [showCutGuides, setShowCutGuides] = useState(true);
  const [showVatNote, setShowVatNote] = useState(true);

  // Active preview tab: 'single' | 'sheet'
  const [viewMode, setViewMode] = useState<'single' | 'sheet'>('single');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Initialize selected product
  useEffect(() => {
    if (initialSelectedProductId) {
      setSelectedMap({ [initialSelectedProductId]: 1 });
    } else if (products.length > 0 && Object.keys(selectedMap).length === 0) {
      // Default to first 4 products
      const init: Record<string, number> = {};
      products.slice(0, 4).forEach(p => {
        init[p.id] = 1;
      });
      setSelectedMap(init);
    }
  }, [initialSelectedProductId, products]);

  if (!isOpen) return null;

  // Filter products for the picker list
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.barcode && p.barcode.includes(searchQuery));
    const matchesCat = categoryFilter === 'all' || p.category_id === categoryFilter || p.category_name === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const categories = Array.from(new Set(products.map(p => p.category_name).filter(Boolean)));

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
      const updated = Math.max(1, Math.min(20, current + delta));
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

  // Build the flat list of labels to render based on copies
  const selectedLabelItems: SelectedLabelItem[] = Object.entries(selectedMap)
    .map(([id, copies]) => {
      const prod = products.find(p => p.id === id);
      return prod ? { product: prod, copies } : null;
    })
    .filter((item): item is SelectedLabelItem => item !== null);

  const flatLabelsToPrint: Product[] = [];
  selectedLabelItems.forEach(item => {
    for (let i = 0; i < item.copies; i++) {
      flatLabelsToPrint.push(item.product);
    }
  });

  // Generate target URL for QR code based on action mode
  const getQrValue = (product: Product): string => {
    const origin = window.location.origin;
    if (actionMode === 'product_details') {
      return `${origin}/product/${product.id}`;
    } else if (actionMode === 'pos_add_to_cart') {
      return `${origin}/pos?add_product=${product.id}`;
    } else {
      return product.barcode || product.sku || product.id;
    }
  };

  // Copy QR Link
  const handleCopyLink = (product: Product) => {
    const val = getQrValue(product);
    navigator.clipboard.writeText(val);
    setCopiedId(product.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Direct Print Trigger
  const handlePrint = () => {
    window.print();
  };

  // Download single label as high-res PNG image using canvas
  const handleDownloadLabel = (product: Product) => {
    const svgElement = document.getElementById(`qr-svg-${product.id}`);
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Border
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      // Business Header
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(activeBusiness?.name || 'BRISK STORE', 30, 48);

      // Category / Brand
      ctx.fillStyle = '#64748B';
      ctx.font = '14px sans-serif';
      const catText = [product.brand_name, product.category_name].filter(Boolean).join(' · ');
      if (catText) ctx.fillText(catText, 30, 75);

      // Product Title
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 26px sans-serif';
      const truncatedName = product.name.length > 22 ? product.name.substring(0, 20) + '...' : product.name;
      ctx.fillText(truncatedName, 30, 120);

      // Currency and Big Price
      ctx.fillStyle = '#0284C7';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(activeBusiness?.currency || 'KES', 30, 185);

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 46px monospace';
      ctx.fillText(Number(product.selling_price).toLocaleString(), 95, 190);

      // Unit
      if (product.unit) {
        ctx.fillStyle = '#64748B';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`/ ${product.unit}`, 30, 225);
      }

      // Barcode text
      if (product.barcode) {
        ctx.fillStyle = '#94A3B8';
        ctx.font = '14px monospace';
        ctx.fillText(`BARCODE: ${product.barcode}`, 30, 300);
      }

      // Draw QR Code Image on right side
      ctx.drawImage(image, 380, 50, 180, 180);

      // Scan Call to action under QR
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 12px sans-serif';
      const ctaText = actionMode === 'pos_add_to_cart' ? 'Scan to POS Basket' : 'Scan for Live Info';
      ctx.fillText(ctaText, 395, 255);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `shelf_label_${product.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    image.src = blobURL;
  };

  const previewProduct = flatLabelsToPrint[0] || products[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      
      {/* Print styles injected into DOM */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #shelf-label-print-area, #shelf-label-print-area * {
            visibility: visible;
          }
          #shelf-label-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 8mm;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 8mm;
            size: auto;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden print:max-w-none print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Header (Hidden in Print) */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-inner">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">QR Code Shelf Label Studio</h2>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded border border-blue-400/30">
                  Print & Export Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generate high-resolution printable retail shelf tags with live QR scan links
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={flatLabelsToPrint.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print {flatLabelsToPrint.length} Labels</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Studio Workspace Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden print:block">
          
          {/* LEFT COLUMN: Product Picker & Multi-Select (4 Cols) */}
          <div className="lg:col-span-4 border-r border-slate-200 bg-slate-50/70 p-4 flex flex-col gap-3 overflow-hidden no-print">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Select Products ({Object.keys(selectedMap).length} selected)</span>
              </span>
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Search & Category Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, SKU or barcode..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {categories.length > 0 && (
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('all')}
                    className={`px-2 py-1 rounded-md shrink-0 font-medium cursor-pointer transition-colors ${
                      categoryFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    All ({products.length})
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat!)}
                      className={`px-2 py-1 rounded-md shrink-0 font-medium cursor-pointer transition-colors ${
                        categoryFilter === cat ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Checkbox List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[380px] lg:max-h-none">
              {filteredProducts.map(p => {
                const isSelected = Boolean(selectedMap[p.id]);
                const copies = selectedMap[p.id] || 1;

                return (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div
                      onClick={() => handleToggleProduct(p.id)}
                      className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer select-none"
                    >
                      <div className="text-blue-600 shrink-0">
                        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-slate-900 truncate">{p.name}</h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                          <span className="font-bold text-slate-700">
                            {activeBusiness?.currency || 'KES'} {Number(p.selling_price).toLocaleString()}
                          </span>
                          {p.sku && <span>· SKU: {p.sku}</span>}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-1 pl-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateCopies(p.id, -1)}
                          className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center cursor-pointer text-xs"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-xs w-4 text-center">{copies}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCopies(p.id, 1)}
                          className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center cursor-pointer text-xs"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                  No products matched your search.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Total print queue:</span>
              <span className="font-bold text-slate-900 font-mono">{flatLabelsToPrint.length} labels</span>
            </div>
          </div>

          {/* MIDDLE COLUMN: Design Settings & Presets (3 Cols) */}
          <div className="lg:col-span-3 border-r border-slate-200 p-4 space-y-4 overflow-y-auto no-print">
            
            {/* Label Layout Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>Label Size & Format</span>
              </label>
              <div className="space-y-1 text-xs">
                {[
                  { id: 'shelf_standard', label: 'Shelf Talker (65 × 35 mm)', desc: 'Retail shelf rails & edges' },
                  { id: 'compact_tag', label: 'Compact Tag (45 × 28 mm)', desc: 'Peg hooks & wire baskets' },
                  { id: 'large_card', label: 'Feature Display (90 × 60 mm)', desc: 'Endcaps & large showcases' },
                  { id: 'sheet_a4_21', label: 'A4 Sheet (21 Labels / 3×7)', desc: 'Standard Avery sticker paper' },
                  { id: 'sheet_a4_24', label: 'A4 Sheet (24 Labels / 3×8)', desc: 'Compact sticker paper' },
                  { id: 'thermal_roll', label: 'Thermal Roll (58/80mm)', desc: 'POS thermal label printers' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPreset(item.id as LabelSizePreset)}
                    className={`w-full text-left p-2 rounded-xl border transition-all cursor-pointer ${
                      preset === item.id
                        ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-[11px]">{item.label}</div>
                    <div className="text-[10px] text-slate-400">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* QR Scan Action Mode */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <label className="text-xs font-bold text-slate-800">QR Code Action on Scan</label>
              <div className="space-y-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActionMode('product_details')}
                  className={`w-full text-left p-2 rounded-xl border transition-all cursor-pointer ${
                    actionMode === 'product_details'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Public Product Page & Self-Pay</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Customers scan to view details & pay via M-Pesa STK push
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActionMode('pos_add_to_cart')}
                  className={`w-full text-left p-2 rounded-xl border transition-all cursor-pointer ${
                    actionMode === 'pos_add_to_cart'
                      ? 'bg-blue-50 border-blue-400 text-blue-950 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
                    <span>Instant Add to Active POS Sale</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Cashier scanner instantly inserts item into POS cart
                  </p>
                </button>
              </div>
            </div>

            {/* Custom promotional ribbon */}
            <div className="space-y-1 pt-2 border-t border-slate-200">
              <label className="text-xs font-bold text-slate-800">Promo Badge (Optional)</label>
              <input
                type="text"
                placeholder="e.g. SPECIAL OFFER, NEW, HOT DEAL"
                value={promoText}
                onChange={e => setPromoText(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white uppercase font-semibold"
              />
            </div>

            {/* Display Field Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
              <label className="text-xs font-bold text-slate-800 block">Elements to Display</label>
              
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={showBusinessName}
                  onChange={e => setShowBusinessName(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Store Name ({activeBusiness?.name || 'Store'})</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={showCategory}
                  onChange={e => setShowCategory(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Category & Brand subtitle</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={showBarcodeText}
                  onChange={e => setShowBarcodeText(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Barcode / SKU text</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={showCutGuides}
                  onChange={e => setShowCutGuides(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Cutting guide lines</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={showVatNote}
                  onChange={e => setShowVatNote(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Tax note (Incl. 16% VAT)</span>
              </label>
            </div>

          </div>

          {/* RIGHT COLUMN: Live Interactive Preview & Print Sheet (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-100 p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto print:p-0 print:bg-white print:overflow-visible">
            
            {/* View Switcher bar (Hidden in Print) */}
            <div className="flex items-center justify-between no-print">
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('single')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    viewMode === 'single' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Single Label Preview
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('sheet')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    viewMode === 'sheet' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Print Sheet Grid ({flatLabelsToPrint.length})
                </button>
              </div>

              {previewProduct && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(previewProduct)}
                    className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    title="Copy QR destination URL"
                  >
                    {copiedId === previewProduct.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{copiedId === previewProduct.id ? 'Copied' : 'Copy URL'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadLabel(previewProduct)}
                    className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    title="Download high-resolution label PNG"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden sm:inline">PNG</span>
                  </button>
                </div>
              )}
            </div>

            {/* SINGLE PREVIEW VIEW */}
            {viewMode === 'single' && previewProduct && (
              <div className="flex-1 flex flex-col items-center justify-center py-4 no-print">
                
                {/* Physical Label Mockup */}
                <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-300 overflow-hidden relative p-4 transition-all">
                  
                  {promoText && (
                    <div className="absolute top-0 right-0 bg-rose-600 text-white text-[9px] font-extrabold px-3 py-0.5 rounded-bl-lg uppercase tracking-wider shadow-xs">
                      {promoText}
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    
                    {/* Left: Product Information */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      
                      {showBusinessName && (
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 truncate">
                          {activeBusiness?.name || 'BRISK STORE'}
                        </div>
                      )}

                      {showCategory && (previewProduct.brand_name || previewProduct.category_name) && (
                        <div className="text-[10px] font-medium text-slate-500 truncate">
                          {[previewProduct.brand_name, previewProduct.category_name].filter(Boolean).join(' · ')}
                        </div>
                      )}

                      <h3 className="text-base font-extrabold text-slate-950 leading-snug tracking-tight">
                        {previewProduct.name}
                      </h3>

                      {previewProduct.variant && (
                        <p className="text-[10px] text-slate-500 font-medium">
                          {previewProduct.variant} {previewProduct.size && `(${previewProduct.size})`}
                        </p>
                      )}

                      {/* Main Price Box */}
                      <div className="pt-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-bold text-blue-600 font-mono">
                            {activeBusiness?.currency || 'KES'}
                          </span>
                          <span className="text-2xl font-black text-slate-950 font-mono tracking-tight">
                            {Number(previewProduct.selling_price).toLocaleString()}
                          </span>
                          {showUnit && previewProduct.unit && (
                            <span className="text-[11px] text-slate-500 font-semibold">
                              / {previewProduct.unit}
                            </span>
                          )}
                        </div>

                        {showVatNote && previewProduct.vat_type === 'default' && (
                          <div className="text-[9px] text-slate-400 font-medium mt-0.5">
                            Inclusive of 16% VAT
                          </div>
                        )}
                      </div>

                      {showBarcodeText && (previewProduct.barcode || previewProduct.sku) && (
                        <div className="text-[9px] font-mono text-slate-400 pt-1 tracking-wider">
                          {previewProduct.barcode ? `EAN: ${previewProduct.barcode}` : `SKU: ${previewProduct.sku}`}
                        </div>
                      )}
                    </div>

                    {/* Right: High-Resolution QR Code */}
                    <div className="shrink-0 flex flex-col items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <div id={`qr-svg-${previewProduct.id}`}>
                        <QRCodeSVG
                          value={getQrValue(previewProduct)}
                          size={96}
                          level="M"
                          includeMargin={false}
                          bgColor="#FFFFFF"
                          fgColor="#0F172A"
                        />
                      </div>
                      <span className="text-[9px] font-bold text-slate-600 text-center mt-1.5 leading-tight">
                        {actionMode === 'pos_add_to_cart' ? 'Scan to POS Cart' : 'Scan to Buy / Info'}
                      </span>
                    </div>

                  </div>

                </div>

                <p className="text-[11px] text-slate-400 mt-4 text-center">
                  💡 This QR shelf tag works with any standard smartphone camera or store barcode scanner.
                </p>
              </div>
            )}

            {/* FULL SHEET PRINT AREA (Visible in Print, Switchable in Preview) */}
            <div
              id="shelf-label-print-area"
              ref={printContainerRef}
              className={`w-full ${viewMode === 'sheet' ? 'block' : 'hidden print:block'}`}
            >
              
              <div
                className={`grid gap-3 w-full ${
                  preset === 'compact_tag'
                    ? 'grid-cols-2 sm:grid-cols-3 print:grid-cols-3'
                    : preset === 'large_card'
                    ? 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2'
                    : preset === 'sheet_a4_24'
                    ? 'grid-cols-3 print:grid-cols-3'
                    : 'grid-cols-2 sm:grid-cols-3 print:grid-cols-3'
                }`}
              >
                {flatLabelsToPrint.map((prod, index) => (
                  <div
                    key={`${prod.id}-${index}`}
                    className={`bg-white rounded-lg p-3 relative flex items-start justify-between gap-2.5 overflow-hidden break-inside-avoid page-break-inside-avoid ${
                      showCutGuides ? 'border border-dashed border-slate-300' : 'border border-slate-200'
                    }`}
                    style={{ minHeight: preset === 'compact_tag' ? '95px' : preset === 'large_card' ? '170px' : '120px' }}
                  >
                    
                    {promoText && (
                      <div className="absolute top-0 right-0 bg-rose-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl uppercase">
                        {promoText}
                      </div>
                    )}

                    {/* Left: Info */}
                    <div className="space-y-1 flex-1 min-w-0">
                      {showBusinessName && (
                        <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 truncate">
                          {activeBusiness?.name || 'BRISK STORE'}
                        </div>
                      )}

                      <h4 className="text-xs font-black text-slate-900 leading-tight tracking-tight line-clamp-2">
                        {prod.name}
                      </h4>

                      {showCategory && (prod.brand_name || prod.category_name) && (
                        <div className="text-[9px] text-slate-500 truncate">
                          {[prod.brand_name, prod.category_name].filter(Boolean).join(' · ')}
                        </div>
                      )}

                      <div className="pt-1">
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-[10px] font-bold text-blue-600 font-mono">
                            {activeBusiness?.currency || 'KES'}
                          </span>
                          <span className="text-base font-black text-slate-950 font-mono">
                            {Number(prod.selling_price).toLocaleString()}
                          </span>
                          {showUnit && prod.unit && (
                            <span className="text-[9px] text-slate-500">/{prod.unit}</span>
                          )}
                        </div>
                        {showVatNote && (
                          <div className="text-[8px] text-slate-400">Incl. VAT</div>
                        )}
                      </div>

                      {showBarcodeText && (prod.barcode || prod.sku) && (
                        <div className="text-[8px] font-mono text-slate-400 truncate">
                          {prod.barcode ? `EAN:${prod.barcode}` : `SKU:${prod.sku}`}
                        </div>
                      )}
                    </div>

                    {/* Right: QR Code */}
                    <div className="shrink-0 flex flex-col items-center bg-slate-50 p-1 rounded border border-slate-100">
                      <QRCodeSVG
                        value={getQrValue(prod)}
                        size={preset === 'compact_tag' ? 56 : preset === 'large_card' ? 90 : 68}
                        level="M"
                        includeMargin={false}
                        bgColor="#FFFFFF"
                        fgColor="#0F172A"
                      />
                      <span className="text-[7.5px] font-bold text-slate-600 text-center mt-0.5">
                        {actionMode === 'pos_add_to_cart' ? 'Scan to POS' : 'Scan to Buy'}
                      </span>
                    </div>

                  </div>
                ))}
              </div>

              {flatLabelsToPrint.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                  No products currently selected for label printing. Select items from the left panel.
                </div>
              )}

            </div>

          </div>

        </div>

        {/* Footer (Hidden in Print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between no-print shrink-0 text-xs">
          <div className="text-slate-500 font-medium">
            Ready to print <span className="font-bold text-slate-900">{flatLabelsToPrint.length}</span> labels on {preset.replace('_', ' ')}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={flatLabelsToPrint.length === 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Shelf Labels</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
