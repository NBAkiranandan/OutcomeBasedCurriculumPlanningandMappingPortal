import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, ShieldAlert,
  AlertTriangle, Zap, Award, BookMarked, BarChart3, ShieldCheck,
} from 'lucide-react';
import heroBg from '../../assets/background.png';
import adityaLogoTransparent from '../../assets/aditya-logo-gold-transparent.png';

/* ═══════════════════════════════════════════════════
   SCHEMA — auth logic untouched
═══════════════════════════════════════════════════ */
const loginFormSchema = z.object({
  email: z.string().email({ message: 'Enter a valid university email' }),
  password: z.string().min(5, { message: 'Minimum 5 characters required' }),
});
type LoginFormValues = z.infer<typeof loginFormSchema>;

const forgotFormSchema = z.object({
  email: z.string().email({ message: 'Enter a valid university email' }),
});
type ForgotFormValues = z.infer<typeof forgotFormSchema>;

const resetFormSchema = z.object({
  otp: z.string().min(6, { message: 'OTP must be 6 characters' }),
  newPassword: z.string().min(5, { message: 'Minimum 5 characters required' }),
});
type ResetFormValues = z.infer<typeof resetFormSchema>;







/* ═══════════════════════════════════════════════════
   LIVE CLOCK
═══════════════════════════════════════════════════ */
const useClock = () => {
  const [ts, setTs] = useState('');
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const d = n.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const t = n.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      setTs(`${d}  ${t}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return ts;
};

/* ═══════════════════════════════════════════════════
   COLOR TOKENS
═══════════════════════════════════════════════════ */
const C = {
  orange: '#F97316',
  orangeDeep: '#EA580C',
  gold: '#D4AF37',
  goldDim: 'rgba(212,175,55,0.30)',
  panel: 'rgba(11,17,32,0.90)',
  border: 'rgba(249,115,22,0.22)',
  borderSel: '#F97316',
  glow: 'rgba(249,115,22,0.30)',
  glowStr: 'rgba(249,115,22,0.50)',
  muted: '#94a3b8',
  text: '#ffffff',
  inputBg: 'rgba(255,255,255,0.06)',
  inputBorder: 'rgba(255,255,255,0.10)',
};

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
export const Login: React.FC = () => {
  const { login } = useAuthStore();

  /* State */
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showPass, setShowPass] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);
  const ts = useClock();
  const btnRef = useRef<HTMLButtonElement>(null);

  /* Caps-lock */
  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.getModifierState) setCapsLock(e.getModifierState('CapsLock'));
  }, []);
  useEffect(() => {
    window.addEventListener('keyup', onKey);
    return () => window.removeEventListener('keyup', onKey);
  }, [onKey]);

  /* Form */
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
  });

  const { register: registerForgot, handleSubmit: handleSubmitForgot, formState: { errors: errorsForgot }, reset: resetForgot } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotFormSchema),
  });

  const { register: registerReset, handleSubmit: handleSubmitReset, formState: { errors: errorsReset }, reset: resetReset } = useForm<ResetFormValues>({
    resolver: zodResolver(resetFormSchema),
  });

  /* Submit — Login */
  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const data = await api.auth.login(values);
      login(data.user, data.accessToken, data.refreshToken);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  /* Submit — Forgot */
  const onForgotSubmit = async (values: ForgotFormValues) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await api.auth.forgotPassword(values.email);
      setResetEmail(values.email);
      setView('reset');
      setSuccessMsg('OTP sent to your email.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  /* Submit — Reset */
  const onResetSubmit = async (values: ResetFormValues) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await api.auth.resetPassword({ email: resetEmail, otp: values.otp, newPassword: values.newPassword });
      setView('login');
      setSuccessMsg('Password reset successful. Please login.');
      resetForgot();
      resetReset();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  /* Input border */
  const iBorder = (focused: boolean, err: boolean) => {
    if (err) return `1.5px solid rgba(248,113,113,0.7)`;
    if (focused) return `1.5px solid ${C.orange}`;
    return `1.5px solid ${C.inputBorder}`;
  };
  const iShadow = (focused: boolean) =>
    focused ? `0 0 0 3px ${C.glow}` : 'none';

  /* ═══════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════ */
  return (
    <div style={{
      height: '100vh', width: '100vw',
      overflow: 'hidden', position: 'relative',
      display: 'flex', alignItems: 'stretch',
      fontFamily: "'Inter','Outfit',system-ui,sans-serif",
    }}>

      {/* ░░ FULL-SCREEN BACKGROUND ░░ */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
      }} />

      {/* Ultra-thin left-side overlay for text contrast only */}
      <div style={{
        position: 'absolute', inset: 0,
        background:
          'linear-gradient(100deg, rgba(4,8,22,0.60) 0%, rgba(4,8,22,0.25) 50%, rgba(4,8,22,0.05) 100%)',
      }} />

      {/* Live timestamp — bottom right */}
      <div style={{
        position: 'absolute', bottom: 10, right: 16, zIndex: 20,
        color: 'rgba(255,255,255,0.35)', fontSize: 10.5,
        fontWeight: 500, letterSpacing: '0.04em',
      }}>{ts}</div>

      {/* Top Left Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'absolute', top: 32, left: 44, zIndex: 20,
        }}
      >
        <img
          src={adityaLogoTransparent}
          alt="Aditya University"
          style={{
            height: 72, width: 'auto',
            filter: `drop-shadow(0 0 14px rgba(212,175,55,0.55))`,
          }}
        />
      </motion.div>

      {/* ░░ CONTENT ROW ░░ */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center',
        padding: '0 44px 0 52px', gap: 28,
      }}>

        {/* ╔═══════════════════════════════════╗
            ║   LEFT  58%  — Branding           ║
            ╚═══════════════════════════════════╝ */}
        <motion.div
          style={{
            flex: '0 0 58%',
            display: 'flex', flexDirection: 'column',
            gap: 0, height: '100%',
            justifyContent: 'flex-end',
            paddingBottom: 24,
          }}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Logo was moved to top left corner */}



          {/* Main heading */}
          <div style={{ marginBottom: 20 }}>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                fontFamily: "'Cinzel', serif",
                color: C.text,
                fontSize: 'clamp(26px, 3.2vw, 44px)',
                fontWeight: 700, lineHeight: 1.25,
                letterSpacing: '0.02em', margin: 0,
                textTransform: 'uppercase',
                textShadow: '0 4px 24px rgba(0,0,0,0.8), 0 0 10px rgba(212,175,55,0.3)',
            }}>
              Outcome Based<br />
              <motion.span 
                animate={{ backgroundPosition: ['0% center', '200% center'] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                style={{
                  display: 'inline-block',
                  background: `linear-gradient(to right, #D4AF37 0%, #FFF2CD 25%, #D4AF37 50%, #FFF2CD 75%, #D4AF37 100%)`,
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0px 0px 8px rgba(212,175,55,0.6))',
                  paddingRight: 10,
              }}>
                Curriculum Planning
              </motion.span>
              <br />
              <span style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.06em' }}>&amp; Mapping Portal</span>
            </motion.h1>
          </div>

          {/* Subtitle */}
          <p style={{
            color: 'rgba(255,255,255,0.68)', fontSize: 13, lineHeight: 1.65,
            margin: '0 0 24px', maxWidth: 480,
          }}>
            A unified platform for Outcome Based Curriculum Design, CO-PO Mapping,
            Syllabus Governance, and NBA Accreditation.
          </p>


        </motion.div>

        {/* ╔══════════════════════════════════════╗
            ║   RIGHT  42%  — Login Panel         ║
            ╚══════════════════════════════════════╝ */}
        <motion.div
          style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        >
          {/* Glassmorphism login card */}
          <div style={{
            width: '100%', maxWidth: 430,
            background: C.panel,
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            borderRadius: 18,
            border: `1px solid rgba(212,175,55,0.28)`,
            boxShadow: `0 0 0 1px rgba(249,115,22,0.10), 0 24px 64px rgba(0,0,0,0.60), 0 0 40px rgba(249,115,22,0.08)`,
            padding: '28px 28px 22px',
            position: 'relative', overflow: 'hidden',
          }}>

            {/* Gold top accent line */}
            <div style={{
              position: 'absolute', top: 0, left: '50%',
              transform: 'translateX(-50%)',
              width: '60%', height: 2, borderRadius: 99,
              background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
            }} />

            {/* Subtle inner glow top-right */}
            <div style={{
              position: 'absolute', top: -40, right: -40,
              width: 180, height: 180, borderRadius: '50%', pointerEvents: 'none',
              background: `radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)`,
            }} />

            {/* ── Dynamic Header ── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 style={{
                  color: C.text, fontSize: 21, fontWeight: 800,
                  letterSpacing: '-0.01em', margin: '0 0 4px',
                }}>
                  {view === 'login' && 'Sign In'}
                  {view === 'forgot' && 'Reset Password'}
                  {view === 'reset' && 'Create New Password'}
                </h2>
                <p style={{ color: C.muted, fontSize: 12, margin: '0 0 20px', lineHeight: 1.5 }}>
                  {view === 'login' && 'Access your academic workspace and manage curriculum activities.'}
                  {view === 'forgot' && 'Enter your university email to receive an OTP.'}
                  {view === 'reset' && `Enter the OTP sent to ${resetEmail} and your new password.`}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* ── Messages ── */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.22 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 12px', borderRadius: 9,
                    background: 'rgba(239,68,68,0.09)',
                    border: '1px solid rgba(239,68,68,0.28)',
                  }}
                >
                  <ShieldAlert style={{ width: 13, height: 13, color: '#f87171', flexShrink: 0 }} />
                  <span style={{ color: '#fca5a5', fontSize: 12, fontWeight: 500 }}>{errorMsg}</span>
                </motion.div>
              )}
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.22 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 12px', borderRadius: 9,
                    background: 'rgba(34,197,94,0.09)',
                    border: '1px solid rgba(34,197,94,0.28)',
                  }}
                >
                  <ShieldCheck style={{ width: 13, height: 13, color: '#4ade80', flexShrink: 0 }} />
                  <span style={{ color: '#86efac', fontSize: 12, fontWeight: 500 }}>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Forms ── */}
            <AnimatePresence mode="wait">
              {view === 'login' && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit(onSubmit)}
                >

              {/* Email */}
              <div style={{ marginBottom: 11 }}>
                <label style={{
                  display: 'block', color: 'rgba(255,255,255,0.60)',
                  fontSize: 11.5, fontWeight: 600, marginBottom: 5,
                }}>University Email</label>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  background: C.inputBg,
                  border: iBorder(emailFocused, !!errors.email),
                  borderRadius: 10, padding: '0 12px', gap: 9,
                  boxShadow: iShadow(emailFocused),
                  transition: 'all 0.2s ease',
                }}>
                  <Mail style={{
                    width: 14, height: 14, flexShrink: 0,
                    color: emailFocused ? C.orange : 'rgba(255,255,255,0.30)',
                    transition: 'color 0.2s',
                  }} />
                  <input
                    type="email"
                    id="login-email"
                    {...register('email')}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    autoComplete="email"
                    style={{
                      flex: 1, height: 42, background: 'transparent',
                      border: 'none', outline: 'none',
                      color: '#fff', fontSize: 13, caretColor: C.orange,
                    }}
                  />
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{ color: '#f87171', fontSize: 11, fontWeight: 600, margin: '4px 0 0 2px' }}
                    >{errors.email.message}</motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <label style={{ color: 'rgba(255,255,255,0.60)', fontSize: 11.5, fontWeight: 600 }}>
                    Password
                  </label>
                  {/* 
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); setErrorMsg(null); setSuccessMsg(null); setView('forgot'); }}
                    style={{ color: C.orange, fontSize: 11, fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = C.gold; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = C.orange; }}
                  >Forgot?</a>
                  */}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  background: C.inputBg,
                  border: iBorder(passFocused, !!errors.password),
                  borderRadius: 10, padding: '0 12px', gap: 9,
                  boxShadow: iShadow(passFocused),
                  transition: 'all 0.2s ease',
                }}>
                  <Lock style={{
                    width: 14, height: 14, flexShrink: 0,
                    color: passFocused ? C.orange : 'rgba(255,255,255,0.30)',
                    transition: 'color 0.2s',
                  }} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    id="login-password"
                    {...register('password')}
                    onFocus={() => setPassFocused(true)}
                    onBlur={() => setPassFocused(false)}
                    autoComplete="current-password"
                    style={{
                      flex: 1, height: 42, background: 'transparent',
                      border: 'none', outline: 'none',
                      color: '#fff', fontSize: 13, caretColor: C.orange,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    tabIndex={-1}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.30)', padding: 2,
                      display: 'flex', alignItems: 'center', transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.orange; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.30)'; }}
                  >
                    {showPass
                      ? <EyeOff style={{ width: 14, height: 14 }} />
                      : <Eye style={{ width: 14, height: 14 }} />}
                  </button>
                </div>

                <AnimatePresence>
                  {capsLock && passFocused && (
                    <motion.div
                      initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, margin: '4px 0 0 2px' }}
                    >
                      <AlertTriangle style={{ width: 11, height: 11, color: '#fbbf24' }} />
                      <span style={{ color: '#fbbf24', fontSize: 11, fontWeight: 600 }}>Caps Lock is ON</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ color: '#f87171', fontSize: 11, fontWeight: 600, margin: '4px 0 0 2px' }}
                    >{errors.password.message}</motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* ── "Access OBCP Portal" Button ── */}
              <motion.button
                ref={btnRef}
                type="submit"
                id="login-submit"
                disabled={loading}
                whileHover={!loading ? {
                  y: -2, scale: 1.015,
                  boxShadow: `0 14px 40px ${C.glowStr}`,
                } : {}}
                whileTap={!loading ? { scale: 0.975 } : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                style={{
                  width: '100%', height: 48, borderRadius: 10,
                  background: loading
                    ? 'rgba(234,88,12,0.40)'
                    : `linear-gradient(135deg, ${C.orange} 0%, ${C.orangeDeep} 100%)`,
                  border: 'none',
                  color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: '0.03em',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  position: 'relative', overflow: 'hidden',
                  boxShadow: loading ? 'none' : `0 8px 28px ${C.glow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
                }}
              >
                {/* Shine sweep */}
                <motion.div
                  style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'linear-gradient(105deg, transparent 36%, rgba(255,255,255,0.20) 50%, transparent 64%)',
                  }}
                  animate={{ x: ['-100%', '220%'] }}
                  transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2.5 }}
                />

                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {loading ? (
                    <><Loader2 style={{ width: 15, height: 15 }} className="animate-spin" /> Authenticating…</>
                  ) : (
                    <>
                      Access OBCP Portal
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <ArrowRight style={{ width: 15, height: 15 }} />
                      </motion.div>
                    </>
                  )}
                </span>
              </motion.button>
                </motion.form>
              )}

              {view === 'forgot' && (
                <motion.form
                  key="forgot"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmitForgot(onForgotSubmit)}
                >
                  {/* Email */}
                  <div style={{ marginBottom: 11 }}>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.60)', fontSize: 11.5, fontWeight: 600, marginBottom: 5 }}>
                      University Email
                    </label>
                    <div style={{
                      display: 'flex', alignItems: 'center', background: C.inputBg, border: iBorder(emailFocused, !!errorsForgot.email),
                      borderRadius: 10, padding: '0 12px', gap: 9, boxShadow: iShadow(emailFocused), transition: 'all 0.2s ease',
                    }}>
                      <Mail style={{ width: 14, height: 14, color: emailFocused ? C.orange : 'rgba(255,255,255,0.30)' }} />
                      <input
                        type="email"
                        {...registerForgot('email')}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        autoComplete="email"
                        style={{ flex: 1, height: 42, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, caretColor: C.orange }}
                      />
                    </div>
                    <AnimatePresence>
                      {errorsForgot.email && (
                        <motion.p initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ color: '#f87171', fontSize: 11, fontWeight: 600, margin: '4px 0 0 2px' }}>
                          {errorsForgot.email.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                    <motion.button
                      type="button"
                      onClick={() => { setView('login'); setErrorMsg(null); setSuccessMsg(null); resetForgot(); }}
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        flex: 1, height: 48, borderRadius: 10,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      Back to Login
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02, boxShadow: `0 8px 25px ${C.glowStr}` }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        flex: 1, height: 48, borderRadius: 10,
                        background: loading ? 'rgba(234,88,12,0.40)' : `linear-gradient(135deg, ${C.orange} 0%, ${C.orangeDeep} 100%)`,
                        border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      {loading ? <Loader2 className="animate-spin" size={15} /> : <>Send OTP <ArrowRight size={15} /></>}
                    </motion.button>
                  </div>
                </motion.form>
              )}

              {view === 'reset' && (
                <motion.form
                  key="reset"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmitReset(onResetSubmit)}
                >
                  {/* OTP */}
                  <div style={{ marginBottom: 11 }}>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.60)', fontSize: 11.5, fontWeight: 600, marginBottom: 5 }}>
                      6-Digit OTP
                    </label>
                    <div style={{
                      display: 'flex', alignItems: 'center', background: C.inputBg, border: iBorder(otpFocused, !!errorsReset.otp),
                      borderRadius: 10, padding: '0 12px', gap: 9, boxShadow: iShadow(otpFocused), transition: 'all 0.2s ease',
                    }}>
                      <Lock style={{ width: 14, height: 14, color: otpFocused ? C.orange : 'rgba(255,255,255,0.30)' }} />
                      <input
                        type="text"
                        maxLength={6}
                        {...registerReset('otp')}
                        onFocus={() => setOtpFocused(true)}
                        onBlur={() => setOtpFocused(false)}
                        style={{ flex: 1, height: 42, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, caretColor: C.orange, letterSpacing: '0.2em' }}
                      />
                    </div>
                    <AnimatePresence>
                      {errorsReset.otp && (
                        <motion.p initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ color: '#f87171', fontSize: 11, fontWeight: 600, margin: '4px 0 0 2px' }}>
                          {errorsReset.otp.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* New Password */}
                  <div style={{ marginBottom: 13 }}>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.60)', fontSize: 11.5, fontWeight: 600, marginBottom: 5 }}>
                      New Password
                    </label>
                    <div style={{
                      display: 'flex', alignItems: 'center', background: C.inputBg, border: iBorder(passFocused, !!errorsReset.newPassword),
                      borderRadius: 10, padding: '0 12px', gap: 9, boxShadow: iShadow(passFocused), transition: 'all 0.2s ease',
                    }}>
                      <Lock style={{ width: 14, height: 14, color: passFocused ? C.orange : 'rgba(255,255,255,0.30)' }} />
                      <input
                        type={showPass ? 'text' : 'password'}
                        {...registerReset('newPassword')}
                        onFocus={() => setPassFocused(true)}
                        onBlur={() => setPassFocused(false)}
                        style={{ flex: 1, height: 42, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, caretColor: C.orange }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((s) => !s)}
                        tabIndex={-1}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.30)', padding: 2 }}
                      >
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <AnimatePresence>
                      {errorsReset.newPassword && (
                        <motion.p initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ color: '#f87171', fontSize: 11, fontWeight: 600, margin: '4px 0 0 2px' }}>
                          {errorsReset.newPassword.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                    <motion.button
                      type="button"
                      onClick={() => { setView('login'); setErrorMsg(null); setSuccessMsg(null); resetReset(); }}
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        flex: 1, height: 48, borderRadius: 10,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02, boxShadow: `0 8px 25px ${C.glowStr}` }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        flex: 1, height: 48, borderRadius: 10,
                        background: loading ? 'rgba(234,88,12,0.40)' : `linear-gradient(135deg, ${C.orange} 0%, ${C.orangeDeep} 100%)`,
                        border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      {loading ? <Loader2 className="animate-spin" size={15} /> : <>Reset Password <ArrowRight size={15} /></>}
                    </motion.button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>



          </div>{/* /glass card */}
        </motion.div>

      </div>{/* /content row */}
    </div>
  );
};
