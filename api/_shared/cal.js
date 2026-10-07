/**
 * Cal.com availability rules for the "Book 30 mins with me" button.
 *
 * Hours (set once by scripts/cal-setup.ts): weekdays 08:30–11:00 Pacific.
 * Earliest bookable day (refreshed daily by api/cron/booking-window.js):
 *   - Mon–Wed → next Monday
 *   - Thu–Sun → the Thursday of next week
 * Cal.com can't express a weekday-dependent start on its own, so the cron
 * rewrites the event type's date-range booking window every day.
 */

export const CAL_TIME_ZONE = 'America/Los_Angeles'
// Keep in sync with PROFILE.calLink in src/profile-data.ts
export const CAL_USERNAME = 'parth-chitroda-agqews'
export const CAL_EVENT_SLUG = '30min'
export const WEEKDAY_HOURS = { startTime: '08:30', endTime: '11:00' }
/** How far past the earliest day bookings stay open ("next week onwards") */
export const BOOKING_HORIZON_DAYS = 365

const CAL_API = 'https://api.cal.com/v2'
const EVENT_TYPES_VERSION = '2026-06-12'
const SCHEDULES_VERSION = '2024-06-11'

/** Today's calendar date and ISO weekday (Mon=1 … Sun=7) in Pacific time */
function pacificToday(now) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: CAL_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
    }).formatToParts(now).map(p => [p.type, p.value])
  )
  const isoWeekday = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[parts.weekday]
  // Midnight UTC on the Pacific calendar date — safe for whole-day arithmetic
  const date = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)))
  return { date, isoWeekday }
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 86_400_000)
}

function toYmd(date) {
  return date.toISOString().slice(0, 10)
}

/** Earliest bookable date (YYYY-MM-DD, Pacific) for a booking made at `now` */
export function earliestBookableDate(now = new Date()) {
  const { date, isoWeekday } = pacificToday(now)
  const nextMonday = addDays(date, 8 - isoWeekday)
  return toYmd(isoWeekday <= 3 ? nextMonday : addDays(nextMonday, 3))
}

/** Cal.com `bookingWindow` value for a booking made at `now` */
export function bookingWindow(now = new Date()) {
  const start = earliestBookableDate(now)
  const end = toYmd(addDays(new Date(`${start}T00:00:00Z`), BOOKING_HORIZON_DAYS))
  return { type: 'range', value: [start, end] }
}

async function calFetch(path, { version, method = 'GET', body } = {}) {
  const apiKey = process.env.CAL_API_KEY
  if (!apiKey) throw new Error('CAL_API_KEY is not set')
  const res = await fetch(`${CAL_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'cal-api-version': version,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.status === 'error') {
    throw new Error(`Cal.com ${method} ${path} failed (${res.status}): ${JSON.stringify(json.error ?? json).slice(0, 300)}`)
  }
  return json.data
}

export async function getEventType() {
  const params = new URLSearchParams({ username: CAL_USERNAME, eventSlug: CAL_EVENT_SLUG })
  const [eventType] = await calFetch(`/event-types?${params}`, { version: EVENT_TYPES_VERSION })
  if (!eventType) throw new Error(`Cal.com event type ${CAL_USERNAME}/${CAL_EVENT_SLUG} not found`)
  return eventType
}

/** Point the event type's booking window at today's earliest bookable date */
export async function updateBookingWindow(now = new Date()) {
  const eventType = await getEventType()
  const window = bookingWindow(now)
  await calFetch(`/event-types/${eventType.id}`, {
    version: EVENT_TYPES_VERSION,
    method: 'PATCH',
    body: { bookingWindow: window },
  })
  return { eventTypeId: eventType.id, bookingWindow: window }
}

/** Set the event's schedule to weekdays 08:30–11:00 Pacific */
export async function setWeekdayHours() {
  const eventType = await getEventType()
  const scheduleId = eventType.scheduleId
    ?? (await calFetch('/schedules/default', { version: SCHEDULES_VERSION })).id
  await calFetch(`/schedules/${scheduleId}`, {
    version: SCHEDULES_VERSION,
    method: 'PATCH',
    body: {
      timeZone: CAL_TIME_ZONE,
      availability: [{ days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], ...WEEKDAY_HOURS }],
    },
  })
  return { scheduleId, timeZone: CAL_TIME_ZONE, ...WEEKDAY_HOURS }
}
