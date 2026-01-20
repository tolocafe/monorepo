/* eslint-disable no-undef */
import { getBabelOutputPlugin } from '@rollup/plugin-babel'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
	build: {
		commonjsOptions: {
			transformMixedEsModules: true,
		},
		lib: {
			entry: './src/js/index.tsx',
			fileName: 'bundle',
			formats: ['cjs'],
			name: 'bundle',
		},
		rollupOptions: {
			output: {
				dir: './',
				plugins: [
					getBabelOutputPlugin({
						presets: [
							[
								'@babel/preset-env',
								{
									targets: {
										browsers: 'since 2017',
									},
								},
							],
						],
					}),
				],
			},
		},
	},
	define: {
		'process.env': process.env,
	},
	plugins: [
		cssInjectedByJsPlugin(),
		mkcert(),
		react({
			include: '**/*.{jsx}',
		}),
	],
	resolve: {
		alias: {
			os: 'os-browserify/browser',
		},
	},
})
