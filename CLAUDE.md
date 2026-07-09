# pageworks-docs — working rules

This repo is the **public** documentation + issue tracker for Pageworks (a closed-source
Business Central report-rendering engine). It is built with Docusaurus and published to
GitHub Pages. Its sibling, the private engine repo, is `Stefan-Maron-Consulting/Pageworks`
— that repo is the source of truth for product behavior; this repo is a curated,
**one-way, human-reviewed mirror** of the parts of it that are safe to publish.

## 0. The golden rule (never violate this)

**This repo must let a user or a third-party AL developer fully use and extend Pageworks
without ever learning, or being able to infer, how the engine works internally.**

Pageworks ships closed-source on purpose (`resourceExposurePolicy` fully closed in the
private repo — no debugging, no source download, no source in the symbol file). The
product's entire trust model rests on the *public API surface* being the complete and
only thing a consumer ever needs. If this documentation repo leaks internals, it
undermines that model regardless of what the `.app` package itself restricts.

"Internals" that must **never** appear here, in any form — prose, code snippet, diagram,
commit message, issue, or PR description:

- How the renderer, layout engine, or PDF backend actually works: algorithms, the
  measure/emit pass, pagination logic, coordinate systems, box-model implementation
  details, font-embedding internals, gzip/compression internals, etc.
- Names of `Access = Internal` AL objects (codeunits, tables, pages, enums, interfaces)
  — anything not listed in the public repo's `docs/ApiStabilityPromise.md`. If you're
  ever tempted to write `PageworksComposer`, `PageworksRenderer`, `PageworksDataBinder`,
  `PageworksLayoutConstants`, or any other implementation-codeunit name here — don't.
  Only these are public: `PageworksRegistry`, `PageworksValidator`, `PageworksFinding`,
  `PageworksFindingSeverity`, `PageworksFontStyleVariant`, and the
  `reportlayout/pageworks` MIME-type contract.
- Anything under the private repo's `specs/`, `.specify/`, or internal `docs/` (spec
  numbers like "spec 010", "spec 017"; `FR-xxx`/`SC-xxx` requirement IDs; plan/tasks/
  research documents; defect-triage notes; the constitution).
- Product strategy, competitive reasoning, unreleased-feature internal debate, or
  anything that reveals *why* a decision was made beyond what a user needs to use the
  feature. A public roadmap says **what's coming**, never **the internal argument for
  building it**.
- Release engineering / AppSource-submission process detail (ruleset workarounds,
  analyzer suppressions, ordinal/ enum backward-compat incidents, checklist internals).
  Customers don't need to know how SMC gets a release out the door.
- Telemetry event *payload construction* internals — publishing the event catalog
  (`LF0001` etc.) and how a tenant routes it to their own Application Insights is fine
  and already public; publishing how the engine decides what to log internally is not.
- Anything explicitly marked internal in the source doc (HTML comments, "internal use
  only", "do not publish" notes) — always honor those markers, don't strip them and
  publish anyway.

If a piece of content sits in a gray zone, default to **excluding it** and ask Stefan,
rather than publishing and hoping it's fine. It is much cheaper to add a doc later than
to un-leak one.

## 1. What this repo IS for

- Getting a Business Central admin/consultant productive with Pageworks (install, wire a
  report, author a `.pageworks.html` template, manage partials/fonts).
- Giving a third-party AL developer the complete, accurate public API contract —
  `PageworksRegistry`/`PageworksValidator`, the MIME-type wiring contract, the template
  language, the error/finding code catalog — so they never need engine source.
- Documenting stability guarantees (`ApiStabilityPromise`, `VersioningPolicy`) so
  consumers can plan upgrades confidently.
- A public-safe, curated roadmap: capabilities users can expect, without the internal
  strategy narrative behind them.
- Tracking public bugs/feature requests (Issues) and the roadmap (Projects board).

## 2. Pulling content from the private Pageworks repo

**Never symlink, submodule, or auto-sync files from the private repo.** Every doc here
is a deliberate, reviewed copy, even when it started life as a near-verbatim port of a
private-repo file. The workflow for updating a doc from upstream:

1. Read the current version of the source file in the private repo.
2. Rewrite it through the golden-rule filter above: strip internal object names, spec/
   FR/SC references, internal file links (`specs/...`, other `docs/*.md` not itself being
   published), and any implementation narrative. Replace spec-number citations
   ("see spec 010") with either nothing or a plain-English restatement.
3. Re-home any cross-references to point at this repo's own doc structure, not the
   private repo's paths.
4. Read the result once more, specifically hunting for internal names/paths that slipped
   through — this is the step people skip and regret.
5. Commit with a message that says what was ported from where (e.g. "docs: port
   DeveloperReference from Pageworks docs/DeveloperReference.md, sanitized").

Docs known-safe to mirror (already written publication-safe in the private repo, minor
sanitization only): `DeveloperReference.md`, `Onboarding.md`, `TemplateLanguage.md`,
`ApiStabilityPromise.md`, `VersioningPolicy.md`, `Telemetry.md`, and the
`specs/001-layout-forge-v1/contracts/error-codes.md` catalog.

Docs that must **never** be mirrored, even in edited form — they are internal by nature,
not just by current wording: `EngineReview-*.md`, `InternalsVisibleToSecurityResearch-*.md`,
`MapperSplitPlan.md`, `SpikeFindings.md`, `PerfToolkitResearch-*.md`, `ResearchBrief.md`,
`RenderDefectTriage-*.md`, `ReleaseChecklist.md`, `AppSourceCopNotes.md`, anything in
`specs/` or `.specify/` other than the two contract files named above, and the
constitution.

`ProductVision.md` is a special case: it is an internal strategy/backlog capture, not
publishable as-is. A public `roadmap.md` here may summarize *what capabilities are
planned*, in user-facing language, with owner sign-off on each entry before it's added —
never a copy or near-copy of that file's reasoning, deferred-defect notes, or internal
framing.

## 3. Structure

- Docusaurus site, Markdown-based (`docs/`), deployed to GitHub Pages via
  `.github/workflows/deploy.yml` on push to `main`.
- `docs/getting-started/` — installer/consultant-facing onboarding.
- `docs/reference/` — the developer API contract (registry, validator, template
  language, error codes, stability/versioning).
- `docs/guides/` — task-oriented guides (telemetry routing, etc.).
- `docs/roadmap.md` — curated public roadmap.
- GitHub Issues (labels: `bug`, `feature`, `docs`, `question`) for tracking; a GitHub
  Project board for the roadmap view.

## 4. Verify before publishing

Before any commit that adds or edits a doc: re-read it once specifically looking for
anything the golden rule (§0) forbids. Grep for tells: `Access = Internal`, `spec 0`,
`FR-0`, `SC-0`, `specs/`, `.specify/`, and any `Pageworks*` object name not on the public
list in `ApiStabilityPromise.md`. If any hit isn't obviously fine, stop and ask rather
than publish.
