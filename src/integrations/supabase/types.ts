export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
      cdc_config: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          include_old_data: boolean | null
          operations: string[] | null
          table_name: string
          updated_at: string | null
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          include_old_data?: boolean | null
          operations?: string[] | null
          table_name: string
          updated_at?: string | null
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          include_old_data?: boolean | null
          operations?: string[] | null
          table_name?: string
          updated_at?: string | null
          webhook_url?: string
        }
        Relationships: []
      }
      cdc_events: {
        Row: {
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          operation: string
          record_id: string | null
          request_id: number | null
          table_name: string
          webhook_response: string | null
          webhook_status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          record_id?: string | null
          request_id?: number | null
          table_name: string
          webhook_response?: string | null
          webhook_status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          record_id?: string | null
          request_id?: number | null
          table_name?: string
          webhook_response?: string | null
          webhook_status?: string | null
        }
        Relationships: []
      }
      cms_posts: {
        Row: {
          author_id: string | null
          body_text: string
          content_url: string | null
          created_at: string
          id: string
          is_active: boolean
          is_announcement: boolean
          media_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body_text: string
          content_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_announcement?: boolean
          media_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body_text?: string
          content_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_announcement?: boolean
          media_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      global_settings: {
        Row: {
          borrower_cost_rate: number
          founding_alpha_end_date: string | null
          hero_video_type: string | null
          hero_video_url: string | null
          id: string
          lending_yield_rate: number
          maintenance_mode: boolean
          qr_gateway_url: string | null
          receiver_name: string | null
          receiver_phone: string | null
          referral_level1_rate: number
          smtp_from_email: string | null
          smtp_from_name: string | null
          smtp_host: string | null
          smtp_port: number | null
          smtp_user: string | null
          system_kill_switch: boolean
          updated_at: string
          updated_by: string | null
          vault_interest_rate: number
        }
        Insert: {
          borrower_cost_rate?: number
          founding_alpha_end_date?: string | null
          hero_video_type?: string | null
          hero_video_url?: string | null
          id?: string
          lending_yield_rate?: number
          maintenance_mode?: boolean
          qr_gateway_url?: string | null
          receiver_name?: string | null
          receiver_phone?: string | null
          referral_level1_rate?: number
          smtp_from_email?: string | null
          smtp_from_name?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          system_kill_switch?: boolean
          updated_at?: string
          updated_by?: string | null
          vault_interest_rate?: number
        }
        Update: {
          borrower_cost_rate?: number
          founding_alpha_end_date?: string | null
          hero_video_type?: string | null
          hero_video_url?: string | null
          id?: string
          lending_yield_rate?: number
          maintenance_mode?: boolean
          qr_gateway_url?: string | null
          receiver_name?: string | null
          receiver_phone?: string | null
          referral_level1_rate?: number
          smtp_from_email?: string | null
          smtp_from_name?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          system_kill_switch?: boolean
          updated_at?: string
          updated_by?: string | null
          vault_interest_rate?: number
        }
        Relationships: []
      }
      interest_history: {
        Row: {
          created_at: string
          id: string
          interest_amount: number
          interest_rate: number
          new_balance: number
          previous_balance: number
          reference_number: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interest_amount: number
          interest_rate: number
          new_balance: number
          previous_balance: number
          reference_number: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interest_amount?: number
          interest_rate?: number
          new_balance?: number
          previous_balance?: number
          reference_number?: string
          user_id?: string
        }
        Relationships: []
      }
      ledger: {
        Row: {
          amount: number
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          cleared_at: string | null
          clearing_ends_at: string | null
          created_at: string
          description: string | null
          destination: string | null
          id: string
          metadata: Json | null
          reference_number: string
          rejection_reason: string | null
          related_loan_id: string | null
          related_user_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          cleared_at?: string | null
          clearing_ends_at?: string | null
          created_at?: string
          description?: string | null
          destination?: string | null
          id?: string
          metadata?: Json | null
          reference_number: string
          rejection_reason?: string | null
          related_loan_id?: string | null
          related_user_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          cleared_at?: string | null
          clearing_ends_at?: string | null
          created_at?: string
          description?: string | null
          destination?: string | null
          id?: string
          metadata?: Json | null
          reference_number?: string
          rejection_reason?: string | null
          related_loan_id?: string | null
          related_user_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      p2p_loans: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          auto_repay_triggered: boolean
          borrower_id: string
          capital_lock_days: number
          capital_unlock_date: string | null
          collateral_amount: number
          created_at: string
          due_date: string | null
          duration_days: number
          funded_at: string | null
          id: string
          interest_rate: number
          lender_id: string | null
          principal_amount: number
          reference_number: string
          rejection_reason: string | null
          repaid_at: string | null
          status: Database["public"]["Enums"]["loan_status"]
          updated_at: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          auto_repay_triggered?: boolean
          borrower_id: string
          capital_lock_days?: number
          capital_unlock_date?: string | null
          collateral_amount: number
          created_at?: string
          due_date?: string | null
          duration_days?: number
          funded_at?: string | null
          id?: string
          interest_rate: number
          lender_id?: string | null
          principal_amount: number
          reference_number: string
          rejection_reason?: string | null
          repaid_at?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          updated_at?: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          auto_repay_triggered?: boolean
          borrower_id?: string
          capital_lock_days?: number
          capital_unlock_date?: string | null
          collateral_amount?: number
          created_at?: string
          due_date?: string | null
          duration_days?: number
          funded_at?: string | null
          id?: string
          interest_rate?: number
          lender_id?: string | null
          principal_amount?: number
          reference_number?: string
          rejection_reason?: string | null
          repaid_at?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          display_name: string | null
          email: string | null
          frozen_balance: number
          id: string
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          last_login_at: string | null
          lending_balance: number
          member_id: string
          membership_tier: Database["public"]["Enums"]["membership_tier"]
          onboarding_completed: boolean
          phone: string | null
          postal_code: string | null
          province: string | null
          referral_code: string | null
          referrer_id: string | null
          total_referral_earnings: number
          updated_at: string
          vault_balance: number
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          frozen_balance?: number
          id: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          last_login_at?: string | null
          lending_balance?: number
          member_id: string
          membership_tier?: Database["public"]["Enums"]["membership_tier"]
          onboarding_completed?: boolean
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          referral_code?: string | null
          referrer_id?: string | null
          total_referral_earnings?: number
          updated_at?: string
          vault_balance?: number
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          frozen_balance?: number
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          last_login_at?: string | null
          lending_balance?: number
          member_id?: string
          membership_tier?: Database["public"]["Enums"]["membership_tier"]
          onboarding_completed?: boolean
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          referral_code?: string | null
          referrer_id?: string | null
          total_referral_earnings?: number
          updated_at?: string
          vault_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles_user_view"
            referencedColumns: ["id"]
          },
        ]
      }
      public_config: {
        Row: {
          hero_video_type: string | null
          hero_video_url: string | null
          id: string
          lending_yield_rate: number
          qr_gateway_url: string | null
          receiver_name: string | null
          receiver_phone: string | null
          updated_at: string
          vault_interest_rate: number
        }
        Insert: {
          hero_video_type?: string | null
          hero_video_url?: string | null
          id?: string
          lending_yield_rate?: number
          qr_gateway_url?: string | null
          receiver_name?: string | null
          receiver_phone?: string | null
          updated_at?: string
          vault_interest_rate?: number
        }
        Update: {
          hero_video_type?: string | null
          hero_video_url?: string | null
          id?: string
          lending_yield_rate?: number
          qr_gateway_url?: string | null
          receiver_name?: string | null
          receiver_phone?: string | null
          updated_at?: string
          vault_interest_rate?: number
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      reserve_fund: {
        Row: {
          fee_accumulation: number
          id: string
          total_payouts_made: number
          total_reserve_balance: number
          updated_at: string
        }
        Insert: {
          fee_accumulation?: number
          id?: string
          total_payouts_made?: number
          total_reserve_balance?: number
          updated_at?: string
        }
        Update: {
          fee_accumulation?: number
          id?: string
          total_payouts_made?: number
          total_reserve_balance?: number
          updated_at?: string
        }
        Relationships: []
      }
      security_credentials: {
        Row: {
          created_at: string
          security_answer_1: string | null
          security_answer_2: string | null
          security_question_1: string | null
          security_question_2: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          security_answer_1?: string | null
          security_answer_2?: string | null
          security_question_1?: string | null
          security_question_2?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          security_answer_1?: string | null
          security_answer_2?: string | null
          security_question_1?: string | null
          security_question_2?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      pending_actions_queue: {
        Row: {
          action_type: string | null
          amount: number | null
          approval_status: string | null
          collateral_amount: number | null
          created_at: string | null
          description: string | null
          id: string | null
          interest_rate: number | null
          member_id: string | null
          reference_number: string | null
          source_table: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: []
      }
      profiles_user_view: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          frozen_balance: number | null
          id: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"] | null
          last_login_at: string | null
          lending_balance: number | null
          member_id: string | null
          membership_tier: Database["public"]["Enums"]["membership_tier"] | null
          onboarding_completed: boolean | null
          phone: string | null
          postal_code: string | null
          province: string | null
          referral_code: string | null
          referrer_id: string | null
          total_referral_earnings: number | null
          updated_at: string | null
          vault_balance: number | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          frozen_balance?: number | null
          id?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          last_login_at?: string | null
          lending_balance?: number | null
          member_id?: string | null
          membership_tier?:
            | Database["public"]["Enums"]["membership_tier"]
            | null
          onboarding_completed?: boolean | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          referral_code?: string | null
          referrer_id?: string | null
          total_referral_earnings?: number | null
          updated_at?: string | null
          vault_balance?: number | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          frozen_balance?: number | null
          id?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          last_login_at?: string | null
          lending_balance?: number | null
          member_id?: string | null
          membership_tier?:
            | Database["public"]["Enums"]["membership_tier"]
            | null
          onboarding_completed?: boolean | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          referral_code?: string | null
          referrer_id?: string | null
          total_referral_earnings?: number | null
          updated_at?: string | null
          vault_balance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles_user_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      apply_daily_interest_atomic: { Args: never; Returns: Json }
      assign_user_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: Json
      }
      check_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
      cleanup_cdc_events: { Args: { p_days_old?: number }; Returns: number }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      disable_cdc_on_table: { Args: { p_table_name: string }; Returns: Json }
      enable_cdc_on_table: {
        Args: {
          p_include_old_data?: boolean
          p_operations?: string[]
          p_table_name: string
          p_webhook_url: string
        }
        Returns: Json
      }
      fund_loan_atomic: {
        Args: { p_lender_id: string; p_loan_id: string }
        Returns: Json
      }
      generate_member_id: { Args: never; Returns: string }
      generate_reference_number: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      get_cdc_stats: { Args: never; Returns: Json }
      get_pending_action_counts: { Args: never; Returns: Json }
      get_pending_actions: {
        Args: never
        Returns: {
          action_type: string
          amount: number
          approval_status: string
          collateral_amount: number
          created_at: string
          description: string
          id: string
          interest_rate: number
          member_id: string
          reference_number: string
          source_table: string
          user_id: string
          user_name: string
        }[]
      }
      get_profiles_for_admin: {
        Args: never
        Returns: {
          address_line1: string
          address_line2: string
          city: string
          created_at: string
          display_name: string
          email: string
          frozen_balance: number
          id: string
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          last_login_at: string
          lending_balance: number
          member_id: string
          membership_tier: Database["public"]["Enums"]["membership_tier"]
          onboarding_completed: boolean
          phone: string
          postal_code: string
          province: string
          referral_code: string
          referrer_id: string
          security_question_1: string
          security_question_2: string
          total_referral_earnings: number
          updated_at: string
          user_roles: Database["public"]["Enums"]["app_role"][]
          vault_balance: number
        }[]
      }
      get_security_questions: {
        Args: { p_user_id: string }
        Returns: {
          question_1: string
          question_2: string
        }[]
      }
      governor_approve_action: {
        Args: {
          p_action_id: string
          p_action_type: string
          p_approve: boolean
          p_governor_id: string
          p_rejection_reason?: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      initiate_account_recovery: { Args: { p_email: string }; Returns: Json }
      lend_capital_atomic: {
        Args: { p_amount: number; p_user_id: string }
        Returns: Json
      }
      log_profile_access: {
        Args: { p_access_reason?: string; p_accessed_profile_id: string }
        Returns: undefined
      }
      process_repayment_atomic: {
        Args: { p_borrower_id: string; p_loan_id: string }
        Returns: Json
      }
      process_transfer_atomic: {
        Args: {
          p_amount: number
          p_destination: string
          p_destination_type: string
          p_recipient_member_id?: string
          p_user_id: string
        }
        Returns: Json
      }
      release_clearing_atomic: { Args: never; Returns: Json }
      request_loan_atomic: {
        Args: { p_amount: number; p_user_id: string }
        Returns: Json
      }
      revoke_user_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: Json
      }
      set_security_credentials: {
        Args: {
          p_answer_1: string
          p_answer_2: string
          p_question_1: string
          p_question_2: string
          p_user_id: string
        }
        Returns: boolean
      }
      verify_recovery_answers: {
        Args: { p_answer_1: string; p_answer_2: string; p_user_id: string }
        Returns: Json
      }
      verify_security_answer: {
        Args: { p_answer: string; p_question_num: number; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "member" | "admin" | "governor"
      kyc_status: "pending" | "verified" | "rejected"
      loan_status: "open" | "funded" | "repaid" | "defaulted"
      membership_tier: "bronze" | "silver" | "gold" | "founding"
      transaction_status: "clearing" | "completed" | "reversed"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "transfer_out"
        | "transfer_in"
        | "lending_profit"
        | "vault_interest"
        | "loan_funding"
        | "loan_repayment"
        | "collateral_lock"
        | "collateral_release"
        | "referral_commission"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["member", "admin", "governor"],
      kyc_status: ["pending", "verified", "rejected"],
      loan_status: ["open", "funded", "repaid", "defaulted"],
      membership_tier: ["bronze", "silver", "gold", "founding"],
      transaction_status: ["clearing", "completed", "reversed"],
      transaction_type: [
        "deposit",
        "withdrawal",
        "transfer_out",
        "transfer_in",
        "lending_profit",
        "vault_interest",
        "loan_funding",
        "loan_repayment",
        "collateral_lock",
        "collateral_release",
        "referral_commission",
      ],
    },
  },
} as const
