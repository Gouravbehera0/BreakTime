import { RelationshipType } from './contact';

export type ActivityIconType =
  | 'EVENING_CHAI'
  | 'NIGHT_RIDE'
  | 'SHOPPING'
  | 'WALKING'
  | 'FOOD'
  | 'MOVIE_NIGHT'
  | 'GAMING'
  | 'SMOKING_BREAK'
  | 'DRINKING'
  | 'KISS'
  | 'CUDDLE'
  | 'CUSTOM';

export interface BreakActivity {
  id: string;
  title: string;
  subtitle: string;
  iconType: ActivityIconType;
  emoji: string;
  isIntimate?: boolean;
  requiredRelationship?: RelationshipType[];
  isCustom?: boolean;
  tags: string[];
}
