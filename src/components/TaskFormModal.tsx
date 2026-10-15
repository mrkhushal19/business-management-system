import React, { useState } from 'react';
import { X, ClipboardList, Plus, Sparkles } from 'lucide-react';
import { TeamTask, TeamMember, InventoryItem, TaskPriority } from '../types';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  inventory: InventoryItem[];
  onSave: (task: TeamTask) => void;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  teamMembers,
  inventory,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState('Inventory Restock');
  const [relatedSku, setRelatedSku] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [estimatedHours, setEstimatedHours] = useState(3);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignedMember = teamMembers.find((m) => m.id === assignedToId);

    const newTask: TeamTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      description: description.trim(),
      priority,
      status: 'pending',
      category,
      relatedSku: relatedSku || undefined,
      assignedToId: assignedToId || undefined,
      assignedToName: assignedMember ? assignedMember.name : undefined,
      assignedToRole: assignedMember ? assignedMember.role : undefined,
      dueDate,
      estimatedHours,
      automationSource: assignedToId ? 'Manual Assignment' : undefined,
      createdBy: 'Operations Dispatch',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-2 text-indigo-400 mb-1">
          <ClipboardList className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">New Task Dispatch</span>
        </div>
        <h3 className="text-lg font-bold text-white">Create Operational Task</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Leave assignee empty to let the Automated Engine assign based on workload capacity.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Conduct ISO cycle audit for Warehouse Bay B"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description & Protocol
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, required tools, delivery instructions, or supplier notes..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="urgent">Urgent (Immediate)</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Inventory Restock">Inventory Restock</option>
                <option value="Warehouse Maintenance">Warehouse Maintenance</option>
                <option value="Quality & Inspection">Quality & Inspection</option>
                <option value="Order Dispatch">Order Dispatch</option>
                <option value="Supplier Follow-up">Supplier Follow-up</option>
                <option value="Safety Compliance">Safety Compliance</option>
              </select>
            </div>
          </div>

          {/* Linked SKU */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Link to Inventory Product (Optional)
            </label>
            <select
              value={relatedSku}
              onChange={(e) => setRelatedSku(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">None (General Operational Task)</option>
              {inventory.map((inv) => (
                <option key={inv.id} value={inv.sku}>
                  {inv.sku} - {inv.name} (Stock: {inv.quantity} {inv.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                Assigned Team Member
              </label>
              <span className="text-[10px] text-indigo-400 flex items-center space-x-1">
                <Sparkles className="h-2.5 w-2.5" />
                <span>Auto-balance available</span>
              </span>
            </div>
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Leave Unassigned (Queue for Auto-Assignment)</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} &bull; {member.role} ({member.currentWorkload || 0}/{member.maxCapacity} load)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Due Date */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Target Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Estimated Hours */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Estimated Duration (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="40"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
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
              <Plus className="h-4 w-4" />
              <span>Create Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
