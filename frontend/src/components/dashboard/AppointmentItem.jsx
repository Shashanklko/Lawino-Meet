import React from 'react';
import {
  Calendar,
  Clock,
  Video,
  Building,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
  MapPin,
  ExternalLink,
  ChevronRight,
  Info,
  CreditCard,
  AlertTriangle,
  Star,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { useLanguage } from '../../context/LanguageContext';

export const AppointmentItem = ({
  appointment,
  viewMode = 'CARD', // 'CARD' | 'ROW'
  role = 'CLIENT', // 'CLIENT' | 'LAWYER' | 'FIRM_ADMIN'
  onJoinCall,
  onStartRoom,
  onAccept,
  onReject,
  onPay,
  onCancel,
  onMarkCompleted,
  onConfirmCompletion,
  onReportDispute,
  onViewDetails,
  onOpenChat,
  onModifyTime,
}) => {
  const isLawyer = role === 'LAWYER';
  const isFirmAdmin = role === 'FIRM_ADMIN';
  const isClient = role === 'CLIENT';
  const { t } = useLanguage();

  const statusUpper = (appointment.status || appointment.appointmentStatus || '').toUpperCase();
  const isConfirmed = statusUpper === 'CONFIRMED';
  const isPending = statusUpper === 'PENDING';
  const isAwaitingPayment = statusUpper === 'AWAITING_PAYMENT';
  const isCompletionRequested = statusUpper === 'COMPLETION_REQUESTED';
  const isDisputed = statusUpper === 'DISPUTED';
  const isCompleted = statusUpper === 'COMPLETED';
  const isCancelled = statusUpper === 'CANCELLED';
  const isRejected = statusUpper === 'REJECTED';
  const isExpired = statusUpper === 'EXPIRED';

  // Chat is strictly restricted to active ongoing confirmed consultations (NEVER when completed, pending, or awaiting payment)
  const isChatActive = isConfirmed && !isCompleted && !isCompletionRequested && !isDisputed && !isCancelled && !isRejected && !isExpired;

  const isFirm = appointment.practiceType === 'FIRM';
  const isOnline = Boolean(
    appointment.isOnline ||
    appointment.consultationType === 'ONLINE' ||
    (!appointment.isChatOnly && !appointment.isInPerson && appointment.consultationType !== 'IN_PERSON' && appointment.consultationType !== 'CHAT')
  );
  const isOffline = Boolean(appointment.isInPerson || appointment.consultationType === 'IN_PERSON');
  const isChatOnly = Boolean(appointment.isChatOnly || appointment.consultationType === 'CHAT');

  const partyName = isClient
    ? appointment.lawyer?.fullName || appointment.lawyerUsername || 'Advocate'
    : appointment.client?.fullName || appointment.clientUsername || 'Client';

  const partySub = isClient
    ? appointment.lawyer?.barCouncilNumber || appointment.lawyer?.specialization?.replace('_', ' ') || 'Bar Council Enrolled'
    : appointment.client?.email || appointment.client?.phone || appointment.clientUsername;

  const startDate = appointment.startTime
    ? new Date(appointment.startTime)
    : appointment.slot?.startTime
      ? new Date(appointment.slot.startTime)
      : null;
  const endDate = appointment.endTime
    ? new Date(appointment.endTime)
    : appointment.slot?.endTime
      ? new Date(appointment.slot.endTime)
      : null;

  const dateStr = startDate
    ? startDate.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'TBD Date';

  const timeStr = startDate && endDate
    ? `${startDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
    : 'TBD Time';

  let preferredSlots = [];
  if (appointment.preferredSlotsJson) {
    try {
      preferredSlots = typeof appointment.preferredSlotsJson === 'string'
        ? JSON.parse(appointment.preferredSlotsJson)
        : appointment.preferredSlotsJson;
    } catch {
      preferredSlots = [];
    }
  }

  // Practice Badge
  const practiceBadge = isFirm ? (
    <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
      <Building className="w-2.5 h-2.5" />
      <span>FIRM – {appointment.firmName || 'Lex Veritas Legal LLP'}</span>
    </span>
  ) : (
    <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
      <Shield className="w-2.5 h-2.5" />
      <span>INDEPENDENT – Personal Practice</span>
    </span>
  );

  // Mode Badge
  const modeBadge = isChatOnly ? (
    <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
      <MessageSquare className="w-2.5 h-2.5" />
      <span>Chat-Only Advisory</span>
    </span>
  ) : isOffline ? (
    <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
      <Building className="w-2.5 h-2.5" />
      <span>In-Chamber Office</span>
    </span>
  ) : (
    <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
      <Video className="w-2.5 h-2.5" />
      <span>Encrypted 1:1 Video</span>
    </span>
  );

  if (viewMode === 'ROW') {
    return (
      <tr className="border-b border-stone-100 hover:bg-stone-50/70 transition text-xs">
        <td className="py-3 px-4 font-mono text-[11px] text-stone-700 font-bold">
          {appointment.shortUid ? `#${appointment.shortUid}` : (appointment.appointmentId || appointment.publicId?.slice(0, 10))}
        </td>
        <td className="py-3 px-4">
          <p className="font-serif font-bold text-stone-900">{partyName}</p>
          <p className="text-[10px] text-stone-500">{partySub}</p>
        </td>
        <td className="py-3 px-4">{practiceBadge}</td>
        <td className="py-3 px-4 text-stone-700 max-w-xs truncate font-medium">
          {appointment.service?.title || 'Legal Consultation'}
        </td>
        <td className="py-3 px-4">
          <p className="font-medium text-stone-800">{dateStr}</p>
          <p className="text-[10px] text-stone-500">{timeStr}</p>
        </td>
        <td className="py-3 px-4">{modeBadge}</td>
        <td className="py-3 px-4">
          <StatusBadge status={appointment.status} />
        </td>
        <td className="py-3 px-4 text-right">
          <div className="flex items-center justify-end space-x-1.5">
            {/* Lawyer creates/launches room */}
            {isConfirmed && isOnline && isLawyer && (
              <button
                type="button"
                onClick={() => (onStartRoom ? onStartRoom(appointment) : onJoinCall?.(appointment))}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] text-white font-medium hover:opacity-90 transition flex items-center space-x-1 cursor-pointer"
                title="Initialize & Launch Consultation Chamber"
              >
                <Video className="w-3 h-3" />
                <span>Join Room</span>
              </button>
            )}

            {/* Client joins room created by lawyer */}
            {isConfirmed && isOnline && isClient && onJoinCall && (
              <button
                type="button"
                onClick={() => onJoinCall(appointment)}
                className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-medium hover:bg-emerald-800 transition flex items-center space-x-1 cursor-pointer"
                title="Join Lawyer's Consultation Chamber"
              >
                <Video className="w-3 h-3" />
                <span>Join</span>
              </button>
            )}

            {/* Lawyer marks completed -> triggers client verification */}
            {isConfirmed && isLawyer && onMarkCompleted && (
              <button
                type="button"
                onClick={() => onMarkCompleted(appointment)}
                className="px-2.5 py-1 rounded-lg border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 font-medium transition text-xs cursor-pointer"
              >
                Mark Completed
              </button>
            )}

            {/* Client verifies and releases escrow fund */}
            {isCompletionRequested && isClient && (
              <div className="flex items-center space-x-1">
                {onConfirmCompletion && (
                  <button
                    type="button"
                    onClick={() => onConfirmCompletion(appointment)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition flex items-center space-x-1 cursor-pointer"
                    title="Verify consultation completion and release funds"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verify &amp; Release</span>
                  </button>
                )}
                {onReportDispute && (
                  <button
                    type="button"
                    onClick={() => onReportDispute(appointment)}
                    className="px-2 py-1 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs transition cursor-pointer"
                    title="Report lawyer no-show or issue"
                  >
                    Report
                  </button>
                )}
              </div>
            )}

            {/* Lawyer view of pending verification */}
            {isCompletionRequested && isLawyer && (
              <span className="text-[10px] font-mono text-purple-900 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md flex items-center space-x-1">
                <Clock className="w-2.5 h-2.5 text-purple-700 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Waiting for Client Response</span>
              </span>
            )}

            {/* Disputed state */}
            {isDisputed && (
              <span className="text-[10px] font-mono text-rose-900 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md font-bold">
                Dispute On Hold
              </span>
            )}
            {/* Consultation Chat in ROW view - ONLY while active confirmed */}
            {onOpenChat && isChatActive && (
              <button
                type="button"
                onClick={() => onOpenChat(appointment)}
                className="px-2 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-[11px] font-medium flex items-center space-x-1 transition cursor-pointer"
                title="Open consultation document & brief chat"
              >
                <MessageSquare className="w-3 h-3 text-stone-500" />
                <span>Chat</span>
              </button>
            )}
            {isAwaitingPayment && isClient && onPay && (
              <button
                type="button"
                onClick={() => onPay(appointment)}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] text-white font-semibold hover:opacity-90 transition text-xs cursor-pointer"
              >
                Pay ₹{(Math.round(Number(appointment.fee || appointment.service?.price || 1500) * 1.1) || 1650).toLocaleString('en-IN')}
              </button>
            )}
            {isPending && isLawyer && onAccept && preferredSlots.length >= 2 ? (
              <>
                <button
                  type="button"
                  onClick={() => onAccept(appointment.publicId, { chosenSlotOption: 1 })}
                  className="px-2 py-1 rounded-lg bg-emerald-700 text-white font-medium hover:bg-emerald-800 transition flex items-center space-x-1 cursor-pointer text-[11px]"
                  title="Agree to Option 1 (Primary - 1 hr)"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Opt 1</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAccept(appointment.publicId, { chosenSlotOption: 2 })}
                  className="px-2 py-1 rounded-lg bg-blue-700 text-white font-medium hover:bg-blue-800 transition flex items-center space-x-1 cursor-pointer text-[11px]"
                  title="Agree to Option 2 (Alternative - 1 hr)"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Opt 2</span>
                </button>
              </>
            ) : isPending && isLawyer && onAccept ? (
              <button
                type="button"
                onClick={() => onAccept(appointment.publicId)}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] text-white font-medium hover:opacity-90 transition flex items-center space-x-1 cursor-pointer"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Accept</span>
              </button>
            ) : null}
            {isPending && isLawyer && onModifyTime && (
              <button
                type="button"
                onClick={() => onModifyTime(appointment)}
                className="px-2.5 py-1 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 transition flex items-center space-x-1 cursor-pointer text-xs"
                title="Propose custom 1-hour time"
              >
                <Clock className="w-3 h-3 text-stone-500" />
                <span>Custom</span>
              </button>
            )}
            {isPending && isLawyer && onReject && (
              <button
                type="button"
                onClick={() => onReject(appointment)}
                className="px-2 py-1 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition cursor-pointer"
              >
                <XCircle className="w-3 h-3" />
              </button>
            )}
            {onCancel && (isPending || isConfirmed) && (
              <button
                type="button"
                onClick={() => onCancel(appointment)}
                className="px-2 py-1 rounded-lg text-stone-500 hover:text-rose-700 hover:bg-stone-100 transition cursor-pointer text-[11px]"
              >
                Cancel
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  }

  // CARD VIEW (Minimalist, Flat 2D Clean Aesthetic)
  const cleanedNotes = appointment.clientNotes
    ? appointment.clientNotes.replace(/\[ONLINE\]|\[OFFLINE\]|\[CHAT\]/gi, '').trim()
    : '';

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 transition duration-150 hover:border-stone-400 flex flex-col justify-between space-y-3 text-xs">
      <div>
        {/* Top Header: Status + Practice Channel on Left, Price on Right */}
        <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
          <div className="flex items-center space-x-2">
            <StatusBadge status={appointment.status} />
            {appointment.shortUid && (
              <span className="text-[10px] font-mono font-bold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                #{appointment.shortUid}
              </span>
            )}
            <span className="text-stone-300">•</span>
            {isFirm ? (
              <span className="text-[10px] font-mono font-medium text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100">
                Firm Matter
              </span>
            ) : (
              <span className="text-[10px] font-mono font-medium text-amber-800 bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-100">
                Independent
              </span>
            )}
          </div>

          <div className="text-right">
            <span className="font-serif font-bold text-stone-900 text-sm">
              ₹{(Number(appointment.fee || appointment.service?.price) || 1500).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Counterparty & Consultation Mode */}
        <div className="pt-2 pb-1 space-y-1">
          <div>
            <h4 className="font-serif font-bold text-sm text-stone-900">
              {partyName}
            </h4>
            {partySub && (
              <p className="text-[11px] text-stone-500 font-sans mt-0.5">{partySub}</p>
            )}
          </div>

          <div className="pt-0.5">
            {isOnline ? (
              <span className="inline-flex items-center space-x-1.5 text-[11px] font-medium text-emerald-800">
                <Video className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Online-Video Conferencing</span>
              </span>
            ) : isOffline ? (
              <span className="inline-flex items-center space-x-1.5 text-[11px] font-medium text-stone-700">
                <Building className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>In-Office Chamber Consultation</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 text-[11px] font-medium text-blue-800">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Legal Chat Advisory (No Video)</span>
              </span>
            )}
          </div>
        </div>

        {/* Matter Title & Client Brief (Flat, Clean 2D, No Nested Boxes) */}
        <div className="mt-2 p-3 rounded-xl bg-stone-50/80 border border-stone-200/60 space-y-1">
          <p className="font-semibold text-stone-900 truncate">
            {appointment.service?.title || 'Legal Advisory Session'}
          </p>
          {cleanedNotes && (
            <p className="text-[11px] text-stone-600 font-sans leading-relaxed line-clamp-2 italic">
              "{cleanedNotes}"
            </p>
          )}
        </div>

        {/* Completion Requested State: Minimalist 2D Callout */}
        {isCompletionRequested && isLawyer && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-950 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[11px] text-purple-900 flex items-center space-x-1.5">
                <Clock className="w-3 h-3 text-purple-700" />
                <span>Awaiting Client Confirmation</span>
              </span>
              <span className="text-[9px] font-mono text-purple-800 bg-purple-100 px-1.5 py-0.2 rounded font-medium">
                Escrow Pending
              </span>
            </div>
            <p className="text-[10px] text-purple-800 leading-tight">
              Session marked completed. Payout auto-releases after 24h verification window.
            </p>
          </div>
        )}

        {isCompletionRequested && isClient && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-1.5">
            <span className="font-semibold text-[11px] text-amber-900 flex items-center space-x-1">
              <AlertCircle className="w-3 h-3 text-amber-700" />
              <span>Counsel marked completed — confirm session attendance</span>
            </span>
            <div className="flex items-center space-x-1.5 pt-0.5">
              {onConfirmCompletion && (
                <button
                  type="button"
                  onClick={() => onConfirmCompletion(appointment)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-[11px] cursor-pointer"
                >
                  Confirm &amp; Release
                </button>
              )}
              {onReportDispute && (
                <button
                  type="button"
                  onClick={() => onReportDispute(appointment)}
                  className="px-2 py-1 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 text-[11px] cursor-pointer"
                >
                  Report Issue
                </button>
              )}
            </div>
          </div>
        )}

        {/* Disputed State */}
        {isDisputed && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-0.5">
            <span className="font-semibold text-[11px] text-rose-900 flex items-center space-x-1">
              <ShieldAlert className="w-3 h-3 text-rose-700" />
              <span>Dispute On Hold</span>
            </span>
            <p className="text-[10px] text-rose-800 leading-tight">
              {appointment.dispute?.reason || 'Client reported counsel absence'}. Escrow paused under compliance audit.
            </p>
          </div>
        )}

        {/* Completed State: Rating & Settled Tag */}
        {isCompleted && (
          <div className="mt-2 flex items-center justify-between text-xs py-0.5">
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= (appointment.rating || 5)
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-stone-300'
                  }`}
                />
              ))}
              <span className="text-[11px] font-bold text-stone-800 ml-1">
                {appointment.rating ? `${appointment.rating}.0` : '5.0'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
              Settled to Wallet
            </span>
          </div>
        )}

        {/* Date & Time / Dual Schedule Proposals */}
        {preferredSlots.length >= 2 && isPending ? (
          <div className="mt-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-semibold text-stone-700 uppercase tracking-wider flex items-center space-x-1">
                <Clock className="w-3 h-3 text-stone-500" />
                <span>2 Schedule Options (Strictly 1-Hr)</span>
              </span>
              <span className="text-[9px] font-mono text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-bold">
                Client Proposal
              </span>
            </div>
            <div className="space-y-1">
              <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-[11px]">
                <span className="font-medium text-emerald-950">
                  <strong className="text-emerald-800">① Option 1:</strong> {preferredSlots[0].formatted || `${new Date(preferredSlots[0].startTime).toLocaleDateString()} ${new Date(preferredSlots[0].startTime).toLocaleTimeString()}`}
                </span>
                <span className="text-[9px] font-mono text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">Primary</span>
              </div>
              <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-200 flex items-center justify-between text-[11px]">
                <span className="font-medium text-blue-950">
                  <strong className="text-blue-800">② Option 2:</strong> {preferredSlots[1].formatted || `${new Date(preferredSlots[1].startTime).toLocaleDateString()} ${new Date(preferredSlots[1].startTime).toLocaleTimeString()}`}
                </span>
                <span className="text-[9px] font-mono text-blue-800 bg-blue-100 px-1.5 py-0.2 rounded font-bold">Alternative</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-[11px] text-stone-500 pt-2 border-t border-stone-100 mt-2.5">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-stone-400" />
              <span>{dateStr}</span>
            </span>
            <span className="text-stone-300">•</span>
            <span className="flex items-center space-x-1 font-mono">
              <Clock className="w-3 h-3 text-stone-400" />
              <span>{timeStr}</span>
            </span>
          </div>
        )}

        {/* In-Chamber Consultation Address Revealing Mechanism */}
        {isOffline && (
          <div className="mt-2.5">
            {isConfirmed || isCompletionRequested || isCompleted ? (
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-xs font-semibold text-amber-900">
                    <Building className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Confirmed In-Chamber Office Address</span>
                  </span>
                  {isLawyer ? (
                    <span className="text-[9px] font-mono text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-1.5 py-0.5 rounded font-bold">
                      🔓 Revealed to Client
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-1.5 py-0.5 rounded font-bold">
                      ✓ Retainer Verified
                    </span>
                  )}
                </div>
                <div className="flex items-start space-x-1.5 text-[11px] text-stone-800">
                  <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                  <span className="font-medium">
                    {appointment.chamberAddress || appointment.lawyer?.chamberAddress || 'Advocate Chambers, High Court Complex, New Delhi - 110001'}
                  </span>
                </div>
                {appointment.directionsInstructions && (
                  <p className="text-[10px] text-stone-600 pl-5 leading-tight italic">
                    Note: {appointment.directionsInstructions}
                  </p>
                )}
                <div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      appointment.chamberAddress || 'Advocate Chambers, High Court Complex, New Delhi'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-[10px] font-semibold text-[#831826] hover:underline pl-5 pt-0.5"
                  >
                    <span>Navigate with Google Maps &rarr;</span>
                  </a>
                </div>
              </div>
            ) : isLawyer ? (
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-stone-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-xs font-semibold text-amber-900">
                    <Building className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Your Chamber Address</span>
                  </span>
                  <span className="text-[9px] font-mono text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded font-medium">
                    🔒 Concealed Until Paid
                  </span>
                </div>
                <p className="text-[11px] text-stone-800 font-medium pl-5">
                  {appointment.chamberAddress && !appointment.chamberAddress.includes('revealed upon payment')
                    ? appointment.chamberAddress
                    : 'Chamber 402, Lawyers Chambers Block, High Court Complex, New Delhi - 110003'}
                </p>
                {appointment.directionsInstructions && !appointment.directionsInstructions.includes('locked until retainer') && (
                  <p className="text-[10px] text-stone-600 pl-5 leading-tight italic">
                    Instructions: {appointment.directionsInstructions}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-xs font-semibold text-stone-800">
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Chamber Office Address Concealed</span>
                  </span>
                  <span className="text-[9px] font-mono text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                    LOCKED
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 leading-tight">
                  Chamber office room number, gate pass instructions, and Google Maps pin will unlock immediately once your retainer payment is completed.
                </p>
              </div>
            )}
          </div>
        )}

        {isCancelled && appointment.cancellationReason && (
          <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[10px]">
            <span className="font-semibold">Cancelled: </span>
            {appointment.cancellationReason}
          </div>
        )}

        {isRejected && appointment.rejectionReason && (
          <div className="mt-1.5 p-2 rounded-lg bg-stone-100 border border-stone-200 text-stone-800 text-[10px]">
            <span className="font-semibold">Declined: </span>
            {appointment.rejectionReason}
          </div>
        )}
      </div>

      {/* Footer Bar & Action Buttons */}
      <div className="pt-2.5 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="text-[10px] font-mono text-stone-400 whitespace-nowrap shrink-0">
          Ref: {appointment.appointmentId || appointment.publicId?.slice(0, 10)}
        </span>

        <div className="flex items-center flex-wrap gap-1.5 justify-start sm:justify-end">
          {/* Launch Video Chamber (Only if Online / Video Conference!) */}
          {isConfirmed && isOnline && isLawyer && (
            <button
              type="button"
              onClick={() => (onStartRoom ? onStartRoom(appointment) : onJoinCall?.(appointment))}
              className="px-2 py-1 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-medium text-[11px] flex items-center space-x-1 transition cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
            >
              <Video className="w-3 h-3 shrink-0" />
              <span>{t('action.joinRoom', 'Join Room')}</span>
            </button>
          )}

          {isConfirmed && isOnline && isClient && onJoinCall && (
            <button
              type="button"
              onClick={() => onJoinCall(appointment)}
              className="px-2 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-[11px] flex items-center space-x-1 transition cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
            >
              <Video className="w-3 h-3 shrink-0" />
              <span>{t('action.joinRoom', 'Join Room')}</span>
            </button>
          )}

          {/* Consultation Chat Module (Available ONLY during active confirmed consultation; NEVER when completed, pending, or awaiting payment) */}
          {onOpenChat && isChatActive && (
            <button
              type="button"
              onClick={() => onOpenChat(appointment)}
              className="px-2 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-[11px] font-medium flex items-center space-x-1 transition cursor-pointer whitespace-nowrap shrink-0"
              title="Open consultation document & brief chat"
            >
              <MessageSquare className="w-3 h-3 text-stone-500 shrink-0" />
              <span>{t('action.chat', 'Chat')}</span>
            </button>
          )}

          {/* Lawyer Mark Completed */}
          {isConfirmed && isLawyer && onMarkCompleted && (
            <button
              type="button"
              onClick={() => onMarkCompleted(appointment)}
              className="px-2 py-1 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-800 font-medium text-[11px] transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>{t('action.markCompleted', 'Mark Completed')}</span>
            </button>
          )}

          {/* Lawyer Waiting for Client Response badge */}
          {isCompletionRequested && isLawyer && (
            <span className="text-[10px] font-mono text-purple-900 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-lg flex items-center space-x-1 whitespace-nowrap shrink-0">
              <Clock className="w-3 h-3 text-purple-700 shrink-0" />
              <span>Waiting for Client</span>
            </span>
          )}

          {/* Client Pay Retainer */}
          {isAwaitingPayment && isClient && onPay && (
            <button
              type="button"
              onClick={() => onPay(appointment)}
              className="px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-medium text-[11px] transition cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
            >
              <span>{t('action.payRetainer', 'Pay Retainer')} (₹{(Math.round(Number(appointment.fee || appointment.service?.price || 1500) * 1.1) || 1650).toLocaleString('en-IN')})</span>
            </button>
          )}

          {/* Lawyer Accept/Reject/Modify */}
          {isPending && isLawyer && onAccept && preferredSlots.length >= 2 ? (
            <>
              <button
                type="button"
                onClick={() => onAccept(appointment.publicId, { chosenSlotOption: 1 })}
                className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-[11px] flex items-center space-x-1 cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                title="Agree to Option 1 (Primary - 1 hr)"
              >
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>Agree Option 1</span>
              </button>
              <button
                type="button"
                onClick={() => onAccept(appointment.publicId, { chosenSlotOption: 2 })}
                className="px-2.5 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-medium text-[11px] flex items-center space-x-1 cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                title="Agree to Option 2 (Alternative - 1 hr)"
              >
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>Agree Option 2</span>
              </button>
            </>
          ) : isPending && isLawyer && onAccept ? (
            <button
              type="button"
              onClick={() => onAccept(appointment.publicId)}
              className="px-2 py-1 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-medium text-[11px] flex items-center space-x-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>{t('action.accept', 'Accept')}</span>
            </button>
          ) : null}

          {isPending && isLawyer && onModifyTime && (
            <button
              type="button"
              onClick={() => onModifyTime(appointment)}
              className="px-2 py-1 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 text-[11px] font-medium flex items-center space-x-1 transition cursor-pointer whitespace-nowrap shrink-0"
              title="Propose custom 1-hour time"
            >
              <Clock className="w-3 h-3 text-stone-500 shrink-0" />
              <span>Custom Time</span>
            </button>
          )}

          {isPending && isLawyer && onReject && (
            <button
              type="button"
              onClick={() => onReject(appointment)}
              className="px-2 py-1 rounded-lg border border-stone-200 text-stone-600 hover:bg-rose-50 hover:text-rose-700 text-[11px] transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>{t('action.decline', 'Decline')}</span>
            </button>
          )}

          {/* Client Pending Status / Cancel Request */}
          {isPending && isClient && (
            <span className="text-[10px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg flex items-center space-x-1 whitespace-nowrap shrink-0">
              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Awaiting Counsel Acceptance</span>
            </span>
          )}
          {isPending && isClient && onCancel && (
            <button
              type="button"
              onClick={() => onCancel(appointment)}
              className="px-2 py-1 rounded-lg border border-stone-200 text-stone-500 hover:text-rose-700 hover:bg-rose-50 text-[10px] font-mono transition cursor-pointer"
            >
              Cancel Request
            </button>
          )}

          {/* Client Report Problem for Confirmed Appointments */}
          {isConfirmed && isClient && onReportDispute && (
            <button
              type="button"
              onClick={() => onReportDispute(appointment)}
              className="px-2 py-1 rounded-lg border border-stone-200 text-stone-600 hover:text-rose-700 hover:bg-rose-50 text-[11px] font-medium transition cursor-pointer whitespace-nowrap shrink-0"
              title="Report an issue or lawyer absence"
            >
              <span>Report Problem</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
