import { getSupabaseAdmin } from "@/lib/supabase";
import type { Webinar } from "@/lib/types";
import WebinarDashboard from "@/components/WebinarDashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data, error } = await getSupabaseAdmin()
    .from("webinars")
    .select("*")
    .order("webinar_date", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Webinar BDR Guidance
        </h1>
        <p className="mt-4 text-red-600">
          Failed to load webinars: {error.message}
        </p>
      </main>
    );
  }

  return <WebinarDashboard initialWebinars={(data ?? []) as Webinar[]} />;
}
