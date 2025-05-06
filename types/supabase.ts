export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      hospitals: {
        Row: {
          id: string
          name: string
          address: string
          code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          code: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          code?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          hospital_id: string | null
          last_login: string | null
          expertise: string | null
          is_verified: boolean
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          phone?: string | null
          hospital_id?: string | null
          last_login?: string | null
          expertise?: string | null
          is_verified?: boolean
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string | null
          hospital_id?: string | null
          last_login?: string | null
          expertise?: string | null
          is_verified?: boolean
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      diagnoses: {
        Row: {
          id: string
          title: string
          doctor_notes: string | null
          doctor_assessment: string | null
          ai_analysis_results: Json | null
          image_links: string[] | null
          user_id: string
          hospital_id: string
          patient_id: string
          patient_metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          doctor_notes?: string | null
          doctor_assessment?: string | null
          ai_analysis_results?: Json | null
          image_links?: string[] | null
          user_id: string
          hospital_id: string
          patient_id: string
          patient_metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          doctor_notes?: string | null
          doctor_assessment?: string | null
          ai_analysis_results?: Json | null
          image_links?: string[] | null
          user_id?: string
          hospital_id?: string
          patient_id?: string
          patient_metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      failed_login_attempts: {
        Row: {
          id: string
          email: string
          ip_address: string | null
          attempt_time: string
        }
        Insert: {
          id?: string
          email: string
          ip_address?: string | null
          attempt_time?: string
        }
        Update: {
          id?: string
          email?: string
          ip_address?: string | null
          attempt_time?: string
        }
      }
      support_tickets: {
        Row: {
          id: string
          user_id: string | null
          subject: string
          message: string
          status: string
          priority: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          subject: string
          message: string
          status?: string
          priority?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          subject?: string
          message?: string
          status?: string
          priority?: string
          created_at?: string
          updated_at?: string
        }
      }
      clinical_reports: {
        Row: {
          id: string
          title: string
          content: Json
          report_type: string
          patient_id: string | null
          diagnosis_id: string | null
          created_by: string
          hospital_id: string
          status: string
          is_template: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: Json
          report_type: string
          patient_id?: string | null
          diagnosis_id?: string | null
          created_by: string
          hospital_id: string
          status?: string
          is_template?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: Json
          report_type?: string
          patient_id?: string | null
          diagnosis_id?: string | null
          created_by?: string
          hospital_id?: string
          status?: string
          is_template?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      report_shares: {
        Row: {
          id: string
          report_id: string
          shared_by: string
          shared_with: string
          can_edit: boolean
          created_at: string
          viewed_at: string | null
        }
        Insert: {
          id?: string
          report_id: string
          shared_by: string
          shared_with: string
          can_edit?: boolean
          created_at?: string
          viewed_at?: string | null
        }
        Update: {
          id?: string
          report_id?: string
          shared_by?: string
          shared_with?: string
          can_edit?: boolean
          created_at?: string
          viewed_at?: string | null
        }
      }
      report_comments: {
        Row: {
          id: string
          report_id: string
          user_id: string
          comment: string
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          user_id: string
          comment: string
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          user_id?: string
          comment?: string
          created_at?: string
        }
      }
      patient_visits: {
        Row: {
          id: string
          patient_id: string
          hospital_id: string
          user_id: string
          visit_date: string
          reason: string
          notes: Json | null
          vitals: Json | null
          medications: Json[] | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          hospital_id: string
          user_id: string
          visit_date: string
          reason: string
          notes?: Json | null
          vitals?: Json | null
          medications?: Json[] | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          hospital_id?: string
          user_id?: string
          visit_date?: string
          reason?: string
          notes?: Json | null
          vitals?: Json | null
          medications?: Json[] | null
          created_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          name: string
          hospital_id: string
          patient_info: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          hospital_id: string
          patient_info?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          hospital_id?: string
          patient_info?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      patient_notes: {
        Row: {
          id: string
          patient_id: string
          visit_id: string | null
          hospital_id: string
          created_at: string
          note_type: string
          content: Json
        }
        Insert: {
          id?: string
          patient_id: string
          visit_id?: string | null
          hospital_id: string
          created_at?: string
          note_type: string
          content: Json
        }
        Update: {
          id?: string
          patient_id?: string
          visit_id?: string | null
          hospital_id?: string
          created_at?: string
          note_type?: string
          content?: Json
        }
      }
    }
  }
}
