import { 
  ShieldAlert, 
  Activity, 
  Users, 
  ArrowUpCircle, 
  Database,
  CheckCircle,
  XCircle,
  Terminal,
  UserCog,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatKSH, cn } from '../lib/utils';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

export const AdminPanel = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [activeAdminTab, setActiveAdminTab] = useState('users');
  const [metrics, setMetrics] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [cronLogs, setCronLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState<Record<string, string>>({});

  const loadAdmin = async () => {
    setLoading(true);
    const errors: Record<string, string> = {};

    console.log('[AdminPanel] Starting data load...');

    try {
      const metricsRes = await apiFetch<{ metrics: any }>('/api/admin/metrics');
      console.log('[AdminPanel] /api/admin/metrics OK', metricsRes);
      setMetrics(metricsRes.metrics ?? null);
    } catch (err) {
      const msg = (err as Error).message || 'Unknown error';
      console.error('[AdminPanel] /api/admin/metrics FAILED:', msg);
      errors.metrics = msg;
    }

    try {
      const activityRes = await apiFetch<{ logs: any[]; payments: any[] }>('/api/admin/activity');
      console.log('[AdminPanel] /api/admin/activity OK', activityRes);
      setActivity(activityRes.logs ?? []);
      setPayments(activityRes.payments ?? []);
    } catch (err) {
      const msg = (err as Error).message || 'Unknown error';
      console.error('[AdminPanel] /api/admin/activity FAILED:', msg);
      errors.activity = msg;
    }

    try {
      const withdrawalRes = await apiFetch<{ withdrawals: any[] }>('/api/admin/withdrawals');
      console.log('[AdminPanel] /api/admin/withdrawals OK', withdrawalRes);
      setWithdrawals(withdrawalRes.withdrawals ?? []);
    } catch (err) {
      const msg = (err as Error).message || 'Unknown error';
      console.error('[AdminPanel] /api/admin/withdrawals FAILED:', msg);
      errors.withdrawals = msg;
    }

    try {
      const usersRes = await apiFetch<{ users: any[] }>('/api/admin/users');
      console.log('[AdminPanel] /api/admin/users OK — count:', usersRes.users?.length ?? 0, usersRes);
      setUsersData(usersRes.users ?? []);
    } catch (err) {
      const msg = (err as Error).message || 'Unknown error';
      console.error('[AdminPanel] /api/admin/users FAILED:', msg);
      errors.users = msg;
    }

    try {
      const cronRes = await apiFetch<{ logs: any[] }>('/api/admin/cron-logs');
      console.log('[AdminPanel] /api/admin/cron-logs OK', cronRes);
      setCronLogs(cronRes.logs ?? []);
    } catch (err) {
      const msg = (err as Error).message || 'Unknown error';
      console.error('[AdminPanel] /api/admin/cron-logs FAILED:', msg);
      errors.cronLogs = msg;
    }

    console.log('[AdminPanel] Data load complete. Errors:', errors);
    setLoadErrors(errors);
    setLoading(false);
  };

  useEffect(() => {
    loadAdmin();
  }, []);

  const reloadAdmin = async () => {
    await loadAdmin();
  };

  const approveWithdrawal = async (id: number) => {
    await apiFetch(`/api/admin/withdrawals/${id}/approve`, { method: 'POST', body: JSON.stringify({}) });
    await reloadAdmin();
  };

  const failWithdrawal = async (id: number) => {
    const reason = window.prompt('Reason for rejecting this withdrawal:', 'Rejected by admin');
    if (!reason) return;
    await apiFetch(`/api/admin/withdrawals/${id}/fail`, { method: 'POST', body: JSON.stringify({ reason }) });
    await reloadAdmin();
  };

  const adjustUserBalance = async (targetUser: any) => {
    const mode = window.prompt('Type balance action: set, add, or subtract', 'add')?.trim().toLowerCase();
    if (!mode) return;
    if (!['set', 'add', 'subtract'].includes(mode)) {
      alert('Invalid action. Use set, add, or subtract.');
      return;
    }

    const amount = window.prompt(`Amount in KSh to ${mode} for ${targetUser.email}:`, '1000');
    if (!amount) return;

    const reason = window.prompt('Reason for this manual balance adjustment:', 'Support-approved manual adjustment');
    if (!reason) return;

    try {
      await apiFetch(`/api/super-admin/users/${targetUser.id}/balance`, {
        method: 'POST',
        body: JSON.stringify({ mode, amount, reason }),
      });
      await reloadAdmin();
      alert('Balance adjustment saved and audited.');
    } catch (error) {
      alert((error as Error).message || 'Balance adjustment failed.');
    }
  };

  const adjustUserInvested = async (targetUser: any) => {
    const mode = window.prompt('Type action: set, add, or subtract', 'add')?.trim().toLowerCase();
    if (!mode) return;
    if (!['set', 'add', 'subtract'].includes(mode)) {
      alert('Invalid action. Use set, add, or subtract.');
      return;
    }

    const amount = window.prompt(`Amount in KSh to ${mode} for ${targetUser.email}'s Total Invested:`, '1000');
    if (!amount) return;

    const reason = window.prompt('Reason for this adjustment:', 'Admin correction');
    if (!reason) return;

    try {
      await apiFetch(`/api/super-admin/users/${targetUser.id}/invested`, {
        method: 'POST',
        body: JSON.stringify({ mode, amount, reason }),
      });
      await reloadAdmin();
      alert('Total Invested adjustment saved and audited.');
    } catch (error) {
      alert((error as Error).message || 'Adjustment failed.');
    }
  };

  const adjustUserProfit = async (targetUser: any) => {
    const mode = window.prompt('Type action: set, add, or subtract', 'add')?.trim().toLowerCase();
    if (!mode) return;
    if (!['set', 'add', 'subtract'].includes(mode)) {
      alert('Invalid action. Use set, add, or subtract.');
      return;
    }

    const amount = window.prompt(`Amount in KSh to ${mode} for ${targetUser.email}'s Total Profit:`, '1000');
    if (!amount) return;

    const reason = window.prompt('Reason for this adjustment:', 'Admin correction');
    if (!reason) return;

    try {
      await apiFetch(`/api/super-admin/users/${targetUser.id}/profit`, {
        method: 'POST',
        body: JSON.stringify({ mode, amount, reason }),
      });
      await reloadAdmin();
      alert('Total Profit adjustment saved and audited.');
    } catch (error) {
      alert((error as Error).message || 'Adjustment failed.');
    }
  };

  const adjustUserReferralEarnings = async (targetUser: any) => {
    const mode = window.prompt('Type action: set, add, or subtract', 'add')?.trim().toLowerCase();
    if (!mode) return;
    if (!['set', 'add', 'subtract'].includes(mode)) {
      alert('Invalid action. Use set, add, or subtract.');
      return;
    }

    const amount = window.prompt(`Amount in KSh to ${mode} for ${targetUser.email}'s Referral Earnings:`, '1000');
    if (!amount) return;

    const reason = window.prompt('Reason for this adjustment:', 'Admin correction');
    if (!reason) return;

    try {
      await apiFetch(`/api/super-admin/users/${targetUser.id}/referral-earnings`, {
        method: 'POST',
        body: JSON.stringify({ mode, amount, reason }),
      });
      await reloadAdmin();
      alert('Referral Earnings adjustment saved and audited.');
    } catch (error) {
      alert((error as Error).message || 'Adjustment failed.');
    }
  };

  const adjustOwnBalance = async () => {
    const mode = window.prompt('Type balance action: set, add, or subtract', 'add')?.trim().toLowerCase();
    if (!mode) return;
    if (!['set', 'add', 'subtract'].includes(mode)) {
      alert('Invalid action. Use set, add, or subtract.');
      return;
    }

    const amount = window.prompt(`Amount in KSh to ${mode} on your own account:`, '1000');
    if (!amount) return;

    const reason = window.prompt('Reason for this self balance adjustment:', 'Super admin self-adjustment');
    if (!reason) return;

    try {
      await apiFetch('/api/super-admin/me/balance', {
        method: 'POST',
        body: JSON.stringify({ mode, amount, reason }),
      });
      await reloadAdmin();
      alert('Your balance has been adjusted and audited.');
    } catch (error) {
      alert((error as Error).message || 'Balance adjustment failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Admin Header */}
      <div className="border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-rose-500/20 p-2 rounded-lg">
              <ShieldAlert className="text-rose-500 w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">PrimeReturns Admin</h1>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">System Architect Mode</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={reloadAdmin}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 transition-all disabled:opacity-50"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              {loading ? 'Loading…' : 'Refresh'}
            </button>
            <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-white/5">
              {[
                { id: 'health', icon: Activity, label: 'Health' },
                { id: 'payouts', icon: ArrowUpCircle, label: 'Payouts' },
                { id: 'cron', icon: Terminal, label: 'Cron Logs' },
                { id: 'activity', icon: Activity, label: 'Activity' },
                { id: 'users', icon: Users, label: 'Users' },
                ...(currentUser?.role === 'super_admin' ? [{ id: 'my-account', icon: UserCog, label: 'My Account' }] : []),
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveAdminTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                    activeAdminTab === tab.id ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6">
        {/* Global load-error banner */}
        {Object.keys(loadErrors).length > 0 && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="text-rose-400 w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-rose-300 mb-1">Some data failed to load</p>
              {Object.entries(loadErrors).map(([key, msg]) => (
                <p key={key} className="text-xs text-rose-400 font-mono">{key}: {msg}</p>
              ))}
            </div>
          </div>
        )}

        {/* Global loading skeleton */}
        {loading && (
          <div className="flex items-center justify-center py-24 gap-3 text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm font-bold">Loading admin data…</span>
          </div>
        )}

        {!loading && activeAdminTab === 'health' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 bg-slate-900 border border-white/5 rounded-3xl">
              <div className="flex justify-between items-center mb-6">
                <Database className="text-blue-500" />
                <span className="text-emerald-500 text-xs font-black uppercase">Online</span>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase mb-1">Database Cluster</p>
              <h3 className="text-2xl font-bold">MySQL 8.0 Enterprise</h3>
              <p className="text-slate-500 text-xs mt-4">Users: {metrics?.totalUsers ?? 0} | Active investments: {metrics?.activeInvestments ?? 0}</p>
            </div>

            <div className="p-8 bg-slate-900 border border-white/5 rounded-3xl">
              <div className="flex justify-between items-center mb-6">
                <Activity className="text-emerald-500" />
                <span className="text-emerald-500 text-xs font-black uppercase">Active</span>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase mb-1">Paystack Gateway</p>
              <h3 className="text-2xl font-bold">{metrics?.successfulPayments24h ?? 0} paid today</h3>
              <p className="text-slate-500 text-xs mt-4">Attempts 24h: {metrics?.paymentAttempts24h ?? 0} | Paid in: {formatKSH(metrics?.paidIn ?? 0)}</p>
            </div>

            <div className="p-8 bg-slate-900 border border-white/5 rounded-3xl">
              <div className="flex justify-between items-center mb-6">
                <Users className="text-violet-500" />
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase mb-1">Active Sessions</p>
              <h3 className="text-2xl font-bold">{metrics?.activeUsers24h ?? 0} Users</h3>
              <p className="text-slate-500 text-xs mt-4">Logins 24h: {metrics?.logins24h ?? 0} | New users: {metrics?.newUsers24h ?? 0}</p>
            </div>

            <div className="p-8 bg-slate-900 border border-white/5 rounded-3xl md:col-span-3">
              <p className="text-slate-500 text-xs font-bold uppercase mb-4">Financial Overview</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div><p className="text-slate-500 text-xs">Total invested</p><h3 className="text-xl font-black">{formatKSH(metrics?.totalInvested ?? 0)}</h3></div>
                <div><p className="text-slate-500 text-xs">Balances owed</p><h3 className="text-xl font-black">{formatKSH(metrics?.totalBalances ?? 0)}</h3></div>
                <div><p className="text-slate-500 text-xs">Referral earnings</p><h3 className="text-xl font-black">{formatKSH(metrics?.totalReferralEarnings ?? 0)}</h3></div>
                <div><p className="text-slate-500 text-xs">Pending withdrawals</p><h3 className="text-xl font-black">{metrics?.pendingWithdrawals ?? 0}</h3></div>
              </div>
            </div>
          </div>
        )}

        {!loading && activeAdminTab === 'payouts' && (
          <div className="bg-slate-900 border border-white/5 rounded-[2rem] overflow-hidden">
            <div className="p-8 border-b border-white/5">
              <h3 className="text-xl font-bold">Pending M-Pesa Disbursements</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-950/50">
                  <tr className="text-slate-500 text-[10px] uppercase tracking-widest">
                    <th className="px-8 py-4">User Details</th>
                    <th className="px-8 py-4">Phone Number</th>
                    <th className="px-8 py-4">Requested Amount</th>
                    <th className="px-8 py-4">Ref Status</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {withdrawals.map((payout, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="px-8 py-6">
                        <p className="font-bold">{payout.name}</p>
                        <p className="text-xs text-slate-500">{payout.email}</p>
                      </td>
                      <td className="px-8 py-6 font-mono text-sm">{payout.phone_number || 'Not provided'}</td>
                      <td className="px-8 py-6 font-black text-emerald-500">{formatKSH(payout.amount)}</td>
                      <td className="px-8 py-6">
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded uppercase">
                          {payout.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => approveWithdrawal(payout.id)} className="p-2 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-colors border border-emerald-500/20">
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button onClick={() => failWithdrawal(payout.id)} className="p-2 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors border border-rose-500/20">
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {withdrawals.length === 0 && (
                    <tr><td colSpan={5} className="px-8 py-10 text-center text-slate-500">No pending payout records yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && activeAdminTab === 'cron' && (
          <div className="bg-slate-900 border border-white/5 rounded-[2rem] p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <Terminal className="text-blue-500" />
                Automated Return Engine Logs
              </h3>
              <button className="text-xs bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/10 transition-colors">
                Force Trigger UTC Midnight
              </button>
            </div>
            <div className="space-y-4 font-mono text-xs">
              {cronLogs.map((log) => (
                <div key={log.id} className="flex gap-4 p-3 bg-slate-950/50 rounded-lg border border-white/5">
                  <span className="text-slate-500">[{new Date(log.createdAt).toLocaleString()}]</span>
                  <span className="text-emerald-500">RUN {log.runDate}: {log.investmentCount} investments credited {formatKSH(log.totalCredited)}</span>
                </div>
              ))}
              {cronLogs.length === 0 && <div className="p-8 text-center text-slate-500">No cron runs recorded yet.</div>}
            </div>
          </div>
        )}

        {!loading && activeAdminTab === 'activity' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-white/5 rounded-[2rem] overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h3 className="font-bold">Login and System Activity</h3>
                <p className="text-xs text-slate-500">Recent auth, gateway, withdrawal, and admin events.</p>
              </div>
              <div className="divide-y divide-white/5 max-h-[560px] overflow-auto">
                {activity.map((log) => (
                  <div key={log.id} className="p-4 flex justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold">{log.action}</p>
                      <p className="text-xs text-slate-500">{log.email || 'System'} | {log.ip_address || 'No IP'}</p>
                    </div>
                    <p className="text-xs text-slate-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                ))}
                {activity.length === 0 && <div className="p-8 text-center text-slate-500">No activity logs yet.</div>}
              </div>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-[2rem] overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h3 className="font-bold">Payment Ledger</h3>
                <p className="text-xs text-slate-500">Deposits, withdrawals, and referral commission records.</p>
              </div>
              <div className="divide-y divide-white/5 max-h-[560px] overflow-auto">
                {payments.map((payment) => (
                  <div key={payment.id} className="p-4 flex justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold">{payment.type} | {payment.status}</p>
                      <p className="text-xs text-slate-500">{payment.email} | {payment.reference || payment.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-500">{formatKSH(payment.amount)}</p>
                      <p className="text-xs text-slate-500">{new Date(payment.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && <div className="p-8 text-center text-slate-500">No payment records yet.</div>}
              </div>
            </div>
          </div>
        )}

        {!loading && activeAdminTab === 'users' && (
          <div className="bg-slate-900 border border-white/5 rounded-[2rem] overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-bold">Registered Users</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {usersData.length > 0
                    ? `${usersData.length} user${usersData.length !== 1 ? 's' : ''} — balances, deposits, investments, and last login`
                    : 'Users, balances, deposits, investments, and last login records.'}
                </p>
              </div>
              {loadErrors.users && (
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  Failed to load: {loadErrors.users}
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-950/50 text-slate-500 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Balance</th>
                    <th className="px-6 py-4">Invested</th>
                    <th className="px-6 py-4">Deposits</th>
                    <th className="px-6 py-4">Last Login</th>
                    {currentUser?.role === 'super_admin' && (
                      <th className="px-6 py-4 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {usersData.length > 0 ? (
                    usersData.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                          <p className="text-[10px] text-slate-600 font-mono">REF: {user.referralCode}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-1 rounded text-[10px] font-black uppercase",
                            user.role === 'super_admin' && "bg-violet-500/10 text-violet-400",
                            user.role === 'admin' && "bg-amber-500/10 text-amber-400",
                            user.role === 'user' && "bg-slate-700/50 text-slate-400",
                          )}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-black text-emerald-500">{formatKSH(user.accountBalance ?? 0)}</td>
                        <td className="px-6 py-4 font-bold">{formatKSH(user.totalInvested ?? 0)}</td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {user.completedDepositCount ?? 0} paid / {user.investmentCount ?? 0} nodes
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                        </td>
                        {currentUser?.role === 'super_admin' && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                onClick={() => adjustUserBalance(user)}
                                className="px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-black hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
                              >
                                Adjust Balance
                              </button>
                              <button
                                onClick={() => adjustUserInvested(user)}
                                className="px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-black hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
                              >
                                Edit Invested
                              </button>
                              <button
                                onClick={() => adjustUserProfit(user)}
                                className="px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-black hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                              >
                                Edit Profit
                              </button>
                              <button
                                onClick={() => adjustUserReferralEarnings(user)}
                                className="px-3 py-2 rounded-lg bg-violet-500/10 text-violet-400 text-xs font-black hover:bg-violet-500/20 border border-violet-500/20 transition-colors"
                              >
                                Edit Ref Earnings
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={currentUser?.role === 'super_admin' ? 7 : 6}
                        className="px-6 py-16 text-center"
                      >
                        {loadErrors.users ? (
                          <div className="flex flex-col items-center gap-3 text-rose-400">
                            <AlertTriangle className="w-8 h-8 opacity-50" />
                            <p className="font-bold">Failed to load users</p>
                            <p className="text-xs text-slate-500">{loadErrors.users}</p>
                            <button
                              onClick={reloadAdmin}
                              className="mt-2 px-4 py-2 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-bold hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                            >
                              Retry
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-500">
                            <Users className="w-8 h-8 opacity-30" />
                            <p className="font-bold">No registered users yet</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && activeAdminTab === 'my-account' && currentUser?.role === 'super_admin' && (
          <div className="bg-slate-900 border border-white/5 rounded-[2rem] p-8 max-w-xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-violet-500/20 p-3 rounded-xl">
                <UserCog className="text-violet-400 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">My Account</h3>
                <p className="text-xs text-slate-500">Manage your own super admin balance</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center p-4 bg-slate-950/50 rounded-xl border border-white/5">
                <span className="text-slate-400 text-sm">Name</span>
                <span className="font-bold">{currentUser.name}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-950/50 rounded-xl border border-white/5">
                <span className="text-slate-400 text-sm">Email</span>
                <span className="font-bold text-sm">{currentUser.email}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-950/50 rounded-xl border border-white/5">
                <span className="text-slate-400 text-sm">Current Balance</span>
                <span className="font-black text-emerald-400 text-lg">{formatKSH(currentUser.accountBalance)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-950/50 rounded-xl border border-white/5">
                <span className="text-slate-400 text-sm">Role</span>
                <span className="px-2 py-1 bg-violet-500/10 text-violet-400 text-[10px] font-black rounded uppercase">Super Admin</span>
              </div>
            </div>

            <button
              onClick={adjustOwnBalance}
              className="w-full py-3 rounded-xl bg-violet-500/20 text-violet-300 font-black text-sm hover:bg-violet-500/30 border border-violet-500/20 transition-colors flex items-center justify-center gap-2"
            >
              <UserCog className="w-4 h-4" />
              Edit My Balance
            </button>
            <p className="text-[10px] text-slate-600 text-center mt-3">All self-adjustments are fully audited in the activity log.</p>
          </div>
        )}
      </main>
    </div>
  );
};
