"use client";

import { useState } from "react";
import type { BdrGuidance, EngagementSummary, Webinar, WebinarSummary } from "@/lib/types";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function WebinarDetailsPanel({
  webinar,
  summary,
  initialGuidance,
  initialSummary,
}: {
  webinar: Webinar;
  summary: EngagementSummary;
  initialGuidance: BdrGuidance | null;
  initialSummary: WebinarSummary | null;
}) {
  const [guidance, setGuidance] = useState(initialGuidance);
  const [generatingGuidance, setGeneratingGuidance] = useState(false);
  const [guidanceError, setGuidanceError] = useState("");

  const [webinarSummary, setWebinarSummary] = useState(initialSummary);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  async function handleGenerateGuidance() {
    setGeneratingGuidance(true);
    setGuidanceError("");
    try {
      const response = await fetch(`/api/webinars/${webinar.id}/generate-guidance`, {
        method: "POST",
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to generate guidance");
      }
      setGuidance(body.guidance as BdrGuidance);
    } catch (err) {
      setGuidanceError(err instanceof Error ? err.message : "Failed to generate guidance");
    } finally {
      setGeneratingGuidance(false);
    }
  }

  async function handleGenerateSummary() {
    setGeneratingSummary(true);
    setSummaryError("");
    try {
      const response = await fetch(`/api/webinars/${webinar.id}/generate-summary`, {
        method: "POST",
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to generate summary");
      }
      setWebinarSummary(body.summary as WebinarSummary);
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setGeneratingSummary(false);
    }
  }

  return (
    <div className="mt-4">
      <h1 className="text-2xl font-semibold text-gray-900">{webinar.title}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {formatDate(webinar.date)}
        {webinar.presenter_name && ` · Presented by ${webinar.presenter_name}`}
      </p>

      {webinar.description && (
        <p className="mt-4 text-sm text-gray-700">{webinar.description}</p>
      )}

      {(webinar.recording_link || webinar.slide_deck_link) && (
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          {webinar.recording_link && (
            <a
              href={webinar.recording_link}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              Recording
            </a>
          )}
          {webinar.slide_deck_link && (
            <a
              href={webinar.slide_deck_link}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              Slide deck
            </a>
          )}
        </div>
      )}

      <section className="mt-6 rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-gray-900">Webinar Summary</h2>
          <button
            onClick={handleGenerateSummary}
            disabled={generatingSummary}
            className="shrink-0 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generatingSummary
              ? "Generating…"
              : webinarSummary
              ? "Regenerate Summary"
              : "Generate Summary"}
          </button>
        </div>

        {summaryError && <p className="mt-2 text-xs text-red-600">{summaryError}</p>}

        {webinarSummary ? (
          <>
            <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
              {webinarSummary.summary_text}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Generated {formatDateTime(webinarSummary.date_generated)}
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-gray-500">No summary generated yet.</p>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900">Engagement Score</h2>
        {summary.leadCount === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            No leads scored yet — the daily import/scoring job hasn&apos;t run for this
            webinar.
          </p>
        ) : (
          <>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {summary.averageScore}
              <span className="ml-1 text-base font-normal text-gray-500">/ 100 avg</span>
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-gray-600 sm:grid-cols-4">
              <div>
                <dt className="text-gray-500">Hot</dt>
                <dd className="font-medium text-red-700">{summary.hotCount}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Warm</dt>
                <dd className="font-medium text-amber-700">{summary.warmCount}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Cold</dt>
                <dd className="font-medium text-blue-700">{summary.coldCount}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Flagged</dt>
                <dd className="font-medium text-gray-900">{summary.flaggedCount}</dd>
              </div>
            </dl>
          </>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-gray-900">BDR Guidance</h2>
          <button
            onClick={handleGenerateGuidance}
            disabled={generatingGuidance}
            className="shrink-0 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generatingGuidance
              ? "Generating…"
              : guidance
              ? "Regenerate BDR Guidance"
              : "Generate BDR Guidance"}
          </button>
        </div>

        {guidanceError && <p className="mt-2 text-xs text-red-600">{guidanceError}</p>}

        {guidance ? (
          <>
            <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
              {guidance.generated_text}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Generated {formatDateTime(guidance.date_generated)}
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-gray-500">No guidance generated yet.</p>
        )}
      </section>
    </div>
  );
}
