import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, setDoc, doc, query, limit } from 'firebase/firestore';
import { CheckCircle2, ChefHat, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, UtensilsCrossed, User } from 'lucide-react';
import { auth, db } from '../services/firebase';
import { USER_ROLES } from '../utils/constants';
import { menuSeedService } from '../services/menuSeedService';

const STEPS = {
  CHECKING: 'checking',
  FORM: 'form',
  SUCCESS: 'success',
  ALREADY_SET_UP: 'already_setup',
};

const SetupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const forceSetup = new URLSearchParams(location.search).get('force') === 'true';
  const [step, setStep] = useState(STEPS.CHECKING);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkExistingUsers = async () => {
      if (forceSetup) {
        setStep(STEPS.FORM);
        return;
      }
      try {
        const snap = await getDocs(query(collection(db, 'users'), limit(1)));
        if (!snap.empty) {
          setStep(STEPS.ALREADY_SET_UP);
        } else {
          setStep(STEPS.FORM);
        }
      } catch {
        setStep(STEPS.FORM);
      }
    };

    checkExistingUsers();
  }, [forceSetup]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = () => {
    if (!form.name.trim()) return 'Full name is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSubmitting(true);
    setError('');
    try {
      // 1. Create Firebase Auth user
      const { user } = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);

      // 2. Write user doc with admin role
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: form.name.trim(),
        email: user.email,
        role: USER_ROLES.ADMIN,
        createdAt: new Date(),
        isFirstAdmin: true,
      });

      // 3. Seed full menu if not already seeded (while still authenticated)
      const alreadySeeded = await menuSeedService.isAlreadySeeded();
      if (!alreadySeeded) {
        await menuSeedService.seedMenu();
      }

      // 4. Sign out — user should log in properly
      await auth.signOut();

      setStep(STEPS.SUCCESS);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please log in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 8 characters.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Checking ─────────────────────────────────────────────────
  if (step === STEPS.CHECKING) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#7f1d1d] via-[#b91c1c] to-[#f97316]">
        <div className="flex flex-col items-center gap-4 text-white">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="text-sm font-semibold opacity-80">Checking setup status…</p>
        </div>
      </div>
    );
  }

  // ── Already set up ────────────────────────────────────────────
  if (step === STEPS.ALREADY_SET_UP) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#7f1d1d] via-[#b91c1c] to-[#f97316] px-4">
        <div className="login-card w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fef9c3]">
            <ShieldCheck className="h-8 w-8 text-[#dc2626]" />
          </div>
          <h1 className="text-xl font-bold text-[#7a1f1f]">Already set up</h1>
          <p className="mt-2 text-sm text-[#8a5a2b]">
            Admin accounts already exist. Please log in with your credentials.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary mt-6 w-full py-3 text-sm font-bold"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────
  if (step === STEPS.SUCCESS) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#7f1d1d] via-[#b91c1c] to-[#f97316] px-4">
        <div className="login-card w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-[#7a1f1f]">Admin account created!</h1>
          <p className="mt-2 text-sm text-[#8a5a2b]">
            <strong>{form.name}</strong> has been set up as the first admin.
            You can now log in and start managing the system.
          </p>
          <div className="mt-4 rounded-2xl border border-[#fde68a] bg-[#fefce8] px-4 py-3 text-left text-sm">
            <p className="font-semibold text-[#7a1f1f]">Your credentials:</p>
            <p className="mt-1 text-[#a16207]">Email: <span className="font-mono font-bold">{form.email}</span></p>
            <p className="mt-0.5 text-xs text-[#a16207]">Keep your password safe — it was not stored here.</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary mt-6 w-full py-3 text-sm font-bold"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ── Setup form ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#7f1d1d] via-[#b91c1c] to-[#f97316] px-4 py-10">
      <div className="login-card w-full max-w-md">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#dc2626]">
            <ChefHat className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#7a1f1f]">First-time setup</h1>
          <p className="mt-1 text-sm text-[#8a5a2b]">
            Create the first admin account for <strong>TransactEase</strong>.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#fef9c3] px-3 py-1 text-xs font-bold text-[#854d0e]">
            <ShieldCheck className="h-3.5 w-3.5" />
            This screen only appears once
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="login-label mb-1.5 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="login-input"
              placeholder="e.g. Maria Santos"
              autoFocus
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="login-label mb-1.5 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="login-input"
              placeholder="admin@wimpys.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="login-label mb-1.5 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="login-input pr-10"
                placeholder="At least 8 characters"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a16207]"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="login-label mb-1.5 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="login-input pr-10"
                placeholder="Repeat your password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a16207]"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Role info */}
          <div className="rounded-2xl border border-[#fde68a] bg-[#fefce8] px-4 py-3 text-xs text-[#8a5a2b]">
            This account will have <strong className="text-[#7a1f1f]">Admin</strong> access — full dashboard, inventory, reports, and the ability to add staff accounts.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3 text-sm font-bold disabled:opacity-60"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account & seeding menu…
              </span>
            ) : (
              'Create Admin Account'
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-[#8a5a2b]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-bold text-[#dc2626] hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default SetupPage;
