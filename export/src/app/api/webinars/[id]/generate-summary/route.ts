import { NextRequest, NextResponse } from "next/server";
import { generateSummaryForWebinar } from "@/lib/summary";

// Claude responses can take a while; give this function more headroom than
// the platform default so it isn't cut off mid-generation (same rationale
// as generate-guidance).
export const maxDuration = 60;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const webinarId = Number(id);

  if (!Number.isInteger(webinarId)) {
    return NextResponse.json({ error: "Invalid webinar id" }, { status: 400 });
  }

  try {
    const summary = await generateSummaryForWebinar(webinarId);
    return NextResponse.json({ summary });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate summary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
