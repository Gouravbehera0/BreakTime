import React, { useState } from 'react';
import { User, Sparkles, AtSign } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { NeomorphicInput } from '@/components/ui/NeomorphicInput';
import { NeomorphicButton } from '@/components/ui/NeomorphicButton';
import { authService } from '@/services/auth-service';
import { validateUsername } from '@/lib/qr-code';
import { UserProfile } from '@/types/auth';

interface ProfileSetupModalProps {
  isOpen: boolean;
  userId: string;
  onComplete: (profile: UserProfile) => void;
  onClose?: () => void;
}

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({
  isOpen,
  userId,
  onComplete,
  onClose,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = displayName.trim();
    if (!cleanName) {
      setError('Display name is required so your friends know who you are.');
      return;
    }

    const cleanUsername = username.trim().replace(/^@/, '');
    if (cleanUsername) {
      const val = validateUsername(cleanUsername);
      if (!val.valid) {
        setError(val.error || 'Please enter a valid username (3-20 characters, no spaces).');
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const updated = await authService.upsertProfile({
        id: userId,
        displayName: cleanName,
        username: cleanUsername ? cleanUsername.toLowerCase() : undefined,
        bio: bio.trim() || 'Living for spontaneous breaks ✨',
      });

      setIsLoading(false);
      onComplete(updated);
    } catch (err: unknown) {
      console.warn('Profile submission fallback:', err);
      // Construct fallback profile so user is NEVER blocked
      const fallback: UserProfile = {
        id: userId,
        displayName: cleanName,
        username: cleanUsername ? cleanUsername.toLowerCase() : null,
        bio: bio.trim() || 'Living for spontaneous breaks ✨',
      };
      setIsLoading(false);
      onComplete(fallback);
    }
  };

  const handleDismiss = () => {
    if (onClose) {
      onClose();
    } else {
      // Auto-complete with fallback name if dismissed
      onComplete({
        id: userId,
        displayName: displayName.trim() || 'BreakTym Member',
        bio: bio.trim() || 'Living for spontaneous moments ✨',
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      title="Complete Your Profile"
      description="Tell your circle how to recognize you on BreakTym."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-left">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-[#FF6B81]">
            {error}
          </div>
        )}

        <NeomorphicInput
          label="Your Name / Nickname"
          placeholder="e.g. Gourav"
          leadingIcon={<User className="w-4 h-4" />}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          autoFocus
        />

        <div>
          <NeomorphicInput
            label="Unique Username (Optional)"
            placeholder="e.g. gourav, nightowl"
            leadingIcon={<AtSign className="w-4 h-4" />}
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, ''))}
          />
          <p className="text-[11px] text-[#A5A0B5] mt-1.5 pl-1">
            Enables friends to find and add you without seeing your phone number.
          </p>
        </div>

        <NeomorphicInput
          label="Current Vibe / Status (Optional)"
          placeholder="e.g. Always down for chai or midnight ride"
          leadingIcon={<Sparkles className="w-4 h-4" />}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <NeomorphicButton
            type="submit"
            className="flex-1"
            isLoading={isLoading}
          >
            Enter BreakTym
          </NeomorphicButton>

          <button
            type="button"
            onClick={handleDismiss}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#A5A0B5] hover:text-[#F5F3FA] transition-colors"
          >
            Skip for now
          </button>
        </div>
      </form>
    </Modal>
  );
};
