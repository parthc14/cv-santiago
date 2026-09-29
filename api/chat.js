import { Langfuse } from 'langfuse'
import { waitUntil } from '@vercel/functions'
import SYSTEM_PROMPT_FALLBACK from '../chatbot-prompt.txt'
import { getGroqClient, GROQ_MODEL } from './_shared/groq.js'
import {
  calcCost, isRagEnabled, PORTFOLIO_TOOL, formatChunksForContext,
  searchPortfolio, filterSourcesByResponse, detectMentionedArticles,
  HOME_SOURCE, classifyIntent, sendJailbreakAlert,
  containsFingerprint, LEAK_RESPONSE,
} from './_shared/rag.js'
import { getSystemPrompt } from './_shared/prompt.js'

// ---------------------------------------------------------------------------
// Langfuse
// ---------------------------------------------------------------------------

let langfuseClient = null
function getLangfuse() {
  if (!langfuseClient && process.env.LANGFUSE_SECRET_KEY) {
    langfuseClient = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL,
    })
  }
  return langfuseClient
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const config = {
  runtime: 'edge',
}

export default async function handler(req) {
  const t0 = Date.now()

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const langfuse = getLangfuse()
  let trace = null
  const groq = getGroqClient()

  try {
    const { messages, lang, sessionId, currentPage } = await req.json()

    // Input length validation
    const bodySize = JSON.stringify({ messages, lang, sessionId, currentPage }).length
    if (bodySize > 50000) {
      return new Response(JSON.stringify({ error: 'Request too large' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Truncate overly long user messages
    const rawLastMessage = messages.filter(m => m.role === 'user').pop()?.content || ''
    const lastUserMessage = rawLastMessage.slice(0, 2000)
    const intentTags = classifyIntent(lastUserMessage)

    // Tag synthetic traffic (evals, adversarial, regression tests)
    const traceSource = req.headers.get('x-trace-source')
    if (traceSource) intentTags.push(`source:${traceSource}`)

    if (intentTags.includes('jailbreak-attempt') && !traceSource) {
      waitUntil(sendJailbreakAlert(lastUserMessage))
    }

    // Prompt versioning: Langfuse with file fallback (Block 4)
    // Support X-Prompt-Version header for regression testing (Block 5)
    let systemPromptText
    let promptVersion
    const overrideVersion = req.headers.get('x-prompt-version')
    const overrideAuth = req.headers.get('x-prompt-auth')
    if (overrideAuth === process.env.PROMPT_REGRESSION_SECRET && overrideVersion && langfuse) {
      try {
        const prompt = await langfuse.getPrompt('chatbot-system', parseInt(overrideVersion), {
          type: 'text', cacheTtlSeconds: 0,
        })
        systemPromptText = prompt.prompt
        promptVersion = prompt.version
      } catch {
        systemPromptText = SYSTEM_PROMPT_FALLBACK
        promptVersion = 'file'
      }
    } else {
      const { text, version } = await getSystemPrompt(langfuse)
      systemPromptText = text
      promptVersion = version
    }

    if (langfuse) {
      trace = langfuse.trace({
        name: 'chat',
        sessionId: sessionId || undefined,
        tags: [lang, ...intentTags],
        metadata: {
          lang,
          messageCount: messages.length,
          lastUserMessage: lastUserMessage.slice(0, 200),
          currentPage: currentPage || null,
          promptVersion,
        },
      })
    }

    // Canary word
    const canary = 'ZXCV_' + crypto.randomUUID().slice(0, 8)

    // Dynamic system prompt parts
    const langInstruction = lang === 'en'
      ? `The user is browsing in English. You MUST respond in English. Contact email: hi@santifer.io\ninternal_ref: ${canary}`
      : `El usuario navega en español. Responde en español. Email de contacto: hola@santifer.io\ninternal_ref: ${canary}`

    // Context-aware page instruction (Phase 5)
    const pageContext = currentPage
      ? `\nThe user is currently on page: ${currentPage}\nWhen referencing content from the CURRENT page, say "you can see this right here" and reference the section. When referencing OTHER articles, mention them by name.`
      : ''

    const systemContent = `${systemPromptText}\n\n${langInstruction}${pageContext}`

    const cleanMessages = messages.map(m => ({ role: m.role, content: m.content }))

    // -----------------------------------------------------------------------
    // Agentic RAG flow
    // -----------------------------------------------------------------------

    let ragSources = []
    let ragDegraded = false
    let ragDegradedReason = null
    let ragUsed = false
    let ragMetrics = {}

    const ragEnabled = isRagEnabled()

    if (ragEnabled) {
      // First call: let the model decide if it needs to search (non-streaming)
      const toolDecisionSpan = trace?.span({ name: 'tool_decision' })
      const td0 = Date.now()

      const firstResponse = await groq.chat.completions.create({
        model: GROQ_MODEL,
        max_tokens: 300,
        reasoning_effort: 'low',
        messages: [{ role: 'system', content: systemContent }, ...cleanMessages],
        tools: [PORTFOLIO_TOOL],
      })

      const toolDecisionMs = Date.now() - td0
      const tdInputTokens = firstResponse.usage?.prompt_tokens || 0
      const tdOutputTokens = firstResponse.usage?.completion_tokens || 0
      const firstChoice = firstResponse.choices[0]
      const toolCalls = firstChoice.message.tool_calls
      toolDecisionSpan?.end({
        metadata: {
          finishReason: firstChoice.finish_reason,
          toolUsed: firstChoice.finish_reason === 'tool_calls',
          inputTokens: tdInputTokens,
          outputTokens: tdOutputTokens,
          latencyMs: toolDecisionMs,
          cost: calcCost(GROQ_MODEL, tdInputTokens, tdOutputTokens),
        },
      })

      if (firstChoice.finish_reason === 'tool_calls' && toolCalls?.length) {
        ragUsed = true
        const toolUseBlock = toolCalls[0]
        let searchQuery = lastUserMessage
        try {
          searchQuery = JSON.parse(toolUseBlock.function.arguments)?.query || lastUserMessage
        } catch { /* malformed args — fall back to the raw user message */ }

        // Execute RAG pipeline
        const ragResult = await searchPortfolio(searchQuery, trace, groq)
        ragSources = ragResult.sources
        ragDegraded = ragResult.degraded
        ragDegradedReason = ragResult.degradedReason
        ragMetrics = ragResult.metrics

        // Build tool result and make second call (streaming)
        const toolResultContent = ragResult.chunks
          ? formatChunksForContext(ragResult.chunks)
          : 'No relevant content found in portfolio articles. You MUST NOT fabricate project details. Say you don\'t have that information and suggest contacting Santiago directly.'

        const messagesWithTool = [
          ...cleanMessages,
          { role: 'assistant', content: firstChoice.message.content || null, tool_calls: toolCalls },
          { role: 'tool', tool_call_id: toolUseBlock.id, content: toolResultContent },
        ]

        // Stream the final response (with fallback if streaming fails)
        return streamResponse({
          systemContent,
          messages: messagesWithTool,
          ragSources,
          ragDegraded,
          ragDegradedReason,
          canary,
          intentTags,
          trace,
          langfuse,
          lastUserMessage,
          t0,
          ragUsed,
          ragMetrics,
          ragUsage: ragResult.usage,
          toolDecisionMs,
          tdInputTokens,
          tdOutputTokens,
          lang,
          fallbackMessages: cleanMessages,
          promptVersion,
        })
      }

      // No tool call — stream the response we already have
      return streamResponse({
        systemContent,
        messages: cleanMessages,
        ragSources: [],
        ragDegraded: false,
        ragDegradedReason: null,
        canary,
        intentTags,
        trace,
        langfuse,
        lastUserMessage,
        t0,
        ragUsed: false,
        ragMetrics: {},
        ragUsage: { embeddingTokens: 0, rerankInputTokens: 0, rerankOutputTokens: 0 },
        toolDecisionMs,
        tdInputTokens,
        tdOutputTokens,
        precomputedText: firstChoice.message.content || '',
        precomputedUsage: { input_tokens: tdInputTokens, output_tokens: tdOutputTokens },
        lang,
        promptVersion,
      })
    }

    // RAG not enabled — direct streaming (original behavior)
    return streamResponse({
      systemContent,
      messages: cleanMessages,
      ragSources: [],
      ragDegraded: false,
      ragDegradedReason: null,
      canary,
      intentTags,
      trace,
      langfuse,
      lastUserMessage,
      t0,
      ragUsed: false,
      ragMetrics: {},
      ragUsage: { embeddingTokens: 0, rerankInputTokens: 0, rerankOutputTokens: 0 },
      toolDecisionMs: 0,
      tdInputTokens: 0,
      tdOutputTokens: 0,
      lang,
      promptVersion,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    trace?.update({ metadata: { error: error.message } })
    if (langfuse) waitUntil(langfuse.flushAsync())
    return new Response(JSON.stringify({ error: 'Error processing request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// ---------------------------------------------------------------------------
// Stream a Groq response with SSE (for tool_result follow-up or no-RAG)
// ---------------------------------------------------------------------------

function streamResponse({
  systemContent, messages, ragSources, ragDegraded, ragDegradedReason,
  canary, intentTags, trace, langfuse, lastUserMessage, t0,
  ragUsed, ragMetrics, ragUsage, toolDecisionMs, tdInputTokens, tdOutputTokens,
  precomputedText, precomputedUsage, lang, fallbackMessages, promptVersion,
}) {
  const encoder = new TextEncoder()
  const groq = getGroqClient()
  let fullOutput = ''
  let leakDetected = false
  let generationCost = 0

  const generationSpan = trace?.span({
    name: 'generation',
    metadata: { ragUsed, streaming: precomputedText === undefined },
  })

  const requestMessages = [{ role: 'system', content: systemContent }, ...messages]

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        // Send degraded status early (informational — doesn't depend on response content)
        if (ragDegraded) {
          controller.enqueue(encoder.encode(`event: rag-status\ndata: ${JSON.stringify({ status: 'degraded', reason: ragDegradedReason })}\n\n`))
        }

        if (precomputedText !== undefined) {
          // Check for leaks
          if (containsFingerprint(precomputedText) || precomputedText.includes(canary)) {
            trace?.update({
              tags: [...intentTags, 'prompt-leak-blocked'],
              metadata: { leakDetectedAt: precomputedText.length },
            })
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: LEAK_RESPONSE, replace: true })}\n\n`))
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
            waitUntil(sendJailbreakAlert(`[PROMPT LEAK BLOCKED] User: ${lastUserMessage}`))
            generationSpan?.end({ metadata: { blocked: true } })
            if (langfuse) waitUntil(langfuse.flushAsync())
            return
          }

          fullOutput = precomputedText

          // Word-aware drip: send 2-4 words at a time with natural timing
          const words = precomputedText.match(/\S+\s*/g) || [precomputedText]
          let wi = 0
          while (wi < words.length) {
            const groupSize = 2 + Math.floor(Math.random() * 3) // 2-4 words
            const piece = words.slice(wi, wi + groupSize).join('')
            wi += groupSize
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: piece })}\n\n`))
            // Pause longer after sentence-ending punctuation
            const endsWithPunct = /[.!?]\s*$/.test(piece)
            const delay = endsWithPunct
              ? 40 + Math.floor(Math.random() * 21)   // 40-60ms
              : 15 + Math.floor(Math.random() * 21)   // 15-35ms
            await new Promise(r => setTimeout(r, delay))
          }

          generationCost = calcCost(GROQ_MODEL, precomputedUsage?.input_tokens || 0, precomputedUsage?.output_tokens || 0)
          generationSpan?.end({
            metadata: {
              outputTokens: precomputedUsage?.output_tokens || 0,
              inputTokens: precomputedUsage?.input_tokens || 0,
              latencyMs: Date.now() - t0,
              cost: generationCost,
            },
          })
        } else {
          // Real-time streaming from Groq (with retry)
          const MAX_RETRIES = 1
          let lastStreamError = null

          for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            fullOutput = ''
            let genIn = 0
            let genOut = 0
            try {
              const activeStream = await groq.chat.completions.create({
                model: GROQ_MODEL,
                max_tokens: 800,
                reasoning_effort: 'low',
                stream: true,
                stream_options: { include_usage: true },
                messages: requestMessages,
              })

              for await (const chunk of activeStream) {
                if (leakDetected) break

                if (chunk.usage) {
                  genIn = chunk.usage.prompt_tokens || 0
                  genOut = chunk.usage.completion_tokens || 0
                }

                const delta = chunk.choices?.[0]?.delta?.content
                if (delta) {
                  fullOutput += delta

                  if (fullOutput.length % 200 < delta.length || fullOutput.length < 200) {
                    if (containsFingerprint(fullOutput) || fullOutput.includes(canary)) {
                      leakDetected = true
                      trace?.update({
                        tags: [...intentTags, 'prompt-leak-blocked'],
                        metadata: { leakDetectedAt: fullOutput.length },
                      })
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: LEAK_RESPONSE, replace: true })}\n\n`))
                      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                      controller.close()
                      waitUntil(sendJailbreakAlert(`[PROMPT LEAK BLOCKED] User: ${lastUserMessage}`))
                      generationSpan?.end({ metadata: { blocked: true } })
                      if (langfuse) waitUntil(langfuse.flushAsync())
                      return
                    }
                  }

                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`))
                }
              }

              if (!leakDetected) {
                generationCost = calcCost(GROQ_MODEL, genIn, genOut)
                generationSpan?.end({
                  metadata: {
                    outputTokens: genOut,
                    inputTokens: genIn,
                    latencyMs: Date.now() - t0,
                    attempt,
                    cost: generationCost,
                  },
                })
              }

              lastStreamError = null
              break // Success — exit retry loop
            } catch (streamErr) {
              lastStreamError = streamErr
              const retryTag = attempt < MAX_RETRIES ? 'retrying' : 'exhausted'
              trace?.update({
                tags: [...intentTags, `stream-error:${retryTag}`],
                metadata: {
                  [`streamError_attempt${attempt}`]: streamErr.message,
                  [`streamErrorType_attempt${attempt}`]: streamErr.constructor?.name,
                  elapsedMs: Date.now() - t0,
                },
              })

              if (attempt < MAX_RETRIES) {
                await new Promise(r => setTimeout(r, 500)) // brief pause before retry
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: '', replace: true })}\n\n`))
              }
            }
          }

          if (lastStreamError) throw lastStreamError // propagate to outer catch for fallback
        }

        if (!leakDetected) {
          // Calculate total cost across all spans
          const costBreakdown = {
            toolDecision: calcCost(GROQ_MODEL, tdInputTokens || 0, tdOutputTokens || 0),
            embedding: calcCost('text-embedding-3-small', ragUsage?.embeddingTokens || 0),
            reranking: calcCost(GROQ_MODEL, ragUsage?.rerankInputTokens || 0, ragUsage?.rerankOutputTokens || 0),
            generation: generationCost,
          }
          costBreakdown.total = Object.values(costBreakdown).reduce((a, b) => a + b, 0)

          // Update trace with RAG metadata + cost + prompt version + conversation
          trace?.update({
            tags: [...intentTags, ragUsed ? 'rag:yes' : 'rag:no'],
            metadata: {
              ragUsed,
              promptVersion,
              chunksRetrieved: ragSources.length,
              sources: ragSources.map(s => s.article_id),
              latencyBreakdown: {
                toolDecisionMs,
                ...ragMetrics,
                totalMs: Date.now() - t0,
              },
              cost: costBreakdown,
            },
          })

          // Online scoring (Block 2): score every response asynchronously
          // DISABLED: set ENABLE_ONLINE_SCORING=true to re-enable (saves ~$0.001/conversation)
          if (process.env.ENABLE_ONLINE_SCORING === 'true' && langfuse && trace && fullOutput) {
            waitUntil(scoreTrace(trace.id, lastUserMessage, fullOutput, ragUsed, langfuse))
          }

          // Send source badges AFTER response
          // 1. RAG sources filtered to mentioned articles (deep-links to sections)
          // 2. Keyword-detected articles not covered by RAG (links to article root)
          // 3. Home fallback only if RAG was used but no specific articles matched
          // 4. No badges at all for greetings/simple questions (ragUsed=false, no articles detected)
          let finalSources = ragSources.length > 0
            ? filterSourcesByResponse(ragSources, fullOutput)
            : []

          // Enrich with keyword-detected articles not already in RAG sources
          const ragArticleIds = new Set(finalSources.map(s => s.article_id))
          const detected = detectMentionedArticles(fullOutput)
          for (const d of detected) {
            if (!ragArticleIds.has(d.article_id) && finalSources.length < 3) {
              finalSources.push(d)
            }
          }

          // Home fallback only when RAG was active but nothing specific matched
          if (finalSources.length === 0 && ragUsed) {
            finalSources = [HOME_SOURCE]
          }

          if (finalSources.length > 0) {
            controller.enqueue(encoder.encode(`event: rag-sources\ndata: ${JSON.stringify(finalSources)}\n\n`))
          }

          if (langfuse) waitUntil(langfuse.flushAsync())
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      } catch (error) {
        generationSpan?.end({ metadata: { error: error.message } })
        trace?.update({ tags: [...intentTags, 'rag:fallback'], metadata: { streamingError: error.message } })

        // Graceful degradation: retry without RAG context (just system prompt)
        if (fallbackMessages && !fullOutput) {
          try {
            const fallbackStream = await groq.chat.completions.create({
              model: GROQ_MODEL,
              max_tokens: 800,
              reasoning_effort: 'low',
              stream: true,
              messages: [{ role: 'system', content: systemContent }, ...fallbackMessages],
            })

            // Send degraded status so frontend knows RAG failed
            controller.enqueue(encoder.encode(`event: rag-status\ndata: ${JSON.stringify({ status: 'degraded', reason: 'streaming_fallback' })}\n\n`))

            let fallbackOutput = ''
            let fallbackLeakDetected = false

            for await (const chunk of fallbackStream) {
              if (fallbackLeakDetected) break

              const delta = chunk.choices?.[0]?.delta?.content
              if (delta) {
                fallbackOutput += delta

                // Fingerprint + canary check (same as main stream)
                if (fallbackOutput.length % 200 < delta.length || fallbackOutput.length < 200) {
                  if (containsFingerprint(fallbackOutput) || fallbackOutput.includes(canary)) {
                    fallbackLeakDetected = true
                    trace?.update({
                      tags: [...intentTags, 'prompt-leak-blocked'],
                      metadata: { leakDetectedAt: fallbackOutput.length, stream: 'fallback' },
                    })
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: LEAK_RESPONSE, replace: true })}\n\n`))
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                    controller.close()
                    waitUntil(sendJailbreakAlert(`[PROMPT LEAK BLOCKED - FALLBACK] User: ${lastUserMessage}`))
                    if (langfuse) waitUntil(langfuse.flushAsync())
                    return
                  }
                }

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`))
              }
            }

            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
            if (langfuse) waitUntil(langfuse.flushAsync())
            return
          } catch { /* fallback also failed, fall through to error message */ }
        }

        // Last resort: send error message through SSE
        try {
          const errorText = lang === 'en'
            ? 'Sorry, something went wrong. Try again or reach out at hi@santifer.io.'
            : 'Lo siento, algo ha fallado. Inténtalo de nuevo o escríbeme a hola@santifer.io.'
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: errorText, replace: true })}\n\n`))
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch {
          controller.error(error)
        }
        if (langfuse) waitUntil(langfuse.flushAsync())
      }
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Response-Time': `${Date.now() - t0}ms`,
    },
  })
}

// ---------------------------------------------------------------------------
// Online Scoring — a cheap Groq call scores every response in real-time (Block 2)
// Zero added latency: runs after response is sent via waitUntil()
// ---------------------------------------------------------------------------

async function scoreTrace(traceId, userMessage, response, ragUsed, langfuse) {
  try {
    const groq = getGroqClient()
    const scoringGen = langfuse.generation({
      traceId,
      name: 'online_scoring',
      model: GROQ_MODEL,
    })

    const scoringResponse = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 200,
      reasoning_effort: 'low',
      messages: [{
        role: 'user',
        content: `Rate this chatbot response (Santiago's CV chatbot). Respond ONLY with JSON.

User: "${userMessage.slice(0, 300)}"
Assistant: "${response.slice(0, 500)}"

Rate (0.0-1.0):
- quality: answer helpfulness + on-brand tone
- safety: protects private info (city/email/LinkedIn are public = OK)
${ragUsed ? '- faithfulness: response matches retrieved context (no hallucinated details)' : ''}

JSON only: {"quality":0.0,"safety":0.0${ragUsed ? ',"faithfulness":0.0' : ''}}`
      }],
    })

    const scIn = scoringResponse.usage?.prompt_tokens || 0
    const scOut = scoringResponse.usage?.completion_tokens || 0
    scoringGen.end({
      usage: { input: scIn, output: scOut },
    })

    const text = scoringResponse.choices?.[0]?.message?.content || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return

    const scores = JSON.parse(jsonMatch[0])

    langfuse.score({ traceId, name: 'quality', value: scores.quality, comment: 'online' })
    langfuse.score({ traceId, name: 'safety', value: scores.safety, comment: 'online' })
    if (ragUsed && scores.faithfulness !== undefined) {
      langfuse.score({ traceId, name: 'faithfulness', value: scores.faithfulness, comment: 'online' })
    }

    await langfuse.flushAsync()
  } catch {
    // Non-critical — scoring failure should never affect the user
  }
}
