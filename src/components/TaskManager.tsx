import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ClipboardList,
  Sparkles,
  Plus,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Layers,
  Check,
  ChevronRight,
  Trash2,
  Filter
} from 'lucide-react';
import { TeamTask, TeamMember, TaskStatus, TaskPriority } from '../types';

interface TaskManagerProps {
  tasks: TeamTask[];
  teamMembers: TeamMember[];
  onOpenNewTask: () => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onReassignTask: (taskId: string, memberId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAutoAssignPending: () => void;
  isAssigning: boolean;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  teamMembers,
  onOpenNewTask,
  onUpdateTaskStatus,
  onReassignTask,
  onDeleteTask,
  onAutoAssignPending,
  isAssigning,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  const unassignedCount = tasks.filter(
    (t) => (!t.assignedToId || t.assignedToId === '') && t.status !== 'completed'
  ).length;

  const handleStatusChangeWithConfetti = (taskId: string, newStatus: TaskStatus) => {
    onUpdateTaskStatus(taskId, newStatus);
    if (newStatus === 'completed') {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#10b981', '#38bdf8', '#f59e0b'],
      });
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesAssignee =
      assigneeFilter === 'all' ||
      (assigneeFilter === 'unassigned' && (!task.assignedToId || task.assignedToId === '')) ||
      task.assignedToId === assigneeFilter;
    return matchesPriority && matchesAssignee;
  });

  const columns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'pending', label: 'Pending & Triage', color: 'border-amber-500/50' },
    { id: 'in_progress', label: 'In Progress', color: 'border-indigo-500/50' },
    { id: 'review', label: 'Inspection / Review', color: 'border-cyan-500/50' },
    { id: 'completed', label: 'Resolved / Completed', color: 'border-emerald-500/50' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <ClipboardList className="h-5 w-5 text-indigo-400" />
            <span>Automated Team Task Pipeline</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tasks dynamically generated from stock depletion triggers or scheduled operational workflows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {unassignedCount > 0 && (
            <button
              onClick={onAutoAssignPending}
              disabled={isAssigning}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {isAssigning
                  ? 'Calculating Optimal Load...'
                  : `Auto-Assign ${unassignedCount} Open Tasks`}
              </span>
            </button>
          )}

          <button
            onClick={onOpenNewTask}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs shadow-sm transition"
          >
            <Plus className="h-4 w-4 text-indigo-400" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Filter and View Toggle Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Priority filter */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Assignee filter */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400">Assigned To:</span>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">Everyone</option>
              <option value="unassigned">Unassigned ({unassignedCount})</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View toggle */}
        <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1 rounded text-xs font-semibold transition ${
              viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Kanban Board
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded text-xs font-semibold transition ${
              viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            List View
          </button>
        </div>
      </div>

      {/* Kanban Board Mode */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((column) => {
            const columnTasks = filteredTasks.filter((t) => t.status === column.id);

            return (
              <div
                key={column.id}
                className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col space-y-3 min-h-[500px]"
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between pb-2 border-b-2 ${column.color}`}>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {column.label}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      teamMembers={teamMembers}
                      onStatusChange={handleStatusChangeWithConfetti}
                      onReassign={onReassignTask}
                      onDelete={onDeleteTask}
                    />
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="h-32 flex items-center justify-center border border-dashed border-slate-800 rounded-lg text-slate-600 text-xs">
                      No tasks in this lane
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View Mode */
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
          <div className="divide-y divide-slate-800">
            {filteredTasks.map((task) => (
              <div key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/40 transition">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        task.priority === 'urgent'
                          ? 'bg-rose-500/20 text-rose-300'
                          : task.priority === 'high'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {task.priority}
                    </span>
                    <span className="font-semibold text-white text-sm">{task.title}</span>
                    {task.automationSource && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1">
                        <Zap className="h-2.5 w-2.5" />
                        <span>{task.automationSource}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 max-w-xl">{task.description}</p>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
                  <select
                    value={task.assignedToId || ''}
                    onChange={(e) => onReassignTask(task.id, e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300"
                  >
                    <option value="">Unassigned Queue</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>

                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChangeWithConfetti(task.id, e.target.value as TaskStatus)}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-semibold text-slate-200"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                  </select>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {filteredTasks.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-xs">
                No tasks match current filter parameters.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface TaskCardProps {
  task: TeamTask;
  teamMembers: TeamMember[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onReassign: (taskId: string, memberId: string) => void;
  onDelete: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  teamMembers,
  onStatusChange,
  onReassign,
  onDelete,
}) => {
  const isAutoAssigned = !!task.automationSource;

  const nextStatusMap: Record<TaskStatus, TaskStatus | null> = {
    pending: 'in_progress',
    in_progress: 'review',
    review: 'completed',
    completed: null,
  };

  const nextStatus = nextStatusMap[task.status];

  return (
    <div className="bg-slate-950/90 border border-slate-800/90 rounded-lg p-3.5 shadow-sm hover:border-slate-700 transition space-y-2.5">
      {/* Priority & Automation Badge */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
            task.priority === 'urgent'
              ? 'bg-rose-500/20 text-rose-300'
              : task.priority === 'high'
              ? 'bg-amber-500/20 text-amber-300'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {task.priority}
        </span>

        {isAutoAssigned && (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <Zap className="h-2.5 w-2.5 text-indigo-400" />
            <span className="truncate max-w-[110px]">{task.automationSource}</span>
          </span>
        )}
      </div>

      {/* Task Title & Details */}
      <div>
        <h4 className="text-xs font-bold text-white leading-snug">{task.title}</h4>
        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      </div>

      {/* SKU Tag if linked to inventory */}
      {task.relatedSku && (
        <div className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-300">
          Ref: {task.relatedSku}
        </div>
      )}

      {/* Assignee Selection */}
      <div className="pt-2 border-t border-slate-800/70 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500">Assignee:</span>
          {task.dueDate && (
            <span className="text-[10px] text-slate-500 flex items-center space-x-1">
              <Calendar className="h-2.5 w-2.5" />
              <span>Due: {task.dueDate}</span>
            </span>
          )}
        </div>

        <select
          value={task.assignedToId || ''}
          onChange={(e) => onReassign(task.id, e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">(Unassigned Queue)</option>
          {teamMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} &bull; {m.role}
            </option>
          ))}
        </select>
      </div>

      {/* Card Actions Footer */}
      <div className="pt-2 flex items-center justify-between">
        <button
          onClick={() => onDelete(task.id)}
          className="text-slate-500 hover:text-rose-400 p-1 text-[10px] transition"
          title="Delete Task"
        >
          <Trash2 className="h-3 w-3" />
        </button>

        {nextStatus && (
          <button
            onClick={() => onStatusChange(task.id, nextStatus)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold transition"
          >
            <span>Advance to {nextStatus.replace('_', ' ')}</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        )}

        {task.status === 'completed' && (
          <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            <span>Resolved</span>
          </span>
        )}
      </div>
    </div>
  );
};
