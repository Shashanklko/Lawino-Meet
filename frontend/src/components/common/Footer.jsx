import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#FAF6EE] border-t border-[#EAE2D5] py-10 px-6 sm:px-10 lg:px-16 text-[#66605B]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <img
            src="/logo.jpg"
            alt="LawinoMeet"
            className="w-8 h-8 rounded-full object-cover ring-1 ring-[#831826]/30 shadow-sm"
          />
          <span className="font-serif font-semibold text-lg text-[#2E2A29]">LawinoMeet</span>
          <span className="text-xs text-[#8C847E]">
            | {t('footer.tagline', 'Legal Consultations & Discovery')}
          </span>
        </div>

        {/* Essential Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#66605B] font-sans">
          <a href="/#story" className="hover:text-[#831826] transition">
            {t('nav.ourStory', 'Our Story')}
          </a>
          <a href="/#services" className="hover:text-[#831826] transition">
            {t('nav.services', 'Services')}
          </a>
          <Link to="/contact" className="hover:text-[#831826] transition">
            {t('nav.contactUs', 'Contact Us')}
          </Link>
          <Link to="/lawyers" className="hover:text-[#831826] transition">
            {t('nav.findAdvocates', 'Find Advocates')}
          </Link>
        </div>

        {/* Minimal Copyright */}
        <div className="text-xs text-[#8C847E]">
          &copy; {new Date().getFullYear()} LawinoMeet. {t('footer.copyright', 'All rights reserved.')}
        </div>
      </div>
    </footer>
  );
};
