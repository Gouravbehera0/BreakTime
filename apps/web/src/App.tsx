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
import { Modal } from '@/components/ui/Modal';
import { NeomorphicButton } from '@/components/ui/NeomorphicButton';
import { BreakTymLogo } from '@/components/ui/BreakTymLogo';
import { authService } from '@/services/auth-service';
import { friendService } from '@/services/friend-service';
import { invitationService } from '@/services/invitation-service';
import { AuthSession, UserProfile } from '@/types/auth';
import { Contact, FriendRequest } from '@/types/contact';

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
  const [selectedRecipient, setSelectedRecipient] = useState<Contact | null>(null);
  const [invitingContactIds, setInvitingContactIds] = useState<Set<string>>(new Set());
  const [invitedContactIds, setInvitedContactIds] = useState<Set<string>>(new Set());
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

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

  useEffect(() => {
    if (session.isAuthenticated) {
      loadContactsAndRequests();
    }
  }, [session.isAuthenticated, loadContactsAndRequests]);

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
      setToastNotice(`Invitation for Evening Chai sent to ${contact.name}! ✨`);
      setTimeout(() => {
        setInvitedContactIds((prev) => {
          const next = new Set(prev);
          next.delete(contact.id);
          return next;
        });
      }, 5000);
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

  // Default recipient if none selected yet for the invitation tab
  const activeRecipient = selectedRecipient || contacts[0] || {
    id: 'friend_aisha',
    name: 'Aisha Sen',
    isOnline: true,
    statusText: 'Active now',
    relationship: 'FRIENDS',
    isPinned: false,
  };

  return (
    <AmbientBackground>
      {/* 1. Top Header */}
      <Header
        userProfile={session.profile}
        onProfileClick={() => setActiveTab('profile')}
        onSignOutClick={() => setShowSignOutModal(true)}
        onNotificationClick={() => setActiveTab('friends')}
        hasUnreadNotifications={pendingRequests.length > 0}
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
          />
        )}

        {activeTab === 'friends' && (
          <FriendsView
            currentUserId={session.user?.id || ''}
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
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            session={session}
            onProfileUpdated={(updated) => setSession((prev) => ({ ...prev, profile: updated }))}
            friendsCount={contacts.length}
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
      />

      {/* 4. Profile Setup Modal */}
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
    </AmbientBackground>
  );
};

export default App;
