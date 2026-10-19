import React, { useState, useEffect, useCallback } from 'react';
import { AmbientBackground } from '@/components/ui/AmbientBackground';
import { Header } from '@/components/layout/Header';
import { FloatingNavBar, NavTab } from '@/components/layout/FloatingNavBar';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { ProfileSetupModal } from '@/features/auth/ProfileSetupModal';
import { HomeView } from '@/features/home/HomeView';
import { FriendsView } from '@/features/friends/FriendsView';
import { InvitationView } from '@/features/invitation/InvitationView';
import { ProfileView } from '@/features/profile/ProfileView';
import { SettingsView } from '@/features/settings/SettingsView';
import { LinkPhoneModal } from '@/features/profile/LinkPhoneModal';
import { TargetProfileModal } from '@/features/friends/TargetProfileModal';
import { Modal } from '@/components/ui/Modal';
import { NeomorphicButton } from '@/components/ui/NeomorphicButton';
import { BreakTymLogo } from '@/components/ui/BreakTymLogo';
import { authService } from '@/services/auth-service';
import { friendService } from '@/services/friend-service';
import { invitationService } from '@/services/invitation-service';
import { parseQRUrl } from '@/lib/qr-code';
import { registerServiceWorker, showBrowserNotification } from '@/lib/push-notifications';
import { supabase } from '@/lib/supabase';
import { AuthSession, UserProfile } from '@/types/auth';
import { Contact, FriendRequest } from '@/types/contact';
import { ActivityInvitation, getCelebrationHeadline } from '@/types/invitation';
import { InvitationsInboxModal } from '@/features/invitation/InvitationsInboxModal';
import { AcceptanceCelebrationModal } from '@/features/invitation/AcceptanceCelebrationModal';

export const App: React.FC = () => {
  const [session, setSession] = useState<AuthSession>({
    user: null,
    profile: null,
    isAuthenticated: false,
    isLoading: true,
    isDemoUser: false,
  });

  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showLinkPhoneModal, setShowLinkPhoneModal] = useState(false);

  // Friends & Invitation states
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [invitations, setInvitations] = useState<ActivityInvitation[]>([]);
  const [showInboxModal, setShowInboxModal] = useState(false);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<Contact | null>(null);
  const [invitingContactIds, setInvitingContactIds] = useState<Set<string>>(new Set());
  const [invitedContactIds, setInvitedContactIds] = useState<Set<string>>(new Set());
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [targetQRToken, setTargetQRToken] = useState<string | null>(null);
  const [showTargetProfileModal, setShowTargetProfileModal] = useState(false);

  // Acceptance celebration & streak states
  const [celebratingInvitation, setCelebratingInvitation] = useState<ActivityInvitation | null>(null);
  const [celebrationStreak, setCelebrationStreak] = useState<number | undefined>(undefined);
  const [personalStreak, setPersonalStreak] = useState<number>(0);
  const [friendshipStreak, setFriendshipStreak] = useState<number>(0);

  // Initialize service worker for web push notifications
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Restore session on mount
  useEffect(() => {
    const initSession = async () => {
      const restored = await authService.restoreSession();
      setSession(restored);
      if (restored.isAuthenticated && (!restored.profile || !restored.profile.displayName)) {
        setShowProfileSetup(true);
      }
    };
    initSession();
  }, []);

  // Inspect URL on load for personal QR code parameter (?add=<token> or /add/<token>)
  useEffect(() => {
    const parsed = parseQRUrl(window.location.href);
    if (parsed.isValid && parsed.qrToken) {
      if (session.isAuthenticated) {
        setTargetQRToken(parsed.qrToken);
        setShowTargetProfileModal(true);
        // Clean up URL query / path safely without full reload
        const cleanUrl = window.location.pathname.replace(/\/add\/[^\/]+/, '') || '/';
        window.history.replaceState({}, document.title, cleanUrl);
      } else if (!session.isLoading) {
        // Unauthenticated scanner: preserve intended friend destination securely in sessionStorage
        sessionStorage.setItem('breaktym_pending_qr_token', parsed.qrToken);
        setToastNotice('Friend invitation detected! Sign in or try Demo Lounge to connect ✨');
      }
    }
  }, [session.isAuthenticated, session.isLoading]);

  // Check and resolve pending QR destination once scanner signs in
  useEffect(() => {
    if (session.isAuthenticated && session.user) {
      const pendingToken = sessionStorage.getItem('breaktym_pending_qr_token');
      if (pendingToken) {
        sessionStorage.removeItem('breaktym_pending_qr_token');
        setTargetQRToken(pendingToken);
        setShowTargetProfileModal(true);
      }
    }
  }, [session.isAuthenticated, session.user]);

  // Fetch contacts and pending requests
  const loadContactsAndRequests = useCallback(async () => {
    if (!session.user) return;
    setIsLoadingContacts(true);
    try {
      const [friends, requests] = await Promise.all([
        friendService.getConfirmedFriends(session.user.id, session.isDemoUser),
        friendService.getPendingRequests(session.user.id, session.isDemoUser),
      ]);
      setContacts(friends);
      setPendingRequests(requests);
    } catch (err) {
      console.warn('Error loading contacts:', err);
    } finally {
      setIsLoadingContacts(false);
    }
  }, [session.user, session.isDemoUser]);

  // Default recipient if none selected yet for the invitation tab
  const activeRecipient: Contact = selectedRecipient || contacts[0] || {
    id: 'friend_aisha',
    name: 'Aisha Sen',
    isOnline: true,
    statusText: 'Active now',
    relationship: 'FRIENDS',
    isPinned: false,
  };

  // Fetch invitation acceptance streaks (Personal & Friendship)
  const loadStreaks = useCallback(async (customFriendId?: string) => {
    if (!session.user) return;
    try {
      const friendId = customFriendId || selectedRecipient?.id || contacts[0]?.id || 'friend_aisha';
      const streaks = await invitationService.getInvitationStreaks(
        session.user.id,
        friendId,
        session.isDemoUser
      );
      setPersonalStreak(streaks.personalStreak);
      setFriendshipStreak(streaks.friendshipStreak);
    } catch (err) {
      console.warn('[BreakTym] Error loading streaks:', err);
    }
  }, [session.user, session.isDemoUser, selectedRecipient?.id, contacts]);

  // Fetch activity invitations (incoming and sent history)
  const loadInvitations = useCallback(async () => {
    if (!session.user) return;
    setIsLoadingInvitations(true);
    try {
      const list = await invitationService.getInvitations(session.user.id, session.isDemoUser);
      setInvitations(list);

      // Offline / Reconnection check: detect unacknowledged accepted invitation within the last 48 hours
      const now = Date.now();
      const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
      const uncelebrated = list.find((inv) => {
        if (inv.status !== 'accepted') return false;
        const acceptedTime = inv.acceptedAt
          ? new Date(inv.acceptedAt).getTime()
          : new Date(inv.createdAt).getTime();
        if (now - acceptedTime > FORTY_EIGHT_HOURS_MS) return false;

        const isSender = inv.senderId === session.user?.id;
        const isRecipient = inv.recipientId === session.user?.id;
        if (!isSender && !isRecipient) return false;

        const dbCelebrated = isSender ? Boolean(inv.senderCelebratedAt) : Boolean(inv.recipientCelebratedAt);
        const locallyCelebrated = session.user
          ? invitationService.isCelebrationAcknowledgedLocally(inv.id, session.user.id)
          : true;

        return !dbCelebrated && !locallyCelebrated;
      });

      if (uncelebrated) {
        setCelebratingInvitation(uncelebrated);
        const otherUserId =
          uncelebrated.senderId === session.user.id
            ? uncelebrated.recipientId
            : uncelebrated.senderId;
        invitationService
          .getInvitationStreaks(session.user.id, otherUserId, session.isDemoUser)
          .then((st) => {
            setCelebrationStreak(st.friendshipStreak);
          });
        const userRole = uncelebrated.senderId === session.user.id ? 'sender' : 'recipient';
        invitationService.markCelebrationSeen(
          uncelebrated.id,
          session.user.id,
          userRole,
          session.isDemoUser
        );
      }
    } catch (err) {
      console.warn('[BreakTym] Error loading invitations:', err);
    } finally {
      setIsLoadingInvitations(false);
    }
  }, [session.user, session.isDemoUser]);

  useEffect(() => {
    if (session.isAuthenticated) {
      loadContactsAndRequests();
      loadInvitations();
      loadStreaks();
    }
  }, [session.isAuthenticated, loadContactsAndRequests, loadInvitations, loadStreaks]);

  // Realtime subscription for incoming activity invitations & delivery status updates
  useEffect(() => {
    if (!session.isAuthenticated || !session.user || session.isDemoUser || !supabase) {
      return;
    }

    const currentUserId = session.user.id;
    console.log('[BreakTym Realtime] Subscribing to activity_invitations for user:', currentUserId);

    const channel = supabase
      .channel(`rt_invitations_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_invitations',
        },
        (payload) => {
          console.log('[BreakTym Realtime] Activity invitation event received:', payload);
          // Refresh invitations list and streaks immediately
          loadInvitations();
          loadStreaks();

          const record = payload.new as any;
          if (!record) return;

          // If current user is the recipient of a newly created invitation
          if (payload.eventType === 'INSERT' && record.recipient_id === currentUserId) {
            const title = record.activity_title || 'Break';
            setToastNotice(`New Break Invitation for ${title}! ✨`);
            showBrowserNotification('Break Invitation! ☕', {
              body: `You received an invitation for ${title}! Tap to respond.`,
              tag: `invite-${record.id}`,
            });
          }

          // If current user is sender or recipient and the invitation status became 'accepted'
          if (payload.eventType === 'UPDATE' && record.status === 'accepted') {
            const isUserSender = record.sender_id === currentUserId;
            const isUserRecipient = record.recipient_id === currentUserId;
            if (!isUserSender && !isUserRecipient) return;

            const title = record.activity_title || 'Break';

            if (isUserSender) {
              setToastNotice(`Your invitation for ${title} was accepted! 🎉`);
              showBrowserNotification('Invitation Accepted! 🎉', {
                body: `Your friend accepted your invitation for ${title}!`,
                tag: `invite-acc-${record.id}`,
              });
            }

            // Check if celebration hasn't been acknowledged
            const dbCelebrated = isUserSender
              ? Boolean(record.sender_celebrated_at)
              : Boolean(record.recipient_celebrated_at);
            const locallyCelebrated = invitationService.isCelebrationAcknowledgedLocally(
              record.id,
              currentUserId
            );

            if (!dbCelebrated && !locallyCelebrated) {
              const otherUserId = isUserSender ? record.recipient_id : record.sender_id;
              invitationService
                .getInvitationStreaks(currentUserId, otherUserId, session.isDemoUser)
                .then((st) => {
                  setCelebrationStreak(st.friendshipStreak);
                });

              const mappedInv: ActivityInvitation = {
                id: record.id,
                senderId: record.sender_id,
                recipientId: record.recipient_id,
                activityId: record.activity_id,
                activityTitle: record.activity_title,
                customNote: record.custom_note,
                status: 'accepted',
                meetingStatus: record.meeting_status || 'pending',
                headline: record.headline || getCelebrationHeadline(record.id),
                createdAt: record.created_at,
                acceptedAt: record.accepted_at || new Date().toISOString(),
                senderCelebratedAt: record.sender_celebrated_at,
                recipientCelebratedAt: record.recipient_celebrated_at,
                senderDisplayName: isUserSender
                  ? session.profile?.displayName || 'You'
                  : 'Friend',
                recipientDisplayName: !isUserSender
                  ? session.profile?.displayName || 'You'
                  : 'Friend',
              };

              setCelebratingInvitation(mappedInv);
            }
          } else if (
            payload.eventType === 'UPDATE' &&
            record.sender_id === currentUserId &&
            (record.status === 'declined' || record.status === 'rejected')
          ) {
            const title = record.activity_title || 'Break';
            setToastNotice(`Your invitation for ${title} was declined.`);
          }
        }
      )
      .subscribe((status) => {
        console.log('[BreakTym Realtime] activity_invitations channel status:', status);
      });

    return () => {
      console.log('[BreakTym Realtime] Unsubscribing channel for user:', currentUserId);
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [session.isAuthenticated, session.user, session.isDemoUser, loadInvitations, loadStreaks]);

  // Invitation response handlers
  const handleAcceptInvitation = async (invitationId: string) => {
    if (!session.user) return;
    const existing = invitations.find((i) => i.id === invitationId);
    const result = await invitationService.respondToInvitation(
      invitationId,
      session.user.id,
      'accepted',
      session.isDemoUser
    );
    if (result.success) {
      setToastNotice(result.message || 'Invitation accepted! Enjoy your break ✨');
      await loadInvitations();
      await loadStreaks();

      // Trigger celebration for recipient immediately
      const celebrationInv: ActivityInvitation = result.invitation || {
        id: invitationId,
        senderId: result.senderId || existing?.senderId || '',
        recipientId: session.user.id,
        activityId: existing?.activityId || '',
        activityTitle: existing?.activityTitle || 'Break',
        customNote: existing?.customNote,
        status: 'accepted',
        meetingStatus: 'pending',
        headline: result.headline || getCelebrationHeadline(invitationId),
        createdAt: existing?.createdAt || new Date().toISOString(),
        acceptedAt: new Date().toISOString(),
        senderDisplayName: result.senderName || existing?.senderDisplayName || 'Friend',
        recipientDisplayName: session.profile?.displayName || 'You',
      };

      setCelebratingInvitation(celebrationInv);
      setCelebrationStreak(result.friendshipStreak);
    } else {
      setToastNotice(result.error || 'Failed to accept invitation.');
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    if (!session.user) return;
    const result = await invitationService.respondToInvitation(
      invitationId,
      session.user.id,
      'rejected',
      session.isDemoUser
    );
    if (result.success) {
      setToastNotice(result.message || 'Invitation declined.');
      await loadInvitations();
    } else {
      setToastNotice(result.error || 'Failed to decline invitation.');
    }
  };

  // Auth Callbacks
  const handleAuthSuccess = (newSession: AuthSession, isNewUser = false) => {
    setSession(newSession);
    if (isNewUser || !newSession.profile?.displayName) {
      setShowProfileSetup(true);
    }
  };

  const handleProfileSetupComplete = (profile: UserProfile) => {
    setSession((prev) => ({
      ...prev,
      profile,
    }));
    setShowProfileSetup(false);
    setToastNotice(`Welcome to BreakTym, ${profile.displayName}! ✨`);
  };

  const handleSignOut = async () => {
    setShowSignOutModal(false);
    await authService.signOut();
    setSession({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      isDemoUser: false,
    });
    setActiveTab('home');
    setSelectedRecipient(null);
  };

  // Home interactions
  const handleSelectContactForInvite = (contact: Contact) => {
    setSelectedRecipient(contact);
    setActiveTab('invitation');
  };

  const handleInstantInvite = async (contact: Contact) => {
    if (!session.user) return;
    setInvitingContactIds((prev) => new Set(prev).add(contact.id));

    const result = await invitationService.sendActivityInvitation(
      contact.id,
      session.user.id,
      'act_chai',
      'Evening Chai',
      undefined,
      session.isDemoUser
    );

    setInvitingContactIds((prev) => {
      const next = new Set(prev);
      next.delete(contact.id);
      return next;
    });

    if (result.success) {
      setInvitedContactIds((prev) => new Set(prev).add(contact.id));
      setToastNotice(result.message || `Invitation for Evening Chai sent to ${contact.name}! ✨`);
      loadInvitations();
      setTimeout(() => {
        setInvitedContactIds((prev) => {
          const next = new Set(prev);
          next.delete(contact.id);
          return next;
        });
      }, 5000);
    } else {
      setToastNotice(result.errorMessage || 'Could not send invitation.');
    }
  };

  const handleTogglePin = (contactId: string) => {
    friendService.toggleFriendPin(contactId);
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, isPinned: !c.isPinned } : c))
    );
  };

  const handleQuickActivityClick = (_activityId: string) => {
    if (contacts.length > 0) {
      // Pick first contact or pinned contact
      const target = contacts.find((c) => c.isPinned) || contacts[0];
      setSelectedRecipient(target);
      setActiveTab('invitation');
    } else {
      setActiveTab('friends');
    }
  };

  // If restoring session
  if (session.isLoading) {
    return (
      <AmbientBackground>
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
          <BreakTymLogo size="md" showTagline={false} priority={true} />
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-[#B45CFF] border-t-transparent animate-spin" />
            <p className="text-xs font-semibold text-[#A5A0B5] tracking-widest uppercase">
              Loading BreakTym...
            </p>
          </div>
        </div>
      </AmbientBackground>
    );
  }

  // Unauthenticated State
  if (!session.isAuthenticated) {
    return (
      <AmbientBackground>
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      </AmbientBackground>
    );
  }

  // Pending incoming break invitations
  const incomingPendingInvitations = invitations.filter(
    (inv) =>
      inv.recipientId === session.user?.id &&
      (inv.status === 'pending' || inv.status === 'sent')
  );
  const totalUnreadCount = pendingRequests.length + incomingPendingInvitations.length;

  return (
    <AmbientBackground>
      {/* 1. Top Header */}
      <Header
        userProfile={session.profile}
        onProfileClick={() => setActiveTab('profile')}
        onSignOutClick={() => setShowSignOutModal(true)}
        onNotificationClick={() => setShowInboxModal(true)}
        hasUnreadNotifications={totalUnreadCount > 0}
        unreadCount={totalUnreadCount}
      />

      {/* Global Toast Notification */}
      {toastNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl 
        bg-[#202027]/95 backdrop-blur-md border border-[#B45CFF]/40 text-xs font-semibold text-[#F5F3FA] 
        shadow-[0_8px_30px_rgba(0,0,0,0.6),0_0_16px_rgba(180,92,255,0.3)] animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          <span>{toastNotice}</span>
          <button onClick={() => setToastNotice(null)} className="text-[#A5A0B5] hover:text-white ml-1">
            ✕
          </button>
        </div>
      )}

      {/* 2. Main Tab Views */}
      <main className="flex-1 w-full">
        {activeTab === 'home' && (
          <HomeView
            userName={session.profile?.displayName?.split(' ')[0] || 'Friend'}
            contacts={contacts}
            isLoading={isLoadingContacts}
            onSelectContactForInvite={handleSelectContactForInvite}
            onInstantInvite={handleInstantInvite}
            onTogglePin={handleTogglePin}
            onNavigateToFriends={() => setActiveTab('friends')}
            onQuickActivityClick={handleQuickActivityClick}
            invitingContactIds={invitingContactIds}
            invitedContactIds={invitedContactIds}
            hasLinkedPhone={Boolean(session.profile?.phoneNumber || session.user?.phone)}
            onLinkPhoneClick={() => setShowLinkPhoneModal(true)}
            incomingInvitations={incomingPendingInvitations}
            onAcceptInvitation={handleAcceptInvitation}
            onDeclineInvitation={handleDeclineInvitation}
            onOpenInbox={() => setShowInboxModal(true)}
            personalStreak={personalStreak}
          />
        )}

        {activeTab === 'friends' && (
          <FriendsView
            currentUserId={session.user?.id || ''}
            userProfile={session.profile}
            onProfileUpdated={(updated) => setSession((prev) => ({ ...prev, profile: updated }))}
            confirmedFriends={contacts}
            pendingRequests={pendingRequests}
            onRefresh={loadContactsAndRequests}
            onInviteToBreak={handleSelectContactForInvite}
            userName={session.profile?.displayName}
            isDemo={session.isDemoUser}
            hasLinkedPhone={Boolean(session.profile?.phoneNumber || session.user?.phone)}
            onLinkPhoneClick={() => setShowLinkPhoneModal(true)}
          />
        )}

        {activeTab === 'invitation' && (
          <InvitationView
            currentUserId={session.user?.id || ''}
            recipientContact={activeRecipient}
            onBackToHome={() => setActiveTab('home')}
            isDemo={session.isDemoUser}
            onOpenInbox={() => setShowInboxModal(true)}
            pendingInvitationsCount={incomingPendingInvitations.length}
            friendshipStreak={friendshipStreak}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            session={session}
            onProfileUpdated={(updated) => setSession((prev) => ({ ...prev, profile: updated }))}
            friendsCount={contacts.length}
            personalStreak={personalStreak}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            onSignOut={() => setShowSignOutModal(true)}
            isDemo={session.isDemoUser}
          />
        )}
      </main>

      {/* 3. Floating Glass Navigation Bar */}
      <FloatingNavBar
        currentTab={activeTab}
        onTabChange={setActiveTab}
        pendingRequestsCount={pendingRequests.length}
        pendingInvitationsCount={incomingPendingInvitations.length}
      />

      {/* 4. Activity Invitations Inbox Modal */}
      {session.user && (
        <InvitationsInboxModal
          isOpen={showInboxModal}
          onClose={() => setShowInboxModal(false)}
          invitations={invitations}
          currentUserId={session.user.id}
          onAccept={handleAcceptInvitation}
          onDecline={handleDeclineInvitation}
          onUpdateMeetingStatus={async (invitationId, meetingStatus) => {
            const res = await invitationService.updateMeetingStatus(invitationId, meetingStatus, session.isDemoUser);
            if (res.success) {
              setToastNotice(res.message || `Meeting status updated to ${meetingStatus}.`);
              await loadInvitations();
            } else {
              setToastNotice(res.error || 'Failed to update meeting status.');
            }
          }}
          isLoading={isLoadingInvitations}
          onRefresh={loadInvitations}
          onCelebrate={(inv) => {
            setCelebratingInvitation(inv);
            setShowInboxModal(false);
          }}
        />
      )}

      {/* 5. Profile Setup Modal */}
      {session.user && (
        <ProfileSetupModal
          isOpen={showProfileSetup}
          userId={session.user.id}
          onComplete={handleProfileSetupComplete}
          onClose={() => setShowProfileSetup(false)}
        />
      )}

      {/* 5. Link Phone Modal */}
      {session.user && (
        <LinkPhoneModal
          isOpen={showLinkPhoneModal}
          userId={session.user.id}
          onClose={() => setShowLinkPhoneModal(false)}
          onPhoneLinked={(updated) => {
            setSession((prev) => ({ ...prev, profile: updated }));
            setToastNotice('Phone number linked successfully! Your contacts can now discover you. ✨');
          }}
        />
      )}

      {/* 5. Sign Out Confirmation Modal */}
      <Modal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        title="Pause Session"
        description="Are you sure you want to pause your session and sign out of BreakTym?"
        maxWidth="sm"
      >
        <div className="flex gap-2.5 pt-2">
          <NeomorphicButton
            variant="ghost"
            onClick={() => setShowSignOutModal(false)}
            className="flex-1 text-xs"
          >
            Cancel
          </NeomorphicButton>
          <NeomorphicButton
            variant="danger"
            onClick={handleSignOut}
            className="flex-1 text-xs"
          >
            Sign Out
          </NeomorphicButton>
        </div>
      </Modal>

      {/* 6. Target Profile Resolution Modal from scanned/visited QR link */}
      {session.user && (
        <TargetProfileModal
          isOpen={showTargetProfileModal}
          onClose={() => {
            setShowTargetProfileModal(false);
            setTargetQRToken(null);
          }}
          qrToken={targetQRToken}
          currentUserId={session.user.id}
          isDemo={session.isDemoUser}
          onRequestSent={() => {
            loadContactsAndRequests();
            setToastNotice('Friend request sent! ✨');
          }}
        />
      )}

      {/* 7. Full-Screen Acceptance Celebration Overlay Modal */}
      {session.user && (
        <AcceptanceCelebrationModal
          isOpen={Boolean(celebratingInvitation)}
          onClose={() => {
            if (celebratingInvitation && session.user) {
              const role = celebratingInvitation.senderId === session.user.id ? 'sender' : 'recipient';
              invitationService.markCelebrationSeen(
                celebratingInvitation.id,
                session.user.id,
                role,
                session.isDemoUser
              );
            }
            setCelebratingInvitation(null);
          }}
          invitation={celebratingInvitation}
          currentUserId={session.user.id}
          friendshipStreak={celebrationStreak}
          onViewInvitation={(_inv) => {
            if (celebratingInvitation && session.user) {
              const role = celebratingInvitation.senderId === session.user.id ? 'sender' : 'recipient';
              invitationService.markCelebrationSeen(
                celebratingInvitation.id,
                session.user.id,
                role,
                session.isDemoUser
              );
            }
            setCelebratingInvitation(null);
            setShowInboxModal(true);
          }}
        />
      )}
    </AmbientBackground>
  );
};

export default App;
