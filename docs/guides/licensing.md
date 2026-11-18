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

## Order a license

1. Open the license page from Pageworks. Use either of these:
   - In Layout Studio, choose **License**.
   - When a render fails with the "not licensed" error, choose the action on that error.
2. Fill in the order form:
   - Company name
   - Address
   - VAT ID
   - Billing contact (name and email)
   - Purchase order number (optional)
3. Read the terms and select the checkbox to accept them.
4. Place the order.

The order is binding. Pageworks works as soon as you place it. An invoice follows afterward.
A license that stays unpaid can be suspended. A suspended license stops Pageworks from
rendering in that environment until the license is active again.

Only users with the license admin permission set can order, enter a key, use **Check now**,
or assign companies. Other users can view the license page.

## Enter a key you received by email

If you received a license key by email, enter it instead of placing an order.

1. Open the license page from Pageworks (Layout Studio, then **License**).
2. Paste the key into the key field.
3. Confirm the entry.

A key belongs to one environment. If you paste it in a second environment, the page tells
you the key is bound to another environment.

If you open the license page from the Business Central search instead of from Pageworks, you
can view the status but you cannot order or enter a key. Open the page from Pageworks to do
either.

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

### If the licensing service cannot be reached

Pageworks keeps working for up to 7 days after the last successful check. The license page
shows the date when this period ends. After that date, Pageworks stops rendering until a
check succeeds.

During these 7 days, Pageworks shows a notification each time a user prints. It says that
the license could not be confirmed and gives the date when the period ends.

We try hard to keep the licensing service available. If the service itself has a problem, we
most likely already know about it from our monitoring and alerts, and we are working on it.
If you see the notification and want to be sure, contact us. Tell us the environment name and
the date of the last successful check from the license page, and we look into it.

If the service answers that the license is expired, suspended, or revoked, Pageworks stops
at once. The 7-day period does not apply.

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
  license page tells you to contact us. Pageworks keeps working for up to 7 days after the
  last successful check. We move the license to the new name for you. Contact us as soon as
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

For the full details, read the
[privacy statement](https://stefanmaronconsulting.com/privacy-policy/).
