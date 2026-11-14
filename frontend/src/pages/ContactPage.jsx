import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ContactPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-cream-50 min-h-screen py-16 text-maroon-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-xs font-serif font-bold uppercase tracking-[0.25em] text-maroon-700">
            Reach Out • We are Here For You
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-maroon-950">
            Contact LawinoMeet
          </h1>
          <p className="text-sm sm:text-base text-stone-600 font-sans leading-relaxed">
            Whether you have questions regarding advocate onboarding, chamber protocols, or need assistance booking emergency counsel.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Details */}
          <div className="lg:col-span-5 space-y-8">
            <div className="p-8 rounded-3xl bg-maroon-950 text-cream-100 border border-luxury-gold/40 shadow-2xl space-y-6">
              <h3 className="text-2xl font-serif font-bold text-cream-50">Head Chamber & Registry</h3>
              
              <div className="space-y-4 text-xs font-sans text-cream-200">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-luxury-gold shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-cream-50 font-serif">Chamber Registry Office</strong>
                    <span>Lawyers Chambers Block, Court Complex, New Delhi 110003</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-luxury-gold shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-cream-50 font-serif">Helpline & Urgent Assistance</strong>
                    <span>+91 (011) 4920-8000 / +91 98100-LAWINO</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-luxury-gold shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-cream-50 font-serif">Official Electronic Registry</strong>
                    <span>support@lawinomeet.com • chambers@lawinomeet.com</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-luxury-gold shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-cream-50 font-serif">Registry Hours</strong>
                    <span>Mon - Sat: 9:00 AM - 8:00 PM IST (Emergency Video: 24/7)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-cream-300 shadow-sm flex items-center space-x-4">
              <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                <strong>Statutory Compliance:</strong> Communications facilitated through LawinoMeet are protected under attorney-client privilege once an advocate accepts your consultation matter.
              </p>
            </div>
          </div>

          {/* Right Contact Form */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-cream-300 shadow-xl space-y-6">
            <h3 className="text-xl font-serif font-bold text-maroon-950">Send a Formal Inquiry</h3>

            {submitted ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-lg font-serif font-bold text-maroon-950">Message Dispatched Successfully</h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Our chamber facilitation desk will review your inquiry and connect back within 2-4 business hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-serif font-bold text-maroon-900 uppercase tracking-wider mb-1">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Adv. Rohit Verma or Client Name"
                      className="w-full text-xs border border-cream-300 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-serif font-bold text-maroon-900 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full text-xs border border-cream-300 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-serif font-bold text-maroon-900 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full text-xs border border-cream-300 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif font-bold text-maroon-900 uppercase tracking-wider mb-1">
                    Matter / Query Description
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe how we can assist you..."
                    className="w-full text-xs border border-cream-300 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light hover:brightness-110 text-maroon-950 font-serif font-bold text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Transmit Inquiry</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
