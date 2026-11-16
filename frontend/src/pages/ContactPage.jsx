import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, MessageSquare, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ContactPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);

    // Open mailto to lawezy2025@gmail.com with prefilled message
    const mailtoSubject = encodeURIComponent(subject ? `[LawinoMeet] ${subject}` : `[LawinoMeet Inquiry] from ${name}`);
    const mailtoBody = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\n\nMessage:\n${message}`
    );
    window.location.href = `mailto:lawezy2025@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setPhone('');
    setSubject('');
    setMessage('');
    setSubmitted(false);
  };

  return (
    <div className="bg-[#FAF6EE] min-h-screen py-16 text-[#2E2A29] selection:bg-[#831826]/15 selection:text-[#831826]">
      <div className="max-w-3xl mx-auto px-6 sm:px-10 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="text-xs font-sans font-medium uppercase tracking-[0.25em] text-[#8C847E] block">
            WE ARE HERE FOR YOU
          </span>
          <h1 className="text-4xl sm:text-5xl font-serif text-[#2E2A29] leading-[1.15]">
            Contact{' '}
            <span className="italic text-[#831826] font-serif">LawinoMeet</span>
          </h1>
          <p className="text-base text-[#66605B] font-sans font-light leading-relaxed max-w-xl mx-auto">
            Have a question, feedback, or need guidance? Fill out the form below or write directly to our facilitation team.
          </p>

          {/* Direct Email Badge */}
          <div className="pt-2 flex justify-center">
            <a
              href="mailto:lawezy2025@gmail.com"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-[#831826]/30 bg-white/70 text-[#831826] hover:bg-[#831826] hover:text-white transition shadow-sm text-sm font-medium"
            >
              <Mail className="w-4 h-4" />
              <span>lawezy2025@gmail.com</span>
            </a>
          </div>
        </div>

        {/* Contact Form Card */}
        <div className="bg-white rounded-3xl border border-[#E4DBD0] shadow-sm p-8 sm:p-12 relative">
          {submitted ? (
            <div className="py-12 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-serif text-[#2E2A29]">
                  Message Prepared &amp; Sent
                </h2>
                <p className="text-sm sm:text-base text-[#66605B] font-sans font-light max-w-md mx-auto leading-relaxed">
                  Thank you, <strong className="font-medium text-[#2E2A29]">{name}</strong>. Your inquiry has been routed to{' '}
                  <a
                    href="mailto:lawezy2025@gmail.com"
                    className="text-[#831826] font-medium underline underline-offset-2"
                  >
                    lawezy2025@gmail.com
                  </a>
                  . We will get back to your email at <strong className="font-medium text-[#2E2A29]">{email}</strong> promptly.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-full border border-[#831826]/30 text-[#831826] hover:bg-[#831826]/10 text-xs sm:text-sm font-medium transition"
                >
                  Send Another Message
                </button>
                <Link
                  to="/lawyers"
                  className="px-6 py-2.5 rounded-full bg-[#831826] text-white hover:bg-[#6c131f] text-xs sm:text-sm font-medium shadow-sm transition inline-flex items-center space-x-1.5"
                >
                  <span>Find an Advocate</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="block text-xs font-sans font-medium uppercase tracking-wider text-[#524B47]">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full text-sm bg-[#FAF8F5] border border-[#E4DBD0] rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#831826]/40 focus:bg-white transition"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <label className="block text-xs font-sans font-medium uppercase tracking-wider text-[#524B47]">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full text-sm bg-[#FAF8F5] border border-[#E4DBD0] rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#831826]/40 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="block text-xs font-sans font-medium uppercase tracking-wider text-[#524B47]">
                    Phone Number <span className="text-[#8C847E] text-[11px] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full text-sm bg-[#FAF8F5] border border-[#E4DBD0] rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#831826]/40 focus:bg-white transition"
                  />
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <label className="block text-xs font-sans font-medium uppercase tracking-wider text-[#524B47]">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Legal Consultation Inquiry"
                    className="w-full text-sm bg-[#FAF8F5] border border-[#E4DBD0] rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#831826]/40 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="block text-xs font-sans font-medium uppercase tracking-wider text-[#524B47]">
                  How can we help? *
                </label>
                <textarea
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your situation or questions in detail..."
                  className="w-full text-sm bg-[#FAF8F5] border border-[#E4DBD0] rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#831826]/40 focus:bg-white transition"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 rounded-full bg-[#831826] hover:bg-[#6c131f] text-white text-sm font-medium tracking-wide shadow-md hover:shadow transition flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message to lawezy2025@gmail.com</span>
                </button>
              </div>

              <p className="text-center text-xs text-[#8C847E] pt-2">
                All communications sent to <span className="text-[#831826] font-medium">lawezy2025@gmail.com</span> are confidential.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
