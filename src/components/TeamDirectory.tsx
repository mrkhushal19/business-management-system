import React from 'react';
import {
  Users,
  Plus,
  Mail,
  Shield,
  Briefcase,
  CheckCircle,
  Clock,
  Trash2,
  Edit,
  Tag
} from 'lucide-react';
import { TeamMember, TeamTask } from '../types';

interface TeamDirectoryProps {
  teamMembers: TeamMember[];
  tasks: TeamTask[];
  onOpenNewMember: () => void;
  onOpenEditMember: (member: TeamMember) => void;
  onDeleteMember: (memberId: string) => void;
}

export const TeamDirectory: React.FC<TeamDirectoryProps> = ({
  teamMembers,
  tasks,
  onOpenNewMember,
  onOpenEditMember,
  onDeleteMember,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Users className="h-5 w-5 text-indigo-400" />
            <span>Operations Team & Capacity Roster</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Personnel profiles utilized by the algorithmic task dispatcher for capacity balancing.
          </p>
        </div>

        <button
          onClick={onOpenNewMember}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teamMembers.map((member) => {
          const memberActiveTasks = tasks.filter(
            (t) => t.assignedToId === member.id && t.status !== 'completed'
          );
          const currentLoad = memberActiveTasks.length;
          const capacityUtil = Math.round((currentLoad / Math.max(1, member.maxCapacity)) * 100);

          return (
            <div
              key={member.id}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header: Avatar, Name, Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="h-11 w-11 rounded-full object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300">
                        {member.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-white text-sm">{member.name}</h3>
                      <p className="text-xs text-slate-400 font-medium">{member.role}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      member.status === 'available'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : member.status === 'busy'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {member.status}
                  </span>
                </div>

                {/* Department & Email info */}
                <div className="mt-4 space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                    <span>Dept: <strong className="text-slate-300">{member.department}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                    <span className="font-mono text-[11px] text-slate-400">{member.email}</span>
                  </div>
                </div>

                {/* Capacity Meter */}
                <div className="mt-4 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Capacity Load:</span>
                    <span
                      className={`font-mono font-bold ${
                        capacityUtil >= 90
                          ? 'text-rose-400'
                          : capacityUtil >= 60
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {currentLoad} / {member.maxCapacity} Tasks ({capacityUtil}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        capacityUtil >= 90
                          ? 'bg-rose-500'
                          : capacityUtil >= 60
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(100, capacityUtil)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Skills tags */}
                {member.skills && member.skills.length > 0 && (
                  <div className="mt-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      Skills & Specializations
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {member.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700/60 text-slate-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => onOpenEditMember(member)}
                  className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200"
                >
                  <Edit className="h-3 w-3" />
                  <span>Edit Profile</span>
                </button>

                <button
                  onClick={() => onDeleteMember(member.id)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                  title="Remove Team Member"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {teamMembers.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 text-sm">
            No team members added yet. Click &quot;Add Team Member&quot; or &quot;Seed Sample Business&quot; to begin!
          </div>
        )}
      </div>
    </div>
  );
};
