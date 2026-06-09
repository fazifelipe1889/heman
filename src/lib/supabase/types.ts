/**
 * Tipos de la base de datos. Escritos a mano para reflejar las migraciones de
 * `supabase/migrations`. Las uniones de enums se importan del dominio para
 * mantener una única fuente de verdad.
 */

import type {
  ExperienceLevel,
  Goal,
  RoutineType,
  Sex,
  TrainingType,
  Units,
  WikiCategory,
  WorkoutStatus,
} from "@/lib/domain/enums"
import type {
  ProfileRole,
  CoachStatus,
  CoachingProgramStatus,
  CoachingCategory,
  CoachingLevel,
  ProductType,
  BillingType,
  RecurringInterval,
  SubscriptionStatus,
  MessageSenderRole,
  AttachmentType,
  PaymentStatus,
  PaymentProvider,
} from "@/lib/domain/coaching"

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
      exercises: {
        Row: {
          id: string
          name: string
          primary_muscle_group: string
          secondary_muscle_groups: string[]
          equipment: string
          movement_type: string
          difficulty: "Principiante" | "Intermedio" | "Avanzado"
          instructions: string
          video_url: string | null
          image_url: string | null
          tags: string[]
          created_by: string | null
          parent_exercise_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          primary_muscle_group: string
          secondary_muscle_groups?: string[]
          equipment: string
          movement_type: string
          difficulty: "Principiante" | "Intermedio" | "Avanzado"
          instructions?: string
          video_url?: string | null
          image_url?: string | null
          tags?: string[]
          created_by?: string | null
          parent_exercise_id?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["exercises"]["Insert"]>
        Relationships: []
      }
      body_reviews: {
        Row: {
          id: string
          user_id: string
          review_date: string
          weight_kg: number | null
          height_cm: number | null
          body_fat_pct: number | null
          muscle_mass_kg: number | null
          bone_mass_kg: number | null
          water_pct: number | null
          visceral_fat: number | null
          chest_cm: number | null
          waist_cm: number | null
          hips_cm: number | null
          abdomen_cm: number | null
          neck_cm: number | null
          shoulder_cm: number | null
          arm_left_cm: number | null
          arm_right_cm: number | null
          forearm_left_cm: number | null
          forearm_right_cm: number | null
          thigh_left_cm: number | null
          thigh_right_cm: number | null
          calf_left_cm: number | null
          calf_right_cm: number | null
          systolic_bp: number | null
          diastolic_bp: number | null
          resting_hr: number | null
          spo2: number | null
          sleep_hours: number | null
          energy_level: number | null
          stress_level: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          review_date?: string
          weight_kg?: number | null
          height_cm?: number | null
          body_fat_pct?: number | null
          muscle_mass_kg?: number | null
          bone_mass_kg?: number | null
          water_pct?: number | null
          visceral_fat?: number | null
          chest_cm?: number | null
          waist_cm?: number | null
          hips_cm?: number | null
          abdomen_cm?: number | null
          neck_cm?: number | null
          shoulder_cm?: number | null
          arm_left_cm?: number | null
          arm_right_cm?: number | null
          forearm_left_cm?: number | null
          forearm_right_cm?: number | null
          thigh_left_cm?: number | null
          thigh_right_cm?: number | null
          calf_left_cm?: number | null
          calf_right_cm?: number | null
          systolic_bp?: number | null
          diastolic_bp?: number | null
          resting_hr?: number | null
          spo2?: number | null
          sleep_hours?: number | null
          energy_level?: number | null
          stress_level?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["body_reviews"]["Insert"]>
        Relationships: []
      }
      quote_preferences: {
        Row: {
          user_id: string
          enabled: boolean
          categories: string[]
          updated_at: string
        }
        Insert: {
          user_id: string
          enabled?: boolean
          categories?: string[]
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["quote_preferences"]["Insert"]>
        Relationships: []
      }
      supplements: {
        Row: {
          id: string
          user_id: string
          name: string
          dose: string
          notes: string
          days_of_week: number[]
          times_of_day: string[]
          color: string
          is_active: boolean
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          dose?: string
          notes?: string
          days_of_week?: number[]
          times_of_day?: string[]
          color?: string
          is_active?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["supplements"]["Insert"]>
        Relationships: []
      }
      supplement_logs: {
        Row: {
          id: string
          user_id: string
          supplement_id: string
          log_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          supplement_id: string
          log_date: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["supplement_logs"]["Insert"]>
        Relationships: []
      }
      wiki_articles: {
        Row: {
          id: string
          slug: string
          title: string
          summary: string
          content: string
          category: WikiCategory
          tags: string[]
          cover_url: string | null
          read_time_min: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          summary: string
          content?: string
          category: WikiCategory
          tags?: string[]
          cover_url?: string | null
          read_time_min?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["wiki_articles"]["Insert"]>
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          birth_date: string | null
          sex: Sex | null
          height_cm: number | null
          weight_kg: number | null
          goal: Goal | null
          experience_level: ExperienceLevel | null
          training_days_per_week: number | null
          preferred_training_type: TrainingType | null
          units: Units
          onboarding_completed: boolean
          tour_completed_at: string | null
          role: ProfileRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          birth_date?: string | null
          sex?: Sex | null
          height_cm?: number | null
          weight_kg?: number | null
          goal?: Goal | null
          experience_level?: ExperienceLevel | null
          training_days_per_week?: number | null
          preferred_training_type?: TrainingType | null
          units?: Units
          onboarding_completed?: boolean
          tour_completed_at?: string | null
          role?: ProfileRole
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
        Relationships: []
      }
      routines: {
        Row: {
          id: string
          user_id: string
          type: RoutineType
          name: string
          description: string | null
          goal: Goal | null
          experience_level: ExperienceLevel | null
          is_favorite: boolean
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: RoutineType
          name: string
          description?: string | null
          goal?: Goal | null
          experience_level?: ExperienceLevel | null
          is_favorite?: boolean
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["routines"]["Insert"]>
        Relationships: []
      }
      routine_exercises: {
        Row: {
          id: string
          routine_id: string
          position: number
          exercise_name: string
          exercise_ref: string | null
          sets: number
          target_reps: string | null
          target_weight: number | null
          target_rir: number | null
          rest_seconds: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          routine_id: string
          position?: number
          exercise_name: string
          exercise_ref?: string | null
          sets?: number
          target_reps?: string | null
          target_weight?: number | null
          target_rir?: number | null
          rest_seconds?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: Partial<
          Database["public"]["Tables"]["routine_exercises"]["Insert"]
        >
        Relationships: []
      }
      routine_custom_config: {
        Row: {
          routine_id: string
          rounds: number
          notes: string | null
        }
        Insert: {
          routine_id: string
          rounds?: number
          notes?: string | null
        }
        Update: Partial<
          Database["public"]["Tables"]["routine_custom_config"]["Insert"]
        >
        Relationships: []
      }
      routine_interval_blocks: {
        Row: {
          id: string
          routine_id: string
          position: number
          name: string
          duration_seconds: number
          intensity: string | null
          created_at: string
        }
        Insert: {
          id?: string
          routine_id: string
          position?: number
          name: string
          duration_seconds: number
          intensity?: string | null
          created_at?: string
        }
        Update: Partial<
          Database["public"]["Tables"]["routine_interval_blocks"]["Insert"]
        >
        Relationships: []
      }
      routine_liss: {
        Row: {
          routine_id: string
          modality: string | null
          duration_min: number | null
          intensity: string | null
          incline: number | null
          speed: number | null
          distance_km: number | null
          target_calories: number | null
          weekly_frequency: number | null
        }
        Insert: {
          routine_id: string
          modality?: string | null
          duration_min?: number | null
          intensity?: string | null
          incline?: number | null
          speed?: number | null
          distance_km?: number | null
          target_calories?: number | null
          weekly_frequency?: number | null
        }
        Update: Partial<Database["public"]["Tables"]["routine_liss"]["Insert"]>
        Relationships: []
      }
      routine_hiit: {
        Row: {
          routine_id: string
          main_exercise: string | null
          rounds: number | null
          work_seconds: number | null
          rest_seconds: number | null
          intervals: number | null
          intensity: string | null
        }
        Insert: {
          routine_id: string
          main_exercise?: string | null
          rounds?: number | null
          work_seconds?: number | null
          rest_seconds?: number | null
          intervals?: number | null
          intensity?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["routine_hiit"]["Insert"]>
        Relationships: []
      }
      plans: {
        Row: {
          id: string
          user_id: string
          name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["plans"]["Insert"]>
        Relationships: []
      }
      plan_days: {
        Row: {
          id: string
          plan_id: string
          day_of_week: number
          routine_id: string | null
          position: number
        }
        Insert: {
          id?: string
          plan_id: string
          day_of_week: number
          routine_id?: string | null
          position?: number
        }
        Update: Partial<Database["public"]["Tables"]["plan_days"]["Insert"]>
        Relationships: []
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          routine_id: string | null
          type: RoutineType
          name: string
          day_name: string | null
          status: WorkoutStatus
          started_at: string
          ended_at: string | null
          duration_seconds: number | null
          total_volume: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          routine_id?: string | null
          type: RoutineType
          name: string
          day_name?: string | null
          status?: WorkoutStatus
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          total_volume?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: Partial<
          Database["public"]["Tables"]["workout_sessions"]["Insert"]
        >
        Relationships: []
      }
      session_exercises: {
        Row: {
          id: string
          session_id: string
          position: number
          exercise_name: string
          exercise_ref: string | null
        }
        Insert: {
          id?: string
          session_id: string
          position?: number
          exercise_name: string
          exercise_ref?: string | null
        }
        Update: Partial<
          Database["public"]["Tables"]["session_exercises"]["Insert"]
        >
        Relationships: []
      }
      session_sets: {
        Row: {
          id: string
          session_exercise_id: string
          set_index: number
          target_reps: string | null
          target_weight: number | null
          target_rir: number | null
          actual_reps: number | null
          actual_weight: number | null
          actual_rir: number | null
          completed: boolean
        }
        Insert: {
          id?: string
          session_exercise_id: string
          set_index: number
          target_reps?: string | null
          target_weight?: number | null
          target_rir?: number | null
          actual_reps?: number | null
          actual_weight?: number | null
          actual_rir?: number | null
          completed?: boolean
        }
        Update: Partial<Database["public"]["Tables"]["session_sets"]["Insert"]>
        Relationships: []
      }
      session_cardio: {
        Row: {
          session_id: string
          duration_seconds: number | null
          rounds_completed: number | null
          intervals_completed: number | null
          calories: number | null
          distance_km: number | null
        }
        Insert: {
          session_id: string
          duration_seconds?: number | null
          rounds_completed?: number | null
          intervals_completed?: number | null
          calories?: number | null
          distance_km?: number | null
        }
        Update: Partial<Database["public"]["Tables"]["session_cardio"]["Insert"]>
        Relationships: []
      }
      coach_profiles: {
        Row: {
          id: string
          handle: string
          display_name: string
          headline: string | null
          bio: string | null
          avatar_url: string | null
          cover_url: string | null
          location: string | null
          public_email: string | null
          socials: Json
          faq: Json
          is_verified: boolean
          status: CoachStatus
          commission_pct: number
          payout_provider: string | null
          payout_ref: Json
          rating_avg: number
          rating_count: number
          active_clients: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          handle: string
          display_name: string
          headline?: string | null
          bio?: string | null
          avatar_url?: string | null
          cover_url?: string | null
          location?: string | null
          public_email?: string | null
          socials?: Json
          faq?: Json
          is_verified?: boolean
          status?: CoachStatus
          commission_pct?: number
          payout_provider?: string | null
          payout_ref?: Json
        }
        Update: Partial<Database["public"]["Tables"]["coach_profiles"]["Insert"]>
        Relationships: []
      }
      coaching_program: {
        Row: {
          id: string
          coach_id: string
          slug: string
          title: string
          product_type: ProductType
          tagline: string | null
          short_description: string | null
          description: string | null
          category: string
          cover_url: string | null
          intro_video_url: string | null
          level: CoachingLevel | null
          includes: Json
          faq: Json
          status: CoachingProgramStatus
          position: number
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          slug: string
          title: string
          product_type?: ProductType
          tagline?: string | null
          short_description?: string | null
          description?: string | null
          category: string
          cover_url?: string | null
          intro_video_url?: string | null
          level?: CoachingLevel | null
          includes?: Json
          faq?: Json
          status?: CoachingProgramStatus
          position?: number
          published_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["coaching_program"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "coaching_program_coach_id_fkey"
            columns: ["coach_id"]
            isOneToMany: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      coaching_program_content: {
        Row: {
          program_id: string
          coach_id: string
          content: Json
          intake_form: Json
          nutrition_notes: string | null
          updated_at: string
        }
        Insert: {
          program_id: string
          coach_id: string
          content?: Json
          intake_form?: Json
          nutrition_notes?: string | null
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["coaching_program_content"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "coaching_program_content_program_id_fkey"
            columns: ["program_id"]
            isOneToMany: false
            referencedRelation: "coaching_program"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_program_content_coach_id_fkey"
            columns: ["coach_id"]
            isOneToMany: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      coach_routine_template: {
        Row: {
          id: string
          coach_id: string
          name: string
          description: string | null
          payload: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          name: string
          description?: string | null
          payload: Json
        }
        Update: Partial<Database["public"]["Tables"]["coach_routine_template"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "coach_routine_template_coach_id_fkey"
            columns: ["coach_id"]
            isOneToMany: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      coach_supplement_template: {
        Row: {
          id: string
          coach_id: string
          name: string
          description: string | null
          items: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          name: string
          description?: string | null
          items: Json
        }
        Update: Partial<Database["public"]["Tables"]["coach_supplement_template"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "coach_supplement_template_coach_id_fkey"
            columns: ["coach_id"]
            isOneToMany: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      coaching_plan: {
        Row: {
          id: string
          program_id: string
          coach_id: string
          name: string
          description: string | null
          price_cents: number
          currency: string
          billing_type: BillingType
          recurring_interval: RecurringInterval | null
          duration_days: number
          perks: Json
          routine_template_id: string | null
          supplement_template_id: string | null
          is_visible: boolean
          is_featured: boolean
          price_usd_cents: number | null
          discount_pct: number
          accent_color: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          program_id: string
          coach_id: string
          name: string
          description?: string | null
          price_cents: number
          currency?: string
          billing_type?: BillingType
          recurring_interval?: RecurringInterval | null
          duration_days: number
          perks?: Json
          routine_template_id?: string | null
          supplement_template_id?: string | null
          is_visible?: boolean
          is_featured?: boolean
          price_usd_cents?: number | null
          discount_pct?: number
          accent_color?: string | null
          position?: number
        }
        Update: Partial<Database["public"]["Tables"]["coaching_plan"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "coaching_plan_program_id_fkey"
            columns: ["program_id"]
            isOneToMany: false
            referencedRelation: "coaching_program"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_plan_coach_id_fkey"
            columns: ["coach_id"]
            isOneToMany: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_plan_routine_template_id_fkey"
            columns: ["routine_template_id"]
            isOneToMany: false
            referencedRelation: "coach_routine_template"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_plan_supplement_template_id_fkey"
            columns: ["supplement_template_id"]
            isOneToMany: false
            referencedRelation: "coach_supplement_template"
            referencedColumns: ["id"]
          }
        ]
      }
      coaching_subscription: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          program_id: string
          coach_id: string
          status: SubscriptionStatus
          starts_at: string | null
          ends_at: string | null
          perks_snapshot: Json
          routine_id: string | null
          personalized_template_id: string | null
          messages_used: number
          video_calls_used: number
          reconfigs_used: number
          coach_notes: string | null
          intake_answers: Json | null
          last_payment_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          program_id: string
          coach_id: string
          status?: SubscriptionStatus
          starts_at?: string | null
          ends_at?: string | null
          perks_snapshot: Json
          routine_id?: string | null
          personalized_template_id?: string | null
          messages_used?: number
          video_calls_used?: number
          reconfigs_used?: number
          coach_notes?: string | null
          intake_answers?: Json | null
          last_payment_id?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["coaching_subscription"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "coaching_subscription_plan_id_fkey"
            columns: ["plan_id"]
            isOneToMany: false
            referencedRelation: "coaching_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_subscription_program_id_fkey"
            columns: ["program_id"]
            isOneToMany: false
            referencedRelation: "coaching_program"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_subscription_coach_id_fkey"
            columns: ["coach_id"]
            isOneToMany: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_subscription_routine_id_fkey"
            columns: ["routine_id"]
            isOneToMany: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          }
        ]
      }
      coaching_thread: {
        Row: {
          id: string
          subscription_id: string
          coach_id: string
          user_id: string
          last_message_at: string | null
          coach_unread: number
          user_unread: number
          created_at: string
        }
        Insert: {
          id?: string
          subscription_id: string
          coach_id: string
          user_id: string
          last_message_at?: string | null
          coach_unread?: number
          user_unread?: number
        }
        Update: Partial<Database["public"]["Tables"]["coaching_thread"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "coaching_thread_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToMany: false
            referencedRelation: "coaching_subscription"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_thread_coach_id_fkey"
            columns: ["coach_id"]
            isOneToMany: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      coaching_message: {
        Row: {
          id: string
          subscription_id: string
          sender_id: string
          sender_role: MessageSenderRole
          body: string | null
          attachment_url: string | null
          attachment_type: AttachmentType | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          subscription_id: string
          sender_id: string
          sender_role: MessageSenderRole
          body?: string | null
          attachment_url?: string | null
          attachment_type?: AttachmentType | null
          read_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["coaching_message"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "coaching_message_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToMany: false
            referencedRelation: "coaching_subscription"
            referencedColumns: ["id"]
          }
        ]
      }
      coaching_payment: {
        Row: {
          id: string
          subscription_id: string | null
          user_id: string
          coach_id: string
          program_id: string
          provider: PaymentProvider
          provider_ref: string
          amount_cents: number
          currency: string
          commission_cents: number
          net_cents: number
          status: PaymentStatus
          raw_event: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          subscription_id?: string | null
          user_id: string
          coach_id: string
          program_id: string
          provider: PaymentProvider
          provider_ref: string
          amount_cents: number
          currency?: string
          commission_cents: number
          net_cents: number
          status?: PaymentStatus
          raw_event?: Json | null
        }
        Update: Partial<Database["public"]["Tables"]["coaching_payment"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "coaching_payment_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToMany: false
            referencedRelation: "coaching_subscription"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_payment_coach_id_fkey"
            columns: ["coach_id"]
            isOneToMany: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_payment_program_id_fkey"
            columns: ["program_id"]
            isOneToMany: false
            referencedRelation: "coaching_program"
            referencedColumns: ["id"]
          }
        ]
      }
      coaching_review: {
        Row: {
          id: string
          subscription_id: string
          program_id: string
          coach_id: string
          user_id: string
          rating: number
          comment: string | null
          image_url: string | null
          is_published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          subscription_id: string
          program_id: string
          coach_id: string
          user_id: string
          rating: number
          comment?: string | null
          image_url?: string | null
          is_published?: boolean
        }
        Update: Partial<Database["public"]["Tables"]["coaching_review"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "coaching_review_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToMany: false
            referencedRelation: "coaching_subscription"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_review_program_id_fkey"
            columns: ["program_id"]
            isOneToMany: false
            referencedRelation: "coaching_program"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_review_coach_id_fkey"
            columns: ["coach_id"]
            isOneToMany: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      coaching_transformation: {
        Row: {
          id: string
          coach_id: string
          program_id: string | null
          client_name: string
          before_url: string | null
          after_url: string | null
          metric: string | null
          testimonial: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          program_id?: string | null
          client_name: string
          before_url?: string | null
          after_url?: string | null
          metric?: string | null
          testimonial?: string | null
          position?: number
        }
        Update: Partial<Database["public"]["Tables"]["coaching_transformation"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "coaching_transformation_coach_id_fkey"
            columns: ["coach_id"]
            isOneToMany: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_transformation_program_id_fkey"
            columns: ["program_id"]
            isOneToMany: false
            referencedRelation: "coaching_program"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      sex: Sex
      goal: Goal
      experience_level: ExperienceLevel
      units: Units
      training_type: TrainingType
      routine_type: RoutineType
      session_status: WorkoutStatus
      profile_role: ProfileRole
      coach_status: CoachStatus
      coaching_program_status: CoachingProgramStatus
      coaching_category: CoachingCategory
      coaching_level: CoachingLevel
      billing_type: BillingType
      recurring_interval: RecurringInterval
      subscription_status: SubscriptionStatus
      message_sender_role: MessageSenderRole
      attachment_type: AttachmentType
      payment_status: PaymentStatus
      payment_provider: PaymentProvider
    }
    CompositeTypes: Record<string, never>
  }
}

// Atajos útiles para el resto de la app.
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"]
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]

export type Routine = Database["public"]["Tables"]["routines"]["Row"]
export type RoutineInsert = Database["public"]["Tables"]["routines"]["Insert"]
export type RoutineExercise =
  Database["public"]["Tables"]["routine_exercises"]["Row"]
export type RoutineLiss = Database["public"]["Tables"]["routine_liss"]["Row"]
export type RoutineHiit = Database["public"]["Tables"]["routine_hiit"]["Row"]
export type RoutineCustomConfig =
  Database["public"]["Tables"]["routine_custom_config"]["Row"]
export type RoutineIntervalBlock =
  Database["public"]["Tables"]["routine_interval_blocks"]["Row"]
export type Plan = Database["public"]["Tables"]["plans"]["Row"]
export type PlanDay = Database["public"]["Tables"]["plan_days"]["Row"]

export type WorkoutSession =
  Database["public"]["Tables"]["workout_sessions"]["Row"]
export type SessionExercise =
  Database["public"]["Tables"]["session_exercises"]["Row"]
export type SessionSet = Database["public"]["Tables"]["session_sets"]["Row"]

// Tipos de coaching
export type CoachProfile =
  Database["public"]["Tables"]["coach_profiles"]["Row"]
export type CoachProfileInsert =
  Database["public"]["Tables"]["coach_profiles"]["Insert"]
export type CoachingProgram =
  Database["public"]["Tables"]["coaching_program"]["Row"]
export type CoachingProgramInsert =
  Database["public"]["Tables"]["coaching_program"]["Insert"]
export type CoachingProgramContent =
  Database["public"]["Tables"]["coaching_program_content"]["Row"]
export type CoachingProgramContentInsert =
  Database["public"]["Tables"]["coaching_program_content"]["Insert"]
export type CoachRoutineTemplate =
  Database["public"]["Tables"]["coach_routine_template"]["Row"]
export type CoachRoutineTemplateInsert =
  Database["public"]["Tables"]["coach_routine_template"]["Insert"]
export type CoachSupplementTemplate =
  Database["public"]["Tables"]["coach_supplement_template"]["Row"]
export type CoachSupplementTemplateInsert =
  Database["public"]["Tables"]["coach_supplement_template"]["Insert"]
export type CoachingPlan =
  Database["public"]["Tables"]["coaching_plan"]["Row"]
export type CoachingPlanInsert =
  Database["public"]["Tables"]["coaching_plan"]["Insert"]
export type CoachingSubscription =
  Database["public"]["Tables"]["coaching_subscription"]["Row"]
export type CoachingSubscriptionInsert =
  Database["public"]["Tables"]["coaching_subscription"]["Insert"]
export type CoachingThread =
  Database["public"]["Tables"]["coaching_thread"]["Row"]
export type CoachingThreadInsert =
  Database["public"]["Tables"]["coaching_thread"]["Insert"]
export type CoachingMessage =
  Database["public"]["Tables"]["coaching_message"]["Row"]
export type CoachingMessageInsert =
  Database["public"]["Tables"]["coaching_message"]["Insert"]
export type CoachingPayment =
  Database["public"]["Tables"]["coaching_payment"]["Row"]
export type CoachingPaymentInsert =
  Database["public"]["Tables"]["coaching_payment"]["Insert"]
export type CoachingReview =
  Database["public"]["Tables"]["coaching_review"]["Row"]
export type CoachingReviewInsert =
  Database["public"]["Tables"]["coaching_review"]["Insert"]
export type CoachingTransformation =
  Database["public"]["Tables"]["coaching_transformation"]["Row"]
export type CoachingTransformationInsert =
  Database["public"]["Tables"]["coaching_transformation"]["Insert"]
