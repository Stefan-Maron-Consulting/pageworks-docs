# Using the Insert Picker

**Pageworks Layout Studio** and the **Block editor** both have an **Insert** action that
opens a picker over the things you'd otherwise have to type by hand: dataset fields,
Blocks, images, and fonts. It's a convenience for authoring — everything it inserts is
plain template syntax you could also type yourself; the picker just saves you from
having to memorize or look up the exact token.

## What you can insert

The picker has four tabs:

| Tab | Inserts | Notes |
|---|---|---|
| **Fields** | `{{DataItem.Column}}` | Every data item / column pair from the report's dataset. Requires a successful **Regenerate** first — see "Fields tab" below. |
| **Blocks** | `{{> Name}}` | Every Block you can currently reference (your tenant's own Blocks, plus baseline Blocks from installed extensions). |
| **Images** | `<img src="Name">` | Every registered image asset. |
| **Fonts** | the full `font-family: Name; font-weight: ...; font-style: ...;` triple | One entry per registered font variant (Regular/Bold/Italic/BoldItalic). The picker always inserts the complete triple for the variant you pick — never just the family name — so the inserted style always resolves to exactly the variant you selected. |

## Where Insert is available, and how it inserts

- **Layout Studio** — open **Insert**, pick something, and it's spliced in **exactly at
  your cursor position** in the template text. Your cursor lands right after the
  inserted token, so you can keep typing.
- **Block editor** (the page you use to edit a Block's own content) — Insert **appends**
  the picked token to the **end** of the Block's content instead. The standard text
  control used there doesn't support inserting at an arbitrary cursor position, so the
  editor tells you this up front rather than leaving you to discover it — reposition the
  inserted token manually afterward if you need it somewhere else in the content.

## Fields tab

The Fields tab lists whatever dataset the report last produced when you ran
**Regenerate** in Layout Studio. If you haven't regenerated yet for the report you're
currently editing — or you've just switched which report Layout Studio is pointed at —
the Fields tab is disabled with a hint telling you to regenerate first. The picker never
runs your report in the background on its own; **Regenerate** stays the one place that
happens, so opening Insert never has a side effect on its own.

## Not available yet

- Drag-and-drop insertion.
- True cursor placement in the Block editor (it's append-only for now).
- Search/filter or favorites inside the picker.
