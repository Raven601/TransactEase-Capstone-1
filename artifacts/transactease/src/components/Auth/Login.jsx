import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSending, setResetSending] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (error) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error('Enter your email address first');
      return;
    }
    setResetSending(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      toast.success('Password reset email sent! Check your inbox.');
      setShowReset(false);
      setResetEmail('');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with that email.');
      } else {
        toast.error(error.message || 'Failed to send reset email.');
      }
    } finally {
      setResetSending(false);
    }
  };

  if (showReset) {
    return (
      <div className="login-shell">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">Reset Password</h1>
            <p className="login-subtitle">Enter your email and we'll send a reset link</p>
          </div>

          <form onSubmit={handlePasswordReset} className="login-form">
            <div className="login-field">
              <label className="login-label">Email Address</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="login-input"
                placeholder="Enter your email"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={resetSending}
              className="login-button"
            >
              {resetSending ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-[#8a5a2b]">
            <button
              onClick={() => setShowReset(false)}
              className="font-bold text-[#dc2626] hover:underline"
            >
              ← Back to sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-header">
          <img
            src="/wimpys-logo.png"
            alt="Wimpy's"
            className="mx-auto mb-3 h-16 object-contain"
          />
          <h1 className="login-title">TransactEase</h1>
          <p className="login-subtitle">Wimpy&apos;s Burger &amp; Ice Cream House</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label className="login-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              placeholder="Enter your email"
              autoComplete="username"
              required
            />
          </div>

          <div className="login-field">
            <label className="login-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => { setResetEmail(email); setShowReset(true); }}
              className="mt-1 text-right text-xs font-semibold text-[#dc2626] hover:underline w-full text-right"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-[#8a5a2b]">
          First time here?{' '}
          <Link
            to="/setup"
            className="font-bold text-[#dc2626] hover:underline"
          >
            Create admin account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
