import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  QrCode,
  Smartphone,
  Banknote,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  X,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Barcode,
  Store,
  Layers,
  Percent,
  UserPlus,
  ChevronDown,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, axiosInstance } from '../services/api';
import { Product, Category, Sale, Receipt } from '../types';
import { ThermalReceiptModal } from '../components/ThermalReceiptModal';
import QRCode from 'qrcode';

interface CartItem {
  product: Product;
  quantity: number;
}

interface PosPageProps {
  initialCart?: Array<{ productId: string; quantity: number }>;
  onNavigate?: (path: string) => void;
}

export const PosPage: React.FC<PosPageProps> = ({ initialCart, onNavigate }) => {
  const { user, activeBusiness, member, subscription } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);

  // Mobile cart drawer state
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [barcodeScanModalOpen, setBarcodeScanModalOpen] = useState(false);
  const [barcodeInputValue, setBarcodeInputValue] = useState('');

  // Checkout Modals & Real-time M-Pesa State Machine (Section 13-20)
  // Payment states: 'idle' | 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED' | 'FAILED' | 'EXPIRED' | 'REFUNDED'
  const [checkoutMode, setCheckoutMode] = useState<'idle' | 'mpesa' | 'qr' | 'cash'>('idle');
  const [paymentStatus, setPaymentStatus] = useState<
    'idle' | 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED' | 'FAILED' | 'EXPIRED'
  >('idle');
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [qrDetails, setQrDetails] = useState<{ token: string; qrDataUrl: string; paymentUrl: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Load products and categories
  const loadData = async () => {
    try {
      setLoading(true);
      const [prodData, catData] = await Promise.all([
        api.products.getProducts(),
        api.products.getCategories(),
      ]);
      if (prodData) {
        setProducts(prodData);

        if (initialCart && initialCart.length > 0) {
          const newCart: CartItem[] = [];
          for (const item of initialCart) {
            const p = prodData.find(x => x.id === item.productId);
            if (p) newCart.push({ product: p, quantity: item.quantity });
          }
          if (newCart.length > 0) setCart(newCart);
        }
      }
      if (catData) {
        setCategories(catData);
      }
    } catch (err) {
      console.error('Failed to load POS data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBusiness?.id]);

  // Check URL query for scan parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('scan') === 'true') {
      setBarcodeScanModalOpen(true);
    }
  }, []);

  // Format Kenyan Phone Numbers: 07XXXXXXXX -> +2547XXXXXXXX or 01XXXXXXXX -> +2541XXXXXXXX
  const normalizeKenyanPhone = (raw: string): string => {
    let clean = raw.replace(/[^\d+]/g, '');
    if (clean.startsWith('0') && clean.length === 10) {
      return `+254${clean.slice(1)}`;
    }
    if (clean.startsWith('254') && clean.length === 12) {
      return `+${clean}`;
    }
    if ((clean.startsWith('7') || clean.startsWith('1')) && clean.length === 9) {
      return `+254${clean}`;
    }
    return clean;
  };

  // Cart Operations
  const addToCart = (product: Product, quantityToAdd: number = 1) => {
    if (product.stock_quantity <= 0) {
      setErrorMessage(`"${product.name}" is currently out of stock.`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantityToAdd;
        if (newQty > product.stock_quantity) {
          setErrorMessage(`Cannot add more "${product.name}". Only ${product.stock_quantity} available in stock.`);
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: Math.round(newQty * 100) / 100 } : item
        );
      }
      return [...prev, { product, quantity: quantityToAdd }];
    });
    setErrorMessage(null);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            if (newQuantity <= 0) return null;
            if (newQuantity > item.product.stock_quantity) {
              setErrorMessage(`Only ${item.product.stock_quantity} available in stock.`);
              return { ...item, quantity: item.product.stock_quantity };
            }
            return { ...item, quantity: Math.round(newQuantity * 100) / 100 };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountPercent(0);
    setErrorMessage(null);
  };

  // Financial calculations with VAT handling
  const isVatEnabled = activeBusiness?.vat_enabled !== false;
  const pricesIncludeVat = activeBusiness?.prices_include_vat ?? true;

  let calculatedTaxAmount = 0;
  let calculatedSubtotal = 0;

  for (const item of cart) {
    const gross = item.product.selling_price * item.quantity;
    let rate = 0;
    if (item.product.vat_type === 'exempt') {
      rate = 0;
    } else if (item.product.vat_type === 'custom') {
      rate = item.product.custom_tax_rate ?? 0;
    } else {
      rate = isVatEnabled ? (activeBusiness?.tax_percentage ?? 16) : 0;
    }

    if (rate > 0) {
      if (pricesIncludeVat) {
        const itemNet = gross / (1 + rate / 100);
        calculatedTaxAmount += (gross - itemNet);
        calculatedSubtotal += itemNet;
      } else {
        calculatedTaxAmount += gross * (rate / 100);
        calculatedSubtotal += gross;
      }
    } else {
      calculatedSubtotal += gross;
    }
  }

  const rawGrossTotal = cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);
  const discountAmount = Math.round((rawGrossTotal * (discountPercent || 0)) / 100);
  const total = Math.max(0, pricesIncludeVat ? rawGrossTotal - discountAmount : rawGrossTotal + calculatedTaxAmount - discountAmount);

  // Maximum allowed discount based on worker permissions
  const maxDiscountAllowed = member?.permissions.max_discount_percent ?? (member?.role === 'owner' ? 100 : 5);

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCat && p.active !== false;

    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      (p.brand_name && p.brand_name.toLowerCase().includes(q)) ||
      (p.variant && p.variant.toLowerCase().includes(q)) ||
      (p.size && p.size.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.category_name && p.category_name.toLowerCase().includes(q));

    return matchesCat && matchesSearch && p.active !== false;
  });

  // Barcode Scanner detection on Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = searchQuery.trim();
      if (!q) return;
      const exactMatch = products.find(
        p => (p.barcode && p.barcode.toLowerCase() === q.toLowerCase()) || p.sku.toLowerCase() === q.toLowerCase()
      );
      if (exactMatch) {
        addToCart(exactMatch);
        setSearchQuery('');
        e.preventDefault();
      }
    }
  };

  const handleBarcodeModalScan = (e: React.FormEvent) => {
    e.preventDefault();
    const barcode = barcodeInputValue.trim();
    if (!barcode) return;
    const match = products.find(
      p => (p.barcode && p.barcode.toLowerCase() === barcode.toLowerCase()) || p.sku.toLowerCase() === barcode.toLowerCase()
    );
    if (match) {
      addToCart(match);
      setBarcodeInputValue('');
      setBarcodeScanModalOpen(false);
    } else {
      setErrorMessage(`No product found with barcode/SKU: ${barcode}`);
    }
  };

  // =========================================================================
  // 1. M-PESA PAYMENT WORKFLOW (Sections 13-20)
  // =========================================================================
  const handleInitiateMpesa = async () => {
    if (cart.length === 0) return;
    const normalizedPhone = normalizeKenyanPhone(customerPhone);
    if (!normalizedPhone || normalizedPhone.length < 10) {
      setErrorMessage('Please enter a valid Kenyan customer phone number (e.g. 0712345678).');
      return;
    }

    try {
      setErrorMessage(null);
      setCheckoutMode('mpesa');
      setPaymentStatus('PENDING');
      setStatusMessage('Sending M-Pesa STK Push payment prompt...');

      // Step 1: Create Sale record with status PENDING on server
      const saleData = await api.sales.createSale({
        items: cart.map(i => ({
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.quantity,
          unit_price: i.product.selling_price,
          total_price: i.product.selling_price * i.quantity,
          barcode: i.product.barcode,
          variant: i.product.variant,
          unit: i.product.unit,
        })),
        customer_phone: normalizedPhone,
        customer_name: customerName.trim() || 'Valued Customer',
        discount_amount: (cart.reduce((s, i) => s + (i.product.selling_price * i.quantity), 0) * discountPercent) / 100,
        subtotal: cart.reduce((s, i) => s + (i.product.selling_price * i.quantity), 0),
        total_amount: cart.reduce((s, i) => s + (i.product.selling_price * i.quantity), 0) * (1 - discountPercent / 100),
        payment_method: 'mpesa',
      });

      const sale: Sale = saleData.sale;
      setCurrentSale(sale);

      // Step 2: Trigger STK Push on server
      const stkData = await api.sales.initiateMpesaStk({
        sale_id: sale.id,
        phone: normalizedPhone,
        amount: sale.total,
      });

      setCurrentPaymentId(stkData.paymentId);
      setPaymentStatus('PENDING');
      setStatusMessage('Waiting for customer to enter M-Pesa PIN...');

      // Step 3: Poll backend for official payment callback/status
      pollPaymentStatus(stkData.paymentId);
    } catch (err: any) {
      setErrorMessage(err.message);
      setPaymentStatus('FAILED');
    }
  };

  // Poll payment status every 1.5 seconds (Never mark PAID from client alone)
  const pollPaymentStatus = (paymentId: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await axiosInstance.get(`/payments/${paymentId}`);
        const data = res.data;
        const pStatus = data.payment.status;

        if (pStatus === 'PAID') {
          clearInterval(interval);
          setPaymentStatus('PAID');
          setCurrentReceipt(data.receipt);
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
          clearCart();
          loadData(); // Deduct inventory from UI
        } else if (pStatus === 'CANCELLED') {
          clearInterval(interval);
          setPaymentStatus('CANCELLED');
          setStatusMessage('The customer cancelled the M-Pesa payment request.');
        } else if (pStatus === 'FAILED') {
          clearInterval(interval);
          setPaymentStatus('FAILED');
          setStatusMessage(data.payment.failure_reason || 'The M-Pesa payment could not be completed.');
        } else if (pStatus === 'EXPIRED') {
          clearInterval(interval);
          setPaymentStatus('EXPIRED');
          setStatusMessage('The payment request expired before it was completed.');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }

      if (attempts >= 45) {
        clearInterval(interval);
        if (paymentStatus === 'PENDING' || paymentStatus === 'PROCESSING') {
          setPaymentStatus('EXPIRED');
          setStatusMessage('The payment request expired before it was completed.');
        }
      }
    }, 1500);
  };

  // Simulator for Developer / Tester Acceptance
  const handleSimulateScenario = async (scenario: 'success' | 'failure' | 'duplicate') => {
    if (!currentPaymentId) return;
    try {
      const res = await axiosInstance.post('/payments/mpesa/simulate-callback', {
        paymentId: currentPaymentId,
        scenario,
      });
      const data = res.data;
      if (scenario === 'success' || scenario === 'duplicate') {
        setPaymentStatus('PAID');
        setCurrentReceipt(data.receipt);
        confetti({ particleCount: 70, spread: 70 });
        clearCart();
        loadData();
      } else {
        setPaymentStatus('CANCELLED');
        setStatusMessage('The customer cancelled the M-Pesa payment request.');
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // =========================================================================
  // 2. CASH CHECKOUT FLOW
  // =========================================================================
  const handleCashCheckout = async () => {
    if (cart.length === 0) return;
    try {
      setErrorMessage(null);
      setCheckoutMode('cash');

      const saleData = await api.sales.createSale({
        items: cart.map(i => ({
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.quantity,
          unit_price: i.product.selling_price,
          total_price: i.product.selling_price * i.quantity,
          barcode: i.product.barcode,
          variant: i.product.variant,
          unit: i.product.unit,
        })),
        customer_phone: customerPhone ? normalizeKenyanPhone(customerPhone) : undefined,
        customer_name: customerName || 'Cash Customer',
        discount_amount: (cart.reduce((s, i) => s + (i.product.selling_price * i.quantity), 0) * discountPercent) / 100,
        subtotal: cart.reduce((s, i) => s + (i.product.selling_price * i.quantity), 0),
        total_amount: cart.reduce((s, i) => s + (i.product.selling_price * i.quantity), 0) * (1 - discountPercent / 100),
        payment_method: 'cash',
      });

      const payRes = await axiosInstance.post('/payments/cash', {
        saleId: saleData.sale.id,
        amount: saleData.sale.total,
      });

      const payData = payRes.data;

      setCurrentReceipt(payData.receipt);
      confetti({ particleCount: 70, spread: 70 });
      clearCart();
      loadData();
      setCheckoutMode('idle');
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // =========================================================================
  // 3. QR PAYMENT CHECKOUT FLOW
  // =========================================================================
  const handleGenerateQR = async () => {
    if (cart.length === 0) return;
    try {
      setErrorMessage(null);
      setCheckoutMode('qr');

      const saleData = await api.sales.createSale({
        items: cart.map(i => ({
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.quantity,
          unit_price: i.product.selling_price,
          total_price: i.product.selling_price * i.quantity,
          barcode: i.product.barcode,
          variant: i.product.variant,
          unit: i.product.unit,
        })),
        customer_phone: customerPhone ? normalizeKenyanPhone(customerPhone) : undefined,
        customer_name: customerName || 'QR Customer',
        discount_amount: (cart.reduce((s, i) => s + (i.product.selling_price * i.quantity), 0) * discountPercent) / 100,
        subtotal: cart.reduce((s, i) => s + (i.product.selling_price * i.quantity), 0),
        total_amount: cart.reduce((s, i) => s + (i.product.selling_price * i.quantity), 0) * (1 - discountPercent / 100),
        payment_method: 'mpesa_qr',
      });

      const qrRes = await axiosInstance.post('/payments/qr/create', { saleId: saleData.sale.id });
      const qrJson = qrRes.data;

      const qrDataUrl = await QRCode.toDataURL(qrJson.paymentUrl, {
        width: 280,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      });

      setQrDetails({
        token: qrJson.token,
        qrDataUrl,
        paymentUrl: qrJson.paymentUrl,
      });

      // Poll QR payment completion
      const pollQr = setInterval(async () => {
        try {
          const checkRes = await axiosInstance.get(`/payments/qr/${qrJson.token}`);
          const checkData = checkRes.data;
          if (checkData.session?.status === 'paid') {
            clearInterval(pollQr);
            setCheckoutMode('idle');
            setCurrentReceipt(checkData.receipt);
            confetti({ particleCount: 80, spread: 70 });
            clearCart();
            loadData();
          }
        } catch (err) {
          console.error(err);
        }
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 font-sans">
      
      {/* Top Header Bar for Fast POS Operations */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-blue-600 shrink-0 shadow-xs">
            <img
              src="/src/assets/images/apple-touch-icon.png"
              alt="Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
              Speed POS Terminal · {activeBusiness?.name || 'ABC SHOP'}
            </h1>
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span>{user?.full_name || 'Cashier on Duty'}</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-medium">M-Pesa STK Push Active</span>
            </div>
          </div>
        </div>

        {/* Quick Barcode Scanner Trigger Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBarcodeScanModalOpen(true)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Barcode className="w-4 h-4" />
            <span>Scan Barcode</span>
          </button>
        </div>
      </div>

      {/* Error / Alert banner */}
      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2-Column POS Layout (Desktop) & Responsive Mobile Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Products Catalog, Variants, Search & Category Filter */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          
          {/* Search & Barcode Quick Field */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by product name, brand, SKU or barcode (Enter to add)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-sans"
              />
            </div>

            <div className="text-xs text-slate-500 flex items-center justify-between sm:justify-start gap-2 shrink-0">
              <span className="font-semibold text-slate-700">{filteredProducts.length} items</span>
              <span aria-hidden="true">·</span>
              <span>Available stock</span>
            </div>
          </div>

          {/* Category Filter Pills (Functional Segmented Buttons) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products Grid with Distinct Variants (Section 11) */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 py-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-36 bg-slate-100 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
              <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No products found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Try typing another SKU, barcode, or variant name.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map(product => {
                const inCart = cart.find(c => c.product.id === product.id);
                const isOutOfStock = product.stock_quantity <= 0;
                const isLowStock = product.stock_quantity <= (product.low_stock_threshold || 5) && !isOutOfStock;

                return (
                  <div
                    key={product.id}
                    className={`text-left p-3.5 bg-white border rounded-2xl transition-all relative flex flex-col justify-between group ${
                      inCart
                        ? 'border-blue-600 ring-2 ring-blue-600/15 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    } ${isOutOfStock ? 'opacity-50 bg-slate-50' : ''}`}
                  >
                    <div>
                      {/* Product SKU & Stock Badging */}
                      <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between gap-1 flex-wrap font-mono">
                        <span>{product.sku}</span>
                        {isLowStock && <span className="text-amber-600 font-bold font-sans">Low stock</span>}
                        {isOutOfStock && <span className="text-red-600 font-bold font-sans">Out of stock</span>}
                      </div>

                      {/* Brand and Variant Name */}
                      <h3 className="text-xs font-black text-slate-900 leading-snug line-clamp-2">
                        {product.brand_name ? `${product.brand_name} ` : ''}
                        {product.name}
                      </h3>

                      {/* Size and Unit variant */}
                      {(product.size || product.variant || product.unit_size) && (
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {product.size || product.variant || product.unit_size} {product.unit && product.unit !== 'piece' ? product.unit : ''}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1">
                      <div>
                        <div className="text-xs font-black text-slate-900 font-mono">
                          KES {product.selling_price.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Stock: <span className="font-bold text-slate-700">{product.stock_quantity}</span> {product.unit || 'pcs'}
                        </div>
                      </div>

                      {/* + ADD Button */}
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        disabled={isOutOfStock}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                          inCart
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-slate-100 text-slate-800 hover:bg-blue-50 hover:text-blue-700'
                        } ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        {inCart ? (
                          <>
                            <span>{inCart.quantity}</span>
                            <Plus className="w-3 h-3" />
                          </>
                        ) : (
                          <span>+ ADD</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Active Cart, Fractional Quantities, M-Pesa & Cash Checkout */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden sticky top-20">
          
          {/* Cart Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Active Sale Cart</span>
              <span className="text-xs text-slate-500">({cart.length} items)</span>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] text-red-600 hover:text-red-800 font-semibold transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="p-4 max-h-[300px] overflow-y-auto divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-xs font-bold text-slate-700">Cart is empty</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Click products or scan barcodes to begin sale.</p>
              </div>
            ) : (
              cart.map(item => {
                const allowsFractional = item.product.fractional_quantity_allowed ||
                  ['kg', 'g', 'litre', 'ml', 'm', 'metre', 'meter'].includes(item.product.unit?.toLowerCase() || '');

                return (
                  <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0 pr-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.product.brand_name ? `${item.product.brand_name} ` : ''}
                        {item.product.name}
                      </p>
                      <p className="text-[11px] text-slate-500 tabular-nums">
                        KES {item.product.selling_price.toLocaleString()} /{item.product.unit || 'pc'}
                      </p>
                    </div>

                    {/* Quantity Stepper & Fractional Input (Section 10) */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - (allowsFractional ? 0.5 : 1))}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        
                        <input
                          type="number"
                          step={allowsFractional ? '0.1' : '1'}
                          min="0.1"
                          max={item.product.stock_quantity}
                          value={item.quantity}
                          onChange={e => updateQuantity(item.product.id, parseFloat(e.target.value) || 0)}
                          className="w-12 py-0.5 text-xs font-bold text-slate-900 text-center bg-transparent border-0 focus:outline-hidden tabular-nums"
                        />

                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + (allowsFractional ? 0.5 : 1))}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-black text-slate-900 tabular-nums min-w-[55px] text-right font-mono">
                        {(item.product.selling_price * item.quantity).toLocaleString()}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Customer & Discount Controls */}
          {cart.length > 0 && (
            <div className="p-4 bg-slate-50/80 border-t border-slate-100 space-y-3 text-xs">
              
              {/* Customer Phone Input (Section 12: Normalization) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Customer M-Pesa Phone Number
                </label>
                <div className="relative">
                  <Smartphone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="07XXXXXXXX or 01XXXXXXXX"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900"
                  />
                </div>
              </div>

              {/* Customer Name Optional */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grace Wambui"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900"
                />
              </div>

              {/* Discount Stepper (Checked against worker role discount limit) */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600 text-xs font-medium">Discount ({maxDiscountAllowed}% max):</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max={maxDiscountAllowed}
                    value={discountPercent}
                    onChange={e => {
                      const val = Math.min(maxDiscountAllowed, Math.max(0, parseInt(e.target.value) || 0));
                      setDiscountPercent(val);
                    }}
                    className="w-16 px-2 py-1 text-right bg-white border border-slate-200 rounded-lg text-xs font-bold tabular-nums"
                  />
                  <span className="text-slate-500 font-bold">%</span>
                </div>
              </div>

              {/* Subtotal, VAT, Discount & Total (Section 21) */}
              <div className="pt-2 border-t border-slate-200 space-y-1 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-bold">
                    KES {(pricesIncludeVat ? rawGrossTotal : Math.round(calculatedSubtotal)).toLocaleString()}
                  </span>
                </div>

                {isVatEnabled && (
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>VAT ({pricesIncludeVat ? 'Included' : `${activeBusiness?.tax_percentage ?? 16}%`})</span>
                    <span className="tabular-nums">
                      KES {Math.round(calculatedTaxAmount).toLocaleString()}
                    </span>
                  </div>
                )}

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 text-[11px]">
                    <span>Discount</span>
                    <span className="tabular-nums font-bold">
                      -KES {discountAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-base font-black text-slate-900 pt-1.5 border-t border-slate-200">
                  <span className="font-sans">TOTAL TO CHARGE</span>
                  <span className="tabular-nums text-blue-700">KES {total.toLocaleString()}</span>
                </div>
              </div>

              {/* Checkout Action Buttons (Section 13-20) */}
              <div className="pt-2 space-y-2 font-sans">
                
                {/* 1. M-Pesa STK Push Primary Button */}
                <button
                  onClick={handleInitiateMpesa}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl font-black text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>REQUEST M-PESA PAYMENT (KES {total.toLocaleString()})</span>
                </button>

                {/* Secondary Checkout Options: QR Code or Cash */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleGenerateQR}
                    className="py-2.5 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-blue-600" />
                    <span>Generate QR</span>
                  </button>

                  <button
                    onClick={handleCashCheckout}
                    className="py-2.5 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Banknote className="w-3.5 h-3.5 text-slate-700" />
                    <span>Cash Sale</span>
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: REAL-TIME M-PESA STK PUSH WAITING / STATUS SCREEN (Sections 15-20) */}
      {/* Handles: PENDING, PROCESSING, CANCELLED, FAILED, EXPIRED, PAID */}
      {/* ========================================================================= */}
      {checkoutMode === 'mpesa' && paymentStatus !== 'PAID' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center animate-fadeIn">
            
            {/* Status Icon Header */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all">
              {paymentStatus === 'PENDING' || paymentStatus === 'PROCESSING' ? (
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center relative">
                  <Smartphone className="w-8 h-8 animate-pulse" />
                  <span className="absolute top-2 right-2 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span>
                </div>
              ) : paymentStatus === 'CANCELLED' ? (
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                  <XCircle className="w-8 h-8" />
                </div>
              ) : paymentStatus === 'FAILED' ? (
                <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
                  <Clock className="w-8 h-8" />
                </div>
              )}
            </div>

            {/* Status Title (Sections 15, 16, 17, 18) */}
            <h3 className="text-lg font-black text-slate-900">
              {paymentStatus === 'PENDING' || paymentStatus === 'PROCESSING'
                ? 'Waiting for Customer'
                : paymentStatus === 'CANCELLED'
                ? 'Payment Cancelled'
                : paymentStatus === 'FAILED'
                ? 'Payment Failed'
                : 'Payment Expired'}
            </h3>

            {/* Amount */}
            <p className="text-2xl font-black text-slate-900 my-1 font-mono">
              KES {total.toLocaleString()}
            </p>

            {/* Instruction Message (Sections 15, 16, 17, 18) */}
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {paymentStatus === 'PENDING' || paymentStatus === 'PROCESSING' ? (
                <>
                  M-Pesa payment request sent to: <strong className="font-mono text-slate-900">{customerPhone}</strong>.
                  <br />
                  <span className="text-slate-500 mt-1 block">Ask the customer to check their phone and complete the M-Pesa payment.</span>
                </>
              ) : paymentStatus === 'CANCELLED' ? (
                'The customer cancelled the M-Pesa payment request.'
              ) : paymentStatus === 'FAILED' ? (
                'The M-Pesa payment could not be completed.'
              ) : (
                'The payment request expired before it was completed.'
              )}
            </p>

            {/* Sandbox Simulation Helper (For Developer & Acceptance Testing) */}
            {(paymentStatus === 'PENDING' || paymentStatus === 'PROCESSING') && (
              <div className="my-4 p-3 bg-blue-50/70 border border-blue-200/70 rounded-2xl text-left text-xs">
                <p className="font-bold text-blue-900 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sandbox Testing Controls:</span>
                </p>
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  <button
                    onClick={() => handleSimulateScenario('success')}
                    className="py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    Simulate PIN OK
                  </button>
                  <button
                    onClick={() => handleSimulateScenario('failure')}
                    className="py-1 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    Simulate Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons based on Payment State (Sections 16, 17, 18) */}
            <div className="mt-5 space-y-2">
              {paymentStatus === 'CANCELLED' && (
                <>
                  <button
                    onClick={handleInitiateMpesa}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => {
                      setCheckoutMode('idle');
                      setPaymentStatus('idle');
                    }}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Change Payment Method
                  </button>
                  <button
                    onClick={() => {
                      setCheckoutMode('idle');
                      setPaymentStatus('idle');
                      clearCart();
                    }}
                    className="w-full py-2 text-red-600 hover:text-red-800 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel Sale
                  </button>
                </>
              )}

              {paymentStatus === 'FAILED' && (
                <>
                  <button
                    onClick={handleInitiateMpesa}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => {
                      setCheckoutMode('idle');
                      setPaymentStatus('idle');
                    }}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Change Payment Method
                  </button>
                </>
              )}

              {paymentStatus === 'EXPIRED' && (
                <>
                  <button
                    onClick={handleInitiateMpesa}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Send New Payment Request
                  </button>
                  <button
                    onClick={() => {
                      setCheckoutMode('idle');
                      setPaymentStatus('idle');
                    }}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Change Payment Method
                  </button>
                </>
              )}

              {(paymentStatus === 'PENDING' || paymentStatus === 'PROCESSING') && (
                <button
                  onClick={() => {
                    setCheckoutMode('idle');
                    setPaymentStatus('idle');
                  }}
                  className="w-full py-2 text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                >
                  Dismiss / Back to Counter
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: QR PAYMENT SCREEN (Section 23 & 84) */}
      {/* ========================================================================= */}
      {checkoutMode === 'qr' && qrDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center animate-fadeIn">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Scan to Pay with M-Pesa</span>
              <button onClick={() => setCheckoutMode('idle')} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <div className="my-4">
              <img
                src={qrDetails.qrDataUrl}
                alt="Payment QR"
                className="w-48 h-48 mx-auto border border-slate-200 rounded-2xl p-2 shadow-2xs"
              />
              <p className="text-xl font-black text-slate-900 mt-2 font-mono">
                KES {total.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Customer scans with phone camera or M-Pesa app to complete payment.
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              <a
                href={qrDetails.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Customer View</span>
              </a>
              <button
                onClick={() => setCheckoutMode('idle')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: BARCODE SCANNER MODAL */}
      {/* ========================================================================= */}
      {barcodeScanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center animate-fadeIn">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
              <Barcode className="w-7 h-7" />
            </div>

            <h3 className="text-base font-black text-slate-900">Scan Barcode / SKU</h3>
            <p className="text-xs text-slate-500 mt-1">
              Connect a physical handheld scanner or enter barcode digits directly:
            </p>

            <form onSubmit={handleBarcodeModalScan} className="mt-4 space-y-3">
              <input
                ref={barcodeInputRef}
                autoFocus
                type="text"
                placeholder="Scan or type barcode (e.g. 600123456)..."
                value={barcodeInputValue}
                onChange={e => setBarcodeInputValue(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center text-sm font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Add to Cart
                </button>
                <button
                  type="button"
                  onClick={() => setBarcodeScanModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIGITAL RECEIPT MODAL (Issued automatically upon confirmed payment) */}
      {/* ========================================================================= */}
      <ThermalReceiptModal
        receipt={currentReceipt}
        onClose={() => setCurrentReceipt(null)}
      />

    </div>
  );
};
