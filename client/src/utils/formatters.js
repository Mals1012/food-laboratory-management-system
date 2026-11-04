export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const calculateShelfLife = (expiryDate) => {
  if (!expiryDate) return { days: 0, label: 'Unknown', status: 'unknown' };
  const now = new Date();
  const exp = new Date(expiryDate);
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return {
      days: diffDays,
      label: `Expired (${Math.abs(diffDays)}d ago)`,
      status: 'expired',
      color: 'bg-red-50 text-red-700 border-red-200',
    };
  } else if (diffDays <= 30) {
    return {
      days: diffDays,
      label: `${diffDays} days left`,
      status: 'warning',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  } else {
    return {
      days: diffDays,
      label: `${diffDays} days left`,
      status: 'good',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
};

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Approved':
    case 'Pass':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20';
    case 'Quarantined':
    case 'Fail':
    case 'Rejected':
      return 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/20';
    case 'Under Lab Testing':
    case 'Under Review':
    case 'Submitted':
      return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/20';
    case 'In Progress':
      return 'bg-sky-50 text-sky-700 border-sky-200 ring-1 ring-sky-500/20';
    case 'Registered':
    case 'Pending':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'Admin':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Quality Manager':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'Lab Manager':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Lab Analyst':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'Production Staff':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Viewer':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};
