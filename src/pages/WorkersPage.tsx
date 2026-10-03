import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Shield,
  UserCheck,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Lock,
  Sparkles,
  AlertCircle,
  ChevronDown,
  Edit2,
  KeyRound,
  Eye,
  EyeOff,
  Activity,
  Receipt,
  Search,
  UserPlus,
  Send,
  Layers,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Clock,
  Briefcase,
  Sliders,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BusinessMember, UserRole } from '../types';

export const WorkersPage: React.FC = () => {
  const { activeBusiness, member, role: currentRole, isOwner, isManager } = useAuth();
  const [workers, setWorkers] = useState<BusinessMember[]>([]);
  const [summary, setSummary] = useState<{
    currentCount: number;
    maxAllowed: number;
    isUnlimited: boolean;
    planName: string;
    limitReached: boolean;
  }>({
    currentCount: 0,
    maxAllowed: 10,
    isUnlimited: false,
    planName: 'Standard',
    limitReached: false,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  // Add Worker Modal States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [notes, setNotes] = useState('');
  const [creationMethod, setCreationMethod] = useState<'invitation' | 'password'>('invitation');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80');

  // Invitation Success Modal
  const [invitationModalData, setInvitationModalData] = useState<{
    name: string;
    email: string;
    role: string;
    token: string;
    invitation_url: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Edit / Permissions Modal States
  const [editWorker, setEditWorker] = useState<BusinessMember | null>(null);
  const [permissionsModalWorker, setPermissionsModalWorker] = useState<BusinessMember | null>(null);
  const [tempPermissions, setTempPermissions] = useState<BusinessMember['permissions']>({
    can_create_sales: true,
    can_apply_discount: true,
    max_discount_percent: 5,
    can_manage_products: false,
    can_manage_inventory: false,
    can_manage_workers: false,
    can_view_reports: false,
    can_configure_mpesa: false,
    can_manage_subscription: false,
    can_issue_refunds: false,
  });

  // Reset Password Modal
  const [resetModalWorker, setResetModalWorker] = useState<BusinessMember | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  // Worker Activity Modal
  const [activityWorker, setActivityWorker] = useState<BusinessMember | null>(null);
  const [activityData, setActivityData] = useState<any>(null);
  const [activityLoading, setActivityLoading] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canManageWorkers = member?.permissions.can_manage_workers || isOwner || isManager;

  useEffect(() => {
    loadData();
  }, [activeBusiness?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workersData, summaryData] = await Promise.all([
        api.workers.getWorkers(),
        api.workers.getSummary(),
      ]);

      setWorkers(workersData || []);
      if (summaryData) {
        setSummary(summaryData as any);
      }
    } catch (err) {
      console.error('Failed to load workers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !email.trim() || !role) {
      setFormError('Please fill in Full Name, Login Email, and select a Role.');
      return;
    }

    try {
      setSubmitting(true);
      const json: any = await api.workers.createWorker({
        fullName: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        employeeId: employeeId.trim() || undefined,
        role,
        password: creationMethod === 'password' ? password : undefined,
      });

      setAddModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setEmployeeId('');
      setNotes('');
      setPassword('123456');

      if (json?.invitation) {
        setInvitationModalData({
          name: json.user_details?.full_name || name,
          email: json.user_details?.email || email,
          role: json.role,
          token: json.invitation.token,
          invitation_url: json.invitation.invitation_url,
        });
      }

      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Error creating worker');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (worker: BusinessMember) => {
    const newStatus = worker.status === 'active' ? 'inactive' : 'active';
    await api.workers.updateWorker(worker.id, { status: newStatus });
    loadData();
  };

  const handleOpenPermissions = (w: BusinessMember) => {
    setPermissionsModalWorker(w);
    setTempPermissions({ ...w.permissions });
  };

  const handleSavePermissions = async () => {
    if (!permissionsModalWorker) return;
    try {
      await api.workers.updateWorker(permissionsModalWorker.id, { permissions: tempPermissions });
      setPermissionsModalWorker(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalWorker) return;
    try {
      const data = await api.workers.resetPassword(resetModalWorker.id, newResetPassword || '123456');
      if (data) {
        setResetSuccessMsg(data.message || 'Password reset successfully!');
        setTimeout(() => {
          setResetSuccessMsg(null);
          setResetModalWorker(null);
          setNewResetPassword('');
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewActivity = async (w: BusinessMember) => {
    setActivityWorker(w);
    setActivityLoading(true);
    try {
      const data = await api.workers.getActivity(w.id);
      if (data) {
        setActivityData(data as any);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActivityLoading(false);
    }
  };

  const filteredWorkers = workers.filter(w => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      (w.user_details?.full_name && w.user_details.full_name.toLowerCase().includes(q)) ||
      (w.user_details?.email && w.user_details.email.toLowerCase().includes(q)) ||
      (w.employee_id && w.employee_id.toLowerCase().includes(q)) ||
      (w.role && w.role.toLowerCase().includes(q));
    const matchRole = roleFilter === 'all' || w.role === roleFilter;
    return matchSearch && matchRole;
  });

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'owner':
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase bg-purple-100 text-purple-800 border border-purple-200">Owner</span>;
      case 'manager':
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-200">Manager</span>;
      case 'cashier':
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">Cashier</span>;
      case 'sales_worker':
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">Sales Worker</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase bg-slate-100 text-slate-700">Staff</span>;
    }
  };

  const getRoleDefaultDiscount = (r: UserRole) => {
    if (r === 'cashier') return 5;
    if (r === 'manager') return 20;
    if (r === 'owner') return 100;
    return 0;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
              Multi-Tenant Worker Accounts & RBAC
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Worker Management & Roles
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage cashiers, managers, and sales reps for <strong className="text-slate-800">{activeBusiness?.name}</strong>. Workers are isolated strictly to this business.
          </p>
        </div>

        {/* Worker Limit Status & Add Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
            <span className="text-slate-500">Worker Capacity: </span>
            <strong className="text-slate-900 font-extrabold">
              {summary.currentCount} / {summary.isUnlimited ? '∞ Unlimited' : `${summary.maxAllowed} Workers`}
            </strong>
            <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">
              Plan: {summary.planName}
            </span>
          </div>

          {canManageWorkers && (
            <button
              onClick={() => setAddModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Worker</span>
            </button>
          )}
        </div>
      </div>

      {/* Subscription Limit Warning Banner if reached */}
      {summary.limitReached && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900 animate-fadeIn">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Worker Limit Reached ({summary.maxAllowed} / {summary.maxAllowed})</p>
              <p className="text-[11px] text-amber-700">Your current BRISK SMART BILLING package ({summary.planName}) has reached its worker capacity.</p>
            </div>
          </div>
          <a
            href="/subscription"
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-colors shrink-0"
          >
            Upgrade Package →
          </a>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by worker name, email, employee ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {(['all', 'cashier', 'manager', 'sales_worker', 'owner'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors capitalize cursor-pointer whitespace-nowrap ${
                roleFilter === r
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {r === 'all' ? 'All Roles' : r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Workers Table (Section 28) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-5">Worker</th>
                <th className="py-3.5 px-4">Employee ID</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Discount Cap</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Loading workers...</span>
                  </td>
                </tr>
              ) : filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold text-slate-700">No workers match your filter</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Add Worker" above to invite your first cashier or manager.</p>
                  </td>
                </tr>
              ) : (
                filteredWorkers.map(w => {
                  const u = w.user_details;
                  return (
                    <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Worker Profile Snapshot */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-300/80">
                            {u?.avatar_url || w.avatar_url ? (
                              <img src={u?.avatar_url || w.avatar_url} alt={u?.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-slate-600 text-xs uppercase bg-blue-100 text-blue-700">
                                {u?.full_name?.slice(0, 2) || 'WK'}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {u?.full_name || 'Staff Member'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {u?.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Employee ID */}
                      <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">
                        {w.employee_id || '—'}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {getRoleBadge(w.role)}
                      </td>

                      {/* Status Toggle Button */}
                      <td className="py-3.5 px-4">
                        {w.role === 'owner' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Active Owner
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(w)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer border ${
                              w.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            }`}
                            title="Click to toggle worker status"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${w.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                            <span className="capitalize">{w.status}</span>
                          </button>
                        )}
                      </td>

                      {/* Discount Cap */}
                      <td className="py-3.5 px-4 text-slate-700 font-semibold font-mono">
                        {w.permissions.can_apply_discount ? `${w.permissions.max_discount_percent}% Max` : 'No Discounts'}
                      </td>

                      {/* Contact Phone */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {u?.phone || '—'}
                      </td>

                      {/* Action Menu buttons */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewActivity(w)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title="View Worker Sales Activity"
                          >
                            <Activity className="w-4 h-4" />
                          </button>

                          {canManageWorkers && w.role !== 'owner' && (
                            <>
                              <button
                                onClick={() => handleOpenPermissions(w)}
                                className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                                title="Custom Permissions"
                              >
                                <Sliders className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  setResetModalWorker(w);
                                  setNewResetPassword('');
                                }}
                                className="p-1.5 hover:bg-amber-50 rounded-lg text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
                                title="Reset Password"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADD WORKER MODAL (Section 2, 3, 4, 5) */}
      {/* ========================================================================= */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Add New Worker</h3>
                  <p className="text-xs text-slate-500">Create a role-scoped account for your business staff</p>
                </div>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddWorker} className="mt-5 space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. John Kamau"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    placeholder="e.g. EMP-001"
                    value={employeeId}
                    onChange={e => setEmployeeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Login Email *</label>
                  <input
                    type="email"
                    placeholder="john.kamau@abcshop.co.ke"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number (M-Pesa)</label>
                  <input
                    type="tel"
                    placeholder="07XXXXXXXX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Predefined Role *</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                  >
                    <option value="cashier">Cashier (POS & Receipts)</option>
                    <option value="sales_worker">Sales Worker (POS & Customers)</option>
                    <option value="manager">Manager (POS, Stock & Reports)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                  >
                    <option value="active">Active (Can log in)</option>
                    <option value="inactive">Inactive (Access paused)</option>
                  </select>
                </div>
              </div>

              {/* Creation Method Option: Invitation vs Temporary Password (Section 2) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Authentication & Onboarding Method
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreationMethod('invitation')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      creationMethod === 'invitation'
                        ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <Send className="w-3.5 h-3.5 text-blue-600" />
                      <span>Send Invitation Link</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-normal">Worker creates own password</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreationMethod('password')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      creationMethod === 'password'
                        ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                      <span>Set Temp Password / PIN</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-normal">Direct PIN for fast counter login</span>
                  </button>
                </div>

                {creationMethod === 'password' && (
                  <div className="pt-2">
                    <label className="block font-bold text-slate-700 mb-1">Temporary Password / PIN *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="At least 6 characters (e.g. 123456)"
                        required
                        className="w-full pl-3.5 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Optional Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Assigned to POS Register 1 (Kimathi St branch)"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? 'Creating Worker...' : creationMethod === 'invitation' ? 'Create & Generate Invitation' : 'Save Worker Account'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INVITATION GENERATED MODAL */}
      {/* ========================================================================= */}
      {invitationModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Worker Invitation Generated</h3>
              <p className="text-xs text-slate-500 mt-1">
                Share this secure onboarding link with <strong className="text-slate-800">{invitationModalData.name}</strong> to let them set their own password.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Recipient: <strong>{invitationModalData.email}</strong></span>
                <span>Role: <strong>{invitationModalData.role}</strong></span>
              </div>

              <div className="p-2 bg-white rounded-xl border border-slate-200 font-mono text-[11px] text-blue-700 break-all select-all">
                {invitationModalData.invitation_url}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(invitationModalData.invitation_url);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied to Clipboard!' : 'Copy Invitation Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => setInvitationModalData(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CUSTOM PERMISSIONS MODAL (Section 30) */}
      {/* ========================================================================= */}
      {permissionsModalWorker && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Custom Permissions</h3>
                <p className="text-xs text-slate-500">Fine-tune capabilities for {permissionsModalWorker.user_details?.full_name}</p>
              </div>
              <button onClick={() => setPermissionsModalWorker(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-80 overflow-y-auto pr-1">
              
              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 block">Create Sales & POS Checkout</span>
                  <span className="text-[11px] text-slate-500">Can access speed register and scan items</span>
                </div>
                <input
                  type="checkbox"
                  checked={tempPermissions.can_create_sales}
                  onChange={e => setTempPermissions({ ...tempPermissions, can_create_sales: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 block">Allow Custom Sales Discounts</span>
                    <span className="text-[11px] text-slate-500">Permit percentage discounts during POS checkout</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={tempPermissions.can_apply_discount}
                    onChange={e => setTempPermissions({ ...tempPermissions, can_apply_discount: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>
                {tempPermissions.can_apply_discount && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-semibold">Maximum Allowed Discount:</span>
                    <div className="flex items-center gap-1 font-mono">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={tempPermissions.max_discount_percent}
                        onChange={e => setTempPermissions({ ...tempPermissions, max_discount_percent: Number(e.target.value) })}
                        className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-center text-xs font-bold"
                      />
                      <span>%</span>
                    </div>
                  </div>
                )}
              </div>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 block">Manage Products & Prices</span>
                  <span className="text-[11px] text-slate-500">Add, edit, or delete items in product catalog</span>
                </div>
                <input
                  type="checkbox"
                  checked={tempPermissions.can_manage_products}
                  onChange={e => setTempPermissions({ ...tempPermissions, can_manage_products: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 block">Adjust Inventory Levels</span>
                  <span className="text-[11px] text-slate-500">Record restocks, wastage, and manual stock counts</span>
                </div>
                <input
                  type="checkbox"
                  checked={tempPermissions.can_manage_inventory}
                  onChange={e => setTempPermissions({ ...tempPermissions, can_manage_inventory: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 block">View Financial Reports</span>
                  <span className="text-[11px] text-slate-500">Access end-of-day journals, margins & CSV exports</span>
                </div>
                <input
                  type="checkbox"
                  checked={tempPermissions.can_view_reports}
                  onChange={e => setTempPermissions({ ...tempPermissions, can_view_reports: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 block">Issue Sales Refunds</span>
                  <span className="text-[11px] text-slate-500">Authorized to reverse transactions</span>
                </div>
                <input
                  type="checkbox"
                  checked={tempPermissions.can_issue_refunds}
                  onChange={e => setTempPermissions({ ...tempPermissions, can_issue_refunds: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPermissionsModalWorker(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESET PASSWORD MODAL */}
      {/* ========================================================================= */}
      {resetModalWorker && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Reset Worker Password</h3>
              <button onClick={() => setResetModalWorker(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                ✕
              </button>
            </div>

            {resetSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{resetSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <p className="text-slate-500">
                Set a new PIN/password for <strong className="text-slate-800">{resetModalWorker.user_details?.full_name}</strong>.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password / PIN</label>
                <input
                  type="text"
                  placeholder="e.g. 123456 or new secure phrase"
                  value={newResetPassword}
                  onChange={e => setNewResetPassword(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetModalWorker(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WORKER ACTIVITY MODAL (Section 31) */}
      {/* ========================================================================= */}
      {activityWorker && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Activity & Audit Log</h3>
                <p className="text-xs text-slate-500">{activityWorker.user_details?.full_name} · {activityWorker.role.toUpperCase()}</p>
              </div>
              <button onClick={() => setActivityWorker(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                ✕
              </button>
            </div>

            {activityLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <span>Loading activity history...</span>
              </div>
            ) : activityData ? (
              <div className="space-y-4 text-xs">
                
                {/* Stats Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Total Sales</span>
                    <p className="text-sm font-black text-slate-900 mt-0.5">KES {activityData.totalSales?.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Transactions</span>
                    <p className="text-sm font-black text-slate-900 mt-0.5">{activityData.salesCount}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Status</span>
                    <p className="text-xs font-bold text-emerald-600 mt-0.5 capitalize">{activityWorker.status}</p>
                  </div>
                </div>

                {/* Audit Entries */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Recent Shift Actions</h4>
                  {activityData.recentAuditLogs?.length === 0 ? (
                    <p className="text-slate-400 italic">No audit logs recorded for this worker yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                      {activityData.recentAuditLogs.map((log: any) => (
                        <div key={log.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                          <div>
                            <span className="font-bold text-slate-800 capitalize">{log.action.replace('_', ' ')}</span>
                            <p className="text-[11px] text-slate-500 mt-0.5">{JSON.stringify(log.metadata)}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : null}

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setActivityWorker(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
