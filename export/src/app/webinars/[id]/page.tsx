import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getEngagementSummary } from "@/lib/guidance";
import type { BdrGuidance, EngagementSummary, Webinar, WebinarSummary } from "@/lib/types";
import WebinarDetailsPanel from "@/components/WebinarDetailsPanel";

export const dynamic = "force-dynamic";

export default async function WebinarDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const webinarId = Number(id);

  if (!Number.isInteger(webinarId)) {
    notFound();
  }

  const supabase = getSupabaseAdmin();

  let loadError: string | null = null;
  let webinar: Webinar | null = null;
  let engagement: EngagementSummary | null = null;
  let latestGuidance: BdrGuidance | null = null;
  let latestSummary: WebinarSummary | null = null;
  let genuinelyMissing = false;

  // notFound() throws a special Next.js error that must propagate
  // uncaught — it's only ever called outside this try/catch, below.
  try {
    const { data, error } = await supabase
      .from("webinars")
      .select("*")
      .eq("id", webinarId)
      .single();

    if (error?.code === "PGRST116" || (!error && !data)) {
      genuinelyMissing = true;
    } else if (error) {
      throw new Error(error.message);
    } else {
      webinar = data as Webinar;
      engagement = await getEngagementSummary(webinarId);

      const { data: guidanceRow, error: guidanceError } = await supabase
        .from("bdr_guidance")
        .select("*")
        .eq("webinar_id", webinarId)
        .order("date_generated", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (guidanceError) {
        throw new Error(guidanceError.message);
      }
      latestGuidance = (guidanceRow as BdrGuidance | null) ?? null;

      const { data: summaryRow, error: summaryError } = await supabase
        .from("webinar_summaries")
        .select("*")
        .eq("webinar_id", webinarId)
        .order("date_generated", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (summaryError) {
        throw new Error(summaryError.message);
      }
      latestSummary = (summaryRow as WebinarSummary | null) ?? null;
    }
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load webinar";
  }

  if (genuinelyMissing) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← Back to dashboard
      </Link>

      {loadError ? (
        <p className="mt-4 text-red-600">Failed to load webinar: {loadError}</p>
      ) : (
        webinar &&
        engagement && (
          <WebinarDetailsPanel
            webinar={webinar}
            summary={engagement}
            initialGuidance={latestGuidance}
            initialSummary={latestSummary}
          />
        )
      )}
    </main>
  );
}
