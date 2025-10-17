import pluginJs from '@eslint/js'
import perfectionist from 'eslint-plugin-perfectionist'
import reactPlugin from 'eslint-plugin-react'
import reactCompiler from 'eslint-plugin-react-compiler'
import reactHooks from 'eslint-plugin-react-hooks'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
	pluginJs.configs.recommended,
	...tseslint.configs.strictTypeChecked,
	...tseslint.configs.stylisticTypeChecked,
	reactPlugin.configs.flat.recommended,
	reactPlugin.configs.flat['jsx-runtime'],
	reactCompiler.configs.recommended,
	...reactHooks.configs['recommended-latest'],
	eslintPluginUnicorn.configs.all,
	perfectionist.configs['recommended-natural'],
	{
		ignores: [
			'ios',
			'android',
			'.expo',
			'node_modules',
			'dist',
			'build',
			'public',
			'expo-env.d.ts',
			'playwright-report',
			'src/lib/locales/',
			'worker-configuration.d.ts',
		],
	},
	{
		languageOptions: {
			globals: {
				...globals.builtin,
				...globals.browser,
			},
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
				ecmaVersion: 'latest',
				projectService: true,
				sourceType: 'module',
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			'@typescript-eslint/consistent-type-definitions': ['error', 'type'],
			'@typescript-eslint/consistent-type-imports': [
				'warn',
				{ fixStyle: 'separate-type-imports', prefer: 'type-imports' },
			],
			'@typescript-eslint/method-signature-style': ['error', 'property'],
			'@typescript-eslint/no-confusing-void-expression': 'off',
			'@typescript-eslint/no-misused-promises': [
				'error',
				{ checksVoidReturn: false },
			],
			'@typescript-eslint/no-require-imports': 'off',
			'@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
			'@typescript-eslint/no-unnecessary-qualifier': 'error',
			'@typescript-eslint/no-unnecessary-type-arguments': 'error',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					args: 'all',
					argsIgnorePattern: '^_',
					caughtErrors: 'all',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
					ignoreRestSiblings: true,
					varsIgnorePattern: '^_',
				},
			],
			'@typescript-eslint/non-nullable-type-assertion-style': 'off',
			'@typescript-eslint/prefer-for-of': 'error',
			'@typescript-eslint/prefer-function-type': 'error',
			'@typescript-eslint/prefer-includes': 'error',
			'@typescript-eslint/prefer-nullish-coalescing': [
				'error',
				{
					ignorePrimitives: {
						boolean: true,
						number: true,
						string: true,
					},
				},
			],
			'@typescript-eslint/prefer-optional-chain': 'error',
			'@typescript-eslint/prefer-reduce-type-parameter': 'error',
			'@typescript-eslint/prefer-string-starts-ends-with': 'error',
			'@typescript-eslint/restrict-template-expressions': [
				'error',
				{ allowNumber: true },
			],
			'@typescript-eslint/switch-exhaustiveness-check': 'off',
			'@typescript-eslint/unbound-method': 'off',

			// Core JavaScript rules for better code quality
			'arrow-body-style': ['warn', 'as-needed'],
			curly: ['error', 'all'],
			'default-case-last': 'error',
			'default-param-last': 'error',
			'dot-notation': 'error',
			eqeqeq: ['error', 'always', { null: 'ignore' }],
			'func-style': ['warn', 'declaration', { allowArrowFunctions: true }],
			'grouped-accessor-pairs': ['error', 'getBeforeSet'],
			'logical-assignment-operators': [
				'error',
				'always',
				{ enforceForIfStatements: true },
			],
			'max-params': ['error', 5],
			'no-console': 'warn',
			'no-else-return': ['error', { allowElseIf: false }],
			'no-extra-boolean-cast': ['error', { enforceForInnerExpressions: true }],
			'no-implicit-coercion': 'error',
			'no-inner-declarations': 'error',
			'no-invalid-this': 'error',
			'no-lonely-if': 'error',
			'no-negated-condition': 'error',
			'no-restricted-imports': [
				'error',
				{ paths: [{ importNames: ['default'], name: 'react' }] },
			],
			'no-self-compare': 'error',
			'no-unneeded-ternary': 'error',
			'no-useless-assignment': 'error',
			'no-useless-computed-key': 'off',
			'no-useless-concat': 'error',
			'no-useless-rename': 'error',
			'no-useless-return': 'error',
			'no-var': 'error',
			'object-shorthand': 'error',
			'operator-assignment': ['error', 'always'],
			'perfectionist/sort-imports': [
				'warn',
				{
					customGroups: {
						type: {
							node: ['node:*'],
							react: ['^react$', '^react-dom$', '^react-native$'],
						},
						value: {
							node: ['node:*'],
							react: ['^react$', '^react-dom$', '^react-native$'],
						},
					},
					environment: 'node',
					groups: [
						['node', 'react', 'builtin'],
						['builtin-type'],

						'external',

						'type',

						'internal',

						'internal-type',

						['parent', 'sibling', 'index'],

						['parent-type', 'sibling-type', 'index-type'],

						'object',

						'style',

						'unknown',
					],
					ignoreCase: true,
					internalPattern: ['^@/.+', '^~/..+'],
					maxLineLength: undefined,
					newlinesBetween: 'always',
					order: 'asc',
					type: 'natural',
				},
			],
			'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
			'prefer-const': ['error', { destructuring: 'all' }],
			'prefer-destructuring': [
				'error',
				{
					AssignmentExpression: { array: false, object: false },
					VariableDeclarator: { array: false, object: true },
				},
				{ enforceForRenamedProperties: false },
			],
			'prefer-exponentiation-operator': 'error',
			'prefer-object-spread': 'error',
			'prefer-rest-params': 'error',
			'prefer-spread': 'error',
			'prefer-template': 'error',
			'react-hooks/exhaustive-deps': [
				'error',
				{
					additionalHooks:
						'(useAnimatedStyle|useDerivedValue|useAnimatedProps)',
				},
			],
			'react/jsx-curly-brace-presence': ['warn', { props: 'never' }],
			'react/jsx-no-useless-fragment': 'error',
			'react/self-closing-comp': 'warn',
			'require-atomic-updates': 'error',
			'unicorn/consistent-destructuring': 'off',
			'unicorn/filename-case': 'off', // Change when JSX convention is available https://github.com/sindresorhus/eslint-plugin-unicorn/issues/203
			'unicorn/no-array-reduce': 'off', // Enable later
			'unicorn/no-nested-ternary': 'off', // Enable later
			'unicorn/no-null': 'off',
			'unicorn/prefer-module': 'off',
			'unicorn/prefer-ternary': 'off',
			'unicorn/prevent-abbreviations': [
				'warn',
				{
					allowList: {
						Env: true,
						Props: true,
						props: true,
						ref: true,
						Ref: true,
						Refs: true,
						refs: true,
						utils: true,
					},
				},
			],
			'unicorn/switch-case-braces': 'off',
			'unicorn/template-indent': 'off',
			yoda: 'error',
		},
		settings: {
			componentWrapperFunctions: ['observer'],
			react: { version: 'detect' },
		},
	},
	{
		files: ['**/*.js', '**/*.jsx', '**/*.mjs'],
		...tseslint.configs.disableTypeChecked,
	},
	{
		files: ['workers/**/*.ts'],
		languageOptions: {
			globals: {
				...globals.serviceworker,
			},
		},
	},
])
