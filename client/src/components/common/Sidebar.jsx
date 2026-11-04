import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  FlaskConical,
  ShieldCheck,
  ClockAlert,
  FileCheck,
  GitCommitHorizontal,
  History,
  Users,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getRoleBadgeClass } from '../../utils/formatters';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user, canManageUsers, canReviewQA } = useAuth();

  const navigation = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Food Batches', path: '/batches', icon: Boxes },
    { name: 'Quality Testing', path: '/testing', icon: FlaskConical },
    { name: 'QA Review & Release', path: '/qa-review', icon: ShieldCheck, highlight: canReviewQA() },
    { name: 'Expiry Monitoring', path: '/expiry-monitoring', icon: ClockAlert },
    { name: 'Certificates (COA)', path: '/coa', icon: FileCheck },
    { name: 'Batch Traceability', path: '/traceability', icon: GitCommitHorizontal },
    { name: 'Specifications', path: '/specifications', icon: SlidersHorizontal },
    { name: 'Audit Trail', path: '/audit-trail', icon: History },
  ];

  if (canManageUsers()) {
    navigation.push({ name: 'User Management', path: '/users', icon: Users });
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 shrink-0">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                FoodLab <span className="text-teal-400 text-xs font-semibold px-1.5 py-0.5 rounded bg-teal-950 border border-teal-800/50">LIMS</span>
              </span>
              <span className="text-[11px] text-slate-400 truncate">Enterprise Quality Hub</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-900/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
              {!isCollapsed && item.highlight && (
                <span className="ml-auto w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Status Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/30">
        <div
          className={`flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-teal-400 text-sm shrink-0 border border-slate-600/50">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
              <span
                className={`inline-block px-1.5 py-0.5 mt-0.5 text-[10px] font-medium rounded border ${getRoleBadgeClass(
                  user?.role
                )}`}
              >
                {user?.role}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
