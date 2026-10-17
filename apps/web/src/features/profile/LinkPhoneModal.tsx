import React, { useState } from 'react';
import { Phone, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { NeomorphicInput } from '@/components/ui/NeomorphicInput';
import { NeomorphicButton } from '@/components/ui/NeomorphicButton';
import { authService } from '@/services/auth-service';
import { normalizePhoneNumber } from '@/lib/contact-picker';
import { UserProfile } from '@/types/auth';

interface LinkPhoneModalProps {
  isOpen: boolean;
  userId: string;
  currentPhone?: string;
  onClose: () => void;
  onPhoneLinked: (updatedProfile: UserProfile) => void;
}

export const LinkPhoneModal: React.FC<LinkPhoneModalProps> = ({
  isOpen,
  userId,
  currentPhone,
  onClose,
  onPhoneLinked,
}) => {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleLinkPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleaned = phoneNumber.trim().replace(/\D/g, '');
    if (cleaned.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    const fullNumber = normalizePhoneNumber(cleaned, countryCode);
    setIsLoading(true);

    const res = await authService.linkPhoneDirect(userId, fullNumber);
    setIsLoading(false);

    if (res.success && res.profile) {
      setSuccessNotice(`Mobile number ${fullNumber} linked successfully!`);
      onPhoneLinked(res.profile);
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setErrorMessage(res.error || 'Failed to link phone number. Please try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentPhone ? 'Update Phone Number' : 'Link Phone Number'}
      description={
        currentPhone
          ? `Change your connected mobile number (Current: ${currentPhone}).`
          : 'Connect your mobile number so friends in your phone contacts can discover and invite you on BreakTym.'
      }
      maxWidth="md"
    >
      <div className="space-y-4 pt-2 text-left">
        {/* Error / Success Notices */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-[#FF6B81]">
            {errorMessage}
          </div>
        )}

        {successNotice && (
          <div className="p-3 rounded-xl bg-[#86EFAC]/10 border border-[#86EFAC]/30 text-xs text-[#86EFAC] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successNotice}</span>
          </div>
        )}

        <form onSubmit={handleLinkPhone} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#A5A0B5]">
              Mobile Number
            </label>

            <div className="flex gap-2 items-center">
              <div className="w-24 shrink-0">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full bg-[#1B1B22] text-[#F5F3FA] text-sm rounded-xl py-3 px-2 border border-[#34313D] shadow-[inset_2px_2px_5px_#101014,inset_-2px_-2px_5px_#262630] focus:border-[#B45CFF] outline-none"
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
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#A5A0B5] pt-1">
            <ShieldCheck className="w-4 h-4 text-[#86EFAC] shrink-0" />
            <span>Zero OTP required. Your phone number is only used for server-side matching with people in your phone contacts.</span>
          </div>

          <div className="pt-2">
            <NeomorphicButton
              type="submit"
              className="w-full text-xs py-3"
              isLoading={isLoading}
              showArrow={true}
            >
              {currentPhone ? 'Update Mobile Number' : 'Link Mobile Number'}
            </NeomorphicButton>
          </div>
        </form>
      </div>
    </Modal>
  );
};
