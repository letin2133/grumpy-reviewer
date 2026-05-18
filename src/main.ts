import * as core from '@actions/core'
import * as github from '@actions/github'
import { loadPersona } from './personas'
import { buildSystemPrompt } from './prompt'
import { reviewWithLLM } from './llm'
import { fetchDiff, postReview } from './github'

async function run(): Promise<void> {
  try {
    const token = process.env.GITHUB_TOKEN ?? core.getInput('github-token', { required: false })
    const persona = core.getInput('persona') || 'grumpy-senior'
    const provider = core.getInput('provider') || 'anthropic'
    const model = core.getInput('model') || ''
    const maxFiles = Math.max(1, parseInt(core.getInput('max-files') || '10', 10))

    if (!token) {
      core.setFailed('GITHUB_TOKEN is required. Set it in the workflow env or pass as github-token input.')
      return
    }

    const context = github.context
    if (!context.payload.pull_request) {
      core.warning('This action only runs on pull_request events. Skipping.')
      return
    }

    const prNumber = context.payload.pull_request.number

    const octokit = github.getOctokit(token)

    core.info(`Loading persona: ${persona}`)
    const personaData = loadPersona(persona)
    core.info(`${personaData.emoji} ${personaData.name} is ready to judge your code.`)

    core.info('Fetching PR diff...')
    const diff = await fetchDiff(octokit, context, prNumber, maxFiles)

    if (!diff.trim()) {
      core.info('No reviewable diff found (binary files only?). Skipping.')
      return
    }

    const systemPrompt = buildSystemPrompt(personaData)

    core.info(`Calling ${provider} for review...`)
    const review = await reviewWithLLM({ systemPrompt, diff, provider, model })

    if (!review.summary && review.comments.length === 0) {
      core.info('LLM returned nothing. Skipping review post.')
      return
    }

    core.info(`Posting review (${review.comments.length} line comment(s))...`)
    await postReview(octokit, context, prNumber, review)

    core.info('Done.')
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    core.setFailed(`GrumpyReviewer failed: ${msg}`)
  }
}

run()
