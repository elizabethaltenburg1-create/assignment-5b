"use client";

import { Fragment, useState } from "react";
import type { Webinar } from "@/lib/types";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function priorityClasses(priority: string | null) {
  const value = (priority ?? "").toLowerCase();
  if (value.includes("hot")) return "bg-red-100 text-red-800";
  if (value.includes("warm")) return "bg-amber-100 text-amber-800";
  if (value.includes("cold")) return "bg-blue-100 text-blue-800";
  return "bg-gray-100 text-gray-700";
}

export default function WebinarDashboard({
  initialWebinars,
}: {
  initialWebinars: Webinar[];
}) {
  const [webinars, setWebinars] = useState(initialWebinars);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [errorById, setErrorById] = useState<Record<number, string>>({});

  async function handleGenerate(id: number) {
    setGeneratingId(id);
    setErrorById((prev) => ({ ...prev, [id]: "" }));
    try {
      const response = await fetch(`/api/webinars/${id}/generate-guidance`, {
        method: "POST",
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to generate guidance");
      }
      setWebinars((prev) =>
        prev.map((w) => (w.id === id ? (body.webinar as Webinar) : w))
      );
      setExpandedId(id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate guidance";
      setErrorById((prev) => ({ ...prev, [id]: message }));
    } finally {
      setGeneratingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="text-2xl font-semibold text-gray-900">
        Webinar BDR Guidance
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Review webinar engagement and generate AI-backed BDR follow-up guidance.
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Webinar
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Date
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">
                Registrations
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">
                Attendees
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Engagement
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Priority
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Last Updated
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Guidance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {webinars.map((webinar) => (
              <Fragment key={webinar.id}>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {webinar.webinar_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(webinar.webinar_date)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {webinar.registrations}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {webinar.attendees}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {webinar.engagement_score ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityClasses(
                        webinar.lead_priority
                      )}`}
                    >
                      {webinar.lead_priority ?? "Unscored"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDateTime(webinar.last_updated)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <button
                        onClick={() => handleGenerate(webinar.id)}
                        disabled={generatingId === webinar.id}
                        className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {generatingId === webinar.id
                          ? "Generating…"
                          : webinar.bdr_guidance
                          ? "Regenerate BDR Guidance"
                          : "Generate BDR Guidance"}
                      </button>
                      {webinar.bdr_guidance && (
                        <button
                          onClick={() =>
                            setExpandedId((prev) =>
                              prev === webinar.id ? null : webinar.id
                            )
                          }
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          {expandedId === webinar.id
                            ? "Hide guidance"
                            : "View guidance"}
                        </button>
                      )}
                      {errorById[webinar.id] && (
                        <span className="text-xs text-red-600">
                          {errorById[webinar.id]}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedId === webinar.id && webinar.bdr_guidance && (
                  <tr className="bg-gray-50">
                    <td colSpan={8} className="px-4 py-4">
                      <p className="whitespace-pre-wrap text-sm text-gray-700">
                        {webinar.bdr_guidance}
                      </p>
                      <p className="mt-2 text-xs text-gray-400">
                        Generated {formatDateTime(webinar.guidance_generated_at)}
                      </p>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {webinars.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No webinars yet. Add one in Supabase to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
