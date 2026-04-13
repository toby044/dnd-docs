export interface Database {
  public: {
    Tables: {
      pages: {
        Row: {
          id: string
          user_id: string
          parent_id: string | null
          title: string
          icon: string
          content: Record<string, unknown>
          sort_order: number
          is_section: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          parent_id?: string | null
          title?: string
          icon?: string
          content?: Record<string, unknown>
          sort_order?: number
          is_section?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          parent_id?: string | null
          title?: string
          icon?: string
          content?: Record<string, unknown>
          sort_order?: number
          is_section?: boolean
          deleted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Page = Database['public']['Tables']['pages']['Row']
export type PageInsert = Database['public']['Tables']['pages']['Insert']
export type PageUpdate = Database['public']['Tables']['pages']['Update']

export interface PageTreeNode extends Page {
  children: PageTreeNode[]
}
