import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Flags the standard "fetch data in a useEffect on mount" pattern used
      // throughout this app's list/screen components, which is correct here
      // (not a bug) — kept as a warning rather than disabled outright so it's
      // still visible if a future effect genuinely needs restructuring.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
