import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateGuidanceForWebinar } from "@/lib/guidance";

// Triggered daily by Vercel Cron (see vercel.json). Vercel signs the request
// with `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is configured.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: pending, error } = await getSupabaseAdmin()
    .from("webinars")
    .select("id")
    .is("bdr_guidance", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = await Promise.allSettled(
    (pending ?? []).map((webinar) => generateGuidanceForWebinar(webinar.id))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ processed: results.length, succeeded, failed });
}
