---
sidebar_position: 1
---

# Pageworks

Pageworks is an in-tenant, deterministic PDF report-rendering engine for Microsoft
Dynamics 365 Business Central. It replaces the platform's Word/RDLC layout pipeline for
the reports you wire to it, rendering PDF output natively inside your BC environment —
no external service, no document content ever leaving the tenant.

- **In-tenant** — rendering happens inside Business Central. No external calls, no data
  export.
- **Deterministic** — the same report and data always produce byte-identical PDF output.
- **Text-first** — layouts are plain, well-formed `.pageworks.html` files: diff-friendly,
  reviewable in a pull request, and easy for a person or an AI agent to author directly.
- **Closed-source engine, open contract** — the engine itself ships closed-source, but
  its public API (partial/font/image registration, template validation, and the layout
  wiring contract) is small, stable, and fully documented here. This site — the public
  contract, the template language, and the developer/consultant guides — is the complete
  external surface of Pageworks; nothing about how the engine works internally is needed
  to use or extend it.

## Where to start

- **Business analyst / consultant designing a layout?** Start with
  [Getting started](/getting-started/onboarding) — wiring a report and writing your
  first `.pageworks.html` template.
- **AL developer building a dependency app?** Start with the
  [Developer reference](/reference/developer-reference) — the complete public API
  contract.
- **Planning an upgrade or dependency version?** See
  [API stability](/reference/api-stability) and [Versioning policy](/reference/versioning-policy).

## Getting Pageworks

Pageworks is distributed on Microsoft AppSource. Found a bug, or want to request a
feature? [Open an issue](https://github.com/Stefan-Maron-Consulting/pageworks-docs/issues)
in this repo. See what's planned next on the [roadmap](/roadmap).
