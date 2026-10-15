import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Boxes,
  Database,
  LogIn,
  LogOut,
  Sparkles,
  AlertTriangle,
  ClipboardList,
  CheckCircle2
} from 'lucide-react';
import { InventoryItem, TeamTask } from '../types';

interface HeaderProps {
  inventory: InventoryItem[];
  tasks: TeamTask[];
  onSeedData: () => void;
  isSeeding: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  inventory,
  tasks,
  onSeedData,
  isSeeding,
}) => {
  const { user, operatorName, signInWithGoogle, signOut } = useAuth();

  const lowStockCount = inventory.filter((i) => i.status !== 'in_stock').length;
  const pendingTasksCount = tasks.filter((t) => t.status !== 'completed').length;
  const unassignedCount = tasks.filter(
    (t) => (!t.assignedToId || t.assignedToId === '') && t.status !== 'completed'
  ).length;

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Boxes className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-white tracking-tight">OmniFlow</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Business ERP
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-medium text-slate-300">Firebase Firestore Live Sync</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <Boxes className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-400">Total SKUs:</span>
              <span className="font-semibold text-white">{inventory.length}</span>
            </div>

            {lowStockCount > 0 ? (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span>Low / Out Stock:</span>
                <span className="font-bold">{lowStockCount}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Stock Healthy</span>
              </div>
            )}

            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <ClipboardList className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-slate-400">Active Tasks:</span>
              <span className="font-semibold text-white">{pendingTasksCount}</span>
              {unassignedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {unassignedCount} unassigned
                </span>
              )}
            </div>
          </div>

          {/* Actions & User State */}
          <div className="flex items-center space-x-3">
            {inventory.length === 0 && (
              <button
                onClick={onSeedData}
                disabled={isSeeding}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isSeeding ? 'Populating...' : 'Seed Sample Business'}</span>
              </button>
            )}

            {inventory.length > 0 && (
              <button
                onClick={onSeedData}
                disabled={isSeeding}
                title="Reset or re-seed enterprise demonstration data"
                className="text-xs text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 bg-slate-800/50 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg flex items-center space-x-1 transition-colors"
              >
                <Database className="h-3 w-3 text-slate-400" />
                <span className="hidden lg:inline">{isSeeding ? 'Seeding...' : 'Reload Demo Data'}</span>
              </button>
            )}

            {/* Operator / Auth */}
            <div className="flex items-center pl-2 border-l border-slate-800 space-x-2">
              {user ? (
                <div className="flex items-center space-x-2">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="h-8 w-8 rounded-full border border-indigo-500/50 object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                      {(user.displayName || 'U')[0]}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-medium text-slate-200 leading-tight">
                      {user.displayName || 'Authorized User'}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-mono">Connected</p>
                  </div>
                  <button
                    onClick={signOut}
                    title="Sign Out"
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="hidden sm:block text-right">
                    <p className="text-xs font-semibold text-slate-200">{operatorName}</p>
                    <p className="text-[10px] text-slate-400">Active Operator</p>
                  </div>
                  <button
                    onClick={signInWithGoogle}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition"
                  >
                    <LogIn className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Sign In</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
