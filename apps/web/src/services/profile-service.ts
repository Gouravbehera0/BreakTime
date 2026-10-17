import { UserProfile } from '@/types/auth';
import { authService } from './auth-service';
import { friendService } from './friend-service';
import { validateUsername } from '@/lib/qr-code';

/**
 * Dedicated Profile Service for BreakTym
 * Encapsulates profile lifecycle, uniqueness validation, and secure attribute updates.
 */
export const profileService = {
  /**
   * Fetches the profile of a given user ID.
   * Respects Row Level Security; relies on authService cache & Supabase RPCs.
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;
    return authService.getProfile(userId);
  },

  /**
   * Ensures a profile exists for an authenticated user, creating one if absent.
   */
  async createProfileWhenMissing(
    userId: string,
    initialData?: Partial<UserProfile>
  ): Promise<UserProfile> {
    const existing = await this.getProfile(userId);
    if (existing && existing.displayName) {
      return existing;
    }

    return authService.upsertProfile({
      id: userId,
      displayName: initialData?.displayName || 'BreakTym Member',
      username: initialData?.username || null,
      avatarUrl: initialData?.avatarUrl || null,
      bio: initialData?.bio || 'Living for spontaneous moments ✨',
      phoneNumber: initialData?.phoneNumber || null,
    });
  },

  /**
   * Updates user's public display name.
   */
  async updateDisplayName(userId: string, displayName: string): Promise<UserProfile> {
    const cleanName = displayName.trim();
    if (!cleanName) {
      throw new Error('Display name cannot be empty.');
    }

    return authService.upsertProfile({
      id: userId,
      displayName: cleanName,
    });
  },

  /**
   * Updates user's unique username with format validation and collision detection.
   */
  async updateUsername(
    userId: string,
    username: string,
    isDemo = false
  ): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');

    if (cleanUsername) {
      const validation = validateUsername(cleanUsername);
      if (!validation.valid) {
        return { success: false, error: validation.error || 'Invalid username format.' };
      }

      // Check availability against other users
      const isAvailable = await friendService.checkUsernameAvailable(
        cleanUsername,
        userId,
        isDemo
      );

      if (!isAvailable) {
        return {
          success: false,
          error: `@${cleanUsername} is already taken. Please pick another username.`,
        };
      }
    }

    try {
      const updated = await authService.upsertProfile({
        id: userId,
        username: cleanUsername || null,
      });

      return { success: true, profile: updated };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errorMsg };
    }
  },

  /**
   * Updates user's avatar image URL.
   */
  async updateAvatarUrl(userId: string, avatarUrl: string): Promise<UserProfile> {
    return authService.upsertProfile({
      id: userId,
      avatarUrl: avatarUrl.trim() || null,
    });
  },

  /**
   * Updates user's status bio.
   */
  async updateBio(userId: string, bio: string): Promise<UserProfile> {
    return authService.upsertProfile({
      id: userId,
      bio: bio.trim(),
    });
  },
};
