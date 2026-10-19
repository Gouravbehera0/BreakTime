import React, { useState, useEffect } from 'react';
import {
  Database,
  ShieldCheck,
  Palette,
  Info,
  LogOut,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Bell,
  Send,
  Lock,
} from 'lucide-react';
import { NeomorphicCard } from '@/components/ui/NeomorphicCard';
import { NeomorphicButton } from '@/components/ui/NeomorphicButton';
import { BreakTymLogo } from '@/components/ui/BreakTymLogo';
import { checkSupabaseConnection } from '@/lib/supabase';
import {
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  showBrowserNotification,
  isPushNotificationSupported,
  getVapidPublicKey,
  PushPermissionStatus,
} from '@/lib/push-notifications';

interface SettingsViewProps {
  onSignOut: () => void;
  isDemo?: boolean;
  userId?: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onSignOut,
  isDemo = false,
  userId = '',
}) => {
  const [connectionStatus, setConnectionStatus] = useState<{
    checked: boolean;
    connected: boolean;
    tablesNeedCreation?: boolean;
    message: string;
  }>({
    checked: false,
    connected: false,
    message: 'Checking backend status...',
  });
  const [isChecking, setIsChecking] = useState(false);

  // Push notification states
  const [pushPermission, setPushPermission] = useState<PushPermissionStatus>('default');
  const [isPushSupported, setIsPushSupported] = useState(true);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [pushStatusMessage, setPushStatusMessage] = useState<string | null>(null);

  const runConnectionCheck = async () => {
    setIsChecking(true);
    const result = await checkSupabaseConnection();
    setConnectionStatus({
      checked: true,
      connected: result.connected,
      tablesNeedCreation: result.tablesNeedCreation,
      message: result.message,
    });
    setIsChecking(false);
  };

  const refreshPushStatus = () => {
    const supported = isPushNotificationSupported();
    setIsPushSupported(supported);
    if (!supported) {
      setPushPermission('unsupported');
    } else {
      setPushPermission(getNotificationPermission());
    }
  };

  useEffect(() => {
    runConnectionCheck();
    refreshPushStatus();
  }, []);

  const handleEnablePush = async () => {
    setIsPushLoading(true);
    setPushStatusMessage(null);
    try {
      const res = await subscribeToPush(userId, isDemo);
      setPushPermission(res.permission);
      if (res.success) {
        setPushStatusMessage('Notifications enabled! You will be alerted when friends invite you.');
      } else {
        setPushStatusMessage(res.error || 'Could not enable notifications.');
      }
    } catch (err: any) {
      setPushStatusMessage(err?.message || 'Error subscribing to notifications.');
    } finally {
      setIsPushLoading(false);
    }
  };

  const handleDisablePush = async () => {
    setIsPushLoading(true);
    try {
      await unsubscribeFromPush(userId, isDemo);
      refreshPushStatus();
      setPushStatusMessage('Push notifications disabled for this device.');
    } catch (err: any) {
      setPushStatusMessage(err?.message || 'Error disabling notifications.');
    } finally {
      setIsPushLoading(false);
    }
  };

  const handleSendTestAlert = () => {
    showBrowserNotification('BreakTym Test Alert ☕', {
      body: 'Your notification system is working perfectly!',
      tag: 'breaktym-test',
    });
    setPushStatusMessage('Test notification sent! Check your notification center.');
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'Not configured in .env';
  const hasVapidKey = Boolean(getVapidPublicKey());

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-4 pb-28 space-y-6 text-left">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3FA] tracking-tight">
        Settings & Architecture
      </h1>

      {/* 1. Web Push Notifications Status & Controls */}
      <NeomorphicCard className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#B45CFF]" />
            <h2 className="text-sm font-bold text-[#F5F3FA] uppercase tracking-wider">
              Web Push Notifications
            </h2>
          </div>

          <button
            onClick={refreshPushStatus}
            className="p-1.5 rounded-lg text-[#A5A0B5] hover:text-[#F5F3FA] hover:bg-white/5 transition-colors"
            title="Refresh notification status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-[#1B1B22] border border-[#30303A]/60 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A5A0B5]">Permission Status</span>
            <span className="flex items-center gap-1.5 font-semibold text-xs">
              {pushPermission === 'granted' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#86EFAC]" />
                  <span className="text-[#86EFAC]">Active & Enabled</span>
                </>
              ) : pushPermission === 'denied' ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-[#FF6B81]" />
                  <span className="text-[#FF6B81]">Blocked in Browser</span>
                </>
              ) : pushPermission === 'unsupported' ? (
                <>
                  <Info className="w-3.5 h-3.5 text-[#A5A0B5]" />
                  <span className="text-[#A5A0B5]">Not Supported</span>
                </>
              ) : (
                <>
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400">Not Enabled (Default)</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
            <span className="text-[#A5A0B5]">VAPID Public Key</span>
            <span className="font-mono text-[11px] text-[#F5F3FA]">
              {hasVapidKey ? (
                <span className="text-[#86EFAC]">Configured</span>
              ) : (
                <span className="text-amber-400">Unset in .env</span>
              )}
            </span>
          </div>
        </div>

        {/* Dynamic status feedback */}
        {pushStatusMessage && (
          <p className="text-xs text-[#B45CFF] leading-relaxed bg-[#B45CFF]/10 p-2.5 rounded-lg border border-[#B45CFF]/20">
            {pushStatusMessage}
          </p>
        )}

        {/* Instructions if permission is blocked in browser */}
        {pushPermission === 'denied' && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5 text-red-400">
              <Lock className="w-3.5 h-3.5" />
              <span>How to unblock notifications:</span>
            </p>
            <ol className="list-decimal list-inside text-[11px] text-[#A5A0B5] space-y-1">
              <li>Click the lock or tune icon in your browser URL bar.</li>
              <li>Change <strong>Notifications</strong> from Blocked to <strong>Allow</strong>.</li>
              <li>Click the button below to check again.</li>
            </ol>
            <div className="pt-2">
              <NeomorphicButton
                variant="secondary"
                onClick={refreshPushStatus}
                className="w-full text-xs py-2"
              >
                Check Again
              </NeomorphicButton>
            </div>
          </div>
        )}

        {/* Actions based on status */}
        {pushPermission === 'granted' ? (
          <div className="flex gap-2">
            <NeomorphicButton
              variant="secondary"
              onClick={handleSendTestAlert}
              className="flex-1 text-xs py-2.5"
              icon={<Send className="w-3.5 h-3.5 text-[#B45CFF]" />}
            >
              Send Test Alert
            </NeomorphicButton>
            <NeomorphicButton
              variant="danger"
              onClick={handleDisablePush}
              disabled={isPushLoading}
              className="text-xs py-2.5 px-3"
            >
              Disable
            </NeomorphicButton>
          </div>
        ) : pushPermission !== 'denied' && pushPermission !== 'unsupported' ? (
          <NeomorphicButton
            variant="primary"
            onClick={handleEnablePush}
            disabled={isPushLoading || !isPushSupported}
            className="w-full text-xs py-2.5"
            icon={<Bell className="w-3.5 h-3.5" />}
          >
            {isPushLoading ? 'Connecting...' : 'Enable Web Push Notifications'}
          </NeomorphicButton>
        ) : null}
      </NeomorphicCard>

      {/* 2. Supabase Backend Integration Status */}
      <NeomorphicCard className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#B45CFF]" />
            <h2 className="text-sm font-bold text-[#F5F3FA] uppercase tracking-wider">
              Supabase Backend Status
            </h2>
          </div>

          <button
            onClick={runConnectionCheck}
            disabled={isChecking}
            className="p-1.5 rounded-lg text-[#A5A0B5] hover:text-[#F5F3FA] hover:bg-white/5 transition-colors"
            title="Refresh connection status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-[#1B1B22] border border-[#30303A]/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A5A0B5]">Environment URL</span>
            <span className="font-mono text-[#F5F3FA] text-[11px] truncate max-w-[220px]">
              {supabaseUrl}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
            <span className="text-[#A5A0B5]">Connection State</span>
            <span className="flex items-center gap-1.5 font-semibold text-xs">
              {connectionStatus.connected ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#86EFAC]" />
                  <span className="text-[#86EFAC]">Connected Live</span>
                </>
              ) : isDemo ? (
                <>
                  <Info className="w-3.5 h-3.5 text-[#B45CFF]" />
                  <span className="text-[#B45CFF]">Active in Demo Mode</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-[#FF6B81]" />
                  <span className="text-[#FF6B81]">Offline / Not Reachable</span>
                </>
              )}
            </span>
          </div>
        </div>

        <p className="text-xs text-[#A5A0B5]">
          {connectionStatus.message}
        </p>

        {connectionStatus.tablesNeedCreation && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2">
            <p className="font-semibold flex items-center gap-1.5 text-amber-300">
              <span>⚠️ Action Needed in Supabase SQL Editor:</span>
            </p>
            <p className="text-[11px] leading-relaxed text-[#A5A0B5]">
              To enable server-side database syncing for friends & profiles, open your Supabase project Dashboard → SQL Editor, and paste the contents of:
              <br />
              <code className="text-amber-300 font-mono text-[10px]">supabase/migrations/20261017_user_id_search_and_friend_requests.sql</code>
            </p>
          </div>
        )}
      </NeomorphicCard>

      {/* 3. Privacy & Security Rules */}
      <NeomorphicCard className="p-5 sm:p-6 space-y-3.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#86EFAC]" />
          <h2 className="text-sm font-bold text-[#F5F3FA] uppercase tracking-wider">
            BreakTym Privacy Model
          </h2>
        </div>

        <ul className="text-xs text-[#A5A0B5] space-y-2.5">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#86EFAC] shrink-0 mt-0.5" />
            <span><strong>No Public Directory:</strong> Users cannot be searched globally or discovered by random strangers.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#86EFAC] shrink-0 mt-0.5" />
            <span><strong>Server-Side Contact Matching:</strong> Matching is performed via Postgres SECURITY DEFINER function without exposing raw phone directories.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#86EFAC] shrink-0 mt-0.5" />
            <span><strong>Consent-Based Activities:</strong> Intimate invitation categories (Kiss, Cuddle) are strictly restricted to mutual romantic partners (LOVER relationship).</span>
          </li>
        </ul>
      </NeomorphicCard>

      {/* 4. Midnight Neomorphism Design System */}
      <NeomorphicCard className="p-5 sm:p-6 space-y-3.5">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#B45CFF]" />
          <h2 className="text-sm font-bold text-[#F5F3FA] uppercase tracking-wider">
            Midnight Neomorphism Design Palette
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
          <div className="p-2 rounded-xl bg-[#17171C] border border-[#30303A] text-[#F5F3FA]">
            Base
            <br />
            #17171C
          </div>
          <div className="p-2 rounded-xl bg-[#202027] border border-[#30303A] text-[#F5F3FA]">
            Surface
            <br />
            #202027
          </div>
          <div className="p-2 rounded-xl bg-[#B45CFF] text-white font-bold">
            Purple
            <br />
            #B45CFF
          </div>
          <div className="p-2 rounded-xl bg-[#86EFAC] text-black font-bold">
            Status
            <br />
            #86EFAC
          </div>
        </div>
      </NeomorphicCard>

      {/* 5. App Information */}
      <NeomorphicCard className="p-5 sm:p-6 space-y-3.5 text-center flex flex-col items-center">
        <BreakTymLogo size="md" showTagline={true} />
        <p className="text-[11px] font-mono text-[#7E7991] pt-1">
          Version 2.0.0 (Web Architecture) • React + Vite + Tailwind + Supabase
        </p>

        <div className="pt-3 border-t border-white/5">
          <NeomorphicButton
            variant="danger"
            onClick={onSignOut}
            className="w-full text-xs py-2.5"
            icon={<LogOut className="w-4 h-4" />}
          >
            Sign Out of BreakTym
          </NeomorphicButton>
        </div>
      </NeomorphicCard>
    </div>
  );
};
