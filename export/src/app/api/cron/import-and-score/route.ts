import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateMockRegistrants } from "@/lib/mockImport";
import { scoreEngagement } from "@/lib/scoring";

// Runs daily via Vercel Cron (see vercel.json). Vercel signs the request
// with `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is configured.
//
// Two fixed-rule steps, no AI involved:
// 1. Simulate importing GoToWebinar registration/attendance data for
//    completed webinars that don't have any registrations yet.
// 2. Score every registration that doesn't have a lead yet, using the fixed
//    rule in lib/scoring.ts.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const { data: webinars, error: webinarsError } = await supabase
    .from("webinars")
    .select("id, date")
    .lte("date", today);

  if (webinarsError) {
    return NextResponse.json({ error: webinarsError.message }, { status: 500 });
  }

  let registrationsImported = 0;

  for (const webinar of webinars ?? []) {
    const { count, error: countError } = await supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("webinar_id", webinar.id);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if (count && count > 0) continue;

    const mockRegistrants = generateMockRegistrants(
      webinar.date,
      Math.floor(Math.random() * 11) + 5 // 5-15 mock registrants per webinar
    );

    const { error: insertError } = await supabase
      .from("registrations")
      .insert(mockRegistrants.map((registrant) => ({ ...registrant, webinar_id: webinar.id })));

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    registrationsImported += mockRegistrants.length;
  }

  const { data: existingLeads, error: leadsError } = await supabase
    .from("leads")
    .select("registration_id");

  if (leadsError) {
    return NextResponse.json({ error: leadsError.message }, { status: 500 });
  }

  const scoredRegistrationIds = new Set(
    (existingLeads ?? []).map((lead) => lead.registration_id)
  );

  const { data: registrations, error: registrationsError } = await supabase
    .from("registrations")
    .select("id, attendance_status, duration_attended");

  if (registrationsError) {
    return NextResponse.json({ error: registrationsError.message }, { status: 500 });
  }

  const unscored = (registrations ?? []).filter((r) => !scoredRegistrationIds.has(r.id));

  let leadsScored = 0;
  if (unscored.length > 0) {
    const leadsToInsert = unscored.map((registration) => {
      const { engagementScore, priorityStatus, flagged } = scoreEngagement(
        registration.attendance_status,
        registration.duration_attended
      );
      return {
        registration_id: registration.id,
        engagement_score: engagementScore,
        priority_status: priorityStatus,
        flagged,
        date_scored: new Date().toISOString(),
      };
    });

    const { error: insertLeadsError } = await supabase.from("leads").insert(leadsToInsert);
    if (insertLeadsError) {
      return NextResponse.json({ error: insertLeadsError.message }, { status: 500 });
    }
    leadsScored = leadsToInsert.length;
  }

  return NextResponse.json({
    webinarsChecked: webinars?.length ?? 0,
    registrationsImported,
    leadsScored,
  });
}
