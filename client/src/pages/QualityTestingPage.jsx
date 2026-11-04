import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FlaskConical,
  Microscope,
  ShieldAlert,
  Search,
  Filter,
  Plus,
  Edit3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Send,
  Save,
  X,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { testService } from '../services/testService';
import { batchService } from '../services/batchService';
import { useAuth } from '../hooks/useAuth';
import { formatDate, getStatusBadgeClass } from '../utils/formatters';

const QualityTestingPage = () => {
  const { user, canPerformTests, hasRole } = useAuth();
  const [searchParams] = useSearchParams();

  const getBatchIdDisplay = (t) => {
    if (!t) return '';
    if (typeof t.batchId === 'object' && t.batchId !== null) {
      return t.batchId.batchId || '';
    }
    return t.batchId || t.batch?.batchId || '';
  };

  const getProductNameDisplay = (t) => {
    if (!t) return 'Food Product';
    if (typeof t.batchId === 'object' && t.batchId !== null && t.batchId.productName) {
      return t.batchId.productName;
    }
    return t.batch?.productName || 'Food Product';
  };

  const [tests, setTests] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedOutcome, setSelectedOutcome] = useState(searchParams.get('outcome') || 'All');
  const [page, setPage] = useState(1);

  // Active batches for registration dropdown
  const [activeBatches, setActiveBatches] = useState([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTestModal, setActiveTestModal] = useState(null); // for editing & entering parameters
  const [modalMode, setModalMode] = useState('view'); // 'view' | 'edit'

  // New Test Form State
  const [newTestBatchId, setNewTestBatchId] = useState('');
  const [newTestCategory, setNewTestCategory] = useState('Chemical Analysis');
  const [newTestSampleDesc, setNewTestSampleDesc] = useState('');
  const [newTestNotes, setNewTestNotes] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Test Parameter Editing State
  const [editingParameters, setEditingParameters] = useState([]);
  const [editingNotes, setEditingNotes] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ text: '', type: '' });

  const categories = [
    'All',
    'Chemical Analysis',
    'Microbiological Testing',
    'Heavy Metals and Contaminants',
  ];

  const outcomes = ['All', 'In Progress', 'Submitted', 'Pass', 'Fail', 'Pending'];

  const fetchTests = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        outcome: selectedOutcome !== 'All' ? selectedOutcome : undefined,
        batchId: searchParams.get('batchId') || undefined,
        page,
        limit: 10,
      };
      const res = await testService.getTests(params);
      if (res.success) {
        setTests(res.data);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBatchesForDropdown = async () => {
    try {
      const res = await batchService.getBatches({ limit: 100 });
      if (res.success) {
        setActiveBatches(res.data);
        if (res.data.length > 0 && !newTestBatchId) {
          setNewTestBatchId(res.data[0].batchId);
        }
      }
    } catch (err) {
      console.error('Error loading batches:', err);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [searchTerm, selectedCategory, selectedOutcome, page]);

  useEffect(() => {
    loadBatchesForDropdown();
  }, []);

  const handleOpenCreateModal = () => {
    setCreateError('');
    setNewTestSampleDesc('');
    setNewTestNotes('');
    setShowCreateModal(true);
  };

  const handleCreateTestSubmit = async (e) => {
    e.preventDefault();
    if (!newTestBatchId) {
      setCreateError('Please select a valid linked batch.');
      return;
    }

    try {
      setCreateSubmitting(true);
      setCreateError('');
      const res = await testService.createTest({
        batchId: newTestBatchId,
        testCategory: newTestCategory,
        sampleDescription: newTestSampleDesc || `Sample for ${newTestCategory}`,
        notes: newTestNotes,
      });

      if (res.success) {
        setShowCreateModal(false);
        fetchTests();
        // Immediately open parameter editor
        handleOpenTestDetail(res.data, 'edit');
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Error creating test.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleOpenTestDetail = (test, mode = 'view') => {
    setActiveTestModal(test);
    setModalMode(mode);
    setEditingParameters(JSON.parse(JSON.stringify(test.parameters || [])));
    setEditingNotes(test.notes || '');
    setSaveMessage({ text: '', type: '' });
  };

  // Live evaluation when typing parameter values
  const handleParameterValueChange = (index, value) => {
    const updated = [...editingParameters];
    const param = { ...updated[index], observedValue: value };

    // Real-time evaluation
    const num = parseFloat(value);
    if (!isNaN(num) && (param.minLimit !== null || param.maxLimit !== null)) {
      if (param.minLimit !== null && num < param.minLimit) {
        param.status = 'Fail';
      } else if (param.maxLimit !== null && num > param.maxLimit) {
        param.status = 'Fail';
      } else {
        param.status = 'Pass';
      }
    } else if (param.textLimit) {
      const cleanVal = String(value).trim().toLowerCase();
      if (cleanVal.includes('absent') || cleanVal.includes('negative')) {
        param.status = 'Pass';
      } else if (cleanVal.includes('present') || cleanVal.includes('positive') || cleanVal.includes('detected')) {
        param.status = 'Fail';
      } else if (value.trim() !== '') {
        param.status = 'Pass';
      } else {
        param.status = 'Pending';
      }
    } else if (value.trim() === '') {
      param.status = 'Pending';
    } else {
      param.status = 'Pass';
    }

    updated[index] = param;
    setEditingParameters(updated);
  };

  const handleParameterRemarksChange = (index, remarks) => {
    const updated = [...editingParameters];
    updated[index] = { ...updated[index], remarks };
    setEditingParameters(updated);
  };

  const handleSaveParameters = async (isSubmittingForReview = false) => {
    try {
      setSaveLoading(true);
      setSaveMessage({ text: '', type: '' });

      const res = await testService.updateTest(activeTestModal._id, {
        parameters: editingParameters,
        notes: editingNotes,
        isSubmittingForReview,
      });

      if (res.success) {
        setActiveTestModal(res.data);
        setEditingParameters(res.data.parameters);
        setSaveMessage({
          text: isSubmittingForReview
            ? 'Test results submitted for QA review successfully!'
            : 'Analytical observations saved successfully.',
          type: 'success',
        });
        fetchTests();
        if (isSubmittingForReview) {
          setTimeout(() => setActiveTestModal(null), 1200);
        }
      }
    } catch (err) {
      setSaveMessage({
        text: err.response?.data?.message || 'Error updating parameters.',
        type: 'error',
      });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FlaskConical className="w-6 h-6 text-teal-600" />
            Quality Testing & Analytical Chemistry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Record chemical parameters, microbiological results, and contaminant assays against regulatory specification ceilings.
          </p>
        </div>

        {canPerformTests() && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-sm shadow-teal-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Initiate New Test Record</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Test ID, Batch ID, Analyst, or Sample..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Category Dropdown */}
        <div className="w-full md:w-64">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>
        </div>

        {/* Outcome Dropdown */}
        <div className="w-full md:w-44">
          <select
            value={selectedOutcome}
            onChange={(e) => setSelectedOutcome(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            {outcomes.map((o) => (
              <option key={o} value={o}>
                Outcome: {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Test Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Test ID</th>
                <th className="py-3.5 px-4">Batch Reference</th>
                <th className="py-3.5 px-4">Test Category</th>
                <th className="py-3.5 px-4">Assigned Analyst</th>
                <th className="py-3.5 px-4">Parameters Tested</th>
                <th className="py-3.5 px-4">Test Outcome</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-teal-500/20 border-t-teal-600 rounded-full animate-spin mx-auto mb-2" />
                    Loading analytical test records...
                  </td>
                </tr>
              ) : tests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No laboratory tests found matching the criteria.
                  </td>
                </tr>
              ) : (
                tests.map((test) => {
                  const passedParams = test.parameters?.filter((p) => p.status === 'Pass').length || 0;
                  const totalParams = test.parameters?.length || 0;
                  return (
                    <tr key={test._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {test.testId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 font-mono">
                          {getBatchIdDisplay(test)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {getProductNameDisplay(test)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700">{test.testCategory}</span>
                        <div className="text-[10px] text-slate-400">
                          Sample: {test.sampleDescription}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {test.analystName}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {formatDate(test.sampleCollectionDate)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">
                            {passedParams} / {totalParams} Passed
                          </span>
                        </div>
                        <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-teal-500 h-full rounded-full transition-all"
                            style={{
                              width: `${totalParams > 0 ? (passedParams / totalParams) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(
                            test.overallOutcome
                          )}`}
                        >
                          {test.overallOutcome}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenTestDetail(test, 'view')}
                            className="px-2.5 py-1 rounded-lg text-slate-600 hover:bg-slate-100 font-medium text-xs transition-colors"
                          >
                            View
                          </button>
                          {canPerformTests() && test.overallOutcome !== 'Pass' && test.overallOutcome !== 'Fail' && (
                            <button
                              onClick={() => handleOpenTestDetail(test, 'edit')}
                              className="px-2.5 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Record Readings</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {tests.length} of {total} test records
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

      {/* Modal: Initiate New Test */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Initiate Laboratory Test</h3>
                  <span className="text-[11px] text-slate-500">
                    Link test to registered food batch and load specification limits
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTestSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Food Batch *
                </label>
                <select
                  value={newTestBatchId}
                  onChange={(e) => setNewTestBatchId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                >
                  {activeBatches.map((b) => (
                    <option key={b._id} value={b.batchId}>
                      {b.batchId} — {b.productName} ({b.productCategory}) [{b.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Test Category *
                </label>
                <select
                  value={newTestCategory}
                  onChange={(e) => setNewTestCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="Chemical Analysis">Chemical Analysis (pH, Moisture, Acidity, Fat, Protein)</option>
                  <option value="Microbiological Testing">Microbiological Testing (TPC, E. coli, Salmonella)</option>
                  <option value="Heavy Metals and Contaminants">Heavy Metals and Contaminants (Lead, Arsenic, Histamine)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sample Description
                </label>
                <input
                  type="text"
                  value={newTestSampleDesc}
                  onChange={(e) => setNewTestSampleDesc(e.target.value)}
                  placeholder="e.g. Silo Discharge Valve 2 Aseptic Extraction"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Analyst Testing Notes / Methodology
                </label>
                <textarea
                  value={newTestNotes}
                  onChange={(e) => setNewTestNotes(e.target.value)}
                  rows="2"
                  placeholder="Sample preparation protocol, incubation temperatures, calibration notes..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  {createSubmitting ? 'Creating...' : 'Create Test Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record & Edit Parameters (Analytical Data Workspace) */}
      {activeTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-base font-bold text-slate-900">
                    {activeTestModal.testId}
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeClass(
                      activeTestModal.overallOutcome
                    )}`}
                  >
                    {activeTestModal.overallOutcome}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                    {activeTestModal.testCategory}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Batch: <strong>{getBatchIdDisplay(activeTestModal)}</strong> &bull; Analyst:{' '}
                  <strong>{activeTestModal.analystName}</strong> &bull; Sample:{' '}
                  {activeTestModal.sampleDescription}
                </p>
              </div>
              <button
                onClick={() => setActiveTestModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Alert Message */}
            {saveMessage.text && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  saveMessage.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {saveMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{saveMessage.text}</span>
              </div>
            )}

            {/* Parameters Table */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Analytical Parameters & Regulatory Specifications
                </h4>
                <span className="text-[11px] text-slate-500">
                  Real-time specification compliance checking active
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Parameter Name</th>
                      <th className="py-2.5 px-3">Standard Method</th>
                      <th className="py-2.5 px-3">Spec Limit</th>
                      <th className="py-2.5 px-3 w-40">Observed Value</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Analyst Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {editingParameters.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                          No parameters specified for this test.
                        </td>
                      </tr>
                    ) : (
                      editingParameters.map((param, idx) => {
                        let specLabel = 'Conforms';
                        if (param.minLimit !== null && param.maxLimit !== null) {
                          specLabel = `${param.minLimit} - ${param.maxLimit} ${param.unit}`;
                        } else if (param.minLimit !== null) {
                          specLabel = `>= ${param.minLimit} ${param.unit}`;
                        } else if (param.maxLimit !== null) {
                          specLabel = `<= ${param.maxLimit} ${param.unit}`;
                        } else if (param.textLimit) {
                          specLabel = param.textLimit;
                        }

                        const isReadOnly =
                          modalMode === 'view' ||
                          activeTestModal.overallOutcome === 'Pass' ||
                          activeTestModal.overallOutcome === 'Fail';

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-3 px-3 font-semibold text-slate-800">
                              {param.name}
                              <span className="block text-[10px] text-slate-400 font-normal">
                                Unit: {param.unit}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-500 text-[11px]">
                              {param.standardMethod}
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-700 bg-slate-50/50">
                              {specLabel}
                            </td>
                            <td className="py-3 px-3">
                              {isReadOnly ? (
                                <span className="font-semibold text-slate-800">
                                  {param.observedValue || '—'} {param.unit}
                                </span>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={param.observedValue ?? ''}
                                    onChange={(e) =>
                                      handleParameterValueChange(idx, e.target.value)
                                    }
                                    placeholder="Enter reading"
                                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                  />
                                  <span className="text-[10px] text-slate-400 shrink-0">
                                    {param.unit}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(
                                  param.status
                                )}`}
                              >
                                {param.status}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {isReadOnly ? (
                                <span className="text-slate-500 text-[11px]">
                                  {param.remarks || '—'}
                                </span>
                              ) : (
                                <input
                                  type="text"
                                  value={param.remarks || ''}
                                  onChange={(e) =>
                                    handleParameterRemarksChange(idx, e.target.value)
                                  }
                                  placeholder="Observations..."
                                  className="w-full px-2 py-1 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-teal-500"
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* QA Review Remarks if already reviewed */}
              {activeTestModal.qaReview?.decision && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-1 ${
                    activeTestModal.qaReview.decision === 'Approved'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>
                      QA Review Sign-off: {activeTestModal.qaReview.decision}
                    </span>
                    <span>{formatDate(activeTestModal.qaReview.reviewDate)}</span>
                  </div>
                  <p className="text-[11px]">
                    Reviewed by: <strong>{activeTestModal.qaReview.reviewerName}</strong>
                  </p>
                  <p className="mt-1 font-medium">{activeTestModal.qaReview.comments}</p>
                </div>
              )}

              {/* Analyst Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Analyst Method & Preparation Notes
                </label>
                <textarea
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  disabled={
                    modalMode === 'view' ||
                    activeTestModal.overallOutcome === 'Pass' ||
                    activeTestModal.overallOutcome === 'Fail'
                  }
                  rows="2"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-50"
                  placeholder="Sample prep protocol, incubation conditions, calibration readings..."
                />
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTestModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>

                {modalMode === 'view' &&
                  canPerformTests() &&
                  activeTestModal.overallOutcome !== 'Pass' &&
                  activeTestModal.overallOutcome !== 'Fail' && (
                    <button
                      type="button"
                      onClick={() => setModalMode('edit')}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Record Readings</span>
                    </button>
                  )}

                {modalMode === 'edit' &&
                  canPerformTests() &&
                  activeTestModal.overallOutcome !== 'Pass' &&
                  activeTestModal.overallOutcome !== 'Fail' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveParameters(false)}
                        disabled={saveLoading}
                        className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <Save className="w-4 h-4 text-slate-500" />
                        <span>Save as Draft</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveParameters(true)}
                        disabled={saveLoading}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
                      >
                        <Send className="w-4 h-4" />
                        <span>Submit for QA Review</span>
                      </button>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityTestingPage;
