# Pageworks Roadmap Management

A skill for managing roadmap items, features, bugs, and issues for the pageworks-docs repo.

## Overview

The Pageworks roadmap lives in three places:
1. **GitHub Issues** — Individual issues (#1–#10+) with detailed descriptions
2. **GitHub Project** — "Pageworks Roadmap" project board tracking status
3. **Roadmap page** — `src/pages/roadmap.md`, the public-facing roadmap table

All three must stay in sync. Issues are the source of truth; the project board visualizes status; the roadmap page surfaces high-level capabilities to users.

## Process: Adding a new roadmap capability

### 1. Gather context from Stefan

Ask Stefan to describe:
- What the capability does (user-facing description)
- Why it's needed (problem it solves)
- When it should be prioritized (relative to other items)
- Any implementation notes or constraints

### 2. Create the GitHub Issue

```bash
gh issue create \
  --title "Capability name" \
  --body "$(cat <<'EOF'
## What it does
[User-facing description]

## Why it matters
[Problem/use case]

## Implementation notes (if any)
[Technical details, constraints, or dependencies]
EOF
)" \
  --label enhancement
```

Record the issue number (e.g., #11).

### 3. Add the issue to the Roadmap project

```bash
gh issue edit #11 --project "PVT_kwDOBmFYJ84Bc5As"
```

The project board is at: https://github.com/orgs/Stefan-Maron-Consulting/projects/1

### 4. Update the roadmap page

Edit `src/pages/roadmap.md`:
- Add a row to the "Planned capabilities" table
- Include the capability name and a 1-line "what it means for you" summary
- If highest priority, call that out (see Conditional display example)

### 5. Commit and push

```bash
git add src/pages/roadmap.md
git commit -m "docs: add [capability name] to roadmap

- Created issue #11
- Added to GitHub Project board
- Updated roadmap.md"
git push origin main
```

---

## Process: Updating an existing roadmap item

If Stefan provides more context for an existing item:

### 1. Update the GitHub Issue

```bash
gh issue edit #5 --body "$(cat <<'EOF'
[Updated description with new context]
EOF
)"
```

### 2. Update roadmap.md if needed

If the capability description or priority changed, update the table row.

### 3. Commit

```bash
git add src/pages/roadmap.md
git commit -m "docs: expand issue #5 context and update roadmap"
git push origin main
```

---

## Process: Managing bugs and feature requests

### Bug reports (label: `bug`)
- User opens bug issue
- Add to project board in "In Triage" or "Backlog" column
- Link to any related roadmap items if it blocks a capability

### Feature requests (label: `feature`)
- User opens feature request
- Review if it aligns with roadmap
- If yes: create a roadmap issue, link to the request
- If no: keep separate, label as "request-external" or similar

### Documentation issues (label: `docs`)
- Improvements to docs, guides, API reference
- Same process: add to project, prioritize

---

## Checklist: Before committing roadmap changes

- [ ] Issue description is clear and user-focused
- [ ] No internal implementation details leak (see CLAUDE.md golden rule)
- [ ] Issue is added to the Pageworks Roadmap project board
- [ ] Roadmap.md table is updated with accurate 1-line summary
- [ ] Commit message references issue number(s)
- [ ] Pushed to main

---

## Related files

- **Roadmap page**: `src/pages/roadmap.md`
- **Project board**: https://github.com/orgs/Stefan-Maron-Consulting/projects/1
- **Issues**: https://github.com/Stefan-Maron-Consulting/pageworks-docs/issues
- **Codebase rules**: `/home/stefan/Documents/Repos/SMC/pageworks-docs/CLAUDE.md` (especially § 0: golden rule)
