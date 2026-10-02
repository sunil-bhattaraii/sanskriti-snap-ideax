/**
 * Zod → OpenAPI schema conversion.
 *
 * The request and query schemas in `src/lib/contracts.ts` are the single source
 * of truth for request shapes. Zod 4 can emit JSON Schema directly, so the spec
 * never keeps a second hand-written copy of those shapes.
 *
 * `io: "input"` is load-bearing: it converts the *input* side of each schema, so
 * fields with a `.default()` become optional (dropped from `required`) rather
 * than being advertised to testers as mandatory. `.strict()` objects emit
 * `additionalProperties: false`; `.refine`/`.superRefine` are silently skipped
 * (they are cross-field rules JSON Schema cannot express — documented in prose on
 * the operations that use them).
 */

import { z } from "zod";

export type JsonSchema = Record<string, unknown>;

export type ParameterObject = {
  name: string;
  in: "query" | "path" | "header";
  required: boolean;
  schema: JsonSchema;
  description?: string;
};

/**
 * Convert a Zod schema to an OpenAPI 3.1-compatible JSON Schema.
 *
 * The emitted root carries a `$schema` key (JSON Schema dialect marker) that is
 * meaningless once inlined into an OpenAPI document, so it is stripped.
 */
export function toOpenApiSchema(schema: z.ZodType): JsonSchema {
  const json = z.toJSONSchema(schema, {
    io: "input",
    unrepresentable: "any",
  }) as JsonSchema;
  delete json.$schema;
  return json;
}

/**
 * Flatten an object schema into a list of query parameters.
 *
 * Each top-level property becomes one `in: "query"` parameter; a property is
 * marked required only when the Zod schema makes it required (coerced defaults
 * are optional, matching `io: "input"`).
 */
export function queryParams(schema: z.ZodType): ParameterObject[] {
  const json = toOpenApiSchema(schema);
  const properties = (json.properties ?? {}) as Record<string, JsonSchema>;
  const required = new Set((json.required as string[] | undefined) ?? []);

  return Object.entries(properties).map(([name, propSchema]) => {
    const { description, ...rest } = propSchema;
    const param: ParameterObject = {
      name,
      in: "query",
      required: required.has(name),
      schema: rest,
    };
    if (typeof description === "string") {
      param.description = description;
    }
    return param;
  });
}
