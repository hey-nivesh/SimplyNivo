export type PreferredTone = 'simplest' | 'executive' | 'empathetic';

export type UserProfile = {
  id: string;
  display_name: string | null;
  preferred_tone: PreferredTone;
  created_at?: string;
  updated_at?: string;
};

export type ConversationRecord = {
  id: string;
  user_id: string;
  original_situation: string;
  simplified_phrasing: string;
  category: string;
  created_at: string;
};

export type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile;
        Insert: {
          id: string;
          display_name?: string | null;
          preferred_tone?: PreferredTone;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          preferred_tone?: PreferredTone;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      conversations: {
        Row: ConversationRecord;
        Insert: {
          id?: string;
          user_id: string;
          original_situation: string;
          simplified_phrasing: string;
          category: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          original_situation?: string;
          simplified_phrasing?: string;
          category?: string;
          created_at?: string;
        };
        Relationships: GenericRelationship[];
      };
    };
    Views: Record<string, {
      Row: Record<string, unknown>;
      Relationships: GenericRelationship[];
    }>;
    Functions: Record<string, {
      Args: Record<string, unknown>;
      Returns: unknown;
    }>;
  };
};
