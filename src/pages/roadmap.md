---
title: Roadmap
description: What's planned next for Pageworks.
---

# Roadmap

This page tracks capabilities planned for Pageworks. It reflects direction, not a
committed delivery schedule — priorities can shift. Track day-to-day progress on the
[project board](https://github.com/orgs/Stefan-Maron-Consulting/projects), and use
[Issues](https://github.com/Stefan-Maron-Consulting/pageworks-docs/issues) to file bugs
or request features.

## Guiding idea

Pageworks is built primarily for **consultants and business end users doing self-service
layout design** — adjusting or building a report layout without writing AL. AL developers
remain a first-class audience (the public API, and an eventual export path from
self-service configuration to a real extension), but the everyday user is not expected to
be a developer.

## Recently shipped

| Capability | What it means for you |
|---|---|
| **Conditional display (`data-if`)** | Show or hide a row, cell, or section based on data — e.g. hide a VAT line when there's no VAT — without a developer. See [Template language reference](/reference/template-language). |
| **Reusable, parameterized Blocks** | Shared template fragments (e.g. a "line items" section) that can be reused across different reports even when the underlying dataset uses different column names, via parameters passed at the point of use. See [Template language reference](/reference/template-language). |
| **Custom page sizes as data** | Define non-standard paper or label sizes (e.g. a specific label roll) as data in Business Central, instead of requiring a code change for anything beyond A4/Letter. See [Template language reference](/reference/template-language). |
| **Insert picker in Layout Studio** | Browse and insert dataset fields, Blocks, images, and fonts without memorizing the template syntax. See [Using the Insert picker](/guides/using-the-insert-picker). |
| **Database-backed shared styles** | Define named style classes once — as a registered, reusable stylesheet or a template's own `<style>` block — instead of repeating `style="..."` on every element. Define corporate colors and typography once, use everywhere, adjust in one place. Follows the same Copy / Customize / Revert lifecycle as Blocks and fonts. See [Shared styles guide](/guides/styles). |
| **Open source fonts bundled with the extension** | A curated set of high-quality open source fonts (plus generated barcode and MICR fonts) shipped with every install — no manual font upload required for a working, professional-looking document out of the box. See [Fonts shipped with Pageworks](/guides/fonts). |
| **1D barcodes** | Bind a raw value (an item number, a GTIN) to text styled in a built-in barcode font — Code 39, Code 128, or EAN-13 — and Pageworks auto-encodes it at render time. No font hunting, no manual encode step. See [Barcodes guide](/guides/barcodes). |
| **QR codes** | Drop a single `<qr value="{{...}}" />` tag to render a scannable, vector QR code bound to any dataset field — no font upload, no external service. See [QR codes guide](/guides/qr-codes). |
| **Check printing (MICR E-13B)** | A built-in MICR E-13B font makes Pageworks a viable check-printing engine — author the MICR line as ordinary styled text, no special encoding. See [Fonts shipped with Pageworks](/guides/fonts). |
| **External API for layout-development tools** | Build a layout-development tool against Pageworks entirely over the Business Central API — render, discover a report's data, manage every asset type, and publish a finished layout, all without an interactive session. See [External API for layout-development tools](/reference/external-layout-api). |
| **Self-service dataset fields, no developer required** | Add a field to a layout that the underlying report doesn't already expose — by pointing at a related record from data already on the report — without a code change. Works for single-record lookups too (e.g. Company Information) with no match step required, and a Media/BLOB field pulled this way can be used as an image. See [Adding fields to a report's dataset](/guides/dataset-fields). |
| **Build filter parameters without hand-authoring XML** | Some reports need filter information before they'll render; `buildFilterParams` builds valid request-page filter XML from a plain list of field filters. See [External API for layout-development tools](/reference/external-layout-api). |

## Planned capabilities

| Capability | What it means for you |
|---|---|
| **Corporate demo/starter design gallery** | A curated set of professionally designed, ready-to-use layouts (invoices and more) to start from instead of a blank page. |
| **Export to extension** | Once a self-service layout uses an added dataset field, generate the AL extension that makes that addition "official," for a developer to review and ship. The layout itself doesn't change in the handoff. |
| **Embedded designer** | A guided, in-tenant surface for consultants and end users to build and adjust layouts using the capabilities above, without hand-writing template markup. |
| **Richer style selectors** | Shared styles currently target elements by named **class** (`class="brand"`). Planned: broaden how a style rule can match — at minimum element **`id`** selectors, and potentially element/type selectors (e.g. style every `<td>`) — to give the fuller targeting flexibility people expect from HTML/CSS. (Also on this track: fully **isolated Block-local styles**, so a Block can carry its own class namespace without leaking to or from the host layout.) |
| **Dataset-driven format expressions** | Allow AL developers to expose format expressions (for dates, decimals, numbers) through the dataset, then reference them in template format attributes. Gives AL control over formatting without modifying the template. |
| **Copilot integration for layout design** | AI-driven layout assistance directly in Business Central. Describe what you want in natural language — Copilot generates markup, adjusts styling, and suggests improvements. Rapid prototyping and iteration without writing code. (The [external layout-development API](/reference/external-layout-api) above is the building block this will be built on.) |

## Requesting something

Have a capability you need that isn't listed here? [Open a feature request](https://github.com/Stefan-Maron-Consulting/pageworks-docs/issues/new?template=feature_request.yml).
Found a bug? [Open a bug report](https://github.com/Stefan-Maron-Consulting/pageworks-docs/issues/new?template=bug_report.yml).
