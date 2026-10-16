import React, { useState } from 'react';
import { Phone, Mail, Lock, User, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { BreakTymLogo } from '@/components/ui/BreakTymLogo';
import { NeomorphicCard } from '@/components/ui/NeomorphicCard';
import { NeomorphicButton } from '@/components/ui/NeomorphicButton';
import { NeomorphicInput } from '@/components/ui/NeomorphicInput';
import { Modal } from '@/components/ui/Modal';
import { authService } from '@/services/auth-service';
import { normalizePhoneNumber } from '@/lib/contact-picker';
import { AuthSession } from '@/types/auth';

interface AuthScreenProps {
  onAuthSuccess: (session: AuthSession, isNewUser?: boolean) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [isRegistering, setIsRegistering] = useState(false);

  // Phone state
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Modals & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handlePhoneAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    const cleaned = phoneNumber.trim().replace(/\D/g, '');
    if (cleaned.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    const fullPhone = normalizePhoneNumber(cleaned, countryCode);
    setIsLoading(true);

    const result = await authService.signInWithPhone(fullPhone);
    setIsLoading(false);

    if (result.success && result.session) {
      onAuthSuccess(result.session, result.isNewUser);
    } else {
      setErrorMessage(result.error || 'Failed to sign in with phone. Please check your number.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    if (isRegistering) {
      if (!displayName.trim()) {
        setErrorMessage('Please enter your full display name.');
        setIsLoading(false);
        return;
      }
      const result = await authService.signUpWithEmail(email, password, displayName);
      setIsLoading(false);
      if (result.success) {
        if (result.requiresEmailConfirmation) {
          setSuccessNotice('Account created! Please check your email inbox to verify your address.');
        } else {
          // Automatic login
          const loginRes = await authService.signInWithEmail(email, password);
          if (loginRes.session) onAuthSuccess(loginRes.session, true);
        }
      } else {
        setErrorMessage(result.error || 'Failed to create account.');
      }
    } else {
      const result = await authService.signInWithEmail(email, password);
      setIsLoading(false);
      if (result.success && result.session) {
        onAuthSuccess(result.session);
      } else {
        setErrorMessage(result.error || 'Incorrect email or password.');
      }
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    const session = await authService.loginAsDemo();
    setIsLoading(false);
    onAuthSuccess(session);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetEmail.includes('@')) {
      setErrorMessage('Please enter a valid email.');
      return;
    }
    setIsLoading(true);
    const result = await authService.sendPasswordReset(resetEmail);
    setIsLoading(false);
    if (result.success) {
      setShowForgotPassword(false);
      setSuccessNotice('Password reset link sent! Check your inbox.');
    } else {
      setErrorMessage(result.error || 'Could not send reset link.');
    }
  };



  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col items-center">
      {/* Brand Header */}
      <BreakTymLogo size="lg" showTagline={true} priority={true} className="mb-7" />

      {/* Main Neomorphic Container */}
      <NeomorphicCard className="w-full p-6 sm:p-8">
        {/* Auth Mode Toggle Pill */}
        <div className="flex p-1 rounded-xl bg-[#1C1C23] border border-[#34313D] mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('phone');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              authMethod === 'phone'
                ? 'bg-[#202027] text-[#F5F3FA] shadow-[-2px_-2px_6px_#30303A,2px_2px_6px_#101014] border border-[#9E65FF]/50 text-[#B45CFF]'
                : 'text-[#A5A0B5] hover:text-[#F5F3FA]'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Phone</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMethod('email');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              authMethod === 'email'
                ? 'bg-[#202027] text-[#F5F3FA] shadow-[-2px_-2px_6px_#30303A,2px_2px_6px_#101014] border border-[#9E65FF]/50 text-[#B45CFF]'
                : 'text-[#A5A0B5] hover:text-[#F5F3FA]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>
        </div>

        {/* Notices */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-[#FF6B81] flex items-start gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {successNotice && (
          <div className="mb-4 p-3 rounded-xl bg-[#86EFAC]/10 border border-[#86EFAC]/30 text-xs text-[#86EFAC] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* 1. Direct Phone Login Form (Zero OTP) */}
        {authMethod === 'phone' ? (
          <form onSubmit={handlePhoneAuth} className="space-y-4">
            <div className="text-left">
              <h2 className="text-lg font-bold text-[#F5F3FA]">Enter Your Mobile</h2>
              <p className="text-xs text-[#A5A0B5] mt-0.5">
                Instant access. Zero OTP codes or passwords required.
              </p>
            </div>

            <div className="flex gap-2 items-center pt-2">
              <div className="w-24 shrink-0">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full bg-[#1B1B22] text-[#F5F3FA] text-sm rounded-xl py-3.5 px-3 border border-[#34313D] shadow-[inset_2px_2px_5px_#101014,inset_-2px_-2px_5px_#262630] focus:border-[#9E65FF] outline-none"
                >
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+61">🇦🇺 +61</option>
                  <option value="+971">🇦🇪 +971</option>
                </select>
              </div>

              <div className="flex-1">
                <NeomorphicInput
                  type="tel"
                  placeholder="98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  leadingIcon={<Phone className="w-4 h-4" />}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#A5A0B5] pt-1">
              <ShieldCheck className="w-4 h-4 text-[#86EFAC] shrink-0" />
              <span>Private & confidential. Strictly used to connect with people saved in your contacts.</span>
            </div>

            <NeomorphicButton
              type="submit"
              className="w-full mt-4"
              isLoading={isLoading}
              showArrow={true}
            >
              Enter BreakTym
            </NeomorphicButton>
          </form>
        ) : (
          /* 2. Email & Password Form */
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="text-left">
              <h2 className="text-lg font-bold text-[#F5F3FA]">
                {isRegistering ? 'Create BreakTym Account' : 'Welcome Back'}
              </h2>
              <p className="text-xs text-[#A5A0B5] mt-0.5">
                {isRegistering
                  ? 'Join BreakTym and make time for your people.'
                  : 'Sign in to pause the world with your circle.'}
              </p>
            </div>

            {isRegistering && (
              <NeomorphicInput
                label="Full Name"
                placeholder="Alex Morgan"
                leadingIcon={<User className="w-4 h-4" />}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            )}

            <NeomorphicInput
              label="Email Address"
              type="email"
              placeholder="alex@example.com"
              leadingIcon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <NeomorphicInput
              label="Password"
              isPassword={true}
              placeholder="••••••••"
              leadingIcon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {!isRegistering && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[#A5A0B5] select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-[#B45CFF] rounded"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-[#B45CFF] hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <NeomorphicButton
              type="submit"
              className="w-full mt-4"
              isLoading={isLoading}
              showArrow={true}
            >
              {isRegistering ? 'Create Account' : 'Enter BreakTym'}
            </NeomorphicButton>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setErrorMessage(null);
                }}
                className="text-xs text-[#A5A0B5] hover:text-[#F5F3FA]"
              >
                {isRegistering ? (
                  <span>Already have an account? <strong className="text-[#B45CFF]">Sign in</strong></span>
                ) : (
                  <span>New to BreakTym? <strong className="text-[#B45CFF]">Create an account</strong></span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[#282833]" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#A5A0B5]">
            OR EXPLORE
          </span>
          <div className="flex-1 h-px bg-[#282833]" />
        </div>

        {/* Demo Mode Action Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl 
          bg-[#202027] hover:bg-[#282833] border border-[#B45CFF]/30 text-xs font-semibold text-[#F5F3FA] 
          shadow-[-2px_-2px_6px_#30303A,3px_3px_8px_#101014] hover:shadow-[0_0_16px_rgba(180,92,255,0.25)] transition-all group"
        >
          <Sparkles className="w-4 h-4 text-[#B45CFF] group-hover:scale-110 transition-transform" />
          <span>Explore App in Demo Mode</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#A5A0B5] group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Privacy reassurance */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[#A5A0B5]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#86EFAC]" />
          <span>Zero usernames. Private phone-matching only.</span>
        </div>
      </NeomorphicCard>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        title="Reset Password"
        description="Enter your registered email and we'll dispatch a secure recovery link."
      >
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <NeomorphicInput
            label="Email"
            type="email"
            placeholder="alex@example.com"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            required
          />

          <NeomorphicButton type="submit" className="w-full" isLoading={isLoading}>
            Send Reset Link
          </NeomorphicButton>
        </form>
      </Modal>
    </div>
  );
};
