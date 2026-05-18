# Contributing a Persona

Adding a new reviewer persona is a single Markdown file. No code required.

## File format

Create `personas/<your-slug>.md`:

```markdown
---
name: Your Persona Name
slug: your-slug
emoji: "🦄"
description: One sentence — what makes this persona distinctive.
author: @your-github-handle
---

You are [describe the character convincingly, 2-3 sentences].

Your review style:
- [Tone and vocabulary rules]
- [How you frame bugs]
- [Signature phrases or patterns]
- [How you end every review]

Tone: [one line summary of the vibe]
```

## Quality bar

Every persona PR must include:

1. **The `.md` file** in `personas/`.
2. **Two example reviews** in the PR description — paste a short (5-10 line) buggy diff and show what your persona would say. This proves the prompt actually works.

**Good persona:** technically accurate feedback wrapped in a consistent, entertaining voice.

**Bad persona:** just vibes with no real feedback, or so confusing the reviewer can't identify what to fix.

## Guidelines

- No real people by name (fictional archetypes only, like "Kernel Maintainer" not "Linus Torvalds").
- Personas should be fun but not mean-spirited toward developers as people.
- The persona must give technically correct, actionable feedback — not just funny comments.
- Keep the system prompt under ~500 words. Shorter is usually better.

## Submitting

Open a PR with title: `feat(persona): add <slug>` and fill in the template above.
