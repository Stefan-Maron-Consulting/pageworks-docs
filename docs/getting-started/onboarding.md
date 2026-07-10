# Pageworks — Developer Onboarding Guide

This guide takes an AL developer from a plain, dataset-only report to a report that
renders deterministic PDF output through Pageworks. It stands alone — you do not
need access to the engine's source code, and there is no per-report rendering code to
write. Target: a wired report in under 30 minutes.

**Prerequisites**

- Pageworks installed in the environment (any number of reports share one installation).
- Business Central 2025 wave 2 or later (platform 27.0+, application 27.5+).
- Your report has a complete dataset (data items and columns). The engine renders the
  standard platform dataset — it never queries application tables itself.

---

## 1. Wire a report (declarative, no rendering code)

Add a `rendering` clause to your report object pointing at a Pageworks template file.
The mime type `reportlayout/pageworks` is the engine's layout identity — it is what
routes rendering through Pageworks. Reports and layouts without this mime type are
never touched.

```al
report 70100 MyInvoice
{
    DefaultRenderingLayout = Pageworks;

    dataset
    {
        dataitem(Header; "Sales Invoice Header")
        {
            column(No; "No.") { }
            column(SellToName; "Sell-to Customer Name") { }

            dataitem(Line; "Sales Invoice Line")
            {
                DataItemLink = "Document No." = field("No.");
                column(Description; Description) { }
                column(Quantity; Quantity) { }
                column(Amount; Amount) { }
            }
        }
    }

    rendering
    {
        layout(Pageworks)
        {
            Type = Custom;
            LayoutFile = './src/Layouts/MyInvoice.pageworks.html';
            MimeType = 'reportlayout/pageworks';
            Caption = 'Pageworks PDF';
            Summary = 'Deterministic PDF rendered by Pageworks.';
        }
    }
}
```

That is the entire wiring. Deploy, run the report, choose PDF/Preview/Print — the
engine renders it.

**Output formats.** PDF, Preview, and Print are served by the engine's native PDF
backend. Requesting Word or Excel from a Pageworks layout raises an actionable error
(`LF-FMT: This Pageworks layout renders PDF only. Choose PDF, Preview, or Print
output instead.`) — never silent empty output. If a report must also offer Word/Excel,
declare a second (RDLC or Word) layout in the same `rendering` block; the platform's
standard layout selection lets users pick per run.

## 2. The `.pageworks.html` convention

Templates are plain, well-formed XHTML files named `*.pageworks.html` — agent- and
diff-friendly, editable in any text editor, and reviewable in pull requests like any
other source file. A minimal template for the report above:

```html
<template page-size="A4" orientation="portrait" margin="56.7">
  <header>
    <p style="text-align: right;">Page {{PAGE}} of {{NUMPAGES}}</p>
  </header>
  <body>
    <h1>Invoice {{Header.No}}</h1>
    <p>{{Header.SellToName}}</p>
    <table>
      <tr>
        <th style="width: 50%;">Description</th>
        <th style="width: 20%; text-align: right;">Quantity</th>
        <th style="width: 30%; text-align: right;">Amount</th>
      </tr>
      <tr data-each="Line">
        <td>{{Description}}</td>
        <td style="text-align: right;">{{Quantity}}</td>
        <td style="text-align: right;">{{Amount}}</td>
      </tr>
    </table>
  </body>
  <footer>
    <p>{{> company-footer}}</p>
  </footer>
</template>
```

Encoding is UTF-8; the renderable character repertoire is cp1252 (Latin script) —
characters outside it render as `?`, and validation warns about them (`LF-CHARS`).

## 3. Template language quick reference

The normative contract is
[Template language reference](/reference/template-language)
— **what is listed there is the language; anything else is a validation error**
(`LF-UNSUP`). Summary:

| Category | Constructs |
|---|---|
| Root attributes | `page-size` (`A4`/`Letter`/a custom page size name), `orientation` (`portrait`/`landscape`), `margin`, `margin-top/-right/-bottom/-left` (points) |
| Structure | `<header>` `<footer>` `<continuation-header>` `<region>` `<h1>`–`<h3>` `<p>` `<div>` `<section>` `<table>` `<tr>` `<th>` `<td>` `<hr/>` `<br/>` `<strong>` `<em>` `<span>` `<img/>` |
| Engine attributes | `data-each="DataItemName"` (repeat per row; on `<tr>`/`<div>`/`<section>`), `data-if="{{Column}}"` (conditional display; on `<tr>`/`<div>`/`<section>`), `data-break="page"` (forced break; on `<div>`/`<section>`), `data-keep-together` (on `<div>`/`<section>`/`<tr>`), `data-accumulate="ColumnName"` (running totals), `data-group-header` (repeating group captions) |
| Bindings | `{{Column}}` (inside `data-each` scope), `{{DataItem.Column}}` (first row, header-data pattern), `{{PAGE}}`, `{{NUMPAGES}}`, `{{CARRIEDFORWARD.Column}}` / `{{BROUGHTFORWARD.Column}}`, `{{> name}}` / `{{> prefix/name}}` (Blocks), `{{> name param=Value}}` (Blocks with parameters), `{{$name}}` (a Block's own parameter placeholder) |
| Styles (inline `style=""`) | `font-size`, `font-family`, `font-weight`, `font-style`, `color` / `background-color`, `text-align`, `letter-spacing`, `text-transform`, `line-height`, `width` (columns / side-by-side block flow), `padding`/`padding-*`, `margin-top`/`margin-bottom`, `border`, `border-top`/`border-bottom`, `vertical-align` — the full enumerated grammar for each is in the reference below |
| Table cells | `colspan`, `rowspan`, nested `<div>`/`<section>`/`<table>` block content (up to nesting depth 8) |
| Images | `<img src width height align fit/>` — see "Images" in the reference below |

Rules worth knowing up front:

- `<div>`/`<section>` may only contain block elements — bare text directly inside them
  is an `LF-UNSUP` error, not silently dropped.
- Column widths come from the first table row; totals exceeding the printable width are
  an `LF-GEOM` error.
- `<th>` rows repeat automatically after page breaks inside a table.
- Data values are always emitted as literal text — markup inside data never executes.
- `page-size` isn't limited to `A4`/`Letter` — you can define your own named page sizes
  (in millimetres, inches, or points) on the **Pageworks Page Sizes** page and reference
  one by name; see "Custom page sizes" in the
  [Template language reference](/reference/template-language).
- The default font is Helvetica (regular/bold/oblique/bold-oblique) from the PDF
  standard-14 set — always available, no registration required. `font-family` can also
  select a custom, tenant-uploaded or extension-registered font family (see
  [Template language reference](/reference/template-language)'s "Fonts & Typography"
  section and this guide's section 4a-style registration pattern via `RegisterFont`).
  Output is byte-deterministic — no timestamps, no random IDs.

## 4. Blocks — shared layout building blocks

> **Terminology note**: this feature is called "Blocks" in the client UI (the
> **Pageworks Blocks** page, its captions and messages). The AL identifiers underneath —
> `PageworksRegistry.RegisterPartial`, the `PageworksPartial` table — are unchanged and
> still say "Partial"; there is no `RegisterBlock` alias. This guide uses "Block" for the
> user-facing concept and `RegisterPartial` for the actual API call, matching what you'll
> see in each context.

A Block is a named fragment (company footer, address block, style header) referenced
with `{{> name}}` and maintained in one place. Two delivery channels exist; a tenant
Block of the same name always wins over an extension baseline.

### 4a. Registering Blocks from your extension

Call the public `PageworksRegistry` codeunit from your install/upgrade codeunit.
Copy-pasteable example:

```al
namespace MyCompany.MyApp;

using SMC.Pageworks.Partials;

codeunit 70101 MyAppInstall
{
    Subtype = Install;

    trigger OnInstallAppPerCompany()
    begin
        RegisterPageworksPartials();
    end;

    local procedure RegisterPageworksPartials()
    var
        Registry: Codeunit PageworksRegistry;
    begin
        // One prefix per app, unique across apps. First registrant keeps it;
        // a conflict fails the install with an actionable LF-PREFIX error.
        Registry.RegisterSource('mycompany');

        // Upserts your baseline Block. Caller identity is taken from the
        // platform (not spoofable). Re-registering identical content is a no-op;
        // new content updates the baseline WITHOUT touching tenant overrides.
        Registry.RegisterPartial(
            'company-footer',
            '<span>My Company Ltd. - VAT GB123456789 - www.mycompany.example</span>',
            'Standard company footer');
    end;
}
```

Reference your Blocks from any template as `{{> company-footer}}` (unqualified —
resolved tenant-first, then unique extension match) or `{{> mycompany/company-footer}}`
(qualified — pinned to your app). If two apps ship a Block with the same unqualified
name, unqualified references become ambiguous (`LF-AMBIG`) and the error names the
candidates and how to qualify.

Upgrade behavior: when your app ships new baseline content, tenants that never edited
the Block receive it on next render; tenants that created an override keep their
content and see a "Newer Version Available" indicator on the Blocks page.

### 4b. Tenant-side editing (no development required)

Administrators manage Blocks on the **Pageworks Blocks** page (search:
"Pageworks Blocks"):

- **New** — create a pure tenant Block (a name your templates can reference).
- **Edit** — edit a tenant Block; invoking Edit on an extension baseline row creates
  a *tenant override* (the baseline itself is never modified and remains read-only).
- **Delete** — tenant rows only.
- **Import / Export** — exchange Block content as files.
- **Revert to Extension Content** — deletes an override so the extension baseline
  becomes effective again.
- **Validate** — see section 6.

A change to one shared Block is reflected in every referencing report's next render —
zero per-report edits.

**Blocks can take parameters**, so one generic Block (e.g. a "line items" row) can be
reused across different reports even when their datasets use different field names —
see "Reusable Blocks with parameters" in the
[Template language reference](/reference/template-language) for the full `{{> name
param=Value}}` / `{{$name}}` syntax and worked example. A plain `{{> name}}` with no
parameters is unaffected and behaves exactly as before.

**Images and fonts follow the same registration pattern.** `PageworksRegistry` also
exposes `RegisterImage` (baseline image assets, referenced via `<img src="Name">`) and
`RegisterFont` (baseline font families, referenced via `style="font-family: Name"`) —
see [Developer reference](/reference/developer-reference) sections 3 and 5 for the
signatures and rules. Both have tenant-side maintenance pages (search: "Pageworks Image
Assets", "Pageworks Font Assets") mirroring the Blocks page's override/revert model. On
the **Pageworks Font Assets** page specifically, uploading a font by hand follows a
discoverable order: **New → set Name → Acknowledge Licensing → Import** — Import prompts
inline for the licensing acknowledgment if it hasn't been given yet, rather than failing
with no guidance.

## 5. Tenant user-defined layouts (adjust a layout without a deployment)

Any report already wired to Pageworks can additionally receive a tenant-level
user-defined layout in the engine's format — so a layout can be adjusted in the tenant
without deploying an extension:

1. Open **Report Layouts** in Business Central and choose **New Layout**.
2. Pick the wired report, give the layout a name, and select the **Custom** (External)
   format option.
3. Upload your layout file, named with a **single `.pageworks` extension** (e.g.
   `MyInvoice.pageworks`) — **not** `.pageworks.html`. Business Central derives a
   manually-uploaded layout's MIME type from its file extension, so a double extension
   would resolve to `reportlayout/html` instead of `reportlayout/pageworks` and Pageworks
   would not pick it up. See
   [Creating a layout in the client](/guides/creating-layouts-in-the-client) for the full
   walkthrough, including the copy → edit → re-upload round-trip.
4. Select which layout is active per report (or per request) using the platform's
   standard layout selection — the engine serves whichever selected layout carries its
   mime type, and leaves every other layout to the platform.

Extension-shipped template and tenant user-defined layout follow the platform's normal
layout-selection precedence; nothing engine-specific to learn.

## 6. Validation workflow — catch problems before deployment

Validation checks a template for: XML well-formedness, unsupported constructs,
unresolved Block references, impossible geometry, oversized keep-together groups, and
(against a chosen report) unresolved data bindings. It returns findings — it never
renders a broken document silently. The renderer enforces the same rules at render time
with the same error codes, so a finding you see in validation is exactly the error a
user would have hit in production.

Two entry points inside Business Central:

- **Validate Layout** page: enter a Report ID, paste or **Import** your template text,
  choose **Validate**. Findings open in the **Pageworks Findings** list (severity, code,
  message, location). This page is no longer in global **Tell Me** search (it duplicated
  **Pageworks Layout Studio**'s own built-in preview/findings workflow) — open it by
  navigating to it directly, or use Layout Studio instead for an in-context
  edit-and-validate loop. Layout Studio also has an **Insert** picker for browsing and
  inserting fields, Blocks, images, and fonts without memorizing the token syntax — see
  the [Insert picker guide](/guides/using-the-insert-picker).
- **Validate** action on the **Pageworks Blocks** page: validates the selected
  Block's content in isolation (no report context, so binding checks are skipped).

**Note on binding validation:** to resolve `{{...}}` bindings against a report's real
dataset, the validator runs a throwaway render of that report in the background. This
means the report must be executable by the validating user without mandatory request-page
input, and its `OnPreReport`/trigger code does execute during validation. If the probe
cannot run, all other checks still execute — only binding resolution is skipped.

Reading findings:

| Severity | Meaning |
|---|---|
| Error | Rendering this template will fail with the same code. Fix before deployment. |
| Warning | Renders, but with documented degradation (e.g. `LF-CHARS` `?` substitution, `LF-KEEPOV` group breaks across pages). |

Every finding message states what failed *and* what to do about it. The full code
catalog — core language/geometry codes plus the dedicated image (`LF-IMG*`) and
font/script (`LF-FONT-*`/`LF-SCRIPT-*`) codes — is in
[Error & finding code catalog](/reference/error-codes).

## 7. Permissions

**End users need nothing.** Running a Pageworks report requires no engine permission
set and no permission to the engine's internal storage — the engine self-authorizes its
own layout/Block reads during rendering. Job-queue and background renders work under
the same rule.

The assignable **Pageworks** permission set is only needed for people who
*administer* the engine: managing Blocks on the Pageworks Blocks page or running
the validation pages.

## 8. Telemetry reference

Every render and validation run emits standard extension telemetry
(`TelemetryScope::ExtensionPublisher` — visible in the publisher's Application
Insights). No document content or customer data values are ever included; dimensions
carry only ids, names, counts, and durations. Useful for diagnosing unattended
(job-queue) failures without a user session.

| Event id | When | Custom dimensions |
|---|---|---|
| `LF0001` | Render succeeded | `reportId`, `layoutName`, `durationMs`, `pageCount` |
| `LF0002` | Render failed | `reportId`, `layoutName`, `durationMs`, `errorCode` (catalog code) |
| `LF0003` | Validation run | `reportId` (0 when none given), `findingCount`, `errorCount` |
| `LF0004` | Partial registered | `appId`, `prefix`, `partialCount` |
| `LF0005` | Image asset registered (`RegisterImage`) | `appId`, `prefix`, `imageCount` |
| `LF0006` | Font asset registered (`RegisterFont`) | `appId`, `prefix`, `fontCount` |
| `LF0007` | Install-time self-test ran | `SelfTestPassed` |

The full reference, including AI-destination routing for your own tenant, is in the
[Telemetry guide](/guides/telemetry). Example KQL to watch for failing renders:

```kql
traces
| where customDimensions.eventId == "LF0002"
| project timestamp, customDimensions.reportId, customDimensions.errorCode,
          customDimensions.layoutName, customDimensions.durationMs
| order by timestamp desc
```

---

## Checklist: wiring an existing report

1. Write `MyReport.pageworks.html` next to your report (section 2–3).
2. Add the `rendering` clause with `Type = Custom`, `LayoutFile`, and
   `MimeType = 'reportlayout/pageworks'`; set `DefaultRenderingLayout` (section 1).
3. Deploy to a sandbox.
4. Open **Validate Layout**, enter the report id, import the template, validate
   (section 6). Fix any Error findings.
5. Run the report as PDF and check the output.
6. Optional: register shared Blocks from your install codeunit (section 4a).
