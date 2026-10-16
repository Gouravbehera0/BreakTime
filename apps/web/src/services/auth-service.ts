import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserProfile, AuthSession } from '@/types/auth';

const DEMO_USER_STORAGE_KEY = 'breaktym_demo_user';
const DEMO_PROFILE_STORAGE_KEY = 'breaktym_demo_profile';
const PHONE_USER_STORAGE_KEY = 'breaktym_phone_user';
const PHONE_PROFILE_STORAGE_KEY = 'breaktym_phone_profile';

export const authService = {
  /**
   * Direct Phone Sign In & Registration (Zero OTP)
   * Connects phone number directly to user account without requiring SMS OTP code.
   */
  async signInWithPhone(
    phoneNumber: string,
    displayName?: string
  ): Promise<{ success: boolean; session?: AuthSession; isNewUser?: boolean; error?: string }> {
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      return { success: false, error: 'Please enter a valid mobile number.' };
    }

    const syntheticEmail = `phone_${cleanDigits}@phone.breaktym.app`;
    const syntheticPassword = `bt_sec_${cleanDigits}_tym`;

    // 1. Try Supabase Auth if configured
    if (isSupabaseConfigured() && supabase) {
      try {
        let authUser: { id: string; email?: string; phone?: string } | null = null;
        let isNew = false;

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: syntheticEmail,
          password: syntheticPassword,
        });

        if (!signInError && signInData?.user) {
          authUser = {
            id: signInData.user.id,
            email: signInData.user.email,
            phone: phoneNumber,
          };
        } else {
          // If user doesn't exist, sign them up directly
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: syntheticEmail,
            password: syntheticPassword,
            options: {
              data: {
                phone: phoneNumber,
                display_name: displayName || 'BreakTym Member',
              },
            },
          });

          if (signUpData?.user) {
            authUser = {
              id: signUpData.user.id,
              email: signUpData.user.email,
              phone: phoneNumber,
            };
            isNew = true;
          } else if (signUpError) {
            console.warn('Supabase phone signup notice:', signUpError.message);
          }
        }

        if (authUser) {
          // Fetch or upsert profile
          let profile = await this.getProfile(authUser.id);
          if (!profile || !profile.phoneNumber) {
            profile = await this.upsertProfile({
              id: authUser.id,
              phoneNumber: phoneNumber,
              displayName: profile?.displayName || displayName || 'BreakTym Member',
            });
          }

          const session: AuthSession = {
            user: authUser,
            profile,
            isAuthenticated: true,
            isLoading: false,
            isDemoUser: false,
          };

          // Cache phone session locally as resilient backup
          localStorage.setItem(PHONE_USER_STORAGE_KEY, JSON.stringify(authUser));
          if (profile) {
            localStorage.setItem(PHONE_PROFILE_STORAGE_KEY, JSON.stringify(profile));
          }

          return {
            success: true,
            isNewUser: isNew || !profile.displayName,
            session,
          };
        }
      } catch (err) {
        console.warn('Supabase signInWithPhone error, switching to resilient local session:', err);
      }
    }

    // 2. Resilient Local-First Phone Auth (Zero-OTP, no SMS dependency)
    const localUserId = `user_phone_${cleanDigits}`;
    const user = {
      id: localUserId,
      phone: phoneNumber,
      email: syntheticEmail,
    };

    let profile = await this.getProfile(localUserId);
    const isNew = !profile;

    if (!profile) {
      profile = await this.upsertProfile({
        id: localUserId,
        displayName: displayName || 'BreakTym Member',
        phoneNumber: phoneNumber,
      });
    } else if (!profile.phoneNumber) {
      profile = await this.upsertProfile({
        ...profile,
        phoneNumber: phoneNumber,
      });
    }

    const session: AuthSession = {
      user,
      profile,
      isAuthenticated: true,
      isLoading: false,
      isDemoUser: false,
    };

    localStorage.setItem(PHONE_USER_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(PHONE_PROFILE_STORAGE_KEY, JSON.stringify(profile));

    return {
      success: true,
      isNewUser: isNew,
      session,
    };
  },

  /**
   * Compatibility wrapper (no longer requires OTP)
   */
  async sendPhoneOtp(_phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  },

  /**
   * Compatibility wrapper (no longer requires OTP)
   */
  async verifyPhoneOtp(
    phoneNumber: string,
    _token?: string
  ): Promise<{ success: boolean; session?: AuthSession; isNewUser?: boolean; error?: string }> {
    return this.signInWithPhone(phoneNumber);
  },

  /**
   * Sign in with Email and Password
   */
  async signInWithEmail(email: string, password: string): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        success: false,
        error: 'Supabase is not configured. Use Demo Mode or configure .env.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        return { success: false, error: error?.message || 'Failed to sign in.' };
      }

      const profile = await this.getProfile(data.user.id);

      return {
        success: true,
        session: {
          user: {
            id: data.user.id,
            email: data.user.email,
            phone: data.user.phone,
          },
          profile,
          isAuthenticated: true,
          isLoading: false,
          isDemoUser: false,
        },
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errorMsg };
    }
  },

  /**
   * Sign up with Email and Password
   */
  async signUpWithEmail(
    email: string,
    password: string,
    displayName: string
  ): Promise<{ success: boolean; requiresEmailConfirmation?: boolean; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        success: false,
        error: 'Supabase is not configured.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Attempt creating profile record
        await this.upsertProfile({
          id: data.user.id,
          displayName,
          bio: 'Down for spontaneous plans ✨',
        });
      }

      return {
        success: true,
        requiresEmailConfirmation: !data.session,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errorMsg };
    }
  },

  /**
   * Send Password Reset Email
   */
  async sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase is not configured.' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errorMsg };
    }
  },

  /**
   * Signs in with Demo account for offline / sandbox testing
   */
  async loginAsDemo(): Promise<AuthSession> {
    const demoUser = {
      id: 'demo_user_breaktime_id',
      email: 'alex@breaktym.app',
      phone: '+919876500000',
    };

    const demoProfile: UserProfile = {
      id: demoUser.id,
      displayName: 'Alex Morgan',
      phoneNumber: demoUser.phone,
      bio: 'Living for spontaneous chai and midnight drives ✨',
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoUser));
    localStorage.setItem(DEMO_PROFILE_STORAGE_KEY, JSON.stringify(demoProfile));

    return {
      user: demoUser,
      profile: demoProfile,
      isAuthenticated: true,
      isLoading: false,
      isDemoUser: true,
    };
  },

  /**
   * Gets current user profile
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    // 1. Check demo
    const demoStored = localStorage.getItem(DEMO_PROFILE_STORAGE_KEY);
    if (demoStored) {
      try {
        const parsed = JSON.parse(demoStored);
        if (parsed.id === userId) return parsed;
      } catch {
        // ignore
      }
    }

    // 2. Check local user cache
    const userCacheKey = `breaktym_profile_${userId}`;
    const cachedProfileRaw = localStorage.getItem(userCacheKey);
    let cachedProfile: UserProfile | null = null;
    if (cachedProfileRaw) {
      try {
        cachedProfile = JSON.parse(cachedProfileRaw);
      } catch {
        // ignore
      }
    }

    // 3. Query Supabase if configured
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!error && data) {
          const profile: UserProfile = {
            id: data.id,
            displayName: data.display_name,
            phoneNumber: data.phone_number,
            avatarUrl: data.avatar_url,
            bio: data.bio,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          localStorage.setItem(userCacheKey, JSON.stringify(profile));
          return profile;
        }
      } catch (err) {
        console.warn('Supabase getProfile fetch notice:', err);
      }
    }

    // 4. Return cached profile if found
    if (cachedProfile && cachedProfile.displayName) {
      return cachedProfile;
    }

    // 5. Try deriving profile from Supabase Auth user metadata
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id === userId && user.user_metadata?.display_name) {
          const derived: UserProfile = {
            id: userId,
            displayName: user.user_metadata.display_name,
            phoneNumber: user.phone || null,
            bio: 'Living for spontaneous moments ✨',
            createdAt: user.created_at,
          };
          localStorage.setItem(userCacheKey, JSON.stringify(derived));
          return derived;
        }
      } catch {
        // ignore
      }
    }

    return cachedProfile;
  },

  /**
   * Upserts user profile in public.profiles with robust local fallback
   */
  async upsertProfile(profile: Partial<UserProfile> & { id: string }): Promise<UserProfile> {
    const userCacheKey = `breaktym_profile_${profile.id}`;
    const existingRaw = localStorage.getItem(userCacheKey) || localStorage.getItem(DEMO_PROFILE_STORAGE_KEY);
    let existing: Partial<UserProfile> = {};
    if (existingRaw) {
      try {
        existing = JSON.parse(existingRaw);
      } catch {
        // ignore
      }
    }

    const fallbackProfile: UserProfile = {
      id: profile.id,
      displayName: profile.displayName || existing.displayName || 'BreakTym Member',
      phoneNumber: profile.phoneNumber !== undefined ? profile.phoneNumber : (existing.phoneNumber || null),
      avatarUrl: profile.avatarUrl !== undefined ? profile.avatarUrl : (existing.avatarUrl || null),
      bio: profile.bio !== undefined ? profile.bio : (existing.bio || 'Living for spontaneous breaks ✨'),
      updatedAt: new Date().toISOString(),
      createdAt: existing.createdAt || new Date().toISOString(),
    };

    // Always persist to local cache first so the user is never blocked
    localStorage.setItem(userCacheKey, JSON.stringify(fallbackProfile));

    // Also update demo profile if it's the demo user
    if (profile.id === 'demo_user_breaktime_id') {
      localStorage.setItem(DEMO_PROFILE_STORAGE_KEY, JSON.stringify(fallbackProfile));
      return fallbackProfile;
    }

    // Attempt saving to Supabase if configured
    if (isSupabaseConfigured() && supabase) {
      try {
        const payload: Record<string, unknown> = {
          id: profile.id,
          updated_at: new Date().toISOString(),
        };
        if (profile.displayName !== undefined) payload.display_name = profile.displayName;
        if (profile.phoneNumber !== undefined) payload.phone_number = profile.phoneNumber;
        if (profile.avatarUrl !== undefined) payload.avatar_url = profile.avatarUrl;
        if (profile.bio !== undefined) payload.bio = profile.bio;

        const { data, error } = await supabase
          .from('profiles')
          .upsert(payload)
          .select()
          .maybeSingle();

        if (error) {
          console.warn('Supabase profiles notice (table may need creation in Supabase SQL editor):', error.message);
          return fallbackProfile;
        }

        if (data) {
          const remoteProfile: UserProfile = {
            id: data.id,
            displayName: data.display_name,
            phoneNumber: data.phone_number,
            avatarUrl: data.avatar_url,
            bio: data.bio,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          localStorage.setItem(userCacheKey, JSON.stringify(remoteProfile));
          return remoteProfile;
        }
      } catch (err) {
        console.warn('Supabase upsertProfile exception:', err);
      }
    }

    return fallbackProfile;
  },

  /**
   * Restores existing active session
   */
  async restoreSession(): Promise<AuthSession> {
    // 1. Check Demo Session
    const demoUserRaw = localStorage.getItem(DEMO_USER_STORAGE_KEY);
    const demoProfileRaw = localStorage.getItem(DEMO_PROFILE_STORAGE_KEY);
    if (demoUserRaw && demoProfileRaw) {
      try {
        return {
          user: JSON.parse(demoUserRaw),
          profile: JSON.parse(demoProfileRaw),
          isAuthenticated: true,
          isLoading: false,
          isDemoUser: true,
        };
      } catch {
        // continue
      }
    }

    // 2. Check Supabase Session
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const profile = await this.getProfile(session.user.id);
          return {
            user: {
              id: session.user.id,
              email: session.user.email,
              phone: session.user.phone,
            },
            profile,
            isAuthenticated: true,
            isLoading: false,
            isDemoUser: false,
          };
        }
      } catch {
        // ignore
      }
    }

    // 3. Check Phone User Session (Resilient Local-First)
    const phoneUserRaw = localStorage.getItem(PHONE_USER_STORAGE_KEY);
    const phoneProfileRaw = localStorage.getItem(PHONE_PROFILE_STORAGE_KEY);
    if (phoneUserRaw && phoneProfileRaw) {
      try {
        return {
          user: JSON.parse(phoneUserRaw),
          profile: JSON.parse(phoneProfileRaw),
          isAuthenticated: true,
          isLoading: false,
          isDemoUser: false,
        };
      } catch {
        // continue
      }
    }

    return {
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      isDemoUser: false,
    };
  },

  /**
   * Directly links a phone number to user account & profile with zero OTP
   */
  async linkPhoneDirect(
    userId: string,
    phoneNumber: string
  ): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    // 1. Update Supabase Auth metadata if session is active
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.updateUser({
          data: { phone_number: phoneNumber },
        });
      } catch (err) {
        console.warn('updateUser phone metadata notice:', err);
      }
    }

    // 2. Persist phone to profile (local-first + Supabase profiles table)
    try {
      const updated = await this.upsertProfile({
        id: userId,
        phoneNumber,
      });

      // Update phone profile storage if active
      if (updated) {
        localStorage.setItem(PHONE_PROFILE_STORAGE_KEY, JSON.stringify(updated));
      }

      return { success: true, profile: updated };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },

  /**
   * Compatibility wrapper for phone linking (zero OTP)
   */
  async verifyAndLinkPhone(
    userId: string,
    phoneNumber: string,
    _token?: string
  ): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    return this.linkPhoneDirect(userId, phoneNumber);
  },

  /**
   * Compatibility wrapper
   */
  async requestPhoneLink(_phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  },

  /**
   * Signs out current user
   */
  async signOut(): Promise<void> {
    localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    localStorage.removeItem(DEMO_PROFILE_STORAGE_KEY);
    localStorage.removeItem(PHONE_USER_STORAGE_KEY);
    localStorage.removeItem(PHONE_PROFILE_STORAGE_KEY);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
  },
};
