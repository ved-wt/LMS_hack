export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum TrainingType {
  ONLINE = 'ONLINE',
  CLASSROOM = 'CLASSROOM',
  WORKSHOP = 'WORKSHOP',
  WEBINAR = 'WEBINAR',
}

export enum TrainingStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  // Legacy/UI specific (map these if needed or remove if unused)
  PUBLISHED = 'PUBLISHED',
  ONGOING = 'ONGOING',
}

export enum EnrollmentStatus {
  ASSIGNED = 'ASSIGNED',
  ENROLLED = 'ENROLLED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum BadgeType {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department_id: string;
  // Extended for UI convenience, though not in strict schema 'user' definition
  department_name?: string;
  job_title?: string;
  avatar?: string;
}

export interface Skill {
  name: string;
  proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
}

export interface Badge {
  id: string;
  user_id: string;
  badge_type: BadgeType;
  year_earned: number;
  hours_completed: number;
  awarded_at: string;
  // Extended for UI
  name?: string;
  icon?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuing_body: string;
  issue_date?: string;
  expiry_date?: string;
}

export interface TrainingHistoryEntry {
  training_id: string;
  title: string;
  status: EnrollmentStatus;
  completion_date?: string;
  progress?: number;
}

export interface Profile {
  id: string;
  user_id: string;
  bio?: string;
  phone?: string;
  linkedin_url?: string;
  skills: Skill[];
  badges: Badge[];
  certifications: Certification[];
  learning_hours: {
    total: number;
    annual: number;
    monthly_breakdown: Record<string, number>; // "YYYY-MM": hours
  };
  streak_count?: number;
  training_history: TrainingHistoryEntry[];
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // Index of the correct option
}

export interface Lesson {
  id: string;
  title: string;
  type: 'VIDEO' | 'TEXT' | 'QUIZ';
  duration_minutes: number;
  content_url?: string; // Video URL or external link
  content_text?: string; // Markdown/HTML content
  questions?: Question[];
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Training {
  id: string;
  title: string;
  description: string;
  category: string;
  type: TrainingType;
  duration_hours: number;
  instructor: string;
  start_date: string;
  status: TrainingStatus;
  is_mandatory: boolean;
  enrolled_count: number;
  max_participants: number;
  // Extended for UI
  image?: string;
  modules?: Module[]; // Syllabus
  prerequisites?: string[];
  learning_outcomes?: string[];
}

// Combined type for the frontend session state
export type CurrentUser = User & Profile;
