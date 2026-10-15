import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Plus,
  Minus,
  Check,
  Zap,
  ArrowRight
} from 'lucide-react';
import { InventoryItem } from '../types';

interface AdjustStockModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onSubmit: (delta: number, reason: string) => void;
}

const REASON_PRESETS = [
  'Supplier Delivery Restock Received',
  'Customer Order Dispatch & Packing',
  'Production Assembly Line Requisition',
  'Damaged / Defective Stock Write-off',
  'Physical Cycle Count Audit Correction',
];

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  item,
  onClose,
  onSubmit,
}) => {
  if (!item) return null;

  const [mode, setMode] = useState<'increase' | 'decrease'>('increase');
  const [amount, setAmount] = useState<number>(10);
  const [selectedReason, setSelectedReason] = useState<string>(REASON_PRESETS[0]);
  const [customNote, setCustomNote] = useState<string>('');

  const delta = mode === 'increase' ? amount : -amount;
  const simulatedNewQty = Math.max(0, item.quantity + delta);
  const willTriggerLowStock = simulatedNewQty <= item.minThreshold;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    const finalReason = customNote.trim() ? `${selectedReason} - ${customNote.trim()}` : selectedReason;
    onSubmit(delta, finalReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-2 text-indigo-400 mb-1">
          <Zap className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Stock Level Adjustment</span>
        </div>
        <h3 className="text-lg font-bold text-white">{item.name}</h3>
        <p className="text-xs text-slate-400 font-mono mt-0.5">SKU: {item.sku} &bull; Aisle: {item.location}</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Operation Mode Selector: Restock vs Dispatch */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('increase');
                setSelectedReason(REASON_PRESETS[0]);
              }}
              className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-bold transition ${
                mode === 'increase'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Restock / Inbound (+)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('decrease');
                setSelectedReason(REASON_PRESETS[1]);
              }}
              className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-bold transition ${
                mode === 'decrease'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Minus className="h-4 w-4" />
              <span>Dispatch / Outbound (-)</span>
            </button>
          </div>

          {/* Quantity Stepper */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Adjustment Amount ({item.unit})
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="1"
                max={mode === 'decrease' ? item.quantity : 10000}
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
              <div className="flex space-x-1">
                {[1, 5, 25, 100].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setAmount(quick)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                  >
                    {quick}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Outcome Preview Box */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Current Stock:</span>
              <span className="font-mono text-slate-200 font-semibold">{item.quantity} {item.unit}</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-slate-400">
              <span>Simulated Result:</span>
              <span className="font-mono text-white font-bold text-sm">
                {simulatedNewQty} {item.unit}
              </span>
            </div>

            {/* Threshold Warning & Auto-Task Notice */}
            {willTriggerLowStock && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-start space-x-2 text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                <span className="text-[11px] leading-snug">
                  <strong>Automated Trigger Warning:</strong> Stock will drop below safety threshold ({item.minThreshold}). OmniFlow will automatically generate an emergency replenishment task and assign it to an available team member!
                </span>
              </div>
            )}
          </div>

          {/* Reason Presets */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Audit Reason (Required for Compliance)
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {REASON_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Specific Order / Reference Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Purchase order PO-9481 or batch inspection code"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-md transition ${
                mode === 'increase'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
              }`}
            >
              Confirm Adjustment & Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
