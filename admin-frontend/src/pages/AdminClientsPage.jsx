import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Calendar,
  CreditCard,
  LifeBuoy,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';

export const AdminClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Detail & Action Modals
  const [selectedClient, setSelectedClient] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { client, actionType: 'RESTRICT' | 'SUSPEND' | 'ACTIVATE' }
  const [actionReason, setActionReason] = useState('');
  const [newNoteText, setNewNoteText] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const loadClients = async () => {
    setLoading(true);
    const res = await adminApi.getClients();
    if (res.success) {
      setClients(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      (c.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.clientId || c.publicId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone || '').includes(searchQuery);

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExecuteStatusChange = async (e) => {
    e.preventDefault();
    if (!actionModal || !actionReason.trim()) return;

    const targetStatus =
      actionModal.actionType === 'SUSPEND'
        ? 'SUSPENDED'
        : actionModal.actionType === 'RESTRICT'
        ? 'RESTRICTED'
        : 'ACTIVE';

    await adminApi.updateClientStatus(actionModal.client.publicId, targetStatus, actionReason.trim());
    setToastMessage(`Client ${actionModal.client.fullName} set to [${targetStatus}]. Audit record created.`);
    setActionModal(null);
    setActionReason('');
    loadClients();
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!selectedClient || !newNoteText.trim()) return;
    await adminApi.addClientNote(selectedClient.publicId, newNoteText.trim());
    setNewNoteText('');
    loadClients();
    // Update local selected client
    setSelectedClient((prev) => ({
      ...prev,
      internalNotes: [
        { id: `note-${Date.now()}`, author: 'Platform Admin', date: new Date().toISOString(), text: newNoteText.trim() },
        ...(prev.internalNotes || []),
      ],
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="p-3.5 px-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button type="button" onClick={() => setToastMessage('')} className="text-emerald-400 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <h2 className="text-lg font-serif font-bold text-cream-100 flex items-center space-x-2">
            <Users className="w-5 h-5 text-amber-500" />
            <span>Client Account Governance</span>
          </h2>
          <p className="text-xs text-stone-400 font-sans mt-0.5">
            Monitor client accounts, verify KYC status, audit appointment history, and enforce platform compliance.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
            <input
              type="text"
              placeholder="Search by name, email, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#221C1A] border border-stone-800 text-xs text-stone-200 pl-8 pr-3 py-1.5 rounded-lg placeholder-stone-500 focus:outline-none focus:border-amber-500 w-48 sm:w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#221C1A] border border-stone-800 text-xs text-stone-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="RESTRICTED">Restricted Only</option>
            <option value="SUSPENDED">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Clients Data Table */}
      <div className="rounded-2xl border border-stone-800 bg-[#221C1A] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-900/80 text-[10px] font-mono uppercase tracking-wider text-stone-400">
                <th className="py-3 px-4">Client ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">KYC / Verification</th>
                <th className="py-3 px-4">Consultations</th>
                <th className="py-3 px-4">Wallet Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500 font-sans">
                    <Users className="w-8 h-8 mx-auto text-stone-600 mb-2 opacity-50" />
                    <p className="font-semibold text-stone-400">No client accounts match your criteria</p>
                    <p className="text-[11px] text-stone-600 mt-0.5">Try adjusting search filters or status parameters.</p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                const isRestricted = client.status === 'RESTRICTED';
                const isSuspended = client.status === 'SUSPENDED';

                return (
                  <tr key={client.publicId} className="hover:bg-stone-800/40 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-400">{client.clientId}</td>
                    <td className="py-3 px-4">
                      <p className="font-serif font-bold text-cream-100">{client.fullName}</p>
                      <p className="text-[10px] font-mono text-stone-500">@{client.username}</p>
                    </td>
                    <td className="py-3 px-4 text-stone-300">
                      <p>{client.email}</p>
                      <p className="text-[10px] text-stone-500 font-mono">{client.phone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-900 border border-stone-700 text-stone-300">
                        {client.verificationLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-stone-300">
                      {client.totalAppointments} sessions
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-amber-400">
                      ₹{(Number(client.walletBalance) || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                          isSuspended
                            ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                            : isRestricted
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        {client.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedClient(client)}
                        className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-medium transition cursor-pointer"
                      >
                        Inspect
                      </button>

                      {client.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          onClick={() => setActionModal({ client, actionType: 'RESTRICT' })}
                          className="px-2.5 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900 text-amber-300 text-[11px] border border-amber-800/60 transition cursor-pointer"
                        >
                          Restrict
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActionModal({ client, actionType: 'ACTIVATE' })}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 text-[11px] border border-emerald-800/60 transition cursor-pointer"
                        >
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Details Drawer / Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E1917] border border-stone-700 rounded-3xl max-w-2xl w-full p-6 text-xs text-stone-300 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-stone-800">
              <div>
                <h3 className="font-serif font-bold text-base text-cream-50">{selectedClient.fullName}</h3>
                <p className="text-[11px] font-mono text-stone-400">
                  {selectedClient.clientId} • Registered {new Date(selectedClient.registrationDate || selectedClient.registeredDate || Date.now()).toLocaleDateString('en-IN')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClient(null)}
                className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Account Status & Credentials */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-[11px]">
              <div className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800">
                <span className="text-stone-500 block text-[9px] uppercase">Account Status</span>
                <span className="font-bold text-cream-100">{selectedClient.status}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800">
                <span className="text-stone-500 block text-[9px] uppercase">KYC Level</span>
                <span className="font-bold text-emerald-400">{selectedClient.verificationLevel}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800">
                <span className="text-stone-500 block text-[9px] uppercase">Wallet Balance</span>
                <span className="font-bold text-amber-400">₹{selectedClient.walletBalance.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800">
                <span className="text-stone-500 block text-[9px] uppercase">Consultations</span>
                <span className="font-bold text-cream-100">{selectedClient.totalAppointments} Completed</span>
              </div>
            </div>

            {/* Contact details */}
            <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1">
              <p className="font-semibold text-stone-300">Contact Information</p>
              <p className="text-[11px] text-stone-400">Email: {selectedClient.email}</p>
              <p className="text-[11px] text-stone-400">Phone: {selectedClient.phone}</p>
              <p className="text-[11px] text-stone-400">Jurisdiction: {selectedClient.city}, {selectedClient.state}</p>
            </div>

            {/* Internal Admin Notes */}
            <div className="space-y-2">
              <p className="font-semibold text-stone-300 font-serif">Administrative Notes (Internal Only)</p>
              {selectedClient.internalNotes?.length === 0 ? (
                <p className="text-[11px] text-stone-500 italic">No administrative notes recorded for this account.</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedClient.internalNotes?.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-[11px]">
                      <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 mb-0.5">
                        <span>{n.author}</span>
                        <span>{n.date}</span>
                      </div>
                      <p className="text-stone-300">{n.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Note Input */}
              <form onSubmit={handleAddNote} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add confidential compliance or dispute note..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={!newNoteText.trim()}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-stone-950 font-bold text-xs"
                >
                  Save Note
                </button>
              </form>
            </div>

            <div className="pt-2 border-t border-stone-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedClient(null)}
                className="px-4 py-1.5 rounded-xl bg-stone-800 text-stone-300 hover:bg-stone-700"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal (Suspend / Restrict / Activate) */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E1917] border border-amber-800/80 rounded-2xl max-w-md w-full p-5 text-xs text-stone-300 shadow-2xl space-y-3">
            <h3 className="font-serif font-bold text-sm text-cream-50">
              Confirm {actionModal.actionType} Action for {actionModal.client.fullName}
            </h3>
            <p className="text-[11px] text-stone-400">
              This action modifies platform access rights and is recorded in the permanent administrative audit log.
            </p>

            <form onSubmit={handleExecuteStatusChange} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">
                  Mandatory Audit Reason
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="State clear operational reason (e.g. repeated unexcused session no-shows, KYC mismatch)..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-700 text-stone-400 hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!actionReason.trim()}
                  className={`px-4 py-1.5 rounded-xl font-bold text-xs ${
                    actionModal.actionType === 'SUSPEND'
                      ? 'bg-rose-700 hover:bg-rose-800 text-white'
                      : 'bg-amber-600 hover:bg-amber-700 text-stone-950'
                  }`}
                >
                  Confirm &amp; Log Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
