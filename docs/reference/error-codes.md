# Contract: Error & Finding Code Catalog

One catalog for validator findings and render-time errors. Every code has
an actionable message (Label with Comment) stating what failed AND what to do.

## Core language & geometry

| Code | Severity | Condition | Message must include |
|---|---|---|---|
| LF-XML | Error | template/partial is not well-formed XML | parse error detail + location |
| LF-UNSUP | Error | element/attribute/style value outside the language contract | the construct + pointer to supported set |
| LF-PARTIAL | Error | `{{> name}}` resolves to nothing | partial name + referencing layout/partial |
| LF-PARTIAL-PARAM | Error | a Block include (`{{> name param=Value ...}}`) leaves one or more of the Block's own `{{$name}}` placeholders unmapped | the Block name + the unmapped placeholder name(s) |
| LF-AMBIG | Error | unqualified include (or unqualified `<img>` asset name) matches >1 extension | candidates with their prefixes + how to qualify |
| LF-CYCLE | Error | include chain contains a cycle | the full chain A→B→A |
| LF-BIND | Error | binding references a data item/column absent from the dataset, **or** a `data-accumulate` cell's value doesn't parse as a culture-invariant Decimal, **or** a `format` expression's detected kind (Decimal vs. Date) doesn't match the column's actual type | binding text + available names / the offending value |
| LF-GEOM | Error | declared column widths exceed printable width; margins exceed page; a `<region>`'s bounds fall partially/fully outside the physical page; an image's resolved dimensions exceed the printable content area | the numbers involved |
| LF-FMT | Error | requested output format not served (Word/Excel) | supported format (PDF) + where to change |
| LF-PREFIX | Error | RegisterSource prefix conflict | prefix + owning app |
| LF-KEEPOV | Warning | keep-together group taller than one page (will break normally) | group location |
| LF-CHARS | Warning | template/static text contains characters outside cp1252 (default Helvetica path only) | location; note about `?` substitution |
| LF-COLSPAN | Error | a `<tr>`'s cell colspan sum (occupancy-adjusted for any active rowspan) ≠ the table's declared column count | the row + actual vs. expected column count |
| LF-NESTDEPTH | Error | containing-block nesting depth (table/div/section/td/th boundaries from the document root) exceeds 8 | the offending element location + the configured limit (8) |
| LF-ROWSPANOV | Warning | a `rowspan` group is estimated taller than one full page's printable content area — same static-estimate/documented-degradation philosophy as LF-KEEPOV; it cannot be kept together and breaks across pages normally instead | group location + rowspan count + estimated vs. content-area height |
| LF-ACCDUP | Error | the same column name is declared with `data-accumulate` more than once anywhere in the template | the column name + both declaring locations |

## Images (`<img/>`)

| Code | Severity | Condition | Message must include |
|---|---|---|---|
| LF-IMGREF | Error | a static (asset-name or source-qualified) `src` does not resolve — the name isn't registered, or an unqualified name matches more than one extension's asset (not raised for a `{{...}}`-bound `src` — an empty/unresolved bound field simply renders nothing) | the asset name + qualification hint |
| LF-IMGFMT | Error | the image bytes are a container format other than JPEG/PNG (SVG, GIF, BMP, WebP, APNG, etc.) | the detected format + supported set |
| LF-IMGCORRUPT | Error | the bytes claim to be JPEG/PNG but fail to parse or decode | the asset name |
| LF-IMGSIZE | Error | a registered image asset is zero bytes or exceeds the 10 MB per-asset limit | actual size vs. the limit |
| LF-GEOM | Error | (reused from the core catalog above) the image's resolved dimensions exceed the page's printable content area | the numbers involved |

## Fonts & script (`font-family`, custom font assets)

| Code | Severity | Condition | Message must include |
|---|---|---|---|
| LF-FONT-VARIANT | Error | a template combines `font-family` with a `font-weight`/`font-style` for which no matching style variant (Regular/Bold/Italic/BoldItalic) is registered for that family | the family + the missing variant |
| LF-FONT-UNRESOLVED | Error | a `font-family` value is outside the registered set (including a misspelled `Helvetica`) — raised at validation, and again at render time if a reference validation couldn't fully resolve (e.g. an asset deleted between validation and render) | the requested family name |
| LF-FONT-CFF | Error | a registered font asset embeds CFF/PostScript outlines (an `OTTO`-flavored OTF) rather than TrueType `glyf` outlines — the engine embeds glyf-outline fonts only | the asset name + style variant |
| LF-FONT-CORRUPT | Error | a font asset's container isn't a recognized TTF/OTF sfnt, or is missing required glyf/loca or CFF outline tables and can't be parsed | the asset name + style variant |
| LF-FONT-NOCMAP | Error | a font asset has no usable Unicode cmap subtable ((3,1)/(0,x)/(3,0)) — the engine can't map codepoints to glyphs without one | the asset name + style variant |
| LF-FONT-ZEROBYTE | Error | a font asset upload/registration is 0 bytes | the asset name |
| LF-FONT-OVERSIZE | Error | a font asset exceeds the maximum per-asset byte size | actual size vs. the limit |
| LF-FONT-GLYPHLIMIT | Error | a template + dataset combination pushes one `(family, style-variant)` past the 255-distinct-glyph (plus `.notdef`) ceiling for a single rendered document (single-byte simple-font encoding) | the family/variant + distinct-glyph count found vs. the ceiling |
| LF-SCRIPT-COMPLEX | Error | text styled with a **custom** `font-family` (not the default Helvetica path) contains a complex-shaping script — Arabic, Hebrew, or an Indic script | the offending text/location |
| LF-SCRIPT-CJK | Error | text styled with a custom `font-family` contains CJK — ideographs, kana, or hangul (deferred pending future composite-font support, distinct reason from LF-SCRIPT-COMPLEX) | the offending text/location |
| LF-SCRIPT-UNCLASSIFIED | Error | text styled with a custom `font-family` contains a script not yet classified into the in-scope/out-of-scope lists | the offending text/location |

These do not apply to the default Helvetica path, which keeps its unconditional cp1252
`?`-substitution behavior (`LF-CHARS`, above) regardless of script. See
[Template language reference](/reference/template-language)'s "Fonts & Typography"
section for the full in-scope/out-of-scope script table and the two asset limits.

## Barcodes (1D, render-time auto-encode)

| Code | Severity | Condition | Message must include |
|---|---|---|---|
| LF-BARCODE-ENCODE | Error | a run is bound to a font asset coupled to a barcode symbology (`Interpreter <> None`) and the raw value fails that symbology's `Encode` — invalid charset, wrong length, or bad check digit — at render time | the font family + symbology + the underlying encode failure text |

See the [Barcodes guide](/guides/barcodes) for how render-time auto-encode works. This is distinct
from an error raised by calling `Symbology.Encode(...)` yourself in a report/dataset column (the
manual pre-encode pattern) — that surfaces as an ordinary AL error in your own code, not an `LF-*`
render-time finding.

## Shared styles (`<style-sheets>`, `<style>`, `class`)

| Code | Severity | Condition | Message must include |
|---|---|---|---|
| LF-STYLEREF | Error | a `<style-sheets src="...">` entry names a stylesheet that is not registered/resolvable, OR an element's `class="..."` references a class name not defined in any listed stylesheet or the document's own `<style>` block (a Block/partial has no local styling scope of its own — its elements' `class` references resolve against the **host document's** merged sheets + `<style>` block; see [Shared styles](/guides/styles#blocks-and-styles-current-behavior)) | the missing stylesheet/class name + the referencing element/location |

Registering a stylesheet (baseline or Tenant override) with an invalid property/value inside any
class body reuses the existing LF-UNSUP row above — no new code needed, since it's the identical
"value outside an enumeration" failure mode inline styles already produce, just discovered at
stylesheet-registration time instead of at template-validation time.

## QR codes (`<qr/>`)

| Code | Severity | Condition | Message must include |
|---|---|---|---|
| LF-QR-EMPTY | Error | the `<qr>` element's resolved `value` is empty at render time | identifies the failing `<qr>` element |
| LF-QR-OVERFLOW | Error | the resolved `value`, at its densest available segmentation, needs more bits to encode than version 10's capacity at the requested `ec-level` | bits needed vs. bits available at that EC level, and the EC level code |
| LF-QR-MODULESIZE | Error | an explicit `module-size` attribute resolves to zero or a negative point value | the requested module size |
| LF-QR-BOXTOOSMALL | Error | the `<qr>` element's available box is too small to draw the resolved matrix (including its mandatory 4-module quiet zone) at even 1pt per module | the available box dimensions, the matrix dimension, and the total modules-per-side including quiet zone |

A `<qr>` element missing its required `value` attribute, or holding an invalid
`ec-level`/`size`/`module-size` value, is LF-UNSUP (reused from the core catalog above) — the same
pattern as `img`'s required `src` and enumerated `fit`/`align` attributes.

## Rules

- Renderer failures surface via `ErrorInfo` with the code in the message and telemetry
  event LF0002 carrying the code as a dimension.
- Validation returns findings (temporary table) — it never throws for template problems.
- Adding a code means updating this catalog: every catalogued condition has a test
  proving actionable output, never a silent blank document.
