// أنواع قاعدة البيانات — مكتوبة يدوياً، يجب أن تطابق supabase/migrations/*.sql.
// يُفضّل استبدالها لاحقاً بمخرجات `supabase gen types` بعد نضوج المشروع:
//   npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts
//
// تُحدَّث يدوياً مع كل هجرة جديدة (نفس اتفاقية DealzTree ERP).

export type ScopeType = "none" | "restaurant" | "branch";
export type Locale = "ar" | "en";

export interface Database {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string;
          key: string;
          scope_type: ScopeType;
          is_system: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          scope_type: ScopeType;
          is_system?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["roles"]["Insert"]>;
        Relationships: [];
      };
      role_capabilities: {
        Row: { role_id: string; capability_key: string };
        Insert: { role_id: string; capability_key: string };
        Update: Partial<Database["public"]["Tables"]["role_capabilities"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          restaurant_id: string | null;
          branch_id: string | null;
          role_id: string | null;
          locale: Locale;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          restaurant_id?: string | null;
          branch_id?: string | null;
          role_id?: string | null;
          locale?: Locale;
          full_name?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      restaurants: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string;
          logo_url: string | null;
          about_ar: string | null;
          about_en: string | null;
          hero_image_url: string | null;
          settings: Record<string, unknown>;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name_ar: string;
          name_en: string;
          logo_url?: string | null;
          about_ar?: string | null;
          about_en?: string | null;
          hero_image_url?: string | null;
          settings?: Record<string, unknown>;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["restaurants"]["Insert"]>;
        Relationships: [];
      };
      branches: {
        Row: {
          id: string;
          restaurant_id: string;
          name_ar: string;
          name_en: string;
          address_ar: string | null;
          address_en: string | null;
          phone: string | null;
          google_reviews_url: string | null;
          google_maps_url: string | null;
          timezone: string;
          slug: string;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name_ar: string;
          name_en: string;
          address_ar?: string | null;
          address_en?: string | null;
          phone?: string | null;
          google_reviews_url?: string | null;
          google_maps_url?: string | null;
          timezone?: string;
          slug: string;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["branches"]["Insert"]>;
        Relationships: [];
      };
      tables: {
        Row: {
          id: string;
          branch_id: string;
          label_ar: string;
          label_en: string;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          branch_id: string;
          label_ar: string;
          label_en: string;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["tables"]["Insert"]>;
        Relationships: [];
      };
      table_qr_codes: {
        Row: {
          id: string;
          table_id: string;
          branch_id: string;
          qr_token: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          table_id: string;
          branch_id: string;
          qr_token?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["table_qr_codes"]["Insert"]>;
        Relationships: [];
      };
      menus: {
        Row: {
          id: string;
          branch_id: string;
          name_ar: string;
          name_en: string;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          branch_id: string;
          name_ar: string;
          name_en: string;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["menus"]["Insert"]>;
        Relationships: [];
      };
      menu_schedules: {
        Row: {
          id: string;
          menu_id: string;
          branch_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          menu_id: string;
          branch_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["menu_schedules"]["Insert"]>;
        Relationships: [];
      };
      menu_categories: {
        Row: {
          id: string;
          branch_id: string;
          menu_id: string;
          name_ar: string;
          name_en: string;
          sort_order: number;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          branch_id: string;
          menu_id: string;
          name_ar: string;
          name_en: string;
          sort_order?: number;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["menu_categories"]["Insert"]>;
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          branch_id: string;
          name_ar: string;
          name_en: string;
          description_ar: string | null;
          description_en: string | null;
          price: number;
          calories: number | null;
          image_url: string | null;
          is_available: boolean;
          is_visible: boolean;
          is_splittable: boolean;
          sort_order: number;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          branch_id: string;
          name_ar: string;
          name_en: string;
          description_ar?: string | null;
          description_en?: string | null;
          price: number;
          calories?: number | null;
          image_url?: string | null;
          is_available?: boolean;
          is_visible?: boolean;
          is_splittable?: boolean;
          sort_order?: number;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["menu_items"]["Insert"]>;
        Relationships: [];
      };
      menu_category_items: {
        Row: { category_id: string; item_id: string; branch_id: string; sort_order: number };
        Insert: { category_id: string; item_id: string; branch_id: string; sort_order?: number };
        Update: Partial<Database["public"]["Tables"]["menu_category_items"]["Insert"]>;
        Relationships: [];
      };
      item_variants: {
        Row: {
          id: string;
          item_id: string;
          branch_id: string;
          name_ar: string;
          name_en: string;
          price: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          branch_id: string;
          name_ar: string;
          name_en: string;
          price: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["item_variants"]["Insert"]>;
        Relationships: [];
      };
      option_groups: {
        Row: {
          id: string;
          item_id: string;
          branch_id: string;
          name_ar: string;
          name_en: string;
          is_required: boolean;
          min_select: number;
          max_select: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          branch_id: string;
          name_ar: string;
          name_en: string;
          is_required?: boolean;
          min_select?: number;
          max_select?: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["option_groups"]["Insert"]>;
        Relationships: [];
      };
      option_values: {
        Row: {
          id: string;
          option_group_id: string;
          branch_id: string;
          name_ar: string;
          name_en: string;
          price_delta: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          option_group_id: string;
          branch_id: string;
          name_ar: string;
          name_en: string;
          price_delta?: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["option_values"]["Insert"]>;
        Relationships: [];
      };
      allergens: {
        Row: { id: string; name_ar: string; name_en: string; icon_url: string | null; created_at: string };
        Insert: { id?: string; name_ar: string; name_en: string; icon_url?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["allergens"]["Insert"]>;
        Relationships: [];
      };
      item_allergens: {
        Row: { item_id: string; allergen_id: string; branch_id: string };
        Insert: { item_id: string; allergen_id: string; branch_id: string };
        Update: Partial<Database["public"]["Tables"]["item_allergens"]["Insert"]>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          branch_id: string;
          name: string;
          phone: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          name: string;
          phone: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [];
      };
      reservations: {
        Row: {
          id: string;
          branch_id: string;
          table_id: string | null;
          customer_id: string;
          party_size: number;
          reservation_time: string;
          source: "website" | "phone" | "walk_in";
          status: "pending" | "confirmed" | "cancelled";
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          table_id?: string | null;
          customer_id: string;
          party_size: number;
          reservation_time: string;
          source?: "website" | "phone" | "walk_in";
          status?: "pending" | "confirmed" | "cancelled";
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reservations"]["Insert"]>;
        Relationships: [];
      };
      event_reservations: {
        Row: {
          id: string;
          branch_id: string;
          reservation_type: "event" | "corporate";
          company_name: string | null;
          contact_name: string;
          contact_phone: string;
          guest_count: number;
          event_date: string;
          status: "pending" | "confirmed" | "rejected";
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          reservation_type: "event" | "corporate";
          company_name?: string | null;
          contact_name: string;
          contact_phone: string;
          guest_count: number;
          event_date: string;
          status?: "pending" | "confirmed" | "rejected";
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["event_reservations"]["Insert"]>;
        Relationships: [];
      };
      inquiries: {
        Row: {
          id: string;
          branch_id: string;
          name: string;
          phone: string;
          email: string | null;
          subject: string | null;
          message: string;
          status: "new" | "read" | "resolved";
          created_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          name: string;
          phone: string;
          email?: string | null;
          subject?: string | null;
          message: string;
          status?: "new" | "read" | "resolved";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inquiries"]["Insert"]>;
        Relationships: [];
      };
      complaints: {
        Row: {
          id: string;
          branch_id: string;
          table_id: string | null;
          type: "complaint" | "suggestion";
          message: string;
          customer_name: string | null;
          customer_phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          table_id?: string | null;
          type: "complaint" | "suggestion";
          message: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["complaints"]["Insert"]>;
        Relationships: [];
      };
      branch_ratings: {
        Row: {
          id: string;
          branch_id: string;
          table_id: string | null;
          stars: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          table_id?: string | null;
          stars: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["branch_ratings"]["Insert"]>;
        Relationships: [];
      };
      reservation_preorder_items: {
        Row: {
          id: string;
          branch_id: string;
          reservation_id: string;
          menu_item_id: string;
          item_variant_id: string | null;
          second_menu_item_id: string | null;
          second_item_variant_id: string | null;
          quantity: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          reservation_id: string;
          menu_item_id: string;
          item_variant_id?: string | null;
          second_menu_item_id?: string | null;
          second_item_variant_id?: string | null;
          quantity?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reservation_preorder_items"]["Insert"]>;
        Relationships: [];
      };
      qr_scan_events: {
        Row: {
          id: string;
          branch_id: string;
          table_id: string;
          qr_code_id: string;
          scanned_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          table_id: string;
          qr_code_id: string;
          scanned_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["qr_scan_events"]["Insert"]>;
        Relationships: [];
      };
      menu_item_view_events: {
        Row: {
          id: string;
          branch_id: string;
          menu_item_id: string;
          table_id: string | null;
          source: "qr" | "tablet" | "site";
          created_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          menu_item_id: string;
          table_id?: string | null;
          source: "qr" | "tablet" | "site";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["menu_item_view_events"]["Insert"]>;
        Relationships: [];
      };
      loyalty_settings: {
        Row: {
          restaurant_id: string;
          points_per_currency_unit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          restaurant_id: string;
          points_per_currency_unit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["loyalty_settings"]["Insert"]>;
        Relationships: [];
      };
      loyalty_tiers: {
        Row: {
          id: string;
          restaurant_id: string;
          name_ar: string;
          name_en: string;
          min_points: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name_ar: string;
          name_en: string;
          min_points?: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["loyalty_tiers"]["Insert"]>;
        Relationships: [];
      };
      loyalty_rewards: {
        Row: {
          id: string;
          restaurant_id: string;
          name_ar: string;
          name_en: string;
          points_cost: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name_ar: string;
          name_en: string;
          points_cost: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["loyalty_rewards"]["Insert"]>;
        Relationships: [];
      };
      loyalty_members: {
        Row: {
          id: string;
          restaurant_id: string;
          phone: string;
          auth_user_id: string | null;
          points_balance: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          phone: string;
          auth_user_id?: string | null;
          points_balance?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["loyalty_members"]["Insert"]>;
        Relationships: [];
      };
      loyalty_receipt_submissions: {
        Row: {
          id: string;
          restaurant_id: string;
          branch_id: string;
          member_id: string;
          receipt_image_path: string;
          extracted_amount: number | null;
          invoice_number: string | null;
          points_awarded: number;
          status: "pending_ocr" | "approved" | "rejected";
          ocr_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          branch_id: string;
          member_id: string;
          receipt_image_path: string;
          extracted_amount?: number | null;
          invoice_number?: string | null;
          points_awarded?: number;
          status?: "pending_ocr" | "approved" | "rejected";
          ocr_note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["loyalty_receipt_submissions"]["Insert"]>;
        Relationships: [];
      };
      loyalty_redemptions: {
        Row: {
          id: string;
          restaurant_id: string;
          member_id: string;
          reward_id: string;
          points_spent: number;
          status: "pending" | "fulfilled" | "cancelled";
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          member_id: string;
          reward_id: string;
          points_spent: number;
          status?: "pending" | "fulfilled" | "cancelled";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["loyalty_redemptions"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      auth_branch_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      has_capability: {
        Args: { capability: string };
        Returns: boolean;
      };
      bootstrap_restaurant: {
        Args: { p_name_ar: string; p_name_en: string };
        Returns: string;
      };
      set_my_locale: {
        Args: { p_locale: string };
        Returns: undefined;
      };
      toggle_item_availability: {
        Args: { p_item_id: string };
        Returns: boolean;
      };
      get_table_reservation: {
        Args: { p_branch_slug: string; p_qr_token: string };
        Returns: {
          customer_name: string;
          customer_phone: string;
          party_size: number;
          reservation_time: string;
          notes: string | null;
        }[];
      };
      create_public_reservation: {
        Args: {
          p_branch_id: string;
          p_customer_name: string;
          p_customer_phone: string;
          p_party_size: number;
          p_reservation_time: string;
          p_notes: string | null;
        };
        Returns: undefined;
      };
      auth_restaurant_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      join_loyalty_member: {
        Args: { p_restaurant_id: string };
        Returns: string;
      };
      submit_loyalty_receipt: {
        Args: {
          p_member_id: string;
          p_branch_id: string;
          p_receipt_image_path: string;
          p_extracted_amount: number | null;
          p_invoice_number: string | null;
          p_ocr_note: string | null;
        };
        Returns: {
          submission_id: string;
          points_awarded: number;
          status: "approved" | "rejected";
          ocr_note: string | null;
        }[];
      };
      redeem_loyalty_reward: {
        Args: { p_reward_id: string };
        Returns: string;
      };
      redeem_loyalty_reward_for_member: {
        Args: { p_member_id: string; p_reward_id: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
