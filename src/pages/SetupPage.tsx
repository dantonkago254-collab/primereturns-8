import { useState } from 'react';
import { ShieldCheck, Mail, Lock, User as UserIcon, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../lib/api';

export const SetupPage = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<{ action: string; user: any } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setResult(null);

    if (name.trim().length < 2) {
      setErrorMessage('Name must be at least 2 characters.');
      return;
    }

    if (password.length < 12) {
      setErrorMessage('Super admin password must be at least 12 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiFetch<{ ok: boolean; action: string; user: any }>(
        '/api/setup/create-super-admin',
        {
          method: 'POST',
          auth: false,
          body: JSON.stringify({ email, name, password }),
        }
      );
      setResult({ action: response.action, user: response.user });
    } catch (error: any) {
      setErrorMessage(error.message || 'Setup failed. Check server logs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tighter">PrimeReturns</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Super Admin Setup</h2>
          <p className="text-slate-400 text-sm mt-2">
            Create or update the super admin account. This endpoint is unauthenticated — secure your deployment after use.
          </p>
        </div>

        {result ? (
          <div className="bg-slate-900 p-8 rounded-[2rem] border border-white/5 space-y-6">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="text-emerald-400 w-6 h-6 shrink-0" />
              <div>
                <p className="font-bold text-emerald-300 capitalize">
                  Super admin {result.action} successfully
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  You can now log in at <a href="/login" className="text-blue-400 underline">/login</a> with the credentials you just set.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-white/5">
                <span className="text-slate-400 text-sm">Name</span>
                <span className="font-bold text-white text-sm">{result.user.name}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-white/5">
                <span className="text-slate-400 text-sm">Email</span>
                <span className="font-bold text-white text-sm">{result.user.email}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-white/5">
                <span className="text-slate-400 text-sm">Role</span>
                <span className="px-2 py-1 bg-violet-500/10 text-violet-400 text-[10px] font-black rounded uppercase">
                  {result.user.role}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="text-amber-400 w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">
                This setup endpoint is unauthenticated. Consider restricting access to <code className="font-mono bg-amber-500/10 px-1 rounded">/setup</code> after bootstrapping your super admin account.
              </p>
            </div>

            <a
              href="/login"
              className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 transition-all flex items-center justify-center gap-2"
            >
              Go to Login <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-900 p-8 rounded-[2rem] border border-white/5 space-y-6">
            {errorMessage && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200">
                {errorMessage}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-violet-500 transition-colors"
                  placeholder="Super Admin Name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-violet-500 transition-colors"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                Password <span className="text-slate-600 normal-case font-normal">(min 12 characters)</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={12}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-violet-500 transition-colors"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={12}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-violet-500 transition-colors"
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? 'Setting up...' : 'Create Super Admin'} <ArrowRight className="w-5 h-5" />
            </button>

            <p className="text-center text-xs text-slate-600">
              If the email already exists, the account's role and password will be updated to super admin.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
