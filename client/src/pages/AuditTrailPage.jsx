import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Calendar,
  User,
  Shield,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { auditService } from '../services/auditService';
import { formatDateTime } from '../utils/formatters';

const AuditTrailPage = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('All');
  const [selectedEntityType, setSelectedEntityType] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Detail Modal
  const [activeLog, setActiveLog] = useState(null);

  const actions = [
    'All',
    'LOGIN',
    'BATCH_CREATE',
    'BATCH_UPDATE',
    'BATCH_STATUS_CHANGE',
    'TEST_CREATE',
    'TEST_UPDATE',
    'TEST_SUBMIT',
    'QA_APPROVE',
    'QA_REJECT',
    'COA_GENERATE',
    'USER_CREATE',
    'USER_UPDATE',
  ];

  const entityTypes = ['All', 'Auth', 'Batch', 'Test', 'COA', 'User', 'ProductSpecification'];

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm || undefined,
        action: selectedAction !== 'All' ? selectedAction : undefined,
        entityType: selectedEntityType !== 'All' ? selectedEntityType : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 15,
      };
      const res = await auditService.getLogs(params);
      if (res.success) {
        setLogs(res.data);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching audit trail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [searchTerm, selectedAction, selectedEntityType, startDate, endDate, page]);

  const getActionBadgeClass = (action) => {
    if (action.includes('APPROVE') || action.includes('RELEASE')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (action.includes('REJECT') || action.includes('FAIL')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (action.includes('CREATE') || action.includes('GENERATE')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (action.includes('SUBMIT')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <History className="w-6 h-6 text-slate-800" />
          Immutable Audit Trail & Regulatory Ledger
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Compliant with FDA 21 CFR Part 11 and ISO/IEC 17025 data integrity guidelines. Audit logs are tamper-evident and append-only.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search username, description, or entity ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            {actions.map((act) => (
              <option key={act} value={act}>
                Action: {act}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-40">
          <select
            value={selectedEntityType}
            onChange={(e) => setSelectedEntityType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            {entityTypes.map((ent) => (
              <option key={ent} value={ent}>
                Entity: {ent}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600"
            title="Start Date"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600"
            title="End Date"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Timestamp (UTC)</th>
                <th className="py-3.5 px-4">User & Role</th>
                <th className="py-3.5 px-4">Action Type</th>
                <th className="py-3.5 px-4">Entity Reference</th>
                <th className="py-3.5 px-4">Audit Description</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Loading immutable audit trail records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No audit records found matching specified filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{log.username}</div>
                      <div className="text-[10px] text-slate-400">{log.userRole}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${getActionBadgeClass(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-medium text-slate-700">
                        {log.entityId}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-md truncate">
                      {log.description}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setActiveLog(log)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title="View Complete Audit Metadata"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {logs.length} of {total} audit records
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Audit Detail Modal */}
      {activeLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-600" />
                Immutable Audit Event Record
              </h3>
              <button
                onClick={() => setActiveLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Action Type
                  </span>
                  <span className="font-bold font-mono text-slate-800">
                    {activeLog.action}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Entity Type / ID
                  </span>
                  <span className="font-mono text-slate-800">
                    {activeLog.entityType}: {activeLog.entityId}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Operator Username
                  </span>
                  <span className="font-semibold text-slate-800">
                    {activeLog.username} ({activeLog.userRole})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Timestamp
                  </span>
                  <span className="font-mono text-slate-800">
                    {formatDateTime(activeLog.timestamp)}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  Full Description
                </span>
                <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-mono text-[11px]">
                  {activeLog.description}
                </p>
              </div>

              {activeLog.metadata && Object.keys(activeLog.metadata).length > 0 && (
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Structured Event Metadata
                  </span>
                  <pre className="p-3 bg-slate-900 text-teal-400 rounded-xl overflow-x-auto text-[10px] font-mono">
                    {JSON.stringify(activeLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveLog(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTrailPage;
