import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const statusStyles = {
  // Appointment statuses
  PENDING: 'bg-amber-100 text-amber-800 border-amber-300',
  AWAITING_PAYMENT: 'bg-amber-100 text-amber-900 border-amber-300 font-medium',
  CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  COMPLETION_REQUESTED: 'bg-purple-100 text-purple-900 border-purple-300 font-semibold',
  DISPUTED: 'bg-rose-100 text-rose-900 border-rose-300 font-bold animate-pulse',
  UNDER_REVIEW: 'bg-amber-100 text-amber-900 border-amber-300 font-medium',
  CANCELLED: 'bg-rose-100 text-rose-800 border-rose-300',
  REJECTED: 'bg-stone-200 text-stone-800 border-stone-300',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-300 font-medium',
  EXPIRED: 'bg-slate-100 text-slate-700 border-slate-300',

  // Slot statuses
  AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RESERVED: 'bg-slate-100 text-slate-500 border-slate-200',

  // Meeting statuses
  WAITING: 'bg-amber-100 text-amber-800 border-amber-300',
  ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse',
  ENDED: 'bg-slate-100 text-slate-700 border-slate-300',

  // Firm member statuses
  INVITED: 'bg-amber-100 text-amber-800 border-amber-300',
  ACCEPTED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

export const StatusBadge = ({ status, className = '' }) => {
  const { t } = useLanguage();
  const style = statusStyles[status] || 'bg-slate-100 text-slate-800 border-slate-300';
  const customLabels = {
    COMPLETION_REQUESTED: 'Awaiting Confirmation',
    DISPUTED: 'Dispute On Hold',
    UNDER_REVIEW: 'Under Review',
    AWAITING_PAYMENT: 'Awaiting Payment',
    CONFIRMED: 'Confirmed',
    PENDING: 'Pending Approval',
    COMPLETED: 'Completed',
    AVAILABLE: 'Available',
    CANCELLED: 'Cancelled',
    REJECTED: 'Declined',
  };
  const label = customLabels[status] || (status ? status.replace(/_/g, ' ') : 'UNKNOWN');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style} ${className}`}
    >
      {t(label)}
    </span>
  );
};
