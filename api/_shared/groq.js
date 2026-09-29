// ---------------------------------------------------------------------------
// Groq client — OpenAI-compatible chat completions, used for the live chat,
// reranking, and voice reasoning (replaces Anthropic on the hot path).
// ---------------------------------------------------------------------------

import OpenAI from 'openai'

export const GROQ_MODEL = 'openai/gpt-oss-120b'

let groqClient = null

export function getGroqClient() {
  if (!groqClient) {
    groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY_NEW,
      baseURL: 'https://api.groq.com/openai/v1',
    })
  }
  return groqClient
}
