import React, { useState } from 'react';
import {
  Phone,
  Mail,
  Edit2,
  Shield,
  Plus,
  AlertCircle,
  CheckCircle2,
  QrCode,
  AtSign,
  Sparkles,
} from 'lucide-react';
import { UserProfile, AuthSession } from '@/types/auth';
import { NeomorphicCard } from '@/components/ui/NeomorphicCard';
import { NeomorphicButton } from '@/components/ui/NeomorphicButton';
import { NeomorphicInput } from '@/components/ui/NeomorphicInput';
import { Avatar } from '@/components/ui/Avatar';
import { authService } from '@/services/auth-service';
import { friendService } from '@/services/friend-service';
import { validateUsername, suggestUsernames } from '@/lib/qr-code';
import { LinkPhoneModal } from './LinkPhoneModal';
import { MyQRCodeModal } from '@/features/friends/MyQRCodeModal';

interface ProfileViewProps {
  session: AuthSession;
  onProfileUpdated: (updated: UserProfile) => void;
  friendsCount?: number;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  session,
  onProfileUpdated,
  friendsCount = 0,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(session.profile?.displayName || '');
  const [username, setUsername] = useState(session.profile?.username || '');
  const [bio, setBio] = useState(session.profile?.bio || '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [suggestedUsernames, setSuggestedUsernames] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showLinkPhoneModal, setShowLinkPhoneModal] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);

  const linkedPhone = session.profile?.phoneNumber || session.user?.phone;

  const handleUsernameChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(clean);
    setUsernameError(null);
    setSuggestedUsernames([]);

    if (clean.length > 0) {
      const validation = validateUsername(clean);
      if (!validation.valid) {
        setUsernameError(validation.error || 'Invalid username format.');
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.user) return;

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (cleanUsername) {
      const val = validateUsername(cleanUsername);
      if (!val.valid) {
        setUsernameError(val.error || 'Please enter a valid username (3-20 characters, no spaces).');
        return;
      }

      // Check uniqueness if changed from current username
      const currentLower = (session.profile?.username || '').toLowerCase();
      if (cleanUsername !== currentLower) {
        setIsSaving(true);
        const isAvailable = await friendService.checkUsernameAvailable(
          cleanUsername,
          session.user.id,
          session.isDemoUser
        );

        if (!isAvailable) {
          setIsSaving(false);
          setUsernameError(`@${cleanUsername} is already taken. Try one of the suggestions below.`);
          setSuggestedUsernames(suggestUsernames(cleanUsername));
          return;
        }
      }
    }

    setIsSaving(true);
    setNotice(null);

    const updated = await authService.upsertProfile({
      id: session.user.id,
      displayName: displayName.trim() || 'BreakTym User',
      username: cleanUsername ? cleanUsername : null,
      bio: bio.trim(),
    });

    setIsSaving(false);

    if (updated) {
      onProfileUpdated(updated);
      setIsEditing(false);
      setUsernameError(null);
      setSuggestedUsernames([]);
      setNotice('Profile updated successfully! ✨');
      setTimeout(() => setNotice(null), 3000);
    } else {
      setNotice('Could not save profile changes.');
    }
  };

  const handlePhoneLinked = (updatedProfile: UserProfile) => {
    onProfileUpdated(updatedProfile);
    setNotice('Phone number linked successfully! Your contacts can now discover you. ✨');
    setTimeout(() => setNotice(null), 4000);
  };

  const handleTokenRegenerated = (newToken: string) => {
    if (session.profile) {
      const updated = { ...session.profile, qrToken: newToken };
      onProfileUpdated(updated);
      setNotice('Personal QR code reset successfully! Old QR codes are now revoked. ✨');
      setTimeout(() => setNotice(null), 4000);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-4 pb-28 space-y-6 text-left">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3FA] tracking-tight">
          Your Profile
        </h1>
        <button
          onClick={() => {
            setIsEditing(!isEditing);
            setUsername(session.profile?.username || '');
            setUsernameError(null);
            setSuggestedUsernames([]);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold 
          bg-[#202027] hover:bg-[#282833] border border-[#30303A] text-[#B45CFF] transition-all"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
        </button>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-[#B45CFF]/15 border border-[#B45CFF]/30 text-xs text-[#F5F3FA] flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#86EFAC] shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <NeomorphicCard className="p-6 sm:p-8 flex flex-col items-center text-center space-y-4">
        <Avatar
          name={session.profile?.displayName || 'BreakTym User'}
          avatarUrl={session.profile?.avatarUrl}
          size="xl"
          isOnline={true}
          showStatus={true}
        />

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[#F5F3FA]">
            {session.profile?.displayName || 'BreakTym User'}
          </h2>

          {/* Username & Badge Row */}
          <div className="flex items-center justify-center gap-2">
            {session.profile?.username ? (
              <span className="text-xs font-bold text-[#B45CFF] bg-[#B45CFF]/10 px-2.5 py-0.5 rounded-full border border-[#B45CFF]/25">
                @{session.profile.username}
              </span>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-[11px] text-[#A5A0B5] hover:text-[#B45CFF] flex items-center gap-1 transition-colors px-2 py-0.5 rounded-full bg-white/5 border border-white/10"
              >
                <AtSign className="w-3 h-3 text-[#B45CFF]" />
                <span>+ Claim username</span>
              </button>
            )}
            <span className="text-xs text-[#7E7991]">•</span>
            <span className="text-xs text-[#86EFAC] font-medium">
              {session.isDemoUser ? 'Demo Lounge' : 'Verified Member'}
            </span>
          </div>

          <p className="text-xs text-[#A5A0B5] mt-2 max-w-sm mx-auto italic">
            "{session.profile?.bio || 'Living for spontaneous breaks & good talks ✨'}"
          </p>

          {/* User ID Row */}
          <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-[#7E7991]">
            <span className="font-mono truncate max-w-[240px]">
              ID: {session.profile?.id || session.user?.id}
            </span>
            <button
              type="button"
              onClick={() => {
                const id = session.profile?.id || session.user?.id;
                if (id) {
                  navigator.clipboard.writeText(id);
                  setNotice('User ID copied to clipboard! ✨');
                  setTimeout(() => setNotice(null), 3000);
                }
              }}
              className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#B45CFF] font-semibold transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Quick QR Code Bar */}
        <div className="w-full pt-1">
          <button
            onClick={() => setShowQRCodeModal(true)}
            className="w-full py-3 px-4 rounded-xl bg-[#1B1B22] hover:bg-[#23232C] border border-[#B45CFF]/30 text-xs font-bold text-[#F5F3FA] flex items-center justify-between group transition-all shadow-[-3px_-3px_8px_#282833,4px_4px_10px_#141418]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#B45CFF]/15 border border-[#B45CFF]/30 flex items-center justify-center text-[#B45CFF] group-hover:scale-105 transition-transform">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-bold text-[#F5F3FA]">My BreakTym QR Code</p>
                <p className="text-[10px] text-[#A5A0B5]">Display, share, or scan to connect safely</p>
              </div>
            </div>
            <span className="text-xs text-[#B45CFF] group-hover:translate-x-0.5 transition-transform">
              View QR →
            </span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="w-full grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
          <div className="p-3 rounded-xl bg-[#1B1B22] border border-[#30303A]/60">
            <p className="text-xl font-black text-[#F5F3FA]">{friendsCount}</p>
            <p className="text-[10px] uppercase font-bold text-[#A5A0B5] tracking-wider mt-0.5">
              People in Circle
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#1B1B22] border border-[#30303A]/60">
            <p className="text-xl font-black text-[#86EFAC]">Active</p>
            <p className="text-[10px] uppercase font-bold text-[#A5A0B5] tracking-wider mt-0.5">
              Status Presence
            </p>
          </div>
        </div>
      </NeomorphicCard>

      {/* Edit Form or Account Info */}
      {isEditing ? (
        <NeomorphicCard className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F5F3FA] uppercase tracking-wider">
              Update Profile Details
            </h3>
            <span className="text-[10px] text-[#A5A0B5]">Instant sync</span>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <NeomorphicInput
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              required
            />

            <div>
              <NeomorphicInput
                label="Unique Username (Optional)"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="e.g. gourav, nightowl"
                leadingIcon={<AtSign className="w-4 h-4" />}
              />
              {usernameError ? (
                <p className="text-[11px] text-[#FF6B81] mt-1.5 pl-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{usernameError}</span>
                </p>
              ) : (
                <p className="text-[11px] text-[#A5A0B5] mt-1.5 pl-1">
                  3-20 characters, lowercase letters, numbers, and underscores only. No spaces.
                </p>
              )}

              {/* Username Suggestions if taken */}
              {suggestedUsernames.length > 0 && (
                <div className="mt-2.5 p-3 rounded-xl bg-[#1B1B22] border border-[#30303A]/70 space-y-1.5">
                  <p className="text-[11px] text-[#A5A0B5] font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#B45CFF]" />
                    <span>Suggested available handles:</span>
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {suggestedUsernames.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => {
                          setUsername(sug);
                          setUsernameError(null);
                          setSuggestedUsernames([]);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#B45CFF]/15 hover:bg-[#B45CFF]/25 border border-[#B45CFF]/30 text-xs font-semibold text-[#B45CFF] transition-colors"
                      >
                        @{sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <NeomorphicInput
              label="Vibe / Status"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What's your current vibe?"
            />

            <div className="pt-2 flex gap-3">
              <NeomorphicButton
                type="submit"
                isLoading={isSaving}
                className="flex-1"
              >
                Save Changes
              </NeomorphicButton>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setUsername(session.profile?.username || '');
                  setUsernameError(null);
                  setSuggestedUsernames([]);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#A5A0B5] hover:text-[#F5F3FA] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </NeomorphicCard>
      ) : (
        <NeomorphicCard className="p-5 space-y-4">
          <h3 className="text-xs font-bold text-[#A5A0B5] uppercase tracking-wider">
            Connected Credentials
          </h3>

          {/* Phone Number Item with Link option */}
          <div className="p-3.5 rounded-xl bg-[#1B1B22] border border-[#30303A]/60 space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <Phone className="w-4 h-4 text-[#B45CFF] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[#A5A0B5] text-[10px]">Mobile Phone</p>
                  <p className="font-semibold text-[#F5F3FA] truncate">
                    {linkedPhone || 'No phone number linked'}
                  </p>
                </div>
              </div>

              {linkedPhone ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#86EFAC]/15 text-[#86EFAC] font-semibold border border-[#86EFAC]/30">
                    Verified
                  </span>
                  <button
                    onClick={() => setShowLinkPhoneModal(true)}
                    className="text-[11px] text-[#B45CFF] hover:underline font-semibold"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30 shrink-0">
                  Not Linked
                </span>
              )}
            </div>

            {/* Prompt to link phone when absent */}
            {!linkedPhone && (
              <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <p className="text-[11px] text-[#A5A0B5] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Required for phone contact matching</span>
                </p>

                <NeomorphicButton
                  variant="primary"
                  className="text-xs py-2 px-3.5 self-start sm:self-auto"
                  onClick={() => setShowLinkPhoneModal(true)}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Link Phone Number
                </NeomorphicButton>
              </div>
            )}
          </div>

          {/* Email Item */}
          {session.user?.email && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#1B1B22] border border-[#30303A]/60 text-xs">
              <Mail className="w-4 h-4 text-[#B45CFF] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[#A5A0B5] text-[10px]">Email Address</p>
                <p className="font-semibold text-[#F5F3FA] truncate">
                  {session.user.email}
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#86EFAC]/15 text-[#86EFAC] font-semibold border border-[#86EFAC]/30">
                Verified
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1 text-[11px] text-[#A5A0B5]">
            <Shield className="w-3.5 h-3.5 text-[#86EFAC] shrink-0" />
            <span>BreakTym protects your phone number and never shares contact lists.</span>
          </div>
        </NeomorphicCard>
      )}

      {/* Link Phone Modal */}
      {session.user && (
        <LinkPhoneModal
          isOpen={showLinkPhoneModal}
          userId={session.user.id}
          onClose={() => setShowLinkPhoneModal(false)}
          onPhoneLinked={handlePhoneLinked}
        />
      )}

      {/* My QR Code Modal */}
      <MyQRCodeModal
        isOpen={showQRCodeModal}
        onClose={() => setShowQRCodeModal(false)}
        userProfile={session.profile}
        onTokenRegenerated={handleTokenRegenerated}
        isDemo={session.isDemoUser}
      />
    </div>
  );
};
