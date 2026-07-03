import { defineConfig } from 'vite-plus';

export default defineConfig({
  lint: {
    jsPlugins: ['eslint-plugin-astro'],
    overrides: [
      {
        files: ['**/*.astro'],
        jsPlugins: ['eslint-plugin-astro'],
        rules: {
          'astro/no-set-html-directive': 'error'
        }
      }
    ]
  },
  fmt: {
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'none',
    printWidth: 100,
    sortPackageJson: false,
    ignorePatterns: ['pnpm-lock.yaml']
  },
  staged: {
    '*': 'vp check --fix'
  }
});
