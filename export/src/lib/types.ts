export type Webinar = {
  id: number;
  title: string;
  date: string;
  description: string | null;
  presenter_name: string | null;
  recording_link: string | null;
  slide_deck_link: string | null;
};

export type AttendanceStatus = "registered" | "attended" | "no_show";

export type Registration = {
  id: number;
  webinar_id: number;
  registrant_name: string;
  company: string | null;
  email: string;
  job_title: string | null;
  registration_date: string;
  attendance_status: string;
  duration_attended: number;
};

export type PriorityStatus = "Hot" | "Warm" | "Cold";

export type Lead = {
  id: number;
  registration_id: number;
  engagement_score: number;
  priority_status: string;
  flagged: boolean;
  date_scored: string;
  assigned_bdr: string | null;
};

export type BdrGuidance = {
  id: number;
  webinar_id: number;
  generated_text: string;
  date_generated: string;
};

export type WebinarSummary = {
  id: number;
  webinar_id: number;
  summary_text: string;
  date_generated: string;
};

export type WebinarWithCounts = Webinar & {
  registration_count: number;
  attendance_count: number;
};

export type EngagementSummary = {
  averageScore: number | null;
  hotCount: number;
  warmCount: number;
  coldCount: number;
  flaggedCount: number;
  leadCount: number;
};
