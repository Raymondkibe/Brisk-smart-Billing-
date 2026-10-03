import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Minus,
  AlertTriangle,
  History,
  RotateCcw,
  CheckCircle2,
  Package
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Product, InventoryMovement } from '../types';

export const InventoryPage: React.FC = () => {
  const { activeBusiness, member } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Stock Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustType, setAdjustType] = useState<'purchase' | 'adjustment' | 'damaged' | 'returned'>('purchase');
  const [quantityDelta, setQuantityDelta] = useState('10');
  const [reason, setReason] = useState('Restock shipment from distributor');

  const canManageInventory = member?.permissions.can_manage_inventory || member?.role === 'owner';

  useEffect(() => {
    loadInventory();
  }, [activeBusiness?.id]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const [prodData, movData] = await Promise.all([
        api.products.getProducts(),
        api.inventory.getMovements(),
      ]);
      setProducts(prodData || []);
      setMovements(movData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !quantityDelta) return;

    try {
      // Determine sign: damaged is negative, restock is positive, returned is positive
      let delta = Number(quantityDelta);
      if (adjustType === 'damaged' && delta > 0) delta = -delta;

      await api.inventory.adjustStock({
        product_id: selectedProductId,
        quantity: delta,
        type: adjustType === 'damaged' ? 'damage' : adjustType === 'returned' ? 'return' : adjustType,
        reason,
      });

      setAdjustModalOpen(false);
      loadInventory();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Inventory & Stock Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track every item movement, sales deduction, and manual restock</p>
        </div>

        {canManageInventory && (
          <button
            onClick={() => {
              setSelectedProductId(products[0]?.id || '');
              setAdjustModalOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Stock Adjustment / Restock</span>
          </button>
        )}
      </div>

      {/* Current Stock Levels Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Current Stock Levels</span>
          <span className="text-xs text-slate-500">{products.length} cataloged products</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4 text-right">In Stock</th>
                <th className="py-3 px-4 text-right">Low Stock Alert</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {products.map(p => {
                const isLow = p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0;
                const isOut = p.stock_quantity <= 0;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.sku}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {p.stock_quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500 tabular-nums">
                      {p.low_stock_threshold}
                    </td>
                    <td className="py-3 px-4">
                      {isOut ? (
                        <span className="text-red-600 font-bold">Out of Stock</span>
                      ) : isLow ? (
                        <span className="text-amber-600 font-bold">Low Stock Warning</span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Optimal</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {canManageInventory && (
                        <button
                          onClick={() => {
                            setSelectedProductId(p.id);
                            setAdjustType('purchase');
                            setQuantityDelta('20');
                            setReason('Direct shelf restock');
                            setAdjustModalOpen(true);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium text-[11px]"
                        >
                          + Restock
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Movements Audit Trail (Section 15) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Stock Movement Audit Trail</span>
          </div>
          <span className="text-[11px] text-slate-400">Shows opening, change, and remaining stock</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4 text-right">Opening</th>
                <th className="py-3 px-4 text-right">Change</th>
                <th className="py-3 px-4 text-right">Remaining</th>
                <th className="py-3 px-4">Reason / Reference</th>
                <th className="py-3 px-4">Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    No movements logged yet. Complete a sale or record an adjustment to see real-time movements.
                  </td>
                </tr>
              ) : (
                movements.map(m => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(m.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{m.product_name}</td>
                      <td className="py-3 px-4">
                        <span className="uppercase text-[10px] font-bold text-slate-600">
                          {m.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                        {m.opening_stock}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                        <span className={isPositive ? 'text-emerald-600' : 'text-red-600'}>
                          {isPositive ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {m.remaining_stock}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {m.reason}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{m.created_by_name || 'Staff'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Record Stock Adjustment</h3>
              <button onClick={() => setAdjustModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Product *</label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current Stock: {p.stock_quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adjustment Type *</label>
                <select
                  value={adjustType}
                  onChange={e => setAdjustType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="purchase">Purchase / Supplier Restock (+)</option>
                  <option value="adjustment">Stock Count Audit Reconciliation</option>
                  <option value="damaged">Damaged / Expired Goods (-)</option>
                  <option value="returned">Customer Return (+)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={quantityDelta}
                  onChange={e => setQuantityDelta(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audit Reason *</label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Received shipment invoice #4829"
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                >
                  Confirm Stock Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
