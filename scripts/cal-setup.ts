/**
 * One-time Cal.com setup for the "Book 30 mins with me" button:
 * sets weekday 08:30–11:00 Pacific hours and applies today's booking window
 * (the daily cron at /api/cron/booking-window keeps the window current).
 *
 * Usage: npm run cal:setup   (needs CAL_API_KEY in .env.local)
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { setWeekdayHours, updateBookingWindow } from '../api/_shared/cal.js'

const hours = await setWeekdayHours()
console.log(`✓ Hours: Mon–Fri ${hours.startTime}–${hours.endTime} ${hours.timeZone} (schedule ${hours.scheduleId})`)

const { eventTypeId, bookingWindow } = await updateBookingWindow()
console.log(`✓ Booking window for event ${eventTypeId}: ${bookingWindow.value[0]} → ${bookingWindow.value[1]}`)
