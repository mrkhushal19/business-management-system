import React, { useState } from 'react';
import {
  Clock,
  Search,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  UserCheck
} from 'lucide-react';
import { InventoryLog } from '../types';

interface AuditLogViewProps {
  logs: InventoryLog[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'inbound' | 'outbound'>('all');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'inbound' && log.delta > 0) ||
      (typeFilter === 'outbound' && log.delta < 0);

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Clock className="h-5 w-5 text-indigo-400" />
            <span>Immutable Inventory Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Permanent transaction log protected by Firestore security rules. Every stock increment or decrement is recorded.
          </p>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span>Tamper-Resistant Security Rules Active</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by SKU, item name, reason, or operator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              typeFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            All Movements ({logs.length})
          </button>
          <button
            onClick={() => setTypeFilter('inbound')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              typeFilter === 'inbound'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            Inbound (+Restock)
          </button>
          <button
            onClick={() => setTypeFilter('outbound')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              typeFilter === 'outbound'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            Outbound (-Dispatch)
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">SKU & Item</th>
                <th className="py-3 px-4 font-semibold text-center">Delta</th>
                <th className="py-3 px-4 font-semibold">Stock Shift</th>
                <th className="py-3 px-4 font-semibold">Audit Reason & Operational Context</th>
                <th className="py-3 px-4 font-semibold text-right">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLogs.map((log) => {
                const isPositive = log.delta > 0;
                return (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-indigo-300 text-[11px] font-bold">{log.sku}</div>
                      <div className="font-semibold text-white">{log.itemName}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-black ${
                          isPositive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {isPositive ? `+${log.delta}` : log.delta}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <span className="text-slate-500">{log.previousQty}</span> &rarr;{' '}
                      <span className="text-white font-bold">{log.newQty}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-sm">
                      {log.reason}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                        {log.performedBy}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No movement records found matching the query.
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
