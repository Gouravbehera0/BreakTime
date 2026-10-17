import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, Palette, Info, LogOut, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { NeomorphicCard } from '@/components/ui/NeomorphicCard';
import { NeomorphicButton } from '@/components/ui/NeomorphicButton';
import { BreakTymLogo } from '@/components/ui/BreakTymLogo';
import { checkSupabaseConnection } from '@/lib/supabase';

interface SettingsViewProps {
  onSignOut: () => void;
  isDemo?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onSignOut, isDemo = false }) => {
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

  useEffect(() => {
    runConnectionCheck();
  }, []);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'Not configured in .env';

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-4 pb-28 space-y-6 text-left">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3FA] tracking-tight">
        Settings & Architecture
      </h1>

      {/* 1. Supabase Backend Integration Status */}
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

      {/* 2. Privacy & Security Rules */}
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

      {/* 3. Midnight Neomorphism Design System */}
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

      {/* 4. App Information */}
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
