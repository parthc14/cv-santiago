import { validateOpsAuth } from '../_shared/ops-auth.js'
import { qdrantCountByArticle } from '../_shared/qdrant.js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  const auth = validateOpsAuth(req)
  if (!auth.ok) return auth.response

  try {
    const qdrantConfigured = !!(process.env.QDRANT_URL && process.env.QDRANT_API_KEY)
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseConfigured = !!(supabaseUrl && supabaseKey)

    const [countsResult, rateLimitsRes] = await Promise.all([
      // Chunk counts per article_id, from Qdrant
      qdrantConfigured ? qdrantCountByArticle().catch(() => null) : Promise.resolve(null),
      // Voice rate limits — unrelated to the vector store, still on Supabase
      supabaseConfigured
        ? fetch(
            `${supabaseUrl}/rest/v1/voice_rate_limits?select=*&order=window_start.desc&limit=10`,
            {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
            },
          ).catch(() => null)
        : Promise.resolve(null),
    ])

    // Aggregate chunks by article_id
    let chunks = []
    let totalChunks = 0
    if (countsResult) {
      totalChunks = Object.values(countsResult).reduce((a, b) => a + b, 0)
      chunks = Object.entries(countsResult)
        .map(([articleId, chunkCount]) => ({ articleId, slug: articleId, chunkCount }))
        .sort((a, b) => b.chunkCount - a.chunkCount)
    }

    // Rate limits
    let voiceRateLimits = []
    if (rateLimitsRes?.ok) {
      const rlData = await rateLimitsRes.json()
      voiceRateLimits = (rlData || []).map(r => ({
        ip: r.ip || r.client_ip || 'unknown',
        count: r.request_count || r.count || 0,
        windowStart: r.last_used || r.window_start || new Date().toISOString(),
      }))
    }

    return json({
      byArticle: chunks,
      totalChunks,
      voiceRateLimits,
      ...(qdrantConfigured ? {} : { qdrantError: 'Qdrant not configured' }),
      ...(supabaseConfigured ? {} : { rateLimitsError: 'Supabase not configured' }),
    })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
