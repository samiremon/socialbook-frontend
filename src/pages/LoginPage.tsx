import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import logoImg from '../assets/lohgo.png';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername || !password) {
      setError('Please fill in both fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(emailOrUsername, password);
      toast.info('Welcome back to OpenSocial!');
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Check your credentials.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white dark:bg-[#242526] rounded-3xl shadow-xl border border-slate-200/80 dark:border-[#393a3b] p-8 sm:p-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <img
            src={logoImg}
            alt="OpenSocial Logo"
            className="w-14 h-14 mx-auto mb-3 object-contain drop-shadow-md hover:scale-105 transition-transform"
          />
          <h1 className="text-2xl font-black text-slate-900 dark:text-[#e4e6eb] tracking-tight">OpenSocial</h1>
          <p className="text-xs text-slate-500 dark:text-[#b0b3b8] mt-1">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs p-3.5 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-[#e4e6eb] block mb-1.5">
              Email or Username
            </label>
            <input
              type="text"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              placeholder="Enter your email or username"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#3a3b3c] focus:bg-white dark:focus:bg-[#3a3b3c] text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 dark:placeholder:text-[#b0b3b8] border border-slate-200 dark:border-[#393a3b] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-[#e4e6eb] block mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-[#3a3b3c] focus:bg-white dark:focus:bg-[#3a3b3c] text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 dark:placeholder:text-[#b0b3b8] border border-slate-200 dark:border-[#393a3b] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-[#e4e6eb] p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-brand-600/20 cursor-pointer mt-2"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Register CTA */}
        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-[#393a3b] text-center">
          <p className="text-xs text-slate-500 dark:text-[#b0b3b8]">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 dark:text-brand-400 hover:underline font-bold">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
