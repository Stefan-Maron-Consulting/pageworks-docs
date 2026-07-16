---
title: Adding fields to a report's dataset
description: Pull data from other tables into a report's dataset by configuration, no AL required.
---

# Adding fields to a report's dataset

:::tip[Confirmed working end-to-end]
Configuring a binding and a field here now reaches a template correctly — confirmed at
the API level: create a binding, add a field, and (if the target table needs one) define
how a report row matches a target record, then a template referencing the new column
renders the real, per-row pulled value. If you configured a field before this was fixed
and it still doesn't render, re-check the binding's readiness (see "Is this binding ready
to render?" below) before assuming something's wrong with the field itself.
:::

A report's dataset only carries the columns its AL definition puts there. Until now,
getting one more field onto a layout — a customer's phone number on an invoice, an
item's vendor on a purchase order — meant asking a developer to extend the report.
**Dataset Fields** lets a consultant or end user do this themselves, from the client, by
configuration: point at a related record already reachable from the report's own data,
pick which of its fields you want, and they become ordinary columns your template can
bind to.

## Opening it

- From **Layout Studio**, use the **Dataset Fields** action for the report you have open.
- Or search Tell-Me for **Pageworks Dataset Fields** to open the list page directly and
  enter a Report ID without going through Layout Studio first.

Either way you land on the **Dataset Fields** card for that report: *"Pull data from
other tables into this report by matching each report row to a record elsewhere."*

## How it works

Configuration has three levels, from broadest to most specific:

### 1. Anchor → Target Bindings

Each row on this subpage is one **binding** — a rule for reaching one related table from
one of the report's existing data items:

- **Anchor Data Item** — which of the report's own data items this binding starts from,
  picked from a lookup of the report's actual schema (no need to run the report first).
- **Target Table** — the table you want to pull fields from. A **Suggest Target Tables**
  action offers likely candidates based on the anchor's own relations, as a starting
  point — pick anything, not only a suggestion.
- **Set Filter** / **Clear Filter** — opens Business Central's own filter dialog against
  the target table, to restrict which target records are eligible and to set the sort
  order that decides which one counts as "first" when more than one matches.
- **Selection Mode** — **First Match** (default: take the first eligible record in sort
  order) or **Blank When Ambiguous** (more than one eligible match → leave the pulled
  fields blank for that row rather than guess).

### 2. Link Fields — how a report row matches a target record

Open **Link Fields** on a binding row to define the match itself: one or more
(report column) = (target table field) pairs, all of which must hold for a target record
to count as a match. Setting **Target Table** auto-populates a first guess at these pairs
from the tables' own relations; edit, add, or remove pairs freely afterward.

**Link Fields are optional.** A binding with no link pairs at all still resolves, using
whichever of these applies:

- If you set a filter (**Set Filter**, above) that narrows the target table down to
  exactly one eligible record, that record is used for every row.
- If you set no filter either, the target table's first record (in **Selection Mode**
  order) is used for every row.

This is the natural shape for a **single-record target table** — Company Information is
the clearest example: every report row would match the same one record regardless, so
there's nothing to link. Don't add Link Fields you don't need just because the section
exists; leave it empty for a single-record lookup and let the no-filter/first-record
behavior do the work. See "Is this binding ready to render?" below for how to confirm a
no-link binding is doing what you expect before you rely on it.

### 3. Fields — which columns you actually get

Open **Fields** on a binding row to pick the target table's fields you want as new
dataset columns. Each line is:

| Setting | What it does |
|---|---|
| **Target Field** | The field on the target table to pull, picked from a field-caption lookup. |
| **New Column Name** | The name your template binds to — `{{DataItem.NewColumnName}}`, using the anchor data item's name. Defaults to a PascalCase version of the field's caption (e.g. "Posting Date" → `PostingDate`) and is fully editable; it can never collide with a column the report's own dataset already provides. |
| **Value Type** | Read-only, detected automatically from the target field's real type (Text, Code, Decimal, Integer, Date, Time, DateTime, Boolean, Option, GUID). |
| **Format Expression** | An optional Business Central format expression (e.g. `<Precision,2:2>`, `<Day,2>/<Month,2>/<Year4>`) applied to Decimal or Date fields. This is separate from a template's own `format` attribute (see [Template language reference](/reference/template-language#format-controls-format)) — set it here if you want the pulled value pre-formatted regardless of how the template binds it, or leave it blank and format in the template instead. |
| **Aggregation** | **None** (default — a single pulled value), or **Count** / **Sum** / **Average** / **Min** / **Max** to roll the field up across every record that matches the binding, not just the first. Sum and Average require a numeric field; Min and Max require a numeric or date field. |
| **Enabled** | Turn a line off without deleting it — a disabled line is skipped. |
| **Valid** | Read-only. Flags a line whose Target Field no longer exists (e.g. deleted upstream since it was configured), with an **Invalid Reason** explaining why. |

## Is this binding ready to render?

A binding can be fully configured and still not resolve at render time — most commonly
because Link Fields were set up but don't actually narrow to a match, or because a
no-link binding's intent (filtered vs. first-record) isn't what you expected. Rather than
finding this out from a template failing to render, the API-level view of a binding
exposes it directly (see [External API §4](/reference/external-layout-api#4-dataset-field-configuration-custom-fields-without-al)
if you're checking this programmatically): whether the binding will actually resolve, and
which mechanism it's using to do so — a genuine link match, a stored filter, or an
unfiltered first record. Check this before assuming a configured field is wired up
correctly, the same way you'd check a formula before trusting its output.

## Using the new field in a template

Once configured, a pulled field is an ordinary dataset column — no different from one
the report's own AL already produced. Bind it exactly the same way:
`{{DataItem.NewColumnName}}` (or `{{NewColumnName}}` for the first row, per the usual
binding rules — see [Template language reference](/reference/template-language)).

If the target field you pulled is a **Media or BLOB** field (e.g. a picture or logo on
the target table), the resulting column works as an image source too — reference it from
`<img src="{{DataItem.NewColumnName}}"/>` exactly like any other Media/Blob-bound image
(see [Template language → Images](/reference/template-language#images-img)). No separate
image-asset registration needed; the image comes from the live record at render time.

It also shows up in the [Insert Picker](/guides/using-the-insert-picker)'s **Custom**
tab, scoped to whichever report Layout Studio currently has open, so you can insert it
without memorizing the column name you chose.

## Who this is for

This is aimed at the same audience as the rest of Pageworks's self-service surface —
a consultant or business user adjusting a layout without writing AL. It reaches any
table already linkable from the report's own data; it doesn't require the report's AL
to have anticipated the field you want.
