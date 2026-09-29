// ---------------------------------------------------------------------------
// Qdrant — fetch-based helpers (Edge-compatible, also usable from plain Node
// scripts). Replaces Supabase pgvector as the RAG vector store.
// ---------------------------------------------------------------------------

const COLLECTION = 'portfolio_chunks'
const META_COLLECTION = 'rag_meta' // replaces the Supabase `rag_hashes` table

function baseUrl() {
  const url = process.env.QDRANT_URL
  if (!url) throw new Error('QDRANT_URL is not set')
  return url.replace(/\/+$/, '')
}

async function qdrantFetch(path, options = {}) {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...options,
    headers: {
      'api-key': process.env.QDRANT_API_KEY,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Qdrant ${options.method || 'GET'} ${path} failed: ${response.status} ${text}`)
  }
  return response.json()
}

// ---------------------------------------------------------------------------
// Collection bootstrap (idempotent — safe to call on every ingest run)
// ---------------------------------------------------------------------------

async function ensureCollection(name, vectorSize) {
  const exists = await fetch(`${baseUrl()}/collections/${name}`, {
    headers: { 'api-key': process.env.QDRANT_API_KEY },
  })
  if (exists.ok) return
  await qdrantFetch(`/collections/${name}`, {
    method: 'PUT',
    body: JSON.stringify({
      vectors: { size: vectorSize, distance: 'Cosine' },
    }),
  })
}

export async function qdrantEnsureCollection() {
  await ensureCollection(COLLECTION, 1536) // text-embedding-3-small
  await ensureCollection(META_COLLECTION, 1) // dummy vectors — payload-only lookups
}

// ---------------------------------------------------------------------------
// Search / upsert / delete on the main chunks collection
// ---------------------------------------------------------------------------

export async function qdrantSearch(vector, limit = 10) {
  const data = await qdrantFetch(`/collections/${COLLECTION}/points/search`, {
    method: 'POST',
    body: JSON.stringify({ vector, limit, with_payload: true }),
  })
  return (data.result || []).map((point) => ({
    content: point.payload?.content,
    metadata: point.payload?.metadata || {},
    similarity: point.score,
  }))
}

export async function qdrantUpsert(chunks, embeddings) {
  const points = chunks.map((chunk, i) => ({
    id: crypto.randomUUID(),
    vector: embeddings[i],
    payload: { content: chunk.content, metadata: chunk.metadata },
  }))
  for (let i = 0; i < points.length; i += 100) {
    const batch = points.slice(i, i + 100)
    await qdrantFetch(`/collections/${COLLECTION}/points`, {
      method: 'PUT',
      body: JSON.stringify({ points: batch }),
    })
  }
}

export async function qdrantDeleteByArticle(articleId) {
  await qdrantFetch(`/collections/${COLLECTION}/points/delete`, {
    method: 'POST',
    body: JSON.stringify({
      filter: { must: [{ key: 'metadata.article_id', match: { value: articleId } }] },
    }),
  })
}

/** Scroll every point's metadata.article_id (paginated) — for chunk-count stats. */
export async function qdrantCountByArticle() {
  const counts = {}
  let offset = null
  do {
    const data = await qdrantFetch(`/collections/${COLLECTION}/points/scroll`, {
      method: 'POST',
      body: JSON.stringify({
        limit: 250,
        offset,
        with_payload: ['metadata'],
        with_vector: false,
      }),
    })
    for (const point of data.result?.points || []) {
      const articleId = point.payload?.metadata?.article_id || 'unknown'
      counts[articleId] = (counts[articleId] || 0) + 1
    }
    offset = data.result?.next_page_offset || null
  } while (offset)
  return counts
}

// ---------------------------------------------------------------------------
// Ingestion change-detection hashes (replaces the Supabase `rag_hashes` table)
// ---------------------------------------------------------------------------

function hashPointId(articleId) {
  // Deterministic UUIDv5-style derivation isn't needed here — points are
  // addressed by payload filter, not by ID, so any stable string works as
  // long as re-upserting the same article overwrites the same point.
  let h = 0
  for (let i = 0; i < articleId.length; i++) {
    h = (h * 31 + articleId.charCodeAt(i)) >>> 0
  }
  return h
}

export async function qdrantGetHashes() {
  const hashes = {}
  let offset = null
  do {
    const data = await qdrantFetch(`/collections/${META_COLLECTION}/points/scroll`, {
      method: 'POST',
      body: JSON.stringify({ limit: 250, offset, with_payload: true, with_vector: false }),
    })
    for (const point of data.result?.points || []) {
      if (point.payload?.article_id) hashes[point.payload.article_id] = point.payload.hash
    }
    offset = data.result?.next_page_offset || null
  } while (offset)
  return hashes
}

export async function qdrantSaveHashes(hashes) {
  const points = Object.entries(hashes).map(([article_id, hash]) => ({
    id: hashPointId(article_id),
    vector: [0],
    payload: { article_id, hash },
  }))
  if (points.length === 0) return
  await qdrantFetch(`/collections/${META_COLLECTION}/points`, {
    method: 'PUT',
    body: JSON.stringify({ points }),
  })
}

export async function qdrantDeleteHash(articleId) {
  await qdrantFetch(`/collections/${META_COLLECTION}/points/delete`, {
    method: 'POST',
    body: JSON.stringify({ points: [hashPointId(articleId)] }),
  })
}
