# Contract: Error & Finding Code Catalog

One catalog for validator findings and render-time errors. Every code has
an actionable message (Label with Comment) stating what failed AND what to do.

| Code | Severity | Condition | Message must include |
|---|---|---|---|
| LF-XML | Error | template/partial is not well-formed XML | parse error detail + location |
| LF-UNSUP | Error | element/attribute/style value outside the language contract | the construct + pointer to supported set |
| LF-PARTIAL | Error | `{{> name}}` resolves to nothing | partial name + referencing layout/partial |
| LF-AMBIG | Error | unqualified include matches >1 extension partial | candidates with their prefixes + how to qualify |
| LF-CYCLE | Error | include chain contains a cycle | the full chain A→B→A |
| LF-BIND | Error | binding references a data item/column absent from the dataset | binding text + available names |
| LF-GEOM | Error | declared column widths exceed printable width; margins exceed page | the numbers involved |
| LF-FMT | Error | requested output format not served (Word/Excel) | supported format (PDF) + where to change |
| LF-PREFIX | Error | RegisterSource prefix conflict | prefix + owning app |
| LF-KEEPOV | Warning | keep-together group taller than one page (will break normally) | group location |
| LF-CHARS | Warning | template/static text contains characters outside cp1252 | location; note about `?` substitution |
| LF-COLSPAN | Error | a `<tr>`'s cell colspan sum (occupancy-adjusted for any active rowspan) ≠ the table's declared column count | the row + actual vs. expected column count |
| LF-NESTDEPTH | Error | containing-block nesting depth (table/div/section/td/th boundaries from the document root) exceeds 8 | the offending element location + the configured limit (8) |
| LF-ROWSPANOV | Warning | a `rowspan` group is estimated taller than one full page's printable content area — same static-estimate/documented-degradation philosophy as LF-KEEPOV; it cannot be kept together and breaks across pages normally instead | group location + rowspan count + estimated vs. content-area height |

Rules:
- Renderer failures surface via `ErrorInfo` with the code in the message and telemetry
  event LF0002 carrying the code as a dimension.
- Validation returns findings (temporary table) — it never throws for template problems.
- Adding a code means updating this catalog: every catalogued condition has a test
  proving actionable output, never a silent blank document.
