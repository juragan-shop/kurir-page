import { type SchemaTypeDefinition } from 'sanity'
import { fish } from './fish/fish'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [fish],
}
