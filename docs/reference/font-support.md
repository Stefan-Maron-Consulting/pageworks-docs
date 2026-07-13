# Font support & limitations

This page is the definitive contract for anyone preparing a font for Pageworks — a tenant
uploading a corporate typeface, or a third-party extension shipping one via `RegisterFont`. The
engine embeds a **subsetted copy** of whatever font it uses into each output PDF, so a produced
document is fully self-contained; but the font you supply has to be in a shape the engine can read.
Read this before uploading a font — most "my font didn't render" surprises are one of the
constraints below.

## What the engine accepts

Pageworks reads **static, TrueType-outline (`glyf`) sfnt fonts** — the classic `.ttf` shape.

- The font must have a `glyf` table and a `loca` table (TrueType glyph outlines), and its sfnt
  version must be `0x00010000`. Fonts meeting this are handled by the engine's font reader.
- **CFF / OpenType-PS outlines are NOT supported.** A font whose outlines are CFF (a `CFF ` table
  present, i.e. an `OTTO`-flavored OpenType font — typically `.otf`) is rejected at
  registration/validation with **`LF-FONT-CFF`**, naming the asset and requiring it be re-supplied
  as (or converted to) a `glyf`-outline TrueType font. `CFF2` is likewise unsupported (it is a
  CFF-family outline; the engine embeds only `glyf` outlines).

### Character mapping — which `cmap` subtable formats are read

The engine maps Unicode codepoints to glyphs through the font's `cmap` table, and supports
**subtable formats 0, 4, and 6**. It selects the best available Unicode-usable subtable by
platform/encoding priority (highest first):

1. `(3, 1)` — Windows, Unicode BMP
2. `(0, 3)` / `(0, 4)` — Unicode platform
3. `(3, 0)` — Windows, Symbol
4. `(1, 0)` — Macintosh, Roman

A font with none of these usable subtables (in a supported format) has no way to map codepoints to
glyphs and will not resolve. Format-4 (segmented BMP) is the format essentially every modern Latin
font ships and is the safe target.

## What is NOT supported — the stumbling blocks

### Variable fonts — instance to a static weight first

Pageworks has **no variable-font (OpenType Font Variations) support**. There is no handling of the
`fvar` / `gvar` / `avar` / `STAT` variation tables anywhere in the font pipeline.

A variable font is still a `glyf` sfnt, so the reader will not *reject* it — but it will read only
the **default instance's outlines as stored in `glyf`**, silently ignoring every variation axis.
That means the weight/width/optical-size axis you selected in a design tool has **no effect**; you
get whatever the font's default master happens to be.

**Do this:** instance the variable font to the specific static weight you want *before* uploading —
e.g. with fontTools:

```bash
fonttools varLib.instancer MyVariableFont.ttf wght=700 -o MyFont-Bold.ttf
```

Then register/upload `MyFont-Bold.ttf` (a static TTF) as the Bold variant. Register each weight you
need as its own separate variant (Regular / Bold / Italic / BoldItalic) — there is no synthetic or
faux bold/italic, and no axis interpolation at runtime.

### No OpenType shaping (GSUB / GPOS)

The engine maps text to glyphs **one codepoint → one glyph, straight through the `cmap`**. It
performs **no OpenType shaping**: the subsetter explicitly drops `GSUB`, `GPOS`, `GDEF`, and `kern`,
so none of the following work:

- Ligatures, contextual alternates, stylistic sets, positional/positional-form substitution.
- Mark positioning, cursive attachment, or any GPOS-driven kerning/placement.
- Complex-script shaping (contextual joining, reordering, bidi).

**What this means in practice:**

- **Latin, Cyrillic, and Greek work** — including **precomposed** accented/diacritic characters
  (e.g. `é`, `ñ`, `ü`, `ā`), because those are single codepoints in Latin-1 Supplement / Latin
  Extended-A/B that map 1:1 via `cmap`. **Combining diacritical marks** applied as separate
  codepoints will *not* be positioned onto their base letter (that needs GPOS) — use the
  precomposed form.
- **Arabic, Hebrew, and the Indic scripts do NOT work** — they require contextual shaping and/or
  bidirectional reordering that this engine deliberately does not do. They fail loud rather than
  render wrong (see the script scope below).

### Script / codepoint scope (custom fonts only)

Text styled with a **custom `font-family`** (not the default Helvetica path) is validated against a
fixed, versioned script classification. The **in-scope** ranges that render are:

| Range | Block |
|---|---|
| U+0000–007F | Basic Latin |
| U+0080–00FF | Latin-1 Supplement |
| U+0100–017F | Latin Extended-A |
| U+0180–024F | Latin Extended-B |
| U+0370–03FF | Greek and Coptic |
| U+0400–04FF | Cyrillic |
| U+0500–052F | Cyrillic Supplement |
| U+2440–245F | Optical Character Recognition (the four MICR E-13B control symbols) |
| U+E000–F8FF | Private Use Area (used by the built-in barcode fonts) |

Anything outside those ranges fails **loud at validation/render time** (never silently rendered
wrong), with a specific code:

| Category | Scripts (verified ranges) | Code |
|---|---|---|
| Complex-shaping | Hebrew (U+0590–05FF), Arabic (U+0600–06FF), Arabic Supplement (U+0750–077F), Devanagari + Indic block family (U+0900–0DFF), Arabic Presentation Forms-A/B (U+FB50–FDFF, U+FE70–FEFF) | `LF-SCRIPT-COMPLEX` |
| Deferred CJK | Hangul Jamo (U+1100–11FF), CJK Symbols & Punctuation (U+3000–303F), Hiragana (U+3040–309F), Katakana (U+30A0–30FF), CJK Ext-A (U+3400–4DBF), CJK Unified Ideographs (U+4E00–9FFF), Hangul Syllables (U+AC00–D7AF) | `LF-SCRIPT-CJK` |
| Unclassified | anything not in the in-scope or above out-of-scope lists | `LF-SCRIPT-UNCLASSIFIED` |

CJK is called out separately from complex-shaping because it is *deferred* pending composite
(Type0/CID) font support — a distinct future capability, not a shaping limitation — but today the
outcome is the same: it fails loud.

:::note The default Helvetica path is different
This script-scope check applies only to text in a **custom** font-family. The default Helvetica
path has its own fixed cp1252 repertoire and substitutes `?` for characters outside it — see
[Template language reference — Fonts & Typography](/reference/template-language#fonts--typography).
:::

### Resource limits

| Limit | Value | Code |
|---|---|---|
| Maximum size of a single font file | **2 MB** (2,097,152 bytes) | over → `LF-FONT-OVERSIZE` |
| Zero-byte upload | rejected | `LF-FONT-ZEROBYTE` |
| Distinct glyphs per `(family, style-variant)` per rendered document | **255** (plus `.notdef`) — the single-byte simple-font ceiling | over → `LF-FONT-GLYPHLIMIT` |

The 2 MB per-file limit comfortably covers a full-weight Latin/Cyrillic/Greek TrueType family
file while still failing loud on a mistakenly-uploaded multi-megabyte CJK-coverage font. The
255-distinct-glyph ceiling is per family-variant *per document* — a template + dataset combination
whose text reaches more than 255 distinct codepoints in one family/variant fails at render time.

**Recommendation: subset to Latin + Latin-Extended before uploading.** Both limits point the same
way — ship the engine only the glyphs you actually use. A source font trimmed to Latin +
Latin-Extended-A/B (plus Greek/Cyrillic if you need them) stays well under 2 MB and well under the
255-glyph ceiling, and drops coverage the engine can't render anyway.

There is no total-bytes cap across all fonts and no maximum-number-of-font-files cap in the font
pipeline — the only enforced quantitative limits are the 2 MB per-file size and the
255-distinct-glyph-per-document ceiling above.

## Bring your own font — preparation checklist

1. **Start from a static TTF.** If you have a variable font, instance it to the exact static weight
   first (`fonttools varLib.instancer …`, above). If you have an `.otf` with CFF outlines, convert
   it to `glyf`-outline TrueType — Pageworks will reject CFF (`LF-FONT-CFF`).
2. **Subset it** to the codepoints you use — Latin + Latin-Extended-A/B (add Greek/Cyrillic only if
   needed). Keeps you under both the 2 MB file limit and the 255-glyph-per-document ceiling, and
   avoids uploading out-of-scope coverage.
3. **Register each style variant separately** (Regular / Bold / Italic / BoldItalic) — no synthetic
   bold/italic, no axis interpolation.
4. **Licensing is your responsibility.** The engine embeds whatever bytes you register; it does not
   and cannot vet font licensing. You must hold the rights to embed and redistribute the font. The
   tenant-upload maintenance page enforces an explicit licensing-acknowledgment step for a human
   uploader; `RegisterFont` (an extension's own install code) has no separate gate because your app
   is the accountable party for what it ships. Permissively licensed fonts (e.g. SIL Open Font
   License) are the safe choice.

### If your font doesn't render as expected, check:

- **Is it a variable font?** → Instance it to a static weight and re-upload. (The engine reads only
  the default master and ignores the weight axis.)
- **Does the text need shaping** (Arabic/Hebrew/Indic joining, ligatures, mark positioning)? →
  Not supported — the engine maps one codepoint to one glyph. Arabic/Hebrew/Indic fail loud
  (`LF-SCRIPT-*`); Latin ligatures simply won't form.
- **Is a specific glyph missing / showing as `?` or `.notdef`?** → The codepoint is either outside
  the font's own `cmap` coverage, or outside the engine's in-scope script ranges (use the
  precomposed diacritic form, not a base letter + combining mark), or you exceeded the 255-glyph
  ceiling — subset/scope the text accordingly.
- **Is it an `.otf`?** → It may be CFF-outline (`LF-FONT-CFF`). Re-supply as a `glyf` TrueType.

## Determinism & self-containment (you do NOT need to pin font versions)

You do **not** have to freeze or version-pin fonts for reproducible output.

- **Each output PDF embeds the subsetted font it used.** The engine subsets the font down to
  exactly the glyphs the document reaches and embeds that subset directly in the PDF (the subsetter
  emits `cmap`/`glyf`/`head`/`hhea`/`hmtx`/`loca`/`maxp`/`name`/`post`, drops hinting and
  shaping/`DSIG` tables). A produced document is therefore fully **self-contained**
  — it renders identically on any viewer with none of the fonts installed, and is **unaffected by
  any later change** to the font asset in the tenant.
- **A loaded font is stored as an asset and reused** for subsequent renders (the Extension/Tenant
  asset model). Updating that asset changes *future* renders, never documents already produced.
- **Re-rendering after a font update may yield slightly different PDF bytes** — that is normal and
  expected, not a defect. The determinism guarantee is: *identical font bytes + identical template +
  identical dataset → byte-identical PDF*. Change any input (including the font) and the output may
  change; the point is that it is a pure function of its inputs, embedded and reproducible, not that
  the inputs can never change.
