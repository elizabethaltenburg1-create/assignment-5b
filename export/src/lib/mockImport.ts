import "server-only";

const MOCK_FIRST_NAMES = [
  "Jordan", "Taylor", "Morgan", "Casey", "Riley",
  "Avery", "Jamie", "Drew", "Reese", "Skyler",
];
const MOCK_LAST_NAMES = [
  "Bennett", "Ortiz", "Chen", "Patel", "Nguyen",
  "Silva", "Kowalski", "Haddad", "Murphy", "Larsen",
];
const MOCK_COMPANIES = [
  "Northwind Traders", "Globex Corp", "Initech", "Umbrella Group", "Acme Co",
  "Hooli", "Stark Industries", "Wayne Enterprises", "Wonka Labs", "Pied Piper",
];
const MOCK_TITLES = [
  "VP of Sales", "Director of Revenue Ops", "BDR Manager", "Marketing Lead",
  "Head of Growth", "Account Executive", "Sales Ops Analyst", "CRO",
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export type MockRegistrant = {
  registrant_name: string;
  company: string;
  email: string;
  job_title: string;
  registration_date: string;
  attendance_status: "attended" | "no_show";
  duration_attended: number;
};

// Simulates a GoToWebinar registrant/attendance export for this MVP. Swap
// this out for a real GoToWebinar API call later — the cron route only
// depends on this function's return shape.
export function generateMockRegistrants(
  webinarDate: string,
  count: number
): MockRegistrant[] {
  const registrants: MockRegistrant[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = pick(MOCK_FIRST_NAMES);
    const lastName = pick(MOCK_LAST_NAMES);
    const company = pick(MOCK_COMPANIES);
    const attended = Math.random() < 0.65;
    const daysBeforeWebinar = Math.floor(Math.random() * 5) + 1;
    const registrationDate = new Date(
      new Date(webinarDate).getTime() - daysBeforeWebinar * 24 * 60 * 60 * 1000
    );

    registrants.push({
      registrant_name: `${firstName} ${lastName}`,
      company,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company
        .toLowerCase()
        .replace(/[^a-z]/g, "")}.example`,
      job_title: pick(MOCK_TITLES),
      registration_date: registrationDate.toISOString(),
      attendance_status: attended ? "attended" : "no_show",
      duration_attended: attended ? Math.floor(Math.random() * 60) + 1 : 0,
    });
  }

  return registrants;
}
