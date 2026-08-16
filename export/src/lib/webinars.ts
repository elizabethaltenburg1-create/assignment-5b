import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Webinar, WebinarWithCounts } from "@/lib/types";

export async function getWebinarOrThrow(webinarId: number): Promise<Webinar> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("webinars")
    .select("*")
    .eq("id", webinarId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? `Webinar ${webinarId} not found`);
  }

  return data as Webinar;
}

export async function getCompletedWebinarsWithCounts(): Promise<WebinarWithCounts[]> {
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const { data: webinars, error } = await supabase
    .from("webinars")
    .select("*")
    .lte("date", today)
    .order("date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const results: WebinarWithCounts[] = [];

  for (const webinar of (webinars ?? []) as Webinar[]) {
    const { count: registrationCount, error: registrationError } = await supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("webinar_id", webinar.id);

    if (registrationError) {
      throw new Error(registrationError.message);
    }

    const { count: attendanceCount, error: attendanceError } = await supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("webinar_id", webinar.id)
      .eq("attendance_status", "attended");

    if (attendanceError) {
      throw new Error(attendanceError.message);
    }

    results.push({
      ...webinar,
      registration_count: registrationCount ?? 0,
      attendance_count: attendanceCount ?? 0,
    });
  }

  return results;
}
