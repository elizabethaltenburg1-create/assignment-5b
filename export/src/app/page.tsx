import Link from "next/link";
import { getCompletedWebinarsWithCounts } from "@/lib/webinars";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function Dashboard() {
  let webinars;
  let loadError: string | null = null;

  try {
    webinars = await getCompletedWebinarsWithCounts();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load webinars";
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-semibold text-gray-900">Completed Webinars</h1>
      <p className="mt-1 text-sm text-gray-500">
        Select a webinar to review engagement and generate BDR follow-up guidance.
      </p>

      {loadError ? (
        <p className="mt-4 text-red-600">Failed to load webinars: {loadError}</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Webinar</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">
                  Registrations
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">
                  Attendees
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {webinars!.map((webinar) => (
                <tr key={webinar.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{webinar.title}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(webinar.date)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {webinar.registration_count}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {webinar.attendance_count}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/webinars/${webinar.id}`}
                      className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
              {webinars!.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No completed webinars yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
