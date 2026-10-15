import React from 'react';
import {
  Boxes,
  DollarSign,
  AlertTriangle,
  Zap,
  Users,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  Layers
} from 'lucide-react';
import { InventoryItem, TeamTask, TeamMember, InventoryLog } from '../types';

interface CommandCenterProps {
  inventory: InventoryItem[];
  tasks: TeamTask[];
  teamMembers: TeamMember[];
  logs: InventoryLog[];
  onNavigateTab: (tabId: string) => void;
  onAutoAssignPending: () => void;
  onTriggerQuickRestock: (item: InventoryItem) => void;
  isAssigning: boolean;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  inventory,
  tasks,
  teamMembers,
  logs,
  onNavigateTab,
  onAutoAssignPending,
  onTriggerQuickRestock,
  isAssigning,
}) => {
  // Financial computations
  const totalValuation = inventory.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
  const totalRetailPotential = inventory.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const totalUnits = inventory.reduce((acc, item) => acc + item.quantity, 0);

  const lowStockItems = inventory.filter((i) => i.status === 'low_stock');
  const outOfStockItems = inventory.filter((i) => i.status === 'out_of_stock');
  const criticalItems = [...outOfStockItems, ...lowStockItems];

  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const unassignedTasks = pendingTasks.filter((t) => !t.assignedToId || t.assignedToId === '');
  const autoTriggeredTasks = tasks.filter((t) => t.automationSource && t.automationSource.includes('Trigger'));

  const totalMaxCapacity = teamMembers.reduce((acc, m) => acc + (m.maxCapacity || 0), 0);
  const totalCurrentWorkload = teamMembers.reduce((acc, m) => acc + (m.currentWorkload || 0), 0);
  const capacityPct = totalMaxCapacity > 0 ? Math.min(100, Math.round((totalCurrentWorkload / totalMaxCapacity) * 100)) : 0;

  // Category summary
  const categoryCounts = inventory.reduce((acc: Record<string, number>, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.quantity;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Hero Welcome & Quick Notice */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 sm:p-8">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
              <Zap className="h-3.5 w-3.5 text-indigo-400" />
              <span>Real-Time Autonomous Operations Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Business Operations Command Center
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
              Monitoring warehouse inventory levels in real-time with automated trigger algorithms that detect stock depletion and balance workloads across available team members.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {unassignedTasks.length > 0 && (
              <button
                onClick={onAutoAssignPending}
                disabled={isAssigning}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>
                  {isAssigning
                    ? 'Balancing Workloads...'
                    : `Auto-Assign ${unassignedTasks.length} Pending Tasks`}
                </span>
              </button>
            )}
            <button
              onClick={() => onNavigateTab('inventory')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition"
            >
              <span>View Inventory</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Inventory Valuation */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inventory Value</span>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white">
              ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
              <span>Retail Value:</span>
              <span className="font-semibold text-slate-300">
                ${totalRetailPotential.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center text-xs text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5 mr-1" />
            <span>{totalUnits.toLocaleString()} total units tracked</span>
          </div>
        </div>

        {/* KPI 2: Stock Health Alert */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock Alerts</span>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${criticalItems.length > 0 ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white">
              {criticalItems.length}{' '}
              <span className="text-xs font-normal text-slate-400">SKUs needing attention</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-rose-400 font-semibold">{outOfStockItems.length} Out of Stock</span>
              <span className="text-amber-400 font-semibold">{lowStockItems.length} Low Stock</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>Healthy catalog ratio:</span>
            <span className="font-semibold text-slate-200">
              {inventory.length > 0 ? `${Math.round(((inventory.length - criticalItems.length) / inventory.length) * 100)}%` : '100%'}
            </span>
          </div>
        </div>

        {/* KPI 3: Automated Assignment Engine */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Auto-Assignment</span>
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white">
              {autoTriggeredTasks.length}{' '}
              <span className="text-xs font-normal text-slate-400">auto-created</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
              <span>Unassigned in queue:</span>
              <span className={`font-bold ${unassignedTasks.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {unassignedTasks.length} tasks
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center text-xs text-indigo-400">
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            <span>Algorithmic workload balancing active</span>
          </div>
        </div>

        {/* KPI 4: Team Capacity Utilization */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Team Capacity</span>
            <div className="h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white">
              {capacityPct}%{' '}
              <span className="text-xs font-normal text-slate-400">utilized</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  capacityPct > 85 ? 'bg-rose-500' : capacityPct > 60 ? 'bg-amber-500' : 'bg-cyan-500'
                }`}
                style={{ width: `${capacityPct}%` }}
              ></div>
            </div>
          </div>
          <div className="mt-3 pt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Staff Count:</span>
            <span className="font-semibold text-slate-200">{teamMembers.length} active operators</span>
          </div>
        </div>
      </div>

      {/* Critical Stock Alert Banner (If items need reorder) */}
      {criticalItems.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-200">
                  Critical Inventory Reorder Trigger Active
                </h3>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  The following items have dropped below safety thresholds. The automated system can assign replenishment workflows immediately.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs font-semibold text-amber-300 hover:text-amber-200 underline shrink-0"
            >
              Manage all {criticalItems.length} items &rarr;
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {criticalItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[11px] text-slate-400">{item.sku}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.status === 'out_of_stock'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {item.status === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white truncate max-w-[180px] mt-1">{item.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Qty: <strong className="text-amber-400">{item.quantity}</strong> / Min: {item.minThreshold} {item.unit}
                  </p>
                </div>
                <button
                  onClick={() => onTriggerQuickRestock(item)}
                  className="px-2.5 py-1.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition"
                  title="Generate automated replenishment task for this SKU"
                >
                  Auto-Task
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout: Team Capacity Grid & Real-time Live Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Team Capacity Breakdown */}
        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Team Load Balancer</h2>
            </div>
            <button
              onClick={() => onNavigateTab('team')}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              View Directory &rarr;
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Workload distribution currently utilized by automated algorithm for task delegation:
          </p>

          <div className="space-y-3">
            {teamMembers.map((member) => {
              const utilPct = Math.round(((member.currentWorkload || 0) / Math.max(1, member.maxCapacity)) * 100);
              return (
                <div key={member.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-200">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200 leading-none">{member.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{member.role}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        utilPct >= 90
                          ? 'bg-rose-500/20 text-rose-300'
                          : utilPct >= 60
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {member.currentWorkload || 0}/{member.maxCapacity} Tasks
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        utilPct >= 90 ? 'bg-rose-500' : utilPct >= 60 ? 'bg-amber-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${Math.min(100, utilPct)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Real-Time Audit Log & Recent Movement */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Live Stock Movements & Audit Log</h2>
            </div>
            <button
              onClick={() => onNavigateTab('logs')}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Full Audit Trail &rarr;
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Immutable transaction records written automatically whenever stock changes occur:
          </p>

          <div className="divide-y divide-slate-800">
            {logs.slice(0, 6).map((log) => {
              const isPositive = log.delta > 0;
              return (
                <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 min-w-0">
                    <span
                      className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        isPositive
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {isPositive ? `+${log.delta}` : log.delta}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">
                        {log.itemName} <span className="text-slate-500 font-mono">({log.sku})</span>
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        Reason: {log.reason} &bull; By: {log.performedBy}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-mono text-slate-400">
                      {log.previousQty} &rarr; <strong className="text-slate-200">{log.newQty}</strong>
                    </span>
                    <p className="text-[10px] text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}

            {logs.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-500">
                No inventory adjustment logs recorded yet. Adjust stock to generate logs!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
