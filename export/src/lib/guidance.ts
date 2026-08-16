import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateText } from "@/lib/claude";
import { getWebinarOrThrow } from "@/lib/webinars";
import type { BdrGuidance, EngagementSummary, Webinar } from "@/lib/types";

export async function getEngagementSummary(webinarId: number): Promise<EngagementSummary> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("leads")
    .select("engagement_score, priority_status, flagged, registrations!inner(webinar_id)")
    .eq("registrations.webinar_id", webinarId);

  if (error) {
    throw new Error(error.message);
  }

  const leads = data ?? [];
  const leadCount = leads.length;
  const averageScore = leadCount
    ? Math.round(
        leads.reduce((sum, lead) => sum + lead.engagement_score, 0) / leadCount
      )
    : null;

  return {
    averageScore,
    hotCount: leads.filter((lead) => lead.priority_status === "Hot").length,
    warmCount: leads.filter((lead) => lead.priority_status === "Warm").length,
    coldCount: leads.filter((lead) => lead.priority_status === "Cold").length,
    flaggedCount: leads.filter((lead) => lead.flagged).length,
    leadCount,
  };
}

function buildPrompt(webinar: Webinar, summary: EngagementSummary): string {
  return `You are helping a Business Development Rep (BDR) plan follow-up on webinar leads.

Webinar: ${webinar.title}
Date: ${webinar.date}
Description: ${webinar.description ?? "n/a"}
Presenter: ${webinar.presenter_name ?? "unknown"}

Engagement summary:
- Leads scored: ${summary.leadCount}
- Average engagement score: ${summary.averageScore ?? "n/a"}
- Hot leads: ${summary.hotCount}
- Warm leads: ${summary.warmCount}
- Cold leads: ${summary.coldCount}
- Flagged for immediate follow-up: ${summary.flaggedCount}

Write concise, actionable BDR follow-up talking points and messaging guidance
(4-6 sentences) for this webinar's leads: what to reference from the webinar,
how to tailor messaging by engagement tier (hot/warm/cold), and how urgently
to reach out given the numbers above.`;
}

export async function generateGuidanceForWebinar(webinarId: number): Promise<BdrGuidance> {
  const supabase = getSupabaseAdmin();

  const webinar = await getWebinarOrThrow(webinarId);
  const summary = await getEngagementSummary(webinarId);
  const generatedText = await generateText(buildPrompt(webinar, summary), 700);

  const { data: saved, error: saveError } = await supabase
    .from("bdr_guidance")
    .insert({
      webinar_id: webinarId,
      generated_text: generatedText,
      date_generated: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (saveError || !saved) {
    throw new Error(saveError?.message ?? "Failed to save generated guidance");
  }

  return saved as BdrGuidance;
}
