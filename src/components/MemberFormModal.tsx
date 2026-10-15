import React, { useState, useEffect } from 'react';
import { X, Users, Save } from 'lucide-react';
import { TeamMember, MemberStatus } from '../types';

interface MemberFormModalProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: TeamMember) => void;
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  member,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Warehouse Operator');
  const [department, setDepartment] = useState('Logistics');
  const [maxCapacity, setMaxCapacity] = useState(8);
  const [status, setStatus] = useState<MemberStatus>('available');
  const [skillsString, setSkillsString] = useState('Inventory Restock, Quality Control');

  useEffect(() => {
    if (member) {
      setName(member.name);
      setEmail(member.email);
      setRole(member.role);
      setDepartment(member.department);
      setMaxCapacity(member.maxCapacity);
      setStatus(member.status);
      setSkillsString(member.skills?.join(', ') || '');
    } else {
      setName('');
      setEmail('');
      setRole('Warehouse Specialist');
      setDepartment('Logistics');
      setMaxCapacity(8);
      setStatus('available');
      setSkillsString('Inventory Inbound, Barcode Scanning');
    }
  }, [member, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const skills = skillsString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedMember: TeamMember = {
      id: member?.id || `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role.trim(),
      department: department.trim(),
      maxCapacity: Math.max(1, maxCapacity),
      currentWorkload: member?.currentWorkload || 0,
      status,
      skills,
      avatarUrl: member?.avatarUrl,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedMember);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-2 text-indigo-400 mb-1">
          <Users className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">
            {member ? 'Edit Member Profile' : 'Onboard Operations Member'}
          </span>
        </div>
        <h3 className="text-lg font-bold text-white">
          {member ? `Edit ${member.name}` : 'New Team Member'}
        </h3>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jason Ramirez"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Work Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jason.ramirez@omniflow.io"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Role */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Designation / Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Logistics Lead"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Logistics">Logistics</option>
                <option value="Warehouse Operations">Warehouse Operations</option>
                <option value="Procurement">Procurement</option>
                <option value="Quality & Inspection">Quality & Inspection</option>
                <option value="Order Dispatch">Order Dispatch</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Max Capacity */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Max Task Capacity (Slots)
              </label>
              <input
                type="number"
                min="1"
                max="25"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Availability Status */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Current Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MemberStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="available">Available (Accepts Tasks)</option>
                <option value="busy">Busy (High Load)</option>
                <option value="away">Away / On Leave</option>
              </select>
            </div>
          </div>

          {/* Skills / Specializations */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Skills & Tags (Comma-separated)
            </label>
            <input
              type="text"
              value={skillsString}
              onChange={(e) => setSkillsString(e.target.value)}
              placeholder="e.g. Hazardous Materials, Forklift Certified, ISO Audit"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            />
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
              <span>{member ? 'Save Profile' : 'Add Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
