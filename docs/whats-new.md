# What's New

Curated highlights of the latest Pageworks capabilities — what you can now do, and where to
learn more. For the complete, terse technical change record, see the
[Changelog](/changelog).

## This release

### Build layout tooling against Pageworks — External layout-development API

Pageworks now exposes a dedicated Business Central API for external layout-development
tools — discover which reports you can build against, render draft template text and
get back a document with nothing saved (optionally with structured diagnostics and
computed layout geometry for automated verification, no PDF rasterization needed),
discover a report's available data before you bind to it, manage every asset type
(Fonts, Stylesheets, Blocks, Page Sizes, Images) with full CRUD, and publish a finished
template as a real, selectable report layout. Everything a layout-development tool
needs, over the wire, with no interactive session required and its own dedicated,
minimal permission grouping.

→ [External API for layout-development tools](/reference/external-layout-api)

### Add a field to a report's dataset without a developer — Dataset Fields

Need one more field on a layout than the report already exposes — a customer's phone
number, an item's vendor, a company logo? Point at a related table already reachable
from the report's own data, define how a report row matches a record there (or, for a
single-record table like Company Information, skip that step entirely), and pick the
fields you want — with optional aggregation across matches, and a Media/BLOB field
(a picture) usable directly as an `<img>` source. No AL required, and it now reaches a
template and the Insert Picker's Custom tab.

→ [Adding fields to a report's dataset](/guides/dataset-fields)

### Build a request-page filter without hand-authoring XML — `buildFilterParams`

Some reports need filter information before they'll produce any data — previously that
meant hand-authoring `RequestPageParameters` XML yourself. A new action builds it for
you from a plain list of field filters, ready to pass straight into `renderTemplate`.

→ [External API for layout-development tools](/reference/external-layout-api)

### Faster rendering, no changes needed

Core rendering got noticeably faster this release — up to 50% lower render time on
typical multi-line documents in our own benchmarks, with output verified
byte-identical to before. Nothing to configure; every existing layout just renders
quicker.

### Set your corporate look once — Shared styles

You no longer have to repeat `style="..."` on every element or hunt through templates when a
customer changes their brand color. Define a stylesheet of named classes — your corporate colors,
your heading typography — as a reusable, registered asset, then reference it by name from any
template. Change the stylesheet once and every invoice, statement, and packing slip that uses it
picks up the change on its next render. Stylesheets follow the same familiar
Copy / Customize / Revert lifecycle as Blocks and fonts, so a consultant can adjust a customer's
baseline look without forking a single template.

→ [Shared styles guide](/guides/styles)

### Drop a barcode onto a document — 1D barcodes

Pageworks now ships an extensible barcode framework with built-in fonts, so you get working 1D
barcodes out of the box — Code 39, Code 128, and EAN-13 — with no font hunting or licensing
legwork. Bind a **raw** value (an item number, a GTIN) to a run styled in the matching built-in
barcode font, and Pageworks auto-encodes it for you at render time — no manual encode call
required. Need a symbology we don't ship? The framework is open — a developer can add one without
changing Pageworks itself.

→ [Barcodes guide](/guides/barcodes) · [Fonts shipped](/guides/fonts)

### Print checks — MICR E-13B font

A built-in MICR E-13B font makes Pageworks a viable check-printing engine. The MICR line (routing,
account, and check numbers plus the four control symbols) is authored as ordinary text styled in
the MICR font-family — no special encoding step. Author it at **36pt** and the characters render at
the exact ANSI X9.27 physical dimensions that check-processing equipment expects.

→ [Fonts shipped guide](/guides/fonts)

### Add a QR code — the `<qr>` tag

Give any layout a scannable QR code by dropping a single tag: `<qr value="{{...}}" />`. Bind it to
a dataset field — a payment link, a verification URL, an asset ID — and Pageworks encodes and draws
it as a crisp vector QR code in the PDF, with no font upload, no external service, and no encoding
knowledge required. It auto-sizes to fit, defaults to a sensible error-correction level (adjustable
with `ec-level`), and fails loudly rather than ever printing a silently corrupted code.

→ [QR codes guide](/guides/qr-codes)

---

*Want the full, itemized technical history? See the [Changelog](/changelog).*
