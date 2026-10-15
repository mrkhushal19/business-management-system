import React, { useState, useEffect } from 'react';
import { X, Boxes, Save } from 'lucide-react';
import { InventoryItem, StockStatus } from '../types';

interface ItemFormModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    sku: '',
    name: '',
    category: 'Electronics',
    quantity: 50,
    minThreshold: 20,
    unit: 'units',
    unitCost: 15,
    unitPrice: 35,
    location: 'Aisle A-01',
    supplier: 'Global Components Corp',
  });

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        name: '',
        category: 'Electronics',
        quantity: 50,
        minThreshold: 20,
        unit: 'units',
        unitCost: 15,
        unitPrice: 35,
        location: 'Aisle A-01',
        supplier: 'Global Components Corp',
      });
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sku || !formData.name) return;

    const qty = Number(formData.quantity) || 0;
    const threshold = Number(formData.minThreshold) || 0;
    const status: StockStatus =
      qty === 0 ? 'out_of_stock' : qty <= threshold ? 'low_stock' : 'in_stock';

    const finalItem: InventoryItem = {
      id: item?.id || `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sku: formData.sku.toUpperCase().trim(),
      name: formData.name.trim(),
      category: formData.category || 'General',
      quantity: Math.max(0, qty),
      minThreshold: Math.max(0, threshold),
      unit: formData.unit || 'units',
      unitCost: Math.max(0, Number(formData.unitCost) || 0),
      unitPrice: Math.max(0, Number(formData.unitPrice) || 0),
      location: formData.location || 'Warehouse Main',
      supplier: formData.supplier || 'Primary Vendor',
      status,
      lastRestockedAt: item?.lastRestockedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(finalItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-2 text-indigo-400 mb-1">
          <Boxes className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">
            {item ? 'Modify Product Specifications' : 'Catalog New Inventory SKU'}
          </span>
        </div>
        <h3 className="text-lg font-bold text-white">
          {item ? `Edit ${item.name}` : 'New Inventory Item'}
        </h3>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SKU */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Stock Keeping Unit (SKU) *
              </label>
              <input
                type="text"
                required
                value={formData.sku || ''}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. SKU-ROBOT-01"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={formData.category || 'Electronics'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Electronics">Electronics</option>
                <option value="Hardware">Hardware & Fasteners</option>
                <option value="Power Systems">Power Systems & Batteries</option>
                <option value="Packaging">Packaging & Crates</option>
                <option value="Raw Materials">Raw Materials</option>
                <option value="Maintenance">Maintenance & Tools</option>
              </select>
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Product Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. 48V Modular Lithium Battery Pack"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Quantities & Units */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Initial Stock Qty *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.quantity ?? 0}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Min Reorder Threshold *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.minThreshold ?? 0}
                onChange={(e) => setFormData({ ...formData, minThreshold: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Measurement Unit
              </label>
              <input
                type="text"
                value={formData.unit || 'units'}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="units, packs, kg, coils"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Pricing & Costs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Unit Cost Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unitCost ?? 0}
                onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Unit Retail Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unitPrice ?? 0}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Location & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Warehouse Location / Bay
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Aisle B-04 / Shelf 3"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Primary Supplier Name
              </label>
              <input
                type="text"
                value={formData.supplier || ''}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="e.g. Apex Industrial Supply"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition"
            >
              <Save className="h-4 w-4" />
              <span>{item ? 'Save Changes' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
