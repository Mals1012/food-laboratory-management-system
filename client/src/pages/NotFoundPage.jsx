import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, FlaskConical } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center">
        <FlaskConical className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight font-mono">404</h1>
      <h2 className="text-lg font-bold text-slate-800">Laboratory Resource Not Found</h2>
      <p className="text-xs text-slate-500 max-w-sm">
        The requested batch, analysis record, or laboratory endpoint does not exist or has been relocated.
      </p>
      <Link
        to="/"
        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};

export default NotFoundPage;
