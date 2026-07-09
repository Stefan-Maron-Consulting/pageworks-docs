# Pageworks Docs

Public documentation site for [Pageworks](https://github.com/Stefan-Maron-Consulting/Pageworks),
an in-tenant, deterministic PDF report-rendering engine for Business Central. Built with
[Docusaurus](https://docusaurus.io/) and published to GitHub Pages.

- **Site:** https://stefan-maron-consulting.github.io/pageworks-docs/
- **Bugs / feature requests:** [Issues](https://github.com/Stefan-Maron-Consulting/pageworks-docs/issues)
- **Roadmap:** [Project board](https://github.com/orgs/Stefan-Maron-Consulting/projects) · [Roadmap page](https://stefan-maron-consulting.github.io/pageworks-docs/roadmap)

This repo is maintained by Stefan Maron Consulting; it is not open to external
contributions. See [CLAUDE.md](./CLAUDE.md) for the working rules — most importantly, the
golden rule about what can and cannot be published here. Pageworks ships closed-source;
this repo is a curated, human-reviewed mirror of only the parts of the product that are
safe to publish (the public API contract, the template language, and user/developer
guides).

## Local development

```bash
npm install
npm start        # local dev server with live reload
npm run build     # production build into ./build
npm run serve     # serve the production build locally
```

Deployment to GitHub Pages happens automatically via
[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) on every push to `main`.
