import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, X, CheckCircle2, Clock } from 'lucide-react';

export const Level2ChangeModal = ({
  isOpen,
  onClose,
  fieldLabel,
  currentValue,
  onSubmit,
}) => {
  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');
  const [driveProofLink, setDriveProofLink] = useState('');

  if (!isOpen) return null;

  const isDocumentRequired =
    fieldLabel.toLowerCase().includes('bar') ||
    fieldLabel.toLowerCase().includes('enrollment') ||
    fieldLabel.toLowerCase().includes('degree') ||
    fieldLabel.toLowerCase().includes('education') ||
    fieldLabel.toLowerCase().includes('college') ||
    fieldLabel.toLowerCase().includes('university') ||
    fieldLabel.toLowerCase().includes('registration') ||
    fieldLabel.toLowerCase().includes('llp') ||
    fieldLabel.toLowerCase().includes('document') ||
    fieldLabel.toLowerCase().includes('certificate');

  const isEmailOrPhone =
    fieldLabel.toLowerCase().includes('email') ||
    fieldLabel.toLowerCase().includes('phone') ||
    fieldLabel.toLowerCase().includes('mobile');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newValue.trim()) return;
    onSubmit({
      fieldLabel,
      currentValue,
      newValue: newValue.trim(),
      reason: reason.trim(),
      driveProofLink: isDocumentRequired ? driveProofLink.trim() : '',
    });
    setNewValue('');
    setReason('');
    setDriveProofLink('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-stone-200 shadow-2xl animate-in fade-in zoom-in-95 text-xs">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-stone-900">
                Request Modification: {fieldLabel}
              </h3>
              <p className="text-[10px] font-mono text-amber-700 uppercase tracking-wider font-semibold">
                Protected Legal Record // Requires Admin Verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative Rule Notice */}
        <div className="my-3.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 space-y-1">
          <p className="font-semibold text-[11px] flex items-center space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Dual-Record Verification Architecture</span>
          </p>
          <p className="text-[10px] leading-relaxed text-amber-800">
            This field is governed by statutory bar credentials. Submitting a change creates a pending verification request. <strong>Your existing verified value will remain active on your public profile</strong> until the Platform Compliance Officer approves the replacement.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Current Verified Value */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1">
              Current Verified Value
            </label>
            <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200 font-mono text-xs text-stone-800 font-semibold flex items-center justify-between">
              <span>{currentValue || 'None on record'}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-100 text-emerald-800 font-bold">
                ACTIVE
              </span>
            </div>
          </div>

          {/* Proposed New Value */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-800 mb-1">
              Proposed New Value <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={`Enter new ${fieldLabel.toLowerCase()}...`}
              className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[var(--bg-primary)] focus:ring-1 focus:ring-[var(--bg-primary)]"
              autoFocus
            />
          </div>

          {/* Reason for Change */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-800 mb-1">
              Reason for Amendment <span className="text-rose-600">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. State Bar Council transfer from Bar Council of Maharashtra to Delhi, official Gazette name change, etc."
              className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[var(--bg-primary)]"
            />
          </div>

          {/* Supporting Google Drive Verification Link - ONLY for Education & Bar / Entity Documents */}
          {isDocumentRequired ? (
            <div>
              <label className="block text-[11px] font-semibold text-stone-800 mb-1">
                Supporting Verification Link (Google Drive Folder)
              </label>
              <input
                type="url"
                value={driveProofLink}
                onChange={(e) => setDriveProofLink(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 font-mono focus:outline-none focus:border-[var(--bg-primary)]"
              />
              <p className="text-[10px] text-stone-500 mt-1">
                Required only for degree qualifications or Bar Council statutory certificates. Drive links are strictly confidential.
              </p>
            </div>
          ) : isEmailOrPhone ? (
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-[11px] flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                No documents required. A verification code / OTP confirmation will be dispatched to validate this contact change.
              </span>
            </div>
          ) : null}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Submit for Verification</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
