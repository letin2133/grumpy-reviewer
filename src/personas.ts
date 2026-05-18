import * as fs from 'fs'
import * as path from 'path'
import matter from 'gray-matter'

export interface PersonaData {
  name: string
  slug: string
  emoji: string
  description: string
  author?: string
  systemPrompt: string
}

function getPersonasDir(): string {
  // GITHUB_ACTION_PATH is set when running as a GitHub Action
  const actionPath = process.env.GITHUB_ACTION_PATH
  if (actionPath) return path.join(actionPath, 'personas')
  // Fallback for local dev/testing: one level up from dist/ or src/
  return path.join(__dirname, '..', 'personas')
}

export function loadPersona(slug: string): PersonaData {
  const personasDir = getPersonasDir()
  const filePath = path.join(personasDir, `${slug}.md`)

  if (!fs.existsSync(filePath)) {
    const available = listPersonas()
    throw new Error(
      `Persona "${slug}" not found. Available: ${available.join(', ')}\n` +
        `Personas directory: ${personasDir}`,
    )
  }

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)

  return {
    name: data.name ?? slug,
    slug: data.slug ?? slug,
    emoji: data.emoji ?? '🤖',
    description: data.description ?? '',
    author: data.author,
    systemPrompt: content.trim(),
  }
}

export function listPersonas(): string[] {
  const personasDir = getPersonasDir()
  if (!fs.existsSync(personasDir)) return []
  return fs
    .readdirSync(personasDir)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''))
    .sort()
}
