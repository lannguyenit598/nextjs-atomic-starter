import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'
import storybook from 'eslint-plugin-storybook'

// Dependency rules (docs/ai/rules/architecture.md R-FEAT-1…3). Lower layers must not import higher layers.
const noFeatureImports = {
  group: ['@/features/*', '@/app/*'],
  message: 'Shared UI must not depend on features or routes. Pass data in through props.',
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  { files: ['src/**'], rules: { 'import/no-cycle': 'error' } },
  {
    files: ['src/components/**', 'src/lib/**', 'src/hooks/**'],
    rules: { 'no-restricted-imports': ['error', { patterns: [noFeatureImports] }] },
  },
  {
    files: ['src/features/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/app/*'], message: 'Features must not import from routes.' },
            {
              group: ['@/features/*'],
              message:
                'Use relative imports inside a feature; never import another feature (R-FEAT-2). Shared code belongs in components/ or lib/.',
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'playwright-report/**',
    'test-results/**',
    'storybook-static/**',
    'next-env.d.ts',
  ]),
  ...storybook.configs['flat/recommended'],
])

export default eslintConfig
