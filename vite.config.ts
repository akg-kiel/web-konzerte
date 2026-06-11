import { defineConfig } from 'vite-plus';

export default defineConfig({
  lint: {
    plugins: ['oxc', 'typescript', 'unicorn', 'react', 'jsx-a11y'],
    jsPlugins: [
      'eslint-plugin-astro',
      {
        name: 'vite-plus',
        specifier: 'vite-plus/oxlint-plugin'
      }
    ],
    categories: {
      correctness: 'warn'
    },
    env: {
      builtin: true
    },
    ignorePatterns: ['dist', '.astro', 'node_modules', '*.astro.ts'],
    rules: {
      'constructor-super': 'error',
      'for-direction': 'error',
      'getter-return': 'error',
      'no-async-promise-executor': 'error',
      'no-case-declarations': 'error',
      'no-class-assign': 'error',
      'no-compare-neg-zero': 'error',
      'no-cond-assign': 'error',
      'no-const-assign': 'error',
      'no-constant-binary-expression': 'error',
      'no-constant-condition': 'error',
      'no-control-regex': 'error',
      'no-debugger': 'error',
      'no-delete-var': 'error',
      'no-dupe-class-members': 'error',
      'no-dupe-else-if': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-empty': 'error',
      'no-empty-character-class': 'error',
      'no-empty-pattern': 'error',
      'no-empty-static-block': 'error',
      'no-ex-assign': 'error',
      'no-extra-boolean-cast': 'error',
      'no-fallthrough': 'error',
      'no-func-assign': 'error',
      'no-global-assign': 'error',
      'no-import-assign': 'error',
      'no-invalid-regexp': 'error',
      'no-irregular-whitespace': 'error',
      'no-loss-of-precision': 'error',
      'no-misleading-character-class': 'error',
      'no-new-native-nonconstructor': 'error',
      'no-nonoctal-decimal-escape': 'error',
      'no-obj-calls': 'error',
      'no-prototype-builtins': 'error',
      'no-redeclare': 'error',
      'no-regex-spaces': 'error',
      'no-self-assign': 'error',
      'no-setter-return': 'error',
      'no-shadow-restricted-names': 'error',
      'no-sparse-arrays': 'error',
      'no-this-before-super': 'error',
      'no-unassigned-vars': 'error',
      'no-undef': 'error',
      'no-unexpected-multiline': 'error',
      'no-unreachable': 'error',
      'no-unsafe-finally': 'error',
      'no-unsafe-negation': 'error',
      'no-unsafe-optional-chaining': 'error',
      'no-unused-labels': 'error',
      'no-unused-private-class-members': 'error',
      'no-unused-vars': 'error',
      'no-useless-assignment': 'error',
      'no-useless-backreference': 'error',
      'no-useless-catch': 'error',
      'no-useless-escape': 'error',
      'no-with': 'error',
      'preserve-caught-error': 'error',
      'require-yield': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/autocomplete-valid': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/control-has-associated-label': [
        'off',
        {
          ignoreElements: ['audio', 'canvas', 'embed', 'input', 'textarea', 'tr', 'video'],
          ignoreRoles: [
            'grid',
            'listbox',
            'menu',
            'menubar',
            'radiogroup',
            'row',
            'tablist',
            'toolbar',
            'tree',
            'treegrid'
          ],
          includeRoles: ['alert', 'dialog']
        }
      ],
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/iframe-has-title': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/interactive-supports-focus': [
        'error',
        {
          tabbable: ['button', 'checkbox', 'link', 'searchbox', 'spinbutton', 'switch', 'textbox']
        }
      ],
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/media-has-caption': 'error',
      'jsx-a11y/mouse-events-have-key-events': 'error',
      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/no-autofocus': 'error',
      'jsx-a11y/no-distracting-elements': 'error',
      'jsx-a11y/no-interactive-element-to-noninteractive-role': [
        'error',
        {
          tr: ['none', 'presentation'],
          canvas: ['img']
        }
      ],
      'jsx-a11y/no-noninteractive-element-interactions': [
        'error',
        {
          handlers: [
            'onClick',
            'onError',
            'onLoad',
            'onMouseDown',
            'onMouseUp',
            'onKeyPress',
            'onKeyDown',
            'onKeyUp'
          ],
          alert: ['onKeyUp', 'onKeyDown', 'onKeyPress'],
          body: ['onError', 'onLoad'],
          dialog: ['onKeyUp', 'onKeyDown', 'onKeyPress'],
          iframe: ['onError', 'onLoad'],
          img: ['onError', 'onLoad']
        }
      ],
      'jsx-a11y/no-noninteractive-element-to-interactive-role': [
        'error',
        {
          ul: ['listbox', 'menu', 'menubar', 'radiogroup', 'tablist', 'tree', 'treegrid'],
          ol: ['listbox', 'menu', 'menubar', 'radiogroup', 'tablist', 'tree', 'treegrid'],
          li: ['menuitem', 'menuitemradio', 'menuitemcheckbox', 'option', 'row', 'tab', 'treeitem'],
          table: ['grid'],
          td: ['gridcell'],
          fieldset: ['radiogroup', 'presentation']
        }
      ],
      'jsx-a11y/no-noninteractive-tabindex': [
        'error',
        {
          tags: [],
          roles: ['tabpanel'],
          allowExpressionValues: true
        }
      ],
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/no-static-element-interactions': [
        'error',
        {
          allowExpressionValues: true,
          handlers: ['onClick', 'onMouseDown', 'onMouseUp', 'onKeyPress', 'onKeyDown', 'onKeyUp']
        }
      ],
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/scope': 'error',
      'jsx-a11y/tabindex-no-positive': 'error',
      'astro/missing-client-only-directive-value': 'error',
      'astro/no-conflict-set-directives': 'error',
      'astro/no-deprecated-astro-canonicalurl': 'error',
      'astro/no-deprecated-astro-fetchcontent': 'error',
      'astro/no-deprecated-astro-resolve': 'error',
      'astro/no-deprecated-getentrybyslug': 'error',
      'astro/no-unused-define-vars-in-style': 'error',
      'astro/valid-compile': 'error',
      'vite-plus/prefer-vite-plus-imports': 'error'
    },
    overrides: [
      {
        files: ['**/*.{js,jsx,ts,tsx}'],
        rules: {
          'no-unused-vars': [
            'error',
            {
              argsIgnorePattern: '^_'
            }
          ],
          'react/react-in-jsx-scope': 'off',
          'no-console': [
            'warn',
            {
              allow: ['warn', 'error']
            }
          ],
          'react/rules-of-hooks': 'error',
          'react/exhaustive-deps': 'warn',
          'react/only-export-components': [
            'warn',
            {
              allowConstantExport: true
            }
          ],
          'typescript/no-explicit-any': 'error'
        }
      },
      {
        files: ['src/env.d.ts'],
        rules: {
          'typescript/triple-slash-reference': 'off'
        }
      },
      {
        files: ['*.astro', '**/*.astro'],
        globals: {
          Fragment: 'readonly'
        },
        env: {
          astro: true,
          node: true
        }
      },
      {
        files: ['**/*.astro/*.js', '*.astro/*.js', '**/*.astro/*.ts', '*.astro/*.ts'],
        rules: {},
        jsPlugins: [],
        globals: {
          AudioWorkletGlobalScope: 'readonly',
          AudioWorkletProcessor: 'readonly',
          currentFrame: 'readonly',
          currentTime: 'readonly',
          registerProcessor: 'readonly',
          sampleRate: 'readonly',
          WorkletGlobalScope: 'readonly'
        },
        env: {
          browser: true
        }
      },
      {
        files: ['**/*.astro'],
        rules: {
          'astro/no-set-html-directive': 'error'
        },
        jsPlugins: ['eslint-plugin-astro']
      }
    ],
    options: {
      typeAware: true,
      typeCheck: true
    }
  },
  fmt: {
    sortTailwindcss: {},
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'none',
    printWidth: 100,
    sortPackageJson: false,
    ignorePatterns: [
      'node_modules',
      'dist',
      '.astro',
      '.git',
      '*.log',
      '.env',
      '.env.*',
      '.bun-version',
      'bun.lock'
    ]
  }
});
