import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, ShieldAlert,
  AlertTriangle, Shield, Building2, BookOpen, Users,
  Zap, Award, BookMarked, BarChart3, ShieldCheck,
} from 'lucide-react';
import heroBg from '../../assets/hero-bg.png';
import adityaLogo from '../../assets/aditya-logo-gold.png';

/* ═══════════════════════════════════════════════════
   SCHEMA — auth logic untouched
═══════════════════════════════════════════════════ */
const loginFormSchema = z.object({
  email: z.string().email({ message: 'Enter a valid university email' }),
  password: z.string().min(5, { message: 'Minimum 5 characters required' }),
});
type LoginFormValues = z.infer<typeof loginFormSchema>;

/* ═══════════════════════════════════════════════════
   ROLE CONFIG — credentials untouched
═══════════════════════════════════════════════════ */
const ROLE_CONFIG = [
  {
    role: 'Admin' as const,
    email: 'admin@aditya.edu.in',
    password: 'admin123',
    Icon: Shield,
    label: 'Administrator',
    desc: 'System & University Mgmt.',
  },
  {
    role: 'HOD' as const,
    email: 'hod.cse@aditya.edu.in',
    password: 'hod123',
    Icon: Building2,
    label: 'Head of Dept.',
    desc: 'Department Planning',
  },
  {
    role: 'Coordinator' as const,
    email: 'coord.cse@aditya.edu.in',
    password: 'coord123',
    Icon: BookOpen,
    label: 'Course Coordinator',
    desc: 'Curriculum & CO-PO',
  },
  {
    role: 'Faculty' as const,
    email: 'faculty.cse@aditya.edu.in',
    password: 'faculty123',
    Icon: Users,
    label: 'Faculty Member',
    desc: 'Teaching & Attainment',
  },
] as const;

/* ── Feature cards ── */
const FEATURES = [
  { Icon: Zap, label: 'CO-PO Mapping', sub: 'Automated attainment' },
  { Icon: Award, label: 'NBA Accreditation', sub: 'Ready workflows' },
  { Icon: BookMarked, label: 'Curriculum Mgmt.', sub: 'Syllabus governance' },
];

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
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
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
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
  });

  /* Fill credentials — unchanged */
  const fillCredentials = (rc: typeof ROLE_CONFIG[number]) => {
    setValue('email', rc.email, { shouldValidate: true });
    setValue('password', rc.password, { shouldValidate: true });
    setSelectedRole(rc.role);
    setErrorMsg(null);
  };

  /* Submit — unchanged API */
  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.auth.login(values);
      login(data.user, data.accessToken, data.refreshToken);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
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
        backgroundPosition: 'center 20%',
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
            justifyContent: 'center',
          }}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Logo */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              display: 'inline-flex',
              background: '#ffffff',
              padding: '14px 28px',
              borderRadius: 18,
              boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(212,175,55,0.3)',
            }}>
              <img
                src={adityaLogo}
                alt="Aditya University"
                style={{
                  height: 64, width: 'auto',
                  display: 'block',
                }}
              />
            </div>
          </div>

          {/* NBA badge */}
          <div style={{ marginBottom: 16 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '5px 14px', borderRadius: 99,
              background: 'rgba(212,175,55,0.12)',
              border: `1px solid rgba(212,175,55,0.40)`,
              color: C.gold,
              fontSize: 10.5, fontWeight: 700, letterSpacing: '0.09em',
              textTransform: 'uppercase',
            }}>
              🏆&nbsp; NBA &amp; NAAC Accreditation Ready Platform
            </span>
          </div>

          {/* Main heading */}
          <div style={{ marginBottom: 16 }}>
            <h1 style={{
              color: C.text,
              fontSize: 'clamp(22px, 2.8vw, 38px)',
              fontWeight: 900, lineHeight: 1.14,
              letterSpacing: '-0.01em', margin: 0,
              textTransform: 'uppercase',
              textShadow: '0 2px 20px rgba(0,0,0,0.6)',
            }}>
              OUTCOME BASED<br />
              <span style={{
                background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.orange})`,
                backgroundSize: '200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                CURRICULUM<br />
                PLANNING
              </span>
              <br />
              &amp; MAPPING PORTAL
            </h1>
          </div>

          {/* Subtitle */}
          <p style={{
            color: 'rgba(255,255,255,0.68)', fontSize: 13, lineHeight: 1.65,
            margin: '0 0 24px', maxWidth: 480,
          }}>
            A unified platform for Outcome Based Curriculum Design,<br />
            CO-PO Mapping, Syllabus Governance,<br />
            and NBA Accreditation.
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

            {/* ── Sign In header ── */}
            <h2 style={{
              color: C.text, fontSize: 21, fontWeight: 800,
              letterSpacing: '-0.01em', margin: '0 0 4px',
            }}>Sign In</h2>
            <p style={{ color: C.muted, fontSize: 12, margin: '0 0 20px', lineHeight: 1.5 }}>
              Access your academic workspace and manage curriculum activities.
            </p>

            {/* ── Role Selector ── */}
            <p style={{
              color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 9px',
            }}>Select Role</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 16 }}>
              {ROLE_CONFIG.map((rc) => {
                const isSel = selectedRole === rc.role;
                return (
                  <motion.button
                    key={rc.role}
                    type="button"
                    onClick={() => fillCredentials(rc)}
                    whileHover={{ scale: 1.025, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '9px 11px',
                      borderRadius: 10, cursor: 'pointer',
                      background: isSel
                        ? 'rgba(249,115,22,0.14)'
                        : 'rgba(255,255,255,0.04)',
                      border: isSel
                        ? `1.5px solid ${C.orange}`
                        : '1.5px solid rgba(255,255,255,0.09)',
                      boxShadow: isSel ? `0 0 16px ${C.glow}` : 'none',
                      transition: 'all 0.22s ease',
                      position: 'relative', overflow: 'hidden',
                    }}
                  >
                    {/* Shimmer on selected */}
                    {isSel && (
                      <motion.div
                        style={{
                          position: 'absolute', inset: 0, pointerEvents: 'none',
                          background:
                            'linear-gradient(105deg, transparent 35%, rgba(249,115,22,0.12) 50%, transparent 65%)',
                        }}
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.2 }}
                      />
                    )}

                    {/* Icon */}
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isSel ? 'rgba(249,115,22,0.22)' : 'rgba(255,255,255,0.06)',
                      border: isSel ? `1px solid rgba(249,115,22,0.45)` : '1px solid rgba(255,255,255,0.09)',
                      transition: 'all 0.22s ease',
                    }}>
                      <rc.Icon style={{
                        width: 14, height: 14,
                        color: isSel ? C.orange : 'rgba(255,255,255,0.45)',
                        transition: 'color 0.22s',
                      }} />
                    </div>

                    {/* Label */}
                    <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                      <p style={{
                        color: isSel ? '#fff' : 'rgba(255,255,255,0.75)',
                        fontSize: 11.5, fontWeight: 700, margin: 0, lineHeight: 1.2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        transition: 'color 0.22s',
                      }}>{rc.label}</p>
                      <p style={{
                        color: isSel ? C.orange : 'rgba(255,255,255,0.35)',
                        fontSize: 10, margin: '2px 0 0', lineHeight: 1.2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        transition: 'color 0.22s',
                      }}>{rc.desc}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* ── Divider ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{
                color: 'rgba(255,255,255,0.28)', fontSize: 10, fontWeight: 600,
                letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}>or enter credentials</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* ── Error ── */}
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
            </AnimatePresence>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit(onSubmit)}>

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
                    placeholder="yourname@adityauniversity.in"
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
                  <a
                    href="#"
                    style={{ color: C.orange, fontSize: 11, fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = C.gold; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = C.orange; }}
                  >Forgot?</a>
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
                    placeholder="••••••••"
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
            </form>



          </div>{/* /glass card */}
        </motion.div>

      </div>{/* /content row */}
    </div>
  );
};
