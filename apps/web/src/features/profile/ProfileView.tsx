import React, { useState } from 'react';
import { Phone, Mail, Edit2, Shield, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserProfile, AuthSession } from '@/types/auth';
import { NeomorphicCard } from '@/components/ui/NeomorphicCard';
import { NeomorphicButton } from '@/components/ui/NeomorphicButton';
import { NeomorphicInput } from '@/components/ui/NeomorphicInput';
import { Avatar } from '@/components/ui/Avatar';
import { authService } from '@/services/auth-service';
import { LinkPhoneModal } from './LinkPhoneModal';

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
  const [bio, setBio] = useState(session.profile?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showLinkPhoneModal, setShowLinkPhoneModal] = useState(false);

  const linkedPhone = session.profile?.phoneNumber || session.user?.phone;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.user) return;

    setIsSaving(true);
    setNotice(null);

    const updated = await authService.upsertProfile({
      id: session.user.id,
      displayName: displayName.trim() || 'BreakTym User',
      bio: bio.trim(),
    });

    setIsSaving(false);

    if (updated) {
      onProfileUpdated(updated);
      setIsEditing(false);
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

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-4 pb-28 space-y-6 text-left">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3FA] tracking-tight">
          Your Profile
        </h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold 
          bg-[#202027] hover:bg-[#282833] border border-[#30303A] text-[#B45CFF] transition-all"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
        </button>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-[#B45CFF]/15 border border-[#B45CFF]/30 text-xs text-[#F5F3FA] flex items-center gap-2">
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

        <div>
          <h2 className="text-xl font-bold text-[#F5F3FA]">
            {session.profile?.displayName || 'BreakTym User'}
          </h2>
          <p className="text-xs text-[#B45CFF] font-medium mt-0.5">
            {session.isDemoUser ? 'Exploring in Demo Mode' : 'Verified Member'}
          </p>
          <p className="text-xs text-[#A5A0B5] mt-2 max-w-sm mx-auto">
            "{session.profile?.bio || 'Living for spontaneous breaks & good talks ✨'}"
          </p>
        </div>

        {/* Stats Row */}
        <div className="w-full grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
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
          <h3 className="text-sm font-bold text-[#F5F3FA] uppercase tracking-wider">
            Update Details
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <NeomorphicInput
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              required
            />

            <NeomorphicInput
              label="Vibe / Status"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What's your current vibe?"
            />

            <NeomorphicButton type="submit" isLoading={isSaving} className="w-full">
              Save Changes
            </NeomorphicButton>
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
    </div>
  );
};
