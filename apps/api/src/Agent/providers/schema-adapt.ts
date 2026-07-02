import type { InstagramCommentSchema } from '../schema';

// Our schemas use Gemini's dialect (`nullable`, open objects). Anthropic wants
// standard JSON Schema: no `nullable`, objects closed with additionalProperties.
export function toStrictJsonSchema(schema: InstagramCommentSchema): Record<string, unknown> {
  const { nullable, ...rest } = schema as Record<string, unknown> & { nullable?: boolean };
  const out: Record<string, unknown> = { ...rest };

  if (schema.type === 'object' && schema.properties) {
    const props: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(schema.properties)) {
      props[key] = toStrictJsonSchema(value);
    }
    out.properties = props;
    out.additionalProperties = false;
    // strict mode requires every property listed in `required`
    out.required = Object.keys(schema.properties);
  }

  if (schema.type === 'array' && schema.items) {
    out.items = toStrictJsonSchema(schema.items);
  }

  return out;
}

// The response format needs an object at the root. When the schema is an array
// (e.g. a list of comments), wrap it under `items` and hand back an unwrap fn.
export function wrapForResponseFormat(schema: InstagramCommentSchema): {
  schema: Record<string, unknown>;
  unwrap: (parsed: unknown) => unknown;
} {
  const strict = toStrictJsonSchema(schema);
  if (schema.type === 'array') {
    return {
      schema: {
        type: 'object',
        properties: { items: strict },
        required: ['items'],
        additionalProperties: false,
      },
      unwrap: (parsed) => (parsed as { items: unknown }).items,
    };
  }
  return { schema: strict, unwrap: (parsed) => parsed };
}
