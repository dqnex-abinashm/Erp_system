import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/logo.png';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Building2,
  Cpu,
  Layers,
  ArrowLeft,
  RotateCw,
  Sparkles
} from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { initiateLogin, verifyOtpAndLogin, resendOtpCode, isAuthenticated, loading } = useAuth();

  // Step state: 1 = Email + Password, 2 = OTP Verification
  const [step, setStep] = useState(1);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // OTP state (6 digits)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [latestDevOtp, setLatestDevOtp] = useState('');
  const [countdown, setCountdown] = useState(45);
  const [canResend, setCanResend] = useState(false);

  // Status & Feedback
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otpInputRefs = useRef([]);
  const from = location.state?.from?.pathname || '/';

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Resend countdown timer
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Handle Step 1: Credentials submission
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    const result = await initiateLogin(email, password);
    setIsSubmitting(false);

    if (result.success && result.requiresOtp) {
      setStep(2);
      setCountdown(45);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      if (result.data?.devOtp) {
        setLatestDevOtp(result.data.devOtp);
      }
      setInfoMessage(`A 6-digit security code has been sent to ${email}`);
      // Focus first OTP input
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } else {
      setError(result.message || 'Invalid email or password. Please try again.');
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    // Only allow single numeric digit
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleaned;
    setOtpDigits(newDigits);
    setError('');

    // Auto-advance to next box
    if (cleaned && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP backspace navigation
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newDigits = ['', '', '', '', '', ''];
      for (let i = 0; i < pastedData.length; i++) {
        newDigits[i] = pastedData[i];
      }
      setOtpDigits(newDigits);
      const focusIndex = Math.min(pastedData.length, 5);
      otpInputRefs.current[focusIndex]?.focus();
    }
  };

  // Auto-fill OTP
  const handleAutoFillOtp = () => {
    if (latestDevOtp && latestDevOtp.length === 6) {
      setOtpDigits(latestDevOtp.split(''));
      setError('');
      otpInputRefs.current[5]?.focus();
    }
  };

  // Handle Step 2: OTP verification submission
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');

    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of the verification code');
      return;
    }

    setIsSubmitting(true);
    setError('');
    const result = await verifyOtpAndLogin(email, fullOtp);
    setIsSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message || 'Invalid or expired OTP code. Please try again.');
    }
  };

  // Handle Resend OTP
  const handleResend = async () => {
    if (!canResend) return;
    setError('');
    setIsSubmitting(true);
    const result = await resendOtpCode(email);
    setIsSubmitting(false);

    if (result.success) {
      setCountdown(45);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      if (result.data?.devOtp) {
        setLatestDevOtp(result.data.devOtp);
      }
      setInfoMessage(`New verification code sent to ${email}`);
      otpInputRefs.current[0]?.focus();
    } else {
      setError(result.message || 'Failed to resend code');
    }
  };

  // Auto-fill credentials in step 1
  const handleQuickFillCredentials = () => {
    setEmail('admin@gmail.com');
    setPassword('Admin@123');
    setError('');
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0f172a] text-slate-100 relative overflow-hidden font-sans">
      {/* Decorative ambient glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Left Column - Enterprise Info & Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 lg:p-16 border-r border-slate-800/80 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-slate-950/90 relative z-10">
        <div>
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 p-1.5 flex items-center justify-center shadow-lg border border-white/10 backdrop-blur-md">
              <img src={logoImg} alt="ORRNEX" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight leading-none">
                <span className="text-white">ORR</span>
                <span className="text-amber-500">NEX</span>
              </div>
              <div className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase mt-1">
                Industrial ERP Solutions
              </div>
            </div>
          </div>

          <div className="mt-20">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Secure 2-Factor Authentication
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Enterprise Grade Security & ERP Orchestration.
            </h1>
            <p className="mt-5 text-base text-slate-300 leading-relaxed max-w-lg">
              Corrugation production, multi-plant inventory, customer accounts, machine utilization, and billing protected by two-factor verification.
            </p>

            {/* Feature Highlights */}
            <div className="mt-10 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Layers className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Full Supply Chain & Material Control</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time roll paper inventory, GSM calculations, and wastage controls.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Cpu className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Real-time Machine Monitoring</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Corrugator speeds, maintenance alarms, and shift-wise production targets.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Centralized Sales & Procurement</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Integrated quotes, tax invoices, purchase orders, and vendor statements.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-8 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} ORRNEX ERP. All rights reserved.</span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Protected by OTP 2FA
          </span>
        </div>
      </div>

      {/* Right Column - Multi-Step Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center shadow-lg border border-white/10">
              <img src={logoImg} alt="ORRNEX" className="w-full h-full object-contain" />
            </div>
            <div className="text-2xl font-black tracking-tight leading-none">
              <span className="text-white">ORR</span>
              <span className="text-amber-500">NEX</span>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
            {/* Step Indicators */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 1 ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {step > 1 ? '✓' : '1'}
                </span>
                <span className={`text-xs font-semibold ${step === 1 ? 'text-white' : 'text-slate-400'}`}>
                  Credentials
                </span>
              </div>

              <div className="w-12 h-0.5 bg-slate-800" />

              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                }`}>
                  2
                </span>
                <span className={`text-xs font-semibold ${step === 2 ? 'text-white' : 'text-slate-500'}`}>
                  Email OTP
                </span>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-sm animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{error}</div>
              </div>
            )}

            {/* Info Banner */}
            {infoMessage && (
              <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3 text-blue-300 text-sm animate-in fade-in duration-200">
                <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{infoMessage}</div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 1: EMAIL & PASSWORD                                 */}
            {/* ======================================================== */}
            {step === 1 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Sign in to ERP
                  </h2>
                  <p className="text-sm text-slate-400 mt-2">
                    Enter your email and password to receive an OTP code.
                  </p>
                </div>

                {/* Quick-Fill Credentials Helper */}
                <div className="mb-6 p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="text-xs truncate">
                      <div className="text-slate-300 font-medium truncate">
                        <span className="text-slate-400">User:</span> admin@gmail.com
                      </div>
                      <div className="text-slate-400 text-[11px] truncate">
                        <span>Pass:</span> Admin@123
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleQuickFillCredentials}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1 flex-shrink-0 cursor-pointer active:scale-95"
                  >
                    Auto-fill
                  </button>
                </div>

                <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@gmail.com"
                        autoComplete="email"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Password
                      </label>
                      <span className="text-xs text-slate-400 hover:text-amber-400 transition-colors cursor-pointer">
                        Forgot password?
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                        className="w-full pl-10 pr-11 py-3 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500/20 bg-slate-950 cursor-pointer accent-amber-500"
                      />
                      <span className="text-xs text-slate-300 font-medium">Keep me signed in</span>
                    </label>
                  </div>

                  {/* Continue Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:from-amber-600 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting || loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        Send Verification Code
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 2: 6-DIGIT OTP VERIFICATION                         */}
            {/* ======================================================== */}
            {step === 2 && (
              <div>
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError('');
                      setInfoMessage('');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-3 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to credentials
                  </button>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Enter Email OTP
                  </h2>
                  <p className="text-sm text-slate-400 mt-2">
                    Enter the 6-digit code sent to <span className="text-amber-400 font-medium">{email}</span>.
                  </p>
                </div>

                {/* OTP Demo/Dev helper pill */}
                {latestDevOtp && (
                  <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <div className="text-xs">
                        <span className="text-slate-400">Security Code: </span>
                        <span className="font-mono font-bold text-amber-300 tracking-wider text-sm">{latestDevOtp}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoFillOtp}
                      className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      Fill OTP
                    </button>
                  </div>
                )}

                <form onSubmit={handleOtpSubmit} className="space-y-6">
                  {/* 6 Digit Input Boxes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 text-center">
                      6-Digit Security Code
                    </label>
                    <div className="flex justify-between gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl border bg-slate-950/80 text-white focus:outline-none transition-all ${
                            digit
                              ? 'border-amber-500 ring-2 ring-amber-500/20'
                              : 'border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Resend Timer & Action */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">
                      Didn't get the code?
                    </span>
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <RotateCw className="w-3 h-3" />
                        Resend OTP
                      </button>
                    ) : (
                      <span className="text-slate-500 font-medium">
                        Resend in <span className="text-slate-300 font-mono font-semibold">{countdown}s</span>
                      </span>
                    )}
                  </div>

                  {/* Verify Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || loading || otpDigits.join('').length !== 6}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:from-amber-600 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting || loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying Code...
                      </>
                    ) : (
                      <>
                        Verify & Open Dashboard
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="mt-8 text-center text-xs text-slate-500">
            Protected by Enterprise 2-Factor Authentication
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
