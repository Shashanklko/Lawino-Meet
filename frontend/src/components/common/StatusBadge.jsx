import React from 'react';

const statusStyles = {
  // Appointment statuses
  PENDING: 'bg-amber-100 text-amber-800 border-amber-300',
  CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  CANCELLED: 'bg-rose-100 text-rose-800 border-rose-300',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-300',
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
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-300',
};

export const StatusBadge = ({ status, className = '' }) => {
  const style = statusStyles[status] || 'bg-slate-100 text-slate-800 border-slate-300';
  const label = status ? status.replace(/_/g, ' ') : 'UNKNOWN';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style} ${className}`}
    >
      {label}
    </span>
  );
};
