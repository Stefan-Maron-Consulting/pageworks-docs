---
title: Changelog
description: Notable user-facing changes to Pageworks, newest first.
---

# Changelog

Notable changes to Pageworks that affect how you author layouts or configure the app,
newest first. This list covers **user-facing** changes only — it is not an exhaustive
build log. For what's coming next, see the [Roadmap](/roadmap).

Changes are grouped as **Added** (new capabilities), **Changed** (existing behaviour that
now works differently), and **Fixed** (corrected defects).

## 2026-07-12

### Added

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

## 2026-07-10

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

### Changed

- **Table cells no longer add implicit padding.** `<td>`/`<th>` cells now render with no
  built-in padding, so cell spacing is fully under your control via `style` — existing
  layouts that relied on the old implicit spacing may need explicit padding added.

## 2026-07-08

### Added

- **Side-by-side block flow.** Place blocks, tables, or sections next to each other by
  giving them a `width` (e.g. two halves at `width: 50%`) on `<table>`, `<div>`, or
  `<section>`, instead of everything stacking top to bottom — useful for headers with a
  logo on one side and address on the other. See
  [Template language](/reference/template-language).

## 2026-07-06

### Fixed

- **Header and logo bands across page breaks.** Repeated header/logo bands no longer
  collide with continuation content on multi-page documents.

## 2026-07-05

### Added

- **Box model.** Blocks support padding, vertical spacing between blocks, and coloured
  borders, for finer control over spacing and framing.
- **Richer table cells.** `<td>`/`<th>` gained `colspan`, `rowspan`, `vertical-align`,
  and the ability to nest block content inside a cell (e.g. a small key/value grid within
  one cell).

## 2026-07-04

### Added

- **Images and logos.** Embed images with `<img>`, including dataset-bound images, with
  control over sizing, fit, and alignment. Extensions can supply their own images.
- **Custom fonts.** Embed custom fonts and register fonts from an extension, with support
  for non-Latin scripts (e.g. Cyrillic and Greek).
- **Invoice-grade documents.** Engine-computed carryover and running totals
  (brought-forward / carried-forward), repeating group headers, value formatting controls,
  double-rule borders on totals rows, and fixed-position `<region>` elements.

## 2026-07-03

### Added

- **Initial release.** Author report layouts as text templates (an HTML subset) with data
  bindings (`{{Column}}`, `{{DataItem.Column}}`), repeating sections (`data-each`),
  reusable Blocks (`{{> name}}`), and design-time validation that reports clear finding
  codes. Includes the **Layout Studio** editor with live preview for building and adjusting
  layouts without writing AL.

---

*Detailed changelog tracking begins with the entries above; dates reflect when each
capability landed in the codebase.*
