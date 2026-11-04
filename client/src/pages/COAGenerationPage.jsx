import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FileCheck,
  Download,
  Printer,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Search,
  Sparkles,
  Award,
  Calendar,
  Building,
  Microscope,
} from 'lucide-react';
import { coaService } from '../services/coaService';
import { batchService } from '../services/batchService';
import { useAuth } from '../hooks/useAuth';
import { generateCOAPdf } from '../utils/coaPdfGenerator';
import { formatDate } from '../utils/formatters';

const COAGenerationPage = () => {
  const { user, canGenerateCOA } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(
    searchParams.get('batchId') || 'BATCH-2026-1001'
  );
  const [coaData, setCoaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  const loadApprovedBatches = async () => {
    try {
      const res = await batchService.getBatches({ limit: 50 });
      if (res.success) {
        setBatches(res.data);
      }
    } catch (err) {
      console.error('Error fetching batches:', err);
    }
  };

  const loadCOA = async (bId) => {
    try {
      setLoading(true);
      setStatusMessage({ text: '', type: '' });
      const res = await coaService.getCOAByBatch(bId);
      if (res.success) {
        setCoaData(res.data);
      }
    } catch (err) {
      console.error('Error fetching COA:', err);
      setStatusMessage({
        text: err.response?.data?.message || 'Error loading Certificate of Analysis.',
        type: 'error',
      });
      setCoaData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovedBatches();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      loadCOA(selectedBatchId);
      setSearchParams({ batchId: selectedBatchId });
    }
  }, [selectedBatchId]);

  const handleGenerateCOA = async () => {
    if (!canGenerateCOA()) {
      setStatusMessage({
        text: 'Unauthorized: Quality Manager or Admin credentials required to issue official COA.',
        type: 'error',
      });
      return;
    }

    try {
      setGenerating(true);
      setStatusMessage({ text: '', type: '' });
      const res = await coaService.generateCOA(selectedBatchId);
      if (res.success) {
        setStatusMessage({
          text: `Official Certificate of Analysis ${res.data.certificateNumber} generated and archived successfully!`,
          type: 'success',
        });
        loadCOA(selectedBatchId);
      }
    } catch (err) {
      setStatusMessage({
        text: err.response?.data?.message || 'Error generating COA.',
        type: 'error',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!coaData?.coa) return;
    generateCOAPdf(coaData.coa, coaData.batch);
  };

  const handlePrint = () => {
    window.print();
  };

  const isBatchApproved = coaData?.batch?.status === 'Approved';
  const existingCOA = coaData?.coa;

  return (
    <div className="space-y-6">
      {/* Top Controls Header (Hidden during browser print) */}
      <div className="no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <FileCheck className="w-6 h-6 text-emerald-600" />
              Certificate of Analysis (COA) Generation
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Automated compilation of verified analytical records into official ISO/IEC 17025 accredited laboratory certificates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {existingCOA && (
              <>
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Print Certificate</span>
                </button>

                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Document</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Batch Selector Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
            Select Batch to Inspect:
          </label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="w-full sm:w-96 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            {batches.map((b) => (
              <option key={b._id} value={b.batchId}>
                {b.batchId} — {b.productName} [{b.status}]
              </option>
            ))}
          </select>

          {isBatchApproved && !existingCOA && canGenerateCOA() && (
            <button
              onClick={handleGenerateCOA}
              disabled={generating}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all ml-auto"
            >
              <Award className="w-4 h-4" />
              <span>{generating ? 'Compiling Assays...' : 'Issue & Sign COA'}</span>
            </button>
          )}
        </div>

        {/* Status Message */}
        {statusMessage.text && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Regulatory Block Warning when batch is not Approved */}
        {!isBatchApproved && coaData?.batch && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
            <Lock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Regulatory Release Hold Active</p>
              <p className="mt-0.5 text-rose-800">
                Batch <strong>{coaData.batch.batchId}</strong> has status:{' '}
                <strong>{coaData.batch.status}</strong>. In compliance with Codex Alimentarius, FDA Title 21 CFR, and ISO 17025 standards, Certificates of Analysis cannot be generated for batches that have not successfully completed all laboratory testing and QA sign-off.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Official Certificate of Analysis Preview (Printable View) */}
      {loading ? (
        <div className="py-24 text-center text-slate-400 text-xs">
          <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2" />
          Compiling certificate records from laboratory database...
        </div>
      ) : existingCOA ? (
        <div className="bg-white rounded-3xl border border-slate-300 shadow-xl p-8 sm:p-12 max-w-4xl mx-auto space-y-6 print:border-none print:shadow-none print:p-0">
          
          {/* Certificate Header Banner */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-teal-400 flex items-center justify-center font-bold text-sm">
                    FL
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    FOODLAB LIMS
                  </h2>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 uppercase font-semibold tracking-wider">
                  Industrial Food Processing & Analytical Quality Certification Authority
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white tracking-widest uppercase">
                  Certificate of Analysis
                </span>
                <p className="font-mono text-xs font-bold text-slate-800 mt-1">
                  Doc #: {existingCOA.certificateNumber}
                </p>
              </div>
            </div>

            {/* ISO standard strip */}
            <div className="mt-4 p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] flex items-center justify-between">
              <span className="font-bold text-teal-700">
                Accreditation Standard: {existingCOA.accreditationStandard}
              </span>
              <span className="text-slate-500 font-mono">
                Date: {formatDate(existingCOA.issueDate)}
              </span>
            </div>
          </div>

          {/* Batch & Sample Details Table (2-Column Grid) */}
          <div>
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2 border-l-2 border-teal-600 pl-2">
              Batch & Sample Identification
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Batch ID</span>
                <span className="font-mono font-bold text-slate-900">{existingCOA.batchId}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Product Name</span>
                <span className="font-semibold text-slate-800">{existingCOA.productName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Mfg Date</span>
                <span className="text-slate-700">{formatDate(existingCOA.manufacturingDate)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Expiry Date</span>
                <span className="text-slate-700">{formatDate(existingCOA.expiryDate)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Category</span>
                <span className="text-slate-700">{existingCOA.productCategory}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Storage Spec</span>
                <span className="text-slate-700">{existingCOA.storageConditions}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Sampling Point</span>
                <span className="text-slate-700">{existingCOA.sampleInfo?.sampleLocation}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Sampling Date</span>
                <span className="text-slate-700">{formatDate(existingCOA.sampleInfo?.collectionDate)}</span>
              </div>
            </div>
          </div>

          {/* 1. Chemical Analysis Results */}
          {existingCOA.testResults?.chemical?.length > 0 && (
            <div>
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2 border-l-2 border-teal-600 pl-2">
                1. Chemical Analysis & Physicochemical Parameters
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-semibold uppercase text-[10px]">
                      <th className="py-2 px-3">Parameter</th>
                      <th className="py-2 px-3">Unit</th>
                      <th className="py-2 px-3">Method Reference</th>
                      <th className="py-2 px-3">Specification Limit</th>
                      <th className="py-2 px-3">Observed Value</th>
                      <th className="py-2 px-3 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {existingCOA.testResults.chemical.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-800">{row.parameter}</td>
                        <td className="py-2 px-3 text-slate-500">{row.unit}</td>
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{row.method}</td>
                        <td className="py-2 px-3 text-slate-600">{row.specification}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{row.observed}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-600">{row.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Microbiological Results */}
          {existingCOA.testResults?.microbiological?.length > 0 && (
            <div>
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2 border-l-2 border-teal-600 pl-2">
                2. Microbiological Examination
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-semibold uppercase text-[10px]">
                      <th className="py-2 px-3">Microorganism</th>
                      <th className="py-2 px-3">Unit</th>
                      <th className="py-2 px-3">Method Standard</th>
                      <th className="py-2 px-3">Regulatory Ceiling</th>
                      <th className="py-2 px-3">Observed Finding</th>
                      <th className="py-2 px-3 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {existingCOA.testResults.microbiological.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-800">{row.parameter}</td>
                        <td className="py-2 px-3 text-slate-500">{row.unit}</td>
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{row.method}</td>
                        <td className="py-2 px-3 text-slate-600">{row.specification}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{row.observed}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-600">{row.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Heavy Metals & Contaminants Results */}
          {existingCOA.testResults?.heavyMetals?.length > 0 && (
            <div>
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2 border-l-2 border-teal-600 pl-2">
                3. Heavy Metals, Toxins & Chemical Contaminants
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-semibold uppercase text-[10px]">
                      <th className="py-2 px-3">Analyte Contaminant</th>
                      <th className="py-2 px-3">Unit</th>
                      <th className="py-2 px-3">Method Reference</th>
                      <th className="py-2 px-3">Max Allowed Ceiling</th>
                      <th className="py-2 px-3">Observed Level</th>
                      <th className="py-2 px-3 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {existingCOA.testResults.heavyMetals.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-800">{row.parameter}</td>
                        <td className="py-2 px-3 text-slate-500">{row.unit}</td>
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{row.method}</td>
                        <td className="py-2 px-3 text-slate-600">{row.specification}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{row.observed}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-600">{row.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Verdict Box */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs">
            <span className="font-bold text-emerald-900 uppercase text-[10px] tracking-wider block">
              Official Quality Verdict
            </span>
            <p className="font-bold text-emerald-800 text-sm mt-0.5">
              {existingCOA.overallVerdict}
            </p>
          </div>

          {/* Signatures & Seal Section */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                Laboratory Operations Verification
              </span>
              <p className="font-semibold text-slate-800">Analytical Chemistry & Microbiology Team</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Verified against ISO/IEC 17025 standard procedures.
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                Authorized QA Sign-Off
              </span>
              <p className="font-bold text-slate-900 text-sm">{existingCOA.issuedByName}</p>
              <p className="text-[11px] text-teal-700 font-medium">
                Quality Assurance & Regulatory Compliance Head
              </p>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                Date of Certification: {formatDate(existingCOA.issueDate)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
          <FileCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800">Certificate Not Yet Generated</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isBatchApproved
              ? 'This batch is fully approved. An authorized Quality Manager can click "Issue & Sign COA" to generate the document.'
              : 'COA issuance is locked until all analytical tests are completed, reviewed, and approved.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default COAGenerationPage;
