import { cloudflare } from '@cloudflare/vite-plugin'
import { reactRouter } from '@react-router/dev/vite'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// Remove SSR externals from config to ensure compatibility with Cloudflare Workers
function removeExternals<T>(config: T): T {
	if (!config || typeof config !== 'object') return config
	const c = config as Record<string, unknown>
	// Remove SSR externals that conflict with Cloudflare Workers
	const envs = c.environments as Record<string, unknown> | undefined
	const ssrEnv = envs?.ssr as Record<string, unknown> | undefined
	const resolve = ssrEnv?.resolve as Record<string, unknown> | undefined
	if (resolve?.external) {
		delete resolve.external
	}
	const ssr = c.ssr as Record<string, unknown> | undefined
	if (ssr?.external) {
		delete ssr.external
	}
	return config
}

// Wrap vanilla-extract plugin to prevent SSR externalization for Cloudflare Workers
function vanillaExtractCloudflare(): Plugin[] {
	const vePlugins = vanillaExtractPlugin()
	const plugins = Array.isArray(vePlugins) ? vePlugins : [vePlugins]

	return plugins.map((plugin): Plugin => {
		if (!plugin.config) return plugin

		const originalConfig = plugin.config as
			| ((...args: unknown[]) => unknown)
			| { handler: (...args: unknown[]) => unknown }

		// Handle function hook format
		if (typeof originalConfig === 'function') {
			return {
				...plugin,
				config(...args: unknown[]) {
					const result = originalConfig.apply(plugin, args)
					if (result instanceof Promise) {
						return result.then(removeExternals)
					}
					return removeExternals(result)
				},
			} as Plugin
		}

		// Handle object hook format
		const { handler } = originalConfig
		return {
			...plugin,
			config: {
				...originalConfig,
				handler(...args: unknown[]) {
					const result = handler.apply(plugin, args)
					if (result instanceof Promise) {
						return result.then(removeExternals)
					}
					return removeExternals(result)
				},
			},
		} as Plugin
	})
}

export default defineConfig({
	build: {
		rollupOptions: {
			external: ['virtual:react-router/server-build'],
		},
	},
	plugins: [
		cloudflare({ viteEnvironment: { name: 'ssr' } }),
		vanillaExtractCloudflare(),
		reactRouter(),
		tsconfigPaths({ projects: ['./tsconfig.json'] }),
	],
	ssr: {
		noExternal: ['posthog-js', '@posthog/react'],
	},
})
