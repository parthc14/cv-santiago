/**
 * RAG Ingestion: embed chunks and upsert to Qdrant.
 *
 * Features:
 *   - Change detection via content hashing (skip unchanged articles)
 *   - Chunk splitting for large sections (1000 chars, 200 overlap)
 *   - Contextual retrieval: prepend summary via Groq before embedding
 *   - Self-hosted sentence-transformers (embed-service/) for embeddings (384 dims)
 *   - Upsert to Qdrant `portfolio_chunks` collection
 *
 * Requires env vars:
 *   EMBED_SERVICE_URL, EMBED_API_KEY, QDRANT_URL, QDRANT_API_KEY
 *   GROQ_API_KEY_NEW (optional, for contextual retrieval)
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.app.json scripts/ingest-rag.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
config() // also load .env as fallback

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import OpenAI from 'openai'
import { articleRegistry } from '../src/articles/registry.ts'
import { getGroqClient, GROQ_MODEL } from '../api/_shared/groq.js'
import { embedTexts as embedTextsViaService } from '../api/_shared/embeddings.js'
import {
  qdrantEnsureCollection, qdrantUpsert, qdrantDeleteByArticle,
  qdrantGetHashes, qdrantSaveHashes, qdrantDeleteHash,
} from '../api/_shared/qdrant.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const CHUNKS_DIR = resolve(root, 'scripts/chunks')
const HASHES_FILE = resolve(root, '.rag-hashes.json')

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MAX_CHUNK_SIZE = 1000    // characters
const CHUNK_OVERLAP = 200      // characters
const EMBEDDING_BATCH_SIZE = 20 // batched for consistency with the previous OpenAI-based pipeline

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

function getGroq(): OpenAI | null {
  if (!process.env.GROQ_API_KEY_NEW) return null
  return getGroqClient()
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChunkMetadata {
  article_id: string
  article_slug_en: string
  article_slug_es: string
  section_id: string
  section_anchor: string
  page_path_en: string
  page_path_es: string
  source_file: string
  format: 'i18n' | 'markdown' | 'plaintext'
}

interface Chunk {
  content: string
  metadata: ChunkMetadata
}

// ---------------------------------------------------------------------------
// Hashing for change detection
// ---------------------------------------------------------------------------

function loadHashesFromFile(): Record<string, string> {
  try {
    if (existsSync(HASHES_FILE)) {
      return JSON.parse(readFileSync(HASHES_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return {}
}

async function loadHashes(): Promise<Record<string, string>> {
  // Local file takes priority (faster), fallback to Qdrant (for CI/Vercel)
  const local = loadHashesFromFile()
  if (Object.keys(local).length > 0) return local
  console.log('  ℹ️  No local hashes — checking Qdrant...')
  try {
    return await qdrantGetHashes()
  } catch { return {} }
}

async function saveHashes(hashes: Record<string, string>) {
  // Save locally
  writeFileSync(HASHES_FILE, JSON.stringify(hashes, null, 2))
  // Save to Qdrant (for CI/Vercel where the local file doesn't persist)
  try {
    await qdrantSaveHashes(hashes)
  } catch { /* non-critical */ }
}

function hashContent(chunks: Chunk[]): string {
  const content = JSON.stringify(chunks.map(c => ({ content: c.content, metadata: c.metadata })))
  return createHash('sha256').update(content).digest('hex').slice(0, 16)
}

// ---------------------------------------------------------------------------
// Chunk splitting (for large sections)
// ---------------------------------------------------------------------------

function splitChunk(chunk: Chunk): Chunk[] {
  if (chunk.content.length <= MAX_CHUNK_SIZE) return [chunk]

  const parts: Chunk[] = []
  let start = 0

  while (start < chunk.content.length) {
    const end = Math.min(start + MAX_CHUNK_SIZE, chunk.content.length)
    const text = chunk.content.slice(start, end)

    parts.push({
      content: text,
      metadata: { ...chunk.metadata },
    })

    start = end - CHUNK_OVERLAP
    if (start >= chunk.content.length - CHUNK_OVERLAP) break
  }

  // Ensure last part is included if we missed it
  if (parts.length > 0) {
    const lastEnd = parts[parts.length - 1].content.length +
      (parts.length - 1) * (MAX_CHUNK_SIZE - CHUNK_OVERLAP)
    if (lastEnd < chunk.content.length) {
      parts.push({
        content: chunk.content.slice(chunk.content.length - MAX_CHUNK_SIZE),
        metadata: { ...chunk.metadata },
      })
    }
  }

  return parts
}

// ---------------------------------------------------------------------------
// Contextual retrieval: prepend summary via Groq
// ---------------------------------------------------------------------------

async function addContextualSummaries(
  chunks: Chunk[],
  articleTitle: string,
  groq: OpenAI | null,
): Promise<string[]> {
  if (!groq) {
    console.log('    (no GROQ_API_KEY_NEW — skipping contextual retrieval)')
    return chunks.map(c => c.content)
  }

  const enriched: string[] = []

  for (const chunk of chunks) {
    try {
      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        max_tokens: 100,
        reasoning_effort: 'low',
        messages: [{
          role: 'user',
          content: `This chunk is from the article "${articleTitle}", section "${chunk.metadata.section_id}". Give a 1-2 sentence context summary that would help retrieve this chunk when relevant. Be specific about what information this chunk contains.\n\nChunk:\n${chunk.content.slice(0, 500)}`,
        }],
      })

      const summary = response.choices?.[0]?.message?.content || ''
      enriched.push(`${summary}\n\n${chunk.content}`)
    } catch {
      // Fallback: use content without summary
      enriched.push(chunk.content)
    }
  }

  return enriched
}

// ---------------------------------------------------------------------------
// Embedding
// ---------------------------------------------------------------------------

async function embedTexts(texts: string[]): Promise<number[][]> {
  const allEmbeddings: number[][] = []

  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE)
    const embeddings = await embedTextsViaService(batch)
    allEmbeddings.push(...embeddings)
  }

  return allEmbeddings
}

// ---------------------------------------------------------------------------
// Qdrant operations
// ---------------------------------------------------------------------------

async function insertChunks(
  chunks: Chunk[],
  embeddings: number[][],
  enrichedTexts: string[],
) {
  const upsertChunks = chunks.map((chunk, i) => ({
    content: enrichedTexts[i],
    metadata: chunk.metadata,
  }))
  await qdrantUpsert(upsertChunks, embeddings)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🔄 RAG Ingestion starting...\n')

  // Check for env vars
  if (!process.env.EMBED_SERVICE_URL || !process.env.EMBED_API_KEY || !process.env.QDRANT_URL || !process.env.QDRANT_API_KEY) {
    console.log('⚠️  Missing env vars (EMBED_SERVICE_URL, EMBED_API_KEY, QDRANT_URL, QDRANT_API_KEY)')
    console.log('   Skipping RAG ingestion. Set env vars to enable.\n')
    process.exit(0) // Exit gracefully so build continues
  }

  const groq = getGroq()

  await qdrantEnsureCollection()

  const hashes = await loadHashes()
  const newHashes = { ...hashes }

  // Read all chunk files
  if (!existsSync(CHUNKS_DIR)) {
    console.log('⚠️  No chunks directory found. Run rag:export first.')
    process.exit(0)
  }

  const chunkFiles = readdirSync(CHUNKS_DIR).filter(f => f.endsWith('.json'))
  let totalIngested = 0
  let totalSkipped = 0

  for (const file of chunkFiles) {
    const articleId = basename(file, '.json')
    const filePath = resolve(CHUNKS_DIR, file)

    // Check ragReady (skip non-article sources like llms-txt)
    const article = articleRegistry.find(a => a.id === articleId)
    if (article && !article.ragReady) {
      console.log(`  ⏭  ${articleId} — ragReady=false, skipping`)
      totalSkipped++
      continue
    }

    // Read chunks
    const chunks: Chunk[] = JSON.parse(readFileSync(filePath, 'utf-8'))
    if (chunks.length === 0) continue

    // Check hash for changes
    const hash = hashContent(chunks)
    if (hashes[articleId] === hash) {
      console.log(`  ⏭  ${articleId} — no changes (hash: ${hash})`)
      totalSkipped++
      continue
    }

    console.log(`  📝 ${articleId} — ${chunks.length} raw chunks (hash changed: ${hashes[articleId] || 'new'} → ${hash})`)

    // Split large chunks
    const splitChunks = chunks.flatMap(splitChunk)
    console.log(`     → ${splitChunks.length} chunks after splitting`)

    // Contextual retrieval summaries
    const articleTitle = article?.titles.en || articleId
    const enrichedTexts = await addContextualSummaries(splitChunks, articleTitle, groq)

    // Embed
    console.log(`     → Embedding ${enrichedTexts.length} chunks...`)
    const embeddings = await embedTexts(enrichedTexts)

    // Delete old + insert new
    console.log(`     → Upserting to Qdrant...`)
    await qdrantDeleteByArticle(articleId)
    await insertChunks(splitChunks, embeddings, enrichedTexts)

    newHashes[articleId] = hash
    totalIngested += splitChunks.length
    console.log(`  ✅ ${articleId} — ${splitChunks.length} chunks ingested`)
  }

  // Cleanup: remove articles from Qdrant that no longer have chunk files.
  // Excludes article IDs owned by other ingest scripts that share this same
  // hash-tracking store (e.g. "resume", populated by ingest-resume.ts and
  // never backed by a scripts/chunks/*.json file) — those aren't orphans.
  const EXTERNALLY_MANAGED_ARTICLE_IDS = new Set(['resume'])
  const activeArticleIds = new Set(chunkFiles.map(f => basename(f, '.json')))
  for (const articleId of Object.keys(newHashes)) {
    if (EXTERNALLY_MANAGED_ARTICLE_IDS.has(articleId)) continue
    if (!activeArticleIds.has(articleId)) {
      console.log(`  🗑  ${articleId} — removed from index (no chunk file)`)
      await qdrantDeleteByArticle(articleId)
      await qdrantDeleteHash(articleId).catch(() => {})
      delete newHashes[articleId]
    }
  }

  await saveHashes(newHashes)

  console.log(`\n✅ Ingestion complete: ${totalIngested} ingested, ${totalSkipped} skipped`)
}

main().catch(err => {
  // Runtime errors from third-party services (OpenAI quota, Qdrant outage,
  // network hiccups) must NOT block the web deploy. Config errors throw early
  // (before main() runs) so by this point we're past validation and any error
  // is operational — log it loudly and exit 0 so the rest of the build
  // pipeline continues. The RAG index will catch up on the next build.
  const status = (err as { status?: number } | null)?.status
  const code = (err as { code?: string } | null)?.code
  console.error('❌ RAG ingestion failed (non-blocking):', err.message)
  if (status) console.error(`   HTTP status: ${status}`)
  if (code) console.error(`   Error code: ${code}`)
  console.error('   Build will continue; RAG index may be stale until next successful ingest.')
  process.exit(0)
})
