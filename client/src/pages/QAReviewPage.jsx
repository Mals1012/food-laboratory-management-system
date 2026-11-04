import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Clock,
  UserCheck,
  Search,
  Filter,
  Check,
  X,
  AlertOctagon,
  Boxes,
} from 'lucide-react';
import { testService } from '../services/testService';
import { useAuth } from '../hooks/useAuth';
import { formatDate, getStatusBadgeClass } from '../utils/formatters';

const QAReviewPage = () => {
  const { user, canReviewQA } = useAuth();
  const [searchParams] = useSearchParams();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('Submitted'); // 'Submitted' | 'All' | 'Reviewed'

  // Review Modal State
  const [activeTest, setActiveTest] = useState(null);
  const [qaComments, setQaComments] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const fetchSubmittedTests = async () => {
    try {
      setLoading(true);
      const params = {
        outcome: filterTab === 'Submitted' ? 'Submitted' : undefined,
        limit: 50,
      };
      const res = await testService.getTests(params);
      if (res.success) {
        if (filterTab === 'Reviewed') {
          setTests(res.data.filter((t) => t.overallOutcome === 'Pass' || t.overallOutcome === 'Fail'));
        } else {
          setTests(res.data);
        }
      }
    } catch (err) {
      console.error('Error fetching QA tests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmittedTests();
  }, [filterTab]);

  const handleOpenReview = (test) => {
    setActiveTest(test);
    const hasFail = test.parameters?.some((p) => p.status === 'Fail');
    setQaComments(
      hasFail
        ? 'REJECTED: One or more analytical parameters failed specification limits.'
        : 'All test parameters conform to verified FSSAI / Codex quality specifications.'
    );
    setReviewError('');
    setReviewSuccess('');
  };

  const handleDecision = async (decision) => {
    if (!canReviewQA()) {
      setReviewError('Unauthorized: Quality Manager authorization is required to approve or reject tests.');
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError('');

      const res = await testService.reviewTest(activeTest._id, {
        decision,
        comments: qaComments,
      });

      if (res.success) {
        setReviewSuccess(
          decision === 'Approved'
            ? `Test ${activeTest.testId} APPROVED! Linked batch status updated.`
            : `Test ${activeTest.testId} REJECTED! Batch placed in Quarantine.`
        );
        fetchSubmittedTests();
        setTimeout(() => {
          setActiveTest(null);
          setReviewSuccess('');
        }, 1500);
      }
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Error recording QA decision.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const pendingCount = tests.filter((t) => t.overallOutcome === 'Submitted').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            Quality Assurance & Approval Workflow
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative review of submitted analytical tests. Decisions automatically synchronize batch release or quarantine status.
          </p>
        </div>

        {!canReviewQA() && (
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Read-Only: QA Manager privilege required to sign-off</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setFilterTab('Submitted')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            filterTab === 'Submitted'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Pending QA Review Queue</span>
          {pendingCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setFilterTab('Reviewed')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            filterTab === 'Reviewed'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Reviewed Decisions (Pass / Fail)
        </button>

        <button
          onClick={() => setFilterTab('All')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            filterTab === 'All'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Laboratory Tests
        </button>
      </div>

      {/* Tests Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Test ID</th>
                <th className="py-3.5 px-4">Batch Reference</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Analyst & Submission Date</th>
                <th className="py-3.5 px-4">Parameters Summary</th>
                <th className="py-3.5 px-4">Current Status</th>
                <th className="py-3.5 px-4 text-right">QA Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
                    Loading QA inspection queue...
                  </td>
                </tr>
              ) : tests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    {filterTab === 'Submitted'
                      ? 'No tests are currently pending QA review. All queue items processed.'
                      : 'No tests found in this category.'}
                  </td>
                </tr>
              ) : (
                tests.map((test) => {
                  const hasFailedParam = test.parameters?.some((p) => p.status === 'Fail');
                  return (
                    <tr key={test._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {test.testId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 font-mono">
                          {test.batchId}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {test.batch?.productName || 'Batch'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {test.testCategory}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-medium">{test.analystName}</div>
                        <div className="text-[10px] text-slate-400">
                          {formatDate(test.analysisCompletionDate || test.updatedAt)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {hasFailedParam ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <AlertOctagon className="w-3 h-3 text-rose-600" />
                              Out-of-Spec Parameter
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              All Parameters Compliant
                            </span>
                          )}
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
                        <button
                          onClick={() => handleOpenReview(test)}
                          className={`px-3 py-1.5 rounded-xl font-semibold text-xs shadow-sm transition-all ${
                            test.overallOutcome === 'Submitted'
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {test.overallOutcome === 'Submitted' ? 'Review & Sign Off' : 'Inspect Details'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {activeTest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Quality Assurance Review & Sign-Off
                  </h3>
                  <p className="text-xs text-slate-500">
                    Test: <strong className="font-mono">{activeTest.testId}</strong> &bull; Batch:{' '}
                    <strong className="font-mono">{activeTest.batchId}</strong> ({activeTest.testCategory})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTest(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success & Error Alerts */}
            {reviewSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{reviewSuccess}</span>
              </div>
            )}

            {reviewError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}

            {/* Parameters Verification Table */}
            <div className="mt-6 space-y-4">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Specification Limit Comparison
              </h4>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Analyte / Parameter</th>
                      <th className="py-2.5 px-3">Method Standard</th>
                      <th className="py-2.5 px-3">Specification Limit</th>
                      <th className="py-2.5 px-3">Observed Reading</th>
                      <th className="py-2.5 px-3 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeTest.parameters?.map((p, i) => {
                      let spec = 'Conforms';
                      if (p.minLimit !== null && p.maxLimit !== null) spec = `${p.minLimit} - ${p.maxLimit} ${p.unit}`;
                      else if (p.minLimit !== null) spec = `>= ${p.minLimit} ${p.unit}`;
                      else if (p.maxLimit !== null) spec = `<= ${p.maxLimit} ${p.unit}`;
                      else if (p.textLimit) spec = p.textLimit;

                      const isFail = p.status === 'Fail';

                      return (
                        <tr
                          key={i}
                          className={isFail ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50/50'}
                        >
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {p.name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">{p.standardMethod}</td>
                          <td className="py-2.5 px-3 text-slate-600">{spec}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {p.observedValue || '—'} {p.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(
                                p.status
                              )}`}
                            >
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Review Comments */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quality Manager Endorsement Remarks *
                </label>
                <textarea
                  value={qaComments}
                  onChange={(e) => setQaComments(e.target.value)}
                  rows="3"
                  placeholder="Record formal QA observations, batch release approval justification, or non-conformance quarantine reasoning..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Regulatory Notice Banner */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
                <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Regulatory Impact:</strong> Approving this test may automatically update the parent batch to <strong>Approved</strong> if all required assays pass. Rejecting this test will immediately place the batch into <strong>Quarantine</strong>.
                </span>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTest(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>

                {canReviewQA() && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDecision('Rejected')}
                      disabled={reviewSubmitting}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Test (Quarantine Batch)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDecision('Approved')}
                      disabled={reviewSubmitting || activeTest.parameters?.some((p) => p.status === 'Fail')}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                      title={
                        activeTest.parameters?.some((p) => p.status === 'Fail')
                          ? 'Cannot approve: parameter non-conformance present'
                          : 'Approve test'
                      }
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Test (Release Candidate)</span>
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

export default QAReviewPage;
