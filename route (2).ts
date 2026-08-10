import { NextRequest, NextResponse } from "next/server";
import { generateGuidanceForWebinar } from "@/lib/guidance";

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
    const webinar = await generateGuidanceForWebinar(webinarId);
    return NextResponse.json({ webinar });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate guidance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
