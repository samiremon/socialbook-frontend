import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import logoImg from '../assets/lohgo.png';

export const RegisterPage: React.FC = () => {
  const { register, exploreAsJohn } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { label: '', color: '', percent: 0 };
    if (password.length < 6) return { label: 'Too short', color: 'bg-rose-500', percent: 25 };
    if (password.length < 8) return { label: 'Weak', color: 'bg-amber-500', percent: 50 };
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (hasNumbers && hasSpecial) {
      return { label: 'Strong', color: 'bg-emerald-500', percent: 100 };
    }
    return { label: 'Medium', color: 'bg-blue-500', percent: 75 };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !email || !password) {
      setError('Please fill in all fields');
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await register(fullName, username, email, password);
      toast.success('Account created successfully! Welcome to OpenSocial 🌟');
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Try again.';
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
        <div className="text-center mb-8">
          <img
            src={logoImg}
            alt="OpenSocial Logo"
            className="w-14 h-14 mx-auto mb-3 object-contain drop-shadow-md hover:scale-105 transition-transform"
          />
          <h1 className="text-2xl font-black text-slate-900 dark:text-[#e4e6eb] tracking-tight">Create Account</h1>
          <p className="text-xs text-slate-500 dark:text-[#b0b3b8] mt-1">Join OpenSocial today</p>
        </div>

        {error && (
          <div className="mb-5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs p-3.5 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-[#e4e6eb] block mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Green"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#3a3b3c] focus:bg-white dark:focus:bg-[#3a3b3c] text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 dark:placeholder:text-[#b0b3b8] border border-slate-200 dark:border-[#393a3b] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-[#e4e6eb] block mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. alexgreen"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#3a3b3c] focus:bg-white dark:focus:bg-[#3a3b3c] text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 dark:placeholder:text-[#b0b3b8] border border-slate-200 dark:border-[#393a3b] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-[#e4e6eb] block mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@example.com"
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
                placeholder="At least 6 characters"
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

            {password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-[#3a3b3c] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all duration-300`}
                    style={{ width: `${strength.percent}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-[#b0b3b8]">{strength.label}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-brand-600/20 cursor-pointer mt-2"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Minimal Demo Button without icons */}
        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-[#393a3b] flex flex-col gap-3 text-center">
          <button
            type="button"
            onClick={() => {
              exploreAsJohn();
              toast.success('Browsing as John Doe (Demo Mode)');
              navigate('/');
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] hover:border-slate-400 text-slate-700 dark:text-[#e4e6eb] font-semibold text-xs transition-colors cursor-pointer"
          >
            Demo Account (John Doe)
          </button>

          <p className="text-xs text-slate-500 dark:text-[#b0b3b8]">
            Already registered?{' '}
            <Link to="/login" className="text-brand-600 dark:text-brand-400 hover:underline font-bold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
