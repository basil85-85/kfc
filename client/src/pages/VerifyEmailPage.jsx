import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { FiCheckCircle, FiMail, FiRefreshCw, FiArrowRight, FiCopy, FiCheck } from 'react-icons/fi';

const VerifyEmailPage = ({ initialEmail = '', initialDevOtp = '', onSuccess }) => {
  const { verifyEmail, resendVerificationCode } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(initialEmail || searchParams.get('email') || '');
  const [activeDevOtp, setActiveDevOtp] = useState(initialDevOtp);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [copied, setCopied] = useState(false);

  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const handleAutoFillDevOtp = (codeToFill) => {
    const targetCode = codeToFill || activeDevOtp;
    if (targetCode && targetCode.length === 6) {
      setOtp(targetCode.split(''));
      setError('');
    }
  };

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus first input on mount
  useEffect(() => {
    if (!verifiedUser && inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, [verifiedUser]);

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    // Auto-advance to next input
    if (value && index < 5 && inputRefs[index + 1].current) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs[index - 1].current) {
      inputRefs[index - 1].current.focus();
    } else if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      setError('');
      if (inputRefs[5].current) inputRefs[5].current.focus();
    }
  };

  const handleVerify = async (codeToVerify) => {
    const code = codeToVerify || otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setError('');
    setInfoMessage('');
    setIsVerifying(true);

    try {
      const result = await verifyEmail(email, code);
      setVerifiedUser(result);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (cooldown > 0 || isResending) return;
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }

    setError('');
    setInfoMessage('');
    setIsResending(true);

    try {
      const res = await resendVerificationCode(email);
      if (res.devOtp) setActiveDevOtp(res.devOtp);
      setInfoMessage(res.message || 'A new 6-digit code has been sent to your email.');
      setCooldown(10);
      setOtp(['', '', '', '', '', '']);
      if (inputRefs[0].current) inputRefs[0].current.focus();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend verification code.';
      setError(msg);
      const match = msg.match(/wait (\d+) second/i);
      if (match && match[1]) {
        setCooldown(parseInt(match[1], 10));
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleCopyCode = () => {
    if (verifiedUser?.playerCode) {
      navigator.clipboard.writeText(verifiedUser.playerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // SUCCESS SCREEN — Shows Player Code after verification
  if (verifiedUser) {
    return (
      <div className="mx-auto max-w-md py-8">
        <div className="glass-card border-emerald-500/30 shadow-glow-emerald p-8 text-center space-y-6">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-glow-emerald">
            <FiCheckCircle size={36} />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl font-black text-white">Email Verified!</h1>
            <p className="text-xs text-slate-300">
              Welcome to Kolothum Kadhavu FC, <strong className="text-white">{verifiedUser.name}</strong>! Your account is active.
            </p>
          </div>

          {/* Unique Player Code Card */}
          {verifiedUser.playerCode && (
            <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5 space-y-3 shadow-glow-cyan">
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                Your Official Club Identity Code
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-2xl font-black text-white tracking-widest bg-cyan-500/10 px-4 py-1.5 rounded-xl border border-cyan-500/40">
                  {verifiedUser.playerCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="rounded-xl border border-white/10 bg-slate-800 p-2.5 text-slate-300 hover:text-white hover:border-cyan-500/40 transition"
                  title="Copy Player Code"
                >
                  {copied ? <FiCheck size={16} className="text-emerald-400" /> : <FiCopy size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Keep this code handy! It serves as your permanent KFC player membership ID across all club activities.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full btn-primary py-3 text-sm font-bold gap-2"
          >
            <span>Proceed to Dashboard</span>
            <FiArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // OTP VERIFICATION FORM
  return (
    <div className="mx-auto max-w-md py-8">
      <div className="glass-card border-cyan-500/20 shadow-glow-cyan p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-glow-cyan">
            <FiMail size={24} />
          </div>
          <h1 className="font-display text-2xl font-black text-white">Verify Your Email</h1>
          <p className="text-xs text-slate-400">
            We sent a 6-digit verification code to{' '}
            <strong className="text-cyan-300 font-mono">{email || 'your email'}</strong>.
          </p>
        </div>

        {/* Dev OTP Helper Badge */}
        {activeDevOtp && (
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs font-semibold text-cyan-300 flex items-center justify-between gap-2">
            <span>
              ⚡ <strong className="text-white font-mono">Dev OTP: {activeDevOtp}</strong>
            </span>
            <button
              type="button"
              onClick={() => handleAutoFillDevOtp()}
              className="btn-primary py-1 px-2 text-[10px] font-bold bg-cyan-500 text-slate-950 border-none hover:bg-cyan-400 shrink-0"
            >
              Auto-Fill Code
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-300 space-y-2">
            <p>{error}</p>
            <div>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={cooldown > 0 || isResending}
                className="btn-primary inline-flex py-1 px-3 text-[11px] font-bold bg-cyan-500 text-slate-950 border-none hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cooldown > 0 ? `Resend Code in ${cooldown}s` : isResending ? 'Sending Code...' : 'Resend New Code Now'}
              </button>
            </div>
          </div>
        )}

        {infoMessage && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">
            {infoMessage}
          </div>
        )}

        {/* Email input field if not provided */}
        {!initialEmail && (
          <div>
            <label className="label-dark">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-dark"
              placeholder="player@kfc.com"
              required
            />
          </div>
        )}

        {/* 6-Digit OTP Box Grid */}
        <div className="space-y-3">
          <label className="label-dark text-center block">Enter 6-Digit Code</label>
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="h-12 w-11 sm:w-12 rounded-xl border border-white/10 bg-slate-900/90 text-center font-mono text-xl font-black text-cyan-300 shadow-inner focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleVerify()}
          disabled={isVerifying || otp.some((d) => !d)}
          className="w-full btn-primary py-3 text-sm font-bold gap-2"
        >
          <span>{isVerifying ? 'Verifying Code...' : 'Verify & Activate Profile'}</span>
          <FiArrowRight size={16} />
        </button>

        {/* Resend Code Section */}
        <div className="border-t border-white/[0.06] pt-4 text-center text-xs space-y-2">
          <p className="text-slate-400">Didn't receive the email code?</p>
          <button
            type="button"
            onClick={handleResendCode}
            disabled={cooldown > 0 || isResending}
            className="inline-flex items-center gap-1.5 font-bold text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiRefreshCw size={13} className={isResending ? 'animate-spin' : ''} />
            <span>
              {cooldown > 0
                ? `Resend Code in ${cooldown}s`
                : isResending
                ? 'Sending Code...'
                : 'Resend Verification Code'}
            </span>
          </button>
        </div>

        <div className="text-center text-xs">
          <Link to="/login" className="text-slate-400 hover:text-white">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
