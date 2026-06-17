import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import {
  GraduationCap, ShieldAlert, KeyRound, Mail, Loader2,
  ArrowRight, BookOpen, Award, Users, FileText,
  Clock, Info
} from 'lucide-react';
import loginBg from '../../assets/login-bg.jpg';

const loginFormSchema = z.object({
  email: z.string().email({ message: 'A valid university email is required' }),
  password: z.string().min(5, { message: 'Password must be at least 5 characters long' }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const ROLE_CONFIG = [
  {
    role: 'Admin' as const,
    email: 'admin@aditya.edu.in',
    password: 'admin123',
    icon: ShieldAlert,
    label: 'Administrator',
  },
  {
    role: 'HOD' as const,
    email: 'hod.cse@aditya.edu.in',
    password: 'hod123',
    icon: Award,
    label: 'Head of Dept.',
  },
  {
    role: 'Coordinator' as const,
    email: 'coord.cse@aditya.edu.in',
    password: 'coord123',
    icon: BookOpen,
    label: 'Coordinator',
  },
  {
    role: 'Faculty' as const,
    email: 'faculty.cse@aditya.edu.in',
    password: 'faculty123',
    icon: Users,
    label: 'Faculty Member',
  },
];

export const Login: React.FC = () => {
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
  });

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

  const fillCredentials = (role: typeof ROLE_CONFIG[0]) => {
    setValue('email', role.email);
    setValue('password', role.password);
    setSelectedRole(role.role);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden font-sans flex items-center justify-center p-4 sm:p-8 animate-fadeIn">
      
      {/* ── Background Layer with Parallax & Vignette ── */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center animate-parallax"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      {/* Overlay: blur max 4px, linear dark gradient, vignette */}
      <div 
        className="absolute inset-0 z-0 backdrop-blur-[4px] vignette"
        style={{ background: 'linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.45))' }}
      />

      {/* ── Top-Level Premium Elements ── */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 pointer-events-none">
        {/* Left: Version */}
        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <Info className="w-3.5 h-3.5 text-white/80" />
          <span className="text-white/90 text-xs font-medium tracking-wide">OBCP v1.0</span>
        </div>

        {/* Right: Status & Time */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
            <span className="text-green-50 text-xs font-medium tracking-wide">System Online</span>
          </div>
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <Clock className="w-3.5 h-3.5 text-white/80" />
            <span className="text-white/90 text-xs font-medium tracking-wide">{currentTime}</span>
          </div>
        </div>
      </div>

      {/* ── Premium Glassmorphism Container ── */}
      {/* 1200px max, white 85%, blur 20px, 32px radius, specific shadow */}
      <div 
        className="relative z-10 w-full max-w-[1200px] rounded-[32px] overflow-hidden flex flex-col lg:flex-row shadow-premium-glass border border-white/30"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      >

        {/* ── LEFT PANEL — Branding (Orange Gradient) ── */}
        <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-8 xl:p-10 text-white relative overflow-hidden"
             style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #FF8C1A 100%)' }}>
          
          {/* Floating Geometric Shapes */}
          <svg className="absolute -top-20 -left-20 w-96 h-96 opacity-20 animate-float-slow" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#ffffff" d="M45.7,-76.1C58.9,-69.3,68.9,-54.9,76.5,-40C84,-25.1,89,-9.8,87.6,5.1C86.3,20,78.5,34.4,68.8,46.8C59.1,59.2,47.4,69.5,33.5,76C19.7,82.5,3.6,85.2,-11.2,83.1C-26,81,-39.6,74.1,-52.1,64.9C-64.6,55.7,-76,44.2,-82.1,30.3C-88.3,16.4,-89.2,0,-85.4,-14.8C-81.6,-29.6,-73.1,-42.8,-61.4,-52C-49.8,-61.2,-35,-66.3,-21.2,-69.5C-7.4,-72.7,5.5,-73.9,20.2,-74.6C34.8,-75.4,49.5,-75.7,45.7,-76.1Z" transform="translate(100 100)" />
          </svg>
          <svg className="absolute -bottom-32 -right-32 w-[500px] h-[500px] opacity-10 animate-float-medium" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#ffffff" d="M39.9,-65.4C52.6,-57.4,64.3,-47.5,72.6,-34.9C80.8,-22.3,85.6,-6.9,82.9,7.5C80.3,21.9,70.1,35.3,58.8,46.2C47.4,57.1,34.8,65.5,21.1,70.1C7.4,74.7,-7.4,75.4,-21.1,71.7C-34.7,68,-47.3,59.8,-57.5,48.8C-67.6,37.8,-75.3,24.1,-79.1,9.4C-82.9,-5.4,-82.7,-21.1,-75.8,-33.9C-68.8,-46.8,-55.1,-56.8,-41.4,-64.3C-27.6,-71.8,-13.8,-76.9,0.3,-77.3C14.3,-77.8,27.3,-73.4,39.9,-65.4Z" transform="translate(100 100)" />
          </svg>

          {/* Top Logo Area */}
          <div className="relative z-10 flex flex-col items-start">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-lg">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-wider uppercase drop-shadow-sm">Aditya University</h1>
                <p className="text-white/90 text-xs font-semibold tracking-widest uppercase">Inspiring Excellence</p>
              </div>
            </div>
            
            {/* NBA Badge */}
            <div className="mt-2 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-lg">
              <Award className="w-3.5 h-3.5 text-yellow-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">NBA Accreditation Ready Platform</span>
            </div>
          </div>

          {/* Center Titles */}
          <div className="relative z-10 my-4">
            <h2 className="text-[40px] xl:text-[46px] font-[800] leading-[1.05] tracking-tight drop-shadow-md">
              Outcome Based<br />Curriculum Planning<br />& Mapping Portal
            </h2>
            <p className="text-[16px] opacity-90 mt-4 leading-relaxed max-w-md font-medium">
              Seamlessly manage outcome-based curriculum mapping, syllabus governance, and accreditation workflows.
            </p>
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center gap-3">
             <div className="w-10 h-1 bg-white/30 rounded-full" />
             <p className="text-white/80 text-[10px] font-semibold uppercase tracking-widest">
               Secure Access Layer
             </p>
          </div>
        </div>

        {/* ── RIGHT PANEL — Login Form (White Glass) ── */}
        <div className="flex-1 flex flex-col p-6 sm:p-10 relative bg-white/40 backdrop-blur-sm justify-center">
          
          <div className="max-w-[460px] w-full mx-auto">
            {/* Mobile Header (Visible only on small screens) */}
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#FF8C1A] flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-800 uppercase tracking-wide">Aditya University</h1>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">OBCP & Mapping Portal</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl xl:text-3xl font-extrabold text-slate-800 tracking-tight">Welcome Back</h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Select your role or enter your credentials directly.
              </p>
            </div>

            {/* Role Selection Premium Cards */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-3">
                {ROLE_CONFIG.map((rc) => {
                  const Icon = rc.icon;
                  const isSelected = selectedRole === rc.role;
                  return (
                    <button
                      key={rc.role}
                      type="button"
                      onClick={() => fillCredentials(rc)}
                      className={`
                        flex items-center gap-2.5 p-3 rounded-2xl font-semibold transition-all duration-300 ease-out hover:scale-[1.03] text-left
                        ${isSelected 
                          ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF8C1A] text-white shadow-glow-orange border-transparent' 
                          : 'bg-white/70 border border-[#E5E7EB] text-slate-700 hover:border-[#FF6B00]/50 hover:shadow-lg'
                        }
                      `}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] leading-tight truncate">{rc.role}</p>
                        <p className={`text-[10px] truncate ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>{rc.label}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or enter email</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="mb-5 p-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex items-start gap-2 animate-fadeIn">
                <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-bold text-slate-700">University Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-[#FF6B00]" />
                  <input
                    type="email"
                    placeholder="user@aditya.edu.in"
                    {...register('email')}
                    className={`
                      w-full h-[50px] bg-white/60 backdrop-blur-sm border text-slate-800 text-[14px] pl-11 pr-4 rounded-[16px]
                      placeholder:text-slate-400 placeholder:font-medium
                      focus:outline-none focus:border-[#FF6B00] focus:shadow-glow-orange
                      transition-all duration-300
                      ${errors.email ? 'border-red-300 bg-red-50/50' : 'border-slate-200'}
                    `}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-red-500 font-bold ml-1 animate-fadeIn">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[13px] font-bold text-slate-700">Password</label>
                  <a href="#" className="text-[11px] font-bold text-[#FF6B00] hover:text-[#e66000] transition-colors">Forgot?</a>
                </div>
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-[#FF6B00]" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    className={`
                      w-full h-[50px] bg-white/60 backdrop-blur-sm border text-slate-800 text-[14px] pl-11 pr-4 rounded-[16px]
                      placeholder:text-slate-400
                      focus:outline-none focus:border-[#FF6B00] focus:shadow-glow-orange
                      transition-all duration-300
                      ${errors.password ? 'border-red-300 bg-red-50/50' : 'border-slate-200'}
                    `}
                  />
                </div>
                {errors.password && (
                  <p className="text-[11px] text-red-500 font-bold ml-1 animate-fadeIn">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="
                  w-full h-[52px] mt-4 bg-gradient-to-r from-[#FF6B00] to-[#FF8C1A] 
                  hover:from-[#e66000] hover:to-[#ff7b00]
                  disabled:opacity-70 disabled:cursor-not-allowed
                  text-white rounded-[16px] font-bold text-[14px] tracking-wide
                  transition-all duration-300 ease-out shadow-lg hover:shadow-glow-orange hover:-translate-y-[2px]
                  flex items-center justify-center gap-2 group relative overflow-hidden
                "
              >
                {/* Shine animation overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shine" />
                
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                    <span className="relative z-10">Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span className="relative z-10">Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 relative z-10" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-[10px] font-semibold text-slate-400 mt-6">
              Protected by Enterprise Security Framework
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
