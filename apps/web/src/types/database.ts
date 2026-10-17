/**
 * Supabase Database TypeScript Definitions for BreakTym
 * Reflects tables, columns, relationships, constraints, and RPC functions in public schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';
export type InvitationStatus = 'pending' | 'sent' | 'accepted' | 'declined' | 'cancelled' | 'expired';
export type FriendshipStatus = 'none' | 'friends' | 'pending_sent' | 'pending_received' | 'self';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          username: string | null;
          phone_number: string | null;
          avatar_url: string | null;
          bio: string | null;
          qr_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          username?: string | null;
          phone_number?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          qr_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          username?: string | null;
          phone_number?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          qr_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      friend_requests: {
        Row: {
          id: string;
          sender_id?: string;
          requester_id?: string;
          recipient_id: string;
          status: FriendRequestStatus | 'rejected';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id?: string;
          requester_id?: string;
          recipient_id: string;
          status?: FriendRequestStatus | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          requester_id?: string;
          recipient_id?: string;
          status?: FriendRequestStatus | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'friend_requests_sender_id_fkey';
            columns: ['sender_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friend_requests_recipient_id_fkey';
            columns: ['recipient_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      friendships: {
        Row: {
          id: string;
          user_id?: string;
          friend_id?: string;
          user_id1?: string;
          user_id2?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          friend_id?: string;
          user_id1?: string;
          user_id2?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          friend_id?: string;
          user_id1?: string;
          user_id2?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'friendships_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friendships_friend_id_fkey';
            columns: ['friend_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      activity_invitations: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          activity_id: string;
          activity_title: string;
          custom_note: string | null;
          status: InvitationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          activity_id: string;
          activity_title: string;
          custom_note?: string | null;
          status?: InvitationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string;
          activity_id?: string;
          activity_title?: string;
          custom_note?: string | null;
          status?: InvitationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'activity_invitations_sender_id_fkey';
            columns: ['sender_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'activity_invitations_recipient_id_fkey';
            columns: ['recipient_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_phone_contacts: {
        Args: {
          phone_numbers: string[];
        };
        Returns: {
          user_id: string;
          phone_number: string;
          display_name: string;
          avatar_url: string | null;
          friendship_status: FriendshipStatus;
        }[];
      };
      check_username_available: {
        Args: {
          requested_username: string;
        };
        Returns: boolean;
      };
      search_profiles_by_username: {
        Args: {
          search_query: string;
          max_results?: number;
        };
        Returns: {
          user_id: string;
          display_name: string;
          username: string | null;
          avatar_url: string | null;
          bio: string | null;
          friendship_status: FriendshipStatus;
        }[];
      };
      search_profiles_by_user_id: {
        Args: {
          search_query: string;
          max_results?: number;
        };
        Returns: {
          user_id: string;
          display_name: string;
          username: string | null;
          avatar_url: string | null;
          bio: string | null;
          friendship_status: FriendshipStatus;
        }[];
      };
      send_friend_request: {
        Args: {
          target_user_id: string;
        };
        Returns: Json;
      };
      accept_friend_request: {
        Args: {
          target_sender_id: string;
        };
        Returns: Json;
      };
      respond_to_friend_request: {
        Args: {
          request_id: string;
          new_status: string;
        };
        Returns: Json;
      };
      cancel_friend_request: {
        Args: {
          request_id: string;
        };
        Returns: Json;
      };
      resolve_profile_by_qr_token: {
        Args: {
          token_input: string;
        };
        Returns: {
          user_id: string;
          display_name: string;
          username: string | null;
          avatar_url: string | null;
          bio: string | null;
          friendship_status: FriendshipStatus;
        }[];
      };
      regenerate_qr_token: {
        Args: Record<string, never>;
        Returns: string;
      };
      create_activity_invitation: {
        Args: {
          target_recipient_id: string;
          input_activity_id: string;
          input_activity_title: string;
          input_custom_note?: string | null;
        };
        Returns: Json;
      };
      get_user_invitations: {
        Args: {
          filter_mode?: string;
        };
        Returns: {
          id: string;
          sender_id: string;
          recipient_id: string;
          activity_id: string;
          activity_title: string;
          custom_note: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          expires_at: string | null;
          sender_display_name: string;
          sender_username: string | null;
          sender_avatar_url: string | null;
          recipient_display_name: string;
          recipient_username: string | null;
          recipient_avatar_url: string | null;
        }[];
      };
      respond_to_activity_invitation: {
        Args: {
          input_invitation_id: string;
          input_status: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type FriendRequestRow = Database['public']['Tables']['friend_requests']['Row'];
export type FriendshipRow = Database['public']['Tables']['friendships']['Row'];
export type ActivityInvitationRow = Database['public']['Tables']['activity_invitations']['Row'];
