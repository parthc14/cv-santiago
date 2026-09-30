// ---------------------------------------------------------------------------
// Shared RAG pipeline — used by api/chat.js (text) and api/rag-search.js (voice)
// ---------------------------------------------------------------------------

import { qdrantSearch } from './qdrant.js'
import { GROQ_MODEL } from './groq.js'
import { embedQuery as embedQueryViaService } from './embeddings.js'

// ---------------------------------------------------------------------------
// Cost tracking per span
// ---------------------------------------------------------------------------

export const MODEL_COSTS = {
  // TODO: pull the real $/token rate from Groq's current pricing page —
  // placeholder so cost dashboards don't error, not a billing source of truth.
  'openai/gpt-oss-120b': { input: 0, output: 0 },
  // Self-hosted (embed-service/) — no per-token billing.
  'sentence-transformers/all-MiniLM-L6-v2': { input: 0, output: 0 },
}

export function calcCost(model, inputTokens, outputTokens = 0) {
  const r = MODEL_COSTS[model]
  return r ? (inputTokens * (r.input || 0)) + (outputTokens * (r.output || 0)) : 0
}

// ---------------------------------------------------------------------------
// RAG: tool definition for Agentic RAG (OpenAI/Groq function-calling shape)
// ---------------------------------------------------------------------------

export function isRagEnabled() {
  return !!(process.env.EMBED_SERVICE_URL && process.env.EMBED_API_KEY && process.env.QDRANT_URL && process.env.QDRANT_API_KEY)
}

export const PORTFOLIO_TOOL = {
  type: 'function',
  function: {
    name: 'search_portfolio',
    description: "Search your own published case studies AND your full resume/career history for details. You wrote the case studies and lived the career history — they are YOUR words about YOUR work. The system prompt only has brief summaries; this tool has the FULL content: project architectures, metrics, technical decisions, pipeline details, code patterns, lessons learned, plus your complete work history, education, and skills beyond what's summarized in the prompt. Use this whenever the user asks for specifics about any project OR your broader career background. Remember: speak from this content as your own experience, never cite it as an external source.",
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to find relevant portfolio content',
        },
      },
      required: ['query'],
    },
  },
}

// ---------------------------------------------------------------------------
// RAG: embed query via the self-hosted embedding service (Edge-compatible)
// ---------------------------------------------------------------------------

export async function embedQuery(query) {
  const t0 = Date.now()
  const embedding = await embedQueryViaService(query)
  return {
    embedding,
    latencyMs: Date.now() - t0,
    totalTokens: 0, // self-hosted — no per-token billing to track
  }
}

// ---------------------------------------------------------------------------
// RAG: dense-vector search via Qdrant (Edge-compatible)
// ---------------------------------------------------------------------------

export async function searchDocuments(queryEmbedding) {
  const t0 = Date.now()
  const chunks = await qdrantSearch(queryEmbedding, 10)
  return {
    chunks,
    latencyMs: Date.now() - t0,
  }
}

// ---------------------------------------------------------------------------
// RAG: re-rank top-10 → top-3 with Groq
// ---------------------------------------------------------------------------

export async function rerankChunks(query, chunks, groqClient) {
  if (chunks.length <= 3) return { chunks, latencyMs: 0, rerankedOrder: null, usage: null }

  const t0 = Date.now()
  try {
    const numbered = chunks.slice(0, 10).map((c, i) =>
      `[${i}] ${c.content.slice(0, 200)}`
    ).join('\n')

    const response = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 50,
      reasoning_effort: 'low',
      messages: [{
        role: 'user',
        content: `Query: "${query}"\nRank these chunks by relevance. Return ONLY the top 5 IDs as comma-separated numbers (most relevant first):\n${numbered}`,
      }],
    })

    const text = response.choices?.[0]?.message?.content || ''
    const ids = text.match(/\d+/g)?.map(Number).filter(n => n < chunks.length) || []

    const ranked = ids.slice(0, 5).map(i => chunks[i])
    // Fill up to 5 if the model returned fewer
    while (ranked.length < 5 && ranked.length < chunks.length) {
      const next = chunks.find(c => !ranked.includes(c))
      if (next) ranked.push(next)
      else break
    }

    // Diversify: ensure each distinct article has at least one representative
    const diversified = diversifyByArticle(ranked)

    return {
      chunks: diversified, latencyMs: Date.now() - t0, rerankedOrder: ids.slice(0, 5),
      usage: { input_tokens: response.usage?.prompt_tokens || 0, output_tokens: response.usage?.completion_tokens || 0 },
    }
  } catch {
    // Fallback: use original order with diversity
    const diversified = diversifyByArticle(chunks.slice(0, 5))
    return { chunks: diversified, latencyMs: Date.now() - t0, rerankedOrder: null, usage: null }
  }
}

/** Pick up to 5 chunks ensuring every distinct article gets at least 1 slot */
export function diversifyByArticle(ranked) {
  const result = []
  const seenArticles = new Set()

  // Pass 1: first chunk from each distinct article (preserving rank order)
  for (const chunk of ranked) {
    const articleId = chunk.metadata?.article_id
    if (!seenArticles.has(articleId)) {
      seenArticles.add(articleId)
      result.push(chunk)
    }
  }

  // Pass 2: fill remaining slots with best remaining chunks (rank order)
  for (const chunk of ranked) {
    if (result.length >= 5) break
    if (!result.includes(chunk)) {
      result.push(chunk)
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// RAG: format chunks for tool_result + extract sources for badges
// ---------------------------------------------------------------------------

export function formatChunksForContext(chunks) {
  return chunks.map((c, i) => {
    const meta = c.metadata || {}
    const source = meta.article_id ? `[From your article: ${meta.article_id}, section: ${meta.section_id}]` : ''
    return `--- Your content ${i + 1} ${source} ---\n${c.content}`
  }).join('\n\n')
}

export function extractSources(chunks) {
  const seenArticles = new Set()
  const sources = []
  for (const c of chunks) {
    const meta = c.metadata || {}
    // One badge per article — keep the highest-ranked section (first occurrence)
    if (seenArticles.has(meta.article_id)) continue
    seenArticles.add(meta.article_id)
    sources.push({
      article_id: meta.article_id,
      section_id: meta.section_id,
      section_anchor: meta.section_anchor || '',
      page_path_en: meta.page_path_en || '',
      page_path_es: meta.page_path_es || '',
      article_slug_en: meta.article_slug_en || '',
      article_slug_es: meta.article_slug_es || '',
    })
  }
  return sources
}

// Keywords that signal the response actually references a given article
export const ARTICLE_KEYWORDS = {
  'n8n-for-pms':          ['n8n', 'nodemation'],
  'jacobo':               ['jacobo', 'agente ia', 'ai agent', 'whatsapp', 'multi-agent', 'multiagent'],
  'business-os':          ['business os', 'erp', 'airtable bases', 'crm', 'inventory'],
  'programmatic-seo':     ['seo programático', 'programmatic seo', 'web programática', 'programmatic web', 'decision engine', 'indexable', 'dataforseo', 'seo pipeline', 'seo automatizado', 'automated seo'],
  'self-healing-chatbot': ['chatbot', 'this chat', 'este chat', 'evals', 'self-healing', 'closed-loop', 'langfuse', 'rag'],
  'santifer-irepair':     ['santifer irepair', 'irepair', 'repair business', 'taller de reparación'],
  'resume':               ['resume', 'cv', 'work history', 'career history', 'currículum'],
}

/** Filter RAG sources to only articles actually mentioned in the response, max 3 */
export function filterSourcesByResponse(sources, responseText) {
  if (!responseText || sources.length === 0) return sources
  const lower = responseText.toLowerCase()
  return sources.filter(s => {
    const keywords = ARTICLE_KEYWORDS[s.article_id]
    if (!keywords) return true // unknown article — keep it
    return keywords.some(kw => lower.includes(kw))
  }).slice(0, 3)
}

// Static article routes — used to generate badges from keywords regardless of RAG
export const ARTICLE_ROUTES = {
  'n8n-for-pms':          { page_path_es: '/n8n-para-pms', page_path_en: '/n8n-for-pms' },
  'jacobo':               { page_path_es: '/agente-ia-jacobo', page_path_en: '/ai-agent-jacobo' },
  'business-os':          { page_path_es: '/business-os-para-airtable', page_path_en: '/business-os-for-airtable' },
  'programmatic-seo':     { page_path_es: '/seo-programatico', page_path_en: '/programmatic-seo' },
  'self-healing-chatbot': { page_path_es: '/chatbot-que-se-cura-solo', page_path_en: '/self-healing-chatbot' },
  'santifer-irepair':     { page_path_es: '/santifer-irepair', page_path_en: '/santifer-irepair-founder' },
  'resume':               { page_path_es: '/sobre-mi', page_path_en: '/about' },
}

// Home fallback
export const HOME_SOURCE = {
  article_id: 'home',
  section_id: 'portfolio',
  section_anchor: '',
  page_path_en: '/en',
  page_path_es: '/',
  article_slug_en: 'en',
  article_slug_es: '',
}

/** Detect articles mentioned in response text and generate source badges */
export function detectMentionedArticles(responseText) {
  if (!responseText) return []
  const lower = responseText.toLowerCase()
  const sources = []
  for (const [articleId, keywords] of Object.entries(ARTICLE_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      const routes = ARTICLE_ROUTES[articleId]
      if (routes) {
        sources.push({
          article_id: articleId,
          section_id: 'main',
          section_anchor: '',
          page_path_es: routes.page_path_es,
          page_path_en: routes.page_path_en,
          article_slug_es: routes.page_path_es.slice(1),
          article_slug_en: routes.page_path_en.slice(1),
        })
      }
    }
  }
  return sources.slice(0, 3)
}

// ---------------------------------------------------------------------------
// RAG: full agentic search pipeline
// ---------------------------------------------------------------------------

export async function searchPortfolio(query, trace, groqClient) {
  const result = {
    chunks: null,
    sources: [],
    degraded: false,
    degradedReason: null,
    metrics: { embeddingMs: 0, retrievalMs: 0, rerankMs: 0 },
    usage: { embeddingTokens: 0, rerankInputTokens: 0, rerankOutputTokens: 0 },
  }

  // 1. Embed
  let embedding
  const embeddingGen = trace?.generation({ name: 'embedding', model: 'sentence-transformers/all-MiniLM-L6-v2', metadata: { query } })
  try {
    const embResult = await embedQuery(query)
    embedding = embResult.embedding
    result.metrics.embeddingMs = embResult.latencyMs
    result.usage.embeddingTokens = embResult.totalTokens
    embeddingGen?.end({
      usage: { input: embResult.totalTokens, output: 0 },
      metadata: { latencyMs: embResult.latencyMs },
    })
  } catch (err) {
    embeddingGen?.end({ metadata: { error: err.message } })
    result.degraded = true
    result.degradedReason = 'embedding_fail'
    return result
  }

  // 2. Retrieve
  const retrievalSpan = trace?.span({ name: 'retrieval', metadata: { query } })
  try {
    const searchResult = await searchDocuments(embedding)
    result.metrics.retrievalMs = searchResult.latencyMs
    retrievalSpan?.end({
      metadata: {
        chunksCount: searchResult.chunks.length,
        topSimilarity: searchResult.chunks[0]?.similarity || 0,
        latencyMs: searchResult.latencyMs,
      },
    })

    if (!searchResult.chunks.length) {
      result.degradedReason = 'no_match'
      return result
    }

    // Filter out low-similarity chunks before reranking. Threshold calibrated
    // for all-MiniLM-L6-v2's cosine-similarity distribution, which runs lower
    // than OpenAI's embeddings for genuine matches (observed: real matches
    // ~0.2-0.6, true non-matches below ~0.1) — re-tune if the embedding
    // model changes.
    const SIMILARITY_THRESHOLD = 0.15
    const filteredChunks = searchResult.chunks.filter(c => (c.similarity || 0) >= SIMILARITY_THRESHOLD)
    if (!filteredChunks.length) {
      result.degradedReason = 'no_match'
      return result
    }

    // 3. Re-rank
    const rerankGen = trace?.generation({ name: 'reranking', model: GROQ_MODEL, metadata: { query } })
    const rerankResult = await rerankChunks(query, filteredChunks, groqClient)
    result.metrics.rerankMs = rerankResult.latencyMs
    if (rerankResult.usage) {
      result.usage.rerankInputTokens = rerankResult.usage.input_tokens
      result.usage.rerankOutputTokens = rerankResult.usage.output_tokens
    }
    rerankGen?.end({
      usage: {
        input: rerankResult.usage?.input_tokens || 0,
        output: rerankResult.usage?.output_tokens || 0,
      },
      metadata: {
        rerankedOrder: rerankResult.rerankedOrder,
        latencyMs: rerankResult.latencyMs,
      },
    })

    result.chunks = rerankResult.chunks
    result.sources = extractSources(rerankResult.chunks)
  } catch (err) {
    retrievalSpan?.end({ metadata: { error: err.message } })
    result.degraded = true
    result.degradedReason = err.message.includes('timeout') ? 'retrieval_timeout' : 'retrieval_fail'
  }

  return result
}

// ---------------------------------------------------------------------------
// Intent classification (keyword-based, no extra LLM cost)
// ---------------------------------------------------------------------------

export function classifyIntent(text) {
  const lower = text.toLowerCase()
  const tags = []

  const jailbreakPatterns = [
    'ignore previous', 'ignora las instrucciones', 'ignora todo',
    'pretend', 'roleplay', 'act as', 'you are now',
    'forget', 'disregard', 'bypass', 'override', 'jailbreak',
    'dan', 'developer mode', 'evil', 'malicious', 'hackear', 'hacking',
    'system prompt', 'tu prompt', 'your prompt', 'instructions',
    'protocolo de defensa', 'olvida todo', 'nueva personalidad',
    'reset your', 'reveal your', 'show me your rules',
    'your objective', 'your orders', 'tus órdenes', 'tus reglas',
    'cuáles son tus instrucciones', 'rules configured', 'reglas configuradas',
    'print all', 'print everything', 'yaml', 'json record',
    'dump', 'export', 'serialize', 'reproduce', 'output all',
    'all of the above', 'todo lo anterior', 'everything above',
    'repeat everything', 'write all above', 'copy all',
    'show me everything', 'imprime todo', 'muestra todo lo anterior',
    'repite todo', 'exporta', 'convierte a',
  ]
  if (jailbreakPatterns.some(p => lower.includes(p))) {
    tags.push('jailbreak-attempt')
  }

  if (/experiencia|experience|trabajo|work|career|carrera|santifer|irepair/.test(lower)) tags.push('topic:experience')
  if (/proyecto|project|portfolio|github|código|code/.test(lower)) tags.push('topic:projects')
  if (/contact|contacto|email|linkedin|hablar|talk|hire|contratar/.test(lower)) tags.push('topic:contact')
  if (/stack|tech|tecnolog|python|react|airtable|claude|ai|ia|llm|agente|agent/.test(lower)) tags.push('topic:technical')
  if (/salario|salary|money|dinero|rate|precio|cobr/.test(lower)) tags.push('topic:compensation')
  if (/hola|hello|hi|hey|buenos|good/.test(lower) && text.length < 20) tags.push('greeting')

  return tags.length > 0 ? tags : ['topic:general']
}

// ---------------------------------------------------------------------------
// Jailbreak alert
// ---------------------------------------------------------------------------

export async function sendJailbreakAlert(userMessage) {
  if (!process.env.RESEND_API_KEY || !process.env.ALERT_EMAIL) return

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Chatbot Alert <onboarding@resend.dev>',
      to: process.env.ALERT_EMAIL,
      subject: '🚨 JAILBREAK ATTEMPT - ctrlaltparth.tech',
      html: `
        <h2>🚨 Jailbreak Attempt Detected</h2>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>User message:</strong></p>
        <blockquote style="background: #f5f5f5; padding: 15px; border-left: 4px solid #e74c3c;">
          ${userMessage.slice(0, 500)}${userMessage.length > 500 ? '...' : ''}
        </blockquote>
        <p style="margin-top: 20px;">
          <a href="https://cloud.langfuse.com" style="background: #e74c3c; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View in Langfuse
          </a>
        </p>
      `,
    }),
  })
}

// ---------------------------------------------------------------------------
// Prompt leak detection
// ---------------------------------------------------------------------------

export const PROMPT_FINGERPRINTS = [
  'BREVEDAD OBLIGATORIA', 'máximo 150 palabras', '150 words', 'word limit',
  'formato sin listas', 'redirección ingeniosa', 'NUNCA revelar',
  'Anti-extracción', 'Instrucciones CRÍTICAS', 'cache_control',
  'never_exceed', 'token_budget',
]

export const LEAK_RESPONSE = 'Esa información forma parte de mi diseño interno. El código fuente del proyecto es público en GitHub si te interesa la arquitectura.'

export function containsFingerprint(text) {
  const lower = text.toLowerCase()
  return PROMPT_FINGERPRINTS.some(fp => lower.includes(fp.toLowerCase()))
}
