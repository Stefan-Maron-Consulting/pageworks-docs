# Pageworks — Template Language Reference

This is the authoring reference for `.pageworks.html` templates rendered by Pageworks.
It is for external developers wiring or authoring Pageworks templates against the
engine as a dependency — see [Developer reference](/reference/developer-reference) for how a template gets wired
into a report.

## This is an allowlist language, not HTML/CSS

**Pageworks templates are well-formed XHTML — but only a closed, enumerated
allowlist of elements, attributes, and style properties is valid.** This is not "full
HTML/CSS with some things missing." It is a small, deliberately fixed set of constructs
chosen for deterministic, byte-reproducible PDF output and designer-tool compatibility
(every construct is element + enumerable attribute values — no positional syntax, no
free-form CSS, no logic).

Anything not explicitly listed in this document — an unrecognized element, an
unsupported attribute, a style property or value outside the enumerations below — is
**rejected** with a validation error (`LF-UNSUP`). It is not silently ignored, stripped,
or best-effort rendered. If your template doesn't validate, it doesn't render.

## Document root

Every template starts with a single `<template>` root element:

```xml
<template page-size="A4" orientation="portrait" margin="56.7">
  ...
</template>
```

| Attribute | Values | Default | Notes |
|---|---|---|---|
| `page-size` | `A4`, `Letter` | `A4` | A4 = 595.28×841.89 pt, Letter = 612×792 pt |
| `orientation` | `portrait`, `landscape` | `portrait` | swaps width/height |
| `margin` | number (pt) | `56.7` (2 cm) | uniform margin on all four sides |
| `margin-top`, `margin-right`, `margin-bottom`, `margin-left` | number (pt) | value of `margin` | per-side override |

## Structural elements

Only these elements are recognized. Anything else — `<style>`, `<script>`,
`<ul>`/`<li>`, `<a>`, custom elements, and so on — is `LF-UNSUP`.

| Element | Allowed content | Semantics |
|---|---|---|
| `<header>` | block elements | running page header, drawn on every page above the content area |
| `<footer>` | block elements | running page footer, drawn on every page below the content area |
| `<h1>`, `<h2>`, `<h3>` | inline | headings (default sizes 18/15/13 pt, bold) |
| `<p>` | inline | paragraph |
| `<div>`, `<section>` | block elements | grouping; carriers for `data-*` attributes |
| `<table>` | `<tr>` | table; column geometry is derived from the first row |
| `<tr>` | `<th>` / `<td>` | table row |
| `<th>` | inline **or** block content (see `<td>`) | header cell (bold); `<th>` rows repeat automatically after page breaks inside the table. Supports `colspan`, `rowspan`, and `vertical-align` (see `<td>`). |
| `<td>` | inline content, **or** nested `<div>`/`<section>`/`<table>` block content | data cell. Inline content wraps within the column width, row height grows to fit; content is always confined to the cell's column (a token wider than the column breaks at character granularity rather than overflowing). Nested block children — `<div>`, `<section>`, `<table>` — are supported for building key/value grids and sub-tables, up to a containing-block **nesting depth of 8** (deeper nesting is rejected with `LF-NESTDEPTH`); a `<p>` child remains rejected with `LF-UNSUP`. Attributes: `colspan="n"` merges the cell across *n* columns and `rowspan="n"` across *n* rows (the row's occupancy-adjusted colspan sum must equal the table's column count, else `LF-COLSPAN`); style `vertical-align: top \| middle \| bottom` positions the cell's content within a taller row. |
| `<continuation-header>` | block elements | new top-level sibling of `<header>`/`<footer>`; drawn at the top of the content area on every page after the first — before flowed content resumes on that page — and never on page 1. Typically pairs with `{{BROUGHTFORWARD.Column}}` to reprint a running total carried in from the previous page; see "Accumulators and carryover tokens" below. |
| `<region x="..." y="..." width="..." height="...">` | full template vocabulary (block elements, bindings, styling) | new top-level sibling of `<header>`/`<footer>`/`<continuation-header>`; renders its content at exact page coordinates on every page, independent of margins and of flowed content's layout. `x`/`y`/`width`/`height` are numeric points, `x`/`y` measured from the page's physical **top-left** corner. See "Positioned regions" below. |
| `<hr/>` | — | horizontal rule (a visible line — **not** a page break) |
| `<br/>` | — | line break |
| `<strong>`, `<em>` | inline | bold / italic; nesting `<strong><em>` produces bold-italic |
| `<span>` | inline | generic inline style carrier |
| `<img/>` | void — no children | embeds an image (JPEG or PNG); usable as block-level content or inline (e.g. as the sole content of a `<td>`) — see "Images" below |

## Engine attributes (`data-*`)

Five `data-*` attributes drive repetition and pagination. Each is valid only on the
elements listed.

| Attribute | Valid on | Semantics |
|---|---|---|
| `data-each="DataItemName"` | `<tr>`, `<div>`, `<section>` | repeat the element once per row of that `DataItem`; bindings inside the element resolve against the current row. Zero matching rows means the element renders zero times — surrounding content (captions, `<th>` rows) is unaffected. |
| `data-break="page"` | `<div>`, `<section>` | force a page break immediately before this element |
| `data-keep-together` | `<div>`, `<section>`, `<tr>` | if the element would otherwise straddle a page boundary, move it entirely to the next page. If the element is taller than one full page, it breaks normally instead (this is documented behavior, flagged with an `LF-KEEPOV` warning at validation, not a rendering failure). |
| `data-accumulate="ColumnName"` | `<td>`, `<th>` (inside a `data-each` scope) | declares the cell's bound column as an accumulator source; the engine maintains a running total for `ColumnName`, updated in row-emission order as rows are drawn — independent of, and in addition to, the cell's own per-row rendering. See "Accumulators and carryover tokens" below. |
| `data-group-header` | a `<div>`/`<section>` nested inside an outer `data-each`, itself wrapping an inner `data-each` | marks the block as that outer group instance's header, redrawn at the top of the next page if the group's rows straddle a page break. See "Repeating group headers" below. |

## Bindings

| Syntax | Valid context | Resolves to |
|---|---|---|
| `{{Column}}` | inside a `data-each` scope | the column value of the current row |
| `{{DataItem.Column}}` | anywhere | the column value of the **first** row of that data item (the header-data pattern — e.g. printing a customer name once from a repeating dataset) |
| `{{PAGE}}` | anywhere (typically header/footer) | the current page number |
| `{{NUMPAGES}}` | anywhere (typically header/footer) | the total page count |
| `{{CARRIEDFORWARD.Column}}` | anywhere (typically a page footer) | the running total of accumulator column `Column`, through the last row printed on the **current** page |
| `{{BROUGHTFORWARD.Column}}` | anywhere (typically a `<continuation-header>`) | the running total of accumulator column `Column` as of the end of the **prior** page; never printed on page 1 (there is no prior page) |
| `{{> name}}` | anywhere | include a **Block** (a reusable, shared template fragment; registered via the `RegisterPartial` API — see below): resolves tenant-override-first, then a unique baseline match across installed apps; an ambiguous match is an `LF-AMBIG` error |
| `{{> prefix/name}}` | anywhere | include a Block from a specific source app's namespace prefix |

:::note
Blocks were formerly called "Partials" in the client UI. The rename is caption-only — the
`{{> name}}` include syntax above is unchanged, and the public registration API is still
`PageworksRegistry.RegisterPartial` (see
[Developer reference](/reference/developer-reference)). "Block" is what users see; "Partial"
is still the identifier developers call.
:::

**Data values are always emitted as literal text.** Markup contained in bound data
never executes and is never interpreted as HTML — there is no injection surface. An
unresolved `{{> name}}` (no baseline and no tenant override) is an `LF-PARTIAL` error; a
Block include chain that cycles back on itself is an `LF-CYCLE` error naming the
chain.

## Accumulators and carryover tokens

`data-accumulate` plus the `{{CARRIEDFORWARD.Column}}` / `{{BROUGHTFORWARD.Column}}`
tokens let a template carry a running total across a page break — the "carried
forward" / "brought forward" pattern from paper ledgers — with the engine computing
and tracking the total, not the report writer.

```xml
<table>
  <tr><th>Description</th><th>Amount</th></tr>
  <tr data-each="InvoiceLine">
    <td>{{Description}}</td>
    <td data-accumulate="Amount">{{Amount}}</td>
  </tr>
</table>

<footer>
  <p>Carried forward: {{CARRIEDFORWARD.Amount}}</p>
</footer>

<continuation-header>
  <p>Brought forward: {{BROUGHTFORWARD.Amount}}</p>
</continuation-header>
```

- `data-accumulate="ColumnName"` is valid only on `<td>`/`<th>` inside a `data-each`
  scope. `ColumnName` is the same column the cell's own `{{...}}` binding reads —
  declaring it as an accumulator source does not change the cell's own rendering, it
  additionally feeds the engine's running total for that column.
- Declaring the same column name with `data-accumulate` more than once anywhere in one
  template is ambiguous and is rejected as `LF-ACCDUP`.
- A `data-accumulate` cell whose bound value cannot be parsed as a culture-invariant
  Decimal is `LF-BIND`.
- `{{CARRIEDFORWARD.Column}}` and `{{BROUGHTFORWARD.Column}}` resolve eagerly from the
  engine's own accumulator state at draw time — unlike `{{NUMPAGES}}`, there is no
  deferred substitution pass. Both are full-precision engine-computed Decimals, never a
  report-writer-supplied pre-computed total.
- `{{BROUGHTFORWARD.Column}}` resolves safely to 0 wherever no `data-accumulate` cell
  for that column has fired yet (including page 1, where it is never printed by
  contract but must still resolve without error).
- `<continuation-header>` (see the structural elements table above) is the natural
  pairing for `{{BROUGHTFORWARD.Column}}`, but neither is limited to the other —
  `{{CARRIEDFORWARD.Column}}`/`{{BROUGHTFORWARD.Column}}` may appear anywhere, and
  `<continuation-header>` content isn't required to reference an accumulator at all.

### Accumulator error codes

| Code | Fires when |
|---|---|
| `LF-ACCDUP` | the same column name is declared with `data-accumulate` more than once anywhere in the template |
| `LF-BIND` | a `data-accumulate` cell's bound value cannot be parsed as a culture-invariant Decimal |

## Repeating group headers (`data-group-header`)

For a nested repeating structure — an outer group whose rows each contain their own
inner repeating rows — `data-group-header` marks a block that behaves like a caption
pinned to the top of its group's rows, including across a page break.

```xml
<div data-each="Customer">
  <div data-group-header>
    <h2>{{Name}}</h2>
  </div>
  <table>
    <tr><th>Description</th><th>Amount</th></tr>
    <tr data-each="CustomerLedgerEntry">
      <td>{{Description}}</td>
      <td style="text-align: right;">{{Amount}}</td>
    </tr>
  </table>
</div>
```

- Valid placement: a `<div>`/`<section>` nested inside an outer `data-each` block,
  itself wrapping an inner `data-each`. Any other placement — the wrong element, no
  enclosing `data-each`, or an enclosing `data-each` with no inner `data-each` — is
  `LF-UNSUP`.
- If the group's rows straddle an automatic page break, the header is redrawn at the
  top of the following page, rendered against the current group instance's data (not
  re-fetched, not blank).
- A group whose rows all fit on one page renders its header exactly once.
- Composes with `data-keep-together` on the header block itself, so the header and the
  group's first row don't get orphaned from each other across the break.

## Positioned regions (`<region>`)

`<region>` is a new top-level sibling of `<header>`/`<footer>`/`<continuation-header>` —
a block that renders its content at exact page coordinates on **every** page, instead of
flowing top-to-bottom with the rest of the document. Its content may use the full
template vocabulary (block elements, bindings, `data-*` attributes, `style="..."`).

```xml
<region x="480" y="20" width="100" height="30">
  <p style="font-size: 8pt; text-align: right;">Confidential — {{Invoice.No}}</p>
</region>
```

| Attribute | Required | Values | Notes |
|---|---|---|---|
| `x`, `y` | Yes | number (pt) | measured from the page's physical **top-left** corner (not the content area, not bottom-left) |
| `width`, `height` | Yes | number (pt) | the region's box size; content overflowing the declared box is not clipped specially — author to fit |

- The engine converts the declared top-left/y-down coordinates to the PDF page's
  native bottom-left/y-up coordinate space internally — authors always write top-left/
  y-down regardless of the underlying PDF convention.
- A region is drawn with its own independent cursor; it never reads or affects the
  content area's flowed-layout cursor, margins, or pagination — unaffected flowed
  content coexists on the same page as one or more regions.
- Missing any of `x`/`y`/`width`/`height`, or a non-numeric value, is `LF-UNSUP`.
- A region whose declared bounds fall partially or fully outside the physical page
  (accounting for the top-left→PDF coordinate conversion) is `LF-GEOM` at validation —
  naming the region's location, its declared bounds, and the page's physical
  dimensions.

### Region error codes

| Code | Fires when |
|---|---|
| `LF-UNSUP` | a `<region>` is missing a required `x`/`y`/`width`/`height` attribute, or one of them is not a plain number |
| `LF-GEOM` | a `<region>`'s declared `x`/`y`/`width`/`height` bounds fall partially or fully outside the physical page |

## Images (`<img/>`)

`<img/>` is a void element (no children) that embeds an image at its position. It may
appear anywhere block or inline content is permitted — including as the sole content of
a `<td>`, or inside a `data-each` scope.

| Attribute | Required | Values | Default | Notes |
|---|---|---|---|---|
| `src` | Yes | a registered image asset name, a source-qualified `prefix/name` asset reference, or a `{{Column}}` / `{{DataItem.Column}}` binding to a Media- or Blob-typed dataset column | — | see resolution forms below; missing/unresolved → `LF-IMGREF` |
| `width` | No | `<n>pt` or `<n>%` | computed from native aspect ratio if `height` is given, else native size | numeric points or percentage — same grammar as the `width` style property |
| `height` | No | `<n>pt` or `<n>%` | computed from native aspect ratio if `width` is given, else native size | see above |
| `align` | No | `left`, `center`, `right` | `left` | horizontal position within the containing block's width |
| `fit` | No | `contain`, `stretch` | `contain` | `contain`: scale to fit the declared box preserving aspect ratio, never upscaled beyond native resolution; `stretch`: fill the box exactly, ignoring native aspect ratio |

These four attributes (`width`, `height`, `align`, `fit`) plus `src` are the **only**
attributes valid on `<img/>`. There is no `style="..."` on `<img/>` — sizing is done via
`width`/`height`/`fit`, not CSS. A `style` attribute (e.g. `style="max-height: 100pt;"`)
on `<img/>` is `LF-UNSUP`, and so is any other element's attribute (`data-each`,
`data-break`, etc.) if placed on `<img/>` — and conversely, `src`/`width`/`height`/`align`/
`fit` are `LF-UNSUP` on every element other than `<img/>`.

**Alignment inside a side-by-side column.** An `<img/>` (or an `<hr/>`, see "Multiple
rows of side-by-side blocks" below) placed inside a percentage-width `<div>` column now
aligns to that column's true left and right edges — `align="left"`/`"right"` positions the
image flush against the column's own boundary, not the page's. This matters whenever a
column's left inset differs from its right inset (e.g. an inner column with asymmetric
padding); previously the image could be mispositioned toward the center of the page
instead of the column.

### `src` resolution

1. **Static asset name** (`src="Logo"`) — resolves tenant-first, then a unique
   extension-baseline match, mirroring `{{> name}}` partial resolution. An unqualified
   name matching more than one extension's registered asset is `LF-IMGREF` (ambiguous).
2. **Source-qualified asset name** (`src="acme/Logo"`) — resolves via the owning
   extension's registered source prefix, then a tenant override if one exists, then the
   baseline — mirroring `{{> prefix/name}}`.
3. **Dataset Media/Blob binding** (`src="{{Picture}}"` or `src="{{DataItem.Picture}}"`) —
   the same `{{...}}` binding syntax as text bindings, but targeting a Media- or
   Blob-typed dataset column (arrives as base64 image bytes). An empty/unset bound field
   renders **nothing** for that occurrence — no error, no reserved blank box — exactly
   like an empty `data-each` region.

A bound `src` works both block-level and inside a table cell. Block-level `<img/>`
(directly inside `<header>`, `<footer>`, `<div>`, `<section>`, etc.) is the common case —
see the demo `SalesInvoicePageworks.pageworks`, which binds
`<img src="{{Header.CompanyPicture}}" height="48pt" align="left"/>` in the letterhead. A
`{{...}}`-bound `<img/>` placed inside a `<td>` resolves through the same Media/Blob
dataset channel (against the cell's `data-each` row scope) and reserves the correct row
height, so per-row picture columns render inside the table as expected.

### Supported formats

JPEG and PNG are supported, including PNG's full transparency range (indexed color-key
transparency, and full RGBA/gray+alpha with a genuine soft mask) — a transparent PNG is
rendered with a PDF `/SMask`, so it composites correctly over whatever is behind it. SVG,
GIF, BMP, WebP, APNG, or any other container format is rejected as `LF-IMGCORRUPT`/an
unsupported format.

The maximum image size is **10 MB** per asset.

### Image-related error codes

| Code | Fires when |
|---|---|
| `LF-IMGREF` | a static (asset-name or source-qualified) `src` does not resolve — the name isn't registered, or an unqualified name matches more than one extension's asset |
| `LF-IMGFMT` | the image bytes are a container format other than JPEG/PNG |
| `LF-IMGCORRUPT` | the bytes claim to be JPEG/PNG but fail to parse or decode |
| `LF-IMGSIZE` | a registered image asset is zero bytes or exceeds the 10 MB limit |
| `LF-GEOM` | (reused from v1) the image's resolved dimensions exceed the page's printable content area |

A `{{...}}` bound `src` is out of scope for `LF-IMGREF` — an empty or unresolved bound
field simply renders nothing, never an error.

## Style properties (`style="..."` inline only)

Inline `style="..."` is the **only** styling mechanism. There is no `<style>` block,
no external stylesheet, no class/id selector. The full property set — twenty-two
properties, each with an enumerated, closed set of legal values:

| Property | Values | Applies to |
|---|---|---|
| `font-size` | `<n>pt`, 6–72 | text-bearing elements |
| `font-family` | a registered font-family name, or `Helvetica` | text-bearing elements — see "Fonts & Typography" below |
| `font-weight` | `bold`, `normal` | text |
| `font-style` | `italic`, `normal` | text |
| `color` | `#RRGGBB` | text |
| `background-color` | `#RRGGBB` | `<td>`, `<th>`, `<tr>`, block elements |
| `text-align` | `left`, `right`, `center` | block elements, cells |
| `letter-spacing` | `<n>pt`, −2 to +20 | text-bearing elements — see "Fonts & Typography" below |
| `text-transform` | `uppercase`, `none` | text-bearing elements — see "Fonts & Typography" below |
| `line-height` | unitless multiplier, 1.0–2.5 | text-bearing block elements — see "Fonts & Typography" below |
| `width` | `<n>%` or `<n>pt` | `<td>` / `<th>` of the **first row only** — this defines column geometry for the whole table. Columns left unspecified share the remaining width equally. Total column width exceeding the printable width is an `LF-GEOM` validation error. Also valid as `<n>%` on a top-level `<table>`/`<div>`/`<section>` block to opt it into side-by-side row flow — see "Side-by-side block flow" below. |
| `padding` | `<n>pt`, non-negative — uniform on all four sides (no 2-/4-value shorthand) | `<div>`, `<section>`, `<table>`, `<td>`, `<th>`, `<p>`, `<h1>`–`<h3>` — see "Box model" below |
| `padding-top` | `<n>pt`, non-negative | `<div>`, `<section>`, `<table>`, `<td>`, `<th>`, `<p>`, `<h1>`–`<h3>` — independent per-side sibling of `padding`, MUST NOT be combined with it on the same element — see "Box model" below |
| `padding-right` | `<n>pt`, non-negative | `<div>`, `<section>`, `<table>`, `<td>`, `<th>`, `<p>`, `<h1>`–`<h3>` — independent per-side sibling of `padding`, MUST NOT be combined with it on the same element — see "Box model" below |
| `padding-bottom` | `<n>pt`, non-negative | `<div>`, `<section>`, `<table>`, `<td>`, `<th>`, `<p>`, `<h1>`–`<h3>` — independent per-side sibling of `padding`, MUST NOT be combined with it on the same element — see "Box model" below |
| `padding-left` | `<n>pt`, non-negative | `<div>`, `<section>`, `<table>`, `<td>`, `<th>`, `<p>`, `<h1>`–`<h3>` — independent per-side sibling of `padding`, MUST NOT be combined with it on the same element — see "Box model" below |
| `margin-top` | `<n>pt`, non-negative | `<div>`, `<section>`, `<table>`, `<p>`, `<h1>`–`<h3>` — see "Box model" below |
| `margin-bottom` | `<n>pt`, non-negative | `<div>`, `<section>`, `<table>`, `<p>`, `<h1>`–`<h3>` — see "Box model" below |
| `border` | `<n>pt solid #RRGGBB`, or the literal `none` | `<div>`, `<section>`, `<table>`, `<td>`, `<th>`, `<p>`, `<h1>`–`<h3>` — see "Box model" below |
| `border-top` | `none`, `single`, `double` | `<td>`, `<th>`, `<tr>` |
| `border-bottom` | `none`, `single`, `double` | `<td>`, `<th>`, `<tr>` |
| `vertical-align` | `top`, `middle`, `bottom` | `<td>`, `<th>` — positions the cell's content within a row made taller by a neighbouring cell; see "Table cell content" below |

Any style property not in this table, or a value outside its enumeration (e.g.
`font-size: 5pt`, `font-weight: 600`, a named color instead of `#RRGGBB`), is
`LF-UNSUP`.

`margin-left`/`margin-right` are **not** in the set — declaring either (with any
value, including `0pt`) is `LF-UNSUP` naming the property: the engine's single-column
top-to-bottom flow has no horizontal-margin semantics.

### Borders (`border-top` / `border-bottom`)

`border-top`/`border-bottom` draw 0/1/2 horizontal rule(s) at the cell's or row's top or
bottom edge — `single` draws one rule, `double` draws two, `none` draws none. Unlike
`<hr/>` (always full page width), a border rule is drawn **confined to the cell's/row's
own column x-span** — this is the one gap `<hr/>` cannot close (e.g. a double rule under
just the "Amount" column of a totals row, not the whole page width).

```xml
<tr style="border-top: single;">
  <td>Subtotal</td>
  <td style="text-align: right;">{{Subtotal}}</td>
</tr>
<tr style="border-bottom: double;">
  <td>Total</td>
  <td style="text-align: right; border-bottom: double;">{{Total}}</td>
</tr>
```

- Valid on `<td>`, `<th>`, and `<tr>` — a row-level border draws across the row's full
  column span; a cell-level border draws across that cell's own column only.
- A value outside `none`/`single`/`double` is `LF-UNSUP`, naming the offending value and
  the enumerated set — the same treatment as every other enumerated style property.

### Side-by-side block flow (`width` on `<table>`/`<div>`/`<section>`)

By default every top-level block (`<table>`, `<div>`, `<section>`) renders full-width,
alone on its own row, stacked top-to-bottom (the original single-column flow behavior).
Declaring an explicit `width: <n>%` on two or more **adjacent** sibling blocks opts them
into rendering **side by side, on the same row**, in source order left to right, instead
of stacking — e.g. a VAT breakdown table beside a totals box.

- **Strictly opt-in**: a block without a declared `width` always renders full-width alone
  on its row, exactly as before this feature existed — byte-identical output for any
  template that declares no adjacent-block `width`.
- **Adjacency, not wrapping**: there is no wrapping "row" element — the engine infers the
  row from consecutive siblings that each declare `width`. An HTML comment between them is
  fine; an undeclared-width sibling in between breaks the run, and every block in that
  broken run falls back to its normal full-width, alone-on-its-row rendering (not an error).
- **Width-sum validation**: if adjacent declared widths sum to more than 100%, the template
  fails validation as `LF-UNSUP`, naming the offending elements, their declared widths, and
  the combined total. A width of exactly `100%` is never row-eligible (it can only mean
  "full width, alone on its row") — two adjacent `width: 100%` blocks stack normally rather
  than erroring, which keeps the pre-existing "declare 100% for emphasis" idiom working.
- **Row height**: the row's height is its tallest sibling's measured height; shorter
  siblings are not stretched to fill it.
- **`data-keep-together` inside a row**: declaring `data-keep-together="true"` on any
  sibling in the row extends to the **whole row** — if the row (at its tallest sibling's
  height) would straddle a page boundary, the entire row moves to the next page as one
  unit, never a partial split.
- **Independent content wrapping**: each sibling's own content wraps/confines within that
  sibling's own declared width, independent of its row siblings (existing
  wrap/confinement rules apply per-block, not per-row).

```xml
<table style="width: 60%;">
  <tr><th>VAT Rate</th><th style="text-align: right;">Amount</th></tr>
  <tr data-each="VatLine">
    <td>{{Rate}}%</td>
    <td style="text-align: right;">{{Amount}}</td>
  </tr>
</table>
<div data-keep-together="true" style="width: 40%;">
  <p style="text-align: right;"><strong>Total: {{Invoice.Total}}</strong></p>
</div>
```

- **Any number of siblings, not just pairs**: the run can be 2, 3, or more consecutive
  width-declaring siblings — `width: 30%` / `width: 30%` / `width: 25%` on three adjacent
  blocks renders all three side by side, in source order, exactly like the two-member case
  above (there is no upper bound on run length).
- **A sub-100% total is valid, not an error**: adjacent declared widths need not sum to
  exactly 100% — only exceeding 100% is `LF-UNSUP` (see above). A lower total (e.g. 60% +
  25% = 85%) is valid: each member still renders at exactly its own declared percentage of
  the row, and the unclaimed width becomes **blank trailing space** on the row's right —
  it is never stretched to fill the gap.

#### Multiple rows of side-by-side blocks

To render **multiple rows** of side-by-side blocks (not just a single row), you must
separate each row from the next. The engine does not wrap a run of width-declaring
siblings into multiple rows if their combined width exceeds 100% — instead, a width-sum
validation error fires (`LF-UNSUP`). Two approaches prevent this:

**Option 1: Use `<hr/>` as a separator** — an `<hr/>` element between width-declaring
runs breaks the adjacency, ending one row and starting the next. Like `<img/>`, an
`<hr/>` placed inside a percentage-width column aligns to that column's true left/right
edges (see the alignment note under "Images" above):

```xml
<!-- First row: two side-by-side blocks -->
<div style="width: 50%;"><p>Left column</p></div>
<div style="width: 50%;"><p>Right column</p></div>

<!-- Separator breaks the run -->
<hr/>

<!-- Second row: four narrower blocks -->
<div style="width: 25%;"><p>A</p></div>
<div style="width: 25%;"><p>B</p></div>
<div style="width: 25%;"><p>C</p></div>
<div style="width: 25%;"><p>D</p></div>
```

**Option 2: Wrap each row in a container** — enclose each row's width-declaring siblings
in a single `<div>` (or `<section>`); the container itself has no `width` and renders
full-width, but its children form a complete adjacent run within:

```xml
<!-- First row wrapped in a container -->
<div>
  <div style="width: 50%;"><p>Left column</p></div>
  <div style="width: 50%;"><p>Right column</p></div>
</div>

<!-- Second row: separate container -->
<div>
  <div style="width: 25%;"><p>A</p></div>
  <div style="width: 25%;"><p>B</p></div>
  <div style="width: 25%;"><p>C</p></div>
  <div style="width: 25%;"><p>D</p></div>
</div>
```

The wrapper approach is often cleaner if each row has specific styling (background colors,
borders, padding) that should apply to the whole row.

`margin-left`/`margin-right` remain `LF-UNSUP` even on a side-by-side row member today —
horizontal margin between row siblings is not yet supported (deliberately
deferred; see "What is NOT supported" below).

### Box model (`padding`/`padding-top`/`padding-right`/`padding-bottom`/`padding-left`, `margin-top`/`margin-bottom`, `border`)

Three box-model properties give an element inset space, outer vertical gaps, and an
outline. All three are **real layout inputs** — measured in both the wrap/keep-together
pass and the draw pass, not draw-time-only decoration — so an element declaring none of
them renders byte-identically to before these properties existed.

**`padding`** — grammar `<n>pt`, non-negative, uniform on all four sides (no CSS
2-/4-value shorthand). Reduces the element's own usable text-wrap width — and that of
every descendant block — by `2 * padding`, and shifts the drawn content origin inward by
`padding` on all four sides. A `background-color` on the same element fills the full
padded box (not just the text bounds). Nesting is ordinary arithmetic: each level's
content width is its parent's content width minus **that level's own** padding — padding
is not inherited or summed across levels.

- **Cells default to zero padding, same as every other element**: `<td>`/`<th>` do
  **not** have a built-in default padding — an undeclared cell renders with `0pt`
  padding, exactly like an undeclared `<div>`/`<p>`. (Earlier versions gave every cell an
  implicit, undeclared 4pt padding; that implicit default was removed so cells follow
  the same "declare nothing, get nothing" rule as every other element. If you are
  upgrading a template authored against an older Pageworks version and relied on that
  implicit spacing, declare `padding: 4pt` explicitly on the affected cells.)

**`padding-top` / `padding-right` / `padding-bottom` / `padding-left`** — independent
per-side siblings of the `padding` shorthand, same grammar (`<n>pt`,
non-negative) and same applicable-element set. Each declared side reduces the element's
own usable text-wrap width/height — and that of every descendant block — and shifts the
drawn content origin inward by exactly its own declared value; an **undeclared side
defaults to `0pt`** (never inherited from an opposite/adjacent side or from a shorthand
`padding` declared on a *different* element). A `background-color` on the same element
fills the full asymmetrically-padded box (text bounds expanded independently by each
side's own value) — not a uniformly-padded approximation. Nesting is ordinary arithmetic,
same as the shorthand: each level's content width/height is its parent's minus **that
level's own** per-side padding.

- **Mutual exclusion with the shorthand**: the shorthand `padding` and any one
  or more of `padding-top`/`padding-right`/`padding-bottom`/`padding-left` MUST NOT be
  declared on the same element simultaneously — `LF-UNSUP`, naming the element and the
  conflicting property names. Declare either the shorthand (symmetric) or one or more of
  the four per-side properties (asymmetric), never both, on one element.
- **`<table>`/`<td>`/`<th>` also honor per-side padding on their own box**: a `<table>`'s
  own `padding`/`padding-*`/`margin-top`/`margin-bottom`/`border` shift and size its own
  box — inset the row/cell origin, narrow the column geometry, and (for `border`) draw an
  outline around the table — in both the normal document flow and inside a `<region>` (the
  two code paths are kept in sync deliberately, so a table renders identically whether it
  sits in the body flow, an edge band, or a `<region>`). A `<td>`/`<th>` cell's own
  `padding`/`padding-*` insets that cell's content exactly like a `<div>`'s. At `padding`/
  `border`/`margin` all `0` (the default — see "Cells default to zero padding" above),
  this is byte-identical to earlier behavior; declaring any of them is a real, visible
  layout change on the table's or cell's own box, not decoration only.

**`margin-top` / `margin-bottom`** — grammar `<n>pt`, non-negative. Adds exactly the
declared vertical gap between this element's box and the adjacent content, once per
declared margin. There is **no margin-collapsing** (deliberately unlike CSS): two
adjacent declared margins — one element's `margin-bottom` and the next's `margin-top` —
both apply in full. Margin is an outer flow gap, **excluded** from the element's own
`data-keep-together` height. `margin-left`/`margin-right` are always `LF-UNSUP` (see the
note under the property table).

**`border`** — grammar exactly `<n>pt solid #RRGGBB`, or the literal `none`. Closed
grammar: no named colors, no omitted `solid` keyword, no per-side shorthand, no non-`pt`
width unit — any deviation is `LF-UNSUP`. `border` sits **outside** `padding` (CSS
border-box): a `1pt` border on a `6pt`-padded box insets content by `7pt` total.
`border` and the legacy `border-top`/`border-bottom` MUST NOT both be declared on the
same element — that combination is `LF-UNSUP` naming both conflicting properties
(ambiguous precedence, not silently resolved).

- **`border: none` on `<td>`/`<th>` — cell-grid suppression**: this is the
  first author-facing way to opt a cell **out** of the engine's default table cell-grid
  rule. `none` on any other element is a no-op equivalent to omitting `border`.
- **What is drawn**: a colored four-sided box is drawn for a declared `border` on
  `<div>`/`<section>`, `<p>`, `<h1>`–`<h3>`, `<table>`, **and** `<td>`/`<th>` cells — the
  full outline enclosing any padding/background. On `<p>`/`<h1>`–`<h3>` the element's own
  content is inset by its border width (border-box); on a cell the box encloses the cell's
  column x-range (colspan-aware) and the full row height, and a non-`none` cell border also
  suppresses that cell's default grid segment (so only the colored box shows). `border: none`
  on `<td>`/`<th>` suppresses the default grid without drawing a box; `none` on any other
  element is a no-op. Two documented edges remain: (1) a `<table>`'s own border sits at its
  **outer edge** and does not narrow its columns horizontally (separate gap G2); (2) a border
  on a `rowspan` cell is validated but not drawn (it would need the merged group height, not a
  single row's).

**Keep-together composition**: a `data-keep-together` block declaring `padding` and/or
`border` evaluates its height as unpadded content height + `2 * padding` + `2 * border-width`
— proving both are layout inputs. `margin-top`/`margin-bottom` are excluded from this sum.

### Table cell content (`colspan`, `rowspan`, `vertical-align`, nested block content)

Cells are richer than a single wrapped string. Four constructs let a `<td>`/`<th>` merge,
grow, align, and nest. Like the box model, all are **real layout inputs** measured in both
passes — a table declaring none of them renders byte-identically to before these cell constructs existed.

**`colspan="n"`** — an integer attribute (default `1`) merging the cell across `n` adjacent
columns; its width is the **sum** of those columns' widths (column geometry still comes from
the first row's `width` values). Every row's cells must exactly tile the table: the row's
colspan sum — adjusted for any column already occupied by a `rowspan` cell from an earlier
row (see below) — must equal the table's declared column count, or the row is rejected with
`LF-COLSPAN`. A cell's own content (inline text or nested blocks) wraps against the full
merged width.

**`rowspan="n"`** — an integer attribute (default `1`) merging the cell down across `n` rows.
The spanning cell is **drawn once**, occupying its column(s) in each of the `n` rows; the
later rows omit a cell for that column (the occupancy adjustment above accounts for this so
their `colspan` sums still validate). A rowspan cell and the rows it spans form an implicit
**keep-together group** — the engine tries to keep them on one page. If the group is
statically estimated to be taller than one page's printable area it cannot be kept together;
it emits the `LF-ROWSPANOV` **warning** and breaks across pages normally (same
documented-degradation philosophy as `LF-KEEPOV`).

**`vertical-align: top | middle | bottom`** — a style property positioning a cell's content
within a row made taller by a neighbouring taller cell. `top` (the default) pins content to
the row's top; `middle` centres it; `bottom` drops it to the row's bottom. Applies to
`<td>`/`<th>` only.

**Nested block content** — a cell may contain nested `<div>`, `<section>`, or `<table>` block
children (the enabler for key/value grids and sub-tables), in addition to inline text. Each
nested block resolves its own width against the cell's content width — for a `colspan` cell,
that is the **full merged (summed) width**, not a single column. A `<p>` child is still
rejected with `LF-UNSUP` (paragraphs are top-level flow constructs; use a `<div>` inside a
cell). Containing-block nesting — counting `table`/`div`/`section`/`td`/`th` boundaries from
the document root — is capped at a **depth of 8**; exceeding it is `LF-NESTDEPTH`.

- **Positioned `<region>` and edge-band (`<header>`/`<footer>`) tables render at full cell
  capability** — a table inside a `<region>`
  supports `colspan`, `rowspan`, `vertical-align`, per-cell padding, and cell box-borders,
  and edge-band tables support `rowspan` — all driven by the same unified layout/draw core as
  the body flow, so identical cell content produces identical relative output in every context.
  The one difference is pagination: a region and an edge band cannot break across pages, so a
  **nested cell-block-band taller than the region/edge band it lives in** is reported as an
  `LF-KEEPOV` validation finding (it cannot be paginated away) rather than rendered clipped.

## Format controls (`format`)

`format` is a plain element attribute — like `data-*` — not a `style="..."` property.
It controls how a bound numeric or date value is **displayed**; it never changes the
underlying value used for accumulation or comparison.

| Attribute | Valid on | Values | Notes |
|---|---|---|---|
| `format` | any element bound to a numeric or date dataset column — a plain `{{Column}}` binding, or a `{{CARRIEDFORWARD.Column}}` / `{{BROUGHTFORWARD.Column}}` token | a BC format expression, e.g. `<Precision,2:2>` or `<Day,2>/<Month,2>/<Year4>` | display-only; see culture-invariance rule below |

```xml
<td data-accumulate="Amount" format="<Precision,2:2>">{{Amount}}</td>
<p format="<Day,2>/<Month,2>/<Year4>">{{Invoice.PostingDate}}</p>
<p>Carried forward: {{CARRIEDFORWARD.Amount}}</p> <!-- unformatted, raw text -->
```

**Culture invariance — write only the picture; the engine adds the invariance.** For
decimals, the engine forces byte-identical output regardless of the rendering
session's language by composing your picture with the XML standard format directive
(`<Standard Format,9>`) before evaluating it. Practically: author only the
precision/picture, e.g. `format="<Precision,2:2>"`. A bare decimal picture like that is
only a *modifier* — used directly in AL's `Format()` without a standard-format
directive it yields an empty string — but through Pageworks's `format` attribute it works,
because the engine appends the Standard Format directive for you. Date component
pictures (`<Day,2>/<Month,2>/<Year4>`) are already culture-invariant (numeric
components with literal separators, no localized month/weekday text) and are applied
as-is. Output is byte-identical across session languages.

`format` applies equally to a plain `{{Column}}` binding and to
`{{CARRIEDFORWARD.Column}}`/`{{BROUGHTFORWARD.Column}}` tokens — it is display-only in
every case and never rewrites the accumulated or compared value.

The date-vs-decimal kind of a `format` expression is detected by the picture
containing the keywords `Day`, `Month`, `Year`, or `Weekday` (case-insensitive)
anywhere in the expression — this is a documented limitation: letter-code date
pictures such as `MM/DD/YY` are **not** recognized and will misdetect as decimal. Use
the keyword picture form (`<Day,2>/<Month,2>/<Year4>`) for dates.

### Format validation

| Code | Fires when |
|---|---|
| `LF-UNSUP` | `format` is placed on a binding whose value parses as **neither** Decimal nor Date — there's nothing valid for the format to apply to |
| `LF-UNSUP` | a `format`-carrying element contains more than one plain `{{Column}}` binding — split into separate elements so each `format` applies to a single binding |
| `LF-BIND` | the `format` expression's detected kind (Decimal vs Date, from the picture) doesn't match the column's actual parseable type — e.g. a date picture on a column that isn't a valid date |

## Fonts & Typography

Pageworks's default font is **Helvetica**, from the PDF standard-14 set (regular /
bold / oblique / bold-oblique, selected via `font-weight` and `font-style`) — always
available, no registration required. The renderable repertoire on this default path is
the **full Windows-1252 (cp1252) code page** — including the upper-block punctuation and
symbols (em-dash `—`, en-dash `–`, curly quotes `‘ ’ “ ”`, bullet `•`, the Euro sign `€`,
trademark `™`, and the accented-Latin range). Characters genuinely outside cp1252 render
as `?` rather than failing the render (this default path never runs the script-scope
checks described below). Every character is measured with its true advance width, so
wrapping and alignment are correct for the whole repertoire, not just plain ASCII.

**Whitespace note:** a non-breaking space (`&#160;` / U+00A0) contributes real space width
(a visible gap) but is never a line-break opportunity — the text it joins stays together
across a wrap. This makes the `{{Label}}&#160;&#160;{{Value}}` idiom render a stable gap
that never splits label from value.

### `font-family`

`font-family`'s legal values are the literal `Helvetica` plus the name of any currently
registered font asset (tenant-uploaded via the font maintenance page, or shipped by a
dependent extension through the public registration API — see
[Developer reference](/reference/developer-reference)). A font-family combines with `font-weight`/`font-style`
to select one of its four independently registered style variants (Regular / Bold /
Italic / BoldItalic), mirroring the standard-14 model exactly: there is **no synthetic
or faux bold/italic** — each variant is its own registered font asset, and a template
combining `font-family` with a weight/style for which no matching variant is registered
fails validation loudly (`LF-FONT-VARIANT`), naming the family and the missing variant.

```xml
<p style="font-family: Corporate-Sans; font-weight: bold;">{{Header.CompanyName}}</p>
```

A `font-family` value outside the registered set (including a misspelled `Helvetica`)
is `LF-FONT-UNRESOLVED` at validation time, and again at render time for a reference
validation could not fully resolve (e.g. an asset deleted between validation and
render). Every font-family actually reachable by the composed template is embedded
into the output PDF as a subsetted font program — subsetted to the glyphs the template
and dataset combination actually uses — so the rendered document is fully
self-contained and looks identical on any viewer, with none of the fonts installed.
Embedding and subsetting never affect the deterministic-output guarantee: identical
font bytes, template, and dataset always produce byte-identical PDF output.

### The script scope boundary

Text styled with a custom `font-family` is checked against a fixed, versioned script
classification — this check does **not** apply to the default Helvetica path,
which keeps its unconditional cp1252 `?` substitution unchanged.

| Category | Scripts | Behavior |
|---|---|---|
| **In scope** | Latin (including extended-Latin diacritics), Cyrillic, Greek | Renders correctly — real glyph outlines, real metrics |
| **Complex shaping (out of scope)** | Arabic, Hebrew, the Indic-script family | Fails loud — `LF-SCRIPT-COMPLEX` |
| **Deferred CJK (out of scope)** | Ideographs, kana, hangul | Fails loud — `LF-SCRIPT-CJK` (distinct reason: deferred pending future composite-font support, not a shaping limitation) |
| **Unclassified (out of scope)** | Anything not yet classified into the above | Fails loud — `LF-SCRIPT-UNCLASSIFIED` (the classification list only grows by an explicit, tested decision — never a silent allow) |

These checks fire at validation time for statically-determinable template/partial text,
and at render time for data-bound text whose script isn't known until the dataset is
available. If a single bound value mixes in-scope codepoints with any out-of-scope
codepoint, the **entire value** fails loud — the engine never renders the supported
portion while silently dropping or garbling the rest.

Within an in-scope script, a codepoint absent from the **active font's own character
map** renders as `?` for that character only — surrounding covered characters are
unaffected and the render doesn't abort. This is a per-active-font rule (each custom
font asset has its own coverage), distinct from the default path's fixed cp1252
repertoire.

### Two fail-loud asset limits

- **glyf outlines only.** The engine embeds TrueType-outline (`glyf` table) fonts. A
  font whose outlines are CFF/PostScript (an `OTTO`-flavored OTF) is rejected at
  registration/validation as `LF-FONT-CFF`, naming the asset and requiring it be
  re-supplied as (or converted to) a glyf-outline TTF/OTF.
- **256 distinct glyphs per family per document.** Because each embedded sub-font uses
  a single-byte simple-font encoding, one `(family, style-variant)` combination can
  reference at most 255 distinct glyphs (plus `.notdef`) in one rendered document. A
  template + dataset combination that pushes a family past that ceiling fails at render
  time as `LF-FONT-GLYPHLIMIT`, naming the family/variant and the distinct-glyph count
  found versus the ceiling. Splitting a large glyph set across multiple font pages is a
  documented follow-up, not part of this version.

The `LF-FONT-*` (asset conditions) and `LF-SCRIPT-*` (content/script conditions) codes
above are the complete catalog for font/script handling, covering every
asset-registration guard (corrupt bytes, zero-byte, oversized, no usable cmap, missing
variant, unresolved family).

### Typography properties

Three additional style properties refine text layout — independent of `font-family`,
they work identically on the default Helvetica path and on custom fonts:

| Property | Values | Effect |
|---|---|---|
| `letter-spacing` | `<n>pt`, −2 to +20 (negative = tighter tracking) | Added per-inter-glyph advance — a first-class input to wrap points, column widths, and pagination, not a cosmetic overlay |
| `text-transform` | `uppercase`, `none` (default) | `uppercase` applies invariant-culture uppercasing to the bound/literal text content at render time — the dataset value itself is never rewritten, so the same binding can render both cased and uppercase from a single source. Cyrillic and Greek uppercase deterministically under invariant-culture rules. `lowercase`/`capitalize` are not supported. |
| `line-height` | unitless multiplier, 1.0–2.5 (default 1.4) | Vertical line spacing for text-bearing block elements — replaces the previous fixed `1.4` constant as the default when unspecified, and is a first-class input to block-height measurement |

```xml
<p style="letter-spacing: 1.5pt; text-transform: uppercase; line-height: 1.6;">
  {{Invoice.CustomerName}}
</p>
```

A value outside any of these three enumerations/ranges — or any out-of-range
`letter-spacing`/`line-height` value — is `LF-UNSUP`, the same treatment as every other
enumerated style property.

## Pagination semantics

Authors don't control pagination directly (there is no manual page-break element other
than `data-break="page"`), but the following engine-owned behavior shapes how templates
should be written:

1. Content flows top-to-bottom inside the content area (the page, minus margins, minus
   the header/footer bands).
2. A break happens automatically whenever the next line or row would not fit.
3. Inside a `<table>`, the `<th>` row(s) from the first row group are automatically
   re-drawn after every automatic break within that table — you do not need to (and
   cannot) repeat them yourself.
4. A single row taller than the remaining space on the page, and taller than a full
   content area, splits across pages at line granularity.
5. `{{NUMPAGES}}` is only resolved after layout completes in full — it always reflects
   the true final page count, never a partial or estimated value.
6. Output is byte-deterministic: no timestamps, no random IDs are ever embedded by the
   engine. Rendering the same template against the same data twice produces the same
   PDF bytes.
7. `<continuation-header>`, if present, is drawn at the top of the content area on
   every page after the first, consuming content-area space by advancing the cursor
   before flowed content begins on that page — it does not alter the once-computed
   content-area bounds themselves.
8. A `data-group-header` block is redrawn, against its group's current instance data,
   at the top of the page following any automatic break that occurs while that
   group's inner `data-each` rows are still being emitted.
9. Accumulator running totals (`data-accumulate`) update deterministically in row
   emission order; `{{CARRIEDFORWARD.Column}}`/`{{BROUGHTFORWARD.Column}}` resolve
   eagerly from that state at draw time (no deferred substitution pass, unlike
   `{{NUMPAGES}}`).
10. `<region>` elements are drawn on every page, independent of and without affecting
    the flowed content's layout computation.

## Complete example

A minimal invoice-style template exercising header/footer, a `data-each` table with
`<th>` repetition, header-data bindings, and inline styles:

```xml
<template page-size="A4" orientation="portrait" margin="56.7">
  <header>
    <h1>Invoice {{Invoice.No}}</h1>
    <p style="text-align: right;">Page {{PAGE}} of {{NUMPAGES}}</p>
  </header>

  <footer>
    <hr/>
    <p style="font-size: 8pt; text-align: center;">{{> company-footer}}</p>
  </footer>

  <section>
    <p><strong>Bill to:</strong> {{Invoice.CustomerName}}</p>
    <p>{{Invoice.CustomerAddress}}</p>
  </section>

  <table>
    <tr>
      <th style="width: 50%; background-color: #EEEEEE;">Description</th>
      <th style="width: 20%; background-color: #EEEEEE; text-align: right;">Quantity</th>
      <th style="width: 30%; background-color: #EEEEEE; text-align: right;">Amount</th>
    </tr>
    <tr data-each="InvoiceLine">
      <td>{{Description}}</td>
      <td style="text-align: right;">{{Quantity}}</td>
      <td style="text-align: right;">{{Amount}}</td>
    </tr>
  </table>

  <div data-break="page" data-keep-together>
    <h2>Terms</h2>
    <p style="font-style: italic;">Payment due within 30 days.</p>
  </div>
</template>
```

## What is NOT supported

These are the constructs authors most commonly reach for out of HTML/CSS habit. None of
them are in v1 — using any of them produces `LF-UNSUP`.

| Reach for... | Instead use / status |
|---|---|
| `<style>` block or external stylesheet | Inline `style="..."` only — see the property table above. Not available in v1. |
| CSS class/id selectors (`.invoice-row`, `#header`) | No selectors exist. Style each element directly with `style="..."`. |
| Arbitrary web fonts, `@font-face`, Google Fonts, etc. | `font-family` selects from registered font assets (tenant-uploaded or extension-registered) plus `Helvetica` — see "Fonts & Typography" above. There is no URL-based or system-font loading. |
| CSS 2-/4-value shorthand (`padding: 4pt 8pt`, `margin: 4pt 8pt`) | Not supported — use the uniform `padding: <n>pt` shorthand, or the four independent `padding-top`/`padding-right`/`padding-bottom`/`padding-left` properties (mutually exclusive with the shorthand), and vertical `margin-top`/`margin-bottom` — see "Box model" above. |
| `margin-left` / `margin-right` (horizontal margin) | `LF-UNSUP` naming the property, even on a side-by-side row member (see "Side-by-side block flow" above) — there is no horizontal-margin semantics yet. **Deferred, not dropped**: this is planned (honoring `margin-left`/`margin-right` between row siblings) — see the [roadmap](/roadmap). |
| `border-radius`, `box-shadow`, per-side `border-left`/`border-right`, non-`pt`/named-color/`dashed`/`dotted` `border` | Only `border: <n>pt solid #RRGGBB` (or `none`) and the legacy `border-top`/`border-bottom` rules are supported — see "Box model" and "Borders" above. Everything else is `LF-UNSUP`. |
| `padding` / `border` on `<tr>` | Not a supported property target on rows. Express row-level insets/outlines by declaring the property on every `<td>`/`<th>` in the row (or use `border-top`/`border-bottom`, which do accept `<tr>`). |
| Flexbox, grid, `float`, absolute/relative positioning | No layout model beyond top-to-bottom flow and table columns. Not available in v1. |
| `<img>` styled with CSS (`style="max-height:..."`, etc.) | Images are supported — see "Images" above — but sizing is via the `width`/`height`/`fit` attributes, not `style="..."`. |
| Inline event handlers (`onclick`, etc.), `<script>` | No scripting or interactivity of any kind — templates are static markup only. |
| `<ul>`/`<li>`, `<a>`, or any other element not in the structural element table | Not in the allowlist. Restructure with `<p>`, `<div>`/`<section>`, or `<table>`. |
| A `<p>` nested directly inside a `<td>`/`<th>` | `<p>` is a top-level flow construct — rejected as `LF-UNSUP`. Nested `<div>`/`<section>`/`<table>` block children ARE supported in a cell (up to nesting depth 8 — see "Table cell content" above); use a `<div>` inside the cell, or inline `<span>`/`<strong>`/`<em>` with `<br/>`. |
| Any attribute or style value not explicitly enumerated above | Rejected as `LF-UNSUP` — there is no best-effort fallback. |

## Reporting findings

This document mirrors the engine's normative contract; the contract itself governs edge
cases. Validate any template before deployment and read back structured findings via the
`PageworksValidator` codeunit — see [Developer reference](/reference/developer-reference) §4.
