# API Stability Promise — Pageworks

What counts as this app's public contract, and how it is retired when it must change.

## What is stable

The public surface is exactly the following. Every other object in the app is
`Access = Internal` and carries no stability promise whatsoever — it may change, move,
or be removed in any release, including a Minor or a hotfix.

1. **`codeunit 71179686 PageworksRegistry`** (`Access = Public`)
   - `procedure RegisterSource(Prefix: Code[20])`
   - `procedure RegisterPartial(Name: Code[50]; Content: Text; Description: Text[100])`
   - `procedure RegisterImage(Name: Code[50]; var ImageData: Codeunit "Temp Blob"; Description: Text[100])`
   - `procedure RegisterFont(Name: Code[50]; StyleVariant: Enum PageworksFontStyleVariant; var FontData: Codeunit "Temp Blob"; Description: Text[100])`
   - `procedure RegisterPageSize(Name: Code[50]; WidthPt: Decimal; HeightPt: Decimal; MarginTopPt: Decimal; MarginRightPt: Decimal; MarginBottomPt: Decimal; MarginLeftPt: Decimal; Description: Text[100])`

2. **`codeunit 71179690 PageworksValidator`** (`Access = Public`)
   - `procedure Validate(TemplateText: Text; ReportId: Integer; var Finding: Record PageworksFinding temporary)`

   Both of the codeunits above are thin, `Access = Public` facades: each public procedure's
   body does nothing but call straight through to an `Access = Internal` implementation
   codeunit (`PageworksRegistryImpl`, `PageworksValidatorImpl`) that holds the real logic. This
   is deliberate, not incidental — it decouples the stable public *signatures* from the actual
   implementation, so the internal codeunit's own name, shape, object ID, or entire logic can be
   freely rewritten, restructured, or replaced in any release (including a Minor or a hotfix)
   without that ever constituting a breaking change to the items listed here. Follow the same
   facade pattern for any future public codeunit added to this list.

3. **`table 71179677 PageworksFinding`** (`Access = Public`, `Extensible = false`) — a
   temporary, read-only result shape for consumers. Its fields (`EntryNo`, `Severity`,
   `Code`, `Message`, `Location`) are stable to read. `Add()` is `internal` — it is the
   engine's own insertion point, not part of the consumer contract.

4. **`enum 71179676 PageworksFindingSeverity`** (`Access = Public`,
   `Extensible = false`) — values `Error` (0), `Warning` (1).

5. **`enum 71179681 PageworksFontStyleVariant`** (`Access = Public`,
   `Extensible = false`) — values `Regular` (0), `Bold` (1), `Italic` (2),
   `BoldItalic` (3); the `StyleVariant` parameter type for `RegisterFont` (item 1).

6. **The `reportlayout/pageworks` MIME-type wiring contract** — the metadata token a
   report or report extension declares in its `rendering { layout { Type = Custom;
   MimeType = 'reportlayout/pageworks'; } }` block to opt a layout into being
   rendered by this engine (see `src/Demo/CustomerListPageworks.Report.al` and
   `src/Demo/StandardSalesInvoicePageworks.ReportExt.al` for the wiring shape). The token
   string itself, and the requirement that `Type = Custom`, are the contract.

Nothing else — no other codeunit, table, page, enum, or interface in this app — is part
of the public contract, regardless of how long it has existed or how stable it looks in
practice.

## Stability guarantee

Within a single Major version, none of the six items above will have a breaking change
made to it. A dependency app compiled against `X.y.z.r` keeps compiling and behaving
identically against any later `X.y'.z'.r'` in the same Major line.

## Breaking vs. non-breaking

**Non-breaking** (ships in a Minor or a hotfix):
- Adding a new procedure to `PageworksRegistry` or `PageworksValidator`.
- Adding a new overload of an existing public procedure.
- Adding a new public object.
- Adding a new value to `PageworksFindingSeverity` — not applicable today, since the
  enum is `Extensible = false` and shipped with a closed value set; see below.

**Breaking** (requires a Major version and the deprecation process below):
- Changing or removing an existing public procedure signature (parameter types, order,
  return value, or the procedure itself) on `PageworksRegistry` or
  `PageworksValidator`.
- Changing the shape (fields, types, or `Extensible`) of `PageworksFinding`, or making
  `Add()` a public entry point in a way that changes its current internal contract.
- Changing the `reportlayout/pageworks` MIME-type token string itself, or changing
  the required `Type = Custom` wiring shape around it.
- Removing a public object, or removing/renumbering a value of
  `PageworksFindingSeverity`.

Both `PageworksFinding` and `PageworksFindingSeverity` are shipped
`Extensible = false` by design — their ordinals are never renumbered, since already-
shipped values are stored in tenant data — consumers must
not assume either type can be extended by a third party, and the engine itself treats
their current value sets as closed for as long as the current Major version lives.

## Deprecation and obsoletion

Public members are retired via the platform's `ObsoleteState` progression only — never
deleted outright:

1. **`Pending`** — the member is marked obsolete with an `ObsoleteReason` naming its
   replacement. It still compiles and functions normally for consumers; the platform
   surfaces an obsoletion warning, not an error.
2. **`Pending` with a removal date/version** — once a concrete removal target is set,
   the `ObsoleteReason`/tag is updated to state the version (or date) at which the
   member moves to `Removed`.
3. **`Removed`** — the member no longer compiles for consumers. This transition only
   ever happens in a Major version bump (see `VersioningPolicy.md`), never in a Minor
   or hotfix.

**Minimum notice before removal**: at least one full Minor version of the current Major
line must have shipped with the member in `Pending` state, AND no sooner than 6 months
after it first entered `Pending`. Removal itself happens only in a
subsequent Major version — never in the same Major line the deprecation was announced
in.

## Consumer guidance

A dependency app referencing a member in `Pending` state keeps compiling throughout the
entire notice period — the platform emits an obsoletion warning at compile time, not an
error, so nothing breaks the consumer's build until the member actually reaches
`Removed` in a later Major version. Treat a `Pending` warning as a scheduled migration
task, not an emergency: read the `ObsoleteReason` for the named replacement and migrate
before the stated removal version ships.
