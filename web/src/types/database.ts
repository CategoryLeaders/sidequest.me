export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string
          logo: string | null
          logo_text: string | null
          brand_colour: string | null
          type: string
          sub_line: string | null
          role_title: string | null
          role_dates: string | null
          tags: Json
          blurb_left: Json | null
          blurb_right: Json | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slug: string
          logo?: string | null
          logo_text?: string | null
          brand_colour?: string | null
          type: string
          sub_line?: string | null
          role_title?: string | null
          role_dates?: string | null
          tags?: Json
          blurb_left?: Json | null
          blurb_right?: Json | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          slug?: string
          logo?: string | null
          logo_text?: string | null
          brand_colour?: string | null
          type?: string
          sub_line?: string | null
          role_title?: string | null
          role_dates?: string | null
          tags?: Json
          blurb_left?: Json | null
          blurb_right?: Json | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_roles: {
        Row: {
          id: string
          company_id: string
          role: string
          dates: string | null
          discipline: string | null
          track: number | null
          year: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          role: string
          dates?: string | null
          discipline?: string | null
          track?: number | null
          year?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          role?: string
          dates?: string | null
          discipline?: string | null
          track?: number | null
          year?: string | null
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      ideas: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          id: string
          published: boolean | null
          tags: string[] | null
          text: string | null
          title: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          published?: boolean | null
          tags?: string[] | null
          text?: string | null
          title?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          published?: boolean | null
          tags?: string[] | null
          text?: string | null
          title?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          caption: string | null
          created_at: string | null
          date: string | null
          id: string
          image_urls: string[]
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          image_urls?: string[]
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          image_urls?: string[]
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          slug: string
          url: string | null
          description: string | null
          status: string
          status_color: string | null
          stack: string[]
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          slug: string
          url?: string | null
          description?: string | null
          status?: string
          status_color?: string | null
          stack?: string[]
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          slug?: string
          url?: string | null
          description?: string | null
          status?: string
          status_color?: string | null
          stack?: string[]
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          about_bio: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          dislikes: Json | null
          display_name: string | null
          factoids: Json | null
          id: string
          likes: Json | null
          linkedin_url: string | null
          professional_name: string | null
          site_tags: Json | null
          site_tags_display: Json | null
          ticker_enabled: boolean
          ticker_items: string[] | null
          updated_at: string
          username: string
        }
        Insert: {
          about_bio?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          dislikes?: Json | null
          display_name?: string | null
          factoids?: Json | null
          id: string
          likes?: Json | null
          linkedin_url?: string | null
          professional_name?: string | null
          site_tags?: Json | null
          site_tags_display?: Json | null
          ticker_enabled?: boolean
          ticker_items?: string[] | null
          updated_at?: string
          username: string
        }
        Update: {
          about_bio?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          dislikes?: Json | null
          display_name?: string | null
          factoids?: Json | null
          id?: string
          likes?: Json | null
          linkedin_url?: string | null
          professional_name?: string | null
          site_tags?: Json | null
          site_tags_display?: Json | null
          ticker_enabled?: boolean
          ticker_items?: string[] | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      writing_links: {
        Row: {
          id: string
          writing_id: string
          entity_type: string
          entity_id: string
          created_at: string
        }
        Insert: {
          id?: string
          writing_id: string
          entity_type: string
          entity_id: string
          created_at?: string
        }
        Update: {
          id?: string
          writing_id?: string
          entity_type?: string
          entity_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "writing_links_writing_id_fkey"
            columns: ["writing_id"]
            isOneToOne: false
            referencedRelation: "writings"
            referencedColumns: ["id"]
          }
        ]
      }
      writings: {
        Row: {
          id: string
          user_id: string
          title: string
          slug: string
          body: Json | null
          body_html: string | null
          tags: string[] | null
          status: string
          published_at: string | null
          scheduled_at: string | null
          word_count: number | null
          canonical_url: string | null
          in_series_nav: boolean | null
          series_id: string | null
          series_position: number | null
          created_at: string | null
          updated_at: string | null
          fts: string | null
          external_url: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          slug: string
          body?: Json | null
          body_html?: string | null
          tags?: string[] | null
          status?: string
          published_at?: string | null
          scheduled_at?: string | null
          word_count?: number | null
          canonical_url?: string | null
          in_series_nav?: boolean | null
          series_id?: string | null
          series_position?: number | null
          created_at?: string | null
          updated_at?: string | null
          external_url?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          slug?: string
          body?: Json | null
          body_html?: string | null
          tags?: string[] | null
          status?: string
          published_at?: string | null
          scheduled_at?: string | null
          word_count?: number | null
          canonical_url?: string | null
          in_series_nav?: boolean | null
          series_id?: string | null
          series_position?: number | null
          created_at?: string | null
          updated_at?: string | null
          external_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof Database
}
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
