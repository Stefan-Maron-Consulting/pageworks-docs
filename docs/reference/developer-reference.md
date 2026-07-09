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
      "version": "0.8.1.0"
    }
  ]
}
```

Use the actual installed version in your environment for `version` — this is the
minimum, not a pin. Once the dependency is declared and symbols are downloaded, only
objects marked `Access = Public` on the engine side are visible to your code at all;
everything else does not resolve, by design. The complete list of public members is
[API stability promise](/reference/api-stability) in the engine's own repo — restated here only as needed to
use each extension point (sections 3–5 below).

## 2. Extension point 1 — Registering partials

A partial is a named, shared template fragment (company footer, address block, style
header) that any Pageworks template can pull in with `{{> name}}`. Registering your
own partials lets your app ship reusable fragments that consuming reports — yours or
anyone else's — can reference, and that tenants can later override without touching your
code.

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
- Call `RegisterPartial` after `RegisterSource` for each baseline partial you ship.
  `Name` is unqualified and only needs to be unique within your own app.
- Both calls are idempotent: re-registering identical content is a no-op (compared by
  content hash); re-registering with changed content updates your baseline only —
  tenant-created overrides of that partial are never touched.
- Reference your partials from any template two ways:
  - **Unqualified** — `{{> company-footer}}`. Resolves tenant-override-first, then a
    unique baseline match across all installed apps. If more than one app's baseline
    registers the same unqualified name, an unqualified reference is ambiguous
    (`LF-AMBIG`) — the finding names the candidates and how to qualify.
  - **Qualified** — `{{> mycompany/company-footer}}`. Pinned to your app's prefix;
    always unambiguous, and the right choice when you reference your own partial from
    your own templates.
- **Resolution precedence**: a tenant override, if one exists for that name, always wins
  over any extension baseline, regardless of qualification. Nothing else — no version,
  no install order — factors into precedence.
- An unresolved `{{> name}}` (no baseline and no override) is `LF-PARTIAL`; an include
  chain that cycles back on itself is `LF-CYCLE`. Both are validation/render errors, not
  silent fallbacks.
- Caller identity is derived from the platform's module info, never from a parameter —
  you cannot register a partial under another app's identity, and you cannot spoof
  `RegisterSource`'s ownership check.

## 3. Extension point 2 — Wiring a report layout

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
            LayoutFile = './src/Demo/CustomerListPageworks.pageworks.html';
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
            LayoutFile = './src/Demo/SalesInvoicePageworks.pageworks.html';
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
- `LayoutFile` points at your template — a plain, well-formed XHTML file conventionally
  named `*.pageworks.html`, shipped as a normal source file in your app (see the two demo
  paths above: `./src/Demo/CustomerListPageworks.pageworks.html` and
  `./src/Demo/SalesInvoicePageworks.pageworks.html`). It is not registered via any AL call; the
  platform packages it as the layout's content at build time, same as any other custom
  report layout.
- Requesting PDF, Preview, or Print from a Pageworks-wired layout is served by the engine's
  native PDF backend. Requesting Word or Excel raises an actionable `LF-FMT` error
  instead of producing empty output; declare a second (RDLC or Word) layout in the same
  `rendering` block if the report must also offer those formats.
- The template language itself (root attributes, structural elements, `data-each`,
  bindings, inline styles) is published for authors as [Template language reference](/reference/template-language) — read
  it once you start writing `.pageworks.html` content. It is a supported subset of
  XHTML/CSS — a closed allowlist, not full HTML/CSS — and anything outside it is an
  `LF-UNSUP` finding.

## 4. Extension point 3 — Registering fonts

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

## 5. Extension point 4 — Invoking validation

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

## 6. Stability & versioning

`PageworksRegistry`, `PageworksValidator`, `PageworksFinding`,
`PageworksFindingSeverity`, and the `reportlayout/pageworks` MIME-type wiring
contract are the entirety of the engine's public surface and are covered by
[API stability promise](/reference/api-stability) — read it for what counts as breaking vs. non-breaking and
the obsoletion process. Version compatibility (what a Major/Minor/hotfix bump may
contain) is covered by [Versioning policy](/reference/versioning-policy). Neither is restated here; both apply
to every signature and contract shown in this document.

