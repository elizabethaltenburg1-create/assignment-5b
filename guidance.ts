import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Webinar } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5";

function buildPrompt(webinar: Webinar): string {
  return `You are helping a Business Development Rep (BDR) plan follow-up on webinar leads.

Webinar: ${webinar.webinar_name}
Date: ${webinar.webinar_date}
Registrations: ${webinar.registrations}
Attendees: ${webinar.attendees}
Engagement Score: ${webinar.engagement_score ?? "unknown"}
Lead Priority: ${webinar.lead_priority ?? "unknown"}

Write concise, actionable BDR follow-up guidance (3-5 sentences) for this webinar's attendees: what to say, what to reference from the webinar, and how urgently to reach out given the engagement score and lead priority.`;
}

export async function generateGuidanceForWebinar(id: number): Promise<Webinar> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: webinar, error: fetchError } = await supabaseAdmin
    .from("webinars")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !webinar) {
    throw new Error(fetchError?.message ?? `Webinar ${id} not found`);
  }

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 500,
    messages: [{ role: "user", content: buildPrompt(webinar as Webinar) }],
  });

  const guidance = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("webinars")
    .update({
      bdr_guidance: guidance,
      guidance_generated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "Failed to save generated guidance");
  }

  return updated as Webinar;
}
