import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  GitCommitHorizontal,
  Search,
  PackagePlus,
  FlaskConical,
  Microscope,
  ShieldCheck,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Boxes,
  Calendar,
  Thermometer,
  Layers,
} from 'lucide-react';
import { batchService } from '../services/batchService';
import { formatDate, formatDateTime, getStatusBadgeClass } from '../utils/formatters';

const BatchTraceabilityPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedBatchId, setSelectedBatchId] = useState(
    searchParams.get('batchId') || 'BATCH-2026-1001'
  );
  const [batchList, setBatchList] = useState([]);
  const [traceData, setTraceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');

  const loadBatchOptions = async () => {
    try {
      const res = await batchService.getBatches({ limit: 50 });
      if (res.success) {
        setBatchList(res.data);
      }
    } catch (err) {
      console.error('Error fetching batches:', err);
    }
  };

  const fetchTraceability = async (bId) => {
    try {
      setLoading(true);
      const res = await batchService.getTraceability(bId);
      if (res.success) {
        setTraceData(res.data);
      }
    } catch (err) {
      console.error('Error fetching traceability:', err);
      setTraceData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatchOptions();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      fetchTraceability(selectedBatchId);
      setSearchParams({ batchId: selectedBatchId });
    }
  }, [selectedBatchId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSelectedBatchId(searchInput.trim().toUpperCase());
    }
  };

  const getStepIcon = (iconName) => {
    switch (iconName) {
      case 'PackagePlus':
        return <PackagePlus className="w-5 h-5 text-blue-600" />;
      case 'FlaskConical':
        return <FlaskConical className="w-5 h-5 text-teal-600" />;
      case 'Microscope':
        return <Microscope className="w-5 h-5 text-sky-600" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-indigo-600" />;
      case 'Award':
        return <Award className="w-5 h-5 text-emerald-600" />;
      default:
        return <Layers className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <GitCommitHorizontal className="w-6 h-6 text-purple-600" />
          Batch Lifecycle & Quality Traceability
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete chain-of-custody verification from raw lot manufacturing, sampling, laboratory analysis, QA sign-off, to release certification.
        </p>
      </div>

      {/* Selector & Search Form */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search specific Batch ID (e.g. BATCH-2026-1001)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </form>

        <div className="w-full md:w-80">
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            {batchList.map((b) => (
              <option key={b._id} value={b.batchId}>
                {b.batchId} — {b.productName} [{b.status}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-400 text-xs">
          <div className="w-6 h-6 border-2 border-purple-500/20 border-t-purple-600 rounded-full animate-spin mx-auto mb-2" />
          Reconstructing full traceability timeline...
        </div>
      ) : traceData ? (
        <div className="space-y-6">
          {/* Batch Summary Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xl font-black text-slate-900">
                  {traceData.batch.batchId}
                </span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeClass(
                    traceData.batch.status
                  )}`}
                >
                  {traceData.batch.status}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-800">
                {traceData.batch.productName}
              </h2>
              <p className="text-xs text-slate-500">
                Category: <strong>{traceData.batch.productCategory}</strong> &bull; Size:{' '}
                <strong>
                  {traceData.batch.quantity} {traceData.batch.unit}
                </strong>
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Mfg Date</span>
                <span className="font-medium text-slate-800">
                  {formatDate(traceData.batch.manufacturingDate)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Expiry Date</span>
                <span className="font-medium text-slate-800">
                  {formatDate(traceData.batch.expiryDate)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Storage</span>
                <span className="font-medium text-slate-800">
                  {traceData.batch.storageTemperature}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Timeline */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 mb-6 flex items-center gap-2">
              <span>Chronological Event Trace</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">
                {traceData.timeline.length} Milestones Recorded
              </span>
            </h3>

            <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-8 ml-3 sm:ml-4">
              {traceData.timeline.map((event, idx) => (
                <div key={idx} className="relative group">
                  {/* Timeline Node Badge */}
                  <div className="absolute -left-[35px] sm:-left-[43px] top-0 w-8 h-8 rounded-full bg-white border-2 border-purple-500 flex items-center justify-center shadow-md">
                    {getStepIcon(event.icon)}
                  </div>

                  {/* Event Card */}
                  <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-5 transition-all shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{event.title}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(
                              event.status
                            )}`}
                          >
                            {event.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{event.subtitle}</p>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-[11px] font-medium text-slate-700 block">
                          Actor: <strong>{event.actor}</strong> ({event.role})
                        </span>
                        {event.timestamp && (
                          <span className="text-[10px] text-slate-400 font-mono inline-flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(event.timestamp)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Event Detail Payload */}
                    {event.details && Object.keys(event.details).length > 0 && (
                      <div className="mt-3 text-xs">
                        {event.details.parameters && (
                          <div className="mt-2 space-y-1.5">
                            <span className="text-[11px] font-semibold text-slate-600 block">
                              Analyzed Parameters:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {event.details.parameters.map((p, pIdx) => (
                                <div
                                  key={pIdx}
                                  className="p-2 bg-white rounded-xl border border-slate-200/70 flex items-center justify-between text-xs"
                                >
                                  <span className="font-medium text-slate-700">{p.name}</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900">
                                      {p.observed || '—'} {p.unit}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                        p.status === 'Pass'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {p.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {event.details.quarantineReason && (
                          <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                            <strong>Quarantine Reasoning:</strong> {event.details.quarantineReason}
                          </div>
                        )}

                        {event.details.certificateNumber && (
                          <div className="mt-2 flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                            <span>
                              Official Certificate Number:{' '}
                              <strong>{event.details.certificateNumber}</strong>
                            </span>
                            <Link
                              to={`/coa?batchId=${traceData.batch.batchId}`}
                              className="font-bold text-emerald-700 hover:underline"
                            >
                              Inspect COA Document &rarr;
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
          Batch not found. Please verify the Batch ID entered.
        </div>
      )}
    </div>
  );
};

export default BatchTraceabilityPage;
