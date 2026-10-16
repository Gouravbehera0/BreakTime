import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import { Contact } from '@/types/contact';
import { BreakActivity } from '@/types/activity';
import { activityService } from '@/services/activity-service';
import { invitationService } from '@/services/invitation-service';
import { Avatar } from '@/components/ui/Avatar';
import { RelationshipBadge } from '@/components/ui/RelationshipBadge';
import { NeomorphicButton } from '@/components/ui/NeomorphicButton';
import { NeomorphicCard } from '@/components/ui/NeomorphicCard';
import { NeomorphicInput } from '@/components/ui/NeomorphicInput';
import { Modal } from '@/components/ui/Modal';

interface InvitationViewProps {
  currentUserId: string;
  recipientContact: Contact;
  onBackToHome: () => void;
  isDemo?: boolean;
}

export const InvitationView: React.FC<InvitationViewProps> = ({
  currentUserId,
  recipientContact,
  onBackToHome,
  isDemo = false,
}) => {
  const [activities, setActivities] = useState<BreakActivity[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom activity modal state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [customTags, setCustomTags] = useState('');

  // Load activities matching recipient relationship
  useEffect(() => {
    const list = activityService.getActivitiesForContact(recipientContact.relationship);
    setActivities(list);
    setSelectedIndex(0);
  }, [recipientContact]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showCustomModal) return;
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activities.length, selectedIndex, showCustomModal]);

  const selectedActivity: BreakActivity | undefined = activities[selectedIndex];

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : activities.length - 1));
    setSendSuccess(false);
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < activities.length - 1 ? prev + 1 : 0));
    setSendSuccess(false);
  };

  const handleSendInvitation = async () => {
    if (!selectedActivity) return;

    setIsSending(true);
    setToastMessage(null);

    const result = await invitationService.sendActivityInvitation(
      recipientContact.id,
      currentUserId,
      selectedActivity.id,
      selectedActivity.title,
      customNote.trim() || undefined,
      isDemo
    );

    setIsSending(false);

    if (result.success) {
      setSendSuccess(true);
      setToastMessage(result.message);
    } else {
      setToastMessage(result.errorMessage || 'Failed to dispatch invitation.');
    }
  };

  const handleSaveCustomActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const tagsArray = customTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const created = activityService.addCustomActivity(
      customTitle,
      customSubtitle || 'A custom spontaneous plan',
      tagsArray
    );

    const updatedList = activityService.getActivitiesForContact(recipientContact.relationship);
    setActivities(updatedList);
    const newIdx = updatedList.findIndex((a) => a.id === created.id);
    if (newIdx !== -1) setSelectedIndex(newIdx);

    setShowCustomModal(false);
    setCustomTitle('');
    setCustomSubtitle('');
    setCustomTags('');
    setToastMessage(`Custom activity "${created.title}" created!`);
  };

  const handleDeleteCustomActivity = (id: string) => {
    activityService.deleteCustomActivity(id);
    const updatedList = activityService.getActivitiesForContact(recipientContact.relationship);
    setActivities(updatedList);
    setSelectedIndex(0);
    setToastMessage('Custom activity removed.');
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-3 pb-28 space-y-5 text-center">
      {/* 1. Recipient Header Card */}
      <NeomorphicCard className="p-3.5 flex items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBackToHome}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#A5A0B5] hover:text-[#F5F3FA] transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <Avatar
            name={recipientContact.name}
            avatarUrl={recipientContact.avatarUrl}
            size="md"
            isOnline={recipientContact.isOnline}
            showStatus={true}
          />

          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-[#F5F3FA] truncate">
              {recipientContact.privateNickname || recipientContact.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <RelationshipBadge relationship={recipientContact.relationship} />
              <span className="text-[11px] text-[#A5A0B5] truncate">
                {recipientContact.statusText || 'Active on BreakTym'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowCustomModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold 
          bg-[#202027] hover:bg-[#282833] border border-[#B45CFF]/30 text-[#B45CFF] shadow-sm transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Custom</span>
        </button>
      </NeomorphicCard>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-[#B45CFF]/15 border border-[#B45CFF]/30 text-xs text-[#F5F3FA] flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-[#A5A0B5] hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* 2. Large Circular Glass Activity Selector (Centerpiece) */}
      <div className="py-4 relative flex items-center justify-center select-none">
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          className="absolute left-1 sm:left-4 z-20 p-3 rounded-full bg-[#202027]/90 text-[#F5F3FA] 
          border border-[#30303A] shadow-[-3px_-3px_8px_#30303A,4px_4px_10px_#101014] hover:border-[#B45CFF]/50 
          hover:scale-105 active:scale-95 transition-all"
          aria-label="Previous activity"
        >
          <ChevronLeft className="w-5 h-5 text-[#B45CFF]" />
        </button>

        {/* Circular Glass Focal Disc */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
          {/* Ambient Purple Radial Glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#8B5CF6]/20 via-[#B45CFF]/30 to-transparent blur-2xl" />

          {/* Neomorphic Raised Outer Ring */}
          <div
            className="w-full h-full rounded-full bg-gradient-to-br from-[#202027] to-[#18181E] 
            border border-[#30303A]/70 shadow-[-6px_-6px_16px_#30303A,8px_8px_20px_#101014] flex items-center justify-center p-3 relative"
          >
            {/* Luminous Inner Glassmorphic Well */}
            <div
              className="w-full h-full rounded-full bg-[#1C1C23]/80 backdrop-blur-md 
              border border-[#B45CFF]/30 shadow-[inset_0_0_24px_rgba(180,92,255,0.2)] flex flex-col items-center justify-center p-4 transition-all duration-300 transform scale-100"
            >
              <span className="text-5xl sm:text-6xl filter drop-shadow-[0_0_12px_rgba(180,92,255,0.5)] animate-in fade-in zoom-in duration-200">
                {selectedActivity?.emoji || '✨'}
              </span>

              {selectedActivity?.isIntimate && (
                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Mutual Consent</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="absolute right-1 sm:right-4 z-20 p-3 rounded-full bg-[#202027]/90 text-[#F5F3FA] 
          border border-[#30303A] shadow-[-3px_-3px_8px_#30303A,4px_4px_10px_#101014] hover:border-[#B45CFF]/50 
          hover:scale-105 active:scale-95 transition-all"
          aria-label="Next activity"
        >
          <ChevronRight className="w-5 h-5 text-[#B45CFF]" />
        </button>
      </div>

      {/* 3. Carousel Dots Indicator */}
      <div className="flex items-center justify-center gap-1.5 py-1">
        {activities.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setSelectedIndex(idx);
              setSendSuccess(false);
            }}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              idx === selectedIndex
                ? 'w-6 bg-[#B45CFF] shadow-[0_0_8px_#B45CFF]'
                : 'w-1.5 bg-[#30303A] hover:bg-[#A5A0B5]'
            }`}
            aria-label={`Go to activity ${idx + 1}`}
          />
        ))}
      </div>

      {/* 4. Activity Title, Subtitle, & Tags */}
      {selectedActivity && (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#F5F3FA]">
              {selectedActivity.title}
            </h1>
            {selectedActivity.isCustom && (
              <button
                onClick={() => handleDeleteCustomActivity(selectedActivity.id)}
                className="p-1 rounded-lg text-[#A5A0B5] hover:text-[#FF6B81] transition-colors"
                title="Delete custom activity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="text-xs sm:text-sm text-[#A5A0B5] font-medium max-w-sm mx-auto">
            {selectedActivity.subtitle}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {selectedActivity.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#202027] border border-[#30303A] text-[#A5A0B5]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 5. Custom Note Input (Optional) */}
      <div className="pt-1 text-left">
        <NeomorphicInput
          placeholder="Add a quick note... (e.g. In 20 mins at our usual spot?)"
          value={customNote}
          onChange={(e) => setCustomNote(e.target.value)}
          className="text-xs py-2.5"
        />
      </div>

      {/* 6. Explicit Send Invitation Action Button */}
      <div className="pt-2">
        <NeomorphicButton
          onClick={handleSendInvitation}
          isLoading={isSending}
          disabled={sendSuccess || isSending || !selectedActivity}
          className={`w-full py-3.5 text-sm font-bold ${
            sendSuccess
              ? 'bg-[#86EFAC]/20 text-[#86EFAC] border border-[#86EFAC]/40 shadow-none'
              : ''
          }`}
          icon={sendSuccess ? <CheckCircle2 className="w-5 h-5 text-[#86EFAC]" /> : <Send className="w-5 h-5" />}
        >
          {sendSuccess
            ? `Invitation Sent for ${selectedActivity?.title}! ✓`
            : `Send Invitation for ${selectedActivity?.title || 'Break'}`}
        </NeomorphicButton>
      </div>

      {/* Custom Activity Creator Modal */}
      <Modal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        title="Create Custom Activity"
        description="Design a personalized moment for your circle."
      >
        <form onSubmit={handleSaveCustomActivity} className="space-y-4 pt-1 text-left">
          <NeomorphicInput
            label="Activity Name"
            placeholder="e.g. ROOFTOP ACOUSTIC SESSION"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            required
            autoFocus
          />

          <NeomorphicInput
            label="Subtitle / Vibe"
            placeholder="e.g. Guitars, tea, and cool breeze."
            value={customSubtitle}
            onChange={(e) => setCustomSubtitle(e.target.value)}
          />

          <NeomorphicInput
            label="Tags (Comma separated)"
            placeholder="e.g. Just the two of us, After 9 PM"
            value={customTags}
            onChange={(e) => setCustomTags(e.target.value)}
          />

          <NeomorphicButton type="submit" className="w-full mt-4">
            Save Custom Activity
          </NeomorphicButton>
        </form>
      </Modal>
    </div>
  );
};
