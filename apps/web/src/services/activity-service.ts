import { BreakActivity } from '@/types/activity';
import { RelationshipType } from '@/types/contact';

const BASE_ACTIVITIES: BreakActivity[] = [
  {
    id: 'act_chai',
    title: 'EVENING CHAI',
    subtitle: 'Warm cups and slow talks.',
    iconType: 'EVENING_CHAI',
    emoji: '☕',
    tags: ['Just the two of us', 'At our usual spot'],
  },
  {
    id: 'act_night_ride',
    title: 'NIGHT RIDE',
    subtitle: "Let's escape the routine.",
    iconType: 'NIGHT_RIDE',
    emoji: '🏍️',
    tags: ['Just the two of us', 'Anywhere nearby'],
  },
  {
    id: 'act_shopping',
    title: 'SHOPPING',
    subtitle: 'Retail therapy and good company.',
    iconType: 'SHOPPING',
    emoji: '🛍️',
    tags: ['Mall or street walk', 'Weekend vibe'],
  },
  {
    id: 'act_walking',
    title: 'WALKING',
    subtitle: 'Clear our heads under the stars.',
    iconType: 'WALKING',
    emoji: '🚶',
    tags: ['Quiet path', '30-minute unwind'],
  },
  {
    id: 'act_food',
    title: 'FOOD',
    subtitle: 'Midnight cravings and street eats.',
    iconType: 'FOOD',
    emoji: '🍜',
    tags: ['Food walk', 'Your favourite spot'],
  },
  {
    id: 'act_movie_night',
    title: 'MOVIE NIGHT',
    subtitle: 'Popcorn and a great story.',
    iconType: 'MOVIE_NIGHT',
    emoji: '🎬',
    tags: ['Cozy stream', 'Late night show'],
  },
  {
    id: 'act_gaming',
    title: 'GAMING',
    subtitle: 'Co-op sessions and friendly rivalry.',
    iconType: 'GAMING',
    emoji: '🎮',
    tags: ['Console or PC', 'Victory royale'],
  },
  {
    id: 'act_smoking_break',
    title: 'SMOKING BREAK',
    subtitle: 'Quick reset and fresh air.',
    iconType: 'SMOKING_BREAK',
    emoji: '🚬',
    tags: ['Quick 10m', 'Balcony or corner'],
  },
  {
    id: 'act_drinking',
    title: 'DRINKING',
    subtitle: 'Chilled drinks and late confessions.',
    iconType: 'DRINKING',
    emoji: '🥂',
    tags: ['Rooftop or pub', 'Unwind night'],
  },
  {
    id: 'act_kiss',
    title: 'KISS',
    subtitle: 'Soft moments that say everything.',
    iconType: 'KISS',
    emoji: '💋',
    isIntimate: true,
    requiredRelationship: ['LOVER'],
    tags: ['Intimate moment', 'Just you and me'],
  },
  {
    id: 'act_cuddle',
    title: 'CUDDLE',
    subtitle: 'Warm blankets and pure comfort.',
    iconType: 'CUDDLE',
    emoji: '🫂',
    isIntimate: true,
    requiredRelationship: ['LOVER'],
    tags: ['Cozy reset', 'No words needed'],
  },
  {
    id: 'act_custom_default',
    title: 'CUSTOM ACTIVITY',
    subtitle: 'Create your own moment.',
    iconType: 'CUSTOM',
    emoji: '✨',
    isCustom: true,
    tags: ['Tap to customize', 'Your choice'],
  },
];

const CUSTOM_ACTIVITIES_KEY = 'breaktym_custom_activities';

export const activityService = {
  /**
   * Retrieves all activities available for a specific contact, strictly
   * applying relationship privacy and consent rules.
   */
  getActivitiesForContact(relationship?: RelationshipType | null): BreakActivity[] {
    const custom = this.getCustomActivities();
    const all = [...BASE_ACTIVITIES, ...custom];

    return all.filter((activity) => {
      // Intimate activities strictly require mutual LOVER relationship
      if (activity.isIntimate) {
        return relationship === 'LOVER';
      }
      if (activity.requiredRelationship && relationship) {
        return activity.requiredRelationship.includes(relationship);
      }
      return true;
    });
  },

  /**
   * Returns user-created custom activities from storage
   */
  getCustomActivities(): BreakActivity[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(CUSTOM_ACTIVITIES_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  /**
   * Saves a new custom activity
   */
  addCustomActivity(title: string, subtitle: string, tags: string[]): BreakActivity {
    const newAct: BreakActivity = {
      id: `custom_${Date.now()}`,
      title: title.toUpperCase().trim(),
      subtitle: subtitle.trim(),
      iconType: 'CUSTOM',
      emoji: '✨',
      isCustom: true,
      tags: tags.length > 0 ? tags : ['Custom moment', 'Just the two of us'],
    };

    const current = this.getCustomActivities();
    localStorage.setItem(CUSTOM_ACTIVITIES_KEY, JSON.stringify([...current, newAct]));
    return newAct;
  },

  /**
   * Updates an existing custom activity
   */
  updateCustomActivity(id: string, title: string, subtitle: string, tags: string[]): boolean {
    const current = this.getCustomActivities();
    const index = current.findIndex((a) => a.id === id);
    if (index === -1) return false;

    current[index] = {
      ...current[index],
      title: title.toUpperCase().trim(),
      subtitle: subtitle.trim(),
      tags: tags.length > 0 ? tags : ['Custom moment', 'Just the two of us'],
    };

    localStorage.setItem(CUSTOM_ACTIVITIES_KEY, JSON.stringify(current));
    return true;
  },

  /**
   * Deletes a custom activity
   */
  deleteCustomActivity(id: string): boolean {
    const current = this.getCustomActivities();
    const filtered = current.filter((a) => a.id !== id);
    if (filtered.length === current.length) return false;

    localStorage.setItem(CUSTOM_ACTIVITIES_KEY, JSON.stringify(filtered));
    return true;
  },
};
