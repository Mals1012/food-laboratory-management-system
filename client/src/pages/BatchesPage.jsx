import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  GitCommitHorizontal,
  FileCheck,
  Calendar,
  Thermometer,
  Package,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { batchService } from '../services/batchService';
import { useAuth } from '../hooks/useAuth';
import { formatDate, calculateShelfLife, getStatusBadgeClass } from '../utils/formatters';

const BatchesPage = () => {
  const { user, canManageBatches } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [batches, setBatches] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'All');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [page, setPage] = useState(1);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [viewingBatch, setViewingBatch] = useState(null);
  const [viewingDetailsData, setViewingDetailsData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    batchId: '',
    productName: '',
    productCategory: 'Dairy & Milk Products',
    manufacturingDate: '',
    expiryDate: '',
    storageTemperature: '4°C ± 2°C',
    storageHumidity: '< 65% RH',
    storageConditions: 'Refrigerated (2-8°C)',
    description: '',
    quantity: 1000,
    unit: 'kg',
    sampleLocation: 'Main Plant Processing Line 1',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'All',
    'Dairy & Milk Products',
    'Bakery & Confectionery',
    'Beverages & Juices',
    'Canned & Preserved Foods',
    'Meat, Poultry & Seafood',
    'Cereals, Grains & Pulses',
    'Oils, Fats & Dressings',
    'Snacks & Savory Foods',
  ];

  const statuses = ['All', 'Registered', 'Under Lab Testing', 'Approved', 'Quarantined', 'Rejected'];

  const storageOptions = [
    'Ambient (18-25°C)',
    'Refrigerated (2-8°C)',
    'Frozen (-18°C or below)',
    'Controlled Dry & Cool',
    'Aseptic Sealed',
  ];

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm || undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        page,
        limit: 10,
      };
      const res = await batchService.getBatches(params);
      if (res.success) {
        setBatches(res.data);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [searchTerm, selectedStatus, selectedCategory, page]);

  const handleOpenCreate = () => {
    setEditingBatch(null);
    setFormData({
      batchId: '',
      productName: '',
      productCategory: 'Dairy & Milk Products',
      manufacturingDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      storageTemperature: '4°C ± 2°C',
      storageHumidity: '< 65% RH',
      storageConditions: 'Refrigerated (2-8°C)',
      description: '',
      quantity: 1000,
      unit: 'kg',
      sampleLocation: 'Main Plant Processing Line 1',
    });
    setFormError('');
    setShowCreateModal(true);
  };

  const handleOpenEdit = (batch) => {
    setEditingBatch(batch);
    setFormData({
      batchId: batch.batchId,
      productName: batch.productName,
      productCategory: batch.productCategory,
      manufacturingDate: batch.manufacturingDate ? new Date(batch.manufacturingDate).toISOString().split('T')[0] : '',
      expiryDate: batch.expiryDate ? new Date(batch.expiryDate).toISOString().split('T')[0] : '',
      storageTemperature: batch.storageTemperature || '',
      storageHumidity: batch.storageHumidity || '',
      storageConditions: batch.storageConditions || 'Ambient (18-25°C)',
      description: batch.description || '',
      quantity: batch.quantity || 1000,
      unit: batch.unit || 'kg',
      status: batch.status,
      quarantineReason: batch.quarantineReason || '',
    });
    setFormError('');
    setShowCreateModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productName.trim() || !formData.manufacturingDate || !formData.expiryDate) {
      setFormError('Please fill in all mandatory fields.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      if (editingBatch) {
        await batchService.updateBatch(editingBatch._id, formData);
      } else {
        await batchService.createBatch(formData);
      }

      setShowCreateModal(false);
      fetchBatches();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving batch details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetails = async (batch) => {
    setViewingBatch(batch);
    try {
      setDetailsLoading(true);
      const res = await batchService.getBatchById(batch.batchId);
      if (res.success) {
        setViewingDetailsData(res.data);
      }
    } catch (err) {
      console.error('Error fetching details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-teal-600" />
            Food Batch Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Register, monitor inspection statuses, and manage food lots across all production facilities.
          </p>
        </div>

        {canManageBatches() && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-sm shadow-teal-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Batch</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Batch ID, Product Name, or Lot Notes..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Category Dropdown */}
        <div className="w-full md:w-56">
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

        {/* Status Dropdown */}
        <div className="w-full md:w-48">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                Status: {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Batch Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Batch ID</th>
                <th className="py-3.5 px-4">Product Details</th>
                <th className="py-3.5 px-4">Manufacturing / Expiry</th>
                <th className="py-3.5 px-4">Remaining Shelf-Life</th>
                <th className="py-3.5 px-4">Batch Size</th>
                <th className="py-3.5 px-4">Quality Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-teal-500/20 border-t-teal-600 rounded-full animate-spin mx-auto mb-2" />
                    Loading batches...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No batches match the selected criteria.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => {
                  const shelf = calculateShelfLife(batch.expiryDate);
                  return (
                    <tr key={batch._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {batch.batchId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{batch.productName}</div>
                        <div className="text-[10px] text-slate-400">{batch.productCategory}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div>Mfg: {formatDate(batch.manufacturingDate)}</div>
                        <div className="text-[10px] text-slate-400">
                          Exp: {formatDate(batch.expiryDate)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${shelf.color}`}
                        >
                          {shelf.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {batch.quantity} {batch.unit}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(
                            batch.status
                          )}`}
                        >
                          {batch.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetails(batch)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                            title="View Batch Details & Tests"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canManageBatches() && (
                            <button
                              onClick={() => handleOpenEdit(batch)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit Batch"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          <Link
                            to={`/traceability?batchId=${batch.batchId}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                            title="View Traceability Timeline"
                          >
                            <GitCommitHorizontal className="w-4 h-4" />
                          </Link>

                          {batch.status === 'Approved' && (
                            <Link
                              to={`/coa?batchId=${batch.batchId}`}
                              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                              title="View Certificate of Analysis"
                            >
                              <FileCheck className="w-4 h-4" />
                            </Link>
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

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {batches.length} of {total} batches
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

      {/* Create / Edit Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingBatch ? `Edit Batch: ${editingBatch.batchId}` : 'Register Food Batch'}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Enter food production lot and storage specifications
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

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batch ID (Leave empty to auto-generate)
                  </label>
                  <input
                    type="text"
                    value={formData.batchId}
                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                    placeholder="e.g. BATCH-2026-1044"
                    disabled={!!editingBatch}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Category *
                  </label>
                  <select
                    value={formData.productCategory}
                    onChange={(e) => setFormData({ ...formData, productCategory: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="e.g. Ultra-Pasteurised Organic Whole Milk 3.5%"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Manufacturing Date *
                  </label>
                  <input
                    type="date"
                    value={formData.manufacturingDate}
                    onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Storage Conditions
                  </label>
                  <select
                    value={formData.storageConditions}
                    onChange={(e) => setFormData({ ...formData, storageConditions: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    {storageOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Temperature (°C)
                  </label>
                  <input
                    type="text"
                    value={formData.storageTemperature}
                    onChange={(e) => setFormData({ ...formData, storageTemperature: e.target.value })}
                    placeholder="4°C ± 2°C"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Storage Humidity
                  </label>
                  <input
                    type="text"
                    value={formData.storageHumidity}
                    onChange={(e) => setFormData({ ...formData, storageHumidity: e.target.value })}
                    placeholder="< 65% RH"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batch Size / Quantity
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-24 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    >
                      <option value="kg">kg</option>
                      <option value="L">L</option>
                      <option value="units">units</option>
                      <option value="cartons">cartons</option>
                      <option value="tonnes">tonnes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sampling Station Location
                  </label>
                  <input
                    type="text"
                    value={formData.sampleLocation}
                    onChange={(e) => setFormData({ ...formData, sampleLocation: e.target.value })}
                    placeholder="Silo Valve 2 / Line 1 Conveyor"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Status Selector when Editing */}
              {editingBatch && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Batch Quality Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    {statuses.filter((s) => s !== 'All').map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>

                  {formData.status === 'Quarantined' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-rose-700 mt-2 mb-1">
                        Quarantine Justification / Reason *
                      </label>
                      <input
                        type="text"
                        value={formData.quarantineReason}
                        onChange={(e) => setFormData({ ...formData, quarantineReason: e.target.value })}
                        placeholder="e.g. Suspected microbiological contamination / elevated histamine"
                        className="w-full px-3 py-1.5 border border-rose-200 rounded-xl text-xs"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lot Description / Raw Material Notes
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="2"
                  placeholder="Additional production notes, formulation details, or silo tracking identifiers..."
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
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  {submitting ? 'Saving...' : editingBatch ? 'Update Batch' : 'Register Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Details Modal */}
      {viewingBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-slate-900">
                    {viewingBatch.batchId}
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeClass(
                      viewingBatch.status
                    )}`}
                  >
                    {viewingBatch.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-700 mt-0.5">
                  {viewingBatch.productName}
                </h3>
              </div>
              <button
                onClick={() => {
                  setViewingBatch(null);
                  setViewingDetailsData(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailsLoading ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <div className="w-6 h-6 border-2 border-teal-500/20 border-t-teal-600 rounded-full animate-spin mx-auto mb-2" />
                Retrieving batch records and laboratory tests...
              </div>
            ) : viewingDetailsData ? (
              <div className="mt-6 space-y-6">
                {/* Meta details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/70 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Category</span>
                    <p className="font-semibold text-slate-800">{viewingBatch.productCategory}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Batch Size</span>
                    <p className="font-semibold text-slate-800">
                      {viewingBatch.quantity} {viewingBatch.unit}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Mfg Date</span>
                    <p className="font-semibold text-slate-800">
                      {formatDate(viewingBatch.manufacturingDate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Expiry Date</span>
                    <p className="font-semibold text-slate-800">
                      {formatDate(viewingBatch.expiryDate)}
                    </p>
                  </div>
                </div>

                {/* Storage & Sampling Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Storage Regimen</span>
                    <p className="font-medium text-slate-700 mt-0.5">{viewingBatch.storageConditions}</p>
                    <p className="text-[11px] text-slate-500">{viewingBatch.storageTemperature}</p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Sampling Station</span>
                    <p className="font-medium text-slate-700 mt-0.5">{viewingBatch.sampleLocation}</p>
                    <p className="text-[11px] text-slate-500">{formatDate(viewingBatch.samplingDate)}</p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Registered By</span>
                    <p className="font-medium text-slate-700 mt-0.5">
                      {viewingDetailsData.batch.createdBy?.fullName || 'Production Staff'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {viewingDetailsData.batch.createdBy?.department}
                    </p>
                  </div>
                </div>

                {viewingBatch.quarantineReason && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                    <strong className="block font-bold">Quarantine Notice:</strong>
                    {viewingBatch.quarantineReason}
                  </div>
                )}

                {/* Associated Lab Tests */}
                <div>
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                    <span>Associated Laboratory Tests ({viewingDetailsData.tests?.length || 0})</span>
                    <Link
                      to={`/testing?batchId=${viewingBatch.batchId}`}
                      className="text-teal-600 hover:underline normal-case font-medium text-xs"
                    >
                      Open in Testing Module &rarr;
                    </Link>
                  </h4>

                  {viewingDetailsData.tests?.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                      No analytical tests assigned yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {viewingDetailsData.tests.map((test) => (
                        <div
                          key={test._id}
                          className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold font-mono text-slate-900">
                                {test.testId}
                              </span>
                              <span className="font-semibold text-slate-700">
                                {test.testCategory}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Analyst: {test.analystName} &bull; Parameters evaluated:{' '}
                              {test.parameters?.length || 0}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(
                                test.overallOutcome
                              )}`}
                            >
                              {test.overallOutcome}
                            </span>
                            <Link
                              to={`/testing?search=${test.testId}`}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium"
                            >
                              Details
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Quick Links */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/traceability?batchId=${viewingBatch.batchId}`}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1.5"
                  >
                    <GitCommitHorizontal className="w-4 h-4" />
                    <span>View Traceability Lifecycle</span>
                  </Link>

                  {viewingBatch.status === 'Approved' && (
                    <Link
                      to={`/coa?batchId=${viewingBatch.batchId}`}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>Open Certificate of Analysis (COA)</span>
                    </Link>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchesPage;
