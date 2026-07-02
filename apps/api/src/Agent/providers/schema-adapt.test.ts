import { toStrictJsonSchema, wrapForResponseFormat } from './schema-adapt';
import { getInstagramCommentSchema } from '../schema';

describe('toStrictJsonSchema', () => {
  it('strips nullable and closes objects with additionalProperties + required', () => {
    const strict = toStrictJsonSchema({
      type: 'object',
      properties: {
        a: { type: 'string', nullable: false },
        b: { type: 'number' },
      },
      required: ['a'],
    }) as any;

    expect(strict.additionalProperties).toBe(false);
    expect(strict.required.sort()).toEqual(['a', 'b']);
    expect('nullable' in strict.properties.a).toBe(false);
  });

  it('recurses into array items', () => {
    const strict = toStrictJsonSchema({
      type: 'array',
      items: { type: 'object', properties: { x: { type: 'string' } } },
    }) as any;
    expect(strict.items.additionalProperties).toBe(false);
  });
});

describe('wrapForResponseFormat', () => {
  it('wraps an array root under `items` and unwraps it back', () => {
    const { schema, unwrap } = wrapForResponseFormat(getInstagramCommentSchema());
    expect((schema as any).type).toBe('object');
    expect((schema as any).properties.items.type).toBe('array');

    const payload = { items: [{ comment: 'hi', viralRate: 5, commentTokenCount: 1 }] };
    expect(unwrap(payload)).toEqual(payload.items);
  });

  it('passes an object root through unchanged', () => {
    const { schema, unwrap } = wrapForResponseFormat({
      type: 'object',
      properties: { x: { type: 'string' } },
    });
    expect((schema as any).type).toBe('object');
    expect(unwrap({ x: 'v' })).toEqual({ x: 'v' });
  });
});
