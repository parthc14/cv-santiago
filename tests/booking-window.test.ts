/**
 * Unit tests for the Cal.com earliest-bookable-day rule (api/_shared/cal.js).
 *
 * Usage: npm run test:booking
 */

import { earliestBookableDate, bookingWindow } from '../api/_shared/cal.js'

let passed = 0
let failed = 0

function assertEq(actual: unknown, expected: unknown, msg: string) {
  if (actual === expected) { passed++; console.log(`  ✅ ${msg}`) }
  else { failed++; console.error(`  ❌ ${msg} — expected ${expected}, got ${actual}`) }
}

// Noon Pacific on each day of the week of Mon Oct 5 – Sun Oct 11, 2026 (PDT, UTC-7)
const at = (ymd: string, hhmm = '12:00') => new Date(`${ymd}T${hhmm}:00-07:00`)

console.log('Mon–Wed → next Monday')
assertEq(earliestBookableDate(at('2026-10-05')), '2026-10-12', 'Mon Oct 5 → Mon Oct 12')
assertEq(earliestBookableDate(at('2026-10-06')), '2026-10-12', 'Tue Oct 6 → Mon Oct 12')
assertEq(earliestBookableDate(at('2026-10-07')), '2026-10-12', 'Wed Oct 7 → Mon Oct 12')

console.log('Thu–Sun → Thursday of next week')
assertEq(earliestBookableDate(at('2026-10-08')), '2026-10-15', 'Thu Oct 8 → Thu Oct 15')
assertEq(earliestBookableDate(at('2026-10-09')), '2026-10-15', 'Fri Oct 9 → Thu Oct 15')
assertEq(earliestBookableDate(at('2026-10-10')), '2026-10-15', 'Sat Oct 10 → Thu Oct 15')
assertEq(earliestBookableDate(at('2026-10-11')), '2026-10-15', 'Sun Oct 11 → Thu Oct 15')

console.log('Uses the Pacific calendar day, not UTC')
// 11:30pm Wed Pacific is already Thursday in UTC — still Wednesday's rule
assertEq(earliestBookableDate(at('2026-10-07', '23:30')), '2026-10-12', 'Wed 11:30pm PT → Mon Oct 12')
assertEq(earliestBookableDate(at('2026-10-08', '00:05')), '2026-10-15', 'Thu 12:05am PT → Thu Oct 15')

console.log('Month/year rollover and standard time')
assertEq(earliestBookableDate(new Date('2026-12-30T12:00:00-08:00')), '2027-01-04', 'Wed Dec 30 → Mon Jan 4')
assertEq(earliestBookableDate(new Date('2026-11-06T12:00:00-08:00')), '2026-11-12', 'Fri Nov 6 (PST) → Thu Nov 12')

console.log('Booking window')
const w = bookingWindow(at('2026-10-06'))
assertEq(w.type, 'range', 'type is range')
assertEq(w.value[0], '2026-10-12', 'starts at earliest day')
assertEq(w.value[1], '2027-10-12', 'stays open for a year')

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
