---
title: External API for layout-development tools
description: Render, discover, publish, and manage Pageworks layouts entirely over the Business Central API — for building external layout-development tools.
---

# External API for layout-development tools

Pageworks exposes a dedicated Business Central API surface that lets an **external
tool** — a layout-development assistant, a CI pipeline, an internal design tool — build
and publish report layouts entirely over the wire, with no interactive Business Central
session required. It covers the same ground the interactive Layout Studio and asset
pages already offer:

- **Discover which reports exist** to build against, before touching a specific one.
- **Render** draft template text against a report and get back a document, with nothing
  saved — ideal for a tight iterate/preview loop.
- **Discover** which data a report exposes, so a caller knows what it can bind to and
  filter on before it renders anything.
- **Manage assets** — Fonts, Stylesheets, Blocks, Page Sizes, and Images — with full
  create/read/update/delete, the same capability the interactive asset pages offer.
- **Publish** a finished template as a real, selectable report layout for a report.

This is a standard Business Central web API (`PageType = API`, OData v4) — the same
mechanism any other Business Central API integration uses. If you haven't called a
custom Business Central API before, start with Microsoft's own
[Using OAuth to authenticate Business Central web services](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/webservices/authenticate-web-services-using-oauth)
guide for authentication (Microsoft Entra ID / OAuth app registration, or a web service
access key for testing) — Pageworks doesn't add or change any of that; it just publishes
API pages under its own group.

Every endpoint below is served under:

```
.../api/smc/pageworks/v1.0/companies({companyId})/...
```

## 1. Enabling access

Assign the **Pageworks External Layout API** permission set to the user or application
identity that will call this API. It's a dedicated, minimal grouping — separate from
Pageworks's own broader internal permissions — that grants only what these endpoints
need: the action entry points below, read access to the `pageworksReports` discovery
list, and read/insert/modify/delete on the asset and dataset-field-configuration entity
sets. It does **not** grant access to Pageworks's interactive pages or any other part of
the app.

## 2. Discovering reports

Entity set `pageworksReports` (entity `pageworksReport`) is a read-only list of every
report eligible for the actions in this API — a plain `GET`, not a bound action:

```
GET .../pageworksReports
GET .../pageworksReports?$filter=contains(caption,'Invoice')
GET .../pageworksReports?$filter=reportId eq 1306
```

Each row: `reportId`, `name` (the AL object name), `caption`, `hasRequestPage`,
`defaultLayout` (`RDLC`/`Word`/etc. — the report's layout *before* you publish anything
through this API), `firstDataItemTableId`.

This lists every eligible report **whether or not a Pageworks layout has ever been
published for it** — it's a catalog of what you *could* build against, not a log of what
you've already touched. A report with no data item (a processing-only report) is
correctly excluded. Use this to find a `reportId` without needing AL source access or
the Business Central client's object designer.

## 3. Layout actions

Entity set `pageworksLayoutActions` (entity `pageworksLayoutAction`) exposes bound
actions on its single row. Call them as a standard OData bound action — `POST` to the
entity set's row with the action name appended:

```
POST .../pageworksLayoutActions(1)/Microsoft.NAV.renderTemplate
POST .../pageworksLayoutActions(1)/Microsoft.NAV.renderTemplateWithDiagnostics
POST .../pageworksLayoutActions(1)/Microsoft.NAV.getFilterShape
POST .../pageworksLayoutActions(1)/Microsoft.NAV.buildFilterParams
POST .../pageworksLayoutActions(1)/Microsoft.NAV.publishLayout
```

Every action either returns its result, or fails with an OData error whose message is
shaped `<code>: <message>` — a machine-checkable code, a colon, then a human-readable
explanation. The possible codes are listed with each action below.

### `renderTemplate`

Renders draft template text against a report and returns the resulting document.
Nothing is persisted — two calls never share state, and no interactive session is
needed.

| Parameter | Type | Meaning |
|---|---|---|
| `reportId` | Integer | The report to render. |
| `templateText` | Text | The draft template text to render (the same language documented in [Template language reference](/reference/template-language)). |
| `filterParamsXml` | Text | Request-page parameter XML restricting which records print, or empty for unfiltered. This is genuine `RequestPageParameters` XML — see the note under `getFilterShape` below for how to author it. |

Returns the rendered document as base64 text (PDF).

Failure codes: `reportNotFound`, `invalidFilter`, `templateParseError`,
`missingAssetReference`, `notLicensed`.

:::tip[Some reports genuinely need filter input before they can render]
A report whose request page requires filter input to produce any data (e.g. a document
report that needs a specific record selected, not just "run with defaults") returns:
`invalidFilter: Report <id> could not produce data because it requires filter information
before it can run. Build filter parameters for one or more of the report's fields, then
supply them.` This is not a bug to work around — it means `filterParamsXml` needs real
content. Use `buildFilterParams` (below) to construct it without hand-authoring
`RequestPageParameters` XML yourself.
:::

### `renderTemplateWithDiagnostics`

Same inputs as `renderTemplate` (`reportId`, `templateText`, `filterParamsXml`), but
returns a richer result meant for automated/programmatic verification of a render — no
need to rasterize the PDF and inspect it visually. Returns JSON text shaped:

```json
{
  "documentBase64": "...",
  "diagnosticsSchemaVersion": 2,
  "diagnostics": [
    {
      "code": "contentOutsidePageMargin",
      "severity": "warning",
      "page": 1,
      "x": 700.0, "y": 126.49, "width": 88.07, "height": 11.0,
      "message": "Content on page 1 extends 212.8 pt past the right page margin."
    }
  ],
  "geometrySchemaVersion": 2,
  "geometry": [
    { "kind": "text", "page": 1, "x": 158.82, "y": 803.59, "width": 56.86, "height": 11.0,
      "text": "Header text", "font": "Helvetica/Regular/11", "color": "" },
    { "kind": "image", "page": 1, "x": 20.0, "y": 697.89, "width": 120.0, "height": 120.0 },
    { "kind": "row-box", "page": 1, "x": 20.0, "y": 697.89, "width": 555.28, "height": 120.0, "elementRef": "" },
    { "kind": "cell-box", "page": 1, "x": 20.0, "y": 697.89, "width": 138.82, "height": 120.0, "elementRef": "col 1" },
    { "kind": "line", "page": 1, "x": 20.0, "y": 685.89, "width": 555.28, "height": 0.0 }
  ]
}
```

`geometry` is the computed box-model layout of the rendered page(s) — `kind` is one of
`text`/`image`/`row-box`/`cell-box`/`line` (more may appear over time); every entry
carries `page` and `x`/`y`/`width`/`height` in points, `text` entries also carry the
literal string, resolved `font`, and `color`. This lets a caller verify alignment,
detect overlap, or confirm two elements sit side by side with plain arithmetic on
numbers — no image rendering, no OCR/vision step, and no ambiguity translating pixels
back to the source template.

Confirmed diagnostic codes and what triggers them:

| Code | Fires when |
|---|---|
| `contentOutsidePageMargin` | Any content's box extends past the page margin on any side. |
| `rowContentOverflow` | Content inside a table row extends past that row's own edge (e.g. an image wider than its column). |

:::caution[`unresolvedBinding` is not a soft diagnostic]
An unresolved `{{...}}` binding does **not** appear as an entry in `diagnostics` — it
still throws the same hard `templateParseError`/400 that plain `renderTemplate` does, so
you never get a `documentBase64` back to inspect in that case. Design around this: an
unresolved binding is a "the render didn't happen at all" failure, not a "here's what's
wrong with the render" finding — check bindings against `getFilterShape` *before*
calling either render action, don't rely on diagnostics to catch a bad binding.
:::

### `getFilterShape`

A discovery aid: returns a static description of a report's filterable data — which
data items it has, and which fields on each item are already exposed as columns in
the report's own dataset — without running the report or opening a session.

`fields` lists only what the report's dataset already declares as a column, not every
field on the item's underlying table. A field that exists on the table but isn't
declared as a column won't appear here and can't be filtered on through this API today
(`getFilterShape` reflects the report's own AL-declared columns only). Getting it onto
the report means either extending the report in AL, or using
[Dataset Fields](/guides/dataset-fields) to add it by configuration — see §4 below. A
field added that way is bindable in a template and discoverable via
`discoverDatasetSchema` (§4), but does not appear in `getFilterShape`'s own output — the
two are separate discovery surfaces for separate purposes (filtering vs. binding).

A data item with no underlying record — e.g. an `Integer` data item used purely to
shape repeated header columns — correctly reports `relatedTableId: 0` and an empty
`fields` array; that's expected, not a discovery failure.

| Parameter | Type | Meaning |
|---|---|---|
| `reportId` | Integer | The report whose filter shape to return. |

Returns JSON text shaped:

```json
{
  "reportId": 1306,
  "dataItems": [
    {
      "name": "Header",
      "relatedTableId": 112,
      "relatedTableName": "Sales Invoice Header",
      "fields": [
        { "no": 1, "name": "No.", "caption": "No." }
      ]
    }
  ]
}
```

This is a discovery aid — pair it with `buildFilterParams` (below) to go from "what can I
filter on" to genuine `RequestPageParameters` XML without hand-authoring it yourself.

Failure codes: `reportNotFound`.

### `buildFilterParams`

Builds valid `RequestPageParameters` XML from a plain list of field filters — the input
`renderTemplate`'s `filterParamsXml` parameter expects — so you never need to hand-author
that XML format yourself.

| Parameter | Type | Meaning |
|---|---|---|
| `reportId` | Integer | The report the filters apply to. |
| `filterEntriesJson` | Text | A JSON array of filter entries — see shape below. |

Each entry in `filterEntriesJson` needs a `dataItemName` (matching a name from
`getFilterShape`), either `fieldNo` **or** `fieldName` to identify the field, and a
`filterText` (the filter value or expression, in the same syntax you'd type into a
Business Central filter field):

```json
[{ "dataItemName": "Header", "fieldNo": 3, "filterText": "PS-INV103001" }]
```

Returns the built `RequestPageParameters` XML as plain text — pass it straight through
to `renderTemplate`'s `filterParamsXml` parameter.

Failure codes: `reportNotFound`, `invalidFilterInput` (a `dataItemName`/field doesn't match
the report's shape).

### `publishLayout`

Registers finished template text as a real, selectable report layout for a report,
using Business Central's own standard report-layout mechanism — the same one any RDLC
or Word layout uses, so the result shows up wherever a user picks a report layout
today.

| Parameter | Type | Meaning |
|---|---|---|
| `reportId` | Integer | The target report. |
| `layoutName` | Text | The layout's caller-facing name. |
| `templateText` | Text | The finished template text to publish. |

Returns JSON text shaped `{"status": "created"|"updated", "layoutCode": "..."}`.
Re-publishing the same name against the **same** report updates it in place. The same
`layoutName` may exist independently under a different report — layout names are scoped
per report, not global.

Failure codes: `reportNotFound`, `templateParseError`, `missingAssetReference`,
`notLicensed`.

## 4. Dataset field configuration (custom fields without AL)

The same configuration that powers the interactive [Dataset Fields](/guides/dataset-fields)
feature is reachable through this API as three plain OData entity sets plus one bound
action — no separate mechanism, this is the same underlying data:

```
POST/GET .../pageworksDatasetBindings           (entity pageworksDatasetBinding)
POST/GET .../pageworksDatasetFields              (entity pageworksDatasetField)
POST/GET .../pageworksDatasetLinks               (entity pageworksDatasetLink)
POST .../pageworksDatasetBindings(reportId=...,lineNo=...)/Microsoft.NAV.discoverDatasetSchema
```

A `pageworksDatasetBinding` anchors a rule to one of a report's own data items
(`anchorDataItemName`) and a related table to pull from (`targetTableNo`). **`targetTableNo`
defaults to `0` on create** — you must `PATCH` it to the real table number before adding
any `pageworksDatasetField` rows against that binding, or the field-add call fails with an
error explaining that the binding doesn't have a target table selected yet. A
`pageworksDatasetField` row (keyed by `reportId`,
`configLineNo`, `lineNo`) then names one target field to pull in as a new column
(`targetFieldNo`, `newColumnName`, `valueType` read-only/detected, `aggregation`,
`enabled`, and a read-only `isValid`/`invalidReason` pair).

A `pageworksDatasetLink` (keyed by `reportId`, `configLineNo`, `linkFieldLineNo`) is one
match-key pair for a binding: `anchorColumnName` (a column already on the report) paired
with `targetFieldNo`/`targetFieldCaption` on the target table, plus a read-only
`isValid`/`invalidReason` pair. A binding needs **zero or more** of these — see "Bindings
with no link" below.

`discoverDatasetSchema` (bound to a specific `pageworksDatasetBinding` row, parameter
`forReportId`) returns the report's existing columns per data item — including any
columns added via `pageworksDatasetFields`, as soon as the field is created — plus the
bindings already configured. This is the same shape used to populate the interactive
card's lookups. Note that a column appearing here means it's *configured*, not
necessarily that it will *resolve* at render time — check `isRenderReady` (below) for that.

:::tip[Confirmed working end-to-end]
The full flow — create a binding, add a field, define a link (if the target table needs
one), then render a template referencing the new column — is confirmed working: the
template resolves the binding and renders the real, per-row pulled value.
:::

### Checking readiness before you render

These fields on `pageworksDatasetBinding` tell you whether a binding will actually
resolve, without waiting for a render to fail:

| Field | Meaning |
|---|---|
| `linkFieldCount` | How many `pageworksDatasetLinks` rows exist for this binding. |
| `isRenderReady` | Whether this binding is currently wired up enough to resolve at render time — a target table plus at least one enabled mapped field, regardless of link count. |
| `selectionBasis` | Which mechanism this binding will actually use: `"Linked"` (resolves via `pageworksDatasetLinks` match keys), `"StaticFilter"` (resolves via the binding's stored `filterView`, no link needed), or `"FirstRecordUnfiltered"` (no link and no filter — the target table's first record under `FirstMatch` is used for every row). |

`isValid: true` on a `pageworksDatasetField` only means the field's own configuration is
well-formed (the target field still exists, the value type resolved) — it says nothing
about whether the *binding* it belongs to will resolve. Always check the binding's
`isRenderReady`/`selectionBasis` before assuming a configured field will render,
especially before automating against this API.

### Bindings with no link

A `pageworksDatasetBinding` can be `isRenderReady: true` with **zero**
`pageworksDatasetLinks` rows, as long as it has a target table and at least one enabled
mapped field. With no link, resolution falls back to:

- A stored `filterView` on the binding narrowing the target table to one record →
  `selectionBasis: "StaticFilter"`.
- No filter at all → the target table's first record (in `FirstMatch` order) →
  `selectionBasis: "FirstRecordUnfiltered"`.

This is the right shape for a **single-record target table** — binding to Company
Information, for example, needs no per-row link at all, since every row would resolve to
the same one record regardless. `selectionBasis` is what lets a caller confirm (before
rendering) that a binding is intentionally doing an unfiltered first-record pull, rather
than being surprised by it.

### Media/BLOB fields render as images

A `pageworksDatasetField` mapped from a Media- or BLOB-typed source field projects
through the same `{{Column}}` / `{{DataItem.Column}}` binding syntax as any other field —
and can be used directly as an `<img>` source:

```
<img src="{{CompanyLogo_Custom}}" width="120pt" fit="contain"/>
```

No separate `pageworksImages` asset registration is needed for this — the image bytes
come live from the bound record at render time, the same Media/Blob binding mechanism
documented in [Template language → Images](/reference/template-language#images-img).

## 5. Asset management

Every asset type a template can reference is exposed as a standard OData entity set —
ordinary `GET`/`POST`/`PATCH`/`DELETE`, no bound actions. Each mirrors the fields
already on that asset's interactive card. An **extension-managed row** (`scope` =
`Extension` — shipped by Pageworks or a dependency app) is read-only through this API,
exactly as it is on the interactive card: creating, modifying, or deleting it is
refused. Every row you create through this API is a tenant-scoped override, exactly
like creating one from the interactive card.

| Entity set | Entity | Underlying asset |
|---|---|---|
| `pageworksFonts` | `pageworksFont` | [Fonts](/guides/fonts) |
| `pageworksStyles` | `pageworksStyle` | [Stylesheets](/guides/styles) |
| `pageworksBlocks` | `pageworksBlock` | Reusable Blocks (see [Template language](/reference/template-language)) |
| `pageworksPageSizes` | `pageworksPageSize` | Custom page sizes (see [Template language](/reference/template-language#custom-page-sizes)) |
| `pageworksImages` | `pageworksImage` | Images |

Common fields on every entity: `id`, `lastModifiedDateTime`, `scope` (`Extension` or
`Tenant`, read-only), `name`, `description`.

- **`pageworksFonts`** additionally exposes `styleVariant`, `interpreter` (the barcode
  symbology a barcode font is coupled to, or none for a plain text font — see
  [Barcodes](/guides/barcodes)), `licenseNoticeAcked`, `format` (read-only), `byteSize`
  (read-only), `contentHash` (read-only), and `contentBase64` — the font file's bytes,
  base64-encoded. Write `contentBase64` to upload or replace a font's content; there's
  no file-upload dialog over the API, so base64 is the transport for all binary content
  below too.
- **`pageworksStyles`** additionally exposes `contentField` — the stylesheet's CSS-like
  class-definition text.
- **`pageworksBlocks`** additionally exposes `contentField` — the Block's markup text.
- **`pageworksPageSizes`** additionally exposes every geometry field in all three units:
  `widthMm`/`heightMm`/`marginTopMm`/`marginRightMm`/`marginBottomMm`/`marginLeftMm`,
  the same six suffixed `In` (inches), and the same six suffixed `Pt` (points). Writing
  any one unit's fields keeps the other two in sync automatically — same behavior as
  the interactive card.
- **`pageworksImages`** additionally exposes `format` (read-only), `nativeWidthPx`/
  `nativeHeightPx` (read-only), `byteSize` (read-only), `contentHash` (read-only), and
  `contentBase64` — the image's bytes, base64-encoded.

## 6. Licensing

Every action above enforces the same licensing check as its interactive equivalent —
calling this API against an unlicensed environment fails the same way the interactive
render path would (`notLicensed`).

## See also

- [Template language reference](/reference/template-language) — the markup language
  `templateText` is written in.
- [Error & finding code catalog](/reference/error-codes) — the underlying validation/
  render finding codes that `templateParseError` and `missingAssetReference` summarize.
- [Developer reference](/reference/developer-reference) — the AL-level contract for
  building a dependency app against Pageworks (a different audience: this API is for an
  *external*, non-AL caller).
