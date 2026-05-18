import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

export interface ReviewComment {
  path: string
  line: number
  body: string
}

export interface ReviewResult {
  summary: string
  comments: ReviewComment[]
}

interface ReviewOptions {
  systemPrompt: string
  diff: string
  provider: string
  model: string
}

const REVIEW_TOOL = {
  name: 'submit_review',
  description: 'Submit the code review with a summary and optional line-level comments.',
  input_schema: {
    type: 'object' as const,
    properties: {
      summary: {
        type: 'string',
        description: 'Overall review summary in your persona voice.',
      },
      comments: {
        type: 'array',
        description: 'Specific line-level issues found in the diff.',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path exactly as it appears in the diff.' },
            line: { type: 'number', description: 'The new-file line number from the diff hunk.' },
            body: { type: 'string', description: 'Your comment for this line, in character.' },
          },
          required: ['path', 'line', 'body'],
        },
      },
    },
    required: ['summary', 'comments'],
  },
}

export async function reviewWithLLM(opts: ReviewOptions): Promise<ReviewResult> {
  const userMessage = `Please review this pull request diff:\n\n\`\`\`diff\n${opts.diff}\n\`\`\``

  if (opts.provider === 'openai') {
    return reviewWithOpenAI(opts.systemPrompt, userMessage, opts.model)
  }
  return reviewWithAnthropic(opts.systemPrompt, userMessage, opts.model)
}

async function reviewWithAnthropic(
  systemPrompt: string,
  userMessage: string,
  modelOverride: string,
): Promise<ReviewResult> {
  const client = new Anthropic()
  const model = modelOverride || 'claude-sonnet-4-6'

  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    tools: [REVIEW_TOOL as Anthropic.Tool],
    tool_choice: { type: 'any' },
    messages: [{ role: 'user', content: userMessage }],
  })

  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === 'submit_review') {
      const input = block.input as { summary: string; comments: ReviewComment[] }
      return {
        summary: input.summary ?? '',
        comments: Array.isArray(input.comments) ? input.comments : [],
      }
    }
  }

  return { summary: '', comments: [] }
}

async function reviewWithOpenAI(
  systemPrompt: string,
  userMessage: string,
  modelOverride: string,
): Promise<ReviewResult> {
  const client = new OpenAI()
  const model = modelOverride || 'gpt-4o'

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: REVIEW_TOOL.name,
          description: REVIEW_TOOL.description,
          parameters: REVIEW_TOOL.input_schema as Record<string, unknown>,
        },
      },
    ],
    tool_choice: { type: 'function', function: { name: 'submit_review' } },
  })

  const call = response.choices[0]?.message?.tool_calls?.[0]
  if (call?.function?.arguments) {
    const parsed = JSON.parse(call.function.arguments) as {
      summary: string
      comments: ReviewComment[]
    }
    return {
      summary: parsed.summary ?? '',
      comments: Array.isArray(parsed.comments) ? parsed.comments : [],
    }
  }

  return { summary: '', comments: [] }
}
