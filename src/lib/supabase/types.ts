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
      books: {
        Row: {
          audio_r2_key: string | null
          author: string | null
          cover_image_url: string | null
          created_at: string
          curriculum: Database["public"]["Enums"]["curriculum"]
          description: string | null
          format: Database["public"]["Enums"]["book_format"]
          gst_class: Database["public"]["Enums"]["gst_class"]
          id: string
          inventory_count: number
          isbn: string | null
          pdf_r2_key: string | null
          price_paise: number
          published: boolean
          slug: string
          subject: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audio_r2_key?: string | null
          author?: string | null
          cover_image_url?: string | null
          created_at?: string
          curriculum: Database["public"]["Enums"]["curriculum"]
          description?: string | null
          format: Database["public"]["Enums"]["book_format"]
          gst_class?: Database["public"]["Enums"]["gst_class"]
          id?: string
          inventory_count?: number
          isbn?: string | null
          pdf_r2_key?: string | null
          price_paise: number
          published?: boolean
          slug: string
          subject?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audio_r2_key?: string | null
          author?: string | null
          cover_image_url?: string | null
          created_at?: string
          curriculum?: Database["public"]["Enums"]["curriculum"]
          description?: string | null
          format?: Database["public"]["Enums"]["book_format"]
          gst_class?: Database["public"]["Enums"]["gst_class"]
          id?: string
          inventory_count?: number
          isbn?: string | null
          pdf_r2_key?: string | null
          price_paise?: number
          published?: boolean
          slug?: string
          subject?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
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
      order_items: {
        Row: {
          book_id: string
          created_at: string
          format: Database["public"]["Enums"]["book_format"]
          id: string
          order_id: string
          quantity: number
          unit_price_paise: number
        }
        Insert: {
          book_id: string
          created_at?: string
          format: Database["public"]["Enums"]["book_format"]
          id?: string
          order_id: string
          quantity: number
          unit_price_paise: number
        }
        Update: {
          book_id?: string
          created_at?: string
          format?: Database["public"]["Enums"]["book_format"]
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
          created_at: string
          discount_paise: number
          id: string
          notes: string | null
          order_number: string
          packed_at: string | null
          paid_at: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          shipped_at: string | null
          shipping_address: Json | null
          shipping_paise: number
          shipping_pincode: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal_paise: number
          tax_paise: number
          total_paise: number
          tracking_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discount_paise?: number
          id?: string
          notes?: string | null
          order_number: string
          packed_at?: string | null
          paid_at?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_paise?: number
          shipping_pincode?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_paise: number
          tax_paise?: number
          total_paise: number
          tracking_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discount_paise?: number
          id?: string
          notes?: string | null
          order_number?: string
          packed_at?: string | null
          paid_at?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_paise?: number
          shipping_pincode?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_paise?: number
          tax_paise?: number
          total_paise?: number
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
      users: {
        Row: {
          created_at: string
          email: string
          email_verified_at: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          email_verified_at?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
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
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      book_format: "physical" | "digital" | "bundle"
      curriculum: "ibdp" | "igcse" | "other"
      gst_class: "exempt" | "gst_0" | "gst_5" | "gst_12" | "gst_18"
      order_status:
        | "pending_payment"
        | "paid"
        | "packed"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
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
      book_format: ["physical", "digital", "bundle"],
      curriculum: ["ibdp", "igcse", "other"],
      gst_class: ["exempt", "gst_0", "gst_5", "gst_12", "gst_18"],
      order_status: [
        "pending_payment",
        "paid",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      user_role: ["customer", "admin"],
    },
  },
} as const

