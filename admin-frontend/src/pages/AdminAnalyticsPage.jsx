import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Users,
  Scale,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileSpreadsheet,
} from 'lucide-react';

export const AdminAnalyticsPage = () => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Metric,Value,Period\n' +
      'Total Registered Clients,420,YTD\n' +
      'Verified Advocates,148,YTD\n' +
      'Institutional Law Firms,24,YTD\n' +
      'Total Consultations Completed,1485,YTD\n' +
      'Gross Consultation Volume (INR),1485000,YTD\n' +
      'Platform Commission 10% (INR),148500,YTD\n' +
      'Average Advocate Response Time,2.4 hours,YTD\n' +
      'Appointment Completion Rate,98.2%,YTD\n';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LawinoMeet_Platform_Analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast */}
      {downloadSuccess && (
        <div className="p-3.5 px-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Platform analytics telemetry exported as CSV successfully.</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <h2 className="text-lg font-serif font-bold text-cream-100 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <span>Platform Analytics &amp; Performance Telemetry</span>
          </h2>
          <p className="text-xs text-stone-400 font-sans mt-0.5">
            Operational metrics across user acquisition, consultation completion efficiency, and dispute turnaround times.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-cream-100 font-medium text-xs flex items-center space-x-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span>Export Analytics Report (.CSV)</span>
        </button>
      </div>

      {/* Growth & Conversion Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800 font-mono">
          <span className="text-[10px] text-stone-400 uppercase">Consultation Completion</span>
          <p className="text-2xl font-serif font-bold text-emerald-400 mt-1">98.2%</p>
          <p className="text-[10px] text-stone-500 font-sans mt-1">Sessions attended successfully</p>
        </div>

        <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800 font-mono">
          <span className="text-[10px] text-stone-400 uppercase">Advocate Response Time</span>
          <p className="text-2xl font-serif font-bold text-cream-100 mt-1">2.4 hrs</p>
          <p className="text-[10px] text-stone-500 font-sans mt-1">From client request to acceptance</p>
        </div>

        <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800 font-mono">
          <span className="text-[10px] text-stone-400 uppercase">Firm Intake Assignment</span>
          <p className="text-2xl font-serif font-bold text-cream-100 mt-1">45 mins</p>
          <p className="text-[10px] text-stone-500 font-sans mt-1">Average partner docket dispatch</p>
        </div>

        <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800 font-mono">
          <span className="text-[10px] text-stone-400 uppercase">Support Resolution Time</span>
          <p className="text-2xl font-serif font-bold text-amber-400 mt-1">4.2 hrs</p>
          <p className="text-[10px] text-stone-500 font-sans mt-1">Average dispute ticket closure</p>
        </div>
      </div>

      {/* Detailed Telemetry Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl bg-[#221C1A] border border-stone-800 space-y-3">
          <h3 className="font-serif font-bold text-sm text-cream-100">Consultation Volume Trends</h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex justify-between">
              <span className="text-stone-300">Total Bookings Initiated</span>
              <span className="font-bold text-cream-100">1,512</span>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex justify-between">
              <span className="text-stone-300">Successfully Confirmed &amp; Paid</span>
              <span className="font-bold text-emerald-400">1,485 (98.2%)</span>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex justify-between">
              <span className="text-stone-300">Client-Initiated Cancellations</span>
              <span className="font-bold text-stone-400">22 (1.4%)</span>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex justify-between">
              <span className="text-stone-300">Advocate Conflict Rejections</span>
              <span className="font-bold text-stone-400">5 (0.3%)</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#221C1A] border border-stone-800 space-y-3">
          <h3 className="font-serif font-bold text-sm text-cream-100">Customer Support Ticket Categories</h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex justify-between">
              <span className="text-stone-300">Refund Claims &amp; Rescheduling</span>
              <span className="font-bold text-amber-400">52%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex justify-between">
              <span className="text-stone-300">Advocate Verification Questions</span>
              <span className="font-bold text-cream-100">26%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex justify-between">
              <span className="text-stone-300">Browser Audio/Video Guidance</span>
              <span className="font-bold text-cream-100">16%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex justify-between">
              <span className="text-stone-300">Account Recovery &amp; Other</span>
              <span className="font-bold text-stone-400">6%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
