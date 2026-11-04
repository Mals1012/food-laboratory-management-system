import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  FlaskConical,
  ShieldCheck,
  AlertOctagon,
  ClockAlert,
  TrendingUp,
  CheckCircle,
  XCircle,
  FileText,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  Activity,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { dashboardService } from '../services/dashboardService';
import { useAuth } from '../hooks/useAuth';
import { formatDate, formatDateTime, getStatusBadgeClass } from '../utils/formatters';

const DashboardPage = () => {
  const { user, canManageBatches, canPerformTests, canReviewQA } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await dashboardService.getStats();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to fetch real-time dashboard data from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Connecting to Laboratory Data Stream...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
        <AlertOctagon className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="font-bold text-slate-800">Connection Alert</h3>
        <p className="text-xs text-rose-700">{error || 'Data unavailable'}</p>
        <button
          onClick={loadDashboard}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { summary, performance, charts, recentActivities, expiryWidget } = data;

  const statCards = [
    {
      title: 'Total Food Batches',
      value: summary.totalBatches,
      icon: Boxes,
      color: 'from-blue-600 to-indigo-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: '/batches',
      sub: 'All Registered Lots',
    },
    {
      title: 'Under Lab Testing',
      value: summary.underTestingBatches,
      icon: FlaskConical,
      color: 'from-sky-500 to-teal-500',
      textColor: 'text-sky-600',
      bgColor: 'bg-sky-50',
      link: '/testing',
      sub: 'Analytical Queue',
    },
    {
      title: 'QA Approved Batches',
      value: summary.approvedBatches,
      icon: ShieldCheck,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      link: '/batches?status=Approved',
      sub: 'Released to Market',
    },
    {
      title: 'Quarantined / Rejected',
      value: summary.quarantinedBatches,
      icon: AlertOctagon,
      color: 'from-rose-500 to-red-600',
      textColor: 'text-rose-600',
      bgColor: 'bg-rose-50',
      link: '/batches?status=Quarantined',
      sub: 'Non-compliant Holds',
    },
    {
      title: 'Expiring Soon (30d)',
      value: summary.expiringSoon,
      icon: ClockAlert,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      link: '/expiry-monitoring',
      sub: `${summary.expired || 0} batches expired`,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner: Greeting & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Laboratory Operations Overview
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
              Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <strong className="text-slate-700">{user?.fullName}</strong> ({user?.role}) &bull;{' '}
            {user?.department}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={loadDashboard}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {canManageBatches() && (
            <Link
              to="/batches"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4 text-teal-400" />
              <span>Register Batch</span>
            </Link>
          )}

          {canPerformTests() && (
            <Link
              to="/testing"
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all shadow-teal-600/20"
            >
              <FlaskConical className="w-4 h-4" />
              <span>Record Analysis</span>
            </Link>
          )}

          {canReviewQA() && (
            <Link
              to="/qa-review"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all shadow-indigo-600/20"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>QA Review</span>
            </Link>
          )}
        </div>
      </div>

      {/* 5 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.link}
              className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl ${card.bgColor} ${card.textColor}`}>
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {card.value}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>{card.sub}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Analytical Performance Highlight Section */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              Laboratory Analytical Performance
            </span>
            <h2 className="text-xl font-bold tracking-tight">
              Quality Assurance Compliance & Release Metrics
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Real-time monitoring of food test outcome compliance against regulatory specifications and market release authorizations.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-700/50">
            <div className="text-center px-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Test Compliance</span>
              <div className="text-2xl font-black text-teal-400 mt-0.5">
                {performance.testCompliancePercentage}%
              </div>
              <span className="text-[10px] text-slate-400">Spec Adherence</span>
            </div>
            <div className="text-center px-2 border-l border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Batch Release</span>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">
                {performance.batchReleasePercentage}%
              </div>
              <span className="text-[10px] text-slate-400">Released to Market</span>
            </div>
            <div className="text-center px-2 border-l border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Passed Tests</span>
              <div className="text-2xl font-black text-white mt-0.5">
                {performance.passedTests}
              </div>
              <span className="text-[10px] text-emerald-400">Verified</span>
            </div>
            <div className="text-center px-2 border-l border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Awaiting QA</span>
              <div className="text-2xl font-black text-amber-400 mt-0.5">
                {performance.testsUnderReview}
              </div>
              <span className="text-[10px] text-amber-400">In Review</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row: Monthly Trend & Pass/Fail Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Monthly Trend Area Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Monthly Batch Registration & Release Trend
              </h3>
              <p className="text-xs text-slate-500">
                Historical 6-month production intake vs QA release approvals
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-teal-500" />
                <span className="text-slate-600">Registered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-600" />
                <span className="text-slate-600">QA Approved</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="batchesRegistered" name="Registered" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReg)" />
                <Area type="monotone" dataKey="batchesApproved" name="Approved" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorApp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Test Outcome Donut Chart */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Test Outcome Distribution
            </h3>
            <p className="text-xs text-slate-500">
              Breakdown of all laboratory parameter evaluations
            </p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.testOutcomeDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {charts.testOutcomeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {charts.testOutcomeDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                <span className="text-slate-600 truncate">{item.name}:</span>
                <span className="font-bold text-slate-800 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Category Testing Performance & Batch Statuses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Testing Category Performance */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 mb-1">
            Testing Category Compliance Rates
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Chemical, Microbiological, and Heavy Metals pass rates
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.categoryPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="passed" name="Passed" fill="#16a34a" radius={[6, 6, 0, 0]} />
                <Bar dataKey="failed" name="Failed / Non-Compliant" fill="#dc2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Batch Status Distribution */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 mb-1">
            Batch Quality Status Breakdown
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Total active inventory distributed by current inspection milestone
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={charts.batchStatusDistribution}
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Batches" radius={[0, 6, 6, 0]}>
                  {charts.batchStatusDistribution.map((entry, index) => (
                    <Cell key={`status-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Expiry Monitoring Widget & Recent Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Expiry Monitoring Widget */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ClockAlert className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900">
                  Expiry Monitoring Widget
                </h3>
              </div>
              <Link
                to="/expiry-monitoring"
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1"
              >
                <span>Full Monitor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Batches nearing end of shelf-life requiring priority dispatch or re-evaluation
            </p>

            <div className="space-y-2.5">
              {expiryWidget.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No products expiring within 30 days
                </div>
              ) : (
                expiryWidget.map((item) => (
                  <div
                    key={item.batchId}
                    className="p-3 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 font-mono">
                          {item.batchId}
                        </span>
                        <span className="text-[10px] text-slate-400">({item.category})</span>
                      </div>
                      <p className="text-xs text-slate-600 truncate mt-0.5">{item.productName}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-xl text-xs font-bold ${
                          item.isExpired
                            ? 'bg-rose-100 text-rose-800'
                            : item.isWarning
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.isExpired
                          ? 'EXPIRED'
                          : `${item.remainingDays} days left`}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Exp: {formatDate(item.expiryDate)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Audit Activities Stream */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Recent Activity Stream (Audit Trail)
                </h3>
              </div>
              <Link
                to="/audit-trail"
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1"
              >
                <span>View Full Trail</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Immutable logging of user interactions, batch status changes, and testing decisions
            </p>

            <div className="space-y-3">
              {recentActivities.slice(0, 5).map((act) => (
                <div
                  key={act._id}
                  className="p-3 rounded-2xl border border-slate-100 bg-slate-50/40 flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">
                        {act.username}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                        {act.action}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 line-clamp-1">{act.description}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {formatDateTime(act.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
