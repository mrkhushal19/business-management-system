import React, { useState } from 'react';
import {
  Boxes,
  Search,
  Filter,
  Plus,
  Minus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  DollarSign,
  MapPin,
  Truck,
  ArrowUpDown
} from 'lucide-react';
import { InventoryItem } from '../types';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onOpenNewItem: () => void;
  onOpenEditItem: (item: InventoryItem) => void;
  onDeleteItem: (itemId: string) => void;
  onOpenAdjustModal: (item: InventoryItem) => void;
  onQuickAdjust: (item: InventoryItem, delta: number) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  inventory,
  onOpenNewItem,
  onOpenEditItem,
  onDeleteItem,
  onOpenAdjustModal,
  onQuickAdjust,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'cost' | 'sku'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Categories list
  const categories = Array.from(new Set(inventory.map((i) => i.category))).filter(Boolean);

  // Filter items
  const filteredItems = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    let comp = 0;
    if (sortBy === 'name') comp = a.name.localeCompare(b.name);
    else if (sortBy === 'sku') comp = a.sku.localeCompare(b.sku);
    else if (sortBy === 'quantity') comp = a.quantity - b.quantity;
    else if (sortBy === 'cost') comp = a.unitCost * a.quantity - b.unitCost * b.quantity;
    return sortOrder === 'asc' ? comp : -comp;
  });

  const toggleSort = (field: 'name' | 'quantity' | 'cost' | 'sku') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Boxes className="h-5 w-5 text-indigo-400" />
            <span>Real-Time Warehouse Inventory Catalog</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tracking {inventory.length} active SKUs with instant Firebase Firestore synchronization and automated threshold alarms.
          </p>
        </div>

        <button
          onClick={onOpenNewItem}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Stock Item</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by SKU, product name, aisle location, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Categories ({inventory.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-400 mr-1 flex items-center space-x-1">
            <Filter className="h-3 w-3" />
            <span>Health:</span>
          </span>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Items ({inventory.length})
          </button>

          <button
            onClick={() => setStatusFilter('in_stock')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              statusFilter === 'in_stock'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            <span>In Stock ({inventory.filter((i) => i.status === 'in_stock').length})</span>
          </button>

          <button
            onClick={() => setStatusFilter('low_stock')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              statusFilter === 'low_stock'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-amber-300'
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Low Stock ({inventory.filter((i) => i.status === 'low_stock').length})</span>
          </button>

          <button
            onClick={() => setStatusFilter('out_of_stock')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              statusFilter === 'out_of_stock'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-rose-300'
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Out of Stock ({inventory.filter((i) => i.status === 'out_of_stock').length})</span>
          </button>
        </div>
      </div>

      {/* Inventory Items Grid / Table View */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th
                  onClick={() => toggleSort('sku')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-200 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>SKU & Name</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th
                  onClick={() => toggleSort('quantity')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-200 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Live Stock & Level</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('cost')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-200 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Unit Cost / Price</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">Location & Supplier</th>
                <th className="py-3 px-4 font-semibold text-center">Quick Adjust</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {sortedItems.map((item) => {
                const stockRatio = item.minThreshold > 0 ? (item.quantity / (item.minThreshold * 2)) * 100 : 100;
                const isCritical = item.quantity <= item.minThreshold;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-800/40 transition ${
                      item.status === 'out_of_stock'
                        ? 'bg-rose-950/10'
                        : item.status === 'low_stock'
                        ? 'bg-amber-950/10'
                        : ''
                    }`}
                  >
                    {/* SKU & Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start space-x-2.5">
                        <div
                          className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${
                            item.status === 'out_of_stock'
                              ? 'bg-rose-500 animate-pulse'
                              : item.status === 'low_stock'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <div>
                          <div className="font-mono text-[11px] font-bold text-indigo-300">
                            {item.sku}
                          </div>
                          <div className="font-semibold text-white text-xs max-w-xs">{item.name}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 border border-slate-700/80 text-slate-300">
                        {item.category}
                      </span>
                    </td>

                    {/* Live Stock Level & Bar */}
                    <td className="py-3.5 px-4 min-w-[170px]">
                      <div className="flex items-baseline space-x-1.5">
                        <span
                          className={`text-sm font-bold ${
                            item.status === 'out_of_stock'
                              ? 'text-rose-400'
                              : item.status === 'low_stock'
                              ? 'text-amber-400'
                              : 'text-white'
                          }`}
                        >
                          {item.quantity}
                        </span>
                        <span className="text-[11px] text-slate-400">{item.unit}</span>
                        <span className="text-[10px] text-slate-500">(Min: {item.minThreshold})</span>
                      </div>

                      {/* Stock Health Progress Bar */}
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            item.status === 'out_of_stock'
                              ? 'bg-rose-500'
                              : item.status === 'low_stock'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, stockRatio))}%` }}
                        ></div>
                      </div>
                    </td>

                    {/* Unit Cost / Price */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="text-slate-200 font-semibold">${item.unitCost.toFixed(2)}</span>
                        <span className="text-slate-500 text-[10px]"> cost</span>
                      </div>
                      <div className="text-[11px] text-emerald-400">
                        ${item.unitPrice.toFixed(2)} retail
                      </div>
                    </td>

                    {/* Location & Supplier */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1 text-slate-300">
                        <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[140px]">{item.location}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-slate-400 text-[10px] mt-0.5">
                        <Truck className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[140px]">{item.supplier}</span>
                      </div>
                    </td>

                    {/* Quick Adjust Buttons */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center space-x-1 bg-slate-950/80 border border-slate-800 rounded-lg p-0.5">
                        <button
                          onClick={() => onQuickAdjust(item, -1)}
                          disabled={item.quantity <= 0}
                          className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 disabled:opacity-30 transition"
                          title="Quick Stock Out -1 unit"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => onOpenAdjustModal(item)}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold text-slate-300 hover:bg-slate-800 transition"
                          title="Custom adjustment with audit reason"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => onQuickAdjust(item, 1)}
                          className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 transition"
                          title="Quick Restock +1 unit"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => onOpenEditItem(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                          title="Edit Item Specs"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                          title="Delete SKU"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {sortedItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No inventory products match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
