# Telemetry — Routing Pageworks Events to Your Own Application Insights

This document is for a **tenant administrator** who wants Pageworks's extension
telemetry to flow into their own Azure Application Insights (AI) resource, rather than
(or in addition to) wherever it flows today.

> Pageworks's custom trace events are emitted with `TelemetryScope::All`. Per
> Microsoft's own documentation on `TelemetryScope` (cited below), events logged at that
> scope go to **both** the Application Insights account configured in the extension's
> own `app.json` (publisher-controlled) **and** the environment-level Application
> Insights resource a tenant admin configures in the Business Central admin center.
> **This means a tenant admin has a supported, working path to route Pageworks's events
> into their own AI resource** — see §3 for the admin procedure.

## 1. What the engine emits

Pageworks emits standard Business Central extension telemetry — Application Insights
`traces`, written via the platform's `Session.LogMessage` API. There is no custom
transport: every event is a standard AL `Session.LogMessage` call, so any tooling that
already understands BC telemetry (Log Analytics, etc.) understands these events too.

| Event ID | Signals | Verbosity | Key custom dimensions |
|---|---|---|---|
| `LF0001` | A report render completed successfully. | Normal | `reportId`, `layoutName`, `durationMs`, `pageCount` |
| `LF0002` | A report render failed. | Error | `reportId`, `layoutName`, `durationMs`, `errorCode` (catalog code from [Error & finding code catalog](/reference/error-codes)), `findingLocation` (the failing element path, tag name, or column name — never a dataset value), `findingCount` |
| `LF0003` | A validation run completed (report or standalone partial). | Normal | `reportId` (0 if none), `findingCount`, `errorCount` |
| `LF0004` | An extension registered/updated its baseline partials via `PageworksRegistry`. | Normal | `appId` (caller's app id, platform-supplied — never caller-controlled), `prefix`, `partialCount` |
| `LF0005` | An extension registered/updated a baseline image asset via `PageworksRegistry.RegisterImage`. | Normal | `appId`, `prefix`, `imageCount` |
| `LF0006` | An extension registered/updated a baseline font asset via `PageworksRegistry.RegisterFont`. | Normal | `appId`, `prefix`, `fontCount` |
| `LF0007` | The install-time self-test ran. | Normal | `SelfTestPassed` |
| `LF0009` | An extension registered/updated a baseline stylesheet via `PageworksRegistry.RegisterStyleSheet`. | Normal | `appId`, `prefix`, `styleSheetCount` |

All events use `DataClassification::SystemMetadata` and `TelemetryScope::All`. `All` is
deliberately chosen — over the narrower `ExtensionPublisher` — so that a customer can
observe the app's telemetry in their own environment's Application Insights, not only in
the publisher's. Dimensions carry only ids, names, counts, and durations — **never
document content or business data**.

## 2. Two AI destinations BC actually supports

Per Microsoft Learn ([Setting up telemetry in an app/extension](https://learn.microsoft.com/dynamics365/business-central/dev-itpro/developer/devenv-application-insights-for-extensions),
[Turn environment telemetry on or off](https://learn.microsoft.com/dynamics365/business-central/dev-itpro/administration/telemetry-enable-application-insights),
and the [`TelemetryScope` option type](https://learn.microsoft.com/dynamics365/business-central/dev-itpro/developer/methods-auto/telemetryscope/telemetryscope-option) reference), Business Central telemetry has exactly two
independently-configured AI destinations:

1. **Per-extension (publisher-configured, build-time).** The extension's own `app.json`
   carries `"applicationInsightsConnectionString"`. This is set by whoever builds and
   ships the app and is baked into the `.app` package. A tenant admin installing the app
   cannot change it; there is no Extension Management page field for it. This is what
   `TelemetryScope::ExtensionPublisher` routes to.
2. **Per-environment (tenant-admin-configured, runtime).** In the Business Central
   admin center, under **Environments → [environment] → Application Insights Key**,
   a tenant admin sets the connection string (or, on older versions, instrumentation
   key) of *their own* AI resource. This is the one AI destination genuinely under
   tenant admin control. It receives all standard platform telemetry for that
   environment automatically, **plus** any custom `Session.LogMessage` events emitted
   with `TelemetryScope::All` — but **not** events emitted with `TelemetryScope::ExtensionPublisher`.

Because Pageworks's `LogMessage` calls all use scope `All`, they reach **both**
destinations: the publisher's own AI account (if one is configured) and the tenant
admin's own environment-level Application Insights resource. **A tenant admin's own
environment-level Application Insights key does pick up Pageworks's events**, once
they've configured it per §3.

## 3. Routing to your own Application Insights — admin steps

Because the engine emits at `TelemetryScope::All`, the only lever a tenant admin needs
is environment-level telemetry. Setting it up:

1. Create an Azure Application Insights resource if you don't have one ([Create an
   Application Insights resource](https://learn.microsoft.com/azure/azure-monitor/app/create-new-resource)),
   and copy its **connection string** from the resource's Overview page in the Azure
   portal. Use the connection string, not the (deprecated) instrumentation key —
   Microsoft ended technical support for instrumentation-key-based ingestion on
   31 March 2025.
2. In the Business Central admin center, go to **Environments**, select the target
   environment, and open the **Application Insights Key** setting (shown as **Define**
   if not yet configured).
3. Enable Application Insights and paste the connection string into the
   **Instrumentation Key** / connection string field, then **Save**. Applying this
   setting restarts the environment — schedule it outside business hours.
4. This makes the environment emit its standard platform telemetry to your AI resource,
   **and** — because Pageworks's LF-series events are logged with `TelemetryScope::All`
   (§1, §2) — also causes those events to appear there. No further configuration is
   required.

## 4. Confirming events arrive

Once environment-level telemetry is configured (§3):

1. Trigger at least one render (success and, ideally, one deliberate failure) against
   the target environment so `LF0001`/`LF0002` fire, and one validation run so `LF0003`
   fires.
2. In the Azure portal, open the target AI resource's **Logs** (Log Analytics) blade
   and run a KQL query such as:

   ```kql
   traces
   | where timestamp > ago(1h)
   | where customDimensions.eventId startswith "LF"
   | project timestamp, message, eventId = customDimensions.eventId,
       reportId = customDimensions.reportId, durationMs = customDimensions.durationMs
   | order by timestamp desc
   ```

   Note: the BC platform prefixes `eventId` with `al` when emitting to Application
   Insights, so the actual `customDimensions` value may read `alLF0001` rather than
   `LF0001` — check both forms if the first query returns nothing.
3. Confirm at least one row per triggered event appears with the expected custom
   dimensions.

## 5. Closed-source note

Pageworks ships closed-source. This does not affect standard platform telemetry
routing — Application Insights connection strings and `TelemetryScope` are platform
features that operate independently of AL source visibility; a closed-source extension
emits and routes telemetry exactly like an open one.
