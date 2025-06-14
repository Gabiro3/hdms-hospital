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
          role: string | null
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
          role?: string | null
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
          role?: string | null
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
      lab_results: {
        Row: {
          id: string
          patient_id: string
          hospital_id: string
          created_by: string
          title: string
          result_type: string
          status: string
          results: Json
          file_links: string[] | null
          request_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          hospital_id: string
          created_by: string
          title: string
          result_type: string
          status?: string
          results: Json
          file_links?: string[] | null
          request_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          hospital_id?: string
          created_by?: string
          title?: string
          result_type?: string
          status?: string
          results?: Json
          file_links?: string[] | null
          request_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lab_requests: {
        Row: {
          id: string
          patient_id: string
          hospital_id: string
          requested_by: string
          assigned_to: string | null
          test_type: string
          priority: string
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          hospital_id: string
          requested_by: string
          assigned_to?: string | null
          test_type: string
          priority?: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          hospital_id?: string
          requested_by?: string
          assigned_to?: string | null
          test_type?: string
          priority?: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lab_result_shares: {
        Row: {
          id: string
          result_id: string
          shared_by: string
          shared_with: string
          created_at: string
          viewed_at: string | null
        }
        Insert: {
          id?: string
          result_id: string
          shared_by: string
          shared_with: string
          created_at?: string
          viewed_at?: string | null
        }
        Update: {
          id?: string
          result_id?: string
          shared_by?: string
          shared_with?: string
          created_at?: string
          viewed_at?: string | null
        }
      }
      radiology_studies: {
        Row: {
          id: string
          patient_id: string
          patient_name: string | null
          accession_number: string | null
          study_description: string
          study_date: string
          modality: string
          referring_physician: string | null
          clinical_information: string | null
          image_urls: string[] | null
          image_count: number | null
          report: Json | null
          report_status: string | null
          created_by: string
          hospital_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          patient_name?: string | null
          accession_number?: string | null
          study_description: string
          study_date: string
          modality: string
          referring_physician?: string | null
          clinical_information?: string | null
          image_urls?: string[] | null
          image_count?: number | null
          report?: Json | null
          report_status?: string | null
          created_by: string
          hospital_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          patient_name?: string | null
          accession_number?: string | null
          study_description?: string
          study_date?: string
          modality?: string
          referring_physician?: string | null
          clinical_information?: string | null
          image_urls?: string[] | null
          image_count?: number | null
          report?: Json | null
          report_status?: string | null
          created_by?: string
          hospital_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      radiology_study_shares: {
        Row: {
          id: string
          study_id: string
          shared_by: string
          shared_with: string
          can_edit: boolean
          message: string | null
          created_at: string
          viewed_at: string | null
        }
        Insert: {
          id?: string
          study_id: string
          shared_by: string
          shared_with: string
          can_edit?: boolean
          message?: string | null
          created_at?: string
          viewed_at?: string | null
        }
        Update: {
          id?: string
          study_id?: string
          shared_by?: string
          shared_with?: string
          can_edit?: boolean
          message?: string | null
          created_at?: string
          viewed_at?: string | null
        }
      }
      radiology_annotations: {
        Row: {
          id: string
          study_id: string
          image_index: number
          annotation_type: string
          coordinates: Json
          metadata: Json | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          study_id: string
          image_index: number
          annotation_type: string
          coordinates: Json
          metadata?: Json | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          study_id?: string
          image_index?: number
          annotation_type?: string
          coordinates?: Json
          metadata?: Json | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      radiology_requests: {
        Row: {
          id: string
          patient_id: string
          patient_name: string | null
          hospital_id: string
          requested_by: string
          assigned_to: string | null
          study_type: string
          clinical_details: string
          priority: string
          status: string
          scheduled_date: string | null
          rejection_reason: string | null
          additional_notes: string | null
          study_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          patient_name?: string | null
          hospital_id: string
          requested_by: string
          assigned_to?: string | null
          study_type: string
          clinical_details: string
          priority?: string
          status?: string
          scheduled_date?: string | null
          rejection_reason?: string | null
          additional_notes?: string | null
          study_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          patient_name?: string | null
          hospital_id?: string
          requested_by?: string
          assigned_to?: string | null
          study_type?: string
          clinical_details?: string
          priority?: string
          status?: string
          scheduled_date?: string | null
          rejection_reason?: string | null
          additional_notes?: string | null
          study_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      insurers: {
        Row: {
          id: string
          name: string
          contact_phone: string
          address: string | null
          email: string | null
          website: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_phone: string
          address?: string | null
          email?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_phone?: string
          address?: string | null
          email?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      insurance_policies: {
        Row: {
          id: string
          patient_id: string
          insurer_id: string
          policy_number: string
          start_date: string
          end_date: string | null
          coverage_details: Json | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          insurer_id: string
          policy_number: string
          start_date: string
          end_date?: string | null
          coverage_details?: Json | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          insurer_id?: string
          policy_number?: string
          start_date?: string
          end_date?: string | null
          coverage_details?: Json | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      insurance_claims: {
        Row: {
          id: string
          policy_id: string
          diagnosis_id: string | null
          visit_id: string | null
          lab_result_id: string | null
          radiology_study_id: string | null
          claim_amount: number
          approved_amount: number | null
          status: string
          submitted_date: string
          processed_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          policy_id: string
          diagnosis_id?: string | null
          visit_id?: string | null
          lab_result_id?: string | null
          radiology_study_id?: string | null
          claim_amount: number
          approved_amount?: number | null
          status?: string
          submitted_date: string
          processed_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          policy_id?: string
          diagnosis_id?: string | null
          visit_id?: string | null
          lab_result_id?: string | null
          radiology_study_id?: string | null
          claim_amount?: number
          approved_amount?: number | null
          status?: string
          submitted_date?: string
          processed_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
