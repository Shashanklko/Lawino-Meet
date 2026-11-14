import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login({ identifier, password });
      if (user.role === 'LAWYER') {
        navigate('/dashboard/lawyer');
      } else if (user.role === 'FIRM_ADMIN') {
        navigate('/dashboard/firm');
      } else {
        navigate('/dashboard/client');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid username/email or password');
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
            Sign In to Chamber
          </h2>
          <p className="text-xs text-stone-500">
            Access confidential hearings, chamber schedules, and client records
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-serif font-bold text-maroon-900 uppercase tracking-wider mb-1">
              Email or Advocate Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-stone-400" />
              </div>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="advocate_sharma or sharma@law.in"
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
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-cream-200">
          <p className="text-xs text-stone-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-serif font-bold text-maroon-800 hover:text-maroon-950">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
