import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Key,
  Mail,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  Check,
  Globe,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import { accountApi } from '../api';
import { AccountSettingsData, UserEmailItem } from '../types';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'privacy'>('account');
  const [loading, setLoading] = useState(true);
  const [accountData, setAccountData] = useState<AccountSettingsData | null>(null);

  // Email verification states
  const [newEmail, setNewEmail] = useState('');
  const [targetEmailForOtp, setTargetEmailForOtp] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpStepActive, setOtpStepActive] = useState(false);
  const [emailActionError, setEmailActionError] = useState('');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Active status toggle
  const [isActiveStatus, setIsActiveStatus] = useState<boolean>(() => {
    return localStorage.getItem('opensocial_active_status') !== 'false';
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadAccountData();
  }, [user]);

  const loadAccountData = async () => {
    try {
      setLoading(true);
      const data = await accountApi.getSettings();
      setAccountData(data);
    } catch (err: any) {
      console.error('Failed to load account settings', err);
      toast.error('Failed to load account settings');
    } finally {
      setLoading(false);
    }
  };

  // 1. Send OTP to an email (primary or additional)
  const handleSendOtp = async (emailToSend: string) => {
    if (!emailToSend || !emailToSend.includes('@')) {
      setEmailActionError('Please provide a valid email address');
      return;
    }
    setIsSendingOtp(true);
    setEmailActionError('');
    try {
      const res = await accountApi.sendEmailOtp(emailToSend);
      setTargetEmailForOtp(emailToSend);
      setOtpStepActive(true);
      setOtpCode('');
      toast.info(res.message || `Verification code sent to ${emailToSend}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to send verification code.';
      setEmailActionError(msg);
      toast.error(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // 2. Verify 6-digit OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setEmailActionError('Please enter the 6-digit verification code.');
      return;
    }
    setIsVerifyingOtp(true);
    setEmailActionError('');
    try {
      const res = await accountApi.verifyEmailOtp(targetEmailForOtp, otpCode.trim());
      toast.info(res.message || 'Email verified successfully!');
      setOtpStepActive(false);
      setOtpCode('');
      setNewEmail('');
      setTargetEmailForOtp('');
      await loadAccountData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid or expired code.';
      setEmailActionError(msg);
      toast.error(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // 3. Delete additional email
  const handleDeleteEmail = async (id: number, emailStr: string) => {
    if (!window.confirm(`Are you sure you want to remove ${emailStr} from your account?`)) {
      return;
    }
    try {
      await accountApi.deleteEmail(id);
      toast.info(`Removed ${emailStr}`);
      await loadAccountData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to remove email';
      toast.error(msg);
    }
  };

  // 4. Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await accountApi.changePassword(currentPassword, newPassword);
      setPasswordSuccess(res.message || 'Password changed successfully!');
      toast.info('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update password.';
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const toggleActiveStatus = () => {
    const next = !isActiveStatus;
    setIsActiveStatus(next);
    localStorage.setItem('opensocial_active_status', String(next));
    toast.info(next ? 'Active Status is now ON 🟢' : 'Active Status is now OFF ⚪');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 flex flex-col items-center justify-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-600 mb-3" />
        <p className="text-xs font-bold text-slate-600">Loading your settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#e4e6eb] tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-brand-600/20">
            ⚙️
          </div>
          Settings &amp; Privacy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-[#b0b3b8] mt-1">
          Manage your account security, verified login emails, and personal preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'account'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                : 'bg-white dark:bg-[#242526] text-slate-700 dark:text-[#e4e6eb] hover:bg-slate-100/80 dark:hover:bg-[#3a3b3c] border border-slate-200/80 dark:border-[#393a3b]'
            }`}
          >
            <Mail className="w-4 h-4 shrink-0 text-brand-600 dark:text-brand-400" />
            <span>Account &amp; Emails</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'security'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                : 'bg-white dark:bg-[#242526] text-slate-700 dark:text-[#e4e6eb] hover:bg-slate-100/80 dark:hover:bg-[#3a3b3c] border border-slate-200/80 dark:border-[#393a3b]'
            }`}
          >
            <Key className="w-4 h-4 shrink-0 text-brand-600 dark:text-brand-400" />
            <span>Password &amp; Security</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                : 'bg-white dark:bg-[#242526] text-slate-700 dark:text-[#e4e6eb] hover:bg-slate-100/80 dark:hover:bg-[#3a3b3c] border border-slate-200/80 dark:border-[#393a3b]'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0 text-brand-600 dark:text-brand-400" />
            <span>Privacy &amp; Preferences</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* ==================================================== */}
          {/* TAB 1: ACCOUNT & EMAILS */}
          {/* ==================================================== */}
          {activeTab === 'account' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Account Overview Card */}
              <div className="bg-white dark:bg-[#242526] rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-[#393a3b]">
                <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-[#393a3b]">
                  <div className="flex items-center gap-4">
                    <img
                      src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                      alt={user?.fullName}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-brand-500 shadow-xs"
                    />
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#e4e6eb]">{user?.fullName}</h2>
                      <p className="text-xs text-slate-500 dark:text-[#b0b3b8]">@{user?.username}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={loadAccountData}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-[#e4e6eb] hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-colors cursor-pointer"
                    title="Refresh settings"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Email Management Header */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-[#e4e6eb] flex items-center gap-2">
                      <Mail className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      Email Addresses &amp; Verification
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-[#b0b3b8] leading-relaxed">
                    You can add and verify multiple email addresses. Any verified email can be used to log in to your OpenSocial account.
                  </p>
                </div>

                {/* OTP Error Feedback */}
                {emailActionError && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{emailActionError}</span>
                  </div>
                )}

                {/* OTP Verification Modal / Inline Card */}
                {otpStepActive && (
                  <div className="mt-5 p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border-2 border-emerald-500/30 dark:border-emerald-500/40 animate-popIn">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          Enter 6-Digit Verification Code
                        </h4>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                          We sent a 6-digit confirmation code to <strong>{targetEmailForOtp}</strong>. Please check your inbox.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOtpStepActive(false)}
                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-[#e4e6eb]"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="flex flex-col sm:flex-row items-center gap-3">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-full sm:w-48 text-center text-lg font-black tracking-widest px-4 py-2.5 bg-white dark:bg-[#3a3b3c] border border-emerald-300 dark:border-emerald-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-[#e4e6eb] shadow-inner"
                        required
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={isVerifyingOtp || otpCode.length !== 6}
                        className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isVerifyingOtp ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Verify Email
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendOtp(targetEmailForOtp)}
                        disabled={isSendingOtp}
                        className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold hover:underline px-2 py-1"
                      >
                        Resend Code
                      </button>
                    </form>
                  </div>
                )}

                {/* Email List */}
                <div className="mt-6 space-y-3">
                  {/* Primary Email */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#18191a]/50 border border-slate-200/80 dark:border-[#393a3b] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#3a3b3c] border border-slate-200 dark:border-[#393a3b] flex items-center justify-center text-slate-600 dark:text-[#b0b3b8]">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-[#e4e6eb]">{accountData?.primaryEmail || user?.email}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#3a3b3c] text-slate-700 dark:text-[#e4e6eb]">
                            Primary
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-[#b0b3b8]">Used for primary communications &amp; login</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {accountData?.isPrimaryEmailVerified ?? user?.isEmailVerified ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Verified</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendOtp(accountData?.primaryEmail || user?.email || '')}
                          disabled={isSendingOtp}
                          className="px-3 py-1 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Verify Now</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Additional Emails */}
                  {accountData?.additionalEmails?.map((item: UserEmailItem) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-[#18191a]/50 border border-slate-200/80 dark:border-[#393a3b] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#3a3b3c] border border-slate-200 dark:border-[#393a3b] flex items-center justify-center text-slate-600 dark:text-[#b0b3b8]">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-[#e4e6eb]">{item.email}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                              Additional
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 dark:text-[#b0b3b8]">
                            {item.isVerified ? 'Active login email' : 'Verification pending'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {item.isVerified ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Verified</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendOtp(item.email)}
                            disabled={isSendingOtp}
                            className="px-3 py-1 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Verify Code</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteEmail(item.id, item.email)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Remove email"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Email Form */}
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-[#393a3b]">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-[#e4e6eb] mb-2">Add New Email Address</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="e.g. yourname@example.com"
                      className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-[#3a3b3c] focus:bg-white dark:focus:bg-[#3a3b3c] text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 dark:placeholder:text-[#b0b3b8] border border-slate-200 dark:border-[#393a3b] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendOtp(newEmail.trim())}
                      disabled={isSendingOtp || !newEmail || !newEmail.includes('@')}
                      className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-brand-600/20 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSendingOtp ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Adding Email...
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          Add Email
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: PASSWORD & SECURITY */}
          {/* ==================================================== */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white dark:bg-[#242526] rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-[#393a3b]">
                <div className="mb-6">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#e4e6eb] flex items-center gap-2">
                    <Key className="w-4.5 h-4.5 text-brand-600 dark:text-brand-400" />
                    Change Account Password
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#b0b3b8] mt-1">
                    Choose a strong, unique password to secure your OpenSocial account.
                  </p>
                </div>

                {passwordError && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-[#e4e6eb] block mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-[#3a3b3c] focus:bg-white dark:focus:bg-[#3a3b3c] text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 dark:placeholder:text-[#b0b3b8] border border-slate-200 dark:border-[#393a3b] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-[#e4e6eb] p-1 cursor-pointer"
                      >
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-[#e4e6eb] block mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-[#3a3b3c] focus:bg-white dark:focus:bg-[#3a3b3c] text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 dark:placeholder:text-[#b0b3b8] border border-slate-200 dark:border-[#393a3b] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-[#e4e6eb] p-1 cursor-pointer"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-[#e4e6eb] block mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-[#3a3b3c] focus:bg-white dark:focus:bg-[#3a3b3c] text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 dark:placeholder:text-[#b0b3b8] border border-slate-200 dark:border-[#393a3b] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-[#e4e6eb] p-1 cursor-pointer"
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-brand-600/20 cursor-pointer flex items-center justify-center gap-2 mt-4"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Update Password
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: PRIVACY & PREFERENCES */}
          {/* ==================================================== */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white dark:bg-[#242526] rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-[#393a3b]">
                <div className="mb-6">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#e4e6eb] flex items-center gap-2">
                    <Shield className="w-4.5 h-4.5 text-brand-600 dark:text-brand-400" />
                    Privacy &amp; Online Status
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#b0b3b8] mt-1">
                    Control how other members view your profile and online activity.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Active Status Control */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#18191a]/50 border border-slate-200/80 dark:border-[#393a3b] flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isActiveStatus ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                          }`}
                        />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-[#e4e6eb]">Show Active Status</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-[#b0b3b8] mt-0.5">
                        Your friends will see when you are active on OpenSocial.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={toggleActiveStatus}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        isActiveStatus
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-200 dark:bg-[#3a3b3c] text-slate-700 dark:text-[#e4e6eb] hover:bg-slate-300 dark:hover:bg-[#4e4f50]'
                      }`}
                    >
                      {isActiveStatus ? 'Enabled 🟢' : 'Disabled ⚪'}
                    </button>
                  </div>

                  {/* Profile Visibility */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#18191a]/50 border border-slate-200/80 dark:border-[#393a3b] flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-[#e4e6eb]">Public Profile &amp; Feed</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-[#b0b3b8] mt-0.5">
                        Allow other registered users to see your public posts and connect.
                      </p>
                    </div>

                    <span className="px-3 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 rounded-full text-[11px] font-bold">
                      Standard
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
