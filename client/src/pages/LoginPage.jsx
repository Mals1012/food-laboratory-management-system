import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const demoAccounts = [
    { role: 'Admin', username: 'admin', pass: 'Admin@123', color: 'border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900', desc: 'Full System Control & Audit' },
    { role: 'Lab Manager', username: 'labmanager', pass: 'Manager@123', color: 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900', desc: 'Batch & Test Orchestration' },
    { role: 'Lab Analyst', username: 'analyst', pass: 'Analyst@123', color: 'border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-900', desc: 'Analytical Data Recording' },
    { role: 'Quality Manager', username: 'qualitymgr', pass: 'Quality@123', color: 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900', desc: 'QA Approvals & COA Issue' },
    { role: 'Production Staff', username: 'production', pass: 'Prod@123', color: 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900', desc: 'Batch Registration' },
    { role: 'Viewer', username: 'viewer', pass: 'Viewer@123', color: 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800', desc: 'Read-Only Compliance View' },
  ];

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide your username or email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await login(username, password);
      if (res.success) {
        setSuccessMsg(`Welcome back, ${res.user.fullName}!`);
        setTimeout(() => navigate('/'), 400);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Authentication failed. Please verify your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (acc) => {
    setUsername(acc.username);
    setPassword(acc.pass);
    try {
      setLoading(true);
      setError('');
      const res = await login(acc.username, acc.pass);
      if (res.success) {
        setSuccessMsg(`Logged in as ${acc.role} (${res.user.fullName})`);
        setTimeout(() => navigate('/'), 400);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 relative z-10">
        
        {/* Left Column: Branding & Overview */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 sm:p-10 text-white flex flex-col justify-between relative">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                <FlaskConical className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">FoodLab LIMS</h1>
                <span className="text-xs text-teal-300 font-medium">Enterprise Quality Hub</span>
              </div>
            </div>

            <p className="mt-6 text-sm text-slate-300 leading-relaxed">
              Industrial-grade food laboratory information system for batch control, analytical testing, microbiological tracking, and Certificate of Analysis issuance.
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>ISO/IEC 17025:2017 Testing Laboratory</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Codex Alimentarius & FSSAI Standards</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Immutable 21 CFR Part 11 Audit Trail</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Automated COA Generation & Quarantine</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Version 2026.1 Enterprise</span>
            <span className="text-teal-400 font-mono">RBAC Security</span>
          </div>
        </div>

        {/* Right Column: Login Form & Role Presets */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-slate-50/50">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Authorized Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your credentials to access the laboratory workspace.
            </p>
          </div>

          {/* Error & Success Alerts */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username or Official Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or qualitymgr"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                />
                <span className="text-xs text-slate-600">Remember credentials on this workstation</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-teal-600/20 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Quick Demo Role Access
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  className={`p-2 rounded-xl border text-left transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between ${acc.color}`}
                  title={`Login as ${acc.role} (${acc.desc})`}
                >
                  <span className="font-bold text-xs leading-none truncate">{acc.role}</span>
                  <span className="text-[10px] opacity-75 truncate mt-1">{acc.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Reset Credentials</h3>
            <p className="text-xs text-slate-500 mt-1">
              In accordance with laboratory security policies, enter your registered email to request a secure password reset link from your system administrator.
            </p>

            {forgotSubmitted ? (
              <div className="my-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-2">
                <p className="font-semibold">Reset Request Dispatched</p>
                <p>
                  If an account exists for <strong>{forgotEmail}</strong>, an authorized reset notification has been forwarded to the IT Security Administrator.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (forgotEmail) setForgotSubmitted(true);
                }}
                className="mt-4 space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="analyst@foodlab.lims"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotSubmitted(false);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700"
                  >
                    Submit Reset Request
                  </button>
                </div>
              </form>
            )}

            {forgotSubmitted && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSubmitted(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
