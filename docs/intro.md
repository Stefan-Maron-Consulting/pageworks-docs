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
- **Text-first** — layouts are plain, well-formed `.pageworks` files: diff-friendly,
  reviewable in a pull request, and easy for a person or an AI agent to author directly.
- **Closed-source engine, open contract** — the engine itself ships closed-source, but
  its public API (partial/font/image registration, template validation, and the layout
  wiring contract) is small, stable, and fully documented here. This site — the public
  contract, the template language, and the developer/consultant guides — is the complete
  external surface of Pageworks; nothing about how the engine works internally is needed
  to use or extend it.

## What you're building

A Pageworks layout is not a Word document and not an RDLC report — it's a `.pageworks` file, a
small, well-formed XHTML-like text format specific to this engine. You author it as plain text
(tables, headers/footers, bindings to report columns, conditionals), then publish it against a BC
report and it becomes a real, selectable layout for that report in the BC client — no compile step,
no extension required for the layout itself. See [Template language](/reference/template-language)
for the full element/attribute vocabulary, and [External API](/reference/external-layout-api) for
`publishLayout` and the rest of the render/discover/manage surface if you're building or driving
this from outside the BC client.

## Feature landscape

- **Template language** — tables, headers/footers, `<region>` (coordinate-positioned), bindings
  (`{{Column}}`), conditionals (`data-if`), repeats (`data-each`). The core authoring surface; start
  with [Template language reference](/reference/template-language).
- **Fonts** — a baseline set ships automatically; upload custom/corporate fonts via the
  `pageworksFonts` asset entity. See [Fonts](/guides/fonts) and
  [Font support & limitations](/reference/font-support).
- **Barcodes (1D)** — Code 39, Code 128, EAN-13 via font-coupled encoders — no external barcode
  image generation needed. See [Barcodes](/guides/barcodes).
- **QR codes** — `<qr/>` draws a native vector matrix, no font or image asset required. See
  [QR codes](/guides/qr-codes).
- **Images** — register logos/images once via the `pageworksImages` asset entity, then reference
  them by name from `<img>`.
- **Shared styles** — define a named style once (e.g. corporate colors, a heading treatment) and
  reuse it across templates instead of repeating inline `style="..."`. See [Styles](/guides/styles).
- **Dataset fields (custom fields, no AL)** — pull additional fields from related tables into a
  report's dataset by configuration; a template referencing the new column renders the real,
  per-row pulled value. See [Dataset fields](/guides/dataset-fields) for how to configure a
  binding.
- **Diagnostics & geometry** — verify a render's layout programmatically (page overflow, row
  overflow, computed box geometry for every element) without rasterizing the PDF to an image. See
  `renderTemplateWithDiagnostics` in [External API](/reference/external-layout-api).
- **Report & field discovery** — enumerate which reports are eligible layout targets, and which
  dataset columns each one exposes, entirely over the external API — no AL source reading required.
  See [External API](/reference/external-layout-api).

## Where to start

- **Business analyst / consultant designing a layout?** Start with
  [Getting started](/getting-started/onboarding) — wiring a report and writing your
  first `.pageworks` template.
- **AL developer building a dependency app?** Start with the
  [Developer reference](/reference/developer-reference) — the complete public API
  contract.
- **Planning an upgrade or dependency version?** See
  [API stability](/reference/api-stability) and [Versioning policy](/reference/versioning-policy).

## Getting Pageworks

Pageworks is distributed on Microsoft AppSource. Found a bug, or want to request a
feature? [Open an issue](https://github.com/Stefan-Maron-Consulting/pageworks-docs/issues)
in this repo. See what's planned next on the [roadmap](/roadmap).

:::tip[Sandbox environments carry a watermark]
Every page rendered while the license/installation is running in a Business Central
**sandbox** environment carries a diagonal, tiled "SANDBOX" watermark — this is by
design and cannot be suppressed by any template or layout setting. Production
environments render without it. Use a sandbox for evaluation and testing; the
watermark disappears automatically once the same layout runs in production.
:::
