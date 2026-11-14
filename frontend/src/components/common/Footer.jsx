import React from 'react';
import { ShieldCheck, Lock, Building, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-maroon-950 text-cream-200 border-t border-luxury-gold/30 pt-16 pb-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand & Logo */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.jpg"
                alt="LawinoMeet Logo"
                className="w-10 h-10 rounded-full object-cover ring-1 ring-luxury-gold/50 shadow-md"
              />
              <span className="font-serif font-black text-xl tracking-wide text-cream-50">
                Lawino<span className="text-luxury-gold">Meet</span>
              </span>
            </div>
            <p className="text-xs text-cream-300 font-light leading-relaxed">
              India's premier legal consultation sanctuary connecting verified legal professional experts, advocates,
              and law firm chambers for encrypted video hearings and authorized chamber meetings.
            </p>
            <div className="flex items-center space-x-4 text-xs text-luxury-gold pt-2 font-serif">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Bar Council Verified</span>
              </span>
              <span className="flex items-center space-x-1">
                <Lock className="w-4 h-4" />
                <span>SRTP Encrypted</span>
              </span>
            </div>
          </div>

          {/* Jurisdictions */}
          <div>
            <h4 className="text-xs font-serif font-bold uppercase tracking-[0.2em] text-luxury-gold mb-4">
              Practice Domains
            </h4>
            <ul className="space-y-2.5 text-xs text-cream-300 font-light">
              <li className="hover:text-luxury-gold transition cursor-pointer">Corporate M&A & Boardroom Advisory</li>
              <li className="hover:text-luxury-gold transition cursor-pointer">Criminal Defense & Urgent Bail</li>
              <li className="hover:text-luxury-gold transition cursor-pointer">Matrimonial & Custody Settlements</li>
              <li className="hover:text-luxury-gold transition cursor-pointer">Intellectual Property & Patents</li>
              <li className="hover:text-luxury-gold transition cursor-pointer">Cyber Crime & IT Act Litigations</li>
            </ul>
          </div>

          {/* Consultation Formats */}
          <div>
            <h4 className="text-xs font-serif font-bold uppercase tracking-[0.2em] text-luxury-gold mb-4">
              Consultation Formats
            </h4>
            <ul className="space-y-2.5 text-xs text-cream-300 font-light">
              <li>
                <Link to="/lawyers?mode=ONLINE" className="hover:text-luxury-gold transition">
                  🌐 Online Encrypted Video Rooms
                </Link>
              </li>
              <li>
                <Link to="/lawyers?mode=OFFLINE" className="hover:text-luxury-gold transition">
                  🏛️ Chamber In-Person Meetings
                </Link>
              </li>
              <li>
                <Link to="/firms" className="hover:text-luxury-gold transition">
                  ⚖️ Law Firm Associates Directory
                </Link>
              </li>
              <li>
                <Link to="/register?role=LAWYER" className="hover:text-luxury-gold transition">
                  📜 Enroll Advocate Chamber
                </Link>
              </li>
            </ul>
          </div>

          {/* Statutory Bar Notice */}
          <div>
            <h4 className="text-xs font-serif font-bold uppercase tracking-[0.2em] text-luxury-gold mb-4">
              Statutory Disclaimer
            </h4>
            <p className="text-[11px] text-cream-400 font-light leading-relaxed">
              This platform adheres strictly to the Bar Council of India Rules under the Advocates Act, 1961.
              It does not advertise, solicit, or promise outcomes. In-person chamber meetings require prior advocate approval.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-luxury-gold/20 flex flex-col sm:flex-row items-center justify-between text-xs text-cream-400 font-light">
          <p>© {new Date().getFullYear()} LawinoMeet Technologies LLP. All Rights Reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0 font-serif text-[11px]">
            <span className="hover:text-luxury-gold transition cursor-pointer">Chamber Protocols</span>
            <span className="hover:text-luxury-gold transition cursor-pointer">Privacy & SRTP</span>
            <span className="hover:text-luxury-gold transition cursor-pointer">Terms of Advocacy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
