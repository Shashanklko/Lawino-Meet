import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MOCK_ENTERPRISE_FIRM } from '../data/mockData';
import { AdvocateProfileModule } from '../components/profile/AdvocateProfileModule';
import { FirmProfileModule } from '../components/profile/FirmProfileModule';
import { ClientProfileModule } from '../components/profile/ClientProfileModule';

export const ProfileSettingsPage = () => {
  const { user } = useAuth();
  const [toastMessage, setToastMessage] = useState('');

  const handleToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const isLawyer = user?.role === 'LAWYER';
  const isFirm = user?.role === 'FIRM_ADMIN';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[9999] max-w-md p-4 rounded-2xl bg-[#1C1817]/95 backdrop-blur-xl border border-amber-500/50 text-white shadow-2xl flex items-center justify-between space-x-3 animate-in slide-in-from-top-3">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium leading-relaxed">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-stone-400 hover:text-white text-xs font-bold shrink-0 ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Render Persona-Specific Profile Module (Strict Role Isolation) */}
      {isLawyer && (
        <AdvocateProfileModule user={user} onSaveToast={handleToast} />
      )}

      {isFirm && (
        <FirmProfileModule firmData={MOCK_ENTERPRISE_FIRM} onSaveToast={handleToast} />
      )}

      {!isLawyer && !isFirm && (
        <ClientProfileModule user={user} onSaveToast={handleToast} />
      )}
    </div>
  );
};
