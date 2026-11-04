import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Search,
  Filter,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Plus,
  Shield,
} from 'lucide-react';
import { specificationService } from '../services/specificationService';
import { useAuth } from '../hooks/useAuth';

const ProductSpecificationsPage = () => {
  const { canReviewQA } = useAuth();
  const [specs, setSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTestCat, setSelectedTestCat] = useState('All');

  // Edit Modal
  const [editingSpec, setEditingSpec] = useState(null);
  const [editParams, setEditParams] = useState([]);
  const [editVersion, setEditVersion] = useState('');
  const [editRef, setEditRef] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState({ text: '', type: '' });

  const categories = [
    'All',
    'Dairy & Milk Products',
    'Bakery & Confectionery',
    'Beverages & Juices',
    'Canned & Preserved Foods',
    'Meat, Poultry & Seafood',
    'Cereals, Grains & Pulses',
    'Snacks & Savory Foods',
  ];

  const testCategories = [
    'All',
    'Chemical Analysis',
    'Microbiological Testing',
    'Heavy Metals and Contaminants',
  ];

  const fetchSpecs = async () => {
    try {
      setLoading(true);
      const params = {
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        testCategory: selectedTestCat !== 'All' ? selectedTestCat : undefined,
      };
      const res = await specificationService.getSpecifications(params);
      if (res.success) {
        setSpecs(res.data);
      }
    } catch (err) {
      console.error('Error fetching specs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecs();
  }, [selectedCategory, selectedTestCat]);

  const handleOpenEdit = (spec) => {
    setEditingSpec(spec);
    setEditParams(JSON.parse(JSON.stringify(spec.parameters || [])));
    setEditVersion(spec.version || 'v2026.1');
    setEditRef(spec.regulatoryReference || '');
    setSaveMsg({ text: '', type: '' });
  };

  const handleParamFieldChange = (index, field, val) => {
    const updated = [...editParams];
    updated[index][field] = val;
    setEditParams(updated);
  };

  const handleSaveSpec = async (e) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      setSaveMsg({ text: '', type: '' });
      const res = await specificationService.updateSpecification(editingSpec._id, {
        parameters: editParams,
        version: editVersion,
        regulatoryReference: editRef,
      });
      if (res.success) {
        setSaveMsg({
          text: 'Regulatory limits and method standards updated successfully.',
          type: 'success',
        });
        fetchSpecs();
        setTimeout(() => setEditingSpec(null), 1000);
      }
    } catch (err) {
      setSaveMsg({
        text: err.response?.data?.message || 'Error updating specification.',
        type: 'error',
      });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <SlidersHorizontal className="w-6 h-6 text-teal-600" />
          Configurable Regulatory Product Specifications
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Standardized pass/fail specification limits, maximum residue thresholds, and validated AOAC/ISO test methods.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-72">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-64">
          <select
            value={selectedTestCat}
            onChange={(e) => setSelectedTestCat(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            {testCategories.map((t) => (
              <option key={t} value={t}>
                Test: {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Specifications Cards Grid */}
      {loading ? (
        <div className="py-24 text-center text-slate-400 text-xs">
          Loading regulatory specification profiles...
        </div>
      ) : specs.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200 text-xs">
          No specification profiles match the selected criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {specs.map((spec) => (
            <div
              key={spec._id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden"
            >
              {/* Profile Card Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {spec.productCategory}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                      {spec.testCategory}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Regulatory Mandate: <strong>{spec.regulatoryReference}</strong> &bull; Version:{' '}
                    <span className="font-mono">{spec.version}</span>
                  </p>
                </div>

                {canReviewQA() && (
                  <button
                    onClick={() => handleOpenEdit(spec)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>Edit Standard Limits</span>
                  </button>
                )}
              </div>

              {/* Parameters Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/30 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-100">
                      <th className="py-2.5 px-4">Parameter Analyte</th>
                      <th className="py-2.5 px-4">Unit</th>
                      <th className="py-2.5 px-4">Standard Method Reference</th>
                      <th className="py-2.5 px-4">Permitted Spec Limit</th>
                      <th className="py-2.5 px-4">Technical Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {spec.parameters?.map((p, pIdx) => {
                      let specStr = 'Conforms';
                      if (p.minLimit !== null && p.maxLimit !== null) {
                        specStr = `${p.minLimit} - ${p.maxLimit} ${p.unit}`;
                      } else if (p.minLimit !== null) {
                        specStr = `Min ${p.minLimit} ${p.unit}`;
                      } else if (p.maxLimit !== null) {
                        specStr = `Max ${p.maxLimit} ${p.unit}`;
                      } else if (p.textLimit) {
                        specStr = p.textLimit;
                      }

                      return (
                        <tr key={pIdx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-semibold text-slate-800">{p.name}</td>
                          <td className="py-2.5 px-4 text-slate-500">{p.unit}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-600 text-[11px]">
                            {p.standardMethod}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-teal-700">{specStr}</td>
                          <td className="py-2.5 px-4 text-slate-500 text-[11px]">{p.description}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Specification Modal */}
      {editingSpec && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Update Quality Specification Limits
                </h3>
                <p className="text-xs text-slate-500">
                  {editingSpec.productCategory} &bull; {editingSpec.testCategory}
                </p>
              </div>
              <button
                onClick={() => setEditingSpec(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveMsg.text && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  saveMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {saveMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{saveMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveSpec} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Regulatory Reference
                  </label>
                  <input
                    type="text"
                    value={editRef}
                    onChange={(e) => setEditRef(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Standard Version
                  </label>
                  <input
                    type="text"
                    value={editVersion}
                    onChange={(e) => setEditVersion(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">
                  Parameters & Threshold Ceilings
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
                        <th className="py-2.5 px-3">Parameter</th>
                        <th className="py-2.5 px-3">Unit</th>
                        <th className="py-2.5 px-3">Min Limit</th>
                        <th className="py-2.5 px-3">Max Limit</th>
                        <th className="py-2.5 px-3">Text Limit</th>
                        <th className="py-2.5 px-3">Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editParams.map((p, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-semibold text-slate-800">{p.name}</td>
                          <td className="py-2 px-3 text-slate-500">{p.unit}</td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              step="any"
                              value={p.minLimit ?? ''}
                              onChange={(e) =>
                                handleParamFieldChange(
                                  idx,
                                  'minLimit',
                                  e.target.value === '' ? null : parseFloat(e.target.value)
                                )
                              }
                              placeholder="Min"
                              className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              step="any"
                              value={p.maxLimit ?? ''}
                              onChange={(e) =>
                                handleParamFieldChange(
                                  idx,
                                  'maxLimit',
                                  e.target.value === '' ? null : parseFloat(e.target.value)
                                )
                              }
                              placeholder="Max"
                              className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={p.textLimit || ''}
                              onChange={(e) =>
                                handleParamFieldChange(idx, 'textLimit', e.target.value)
                              }
                              placeholder="e.g. Absent / 25g"
                              className="w-32 px-2 py-1 border border-slate-200 rounded-lg text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={p.standardMethod || ''}
                              onChange={(e) =>
                                handleParamFieldChange(idx, 'standardMethod', e.target.value)
                              }
                              className="w-36 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingSpec(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  {saveLoading ? 'Updating Specs...' : 'Save Regulatory Limits'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSpecificationsPage;
