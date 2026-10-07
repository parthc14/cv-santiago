/**
 * Vercel Cron Job - Cal.com booking window
 *
 * Runs daily just after midnight Pacific and moves the 30-minute event's
 * earliest bookable day forward (rules in api/_shared/cal.js).
 */

import { updateBookingWindow } from '../_shared/cal.js'

export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
}

export default async function handler(req) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const result = await updateBookingWindow()
    console.log('[booking-window] updated', result)
    return Response.json({ ok: true, ...result })
  } catch (err) {
    console.error('[booking-window] failed', err)
    return Response.json({ ok: false, error: String(err.message ?? err) }, { status: 500 })
  }
}
