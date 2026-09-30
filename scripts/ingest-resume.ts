/**
 * Resume Ingestion: parse a resume with Groq (mirroring the schema/approach
 * from the separate `hiremeai` project's Python resume parser) and upsert
 * the result as RAG chunks into the same Qdrant collection the chatbot
 * already searches (article_id: "resume").
 *
 * Requires env vars:
 *   EMBED_SERVICE_URL, EMBED_API_KEY, QDRANT_URL, QDRANT_API_KEY, GROQ_API_KEY_NEW
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.app.json scripts/ingest-resume.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
config() // also load .env as fallback

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { getGroqClient, GROQ_MODEL } from '../api/_shared/groq.js'
import { embedTexts as embedTextsViaService } from '../api/_shared/embeddings.js'
import {
  qdrantEnsureCollection, qdrantUpsert, qdrantDeleteByArticle,
  qdrantGetHashes, qdrantSaveHashes,
} from '../api/_shared/qdrant.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const RESUME_FILE = resolve(root, 'content/resume.md')

const ARTICLE_ID = 'resume'

// ---------------------------------------------------------------------------
// Types — mirrors hiremeai/backend/main.py's Resume/Experience Pydantic
// models, plus a `summary` field to capture the resume's career-summary
// paragraph (not present in the original Python schema, but present in the
// source text and worth keeping as a chunk).
// ---------------------------------------------------------------------------

interface Experience {
  company: string | null
  role: string | null
  duration: string | null
  description: string | null
  skills_used: string[]
}

interface Resume {
  name: string | null
  email: string | null
  phone: string | null
  total_experience_years: number | null
  summary: string | null
  skills: string[]
  experiences: Experience[]
  education: string[]
  projects: string[]
  certifications: string[]
}

interface ResumeChunk {
  section_id: string
  content: string
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Resume parsing (adapted from hiremeai/backend/main.py's parse_resume())
// ---------------------------------------------------------------------------

const RESUME_SCHEMA_DESCRIPTION = `{
  "name": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "total_experience_years": "number or null",
  "summary": "string or null — the career-summary paragraph, if present",
  "skills": ["string", "..."],
  "experiences": [
    {
      "company": "string or null",
      "role": "string or null",
      "duration": "string or null",
      "description": "string or null — combine all bullets for this role into one paragraph",
      "skills_used": ["string", "..."]
    }
  ],
  "education": ["string", "..."],
  "projects": ["string", "..."],
  "certifications": ["string", "..."]
}`

async function parseResume(resumeText: string): Promise<Resume> {
  const groq = getGroqClient()

  const systemPrompt = `You are an expert resume parser.

Extract information from the resume based on its meaning, not only based on exact section headings.
Different resumes may use different headings for the same content (e.g. "Experience", "Work History").

Return ONLY valid JSON matching this schema:

${RESUME_SCHEMA_DESCRIPTION}

Important rules:
1. Do not invent information.
2. If a value is not available, return null.
3. If a list has no information, return an empty list.
4. Include internships inside experiences.
5. Extract skills mentioned across the entire resume, not just a "Skills" section.`

  const userPrompt = `Parse the following resume:\n\n${resumeText}`

  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    reasoning_effort: 'low',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  })

  const raw = response.choices[0]?.message?.content || '{}'
  return JSON.parse(raw) as Resume
}

// ---------------------------------------------------------------------------
// Chunking
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildChunks(resume: Resume): ResumeChunk[] {
  const chunks: ResumeChunk[] = []

  const profileParts: string[] = []
  if (resume.name) profileParts.push(`Name: ${resume.name}`)
  if (resume.total_experience_years) profileParts.push(`Total professional experience: ${resume.total_experience_years} years`)
  if (resume.summary) profileParts.push(resume.summary)
  if (profileParts.length) {
    chunks.push({ section_id: 'profile', content: profileParts.join('\n') })
  }

  for (const exp of resume.experiences || []) {
    if (!exp.company && !exp.description) continue
    const parts: string[] = []
    const header = [exp.role, exp.company].filter(Boolean).join(' at ')
    if (header) parts.push(exp.duration ? `${header} (${exp.duration})` : header)
    if (exp.description) parts.push(exp.description)
    if (exp.skills_used?.length) parts.push(`Skills used: ${exp.skills_used.join(', ')}`)
    chunks.push({
      section_id: `experience-${slugify(exp.company || exp.role || 'role')}`,
      content: parts.join('\n'),
    })
  }

  if (resume.skills?.length) {
    chunks.push({ section_id: 'skills', content: `Skills: ${resume.skills.join(', ')}` })
  }

  if (resume.education?.length) {
    chunks.push({ section_id: 'education', content: resume.education.join('\n') })
  }

  resume.projects?.forEach((project, i) => {
    if (project) chunks.push({ section_id: `project-${i + 1}`, content: project })
  })

  if (resume.certifications?.length) {
    chunks.push({ section_id: 'certifications', content: resume.certifications.join('\n') })
  }

  return chunks
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🔄 Resume ingestion starting...\n')

  if (!process.env.EMBED_SERVICE_URL || !process.env.EMBED_API_KEY || !process.env.QDRANT_URL || !process.env.QDRANT_API_KEY || !process.env.GROQ_API_KEY_NEW) {
    console.log('⚠️  Missing env vars (EMBED_SERVICE_URL, EMBED_API_KEY, QDRANT_URL, QDRANT_API_KEY, GROQ_API_KEY_NEW)')
    console.log('   Skipping resume ingestion. Set env vars to enable.\n')
    process.exit(0)
  }

  if (!existsSync(RESUME_FILE)) {
    console.log(`⚠️  No resume file found at ${RESUME_FILE}. Skipping.`)
    process.exit(0)
  }

  await qdrantEnsureCollection()

  const resumeText = readFileSync(RESUME_FILE, 'utf-8')
  const hash = createHash('sha256').update(resumeText).digest('hex').slice(0, 16)

  const hashes = await qdrantGetHashes()
  if (hashes[ARTICLE_ID] === hash) {
    console.log(`  ⏭  resume — no changes (hash: ${hash})`)
    console.log('\n✅ Resume ingestion complete: 0 ingested, 1 skipped')
    return
  }

  console.log(`  📝 resume — hash changed: ${hashes[ARTICLE_ID] || 'new'} → ${hash}`)
  console.log('     → Parsing resume with Groq...')
  const resume = await parseResume(resumeText)

  const chunks = buildChunks(resume)
  console.log(`     → Built ${chunks.length} chunks (${resume.experiences?.length || 0} experiences)`)

  console.log(`     → Embedding ${chunks.length} chunks...`)
  const embeddings = await embedTextsViaService(chunks.map(c => c.content))

  console.log('     → Upserting to Qdrant...')
  await qdrantDeleteByArticle(ARTICLE_ID)
  await qdrantUpsert(
    chunks.map(c => ({
      content: c.content,
      metadata: {
        article_id: ARTICLE_ID,
        article_slug_en: '',
        article_slug_es: '',
        section_id: c.section_id,
        section_anchor: '',
        page_path_en: '/about',
        page_path_es: '/sobre-mi',
        source_file: 'content/resume.md',
        format: 'plaintext',
      },
    })),
    embeddings,
  )

  await qdrantSaveHashes({ ...hashes, [ARTICLE_ID]: hash })

  console.log(`  ✅ resume — ${chunks.length} chunks ingested`)
  console.log(`\n✅ Resume ingestion complete: ${chunks.length} ingested, 0 skipped`)
}

main().catch(err => {
  // Same non-blocking philosophy as ingest-rag.ts — a resume-parsing hiccup
  // must never break the site build.
  console.error('❌ Resume ingestion failed (non-blocking):', err.message)
  console.error('   Build will continue; resume RAG data may be stale until next successful ingest.')
  process.exit(0)
})
