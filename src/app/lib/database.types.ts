// Hand-written to match supabase/migrations/*.sql until a real Supabase
// project exists to generate against. Once you can run:
//   supabase gen types typescript --local > src/app/lib/database.types.ts
// replace this file wholesale — the shape (Database/Json exports) matches
// the CLI's output format so nothing else needs to change.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string;
          name: string;
          email_domain: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email_domain: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email_domain?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          school_id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          rating: number;
          completed_transactions: number;
          created_at: string;
        };
        Insert: {
          id: string;
          school_id: string;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          rating?: number;
          completed_transactions?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          rating?: number;
          completed_transactions?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      listings: {
        Row: {
          id: string;
          school_id: string;
          seller_id: string;
          title: string;
          description: string;
          price: number;
          category: Database["public"]["Enums"]["item_category"];
          condition: Database["public"]["Enums"]["item_condition"];
          image_url: string | null;
          status: Database["public"]["Enums"]["listing_status"];
          views_count: number;
          likes_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          seller_id: string;
          title: string;
          description: string;
          price: number;
          category: Database["public"]["Enums"]["item_category"];
          condition: Database["public"]["Enums"]["item_condition"];
          image_url?: string | null;
          status?: Database["public"]["Enums"]["listing_status"];
          views_count?: number;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          seller_id?: string;
          title?: string;
          description?: string;
          price?: number;
          category?: Database["public"]["Enums"]["item_category"];
          condition?: Database["public"]["Enums"]["item_condition"];
          image_url?: string | null;
          status?: Database["public"]["Enums"]["listing_status"];
          views_count?: number;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listings_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listings_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_items: {
        Row: {
          user_id: string;
          listing_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          listing_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          listing_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_items_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          listing_id: string;
          sender_id: string;
          recipient_id: string;
          body: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          sender_id: string;
          recipient_id: string;
          body: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          sender_id?: string;
          recipient_id?: string;
          body?: string;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          id: string;
          listing_id: string;
          reporter_id: string;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          reporter_id: string;
          reason: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          reporter_id?: string;
          reason?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          status: Database["public"]["Enums"]["order_status"];
          meetup_location: string | null;
          meetup_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          status?: Database["public"]["Enums"]["order_status"];
          meetup_location?: string | null;
          meetup_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          buyer_id?: string;
          seller_id?: string;
          status?: Database["public"]["Enums"]["order_status"];
          meetup_location?: string | null;
          meetup_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_school_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      increment_listing_views: {
        Args: { listing_id_input: string };
        Returns: undefined;
      };
    };
    Enums: {
      item_category: "Textbooks" | "Uniforms" | "Electronics" | "Stationery" | "Sports Equipment" | "Other";
      item_condition: "New" | "Like New" | "Good" | "Fair";
      listing_status: "available" | "sold" | "removed";
      order_status: "pending" | "confirmed" | "completed" | "cancelled";
    };
    CompositeTypes: Record<string, never>;
  };
};
