import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  UserPlus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
} from 'lucide-react';
import { userApi } from '../api/userApi';
import { StatusBadge } from '../components/common/StatusBadge';

export const FirmAdminDashboardPage = () => {
  const [firms, setFirms] = useState([]);
  const [activeFirm, setActiveFirm] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invite advocate modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [lawyerUsername, setLawyerUsername] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchFirmData = async () => {
    setLoading(true);
    try {
      const res = await userApi.getFirms();
      if (res.success && res.data && res.data.length > 0) {
        const firm = res.data[0];
        setActiveFirm(firm);
        const membersRes = await userApi.getFirmMembers(firm.publicId);
        if (membersRes.success && membersRes.data) {
          setMembers(membersRes.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load firm data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFirmData();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!activeFirm || !lawyerUsername.trim()) return;

    setInviteLoading(true);
    setError('');
    setMessage('');

    try {
      await userApi.inviteLawyerToFirm(activeFirm.publicId, {
        lawyerUsername: lawyerUsername.trim(),
      });
      setMessage(`Invitation sent to @${lawyerUsername}`);
      setLawyerUsername('');
      setIsInviteModalOpen(false);
      await fetchFirmData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Firm Profile Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
            <Building className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {activeFirm?.name || 'Lex Veritas Legal LLP'}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Registration No: <span className="text-slate-800 font-semibold">{activeFirm?.registrationNumber || 'LLP-DEL-2024-981'}</span>
            </p>
            <p className="text-xs text-slate-500 mt-2 max-w-xl">
              {activeFirm?.description || 'Full-service corporate and litigation law firm practicing across legal chambers and specialized tribunals.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Advocate</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Lawyers Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Advocate Roster & Partners</span>
          </h2>
          <span className="text-xs text-slate-400">Total Advocates: {members.length}</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading firm roster...</div>
        ) : members.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-300" />
            <p>No advocates currently enrolled in this firm.</p>
            <p>Click "Invite Advocate" to onboard legal professionals.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Advocate</th>
                  <th className="p-3">Bar Registration</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Membership Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{member.lawyerName || member.username}</td>
                    <td className="p-3 font-mono text-slate-600">{member.barCouncilNumber || 'D/4512/2018'}</td>
                    <td className="p-3 text-slate-600">{member.role || 'ASSOCIATE'}</td>
                    <td className="p-3">
                      <StatusBadge status={member.status || 'ACCEPTED'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Advocate Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Invite Advocate to Firm</h3>
            <p className="text-xs text-slate-500">
              Enter the username or registered email of the advocate you wish to invite to join your firm.
            </p>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Advocate Username
                </label>
                <input
                  type="text"
                  required
                  value={lawyerUsername}
                  onChange={(e) => setLawyerUsername(e.target.value)}
                  placeholder="e.g. advocate_sharma"
                  className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
