export type Webinar = {
  id: number;
  webinar_name: string;
  webinar_date: string;
  registrations: number;
  attendees: number;
  engagement_score: string | null;
  lead_priority: string | null;
  bdr_guidance: string | null;
  guidance_generated_at: string | null;
  last_updated: string;
};
