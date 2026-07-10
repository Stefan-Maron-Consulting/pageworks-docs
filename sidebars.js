// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting started',
      items: ['getting-started/onboarding'],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/developer-reference',
        'reference/template-language',
        'reference/error-codes',
        'reference/api-stability',
        'reference/versioning-policy',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/creating-layouts-in-the-client',
        'guides/using-the-insert-picker',
        'guides/telemetry',
      ],
    },
  ],
};

export default sidebars;
