# Licensing

This page is for Business Central administrators. It explains how to try Pageworks, how to
license it for production, and how the license check works.

## Try Pageworks in a sandbox

Pageworks is free in sandbox environments. You need no license and no key.

- Printing, Layout Studio preview, and API rendering all work.
- Every document rendered in a sandbox carries a SANDBOX watermark.

Use a sandbox to build and test your layouts. When you are ready, install Pageworks in your
production environment and order a license there.

## How licensing works

- You need one license for each production environment.
- By default, one license covers up to 3 companies in that environment. You can ask for more.
  Extra companies cost an additional fee.
- If you run several legal entities inside one company, each legal entity counts toward the
  license. The license terms describe how.
- You choose which companies use Pageworks. You assign them on the license page (see below).

## Find the licenses list

In Business Central, search for "license" and open **Stefan Maron Consulting Licenses**. The
list shows one row per product that uses the licensing app. Each row shows the status, the
expiry date, and the assigned companies out of the limit. You cannot edit the list.

To work with one license, open its row. The license page opens for that product.

## Order a license

1. Open the license page. Use any of these:
   - In the licenses list, choose the product name, for example **Pageworks**.
   - In Layout Studio, choose **License**.
   - When a render fails with the "not licensed" error, choose the action on that error.

   The page is titled with the product name, for example "Pageworks License".
2. Fill in the order form:
   - Company name
   - Address
   - VAT ID
   - Billing contact (name and email)
   - Purchase order number (optional)
3. Read the terms and select the checkbox to accept them.
4. Choose **OK**.
5. Confirm the order. Business Central shows this text:

   > You are about to place a legally binding order for a 12-month license of Pageworks for
   > this environment. The license renews every year and is invoiced in advance. You can use
   > Pageworks right after the order is placed. For current pricing, see the pricing link. If
   > you are not sure yet, contact us before you order: the contact link.

   The pricing sentence appears only when the product supplies a pricing link. Without a
   contact link, the last sentence reads "If you are not sure yet, contact the publisher
   before you order." If you decline, Pageworks sends nothing and the order form stays open
   with your entries.

The order is binding once you confirm it. Pageworks works as soon as you place it. An
invoice follows afterward. A license that stays unpaid can be suspended. A suspended license
stops Pageworks from rendering in that environment until the license is active again.

Only users with the license admin permission set can order, enter a key, use **Check now**,
or assign companies. Other users can view the license page.

## Enter a key you received by email

If you received a license key by email, enter it instead of placing an order.

1. Open the license page from the licenses list, or from Pageworks (Layout Studio, then
   **License**).
2. Paste the key into the key field.
3. Confirm the entry.

A key belongs to one environment. If you paste it in a second environment, the page tells
you the key is bound to another environment.

To enter a key from the licenses list, search for "license", open **Stefan Maron Consulting
Licenses**, choose the product name, and paste the key into the key field.

## Assign companies

On the license page, assign the companies that use Pageworks. You can assign as many as the
license allows. A company that is not assigned cannot render with Pageworks.

Each company on the license takes one place. You can unassign a company at any time. Deleting
an assigned company also unassigns it.

### Switch a place to another company

When you assign a company to a place that another company used before, that is a switch.

- Assigning a company again that you just unassigned is never a switch. It gets its place back.
- The first switch of a place is always possible. If you assigned the wrong company, unassign
  it and assign the right one.
- After that, the same place can switch again 30 days after its last switch. The license page
  shows the date when a place can switch again.

The license covers a fixed set of companies. It is not meant to be moved between companies
whenever one of them needs to print. If you need more companies, contact us and we raise the
limit on your license.

## License check

Pageworks checks the license with the licensing service once a day. The license page shows
the current status and the reason.

To check right away, choose **Check now** on the license page. For example, use it after an
unpaid license is paid and reactivated.

### What the check confirms

Every answer from the licensing service is signed. Pageworks checks the signature and refuses
an answer that does not pass. A license that has passed its expiry date is not valid, even
if the last check was recent or the service cannot be reached.

The order flow has not changed. You order a license, enter a key, and assign companies the
same way as before.

### If the licensing service cannot be reached

Pageworks keeps working for 48 hours after the last successful check. The same period applies
whenever Pageworks cannot get a verified answer, for example when the license check cannot
be completed or the answer fails the signature check. The license page shows the date when
this period ends. After that date, Pageworks stops rendering until a check succeeds.

The 48 hours are the default. If we set a different period for Pageworks, the license page
shows the date that applies.

The period starts only after a successful check. An environment that has never completed a
check gets no grace period.

During this period, Pageworks shows a notification each time a user prints. It says that the
license could not be confirmed and gives the date when the period ends. The notification has
an action that opens the license page.

We try hard to keep the licensing service available. If the service itself has a problem, we
most likely already know about it from our monitoring and alerts, and we are working on it.
If you see the notification and want to be sure, contact us. Tell us the environment name and
the date of the last successful check from the license page, and we look into it.

If the service answers that the license is expired, suspended, or revoked, Pageworks stops
at once. The grace period does not apply.

### Allow HttpClient Requests

The licensing extension must be allowed to send web requests. If the license page says it
could not reach the licensing service, check this setting:

1. Open **Extension Management**.
2. Select the **SMC Licensing** extension.
3. Open **Configure** and switch on **Allow HttpClient Requests**.
4. Return to the license page and choose **Check now**.

## Copy and rename environments

- **Copy to a sandbox.** The copy does not keep a usable license. The sandbox is free and
  renders with the SANDBOX watermark.
- **Copy to another production environment.** A license belongs to one environment. Contact
  us if you need the license in the new environment.
- **Rename a production environment.** The license no longer matches the environment. The
  license page tells you to contact us. Pageworks keeps working during the grace period (48 hours by
  default) after the last successful check. We move the license to the new name for you. Contact us as soon as
  you plan a rename.

To reach us, use the contact details on the
[Stefan Maron Consulting website](https://stefanmaronconsulting.com/).

## The SMC Licensing extension

The **SMC Licensing** extension installs together with Pageworks. You do not need to install
it yourself. It manages the license page and the license check.

Earlier Pageworks versions used the Spare Brained Licensing extension. You can uninstall
Spare Brained Licensing.

## Privacy

To order, enter a key, or check a license, Pageworks sends data to the licensing service:

- Your tenant ID and environment name
- Your license key
- The order contact details you enter on the order form

Pageworks does not send the content of your documents or your Business Central business data.

### License compliance logging

Pageworks checks that every license answer it receives is genuine. If an answer fails this
check, or Pageworks cannot get a verified answer, it logs a short event that only the
publisher can see. It does not appear in your own telemetry.

The event contains:

- The reason the check failed, as a short fixed word
- The Pageworks app ID
- Your environment name
- Your tenant ID

The event never contains license keys, tokens, or signatures.

We send it to detect tampered or forged license answers, and to notice when the licensing
service has an outage.

For the full details, read the
[privacy statement](https://stefanmaronconsulting.com/privacy-policy/).
