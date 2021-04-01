const typedocSidebar = require('./typedoc-sidebar.js')
module.exports = {
    docs: [
        'getting-started',
        {
            type: 'category',
            label: 'Guides',
            collapsed: false,
            items: [
                'guides/big-numbers',
                'guides/points',
                'guides/hash-functions',
                'guides/base58',
                'guides/priv-keys',
                'guides/pub-keys',
                'guides/addresses',
                'guides/ecdsa',
                'guides/bsm',
                'guides/sigs',
                'guides/hd-priv-keys',
                'guides/hd-pub-keys',
                'guides/mnemonics',
                'guides/script',
            ],
        },
        {
            type: 'category',
            label: 'API',
            items: typedocSidebar.slice(1, typedocSidebar.length),
        },
    ],
}
