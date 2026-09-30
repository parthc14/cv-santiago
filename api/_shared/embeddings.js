// ---------------------------------------------------------------------------
// Embeddings — self-hosted sentence-transformers service (see embed-service/
// at the repo root), replacing OpenAI's embeddings API. Called the same way
// the app already calls Groq/Qdrant: plain fetch, Edge-compatible.
// ---------------------------------------------------------------------------

export const EMBEDDING_DIMENSIONS = 384

export async function embedTexts(texts) {
  const url = process.env.EMBED_SERVICE_URL
  if (!url) throw new Error('EMBED_SERVICE_URL is not set')

  const response = await fetch(`${url.replace(/\/+$/, '')}/embed`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.EMBED_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ texts }),
  })

  if (!response.ok) {
    throw new Error(`Embedding service failed: ${response.status}`)
  }

  const data = await response.json()
  return data.embeddings
}

export async function embedQuery(text) {
  const [embedding] = await embedTexts([text])
  return embedding
}
