# Creating a Pageworks Layout by Hand (in the Business Central Client)

This guide is for a **user or consultant** who wants to add a Pageworks layout to a
report directly in the Business Central web client — without writing an extension.

Pageworks recognizes a report layout by its MIME type, `reportlayout/pageworks`. When you
add a layout manually, Business Central derives the MIME type from the **file extension**,
so naming the file correctly is all it takes — no code and no event subscribers required.

## Steps

1. Author your layout as a Pageworks HTML template and save it with a **single
   `.pageworks` extension** — for example `MyInvoice.pageworks`.

   :::warning
   Do **not** use a double extension such as `MyInvoice.pageworks.html`. Business Central
   would read the last extension (`.html`) and stamp the layout as `reportlayout/html`,
   and Pageworks would not pick it up.
   :::

2. In Business Central, use **Tell Me** to open **Report Layouts** and choose **New**.

3. Set **Format Options** to **External**.

   :::tip
   This is the key step. The Word, Excel, and RDLC formats stamp their own MIME types and
   will never be treated as Pageworks. Only the **External** (custom) format derives the
   MIME type from your file's extension.
   :::

4. Upload your `.pageworks` file and finish.

The layout is now stamped `reportlayout/pageworks`, and Pageworks renders it in-tenant.

## Customizing an existing Pageworks layout

The same naming applies if you **copy** an existing Pageworks layout to customize it:
Business Central exports the copy as a `*.pageworks` file, so the copy → edit → re-upload
round-trip keeps the correct MIME type automatically.

## Notes

- Detection is **case-insensitive**, so `.Pageworks` also resolves correctly — but use
  lowercase `.pageworks` for consistency.
- Layouts provided by an extension declare `MimeType = 'reportlayout/pageworks'` explicitly
  in AL, so their on-disk file extension does not matter. The extension-based rule above
  only applies to layouts you upload by hand.
