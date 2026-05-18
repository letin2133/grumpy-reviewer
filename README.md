# GrumpyReviewer

> **Your AI code reviewer has opinions. Strong ones.**

Drop one YAML file into your repo. Every PR gets brutally honest, technically correct feedback — delivered in character by one of 6 AI personas.

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-GrumpyReviewer-blue?logo=github)](https://github.com/marketplace/actions/grumpy-reviewer)
[![GitHub Stars](https://img.shields.io/github/stars/letin2133/grumpy-reviewer?style=social)](https://github.com/letin2133/grumpy-reviewer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What it looks like

Someone opens a PR with a few security holes. Two minutes later:

**😤 Grumpy Senior** comments:

> *"This PR reads like a checklist of critical security vulnerabilities. SQL injection (multiple spots), shell injection, plaintext password storage — one or more of these issues single-handedly wrapped up entire careers in tragic meetings with HR.*
>
> *On the bright side, `calculate_discount` almost looks decent if you squint hard. Almost."*

Then on line 14 specifically:

> *"You managed to combine two classic poor practices: `shell=True` AND blindly interpolating `username`. This is a ticking time bomb. I can't believe I have to say this — use subprocess list form."*

**🧘 Zen Master** sees the same code and writes:

> *"This code is a forest with many paths of danger. SQL injection, shell injection, exposed credentials and unguarded calculations beckon calamity. These issues ask for clearer understanding, stronger boundaries, and greater respect for the unpredictable nature of inputs."*

On the same line 14:

> *"I see the wish to purge. And yet — what of username's essence? The string lacks sanitation. Running commands through `shell=True` risks devastation. Favor safer interfaces."*

**Same bugs. Completely different energy.**

---

## Personas

| | Persona | Slug | Signature style |
|---|---|---|---|
| 😤 | Grumpy Senior | `grumpy-senior` | *"I can't believe I have to say this."* / ends with a backhanded compliment |
| 🪖 | Drill Sergeant | `drill-sergeant` | ALL CAPS for critical bugs / "MISSION STATUS: NAK" |
| 🧘 | Zen Master | `zen-master` | Philosophical questions / occasional haiku / never says "wrong" |
| ⚔️ | Anime Sensei | `anime-sensei` | *"Nani?! O(n²) inside an API handler?!"* / ends with encouragement |
| 🎭 | Shakespeare | `shakespeare` | Early Modern English / iambic pentameter for serious bugs |
| 🐧 | Kernel Maintainer | `kernel-maintainer` | Terse / technically unsparing / ends with "NAK." or "Reviewed-by:" |

---

## Quickstart (30 seconds)

**1. Add your API key as a repo secret** — Settings → Secrets → Actions:

```
ANTHROPIC_API_KEY = sk-ant-...
```

**2. Create `.github/workflows/grumpy-review.yml`:**

```yaml
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
          persona: grumpy-senior
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**That's it.** Open a PR and brace yourself.

---

## More examples

### 🎭 Shakespeare reviews a missing null check

```python
# PR diff
- user = get_user(request.user_id)
+ user = get_user(request.user_id)
+ print(user.name)
```

> *"Hark! What folly is this? Thou dost call upon `user.name` without first asking whether `user` doth exist! Like Hamlet who acted without certainty, thy code shall crash upon the null pointer's stage.*
>
> *Check for None before thou proceedest, lest thy production server become a tragedy in five acts.*
>
> — W. Shakespeare, Code Reviewer"*

---

### 🪖 Drill Sergeant reviews an O(n²) loop

```python
# PR diff
+ for user in all_users:
+     for item in all_items:
+         if item.owner_id == user.id:
+             results.append(item)
```

> *"WHAT IS THIS, SOLDIER? A NESTED LOOP OVER TWO FULL TABLE SCANS?*
>
> *You are querying O(n²) on what will be production data. When this table hits 10,000 rows you will be explaining this to management at 2AM.*
>
> *Use a JOIN. Use a dict lookup. Use ANYTHING but this.*
>
> *MISSION STATUS: SEND IT BACK.*"*

---

### ⚔️ Anime Sensei reviews hardcoded credentials

```python
# PR diff
+ DB_PASSWORD = "admin123"
+ API_SECRET = "supersecret"
```

> *"Nani?! Hardcoded credentials committed directly to the repository?!*
>
> *Developer-san, I have seen many fall to this exact mistake. These secrets will live in git history forever — even if you delete them later. Move them to environment variables or a secrets manager immediately.*
>
> *You have the potential to write secure code. I believe in you. Now fix this before the security audit finds it first!"*

---

### 🧘 Zen Master reviews a swallowed exception

```python
# PR diff
+ try:
+     result = risky_operation()
+ except:
+     pass
```

> *"One seeks to silence the error. And yet — what wisdom is lost in the silence?*
>
> *The bare `except: pass` does not resolve the problem. It erases the evidence. Log the exception. Handle specific types. Let errors speak.*
>
> *A bug unlogged is a bug unlearned."*

---

## All options

```yaml
- uses: letin2133/grumpy-reviewer@v1
  with:
    persona: grumpy-senior      # which persona to use
    provider: anthropic         # anthropic | openai
    model: ""                   # override model (default: claude-sonnet-4-6 / gpt-4o)
    max-files: "10"             # max files reviewed per PR
    base-url: ""                # custom API endpoint (OpenRouter, proxy, etc.)
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
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

Uses `claude-sonnet-4-6` by default with prompt caching enabled.

| PR size | Approx. cost |
|---|---|
| Small (< 5 files, ~200 lines) | ~$0.002 |
| Medium (10 files, ~500 lines) | ~$0.008 |
| Large (capped at 10 files) | ~$0.015 |

Switch to `claude-haiku-4-5` for ~10× cheaper reviews.

Works with **any OpenAI-compatible provider** (OpenRouter, local Ollama, etc.) via `base-url`.

---

## How it works

1. PR opens → Action fetches the diff via GitHub API
2. Loads the selected persona (a plain Markdown file in [`/personas`](./personas/))
3. Sends diff + persona prompt to the LLM using tool calling for structured output
4. Posts line-level review comments back to the PR via GitHub Review API

The reviewer only comments if it finds real issues — no spam on clean PRs.

---

## Add your own persona

It's just a Markdown file. See [CONTRIBUTING.md](CONTRIBUTING.md).

Every new persona merged = one more reason for people to star the repo.

---

## License

MIT
