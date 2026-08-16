import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateText } from "@/lib/claude";
import { getWebinarOrThrow } from "@/lib/webinars";
import type { Webinar, WebinarSummary } from "@/lib/types";

function buildPrompt(webinar: Webinar): string {
  return `Write a concise summary (3-4 sentences) of the following webinar, for
someone who didn't attend and wants a quick overview. Cover what it was
about and who presented it. Don't invent details beyond what's given below.

Title: ${webinar.title}
Date: ${webinar.date}
Presenter: ${webinar.presenter_name ?? "unknown"}
Description: ${webinar.description ?? "No description provided."}`;
}

export async function generateSummaryForWebinar(webinarId: number): Promise<WebinarSummary> {
  const supabase = getSupabaseAdmin();

  const webinar = await getWebinarOrThrow(webinarId);
  const summaryText = await generateText(buildPrompt(webinar), 400);

  const { data: saved, error: saveError } = await supabase
    .from("webinar_summaries")
    .insert({
      webinar_id: webinarId,
      summary_text: summaryText,
      date_generated: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (saveError || !saved) {
    throw new Error(saveError?.message ?? "Failed to save generated summary");
  }

  return saved as WebinarSummary;
}
