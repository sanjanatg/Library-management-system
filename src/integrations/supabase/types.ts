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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      AUTHOR: {
        Row: {
          Author_ID: number
          Author_Name: string
        }
        Insert: {
          Author_ID?: number
          Author_Name: string
        }
        Update: {
          Author_ID?: number
          Author_Name?: string
        }
        Relationships: []
      }
      BOOK: {
        Row: {
          Author_ID: number | null
          Available_Copies: number
          Book_ID: number
          Publisher: string | null
          Title: string
          Year_of_Publication: number | null
        }
        Insert: {
          Author_ID?: number | null
          Available_Copies: number
          Book_ID: number
          Publisher?: string | null
          Title: string
          Year_of_Publication?: number | null
        }
        Update: {
          Author_ID?: number | null
          Available_Copies?: number
          Book_ID?: number
          Publisher?: string | null
          Title?: string
          Year_of_Publication?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "BOOK_Author_ID_fkey"
            columns: ["Author_ID"]
            isOneToOne: false
            referencedRelation: "AUTHOR"
            referencedColumns: ["Author_ID"]
          },
        ]
      }
      DEPARTMENT: {
        Row: {
          Department_ID: string
          Dept_Name: string | null
        }
        Insert: {
          Department_ID: string
          Dept_Name?: string | null
        }
        Update: {
          Department_ID?: string
          Dept_Name?: string | null
        }
        Relationships: []
      }
      FINE: {
        Row: {
          Amount: number
          Date_Calculated: string
          Fine_ID: number
          Issue_ID: number
          Status: string
        }
        Insert: {
          Amount: number
          Date_Calculated: string
          Fine_ID: number
          Issue_ID: number
          Status: string
        }
        Update: {
          Amount?: number
          Date_Calculated?: string
          Fine_ID?: number
          Issue_ID?: number
          Status?: string
        }
        Relationships: [
          {
            foreignKeyName: "FINE_Issue_ID_fkey"
            columns: ["Issue_ID"]
            isOneToOne: false
            referencedRelation: "ISSUE"
            referencedColumns: ["Issue_ID"]
          },
        ]
      }
      ISSUE: {
        Row: {
          Book_ID: number | null
          Due_Date: string | null
          Issue_Date: string
          Issue_ID: number
          Librarian_ID: number | null
          Renewal_Count: number
          Return_Date: string | null
          Student_ID: string | null
        }
        Insert: {
          Book_ID?: number | null
          Due_Date?: string | null
          Issue_Date: string
          Issue_ID: number
          Librarian_ID?: number | null
          Renewal_Count: number
          Return_Date?: string | null
          Student_ID?: string | null
        }
        Update: {
          Book_ID?: number | null
          Due_Date?: string | null
          Issue_Date?: string
          Issue_ID?: number
          Librarian_ID?: number | null
          Renewal_Count?: number
          Return_Date?: string | null
          Student_ID?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ISSUE_Book_ID_fkey"
            columns: ["Book_ID"]
            isOneToOne: false
            referencedRelation: "BOOK"
            referencedColumns: ["Book_ID"]
          },
          {
            foreignKeyName: "ISSUE_Librarian_ID_fkey"
            columns: ["Librarian_ID"]
            isOneToOne: false
            referencedRelation: "LIBRARIAN"
            referencedColumns: ["Librarian_ID"]
          },
          {
            foreignKeyName: "ISSUE_Student_ID_fkey"
            columns: ["Student_ID"]
            isOneToOne: false
            referencedRelation: "STUDENT"
            referencedColumns: ["student_id"]
          },
        ]
      }
      LIBRARIAN: {
        Row: {
          Email: string
          Librarian_ID: number
          Name: string | null
          Password: string | null
          Role: string | null
        }
        Insert: {
          Email: string
          Librarian_ID?: number
          Name?: string | null
          Password?: string | null
          Role?: string | null
        }
        Update: {
          Email?: string
          Librarian_ID?: number
          Name?: string | null
          Password?: string | null
          Role?: string | null
        }
        Relationships: []
      }
      STUDENT: {
        Row: {
          contact: string
          dept_id: string | null
          email: string
          name: string
          student_id: string
          year: number
        }
        Insert: {
          contact: string
          dept_id?: string | null
          email: string
          name: string
          student_id: string
          year: number
        }
        Update: {
          contact?: string
          dept_id?: string | null
          email?: string
          name?: string
          student_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "STUDENT_dept_id_fkey"
            columns: ["dept_id"]
            isOneToOne: false
            referencedRelation: "DEPARTMENT"
            referencedColumns: ["Department_ID"]
          },
        ]
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
    Enums: {},
  },
} as const
