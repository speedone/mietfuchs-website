import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { guideSchema } from './lib/guide-schema.ts'

// Dateien mit führendem Unterstrich sind Testinhalte und werden nur mit INCLUDE_TEST_CONTENT=1 gebaut.
const pattern = process.env.INCLUDE_TEST_CONTENT === '1' ? '*.mdx' : '[!_]*.mdx'

export const collections = {
  ratgeber: defineCollection({
    loader: glob({ pattern, base: './src/content/ratgeber', generateId: ({ entry }) => entry.replace(/^_/, '').replace(/\.mdx$/, '') }),
    schema: guideSchema,
  }),
}
