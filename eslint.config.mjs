import nextTypescript from 'eslint-config-next/typescript'

export default [
  ...nextTypescript,
  {
    ignores: ['src/payload-types.ts', 'src/migrations/**'],
  },
]
