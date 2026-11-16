import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  ShieldCheck,
  Lock,
  Clock,
  User,
  AlertCircle,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';

export const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const loadLogs = async () => {
    setLoading(true);
    const res = await adminApi.getAuditLogs();
    if (res.success) {
      setLogs(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = logs.filter((l) => {
    const matchesSearch =
      l.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.reason && l.reason.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesEntity = entityFilter === 'ALL' || l.entityType === entityFilter;
    return matchesSearch && matchesEntity;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <h2 className="text-lg font-serif font-bold text-cream-100 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <span>Tamper-Evident Administrative Audit Trail</span>
          </h2>
          <p className="text-xs text-stone-400 font-sans mt-0.5">
            Immutable administrative records capturing verification decisions, account throttling, refund approvals, and policy adjustments.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
            <input
              type="text"
              placeholder="Search audit ID, action, admin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#221C1A] border border-stone-800 text-xs text-stone-200 pl-8 pr-3 py-1.5 rounded-lg placeholder-stone-500 focus:outline-none focus:border-amber-500 w-48 sm:w-64"
            />
          </div>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-[#221C1A] border border-stone-800 text-xs text-stone-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Entities</option>
            <option value="LAWYER_PROFILE">Advocate Profiles</option>
            <option value="LAW_FIRM">Law Firms</option>
            <option value="CLIENT_PROFILE">Client Profiles</option>
            <option value="REFUND_TRANSACTION">Refunds</option>
            <option value="SETTLEMENT_PAYOUT">Payouts</option>
            <option value="CONFIGURATION">System Config</option>
          </select>
        </div>
      </div>

      {/* Security Assurance Banner */}
      <div className="p-3.5 rounded-xl border border-stone-800 bg-stone-900/60 text-[11px] text-stone-400 flex items-start space-x-2.5 leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-cream-100">Audit Immutability &amp; Privacy Safeguards:</strong> Under Bar Council confidentiality and administrative compliance protocols, audit records are append-only. Passwords, JWT secrets, payment tokens, and client case materials are strictly sanitized and never recorded.
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl border border-stone-800 bg-[#221C1A] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-900/80 text-[10px] font-mono uppercase tracking-wider text-stone-400">
                <th className="py-3 px-4">Audit ID &amp; Time</th>
                <th className="py-3 px-4">Operator / Admin</th>
                <th className="py-3 px-4">Administrative Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Operational Details</th>
                <th className="py-3 px-4">Audit Reason</th>
                <th className="py-3 px-4">Correlation Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80 font-mono text-[11px]">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-stone-800/40 transition">
                  <td className="py-3 px-4 text-stone-400">
                    <p className="font-bold text-cream-100">{log.id}</p>
                    <p className="text-[10px] text-stone-500">{new Date(log.timestamp).toLocaleString()}</p>
                  </td>
                  <td className="py-3 px-4 text-stone-300">
                    <p className="font-bold text-cream-100">{log.adminName}</p>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-900 border border-stone-700 text-amber-400">
                      {log.adminRole}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold text-amber-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-300">
                      {log.entityType} #{log.entityId}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-stone-300 font-sans">{log.details}</td>
                  <td className="py-3 px-4 text-stone-400 font-sans max-w-xs truncate">{log.reason}</td>
                  <td className="py-3 px-4 text-stone-500 text-[10px]">{log.correlationId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
