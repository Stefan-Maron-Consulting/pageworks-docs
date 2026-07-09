// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Pageworks',
  tagline: 'In-tenant, deterministic PDF report rendering for Business Central',
  favicon: 'img/favicon.png',

  future: {
    v4: true,
  },

  url: 'https://pageworks.stefanmaronconsulting.com',
  baseUrl: '/',

  organizationName: 'Stefan-Maron-Consulting',
  projectName: 'pageworks-docs',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          editUrl:
            'https://github.com/Stefan-Maron-Consulting/pageworks-docs/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/social-card.png',
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Pageworks',
        logo: {
          alt: 'Pageworks logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docsSidebar',
            position: 'left',
            label: 'Docs',
          },
          {
            to: '/roadmap',
            label: 'Roadmap',
            position: 'left',
          },
          {
            href: 'https://github.com/Stefan-Maron-Consulting/pageworks-docs/issues',
            label: 'Issues',
            position: 'right',
          },
          {
            href: 'https://github.com/Stefan-Maron-Consulting/pageworks-docs',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {label: 'Getting started', to: '/getting-started/onboarding'},
              {label: 'Developer reference', to: '/reference/developer-reference'},
              {label: 'Template language', to: '/reference/template-language'},
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Report a bug',
                href: 'https://github.com/Stefan-Maron-Consulting/pageworks-docs/issues/new?labels=bug',
              },
              {
                label: 'Request a feature',
                href: 'https://github.com/Stefan-Maron-Consulting/pageworks-docs/issues/new?labels=feature',
              },
              {
                label: 'Roadmap board',
                href: 'https://github.com/orgs/Stefan-Maron-Consulting/projects/1',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/Stefan-Maron-Consulting/pageworks-docs',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Stefan Maron Consulting. Pageworks is closed-source; this site documents its public contract.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
