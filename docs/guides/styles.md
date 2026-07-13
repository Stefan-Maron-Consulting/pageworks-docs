# Shared styles — define your look once, reuse it everywhere

Until now, styling a Pageworks template meant repeating inline `style="..."` on every element —
there was no way to define "our corporate colors" once and reuse it across an invoice, a
statement, and a packing slip. Shared styles close that gap: you define **named classes** (a bag
of style properties under a name like `.brand-heading`), then apply them with `class="..."`, and
you can keep those classes in a **registered stylesheet** — a tenant-customizable asset that
follows the same Extension → Tenant model already used for Blocks, fonts, and images.

Shared styles introduce **no new style properties**. A class is just a reusable bundle of the same
22 properties inline `style="..."` already supports. This is a *reuse* mechanism, not a CSS
engine: no combinators, no media queries, no variables/tokens, no `#id` or element selectors.

:::note[Purely additive]
A template that uses none of this — no `<style-sheets>`, no `<style>` block, no `class` attribute
anywhere — renders **byte-identically** to before shared styles existed. You only pay for what you
opt into.
:::

## Three ways to apply styling

There are exactly three ways to put style onto an element. They differ only in *where the values
live* and *what precedence they carry*.

### (a) Inline `style="..."` on an element

The original mechanism, unchanged. Highest precedence — an inline `style` value always wins for
that property.

```xml
<h1 style="color: #1A3E5C; font-weight: bold;">{{Invoice.No}}</h1>
```

### (b) A document-local `<style>` block

Define classes once at the top of a template and apply them by name below. The `<style>` element
**must be a direct child of the template root** (alongside where `<style-sheets>` sits) — a
`<style>` block nested inside `body`, a `div`, or any other element is silently ignored as a
declaration.

```xml
<template page-size="A4" orientation="portrait" margin="56.7">
  <style>
    .brand-heading { color: #1A3E5C; font-weight: bold; font-size: 16pt; }
    .meta-label    { font-size: 8pt; color: #666666; text-transform: uppercase; }
  </style>

  <h1 class="brand-heading">{{Invoice.No}}</h1>
  <p class="meta-label">Invoice date</p>
</template>
```

The class-definition grammar is a series of `.name { prop: value; prop2: value2; }` blocks. Use a
document-local `<style>` block for one-off classes that aren't worth registering as a shared asset.

### (c) Registered stylesheets via `<style-sheets src="a, b" />`

Reference one or more **DB-registered** stylesheets by name. Like `<style>`, the `<style-sheets>`
directive **must be a direct child of the template root**. `src` is a **comma-separated list** of
stylesheet names (surrounding whitespace is trimmed); the list is **ordered** and that order *is*
cascade order (see below).

```xml
<template page-size="A4" orientation="portrait" margin="56.7">
  <style-sheets src="colors, typography" />

  <h1 class="brand-heading">{{Invoice.No}}</h1>
  <p class="meta-label">Invoice date</p>
</template>
```

Each name is resolved against the registered **Style Sheets** (see [Managing
stylesheets](#managing-stylesheets-in-the-database) below): a **Tenant** row of that name (a pure
tenant sheet or a tenant override of a baseline) wins over an **Extension** baseline of the same
name. A name that resolves to nothing is an [`LF-STYLEREF`](/reference/error-codes) error.

The class-definition grammar inside a registered stylesheet is identical to the `<style>` block
grammar — `.name { prop: value; ... }`.

## Selectors: classes only

This is the single most important thing to internalize:

:::warning[Only class selectors exist]
Styling is applied **only** through class selectors — a `.name { ... }` definition, applied with
`class="name"` on an element. There is **no** `#id` selector, **no** element/type selector
(`p { ... }`), and **no** universal or attribute selector. There is no notion of an element `id`
in the styling model at all.
:::

Richer targeting — element **`id`** selectors and possibly element/type selectors — is on the
[roadmap](/roadmap); today, name a class and apply it with `class="..."`.

An element can list **multiple** classes, space-separated:

```xml
<p class="meta-label brand-accent">{{Header.CustomerName}}</p>
```

When two classes set the same property, the **rightmost class in the list wins** for that
property. Resolution is **per property**, not per class as a whole — an element can draw `color`
from one class and `font-size` from another.

## The cascade

Every property on an element is resolved independently. From **lowest to highest** precedence:

1. **Referenced stylesheets**, in `<style-sheets src="...">` listed order — a class re-declared in
   a later-listed sheet overrides the same class from an earlier one.
2. **The document's own `<style>` block** — always resolves *after* every referenced sheet,
   regardless of where the `<style>` element textually appears relative to `<style-sheets>`.
3. **The element's `class="a b"` list** — resolved against the merged sheets+`<style>` classes;
   **rightmost class wins** on a property conflict.
4. **The element's own inline `style="..."`** — always highest; wins for any property it sets.

Re-declaring a class in a later-listed sheet (or in the `<style>` block) is the **intended** way
to override it — it is not an error.

### Worked example

```xml
<style-sheets src="base, overrides" />
<style>
  .callout { color: #444444; }
</style>

<p class="callout" style="font-weight: bold;">Notice</p>
```

- `base` defines `.callout { color: #000000; font-size: 10pt; }`
- `overrides` defines `.callout { color: #C0392B; }`
- the document `<style>` block defines `.callout { color: #444444; }`

Resolving `<p class="callout" style="font-weight: bold;">`:

| Property      | Winning value | Why |
|---------------|---------------|-----|
| `font-size`   | `10pt`        | only `base` sets it — survives untouched |
| `color`       | `#444444`     | `<style>` block (tier 2) beats both sheets (tier 1) |
| `font-weight` | `bold`        | inline `style=""` (tier 4) always wins |

## Allowed properties

A class body accepts **exactly the 22 properties** that inline `style=""` already supports, with
the identical enumerated value grammar. Anything outside this set — an unknown property name, or a
disallowed value for a known property — is rejected as [`LF-UNSUP`](/reference/error-codes), exactly as it
would be inline.

```
font-size        font-weight      font-style       font-family
color            background-color text-align       letter-spacing
text-transform   line-height      width            padding
padding-top      padding-right    padding-bottom   padding-left
margin-top       margin-bottom    border           border-top
border-bottom    vertical-align
```

:::warning[`margin-left` / `margin-right` are NOT supported]
Horizontal margins are rejected by name — even a "harmless" `margin-left: 0pt` is `LF-UNSUP`. Only
`margin-top` and `margin-bottom` exist. (This matches inline styling; it is not a shared-styles
restriction.)
:::

## Managing stylesheets in the database

Registered stylesheets are a maintained asset, reached from the **Pageworks Style Sheets** list
page (with a **Style Sheet Card** for editing content). Each row has a **Scope**:

- **Extension baseline.** Shipped by a dependent app (or Pageworks' own demo content) through
  install/upgrade code. Baseline rows are **read-only in the client** — only install code writes
  them.
- **Tenant.** A row you own and can edit — either a pure tenant sheet or a tenant *override* of an
  Extension baseline.

The lifecycle mirrors Blocks, fonts, and images exactly, via three actions on the list/card:

- **Copy.** Creates a brand-new, independently-named tenant sheet seeded from the source content,
  with **no** baseline linkage. Use this to start from an existing look and diverge.
- **Customize (Override).** Creates a Tenant-scope override under the **same name** as an Extension
  baseline, seeded with the baseline's current content. Because resolution prefers the Tenant row,
  editing the override changes **every template that references that sheet by name** — zero
  template edits. This is the concrete answer to "the customer wants their brand color changed":
  Customize the sheet once and every referencing template picks it up on its next render.
- **Revert to Extension Content.** Deletes the Tenant override, so resolution falls back to the
  (still-present) Extension baseline.

The card also surfaces **Newer Version Available** (the linked baseline's content changed since you
overrode it) and **Orphaned** (the baseline's source extension was uninstalled — the override still
works as a plain tenant sheet).

### Registering a stylesheet from a dependent app

A dependent extension ships baseline stylesheets in its install/upgrade code:

```al
codeunit 70101 MyAppInstall
{
    Subtype = Install;

    trigger OnInstallAppPerCompany()
    var
        Registry: Codeunit PageworksRegistry;
    begin
        Registry.RegisterStyleSheet(
            'colors',
            '.brand-heading { color: #1A3E5C; } .brand-accent { color: #C0392B; }',
            'Corporate color classes');
    end;
}
```

`RegisterStyleSheet(Name: Code[50]; Content: Text; Description: Text[100])` mirrors
`RegisterPartial`/`RegisterImage`/`RegisterFont`: caller identity is derived from the calling
module (never a parameter, never spoofable), registration is idempotent (re-registering identical
content, compared by SHA-256 hash, is a no-op), and the content is **validated against the
22-property allowlist before it is stored** — an invalid property or value fails the
`RegisterStyleSheet` call itself, so a bad sheet is never silently accepted.

## Gotchas and rules

- **Stylesheet names are case-SENSITIVE.** `<style-sheets src="Colors" />` will not resolve a sheet
  registered as `colors`. Match the registered name exactly.
- **No comments inside class bodies.** There is no `//` or `/* */` comment syntax. Anything that
  isn't a `.name { prop: value; ... }` block is treated as content to parse — expect an
  `LF-STYLEREF` (malformed) or `LF-UNSUP` error, not a silently-skipped comment.
- **`<style>` and `<style-sheets>` must be direct children of the template root.** A declaration
  nested inside `body`, a `div`, or any other element is silently ignored as a declaration (its
  classes simply won't be defined, and references to them become `LF-STYLEREF`).
- **Class names in `class="..."` are matched exactly** against defined classes; an undefined class
  reference is `LF-STYLEREF`.

## Error codes

Only two error codes relate to shared styles:

| Code | Fires when |
|---|---|
| `LF-STYLEREF` | a `<style-sheets>` entry names a stylesheet that isn't registered; **or** an element's `class="..."` references a name not defined in any listed sheet or the document's `<style>` block; **or** a class definition is malformed (not a well-formed `.name { ... }` block). |
| `LF-UNSUP` | a class body declares a property, or a property value, outside the 22-property allowlist — the identical treatment inline styles receive. |

See the full [Error & finding code catalog](/reference/error-codes) for how these fit alongside
every other code.

## Blocks and styles (current behavior)

:::info[Current behavior — Block-local isolation is not yet available]
Styling inside a reusable Block behaves as follows **today**:

- A Block's elements resolve their `class` references against the **host document's** classes (the
  merged referenced sheets + the host's `<style>` block). There is no per-Block resolution scope
  yet — a Block's classes and the host's classes share one namespace.
- A Block **cannot** declare its own `<style>` block. Only the template root's direct-child
  `<style>`/`<style-sheets>` declarations are read.

If you use classes inside Blocks, define those classes in a registered stylesheet (or the host
document's `<style>` block) that the including template references. Fully isolated, Block-local
styling — where a Block ships its own classes that neither leak out nor collide with the host — is
**planned for a future release**.
:::
