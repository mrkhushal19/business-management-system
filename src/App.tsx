/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { CommandCenter } from './components/CommandCenter';
import { InventoryManager } from './components/InventoryManager';
import { TaskManager } from './components/TaskManager';
import { TeamDirectory } from './components/TeamDirectory';
import { AuditLogView } from './components/AuditLogView';
import { AdjustStockModal } from './components/AdjustStockModal';
import { ItemFormModal } from './components/ItemFormModal';
import { TaskFormModal } from './components/TaskFormModal';
import { MemberFormModal } from './components/MemberFormModal';
import {
  subscribeToInventory,
  subscribeToTasks,
  subscribeToTeamMembers,
  subscribeToLogs,
  createOrUpdateInventoryItem,
  deleteInventoryItem,
  adjustStockLevel,
  createTeamTask,
  updateTeamTask,
  deleteTeamTask,
  createOrUpdateTeamMember,
  deleteTeamMember,
  autoAssignAllPendingTasks,
  seedSampleBusinessData,
} from './firebase/services';
import {
  InventoryItem,
  TeamTask,
  TeamMember,
  InventoryLog,
  TaskStatus,
} from './types';
import {
  LayoutDashboard,
  Boxes,
  ClipboardList,
  Users,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Database,
  ArrowRight
} from 'lucide-react';

function AppContent() {
  const { operatorName } = useAuth();

  // Firestore Live States
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'tasks' | 'team' | 'logs'>('dashboard');

  // Operation Modals
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  // Action status
  const [isSeeding, setIsSeeding] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  // Subscribe to real-time collections
  useEffect(() => {
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 3) {
        setIsLoading(false);
      }
    };

    const unsubInventory = subscribeToInventory((items) => {
      setInventory(items);
      checkLoaded();
    });

    const unsubTasks = subscribeToTasks((tList) => {
      setTasks(tList);
      checkLoaded();
    });

    const unsubMembers = subscribeToTeamMembers((mList) => {
      setTeamMembers(mList);
      checkLoaded();
    });

    const unsubLogs = subscribeToLogs((lList) => {
      setLogs(lList);
    });

    return () => {
      unsubInventory();
      unsubTasks();
      unsubMembers();
      unsubLogs();
    };
  }, []);

  // Seed sample data
  const handleSeedData = async () => {
    try {
      setIsSeeding(true);
      await seedSampleBusinessData();
      showToast('Successfully populated Firebase Firestore with realistic business data!');
    } catch (err) {
      console.error(err);
      showToast('Error seeding business data. Check Firebase rules.');
    } finally {
      setIsSeeding(false);
    }
  };

  // Adjust stock level with automated trigger and audit logging
  const handlePerformAdjust = async (delta: number, reason: string) => {
    if (!adjustingItem) return;
    const targetItem = adjustingItem;
    setAdjustingItem(null);

    try {
      const result = await adjustStockLevel(
        targetItem,
        delta,
        reason,
        operatorName,
        teamMembers
      );

      if (result.triggeredTask) {
        showToast(
          `⚡ Auto-Trigger Activated: ${targetItem.sku} dropped below safety limit! Task generated & assigned to ${result.triggeredTask.assignedToName || 'team queue'}.`
        );
      } else {
        showToast(`Stock updated: ${targetItem.name} (${delta > 0 ? '+' : ''}${delta})`);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to adjust stock. Please retry.');
    }
  };

  // Quick inline adjustment (+1 or -1)
  const handleQuickAdjust = async (item: InventoryItem, delta: number) => {
    const reason = delta > 0 ? 'Quick Restock Increment' : 'Quick Order Dispatch Decrement';
    try {
      const result = await adjustStockLevel(item, delta, reason, operatorName, teamMembers);
      if (result.triggeredTask) {
        showToast(
          `⚡ Auto-Trigger Activated: ${item.sku} reached ${result.newQuantity}! Replenishment task dispatched automatically.`
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger quick restock task directly from alert banner
  const handleTriggerQuickRestock = async (item: InventoryItem) => {
    const now = new Date().toISOString();
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Find least loaded member in warehouse/logistics
    const ranked = [...teamMembers].filter((m) => m.status !== 'away').sort((a, b) => {
      const aLoad = a.currentWorkload / Math.max(1, a.maxCapacity);
      const bLoad = b.currentWorkload / Math.max(1, b.maxCapacity);
      return aLoad - bLoad;
    });
    const assignee = ranked[0];

    const emergencyTask: TeamTask = {
      id: taskId,
      title: `Emergency Restock PO: ${item.name} (${item.sku})`,
      description: `Issue purchase requisition for ${item.supplier} to replenish at least ${item.minThreshold * 2} units. Stock is critically depleted at ${item.quantity} ${item.unit}.`,
      priority: 'urgent',
      status: 'pending',
      category: 'Inventory Restock',
      relatedSku: item.sku,
      assignedToId: assignee ? assignee.id : undefined,
      assignedToName: assignee ? assignee.name : 'Unassigned Queue',
      assignedToRole: assignee ? assignee.role : undefined,
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      estimatedHours: 2,
      automationSource: 'Automated Threshold Trigger',
      createdBy: operatorName,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await createTeamTask(emergencyTask);
      showToast(`Emergency restock task created and routed to ${assignee ? assignee.name : 'queue'}!`);
    } catch (err) {
      console.error(err);
    }
  };

  // Auto-Assign all unassigned tasks using Smart Workload Balancer
  const handleAutoAssignPending = async () => {
    try {
      setIsAssigning(true);
      const assigned = await autoAssignAllPendingTasks(tasks, teamMembers);
      if (assigned > 0) {
        showToast(`✨ Successfully auto-assigned ${assigned} operational tasks across the team roster!`);
      } else {
        showToast('All pending tasks are already assigned, or no active team members are available.');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to auto-assign tasks.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Inventory Item Save
  const handleSaveItem = async (item: InventoryItem) => {
    try {
      await createOrUpdateInventoryItem(item, operatorName);
      setIsItemModalOpen(false);
      setEditingItem(null);
      showToast(`Saved SKU ${item.sku} to live inventory!`);
    } catch (err) {
      console.error(err);
      showToast('Error saving inventory item.');
    }
  };

  // Inventory Item Delete
  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this inventory SKU?')) return;
    try {
      await deleteInventoryItem(itemId);
      showToast('Inventory item deleted.');
    } catch (err) {
      console.error(err);
    }
  };

  // Task Save
  const handleSaveTask = async (task: TeamTask) => {
    try {
      await createTeamTask(task);
      showToast(`Task '${task.title}' created and synced.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Task Status Update
  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTeamTask(taskId, { status });
      if (status === 'completed') {
        showToast('🎉 Task marked as resolved!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Task Reassign
  const handleReassignTask = async (taskId: string, memberId: string) => {
    const member = teamMembers.find((m) => m.id === memberId);
    try {
      await updateTeamTask(taskId, {
        assignedToId: memberId || undefined,
        assignedToName: member ? member.name : undefined,
        assignedToRole: member ? member.role : undefined,
      });
      showToast(member ? `Task reassigned to ${member.name}.` : 'Task moved to unassigned queue.');
    } catch (err) {
      console.error(err);
    }
  };

  // Task Delete
  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTeamTask(taskId);
      showToast('Task removed.');
    } catch (err) {
      console.error(err);
    }
  };

  // Team Member Save
  const handleSaveMember = async (member: TeamMember) => {
    try {
      await createOrUpdateTeamMember(member);
      setIsMemberModalOpen(false);
      setEditingMember(null);
      showToast(`Updated member profile for ${member.name}.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Team Member Delete
  const handleDeleteMember = async (memberId: string) => {
    if (!window.confirm('Remove this team member from the dispatch roster?')) return;
    try {
      await deleteTeamMember(memberId);
      showToast('Team member removed.');
    } catch (err) {
      console.error(err);
    }
  };

  interface TabItem {
    id: 'dashboard' | 'inventory' | 'tasks' | 'team' | 'logs';
    label: string;
    count?: number;
    icon: React.ComponentType<{ className?: string }>;
  }

  const tabs: TabItem[] = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory Catalog', count: inventory.length, icon: Boxes },
    { id: 'tasks', label: 'Team Task Pipeline', count: tasks.filter((t) => t.status !== 'completed').length, icon: ClipboardList },
    { id: 'team', label: 'Team & Capacity', count: teamMembers.length, icon: Users },
    { id: 'logs', label: 'Audit Trail', count: logs.length, icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 border border-indigo-500/50 rounded-xl p-4 shadow-2xl shadow-indigo-950/60 flex items-start space-x-3 text-xs animate-slideUp">
          <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-slate-200 font-medium leading-relaxed">{toastMessage}</p>
        </div>
      )}

      {/* Main Header */}
      <Header
        inventory={inventory}
        tasks={tasks}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
      />

      {/* Subnavigation Bar */}
      <nav className="border-b border-slate-800 bg-slate-900/60 sticky top-16 z-30 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-3 overflow-x-auto py-2.5 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-indigo-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main App Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading Spinner */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
            <p className="text-xs text-slate-400 font-medium">
              Connecting to Firebase Firestore Real-Time Stream...
            </p>
          </div>
        ) : inventory.length === 0 && teamMembers.length === 0 ? (
          /* Empty Database Onboarding Banner */
          <div className="py-16 text-center max-w-2xl mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-8 space-y-5">
            <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
              <Database className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Database Connected & Ready</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Your Firestore instance is live with security rules deployed. Would you like to initialize OmniFlow with enterprise demonstration inventory (Electronics, Batteries, Sensors) and team member capacity records?
              </p>
            </div>
            <button
              onClick={handleSeedData}
              disabled={isSeeding}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isSeeding ? 'Provisioning Records...' : 'Seed Enterprise Business Data'}</span>
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <CommandCenter
                inventory={inventory}
                tasks={tasks}
                teamMembers={teamMembers}
                logs={logs}
                onNavigateTab={(tab) => setActiveTab(tab as typeof activeTab)}
                onAutoAssignPending={handleAutoAssignPending}
                onTriggerQuickRestock={handleTriggerQuickRestock}
                isAssigning={isAssigning}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryManager
                inventory={inventory}
                onOpenNewItem={() => {
                  setEditingItem(null);
                  setIsItemModalOpen(true);
                }}
                onOpenEditItem={(item) => {
                  setEditingItem(item);
                  setIsItemModalOpen(true);
                }}
                onDeleteItem={handleDeleteItem}
                onOpenAdjustModal={(item) => setAdjustingItem(item)}
                onQuickAdjust={handleQuickAdjust}
              />
            )}

            {activeTab === 'tasks' && (
              <TaskManager
                tasks={tasks}
                teamMembers={teamMembers}
                onOpenNewTask={() => setIsTaskModalOpen(true)}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onReassignTask={handleReassignTask}
                onDeleteTask={handleDeleteTask}
                onAutoAssignPending={handleAutoAssignPending}
                isAssigning={isAssigning}
              />
            )}

            {activeTab === 'team' && (
              <TeamDirectory
                teamMembers={teamMembers}
                tasks={tasks}
                onOpenNewMember={() => {
                  setEditingMember(null);
                  setIsMemberModalOpen(true);
                }}
                onOpenEditMember={(member) => {
                  setEditingMember(member);
                  setIsMemberModalOpen(true);
                }}
                onDeleteMember={handleDeleteMember}
              />
            )}

            {activeTab === 'logs' && <AuditLogView logs={logs} />}
          </>
        )}
      </main>

      {/* Adjust Stock Level Modal */}
      {adjustingItem && (
        <AdjustStockModal
          item={adjustingItem}
          onClose={() => setAdjustingItem(null)}
          onSubmit={handlePerformAdjust}
        />
      )}

      {/* Add / Edit Inventory Item Modal */}
      <ItemFormModal
        item={editingItem}
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
      />

      {/* Add Task Modal */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        teamMembers={teamMembers}
        inventory={inventory}
        onSave={handleSaveTask}
      />

      {/* Add / Edit Team Member Modal */}
      <MemberFormModal
        member={editingMember}
        isOpen={isMemberModalOpen}
        onClose={() => {
          setIsMemberModalOpen(false);
          setEditingMember(null);
        }}
        onSave={handleSaveMember}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
