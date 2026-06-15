export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      access_grants: {
        Row: {
          book_id: string
          created_at: string
          id: string
          notes: string | null
          order_id: string | null
          revoked_at: string | null
          source: Database["public"]["Enums"]["access_source"]
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          revoked_at?: string | null
          source?: Database["public"]["Enums"]["access_source"]
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          revoked_at?: string | null
          source?: Database["public"]["Enums"]["access_source"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_grants_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_grants_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_grants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_email: string | null
          admin_id: string | null
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_emails: {
        Row: {
          added_at: string
          added_by: string | null
          email: string
          notes: string | null
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          email: string
          notes?: string | null
        }
        Update: {
          added_at?: string
          added_by?: string | null
          email?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_emails_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      book_audio_tracks: {
        Row: {
          book_id: string
          bucket: string
          created_at: string
          id: string
          sort_order: number
          storage_key: string
          title: string
        }
        Insert: {
          book_id: string
          bucket?: string
          created_at?: string
          id?: string
          sort_order?: number
          storage_key: string
          title: string
        }
        Update: {
          book_id?: string
          bucket?: string
          created_at?: string
          id?: string
          sort_order?: number
          storage_key?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_audio_tracks_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      book_reviews: {
        Row: {
          body: string
          book_id: string
          created_at: string
          id: string
          moderated_at: string | null
          moderated_by: string | null
          moderator_notes: string | null
          rating: number
          reviewer_name: string
          status: Database["public"]["Enums"]["moderation_status"]
          title: string | null
          user_id: string | null
        }
        Insert: {
          body: string
          book_id: string
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderator_notes?: string | null
          rating: number
          reviewer_name: string
          status?: Database["public"]["Enums"]["moderation_status"]
          title?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string
          book_id?: string
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderator_notes?: string | null
          rating?: number
          reviewer_name?: string
          status?: Database["public"]["Enums"]["moderation_status"]
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_reviews_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_reviews_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      book_samples: {
        Row: {
          book_id: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["sample_kind"]
          sort_order: number
          storage_key: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["sample_kind"]
          sort_order?: number
          storage_key: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["sample_kind"]
          sort_order?: number
          storage_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_samples_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          audio_r2_key: string | null
          author: string | null
          breadth_cm: number
          compare_at_price_paise: number | null
          cost_paise: number
          cover_image_url: string | null
          created_at: string
          curriculum: Database["public"]["Enums"]["curriculum"]
          deleted_at: string | null
          description: string | null
          description_hindi: string | null
          discount_eligible: boolean
          gst_class: Database["public"]["Enums"]["gst_class"]
          has_answer_key: boolean
          has_audio: boolean
          height_cm: number
          hsn_sac: string
          id: string
          inventory_count: number
          is_active: boolean
          isbn: string | null
          length_cm: number
          pdf_r2_key: string | null
          price_paise: number
          publisher: string | null
          slug: string
          subject: string | null
          subtitle: string | null
          subtitle_hindi: string | null
          title: string
          title_hindi: string | null
          updated_at: string
          weight_grams: number
        }
        Insert: {
          audio_r2_key?: string | null
          author?: string | null
          breadth_cm?: number
          compare_at_price_paise?: number | null
          cost_paise?: number
          cover_image_url?: string | null
          created_at?: string
          curriculum: Database["public"]["Enums"]["curriculum"]
          deleted_at?: string | null
          description?: string | null
          description_hindi?: string | null
          discount_eligible?: boolean
          gst_class?: Database["public"]["Enums"]["gst_class"]
          has_answer_key?: boolean
          has_audio?: boolean
          height_cm?: number
          hsn_sac?: string
          id?: string
          inventory_count?: number
          is_active?: boolean
          isbn?: string | null
          length_cm?: number
          pdf_r2_key?: string | null
          price_paise: number
          publisher?: string | null
          slug: string
          subject?: string | null
          subtitle?: string | null
          subtitle_hindi?: string | null
          title: string
          title_hindi?: string | null
          updated_at?: string
          weight_grams?: number
        }
        Update: {
          audio_r2_key?: string | null
          author?: string | null
          breadth_cm?: number
          compare_at_price_paise?: number | null
          cost_paise?: number
          cover_image_url?: string | null
          created_at?: string
          curriculum?: Database["public"]["Enums"]["curriculum"]
          deleted_at?: string | null
          description?: string | null
          description_hindi?: string | null
          discount_eligible?: boolean
          gst_class?: Database["public"]["Enums"]["gst_class"]
          has_answer_key?: boolean
          has_audio?: boolean
          height_cm?: number
          hsn_sac?: string
          id?: string
          inventory_count?: number
          is_active?: boolean
          isbn?: string | null
          length_cm?: number
          pdf_r2_key?: string | null
          price_paise?: number
          publisher?: string | null
          slug?: string
          subject?: string | null
          subtitle?: string | null
          subtitle_hindi?: string | null
          title?: string
          title_hindi?: string | null
          updated_at?: string
          weight_grams?: number
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          book_id: string
          cart_id: string
          created_at: string
          id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          book_id: string
          cart_id: string
          created_at?: string
          id?: string
          quantity: number
          updated_at?: string
        }
        Update: {
          book_id?: string
          cart_id?: string
          created_at?: string
          id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          anonymous_session_id: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          anonymous_session_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          anonymous_session_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      content_submissions: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["submission_kind"]
          media: Json
          moderated_at: string | null
          moderated_by: string | null
          moderator_notes: string | null
          status: Database["public"]["Enums"]["moderation_status"]
          submitter_email: string
          submitter_name: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["submission_kind"]
          media?: Json
          moderated_at?: string | null
          moderated_by?: string | null
          moderator_notes?: string | null
          status?: Database["public"]["Enums"]["moderation_status"]
          submitter_email: string
          submitter_name: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["submission_kind"]
          media?: Json
          moderated_at?: string | null
          moderated_by?: string | null
          moderator_notes?: string | null
          status?: Database["public"]["Enums"]["moderation_status"]
          submitter_email?: string
          submitter_name?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_submissions_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          discount_paise: number
          id: string
          order_id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          discount_paise: number
          id?: string
          order_id: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          discount_paise?: number
          id?: string
          order_id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          book_id: string | null
          code: string
          created_at: string
          created_by: string | null
          discount_percent: number
          excludes_amazon: boolean
          expires_at: string | null
          id: string
          max_uses: number | null
          multi_use_per_user: boolean
          notes: string | null
          type: Database["public"]["Enums"]["coupon_type"]
          uses_count: number
        }
        Insert: {
          book_id?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          discount_percent: number
          excludes_amazon?: boolean
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          multi_use_per_user?: boolean
          notes?: string | null
          type: Database["public"]["Enums"]["coupon_type"]
          uses_count?: number
        }
        Update: {
          book_id?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          discount_percent?: number
          excludes_amazon?: boolean
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          multi_use_per_user?: boolean
          notes?: string | null
          type?: Database["public"]["Enums"]["coupon_type"]
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          body: string
          book_id: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["feedback_kind"]
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          submitter_email: string | null
          submitter_name: string | null
          user_id: string | null
        }
        Insert: {
          body: string
          book_id?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["feedback_kind"]
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          submitter_email?: string | null
          submitter_name?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string
          book_id?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["feedback_kind"]
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          submitter_email?: string | null
          submitter_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          book_id: string
          created_at: string
          final_price_paise: number
          id: string
          order_id: string
          quantity: number
          unit_price_paise: number
        }
        Insert: {
          book_id: string
          created_at?: string
          final_price_paise?: number
          id?: string
          order_id: string
          quantity: number
          unit_price_paise: number
        }
        Update: {
          book_id?: string
          created_at?: string
          final_price_paise?: number
          id?: string
          order_id?: string
          quantity?: number
          unit_price_paise?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          access_granted_at: string | null
          admin_notes: string | null
          confirmation_email_sent_at: string | null
          coupon_code: string | null
          courier_name: string | null
          created_at: string
          delivered_at: string | null
          delivered_email_sent_at: string | null
          discount_paise: number
          id: string
          inventory_decremented_at: string | null
          inventory_restocked_at: string | null
          invoice_generated_at: string | null
          invoice_number: string | null
          non_refundable_fee_paise: number | null
          notes: string | null
          on_hold_at: string | null
          order_number: string
          packed_at: string | null
          paid_at: string | null
          preferred_courier_id: number | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          refund_email_sent_at: string | null
          refunded_at: string | null
          refunded_paise: number
          shipped_at: string | null
          shipped_email_sent_at: string | null
          shipping_address: Json | null
          shipping_paise: number
          shipping_pincode: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal_paise: number
          tax_paise: number
          total_paise: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_granted_at?: string | null
          admin_notes?: string | null
          confirmation_email_sent_at?: string | null
          coupon_code?: string | null
          courier_name?: string | null
          created_at?: string
          delivered_at?: string | null
          delivered_email_sent_at?: string | null
          discount_paise?: number
          id?: string
          inventory_decremented_at?: string | null
          inventory_restocked_at?: string | null
          invoice_generated_at?: string | null
          invoice_number?: string | null
          non_refundable_fee_paise?: number | null
          notes?: string | null
          on_hold_at?: string | null
          order_number: string
          packed_at?: string | null
          paid_at?: string | null
          preferred_courier_id?: number | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          refund_email_sent_at?: string | null
          refunded_at?: string | null
          refunded_paise?: number
          shipped_at?: string | null
          shipped_email_sent_at?: string | null
          shipping_address?: Json | null
          shipping_paise?: number
          shipping_pincode?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_paise: number
          tax_paise?: number
          total_paise: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_granted_at?: string | null
          admin_notes?: string | null
          confirmation_email_sent_at?: string | null
          coupon_code?: string | null
          courier_name?: string | null
          created_at?: string
          delivered_at?: string | null
          delivered_email_sent_at?: string | null
          discount_paise?: number
          id?: string
          inventory_decremented_at?: string | null
          inventory_restocked_at?: string | null
          invoice_generated_at?: string | null
          invoice_number?: string | null
          non_refundable_fee_paise?: number | null
          notes?: string | null
          on_hold_at?: string | null
          order_number?: string
          packed_at?: string | null
          paid_at?: string | null
          preferred_courier_id?: number | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          refund_email_sent_at?: string | null
          refunded_at?: string | null
          refunded_paise?: number
          shipped_at?: string | null
          shipped_email_sent_at?: string | null
          shipping_address?: Json | null
          shipping_paise?: number
          shipping_pincode?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_paise?: number
          tax_paise?: number
          total_paise?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_notifications: {
        Row: {
          book_id: string
          created_at: string
          email: string
          id: string
          notified_at: string | null
          user_id: string | null
        }
        Insert: {
          book_id: string
          created_at?: string
          email: string
          id?: string
          notified_at?: string | null
          user_id?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string
          email?: string
          id?: string
          notified_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_notifications_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          default_shipping_address: Json | null
          email: string
          email_verified_at: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_shipping_address?: Json | null
          email: string
          email_verified_at?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_shipping_address?: Json | null
          email?: string
          email_verified_at?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_inventory: {
        Args: { p_order_id: string }
        Returns: {
          ok: boolean
          reason: string
        }[]
      }
      get_storage_usage: {
        Args: never
        Returns: {
          bucket: string
          object_count: number
          total_bytes: number
        }[]
      }
      grant_access_manual: {
        Args: { p_book_id: string; p_email: string; p_notes?: string }
        Returns: {
          book_id: string
          created_at: string
          id: string
          notes: string | null
          order_id: string | null
          revoked_at: string | null
          source: Database["public"]["Enums"]["access_source"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "access_grants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      grant_digital_access: {
        Args: { p_order_id: string }
        Returns: {
          ok: boolean
          reason: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      next_invoice_number: { Args: never; Returns: string }
      preview_coupon: {
        Args: {
          p_code: string
          p_eligible_subtotal_paise: number
          p_user_id: string
        }
        Returns: {
          discount_paise: number
          reason: string
          valid: boolean
        }[]
      }
      redeem_coupon: {
        Args: {
          p_code: string
          p_eligible_subtotal_paise: number
          p_order_id: string
          p_user_id: string
        }
        Returns: {
          discount_paise: number
          reason: string
          success: boolean
        }[]
      }
      release_refund: {
        Args: { p_amount_paise: number; p_order_id: string }
        Returns: undefined
      }
      reserve_refund: {
        Args: { p_amount_paise: number; p_order_id: string }
        Returns: {
          ok: boolean
          reason: string
          refunded_paise: number
        }[]
      }
      restock_book: {
        Args: { p_book_id: string; p_new_count: number; p_reason?: string }
        Returns: {
          audio_r2_key: string | null
          author: string | null
          breadth_cm: number
          compare_at_price_paise: number | null
          cost_paise: number
          cover_image_url: string | null
          created_at: string
          curriculum: Database["public"]["Enums"]["curriculum"]
          deleted_at: string | null
          description: string | null
          description_hindi: string | null
          discount_eligible: boolean
          gst_class: Database["public"]["Enums"]["gst_class"]
          has_answer_key: boolean
          has_audio: boolean
          height_cm: number
          hsn_sac: string
          id: string
          inventory_count: number
          is_active: boolean
          isbn: string | null
          length_cm: number
          pdf_r2_key: string | null
          price_paise: number
          publisher: string | null
          slug: string
          subject: string | null
          subtitle: string | null
          subtitle_hindi: string | null
          title: string
          title_hindi: string | null
          updated_at: string
          weight_grams: number
        }
        SetofOptions: {
          from: "*"
          to: "books"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      restock_inventory: {
        Args: { p_order_id: string }
        Returns: {
          ok: boolean
          reason: string
        }[]
      }
      revoke_access: { Args: { p_grant_id: string }; Returns: undefined }
      set_order_tracking: {
        Args: {
          p_courier_name: string
          p_order_id: string
          p_tracking_number: string
          p_tracking_url?: string
        }
        Returns: {
          access_granted_at: string | null
          admin_notes: string | null
          confirmation_email_sent_at: string | null
          coupon_code: string | null
          courier_name: string | null
          created_at: string
          delivered_at: string | null
          delivered_email_sent_at: string | null
          discount_paise: number
          id: string
          inventory_decremented_at: string | null
          inventory_restocked_at: string | null
          invoice_generated_at: string | null
          invoice_number: string | null
          non_refundable_fee_paise: number | null
          notes: string | null
          on_hold_at: string | null
          order_number: string
          packed_at: string | null
          paid_at: string | null
          preferred_courier_id: number | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          refund_email_sent_at: string | null
          refunded_at: string | null
          refunded_paise: number
          shipped_at: string | null
          shipped_email_sent_at: string | null
          shipping_address: Json | null
          shipping_paise: number
          shipping_pincode: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal_paise: number
          tax_paise: number
          total_paise: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_order_status: {
        Args: {
          p_new_status: Database["public"]["Enums"]["order_status"]
          p_notes?: string
          p_order_id: string
        }
        Returns: {
          access_granted_at: string | null
          admin_notes: string | null
          confirmation_email_sent_at: string | null
          coupon_code: string | null
          courier_name: string | null
          created_at: string
          delivered_at: string | null
          delivered_email_sent_at: string | null
          discount_paise: number
          id: string
          inventory_decremented_at: string | null
          inventory_restocked_at: string | null
          invoice_generated_at: string | null
          invoice_number: string | null
          non_refundable_fee_paise: number | null
          notes: string | null
          on_hold_at: string | null
          order_number: string
          packed_at: string | null
          paid_at: string | null
          preferred_courier_id: number | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          refund_email_sent_at: string | null
          refunded_at: string | null
          refunded_paise: number
          shipped_at: string | null
          shipped_email_sent_at: string | null
          shipping_address: Json | null
          shipping_paise: number
          shipping_pincode: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal_paise: number
          tax_paise: number
          total_paise: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      access_source: "order" | "amazon" | "manual" | "refund_revoked"
      coupon_type: "global" | "single_use"
      curriculum: "ibdp" | "igcse" | "other"
      feedback_kind:
        | "bug"
        | "feature_request"
        | "content_request"
        | "praise"
        | "other"
      gst_class: "exempt" | "gst_0" | "gst_5" | "gst_12" | "gst_18"
      moderation_status: "pending" | "approved" | "rejected"
      order_status:
        | "pending_payment"
        | "paid"
        | "packed"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
        | "on_hold"
        | "partially_refunded"
      sample_kind: "pdf" | "image" | "audio"
      submission_kind: "poem" | "story" | "drama" | "essay" | "other"
      user_role: "customer" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      access_source: ["order", "amazon", "manual", "refund_revoked"],
      coupon_type: ["global", "single_use"],
      curriculum: ["ibdp", "igcse", "other"],
      feedback_kind: [
        "bug",
        "feature_request",
        "content_request",
        "praise",
        "other",
      ],
      gst_class: ["exempt", "gst_0", "gst_5", "gst_12", "gst_18"],
      moderation_status: ["pending", "approved", "rejected"],
      order_status: [
        "pending_payment",
        "paid",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
        "on_hold",
        "partially_refunded",
      ],
      sample_kind: ["pdf", "image", "audio"],
      submission_kind: ["poem", "story", "drama", "essay", "other"],
      user_role: ["customer", "admin"],
    },
  },
} as const

