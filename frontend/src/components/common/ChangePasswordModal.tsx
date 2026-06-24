import React, { useState, useEffect, useRef } from 'react';
import { useUIStore } from '../../store/uiStore';
import { api } from '../../services/api';
import { X, Key, ShieldAlert, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react';

export const ChangePasswordModal: React.FC = () => {
  const { changePasswordModalOpen, setChangePasswordModalOpen } = useUIStore();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && changePasswordModalOpen) {
        setChangePasswordModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [changePasswordModalOpen, setChangePasswordModalOpen]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setChangePasswordModalOpen(false);
      }
    };
    if (changePasswordModalOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [changePasswordModalOpen, setChangePasswordModalOpen]);

  // Clear state when modal opens/closes
  useEffect(() => {
    if (!changePasswordModalOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccess(null);
    }
  }, [changePasswordModalOpen]);

  if (!changePasswordModalOpen) return null;

  // Client-side validations
  const validate = () => {
    if (!currentPassword) {
      return 'Current password is required.';
    }
    if (newPassword.length < 8) {
      return 'Password must contain at least 8 characters.';
    }
    // Complex password check
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasDigit = /\d/.test(newPassword);
    const hasSpecial = /[@$!%*?&#]/.test(newPassword);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.';
    }
    if (newPassword !== confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const clientError = validate();
    if (clientError) {
      setError(clientError);
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.changePassword({ currentPassword, newPassword });
      setSuccess(res.message || 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setChangePasswordModalOpen(false);
      }, 1500);
    } catch (err: any) {
      console.error('[ChangePassword] Error:', err);
      setError(err.message || 'Failed to update password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn no-print">
      <div 
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-3xl border border-border shadow-card-lg overflow-hidden flex flex-col relative animate-slideUp"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 id="change-password-title" className="text-sm font-bold text-text-primary">Change Password</h2>
              <p className="text-[10px] text-text-subtle font-semibold mt-0.5">Secure your curriculum portal account</p>
            </div>
          </div>
          <button 
            onClick={() => setChangePasswordModalOpen(false)}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-bold text-slate-500">
          
          {/* Alerts */}
          {error && error !== 'Current password is incorrect.' && (
            <div className="p-4 bg-danger-50 border border-danger-100 text-danger-700 rounded-2xl flex items-start gap-3 font-semibold leading-relaxed animate-fadeIn">
              <ShieldAlert className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-success-50 border border-success-100 text-success-700 rounded-2xl flex items-start gap-3 font-semibold leading-relaxed animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Input 1: Current Password */}
          <div className="space-y-1.5 text-left relative">
            <label htmlFor="currentPassword">Current Password</label>
            <div className="relative">
              <input 
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setError(null);
                }}
                placeholder="••••••••"
                disabled={loading || !!success}
                className={`w-full border rounded-xl pl-3 pr-10 py-3 text-slate-700 font-medium bg-white outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 ${
                  error === 'Current password is incorrect.'
                    ? 'border-danger-400 focus:ring-danger-100 focus:border-danger-500'
                    : 'border-slate-300 focus:ring-indigo-100 focus:border-indigo-600'
                }`}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error === 'Current password is incorrect.' && (
              <p className="text-[10px] text-danger-600 font-bold pl-1 pt-0.5">
                Current password is incorrect. Please try again.
              </p>
            )}
          </div>

          {/* Input 2: New Password */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="newPassword">New Password</label>
            <div className="relative">
              <input 
                id="newPassword"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError(null);
                }}
                placeholder="••••••••"
                disabled={loading || !!success}
                className="w-full border border-slate-300 rounded-xl pl-3 pr-10 py-3 text-slate-700 font-medium bg-white outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 disabled:bg-slate-50 disabled:text-slate-400"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-text-subtle font-medium leading-relaxed pl-1 pt-0.5">
              Must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special symbol.
            </p>
          </div>

          {/* Input 3: Confirm Password */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="relative">
              <input 
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                }}
                placeholder="••••••••"
                disabled={loading || !!success}
                className={`w-full border rounded-xl pl-3 pr-10 py-3 text-slate-700 font-medium bg-white outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 ${
                  confirmPassword.length > 0 && newPassword !== confirmPassword 
                    ? 'border-danger-400 focus:ring-danger-100 focus:border-danger-500' 
                    : confirmPassword.length > 0 && newPassword === confirmPassword 
                      ? 'border-success-400 focus:ring-success-100 focus:border-success-500'
                      : 'border-slate-300 focus:ring-indigo-100 focus:border-indigo-600'
                }`}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-[10px] text-danger-600 font-bold pl-1 pt-0.5">
                Passwords do not match
              </p>
            )}
            {confirmPassword.length > 0 && newPassword === confirmPassword && (
              <p className="text-[10px] text-success-600 font-bold pl-1 pt-0.5">
                Passwords match
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setChangePasswordModalOpen(false)}
              disabled={loading}
              className="flex-1 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all text-center cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !!success}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
