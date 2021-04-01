/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
    title: 'TS Bitcoin',
    tagline: 'TypeScript library for Bitcoin SV',
    url: 'https://ts-bitcoin.github.io',
    baseUrl: '/ts-bitcoin/',
    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',
    favicon: 'img/favicon.ico',
    organizationName: 'ts-bitcoin', // Usually your GitHub org/user name.
    projectName: 'ts-bitcoin', // Usually your repo name.
    themeConfig: {
        navbar: {
            logo: {
                alt: 'TS Bitcoin Logo',
                src: 'img/logo.svg',
            },
            items: [
                {
                    to: 'docs/',
                    activeBasePath: 'docs',
                    label: 'Docs',
                    position: 'left',
                },
                // { to: 'blog', label: 'Blog', position: 'left' },
                {
                    href: 'https://github.com/ts-bitcoin/ts-bitcoin',
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
                        {
                            label: 'Getting Started',
                            to: 'docs/',
                        },
                        {
                            label: 'Guides',
                            to: 'docs/guides/addresses',
                        },
                        {
                            label: 'API',
                            to: 'docs/api/modules',
                        },
                    ],
                },
                // {
                //     title: 'Community',
                //     items: [
                //         {
                //             label: 'Stack Overflow',
                //             href: 'https://stackoverflow.com/questions/tagged/docusaurus',
                //         },
                //         {
                //             label: 'Discord',
                //             href: 'https://discordapp.com/invite/docusaurus',
                //         },
                //         {
                //             label: 'Twitter',
                //             href: 'https://twitter.com/docusaurus',
                //         },
                //     ],
                // },
                {
                    title: 'Links',
                    items: [
                        // {
                        //     label: 'Blog',
                        //     to: 'blog',
                        // },
                        {
                            label: 'GitHub',
                            href: 'https://github.com/ts-bitcoin/ts-bitcoin',
                        },
                    ],
                },
            ],
            copyright: `Copyright © ${new Date().getFullYear()} TS Bitcoin`,
        },
        prism: {
            theme: require('prism-react-renderer/themes/github'),
            darkTheme: require('prism-react-renderer/themes/oceanicNext'),
        },
        sidebarCollapsible: true,
    },
    presets: [
        [
            '@docusaurus/preset-classic',
            {
                docs: {
                    sidebarPath: require.resolve('./sidebars.js'),
                    // Please change this to your repo.
                    editUrl: 'https://github.com/ts-bitcoin/ts-bitcoin/tree/master/docs',
                },
                // blog: {
                //     showReadingTime: true,
                //     // Please change this to your repo.
                //     editUrl: 'https://github.com/facebook/docusaurus/edit/master/website/blog/',
                // },
                theme: {
                    customCss: require.resolve('./src/css/custom.css'),
                },
            },
        ],
    ],
    plugins: [
        [
            'docusaurus-plugin-typedoc',

            // Plugin / TypeDoc options
            {
                entryPoints: ['../src/index.ts'],
                tsconfig: '../tsconfig.json',
                allReflectionsHaveOwnDocument: false,
                sidebar: {
                    sidebarFile: 'typedoc-sidebar.js',
                    fullNames: false,
                },
            },
        ],
    ],
}
