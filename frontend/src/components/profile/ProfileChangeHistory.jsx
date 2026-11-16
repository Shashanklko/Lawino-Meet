import React, { useState } from 'react';
import {
  History,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  ShieldAlert,
  ArrowRight,
  FileText,
} from 'lucide-react';

export const ProfileChangeHistory = ({ history = [], title = 'Profile Audit Trail & Change Ledger' }) => {
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'UNDER_REVIEW' | 'APPROVED'

  const filteredHistory = history.filter((item) => {
    if (filterTab === 'UNDER_REVIEW') return item.status === 'UNDER_REVIEW';
    if (filterTab === 'APPROVED') return item.status === 'APPROVED' || item.status === 'UPDATED';
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Approved</span>
          </span>
        );
      case 'UPDATED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>Updated (L1)</span>
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Under Review</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-stone-100 text-stone-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div>
          <h4 className="font-serif font-bold text-sm text-stone-900 flex items-center space-x-2">
            <History className="w-4 h-4 text-[var(--bg-primary)]" />
            <span>{title}</span>
          </h4>
          <p className="text-[11px] text-stone-500 font-sans mt-0.5">
            Tamper-evident record of all self-service adjustments and verified credentials modifications.
          </p>
        </div>

        <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl text-[11px] font-medium shrink-0">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              filterTab === 'ALL'
                ? 'bg-white text-stone-900 font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Logs ({history.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('UNDER_REVIEW')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              filterTab === 'UNDER_REVIEW'
                ? 'bg-white text-amber-900 font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Pending Review ({history.filter((h) => h.status === 'UNDER_REVIEW').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('APPROVED')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              filterTab === 'APPROVED'
                ? 'bg-white text-emerald-900 font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Approved ({history.filter((h) => h.status === 'APPROVED' || h.status === 'UPDATED').length})
          </button>
        </div>
      </div>

      {/* Audit Table */}
      {filteredHistory.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-stone-50 border border-stone-200 text-stone-500 text-xs">
          No change records match this filter.
        </div>
      ) : (
        <div className="border border-stone-200 rounded-2xl bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-serif border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Date &amp; Time</th>
                  <th className="py-2.5 px-4 font-semibold">Field Name</th>
                  <th className="py-2.5 px-4 font-semibold">Previous Value</th>
                  <th className="py-2.5 px-4 font-semibold">New Value</th>
                  <th className="py-2.5 px-4 font-semibold">Review Status</th>
                  <th className="py-2.5 px-4 font-semibold">Level / Reviewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/50 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-600 whitespace-nowrap">
                      {item.date}
                    </td>

                    <td className="py-3 px-4 font-semibold text-stone-900 whitespace-nowrap">
                      {item.field}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-stone-500 max-w-[140px] truncate" title={item.oldValue}>
                      {item.oldValue || '—'}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-stone-900 font-bold max-w-[160px] truncate" title={item.newValue}>
                      <span className="text-[var(--bg-primary)]">{item.newValue}</span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    <td className="py-3 px-4 text-[11px] text-stone-600">
                      <div className="flex flex-col">
                        <span className="font-semibold text-stone-800">
                          {item.level?.replace(/Level \d\s*/i, '') || 'Standard Update'}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">{item.reviewer || 'Self (Standard Update)'}</span>
                      </div>
                      {item.remarks && (
                        <p className="text-[10px] text-stone-500 italic mt-0.5 max-w-xs">
                          &ldquo;{item.remarks}&rdquo;
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
