import * as path from 'path'
import { Configuration } from 'webpack'
const EsmWebpackPlugin = require('@purtuga/esm-webpack-plugin')

const config: Configuration = {
    entry: './src/index.ts',
    output: {
        filename: 'bundle.esm.js',
        library: 'Bitcoin',
        libraryTarget: 'var',
        path: path.resolve(__dirname, 'lib'),
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            onlyCompileBundledFiles: true,
                            compilerOptions: {
                                module: 'esnext',
                                moduleResolution: 'node',
                            },
                        },
                    },
                ],
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    node: {
        fs: 'empty',
    },
    plugins: [new EsmWebpackPlugin()],
    performance: {
        hints: false,
        maxEntrypointSize: 360000,
        maxAssetSize: 360000,
    },
}

export default config
