/**
 * Cal.com setup for the "Book 30 mins with me" button (safe to re-run):
 *   1. dedicated "Website bookings" schedule: weekdays 08:30–11:00 Pacific
 *   2. hidden 30min event on that schedule, with today's booking window
 *   3. every other event type hidden from the public profile
 * The daily cron at /api/cron/booking-window keeps the window current.
 *
 * Usage: npm run cal:setup   (needs CAL_API_KEY in .env.local)
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import {
  ensureSchedule, ensureEventType, hideOtherEventTypes,
  CAL_SCHEDULE_NAME, CAL_TIME_ZONE, CAL_USERNAME, CAL_EVENT_SLUG, WEEKDAY_HOURS,
} from '../api/_shared/cal.js'

const schedule = await ensureSchedule()
console.log(`✓ Schedule "${CAL_SCHEDULE_NAME}" ${schedule.created ? 'created' : 'updated'} (${schedule.scheduleId}): Mon–Fri ${WEEKDAY_HOURS.startTime}–${WEEKDAY_HOURS.endTime} ${CAL_TIME_ZONE}`)

const event = await ensureEventType(schedule.scheduleId)
console.log(`✓ Event ${CAL_USERNAME}/${CAL_EVENT_SLUG} ${event.created ? 'created' : 'updated'} (${event.eventTypeId}): hidden, bookable ${event.bookingWindow.value[0]} → ${event.bookingWindow.value[1]}`)

const hidden = await hideOtherEventTypes()
console.log(hidden.length ? `✓ Hid from public profile: ${hidden.join(', ')}` : '✓ No other public event types')
