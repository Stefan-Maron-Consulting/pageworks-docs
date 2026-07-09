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

## Planned capabilities

| Capability | What it means for you |
|---|---|
| **Corporate demo/starter design gallery** | A curated set of professionally designed, ready-to-use layouts (invoices and more) to start from instead of a blank page. |
| **Reusable, parameterized partials** | Shared template fragments (e.g. a "line items" section) that can be reused across different reports even when the underlying dataset uses different column names, via a field mapping passed at the point of use. |
| **Self-service custom fields, no developer required** | Add a field to a layout that the underlying report doesn't already expose — by pointing at a related record from data already on the report — without a code change. |
| **Export to extension** | Once a self-service layout uses an added custom field, generate the AL extension that makes that addition "official," for a developer to review and ship. The layout itself doesn't change in the handoff. |
| **Conditional display (`data-if`)** | Show or hide a row, cell, block, or section based on data — e.g. hide a VAT line when there's no VAT — without a developer. |
| **Custom page sizes as data** | Define non-standard paper or label sizes (e.g. a specific label roll) as data in Business Central, instead of requiring a code change for anything beyond A4/Letter. |
| **Embedded designer** | A guided, in-tenant surface for consultants and end users to build and adjust layouts using the capabilities above, without hand-writing template markup. |

## Planned behavior change

**Removing the implicit table cell padding.** `<td>`/`<th>` currently get a small,
undeclared 4pt padding by default — every other element (`<p>`, `<div>`, headings, etc.)
defaults to zero padding unless you declare it. This is planned to change so table cells
follow the same "declare nothing, get nothing" rule as everything else. This is a visible
change for any existing template that relies on the current default spacing without
declaring `padding` explicitly — when it ships, it will come with clear release notes and
enough notice to review affected templates before upgrading.

## Requesting something

Have a capability you need that isn't listed here? [Open a feature request](https://github.com/Stefan-Maron-Consulting/pageworks-docs/issues/new?template=feature_request.yml).
Found a bug? [Open a bug report](https://github.com/Stefan-Maron-Consulting/pageworks-docs/issues/new?template=bug_report.yml).
