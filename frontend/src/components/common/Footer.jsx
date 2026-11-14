import React from 'react';
import { Scale, ShieldCheck, Lock, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Mission */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white">
                Lawino<span className="text-blue-400">Meet</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India's premier legal consultation platform connecting clients with verified advocates,
              arbitrators, and top law firms for seamless, confidential video conferences.
            </p>
            <div className="flex items-center space-x-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Bar Verified</span>
              </span>
              <span className="flex items-center space-x-1">
                <Lock className="w-4 h-4 text-blue-400" />
                <span>WebRTC Encrypted</span>
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Practice Areas
            </h4>
            <ul className="space-y-2 text-xs">
              <li>Corporate & Commercial Law</li>
              <li>Criminal Defense & Bail</li>
              <li>Family & Matrimonial Disputes</li>
              <li>Intellectual Property & Patents</li>
              <li>Cyber Crime & Data Protection</li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/lawyers" className="hover:text-white transition">
                  Find Advocates
                </Link>
              </li>
              <li>
                <Link to="/firms" className="hover:text-white transition">
                  Law Firm Network
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition">
                  Join as an Advocate
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Disclaimer */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Legal Disclaimer
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Lawino Meet is a legal facilitation platform under the Advocates Act, 1961. This website
              does not constitute legal advertisement or solicitation. Video consultations are confidential
              between advocates and clients.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Lawino Meet Technologies. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Disclaimers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
