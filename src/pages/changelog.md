---
title: Changelog
description: Notable user-facing changes to Pageworks, grouped by version — newest first.
---

# Changelog

Notable changes to Pageworks that affect how you author layouts or configure the app,
grouped by the **version** each change first shipped in — check the version shown on
your install's Extension Management page, then read down to see what's new since. This
list covers **user-facing** changes only — it is not an exhaustive build log. For
what's coming next, see the [Roadmap](/roadmap).

Changes are grouped as **Added** (new capabilities), **Changed** (existing behaviour that
now works differently), and **Fixed** (corrected defects).

## Unreleased

Merged and slated for the next version — not yet on AppSource.

### Added

- **External API for layout-development tools.** Build a layout-development tool
  against Pageworks over the standard Business Central API — discover which reports
  you can build against, render draft template text against a report and get back a
  document with nothing saved (optionally with structured diagnostics and computed
  layout geometry for automated verification, via `renderTemplateWithDiagnostics`),
  discover which data a report exposes before you filter or bind to it, manage Fonts,
  Stylesheets, Blocks, Page Sizes, and Images with full create/read/update/delete, and
  publish a finished template as a real, selectable report layout. Governed by its own
  dedicated, minimal permission grouping. See [External API for layout-development
  tools](/reference/external-layout-api).
- **Dataset Fields — add fields to a report's dataset without a developer.** Pull data
  from any table already reachable from a report's own data into the dataset as new,
  bindable columns — pick a target table, define the match (or, for a single-record
  target table, skip the match entirely — see below), choose which fields to pull (with
  optional formatting and Count/Sum/Average/Min/Max aggregation across matches). A
  Media/BLOB field pulled this way works directly as an `<img>` source. See
  [Adding fields to a report's dataset](/guides/dataset-fields).
- **Dataset Fields bindings can now skip the match entirely for single-record targets.**
  A binding needs no Link Fields at all when the target table only ever has one relevant
  record (e.g. Company Information) — it resolves via a stored filter, or, absent one,
  the target table's first record. A new readiness signal (`isRenderReady` /
  `selectionBasis` at the API level) makes which mechanism a binding uses visible before
  you render, rather than a surprise. See [Adding fields to a report's dataset](/guides/dataset-fields).
- **`buildFilterParams` — build a request-page filter without hand-authoring XML.** Some
  reports require filter information before they can render; this new action builds
  valid `RequestPageParameters` XML from a plain list of field filters, ready to pass
  into `renderTemplate`. See [External API for layout-development tools](/reference/external-layout-api).
- **Caption/label binding — `{{ColumnCaption}}`.** Bind a report column's caption (its
  field label) instead of its value by appending `Caption` to the column name — each
  column's caption is independently addressable. See
  [Template language reference → Bindings](/reference/template-language#bindings).

### Changed

- **Faster rendering across typical documents.** Internal improvements to the core
  render path cut render time by up to 50% in our own benchmarks on typical
  multi-line documents, with output verified byte-identical to before — no template
  changes needed to benefit.
- **Page Size card reorganized by unit.** The custom page-size card now groups its
  geometry fields by unit (Millimeters / Inches / Points), each listing every
  dimension together, instead of grouping by dimension with all three units
  interleaved. Editing any field still updates the others automatically; no change to
  the underlying values or behavior.
- **Render-failure telemetry (`LF0002`) carries more diagnostic detail.** A failed
  render's telemetry event now includes the failing element's location and a finding
  count alongside the existing error code, so a failure can be diagnosed without
  needing the document's data. See [Telemetry](/guides/telemetry).

### Fixed

- **Dataset Fields now resolve at render time.** A field added via Dataset Fields
  (client or API) now correctly reaches `discoverDatasetSchema` and renders in a
  template — previously the configuration was accepted and validated but never
  consumed downstream. See [Adding fields to a report's dataset](/guides/dataset-fields).
- **Clearer error for a report that requires filter input.** A report that cannot
  produce data without filter information now fails with an accurate `invalidFilter`
  error naming the actual cause, instead of a misleading message that read like a
  missing-layout problem.
- **Custom and subsetted fonts no longer wrap lines too early.** Text styled in a
  custom font (including a barcode or MICR font, which are far narrower than the
  default font at the same point size) could wrap before it needed to, because line
  wrapping was measuring against the default font's metrics instead of the actual
  font in use. Existing layouts render unaffected unless they used a custom font.
- **Layout Studio no longer crashes while typing a Block parameter.** Typing a
  parameter into a Block include (e.g. `key=`) with the value not yet entered could
  crash the editor's live preview mid-keystroke. Fixed.

## 1.0.50.0 — 2026-07-13

### Fixed

- **Licensing-verification edge case.** A licensing check could incorrectly report a
  properly licensed environment as unlicensed under some Microsoft Entra tenant
  configurations. Fixed.

## 1.0.49.0 — 2026-07-12

### Added

- **Conditional display with `data-if`.** Show or hide an element based on a bound value:
  `data-if="{{Column}}"`, `data-if="{{DataItem.Column}}"`, or negated `data-if="!{{Column}}"`.
  The element is hidden when the value is empty, numeric zero, or the literal `false` —
  and a hidden element takes up no space (no blank gap). Combine it with `data-each` to
  filter individual rows, e.g. drop a tax line when its amount is zero. See
  [Template language → Conditional display](/reference/template-language#conditional-display-data-if).
- **Reusable Blocks with parameters.** A Block can now take parameters at the include site
  — `{{> lineItems item=ItemNo desc=Description qty=Quantity amount=LineAmount}}` — so one
  Block can be reused across reports whose datasets use different field names. Inside the
  Block, reference each parameter with the `{{$name}}` placeholder. Unquoted values are
  dataset field references; quoted values (`note="N/A"`) are literals. A plain
  `{{> name}}` with no parameters behaves exactly as before. See
  [Template language → Reusable Blocks with parameters](/reference/template-language#reusable-blocks-with-parameters).
- **Custom page sizes.** Define your own named page sizes as data in the client, then
  reference one by name with `page-size="MyName"`. Dimensions and margins can be entered
  in **millimetres, inches, or points** — enter whichever unit you prefer and the others
  are computed for you. A4 and Letter ship built in. See
  [Template language → Custom page sizes](/reference/template-language#custom-page-sizes).
- **Insert picker in Layout Studio.** Browse and insert dataset fields, Blocks, images,
  and fonts from the editor without memorising token syntax — inserted at the cursor in
  the Studio editor. See [Using the insert picker](/guides/using-the-insert-picker).
- **Database-backed shared styles.** Define named style classes once — inline `style="..."`
  on an element, a template's own `<style>` block, or a registered, reusable stylesheet
  asset — instead of repeating `style="..."` everywhere. Corporate colors and typography
  set once, used everywhere, adjustable in one place. A per-property cascade resolves
  inline > `<style>` block > registered stylesheet across a 22-property allowlist.
  Registered stylesheets follow the same Copy / Customize / Revert lifecycle as Blocks and
  fonts. See [Shared styles guide](/guides/styles).
- **1D barcodes with render-time auto-encode.** Bind a raw value (an item number, a GTIN)
  to text styled in a built-in barcode font — Code 39, Code 128, or EAN-13 — and Pageworks
  auto-encodes it for you at render time; no manual encode call required. The framework is
  extensible for a developer to add a symbology of their own. See
  [Barcodes guide](/guides/barcodes).
- **QR codes — the `<qr>` tag.** Render a scannable, vector QR code with a single
  `<qr value="{{...}}" />` tag bound to any dataset field, with an adjustable
  `ec-level`. See [QR codes guide](/guides/qr-codes).
- **Check printing — built-in MICR E-13B font.** Author a MICR line (routing, account,
  check number, plus the four control symbols) as ordinary styled text — at `font-size:
  36pt` the glyphs render at the exact ANSI X9.27 physical dimensions check-processing
  equipment expects. See [Fonts shipped with Pageworks](/guides/fonts).
- **Built-in general-purpose text fonts.** Every install now seeds baseline
  `Extension`-scope fonts (Source Sans 3 and Source Serif 4, all four style variants) — a
  working, professional-looking document out of the box with no font upload required. See
  [Fonts shipped with Pageworks](/guides/fonts).

### Changed

- **Layout file extension normalized to `.pageworks`.** The layout file extension is now a
  single `.pageworks` (previously the double `.pageworks.html`, which was unreliable for
  report-layout MIME derivation). Existing layouts are unaffected; new layouts should use
  the single extension.

## 1.0.38.0 — 2026-07-10

### Changed

- **"Partials" renamed to "Blocks" in the client.** User-facing captions, tooltips, and
  messages now say "Blocks" throughout. No effect on the `{{> name}}` include syntax.

### Added

- **Discoverable font upload workflow.** An improved, easier-to-find path for uploading a
  custom font asset from the client.

### Fixed

- **`<img>` / `<hr>` now honor asymmetric column insets.** Horizontal insets on a
  containing column are respected for these elements, matching other content.
- **Demo layout file uses a single `.pageworks` extension.**

## 1.0.29.1 — 2026-07-09

### Fixed

- **A `<table>`'s own padding, margin, and border now apply inside a `<region>`.**
  Previously these were ignored for a table nested inside a fixed-position region.

## 1.0.26.0 — 2026-07-09

### Changed

- **Table cells no longer add implicit padding.** `<td>`/`<th>` cells now render with no
  built-in padding, so cell spacing is fully under your control via `style` — existing
  layouts that relied on the old implicit spacing may need explicit padding added.

## 0.8.24.0 — 2026-07-08

### Added

- **Initial release.** Author report layouts as text templates (an HTML subset) with data
  bindings (`{{Column}}`, `{{DataItem.Column}}`), repeating sections (`data-each`),
  reusable Blocks (`{{> name}}`), and design-time validation that reports clear finding
  codes. Includes the **Layout Studio** editor with live preview for building and adjusting
  layouts without writing AL.
- **Images and logos.** Embed images with `<img>`, including dataset-bound images, with
  control over sizing, fit, and alignment. Extensions can supply their own images.
- **Custom fonts.** Embed custom fonts and register fonts from an extension, with support
  for non-Latin scripts (e.g. Cyrillic and Greek).
- **Invoice-grade documents.** Engine-computed carryover and running totals
  (brought-forward / carried-forward), repeating group headers, value formatting controls,
  double-rule borders on totals rows, and fixed-position `<region>` elements.
- **Box model.** Blocks support padding, vertical spacing between blocks, and coloured
  borders, for finer control over spacing and framing.
- **Richer table cells.** `<td>`/`<th>` gained `colspan`, `rowspan`, `vertical-align`,
  and the ability to nest block content inside a cell (e.g. a small key/value grid within
  one cell).
- **Side-by-side block flow.** Place blocks, tables, or sections next to each other by
  giving them a `width` (e.g. two halves at `width: 50%`) on `<table>`, `<div>`, or
  `<section>`, instead of everything stacking top to bottom — useful for headers with a
  logo on one side and address on the other. See
  [Template language](/reference/template-language).

### Fixed

- **Header and logo bands across page breaks.** Repeated header/logo bands no longer
  collide with continuation content on multi-page documents.

---

*Detailed changelog tracking begins with the entries above; version numbers are the
value shown on your install's Extension Management page.*
