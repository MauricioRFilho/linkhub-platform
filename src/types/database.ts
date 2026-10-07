/**
 * Supabase Database types — auto-generated structure matching Supabase v2 PostgREST schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Block types stored in `sections.type`. @see supabase/migrations/20261007120000_dynamic_blocks.sql */
export type SectionTypeValue =
  | "link" | "header" | "product" | "panel" | "coupon" | "community" | "video" | "text";
export type PanelLayoutValue = "list" | "grid" | "carousel" | "spotlight";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          bio: string | null;
          avatar_url: string | null;
          verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          bio?: string | null;
          avatar_url?: string | null;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          verified?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      socials: {
        Row: {
          id: string;
          profile_id: string;
          platform: string;
          url: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          profile_id: string;
          platform: string;
          url: string;
          sort_order?: number;
        };
        Update: {
          platform?: string;
          url?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      themes: {
        Row: {
          id: string;
          profile_id: string;
          accent_color: string;
          style: "dark" | "light";
          template: "classic" | "minimal" | "bold" | "neon" | "editorial";
          custom_css: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          accent_color?: string;
          style?: "dark" | "light";
          template?: "classic" | "minimal" | "bold" | "neon" | "editorial";
          custom_css?: string | null;
        };
        Update: {
          accent_color?: string;
          style?: "dark" | "light";
          template?: "classic" | "minimal" | "bold" | "neon" | "editorial";
          custom_css?: string | null;
        };
        Relationships: [];
      };
      sections: {
        Row: {
          id: string;
          profile_id: string;
          parent_id: string | null;
          type: SectionTypeValue;
          title: string;
          subtitle: string | null;
          url: string | null;
          emoji: string | null;
          thumbnail_url: string | null;
          store: string | null;
          layout: PanelLayoutValue | null;
          config: Json;
          starts_at: string | null;
          ends_at: string | null;
          sort_order: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          parent_id?: string | null;
          type: SectionTypeValue;
          title: string;
          subtitle?: string | null;
          url?: string | null;
          emoji?: string | null;
          thumbnail_url?: string | null;
          store?: string | null;
          layout?: PanelLayoutValue | null;
          config?: Json;
          starts_at?: string | null;
          ends_at?: string | null;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          parent_id?: string | null;
          type?: SectionTypeValue;
          title?: string;
          subtitle?: string | null;
          url?: string | null;
          emoji?: string | null;
          thumbnail_url?: string | null;
          store?: string | null;
          layout?: PanelLayoutValue | null;
          config?: Json;
          starts_at?: string | null;
          ends_at?: string | null;
          sort_order?: number;
          active?: boolean;
        };
        Relationships: [];
      };
      section_clicks: {
        Row: {
          id: number;
          section_id: string;
          profile_id: string;
          kind: "click" | "copy";
          referrer_host: string | null;
          device: "mobile" | "desktop" | "tablet" | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      meta: {
        Row: {
          id: string;
          profile_id: string;
          title: string | null;
          description: string | null;
          og_image_url: string | null;
          lang: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title?: string | null;
          description?: string | null;
          og_image_url?: string | null;
          lang?: string;
        };
        Update: {
          title?: string | null;
          description?: string | null;
          og_image_url?: string | null;
          lang?: string;
        };
        Relationships: [];
      };
      reserved_usernames: {
        Row: {
          username: string;
        };
        Insert: {
          username: string;
        };
        Update: {
          username?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      section_click_stats: {
        Row: {
          section_id: string;
          profile_id: string;
          kind: "click" | "copy";
          total: number;
          last_7d: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      track_click: {
        Args: { p_section: string; p_kind?: string; p_referrer?: string | null; p_device?: string | null };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/** Convenience type aliases */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Social = Database["public"]["Tables"]["socials"]["Row"];
export type Theme = Database["public"]["Tables"]["themes"]["Row"];
export type Section = Database["public"]["Tables"]["sections"]["Row"];
export type Meta = Database["public"]["Tables"]["meta"]["Row"];

export type SectionType = Section["type"];
export type PanelLayout = PanelLayoutValue;
export type ClickStat = Database["public"]["Views"]["section_click_stats"]["Row"];
export type ThemeStyle = Theme["style"];
export type ThemeTemplate = Theme["template"];
