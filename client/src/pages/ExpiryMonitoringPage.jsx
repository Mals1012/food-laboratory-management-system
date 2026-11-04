import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClockAlert,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Search,
  Filter,
  Boxes,
  Calendar,
  AlertOctagon,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { batchService } from '../services/batchService';
import { formatDate, calculateShelfLife, getStatusBadgeClass } from '../utils/formatters';

const ExpiryMonitoringPage = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All'); // 'All' | 'ExpiringSoon' | 'Expired' | 'Safe'
  const [categoryFilter, setCategoryFilter] = useState('All');

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await batchService.getBatches({ limit: 100 });
      if (res.success) {
        setBatches(res.data);
      }
    } catch (err) {
      console.error('Error fetching batches for expiry monitoring:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // Compute shelf-life details for all batches
  const evaluatedBatches = batches.map((batch) => {
    const shelf = calculateShelfLife(batch.expiryDate);
    const mfg = new Date(batch.manufacturingDate).getTime();
    const exp = new Date(batch.expiryDate).getTime();
    const now = Date.now();
    const totalDuration = exp - mfg;
    const elapsed = now - mfg;
    const elapsedPercent = totalDuration > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100))) : 100;

    return {
      ...batch,
      shelf,
      elapsedPercent,
      isExpired: shelf.status === 'expired',
      isExpiringSoon: shelf.status === 'warning',
      isSafe: shelf.status === 'good',
    };
  });

  // Filtered list
  const filtered = evaluatedBatches.filter((b) => {
    const matchSearch =
      b.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.productName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory =
      categoryFilter === 'All' || b.productCategory === categoryFilter;

    let matchShelf = true;
    if (selectedFilter === 'ExpiringSoon') matchShelf = b.isExpiringSoon;
    else if (selectedFilter === 'Expired') matchShelf = b.isExpired;
    else if (selectedFilter === 'Safe') matchShelf = b.isSafe;

    return matchSearch && matchCategory && matchShelf;
  });

  // Analytics counts
  const expiredCount = evaluatedBatches.filter((b) => b.isExpired).length;
  const criticalSoonCount = evaluatedBatches.filter((b) => b.isExpiringSoon && b.shelf.days <= 15).length;
  const upcomingSoonCount = evaluatedBatches.filter((b) => b.isExpiringSoon && b.shelf.days > 15).length;
  const safeCount = evaluatedBatches.filter((b) => b.isSafe).length;

  const chartData = [
    { stage: 'Expired', count: expiredCount, fill: '#dc2626' },
    { stage: 'Critical (≤ 15d)', count: criticalSoonCount, fill: '#ea580c' },
    { stage: 'Warning (16-30d)', count: upcomingSoonCount, fill: '#f59e0b' },
    { stage: 'Adequate (> 30d)', count: safeCount, fill: '#16a34a' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <ClockAlert className="w-6 h-6 text-amber-500" />
          Expiry Monitoring & Shelf-Life Surveillance
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Automated shelf-life calculation, proactive expiry alerts within 30 days, and expired lot quarantine tracking.
        </p>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedFilter('Expired')}
          className={`p-5 rounded-3xl border cursor-pointer transition-all ${
            selectedFilter === 'Expired'
              ? 'bg-red-50 border-red-300 ring-2 ring-red-500/20 shadow-md'
              : 'bg-white border-slate-200/80 hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-rose-600 uppercase">
            <span>Expired Products</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-extrabold text-rose-700 mt-2">{expiredCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Immediate Quarantine Required</span>
        </div>

        <div
          onClick={() => setSelectedFilter('ExpiringSoon')}
          className={`p-5 rounded-3xl border cursor-pointer transition-all ${
            selectedFilter === 'ExpiringSoon'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 shadow-md'
              : 'bg-white border-slate-200/80 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-amber-600 uppercase">
            <span>Expiring ≤ 30 Days</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2">
            {criticalSoonCount + upcomingSoonCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Priority Commercial Distribution</span>
        </div>

        <div
          onClick={() => setSelectedFilter('Safe')}
          className={`p-5 rounded-3xl border cursor-pointer transition-all ${
            selectedFilter === 'Safe'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-md'
              : 'bg-white border-slate-200/80 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 uppercase">
            <span>Adequate Shelf-Life</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-700 mt-2">{safeCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">&gt; 30 Days Remaining</span>
        </div>

        <div
          onClick={() => setSelectedFilter('All')}
          className={`p-5 rounded-3xl border cursor-pointer transition-all ${
            selectedFilter === 'All'
              ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-500/20 shadow-md'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 uppercase">
            <span>Total Batches Tracked</span>
            <Boxes className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{evaluatedBatches.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active In-Warehouse Inventory</span>
        </div>
      </div>

      {/* Expiry Stage Chart */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <h3 className="font-bold text-sm text-slate-900 mb-1">
          Shelf-Life Stage Distribution
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Batches categorized by remaining freshness timeline
        </p>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="count" name="Batches" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Batch ID or Product Name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="All">All Lifecycles</option>
            <option value="ExpiringSoon">Expiring Soon (≤ 30d)</option>
            <option value="Expired">Expired</option>
            <option value="Safe">Safe (&gt; 30d)</option>
          </select>
        </div>
      </div>

      {/* Batches Expiry Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Batch ID</th>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Manufacturing Date</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Shelf-Life Consumption</th>
                <th className="py-3.5 px-4">Countdown Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Loading expiry records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No batches found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((batch) => (
                  <tr
                    key={batch._id}
                    className={`transition-colors ${
                      batch.isExpired
                        ? 'bg-rose-50/40 hover:bg-rose-50/70'
                        : batch.isExpiringSoon
                        ? 'bg-amber-50/30 hover:bg-amber-50/60'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {batch.batchId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{batch.productName}</div>
                      <div className="text-[10px] text-slate-400">{batch.productCategory}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {formatDate(batch.manufacturingDate)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {formatDate(batch.expiryDate)}
                    </td>
                    <td className="py-3.5 px-4 w-44">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span>{batch.elapsedPercent}% elapsed</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            batch.isExpired
                              ? 'bg-rose-600'
                              : batch.isExpiringSoon
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${batch.elapsedPercent}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${batch.shelf.color}`}
                      >
                        {batch.shelf.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/batches/${batch.batchId}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpiryMonitoringPage;
