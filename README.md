# GrumpyReviewer

**AI code review with personality.** Drop one YAML file into your repo and get brutally honest (and technically correct) feedback on every PR — delivered in character.

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-GrumpyReviewer-blue?logo=github)](https://github.com/marketplace/actions/grumpy-reviewer)
[![GitHub Stars](https://img.shields.io/github/stars/letin2133/grumpy-reviewer?style=social)](https://github.com/letin2133/grumpy-reviewer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Personas

| Persona | Slug | Vibe |
|---|---|---|
| 😤 Grumpy Senior | `grumpy-senior` | 20-year veteran, sarcastic, world-weary, always right |
| 🪖 Drill Sergeant | `drill-sergeant` | MISSION STATUS: FIX YOUR NULL CHECKS, SOLDIER |
| 🧘 Zen Master | `zen-master` | Every bug is a koan. Every null pointer is suffering. |
| ⚔️ Anime Sensei | `anime-sensei` | Nani?! This is O(n²) inside an API handler?! |
| 🎭 Shakespeare | `shakespeare` | Hark! What race condition through yonder thread breaks? |
| 🐧 Kernel Maintainer | `kernel-maintainer` | NAK. Come back when it's correct. |

---

## Quickstart

**1. Add your API key as a repository secret:**

```
ANTHROPIC_API_KEY = sk-ant-...
```

**2. Drop this file in your repo:**

```yaml
# .github/workflows/grumpy-review.yml
name: Code Review
on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: letin2133/grumpy-reviewer@v1
        with:
          persona: grumpy-senior   # change this to try other personas
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**That's it.** Open a PR and watch the chaos unfold.

---

## All options

```yaml
- uses: letin2133/grumpy-reviewer@v1
  with:
    persona: grumpy-senior      # which reviewer personality to use
    provider: anthropic         # anthropic | openai
    model: ""                   # override model (default: claude-sonnet-4-6 / gpt-4o)
    max-files: "10"             # max files reviewed per PR (keeps costs predictable)
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    # OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}  # if using openai provider
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Multiple personas at once

```yaml
jobs:
  grumpy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: letin2133/grumpy-reviewer@v1
        with: { persona: grumpy-senior }
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  zen:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: letin2133/grumpy-reviewer@v1
        with: { persona: zen-master }
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Cost estimate

Reviews use `claude-sonnet-4-6` by default with prompt caching enabled.

| PR size | Approx. cost |
|---|---|
| Small (< 5 files, ~200 lines changed) | ~$0.002 |
| Medium (10 files, ~500 lines changed) | ~$0.008 |
| Large (capped at 10 files, 80k chars) | ~$0.015 |

Switch to `claude-haiku-4-5` for even cheaper reviews (~10× less).

---

## How it works

1. On every PR, the action fetches the diff via GitHub API.
2. It loads the selected persona (a Markdown file in [`/personas`](./personas/)).
3. Sends the diff + persona prompt to the LLM with tool use for structured output.
4. Posts line-level review comments back to the PR.

The system prompt is cached across requests (Anthropic prompt caching) so repeated reviews on the same persona cost less.

---

## Add your own persona

See [CONTRIBUTING.md](CONTRIBUTING.md). It's just a Markdown file. PRs welcome.

---

## Local testing

Install [`act`](https://github.com/nektos/act) to run the action locally:

```bash
act pull_request \
  -s ANTHROPIC_API_KEY=sk-ant-... \
  -s GITHUB_TOKEN=ghp_...
```

---

## License

MIT
