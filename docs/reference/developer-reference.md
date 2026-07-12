# Pageworks — Developer Reference

This is the complete external contract for building a dependency app against
Pageworks. The engine ships closed-source (`resourceExposurePolicy` fully closed — no
debugging, no source download, no source in the symbol file); this document, plus the
symbol package, is everything a third-party developer will ever see or need. If a step
in your onboarding requires reading engine source, that is a gap in this document, not
something to work around by asking for the source.

---

## 1. Consuming the engine as a dependency

Add Pageworks to your app's `dependencies` array in `app.json`:

```json
{
  "dependencies": [
    {
      "id": "c653f0a4-b86d-4122-8396-17efd3d7a703",
      "publisher": "Stefan Maron Consulting",
      "name": "Pageworks",
      "version": "1.0.0.0"
    }
  ]
}
```

Use the actual installed version in your environment for `version` — this is the
minimum, not a pin. Once the dependency is declared and symbols are downloaded, only
objects marked `Access = Public` on the engine side are visible to your code at all;
everything else does not resolve, by design. The complete list of public members is
[API stability promise](/reference/api-stability) in the engine's own repo — restated here only as needed to
use each extension point (sections 3–6 below).

## 2. Extension point 1 — Registering Blocks

:::note
"Blocks" is the user-facing name shown in the client (the **Pageworks Blocks** page, its
captions, tooltips, and messages). The underlying identifiers — the `PageworksRegistry`
API below, its `RegisterPartial` procedure, the `PageworksPartial` table, and the
`{{> name}}` include syntax — all still say "Partial"; there is no `RegisterBlock` alias.
As a developer you call `RegisterPartial`; your users see the results as "Blocks".
:::

A Block (registered via the `RegisterPartial` API) is a named, shared template fragment
(company footer, address block, style header) that any Pageworks template can pull in
with `{{> name}}`. Registering your own Blocks lets your app ship reusable fragments that
consuming reports — yours or anyone else's — can reference, and that tenants can later
override without touching your code.

Call the public `PageworksRegistry` codeunit (`codeunit 71179686`) from your own app's
install or upgrade codeunit — never from a page or a directly-invoked action; the engine
requires a real install/upgrade module context (`NavApp.GetCallerModuleInfo()`) and
errors out otherwise.

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
        Registry.RegisterSource('mycompany');
        Registry.RegisterPartial(
            'company-footer',
            '<span>My Company Ltd. - VAT GB123456789 - www.mycompany.example</span>',
            'Standard company footer');
    end;
}
```

**Signatures** (both `Access = Public` on `PageworksRegistry`):

```al
procedure RegisterSource(Prefix: Code[20])
procedure RegisterPartial(Name: Code[50]; Content: Text; Description: Text[100])
```

**Rules a consumer must obey:**

- Call `RegisterSource` once per app to claim a namespace prefix (e.g. `'mycompany'`).
  Prefixes are unique across every installed app in the tenant — the first registrant
  keeps a given prefix; a conflicting claim fails your install with an actionable
  `LF-PREFIX` error naming the owning app.
- Call `RegisterPartial` after `RegisterSource` for each baseline Block you ship.
  `Name` is unqualified and only needs to be unique within your own app.
- Both calls are idempotent: re-registering identical content is a no-op (compared by
  content hash); re-registering with changed content updates your baseline only —
  tenant-created overrides of that Block are never touched.
- Reference your Blocks from any template two ways:
  - **Unqualified** — `{{> company-footer}}`. Resolves tenant-override-first, then a
    unique baseline match across all installed apps. If more than one app's baseline
    registers the same unqualified name, an unqualified reference is ambiguous
    (`LF-AMBIG`) — the finding names the candidates and how to qualify.
  - **Qualified** — `{{> mycompany/company-footer}}`. Pinned to your app's prefix;
    always unambiguous, and the right choice when you reference your own Block from
    your own templates.
- **Resolution precedence**: a tenant override, if one exists for that name, always wins
  over any extension baseline, regardless of qualification. Nothing else — no version,
  no install order — factors into precedence.
- An unresolved `{{> name}}` (no baseline and no override) is `LF-PARTIAL`; an include
  chain that cycles back on itself is `LF-CYCLE`. Both are validation/render errors, not
  silent fallbacks.
- Caller identity is derived from the platform's module info, never from a parameter —
  you cannot register a Block under another app's identity, and you cannot spoof
  `RegisterSource`'s ownership check.

## 3. Extension point 2 — Registering images

An extension can ship its own baseline image assets (a logo, a stamp, a signature
graphic) through the same public `PageworksRegistry` codeunit, referenceable by
templates via `<img src="...">` exactly like a tenant-uploaded image — see
[Template language reference](/reference/template-language)'s "Images" section for the
full `src` resolution grammar and format rules.

```al
codeunit 70101 MyAppInstall
{
    Subtype = Install;

    trigger OnInstallAppPerCompany()
    begin
        RegisterPageworksImages();
    end;

    local procedure RegisterPageworksImages()
    var
        Registry: Codeunit PageworksRegistry;
        ImageData: Codeunit "Temp Blob";
        ImageOutStream: OutStream;
    begin
        ImageData.CreateOutStream(ImageOutStream);
        // ... write your JPEG/PNG source bytes to ImageOutStream ...
        Registry.RegisterImage('Logo', ImageData, 'Corporate letterhead logo');
    end;
}
```

**Signature** (`Access = Public` on `PageworksRegistry`):

```al
procedure RegisterImage(Name: Code[50]; var ImageData: Codeunit "Temp Blob"; Description: Text[100])
```

**Rules a consumer must obey:**

- The image format (JPEG or PNG) is auto-detected from the content's own magic bytes —
  you never declare a format.
- Unlike `RegisterPartial`/`RegisterFont`, `RegisterImage` does **not** require a prior
  `RegisterSource` call: unqualified resolution (`src="Logo"`) works without a claimed
  prefix; qualified resolution (`src="acme/Logo"`) still requires one.
- Caller identity is derived from `NavApp.GetCallerModuleInfo()`, exactly like
  `RegisterPartial`/`RegisterFont` — never a parameter, never spoofable.
- Registration is idempotent: re-registering byte-identical content (SHA-256 hash
  compare) is a no-op; changed content updates your baseline in place. A tenant upload
  of the same effective name overrides your baseline, mirroring the Block/font
  precedent exactly.
- The image is validated eagerly, before it is stored — an unsupported container format,
  corrupt bytes, or content exceeding the 10 MB per-asset limit fails the `RegisterImage`
  call itself with an actionable `LF-IMGFMT`/`LF-IMGCORRUPT`/`LF-IMGSIZE` error (see
  [Error & finding code catalog](/reference/error-codes)) — never a bad asset silently
  accepted and failing later at render time.

## 4. Extension point 3 — Registering shared stylesheets

An extension can ship its own baseline **stylesheet** — a set of named classes, each a
closed bag of the same style properties available inline — through the same public
`PageworksRegistry` codeunit. A template references it via `<style-sheets src="...">`
and applies a class with `class="name"` exactly like a tenant-defined stylesheet — see
the [Shared styles guide](/guides/styles) for the full authoring syntax, cascade, and
precedence rules.

```al
codeunit 70101 MyAppInstall
{
    Subtype = Install;

    trigger OnInstallAppPerCompany()
    begin
        RegisterPageworksStyleSheets();
    end;

    local procedure RegisterPageworksStyleSheets()
    var
        Registry: Codeunit PageworksRegistry;
    begin
        Registry.RegisterSource('mycompany');
        Registry.RegisterStyleSheet(
            'brand',
            '.brand-heading { color: #1A2B3C; font-weight: bold; }',
            'Corporate brand classes');
    end;
}
```

**Signature** (`Access = Public` on `PageworksRegistry`):

```al
procedure RegisterStyleSheet(Name: Code[50]; Content: Text; Description: Text[100])
```

**Rules a consumer must obey:**

- Requires a prior `RegisterSource` call, exactly like `RegisterPartial` — `Name` is
  unqualified and only needs to be unique within your own app.
- Content is validated against the same closed style-property allowlist inline
  `style="..."` uses, before it is stored — an invalid property or value fails the
  `RegisterStyleSheet` call itself with an actionable `LF-UNSUP` error, never a bad
  stylesheet silently accepted and failing later at render/validation time.
- Registration is idempotent: re-registering byte-identical content (SHA-256 hash
  compare) is a no-op; changed content updates your baseline in place. A tenant override
  of the same effective name is never touched, mirroring the Block/image/font precedent.
- Caller identity is derived from `NavApp.GetCallerModuleInfo()`, never a parameter,
  never spoofable.

## 5. Extension point 4 — Registering page sizes

An extension can ship its own baseline **named page sizes** through the same public
`PageworksRegistry` codeunit. A registered page size is referenceable from any template
via `page-size="Name"` exactly like the built-in `A4`/`Letter` — see the
[Template language reference](/reference/template-language)'s "Custom page sizes" section
for how authors use them (including entering dimensions in mm/inch as well as points in
the client).

```al
codeunit 70101 MyAppInstall
{
    Subtype = Install;

    trigger OnInstallAppPerCompany()
    begin
        RegisterPageworksPageSizes();
    end;

    local procedure RegisterPageworksPageSizes()
    var
        Registry: Codeunit PageworksRegistry;
    begin
        // A5 portrait: 419.53 x 595.28 pt, 42.5 pt margins all round.
        Registry.RegisterPageSize('A5', 419.53, 595.28, 42.5, 42.5, 42.5, 42.5, 'ISO A5');
    end;
}
```

**Signature** (`Access = Public` on `PageworksRegistry`):

```al
procedure RegisterPageSize(Name: Code[50]; WidthPt: Decimal; HeightPt: Decimal; MarginTopPt: Decimal; MarginRightPt: Decimal; MarginBottomPt: Decimal; MarginLeftPt: Decimal; Description: Text[100])
```

**Rules a consumer must obey:**

- All dimensions and margins are supplied in **points** (the engine's canonical unit;
  1 in = 72 pt). The client's Page Sizes card additionally displays and accepts mm and
  inches, computing points for you — but the API takes points.
- Like `RegisterImage`, `RegisterPageSize` does **not** require a prior `RegisterSource`
  call. Caller identity is derived from `NavApp.GetCallerModuleInfo()`, never a parameter.
- Registration is idempotent: re-registering identical values is a no-op; changed values
  update your baseline in place. A tenant-created page size (or tenant override) of the
  same name always wins over your baseline at render time, mirroring the Block/image/font
  precedent.
- Referencing a name that resolves to no page size is a validation/render error
  (`LF-UNSUP` naming the value) — never a silent fallback to a default size.

## 6. Extension point 5 — Wiring a report layout

Wiring is entirely declarative — there is no AL call into the engine. A report or report
extension opts a layout into Pageworks rendering by giving it the engine's MIME-type
token in a `rendering { layout { ... } }` block:

```al
report 71179675 CustomerListPageworks
{
    DefaultRenderingLayout = PageworksLayout;

    dataset
    {
        dataitem(Customer; Customer)
        {
            column(No; "No.") { }
            column(Name; Name) { }
        }
    }

    rendering
    {
        layout(PageworksLayout)
        {
            Type = Custom;
            LayoutFile = './src/Demo/CustomerListPageworks.pageworks';
            MimeType = 'reportlayout/pageworks';
            Caption = 'Pageworks template';
            Summary = 'Layered XHTML template rendered by Pageworks.';
        }
    }
}
```

The same shape works on a `reportextension` to add a Pageworks layout to a report you
don't own, without touching its dataset:

```al
reportextension 71179692 StandardSalesInvoicePageworks extends "Standard Sales - Invoice"
{
    rendering
    {
        layout(SalesInvoicePageworksPWSTM)
        {
            Type = Custom;
            LayoutFile = './src/Demo/SalesInvoicePageworks.pageworks';
            MimeType = 'reportlayout/pageworks';
            Caption = 'Sales Invoice (Pageworks)';
            Summary = 'Showcase invoice layout rendered natively in-tenant by Pageworks.';
        }
    }
}
```

- `Type = Custom` and `MimeType = 'reportlayout/pageworks'` are both required — this
  exact token pair is the stable contract ([API stability promise](/reference/api-stability), item 5). The
  engine's subscriber only handles layouts carrying this MIME type; every other report
  and layout is left entirely to the platform.
- `LayoutFile` points at your template — a plain, well-formed XHTML file shipped as a
  normal source file in your app. The conventional naming is the single `*.pageworks`
  extension (see `./src/Demo/CustomerListPageworks.pageworks` above), not a double
  `*.pageworks.html`; `LayoutFile`'s on-disk extension doesn't affect an extension-wired
  layout's MIME type, since `MimeType = 'reportlayout/pageworks'` is declared explicitly
  in AL, but using the single extension consistently matters for a **manually-uploaded**
  layout, where Business Central derives the MIME type from the file extension (see
  [Creating a layout in the client](/guides/creating-layouts-in-the-client)). The Sales
  Invoice demo (`./src/Demo/SalesInvoicePageworks.pageworks`) also uses the single
  `.pageworks` extension, so that exporting and re-uploading a copy of the demo through
  the client keeps working. It is not registered via any AL call; the platform packages
  it as the layout's content at build time, same as any other custom report layout.
- Requesting PDF, Preview, or Print from a Pageworks-wired layout is served by the engine's
  native PDF backend. Requesting Word or Excel raises an actionable `LF-FMT` error
  instead of producing empty output; declare a second (RDLC or Word) layout in the same
  `rendering` block if the report must also offer those formats.
- The template language itself (root attributes, structural elements, `data-each`,
  bindings, inline styles) is published for authors as [Template language reference](/reference/template-language) — read
  it once you start writing `.pageworks` content. It is a supported subset of
  XHTML/CSS — a closed allowlist, not full HTML/CSS — and anything outside it is an
  `LF-UNSUP` finding.

## 7. Extension point 6 — Registering fonts

An extension can ship its own font programs (e.g. a corporate-branding typeface bundled
with a vertical solution) through the same public `PageworksRegistry` codeunit,
resolvable by templates exactly like a tenant-uploaded font.

```al
codeunit 70101 MyAppInstall
{
    Subtype = Install;

    trigger OnInstallAppPerCompany()
    begin
        RegisterPageworksFonts();
    end;

    local procedure RegisterPageworksFonts()
    var
        Registry: Codeunit PageworksRegistry;
        FontData: Codeunit "Temp Blob";
        FontOutStream: OutStream;
    begin
        FontData.CreateOutStream(FontOutStream);
        // ... write your TTF/OTF font program bytes to FontOutStream ...
        Registry.RegisterFont('MyApp-Sans', Enum::PageworksFontStyleVariant::Regular, FontData, 'MyApp corporate sans, regular weight');
    end;
}
```

**Signature** (`Access = Public` on `PageworksRegistry`):

```al
procedure RegisterFont(Name: Code[50]; StyleVariant: Enum PageworksFontStyleVariant; var FontData: Codeunit "Temp Blob"; Description: Text[100])
```

**Rules a consumer must obey:**

- One call per **(family, style-variant)** pair. `Regular`/`Bold`/`Italic`/`BoldItalic`
  are independently registered — there is no synthetic/faux bold or italic. A template
  combining `font-family` with a weight/style whose variant you never registered fails
  loudly (`LF-FONT-VARIANT`), it never falls back to a different variant.
- Caller identity is derived from `NavApp.GetCallerModuleInfo()`, exactly like
  `RegisterPartial`/`RegisterImage` — never a parameter, never spoofable. The font is
  stored as an `Extension`-scope baseline row keyed by your app identity, the family
  name, and the style variant.
- Registration is idempotent: re-registering byte-identical content is a no-op;
  changed bytes update your baseline in place.
- A tenant upload of the same family/variant **overrides** your baseline (exactly the
  partial/image precedent) — reverting that tenant override restores your registered
  content. Call `RegisterSource` first if you want your font referenced as
  `prefix/name`; unqualified references resolve to your baseline whenever the family
  name is unique across all installed apps.
- The font content is validated before it is stored — zero-byte or corrupt bytes,
  content exceeding the documented per-asset size limit, or a CFF-outline (as opposed
  to TrueType-outline/`glyf`) OTF all fail the `RegisterFont` call itself with an
  actionable `LF-FONT-*` error (see [Template language reference](/reference/template-language)'s "Fonts & Typography"
  section for the complete asset-guard list) — never a bad asset silently accepted and
  failing later at render time.
- **Licensing responsibility is yours.** The engine embeds whatever font bytes you
  register; it does not vet, and cannot vet, third-party font licensing. You are solely
  responsible for holding the rights necessary to embed and redistribute the font
  you register (the same principle the tenant-upload maintenance UI enforces via an
  explicit acknowledgment step for a human uploader — `RegisterFont` has no separate
  acknowledgment gate because your own app's install/upgrade code is the accountable
  party for content it ships).

:::note
This licensing-acknowledgment step is enforced only in the **tenant-side maintenance UI**
(the **Pageworks Font Assets** page), not in `RegisterFont` itself. A human uploading a
font there must go **New → set Name → Acknowledge Licensing → Import**, in that order —
Import prompts for the acknowledgment inline if it hasn't been given yet. Custom fonts
(both extension-registered and tenant-uploaded) are a fully shipped, supported feature,
not a preview capability.
:::

### Registering a barcode font (`RegisterFont` symbology overload)

A five-parameter overload of `RegisterFont` additionally couples the font asset to a
1D barcode symbology, marking it as a barcode font — see the
[Barcodes guide](/guides/barcodes) for how a coupled font's runs are then auto-encoded
at render time.

**Signature** (`Access = Public` on `PageworksRegistry`):

```al
procedure RegisterFont(Name: Code[50]; StyleVariant: Enum PageworksFontStyleVariant; var FontData: Codeunit "Temp Blob"; Description: Text[100]; Symbology: Enum PageworksBarcodeSymbology)
```

This is a non-breaking addition — the four-parameter overload above is unchanged and
still registers ordinary text fonts (`Symbology` defaults to `None`). Every other rule
above (one call per family/style-variant, idempotency, tenant-override precedence,
content validation, licensing responsibility) applies identically; the only difference
is the extra `Symbology` value stored alongside the font asset.

## 8. Extension point 7 — Invoking validation

Call the public `PageworksValidator` codeunit (`codeunit 71179690`) to check a
template before deployment — from your own tooling, a test, or a custom page action.
It never throws for template problems; every outcome comes back as a finding row.

```al
procedure Validate(TemplateText: Text; ReportId: Integer; var Finding: Record PageworksFinding temporary)
```

```al
var
    Validator: Codeunit PageworksValidator;
    Finding: Record PageworksFinding temporary;
    TemplateText: Text;
begin
    TemplateText := GetMyTemplateText();

    // ReportId <> 0 also resolves {{...}} bindings against that report's real dataset
    // (this executes the report's OnPreReport/trigger code — only pass reports that are
    // safe to run outside their normal invocation context). Pass 0 to skip binding
    // checks, e.g. when validating a partial in isolation.
    Validator.Validate(TemplateText, Report::CustomerListPageworks, Finding);

    if Finding.FindSet() then
        repeat
            case Finding.Severity of
                Finding.Severity::Error:
                    Message('%1 (%2) at %3', Finding.Message, Finding.Code, Finding.Location);
                Finding.Severity::Warning:
                    Message('Warning %1 (%2) at %3', Finding.Message, Finding.Code, Finding.Location);
            end;
        until Finding.Next() = 0;
end;
```

`PageworksFinding` (`table 71179677`, `Access = Public`, `Extensible = false`,
temporary) fields you read: `EntryNo`, `Severity`, `Code`, `Message`, `Location`. Its
`Add()` procedure is `internal` — it is the engine's own insertion point, not part of
your contract; you only ever read rows the engine populates.

`PageworksFindingSeverity` (`enum 71179676`, `Access = Public`, `Extensible = false`)
has exactly two values:

| Value | Ordinal | Meaning |
|---|---|---|
| `Error` | 0 | Rendering this template will fail with the same code. Must be fixed before deployment. |
| `Warning` | 1 | Renders, but with documented degradation (e.g. character substitution, a keep-together group breaking across pages). |

Both types are shipped closed (`Extensible = false`) by design — do not build logic that
assumes either can be extended.

## 9. Stability & versioning

`PageworksRegistry`, `PageworksValidator`, `PageworksFinding`,
`PageworksFindingSeverity`, and the `reportlayout/pageworks` MIME-type wiring
contract are the entirety of the engine's public surface and are covered by
[API stability promise](/reference/api-stability) — read it for what counts as breaking vs. non-breaking and
the obsoletion process. Version compatibility (what a Major/Minor/hotfix bump may
contain) is covered by [Versioning policy](/reference/versioning-policy). Neither is restated here; both apply
to every signature and contract shown in this document.

