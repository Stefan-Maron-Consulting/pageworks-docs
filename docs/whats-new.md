# What's New

Curated highlights of the latest Pageworks capabilities — what you can now do, and where to
learn more. For the complete, terse technical change record, see the
[Changelog](/changelog).

## This release

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
