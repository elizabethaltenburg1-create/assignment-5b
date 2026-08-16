import { NextRequest, NextResponse } from "next/server";
import { generateGuidanceForWebinar } from "@/lib/guidance";

// Claude responses can take a while; give this function more headroom than
// the platform default so it isn't cut off mid-generation. Vercel Hobby
// plans cap serverless functions at 60s regardless of this value — raise
// your plan (or reduce max_tokens in lib/guidance.ts) if you still see
// timeouts in production.
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
    const guidance = await generateGuidanceForWebinar(webinarId);
    return NextResponse.json({ guidance });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate guidance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
