# QR codes (`<qr/>`)

`<qr/>` is a void element (no children) that encodes a value as a QR code (ISO/IEC 18004) and
draws it as a native vector matrix of filled squares — no font, no image asset, no external
service call. It may appear anywhere block-level content is permitted, including inside a
`data-each` scope (each occurrence encodes its own row's value independently).

```xml
<qr value="{{Header."Verification Url"}}" />
```

| Attribute | Required | Values | Default | Notes |
|---|---|---|---|---|
| `value` | Yes | literal text, or a `{{Column}}` / `{{DataItem.Column}}` binding, or mixed literal+binding text (e.g. `value="INV-{{Header."No."}}"`) | — | the exact text to encode; resolves through the same attribute-binding path `img`'s `src` attribute uses. Missing → `LF-UNSUP` at validation. |
| `ec-level` | No | `L`, `M`, `Q`, `H` (case-insensitive) | `M` (~15% recovery) | error-correction level; a value outside this set is `LF-UNSUP` at validation |
| `size` | No | `<n>pt` or `<n>%` | fills the element's available content-box width (fit-to-box) | edge length of the whole code's box, same width-value grammar as `img`'s `width`/`height` |
| `module-size` | No | `<n>pt` | computed from `size`/fit-to-box, floored to avoid a fractional-module seam | explicit points-per-module override — use this instead of `size` when a fixed, print-calibrated module size is required (e.g. a minimum-scan-distance requirement) rather than whatever the surrounding layout happens to compute |

**Auto-fit versioning, capped.** The engine automatically picks the smallest QR version (1-10)
that fits the encoded data at the chosen error-correction level — there is no `version` attribute,
and the author never thinks about QR "versions." The cap is version 10 (57×57 modules before the
mandatory 4-module quiet zone). At the default level M, that comfortably covers a SEPA/EPC payment
string, a verification URL, a GS1 Digital Link product URL, or a vCard contact block.

**Fail-loud on overflow or empty value — never a silent/corrupted code.** If the resolved value,
at its densest available encoding, exceeds version 10's capacity at the requested error-correction
level, or if the resolved value is empty, rendering fails explicitly rather than producing a
missing, blank, or truncated QR region. A lower `ec-level` has more data capacity than a higher
one at the same version — the encoder never automatically downgrades the author's requested
`ec-level` to make an oversized value fit; that trade-off is the author's own lever to pull.

**Encoding.** Mode selection (numeric/alphanumeric/byte) and segmentation are automatic, chosen for
the densest representation of the input — byte mode covers arbitrary UTF-8/Latin-1 content, so
every input is always representable; segment selection is purely a density optimization, never a
capability gate.

**Rendering.** The module matrix (including its mandatory 4-module quiet zone) is drawn as solid
filled squares — no anti-aliasing, no partial-opacity fill, every module is either fully dark or
fully light (background shows through). Module sizing defaults to fit-to-box: the resolved
content-box width divided by the total module count (matrix + quiet zone), floored to a uniform
square size so every module edge lands on the same grid — never stretched non-uniformly.

**Determinism.** Identical input text and `ec-level` always produce a byte-identical module matrix
— no randomness, no locale/environment dependency.

:::note[Existing templates are completely unaffected]
`qr` is a brand-new element name. No template written before this feature contains one, so this
feature introduces zero risk to any existing layout — every code path it adds is a strictly
additive branch keyed on the literal element name `qr`.
:::

## QR error codes

| Code | Fires when |
|---|---|
| `LF-QR-EMPTY` | the resolved `value` is empty at render time |
| `LF-QR-OVERFLOW` | the resolved `value`, at its densest available segmentation, needs more bits than version 10's capacity at the requested `ec-level` |
| `LF-QR-MODULESIZE` | an explicit `module-size` resolves to zero or a negative point value |
| `LF-QR-BOXTOOSMALL` | the element's available box is too small to draw the resolved matrix (matrix dimension + 4-module quiet zone on each side) at even 1pt per module |
| `LF-UNSUP` | (reused from the core catalog) a `<qr>` element is missing its required `value` attribute, or `ec-level`/`size`/`module-size` holds a value outside its enumerated grammar |

See the full [Error & finding code catalog](/reference/error-codes) for how these fit alongside
every other code.

## What's NOT built (do not imply these exist)

Only QR is implemented. **DataMatrix, PDF417, and Aztec are not built** — a future dedicated tag
per 2D symbology is the planned shape if/when those are added; there is no generic "2D barcode"
tag today, and `<qr/>` does not accept a symbology-selection attribute.
