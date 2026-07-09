# Versioning Policy — Pageworks

How the app's four-part version number is used to signal what changed and how a fix
reaches an already-released tenant.

## Version scheme

BC apps carry a four-part version, `Major.Minor.Build.Revision` (`app.json` `version`,
currently `0.8.1.0`). Public API stability — what a dependency app can rely on not
breaking — is tied exclusively to the **Major** component; see
`ApiStabilityPromise.md` for exactly what that promise covers.

## Pre-1.0

The current `0.x` line is pre-release. `Major = 0` carries no stability promise at all
— any part of the app, including the surface that will later become public, may change
between `0.x` builds without notice. The first AppSource-listed build is `1.0.0.0`.

There is no retroactive reclassification of prior `0.x` versions (per the spec's
Assumptions) — a `0.x` build is not renumbered or backfilled into the 1.0 stability
story after the fact once 1.0 ships.

## Release classes

- **Major (`X.0.0.0`)** — a breaking change to the public API surface (as defined in
  `ApiStabilityPromise.md`). Requires the deprecation/notice process documented there
  before the breaking change can ship; a major bump is the *conclusion* of that process,
  not a way to skip it.
- **Minor (`x.Y.0.0`)** — additive, backward-compatible changes: new features, or new
  public members (new procedures, new overloads, new objects) that do not break any
  existing consumer of the current major version.
- **Hotfix (`x.y.Z.R`)** — a defect fix that neither adds nor breaks public surface.
  Increment Build (`Z`); Revision (`R`) is reserved for rebuilds/repackaging of an
  already-shipped Build (e.g. a resubmission with no source change).

## How a hotfix reaches already-released tenants

- **SaaS tenants**: AppSource auto-update delivers the latest Build within the tenant's
  current Major.Minor automatically — no action required from the customer.
- **On-premises / sandbox consumers**: receive the rebuilt `.app` manually (there is no
  auto-update channel outside AppSource-managed SaaS tenants).

A hotfix never requires the customer to take a major or minor upgrade to receive it —
that is the entire point of keeping Build reserved for fixes only.

## Cadence and ownership

The version bump that ships a given feature or fix follows the release classes above —
the shipped version number is a reliable, checkable signal of what kind of change it
contains: no feature ships under a hotfix Build, no breaking change ships under a Minor.
Cutting a release is owned by the product owner (Stefan Maron Consulting).
