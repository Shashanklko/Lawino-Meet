import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Scale, Lock, User, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'CLIENT';

  const [role, setRole] = useState(initialRole);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        username: username.trim(),
        email: email.trim(),
        password,
        role,
      };

      const user = await register(payload);
      if (user.role === 'LAWYER') {
        navigate('/dashboard/lawyer');
      } else if (user.role === 'FIRM_ADMIN') {
        navigate('/dashboard/firm');
      } else {
        navigate('/dashboard/client');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cream-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-cream-300 shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-maroon-900 to-maroon-800 border border-luxury-gold rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Scale className="w-7 h-7 text-luxury-gold" />
          </div>
          <h2 className="text-2xl font-serif font-black text-maroon-950 tracking-tight">
            Chamber Enrollment
          </h2>
          <p className="text-xs text-stone-500">
            Join India's premier legal consultation & video network
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-cream-100 rounded-2xl border border-cream-300">
          <button
            type="button"
            onClick={() => setRole('CLIENT')}
            className={`py-2 text-xs font-serif font-bold uppercase tracking-wider rounded-xl transition ${
              role === 'CLIENT'
                ? 'bg-maroon-900 text-cream-100 shadow-md'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Client
          </button>
          <button
            type="button"
            onClick={() => setRole('LAWYER')}
            className={`py-2 text-xs font-serif font-bold uppercase tracking-wider rounded-xl transition ${
              role === 'LAWYER'
                ? 'bg-maroon-900 text-cream-100 shadow-md'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Advocate
          </button>
          <button
            type="button"
            onClick={() => setRole('FIRM_ADMIN')}
            className={`py-2 text-xs font-serif font-bold uppercase tracking-wider rounded-xl transition ${
              role === 'FIRM_ADMIN'
                ? 'bg-maroon-900 text-cream-100 shadow-md'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Law Firm
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Register Form */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-serif font-bold text-maroon-900 uppercase tracking-wider mb-1">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-stone-400" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="advocate_sharma"
                className="block w-full pl-10 pr-3 py-3 border border-cream-300 rounded-2xl text-xs placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-luxury-gold transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-serif font-bold text-maroon-900 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-stone-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sharma@law.in"
                className="block w-full pl-10 pr-3 py-3 border border-cream-300 rounded-2xl text-xs placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-luxury-gold transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-serif font-bold text-maroon-900 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-stone-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-3 py-3 border border-cream-300 rounded-2xl text-xs placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-luxury-gold transition"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl text-xs font-serif font-bold uppercase tracking-wider text-maroon-950 bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light hover:brightness-110 focus:outline-none transition disabled:opacity-50 shadow-lg"
            >
              <span>{loading ? 'Enrolling...' : `Register as ${role.replace('_', ' ')}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-cream-200">
          <p className="text-xs text-stone-500">
            Already registered?{' '}
            <Link to="/login" className="font-serif font-bold text-maroon-800 hover:text-maroon-950">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
