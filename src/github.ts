import * as core from '@actions/core'
import * as github from '@actions/github'
import { ReviewResult } from './llm'

type Octokit = ReturnType<typeof github.getOctokit>

export async function fetchDiff(
  octokit: Octokit,
  context: typeof github.context,
  prNumber: number,
  maxFiles: number,
): Promise<string> {
  const { data: files } = await octokit.rest.pulls.listFiles({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
    per_page: 100,
  })

  const limited = files.slice(0, maxFiles)
  if (files.length > maxFiles) {
    core.info(`PR touches ${files.length} files — limiting review to first ${maxFiles}.`)
  }

  const MAX_DIFF_CHARS = 80_000
  const parts: string[] = []
  let total = 0

  for (const file of limited) {
    if (!file.patch) continue
    const chunk = `diff --git a/${file.filename} b/${file.filename}\n--- a/${file.filename}\n+++ b/${file.filename}\n${file.patch}\n`
    if (total + chunk.length > MAX_DIFF_CHARS) {
      core.info(`Diff truncated at ~${total} chars to stay within token limits.`)
      break
    }
    parts.push(chunk)
    total += chunk.length
  }

  return parts.join('\n')
}

export async function postReview(
  octokit: Octokit,
  context: typeof github.context,
  prNumber: number,
  review: ReviewResult,
): Promise<void> {
  const { data: pr } = await octokit.rest.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  })

  const commitId = pr.head.sha

  const validComments = review.comments
    .filter(c => c.path && c.line > 0 && c.body?.trim())
    .map(c => ({ path: c.path, line: c.line, body: c.body }))

  try {
    await octokit.rest.pulls.createReview({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: prNumber,
      commit_id: commitId,
      body: review.summary,
      event: 'COMMENT',
      comments: validComments.length > 0 ? validComments : undefined,
    })
  } catch (err) {
    // Line comments can fail if the line is not part of the diff hunk.
    // Fall back to a body-only review so the summary is never lost.
    core.warning(`Line-level comments failed (${err}), posting summary-only.`)
    await octokit.rest.pulls.createReview({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: prNumber,
      commit_id: commitId,
      body: review.summary,
      event: 'COMMENT',
    })
  }
}
