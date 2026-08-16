import type { PriorityStatus } from "@/lib/types";

// Fixed-rule engagement scoring (not an AI judgment call): normalizes
// duration_attended against an assumed webinar length, since this MVP's
// mock GoToWebinar import doesn't carry the session's actual duration.
const ASSUMED_WEBINAR_MINUTES = 60;
const HOT_THRESHOLD = 70;
const WARM_THRESHOLD = 40;
const FLAG_THRESHOLD = 80;

export type EngagementScore = {
  engagementScore: number;
  priorityStatus: PriorityStatus;
  flagged: boolean;
};

export function scoreEngagement(
  attendanceStatus: string,
  durationAttended: number
): EngagementScore {
  if (attendanceStatus !== "attended") {
    return { engagementScore: 0, priorityStatus: "Cold", flagged: false };
  }

  const engagementScore = Math.min(
    100,
    Math.round((durationAttended / ASSUMED_WEBINAR_MINUTES) * 100)
  );

  const priorityStatus: PriorityStatus =
    engagementScore >= HOT_THRESHOLD
      ? "Hot"
      : engagementScore >= WARM_THRESHOLD
      ? "Warm"
      : "Cold";

  return { engagementScore, priorityStatus, flagged: engagementScore >= FLAG_THRESHOLD };
}
