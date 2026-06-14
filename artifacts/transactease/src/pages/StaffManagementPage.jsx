import React, { useCallback, useEffect, useState } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut as fbSignOut } from 'firebase/auth';
import { collection, getDocs, setDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import {
  Eye, EyeOff, Loader2, Lock, Mail, Plus, ShieldOff, User, UserCheck, UserPlus, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Common/Layout';
import { db } from '../services/firebase';
import { USER_ROLES } from '../utils/constants';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const createStaffAuthUser = async (email, password) => {
  const tempApp = initializeApp(firebaseConfig, `staff-creator-${Date.now()}`);
  const tempAuth = getAuth(tempApp);
  try {
    const credential = await createUserWithEmailAndPassword(tempAuth, email, password);
    await fbSignOut(tempAuth);
    return credential.user;
  } finally {
    await deleteApp(tempApp);
  }
};

const EMPTY_FORM = { name: '', email: '', password: '', confirmPassword: '' };

const StaffManagementPage = () => {
  const [staff, setStaff]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [showPwd, setShowPwd]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
      setStaff(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      toast.error('Failed to load staff list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  const openModal = () => { setForm(EMPTY_FORM); setFormError(''); setShowModal(true); };
  const closeModal = () => setShowModal(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
  };

  const validate = () => {
    if (!form.name.trim())       return 'Full name is required.';
    if (!form.email.trim())      return 'Email address is required.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setFormError(err); return; }

    setSubmitting(true);
    try {
      const user = await createStaffAuthUser(form.email.trim(), form.password);
      await setDoc(doc(db, 'users', user.uid), {
        uid:       user.uid,
        name:      form.name.trim(),
        email:     user.email,
        role:      USER_ROLES.STAFF,
        isActive:  true,
        createdAt: new Date(),
      });
      toast.success(`Staff account created for ${form.name.trim()}.`);
      closeModal();
      loadStaff();
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setFormError('An account with this email already exists.');
      } else {
        setFormError(err.message || 'Failed to create account.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (member) => {
    const next = !member.isActive;
    try {
      await updateDoc(doc(db, 'users', member.id), { isActive: next });
      toast.success(`${member.name || member.email} ${next ? 'activated' : 'deactivated'}.`);
      setStaff((prev) => prev.map((m) => m.id === member.id ? { ...m, isActive: next } : m));
    } catch {
      toast.error('Failed to update account status.');
    }
  };

  const staffMembers = staff.filter((m) => m.role === USER_ROLES.STAFF);
  const admins       = staff.filter((m) => m.role === USER_ROLES.ADMIN);

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <Layout
      title="Staff Management"
      subtitle="Create and manage cashier and staff accounts."
      actions={
        <button onClick={openModal} className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold">
          <UserPlus className="h-4 w-4" />
          Add Staff
        </button>
      }
    >
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Accounts',    value: staff.length },
          { label: 'Active Staff',      value: staffMembers.filter((m) => m.isActive !== false).length },
          { label: 'Admin Accounts',    value: admins.length },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-1 rounded-2xl border border-[#fde68a] bg-white px-6 py-5 shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#a16207]">{label}</p>
            <p className="mt-1 text-3xl font-extrabold text-[#7a1f1f]">{value}</p>
          </div>
        ))}
      </div>

      {/* Staff accounts table */}
      <div className="section-card overflow-hidden">
        <div className="admin-card-header">
          <div>
            <h2 className="pos-section-title">Staff Accounts</h2>
            <p className="pos-section-copy">{staffMembers.length} cashier / staff account{staffMembers.length !== 1 ? 's' : ''}.</p>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-14 text-[#a16207]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : staffMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <User className="h-12 w-12 text-[#fde68a]" />
            <p className="mt-4 font-semibold text-[#6b241d]">No staff accounts yet</p>
            <p className="mt-1 text-sm text-[#a16207]">Click "Add Staff" to create the first cashier account.</p>
            <button onClick={openModal} className="btn-primary mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold">
              <UserPlus className="h-4 w-4" />
              Add Staff
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.map((member) => {
                  const active = member.isActive !== false;
                  return (
                    <tr key={member.id}>
                      <td className="font-semibold text-[#6b241d]">{member.name || '—'}</td>
                      <td className="text-[#a16207]">{member.email}</td>
                      <td className="text-[#a16207]">{formatDate(member.createdAt)}</td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {active ? <UserCheck className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
                          {active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => toggleActive(member)}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                            active
                              ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin accounts table */}
      <div className="section-card overflow-hidden">
        <div className="admin-card-header">
          <div>
            <h2 className="pos-section-title">Admin Accounts</h2>
            <p className="pos-section-copy">{admins.length} administrator{admins.length !== 1 ? 's' : ''}.</p>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-[#a16207]">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Created</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td className="font-semibold text-[#6b241d]">{admin.name || '—'}</td>
                    <td className="text-[#a16207]">{admin.email}</td>
                    <td className="text-[#a16207]">{formatDate(admin.createdAt)}</td>
                    <td>
                      <span className="inline-flex rounded-full bg-[#fef9c3] px-2.5 py-0.5 text-xs font-bold text-[#7a1f1f]">
                        Admin
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="login-card w-full max-w-md">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#7a1f1f]">Add Staff Account</h3>
                <p className="mt-0.5 text-xs text-[#a16207]">The new account will have Staff / Cashier access.</p>
              </div>
              <button onClick={closeModal} className="rounded-full p-2 text-[#a16207] transition hover:bg-[#fefce8]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="login-label mb-1.5 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="login-input"
                  placeholder="e.g. Juan Dela Cruz"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="login-label mb-1.5 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="login-input"
                  placeholder="staff@wimpys.com"
                  required
                />
              </div>

              <div>
                <label className="login-label mb-1.5 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> Password
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="login-input pr-10"
                    placeholder="At least 8 characters"
                    required
                  />
                  <button type="button" onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a16207]">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="login-label mb-1.5 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="login-input pr-10"
                    placeholder="Repeat password"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a16207]">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal}
                  className="flex-1 btn-secondary py-3 text-sm" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 btn-primary py-3 text-sm font-bold disabled:opacity-60">
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Plus className="h-4 w-4" /> Create Account
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default StaffManagementPage;
